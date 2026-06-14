import * as XLSX from "xlsx";
import { UnitMemo, Wagon } from "@/types";

function rows(memos: UnitMemo[], wagonsById: Record<string, Wagon>) {
  const out: any[] = [];
  memos.forEach((m) => m.entries.forEach((e) => {
    const w = wagonsById[e.wagonId] ?? ({} as Wagon);
    out.push({
      MemoNo: m.memoNo, Date: m.date, Time: m.time, RakeID: m.rakeId, RakeName: m.rakeName,
      Yard: m.yard, LineNo: m.lineNo, CreatedBy: m.createdBy,
      SNo: e.sno, Position: e.position, WagonNo: w.wagonNo, Type: w.type, Owner: w.owner, Built: w.builtYear,
      POHStation: w.pohStation, POHDate: w.pohDate, ROHStation: w.rohStation, ROHDate: w.rohDate, ReturnDate: w.returnDate,
      Reason: e.reason, BookedTo: e.bookedTo, Defects: e.defects, Status: e.status,
    });
  }));
  return out;
}

export function exportExcel(memos: UnitMemo[], wagonsById: Record<string, Wagon>, name = "memos") {
  const data = rows(memos, wagonsById);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Memos");
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportCsv(memos: UnitMemo[], wagonsById: Record<string, Wagon>, name = "memos") {
  const data = rows(memos, wagonsById);
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  const csv = [cols.join(","), ...data.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.csv`;
  a.click();
}
