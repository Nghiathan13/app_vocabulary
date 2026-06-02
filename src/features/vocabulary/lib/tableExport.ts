import { invoke } from "@tauri-apps/api/core";
import * as XLSX from "xlsx";

import type { WordWithId } from "../../../entities/word/model/types";

export function toExportRows(
  words: WordWithId[],
): Array<Record<string, string | number>> {
  return words.map((word) => ({
    Word: word.word,
    IPA: word.ipa ?? "",
    Type: word.type ?? "",
    "Meaning VI": word.meaning_vi,
    Level: word.level,
    "Wrong Count": word.wrong_count,
    Definition: word.definition ?? "",
    Example: word.example ?? "",
    Band: word.band ?? "",
    "Last Review": word.last_review ?? "",
    "Next Review": word.next_review ?? "",
  }));
}

export async function exportWordsToXlsx({
  path,
  words,
}: {
  path: string;
  words: WordWithId[];
}): Promise<void> {
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(words));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Words");

  const workbookBytes = new Uint8Array(
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    }),
  );

  await invoke("write_binary_file", {
    path,
    bytes: Array.from(workbookBytes),
  });
}
