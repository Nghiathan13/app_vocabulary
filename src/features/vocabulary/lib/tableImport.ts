import { invoke } from "@tauri-apps/api/core";
import * as XLSX from "xlsx";
import {
  WordImportDraft,
  WordWithId,
} from "../../../entities/word/model/types";

export interface ImportPreviewFile {
  id: string;
  path: string;
  name: string;
  isValid: boolean;
  errors: string[];
  newWordCount: number;
  draftWords: WordImportDraft[];
}

interface ColumnIndexMap {
  word?: number;
  ipa?: number;
  type?: number;
  meaning?: number;
}

const getFileName = (path: string) => path.split(/[/\\]/).pop() ?? path;

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeWord = (value: unknown) => normalizeText(value).toLowerCase();

const toOptionalValue = (value: unknown) => {
  const text = normalizeText(value);
  return text ? text : null;
};

const buildColumnIndexMap = (headerRow: unknown[]): ColumnIndexMap => {
  const columnIndexMap: ColumnIndexMap = {};

  headerRow.forEach((cell, index) => {
    const header = normalizeHeader(cell);

    if (header === "word" && columnIndexMap.word === undefined) {
      columnIndexMap.word = index;
    }

    if (header === "ipa" && columnIndexMap.ipa === undefined) {
      columnIndexMap.ipa = index;
    }

    if (header === "type" && columnIndexMap.type === undefined) {
      columnIndexMap.type = index;
    }

    if (header === "meaning" && columnIndexMap.meaning === undefined) {
      columnIndexMap.meaning = index;
    }
  });

  return columnIndexMap;
};

const createInvalidPreview = (
  path: string,
  errors: string[],
): ImportPreviewFile => ({
  id: path,
  path,
  name: getFileName(path),
  isValid: false,
  errors,
  newWordCount: 0,
  draftWords: [],
});

const createValidPreview = (
  path: string,
  draftWords: WordImportDraft[],
): ImportPreviewFile => ({
  id: path,
  path,
  name: getFileName(path),
  isValid: true,
  errors: [],
  newWordCount: draftWords.length,
  draftWords,
});

const readWorkbookBytes = async (path: string) => {
  const bytes = await invoke<number[]>("read_binary_file", { path });
  return Uint8Array.from(bytes);
};

const buildSinglePreview = async (
  path: string,
  claimedWords: Set<string>,
): Promise<ImportPreviewFile> => {
  const fileName = getFileName(path);

  if (!fileName.toLowerCase().endsWith(".xlsx")) {
    return createInvalidPreview(path, ["File must use the .xlsx extension."]);
  }

  try {
    const workbookBytes = await readWorkbookBytes(path);
    const workbook = XLSX.read(workbookBytes, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return createInvalidPreview(path, [
        "Workbook does not contain any worksheet.",
      ]);
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
    });

    const [headerRow = [], ...dataRows] = rawRows;
    const columnIndexMap = buildColumnIndexMap(headerRow);

    if (columnIndexMap.word === undefined) {
      return createInvalidPreview(path, [
        "Workbook must contain a Word column.",
      ]);
    }

    const fileWords = new Set<string>();
    const draftWords: WordImportDraft[] = [];

    for (const row of dataRows) {
      const normalizedWord = normalizeWord(row[columnIndexMap.word]);

      if (!normalizedWord) {
        continue;
      }

      if (claimedWords.has(normalizedWord) || fileWords.has(normalizedWord)) {
        continue;
      }

      fileWords.add(normalizedWord);
      claimedWords.add(normalizedWord);

      draftWords.push({
        word: normalizedWord,
        ipa:
          columnIndexMap.ipa === undefined
            ? null
            : toOptionalValue(row[columnIndexMap.ipa]),
        type:
          columnIndexMap.type === undefined
            ? null
            : (toOptionalValue(row[columnIndexMap.type])?.toLowerCase() ??
              null),
        meaning:
          columnIndexMap.meaning === undefined
            ? null
            : toOptionalValue(row[columnIndexMap.meaning]),
      });
    }

    return createValidPreview(path, draftWords);
  } catch {
    return createInvalidPreview(path, ["Failed to read the workbook."]);
  }
};

export const buildImportPreviewFiles = async (
  paths: string[],
  existingWords: WordWithId[],
) => {
  const existingWordSet = new Set(
    existingWords.map((word) => word.word.trim().toLowerCase()),
  );

  const claimedWords = new Set(existingWordSet);
  const previewFiles: ImportPreviewFile[] = [];

  for (const path of paths) {
    const preview = await buildSinglePreview(path, claimedWords);
    previewFiles.push(preview);
  }

  return previewFiles;
};
