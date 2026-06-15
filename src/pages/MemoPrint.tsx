import { Link, useParams } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import { generateMemoPdf } from "@/lib/pdf";

export default function MemoPrint() {
  const { id } = useParams();
  const memo = useAppStore((s) => s.memos.find((m) => m.id === id));
  const wagons = useAppStore((s) => s.wagons);
  if (!memo) return <div>Memo not found. <Link to="/memos" className="underline">Back</Link></div>;
  const byId = Object.fromEntries(wagons.map((w) => [w.id, w]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" asChild><Link to={`/memos/${memo.id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateMemoPdf(memo, byId)}><FileDown className="h-4 w-4 mr-1" /> Download PDF</Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
        </div>
      </div>

      <style>
        {`@media print { @page { size: landscape; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}
      </style>

      <div className="memo-paper mx-auto p-6 max-w-[1100px] bg-[#fffdf0] border border-[#f0e68c] shadow-sm print:shadow-none">
        <div className="text-center border-b-2 border-rail-ink pb-3 mb-3">
          <div className="text-[11px] tracking-widest">भारत सरकार · GOVERNMENT OF INDIA</div>
          <h1 className="text-2xl font-bold">INDIAN RAILWAYS · भारतीय रेल</h1>
          <h2 className="text-lg font-semibold tracking-wide">UNIT MEMO · यूनिट मेमो</h2>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[12px] mb-3">
          <div><b>Memo No:</b> <span className="font-mono">{memo.memoNo}</span></div>
          <div><b>Date:</b> {memo.date}</div>
          <div><b>Time:</b> {memo.time}</div>
          <div><b>Line No:</b> {memo.lineNo}</div>
          <div className="col-span-2"><b>Rake ID:</b> {memo.rakeId}</div>
          <div className="col-span-2"><b>Rake Name:</b> {memo.rakeName}</div>
          <div className="col-span-2"><b>Yard / Station:</b> {memo.yard}</div>
          <div className="col-span-2"><b>Created By:</b> {memo.createdBy}</div>
        </div>

        <table>
          <thead>
            <tr>
              {["S.No","Pos","Wagon No","Type","Owner","Built","POH Stn","POH Date","ROH Stn","ROH Date","Return","Reason","Booked To","Defects","Status"].map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {memo.entries.map((e) => {
              const w = byId[e.wagonId] ?? ({} as any);
              return (
                <tr key={e.id}>
                  <td>{e.sno}</td><td>{e.position}</td><td className="font-mono">{w.wagonNo}</td><td>{w.type}</td><td>{w.owner}</td><td>{w.builtYear}</td>
                  <td>{w.pohStation}</td><td>{w.pohDate}</td><td>{w.rohStation}</td><td>{w.rohDate}</td><td>{w.returnDate}</td>
                  <td>{e.reason}</td><td>{e.bookedTo}</td><td>{e.defects}</td><td>{e.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 text-[12px]"><b>Remarks:</b> {memo.remarks || "—"}</div>

        <div className="grid grid-cols-4 gap-3 mt-10 text-[11px]">
          {memo.approvals.map((a) => (
            <div key={a.role} className="border-t border-rail-ink pt-2">
              <div className="font-bold">{a.role}</div>
              <div>{a.name} {a.signature && <span className="italic">({a.signature})</span>}</div>
              <div>{a.designation}</div>
              <div className="text-[10px]">{a.approvedAt ? new Date(a.approvedAt).toLocaleString() : "—"}</div>
              <div className="font-semibold uppercase">{a.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
