import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");
const DEFAULT_COUNTS = [1000, 5000, 10000];
const TYPES = ["noun", "verb", "adjective", "adverb"];
const IPA_SAMPLES = ["/bɛntʃ/", "/wɜːd/", "/tɛst/", "/sæmpəl/"];

const parseCounts = (args) => {
  if (args.length === 0) {
    return DEFAULT_COUNTS;
  }

  const counts = args.map((value) => {
    const count = Number.parseInt(value, 10);
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error(`Invalid count: ${value}`);
    }
    return count;
  });

  return counts;
};

const buildRows = (count) => {
  const rows = [];

  for (let index = 1; index <= count; index += 1) {
    const word = `bench-${String(index).padStart(6, "0")}`;
    rows.push({
      Word: word,
      IPA: IPA_SAMPLES[index % IPA_SAMPLES.length],
      Type: TYPES[index % TYPES.length],
      Meaning: `benchmark meaning ${String(index).padStart(6, "0")}`,
    });
  }

  return rows;
};

const writeWorkbook = (count) => {
  const rows = buildRows(count);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Words");

  const outputPath = join(OUTPUT_DIR, `bench-${count}.xlsx`);
  writeFileSync(outputPath, XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));

  return { outputPath, rowCount: rows.length };
};

const counts = parseCounts(process.argv.slice(2));

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const count of counts) {
  const { outputPath, rowCount } = writeWorkbook(count);
  console.log(`Wrote ${rowCount} rows to ${outputPath}`);
}
