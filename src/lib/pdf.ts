import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UnitMemo, Wagon } from "@/types";

export function generateMemoPdf(memo: UnitMemo, wagonsById: Record<string, Wagon>) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Yellow background
  doc.setFillColor(245, 218, 130);
  doc.rect(0, 0, W, H, "F");

  // Outer border
  doc.setDrawColor(120, 70, 20);
  doc.setLineWidth(0.8);
  doc.rect(6, 6, W - 12, H - 12);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setTextColor(70, 30, 10);
  doc.setFontSize(16);
  doc.text("INDIAN RAILWAYS / भारतीय रेल", W / 2, 14, { align: "center" });
  doc.setFontSize(13);
  doc.text("UNIT MEMO / यूनिट मेमो", W / 2, 21, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const left = 10;
  let y = 30;
  const cell = (label: string, val: string, x: number, w: number) => {
    doc.setFont("helvetica", "bold"); doc.text(label, x, y);
    doc.setFont("helvetica", "normal"); doc.text(String(val ?? ""), x + 28, y);
  };

  cell("Memo No:", memo.memoNo, left, 60); cell("Date:", memo.date, left + 90, 40); cell("Time:", memo.time, left + 150, 40); cell("Line No:", memo.lineNo, left + 210, 40);
  y += 7;
  cell("Rake ID:", memo.rakeId, left, 80); cell("Rake Name:", memo.rakeName, left + 90, 80); cell("Yard:", memo.yard, left + 200, 60);
  y += 7;
  cell("Created By:", memo.createdBy, left, 100);

  // Wagon table
  const head = [["S.No", "Pos", "Wagon No", "Type", "Owner", "Built", "POH Stn", "POH Date", "ROH Stn", "ROH Date", "Return", "Reason", "Booked To", "Defects", "Status"]];
  const body = memo.entries.map((e) => {
    const w = wagonsById[e.wagonId] ?? ({} as Wagon);
    return [e.sno, e.position, w.wagonNo, w.type, w.owner, w.builtYear, w.pohStation, w.pohDate, w.rohStation, w.rohDate, w.returnDate, e.reason, e.bookedTo, e.defects, e.status];
  });

  autoTable(doc, {
    startY: y + 6,
    head, body,
    theme: "grid",
    styles: { fontSize: 8, textColor: [50, 25, 5], lineColor: [100, 60, 20], lineWidth: 0.2, fillColor: [245, 218, 130] },
    headStyles: { fillColor: [230, 195, 100], textColor: [50, 25, 5], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 218, 130] },
    margin: { left: 10, right: 10 },
  });

  let afterY = (doc as any).lastAutoTable.finalY + 6;

  // Remarks
  doc.setFont("helvetica", "bold"); doc.text("Remarks:", 10, afterY);
  doc.setFont("helvetica", "normal");
  const rem = doc.splitTextToSize(memo.remarks || "-", W - 30);
  doc.text(rem, 30, afterY);
  afterY += 6 + rem.length * 4;

  // Signatures
  const sigY = Math.max(afterY + 8, H - 30);
  const colW = (W - 20) / memo.approvals.length;
  memo.approvals.forEach((a, i) => {
    const x = 10 + i * colW;
    doc.setDrawColor(80, 40, 10);
    doc.line(x + 5, sigY, x + colW - 5, sigY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(a.role, x + 5, sigY + 4);
    doc.setFont("helvetica", "normal");
    doc.text(`${a.name || ""} ${a.signature ? `(${a.signature})` : ""}`, x + 5, sigY + 9);
    doc.text(a.designation || "", x + 5, sigY + 13);
    doc.text(a.status, x + 5, sigY + 17);
  });

  doc.save(`UnitMemo-${memo.memoNo}.pdf`);
}
