// Export-only workbook adapter. User strings are written as text, never formulas.
type Sheet = { rows: unknown[][]; '!cols'?: { wch: number }[] };
type Workbook = { sheets: { name: string; sheet: Sheet }[] };
export const utils = {
  book_new: (): Workbook => ({ sheets: [] }),
  json_to_sheet: (data: Record<string, unknown>[]): Sheet => {
    const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
    return { rows: [headers, ...data.map(row => headers.map(key => row[key] ?? ''))] };
  },
  aoa_to_sheet: (rows: unknown[][]): Sheet => ({ rows }),
  book_append_sheet: (workbook: Workbook, sheet: Sheet, name: string) => { workbook.sheets.push({ name, sheet }); },
};
export async function writeFile(workbook: Workbook, filename: string) {
  const { default: ExcelJS } = await import('exceljs');
  const output = new ExcelJS.Workbook();
  for (const { name, sheet } of workbook.sheets) {
    const page = output.addWorksheet(name);
    sheet.rows.forEach(row => page.addRow(row.map(value => typeof value === 'number' || typeof value === 'boolean' ? value : String(value ?? ''))));
    sheet['!cols']?.forEach((column, index) => { page.getColumn(index + 1).width = column.wch; });
  }
  const data = await output.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
