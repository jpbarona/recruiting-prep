import Papa from "papaparse";
import type { CsvFile } from "./constants";

export interface ParseCsvResult<T extends Record<string, string>> {
  rows: T[];
  warnings: string[];
}

export async function fetchCsv(name: CsvFile): Promise<string> {
  const res = await fetch(`/api/csv/${name}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail ? `Failed to load ${name}.csv: ${detail}` : `Failed to load ${name}.csv`
    );
  }
  return res.text();
}

export async function saveCsv(name: CsvFile, content: string): Promise<void> {
  const res = await fetch(`/api/csv/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "text/csv" },
    body: content,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail ? `Failed to save ${name}.csv: ${detail}` : `Failed to save ${name}.csv`
    );
  }
}

export function parseCsv<T extends Record<string, string>>(
  text: string,
  fileLabel: string
): ParseCsvResult<T> {
  const warnings: string[] = [];
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
  });

  for (const err of result.errors) {
    warnings.push(`${fileLabel}: row ${err.row ?? "?"} — ${err.message}`);
  }

  const rows = result.data.filter((row, index) => {
    const values = Object.values(row);
    const hasContent = values.some((v) => String(v ?? "").trim() !== "");
    if (!hasContent) return false;
    const hasDateField = "date" in row;
    if (hasDateField && !String(row.date ?? "").trim()) {
      warnings.push(`${fileLabel}: skipped row ${index + 2} (missing date)`);
      return false;
    }
    return true;
  });

  return { rows, warnings };
}

export function serializeCsv<T extends object>(
  rows: T[],
  columns: (keyof T)[]
): string {
  const data = rows.map((row) => {
    const record = row as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const col of columns) {
      out[String(col)] = String(record[String(col)] ?? "");
    }
    return out;
  });
  return Papa.unparse(data);
}
