import * as XLSX from "xlsx";

export async function parseSourceFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv" || mimeType === "text/csv") {
    return buffer.toString("utf-8");
  }

  if (
    ext === "xlsx" ||
    ext === "xls" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`Sheet: ${sheetName}\n${csv}`);
    }
    return sheets.join("\n\n");
  }

  if (ext === "pdf" || mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text;
  }

  return buffer.toString("utf-8");
}
