import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, File as FilePdf, Printer, FileText, Search, Save, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ReportGenerator() {
  const { toast } = useToast();
  const { wagons, workflows, employees, audit, masterData } = useAppStore();
  
  const [reportType, setReportType] = useState("daily-workshop");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fromDate: "", toDate: "", workshop: "All", department: "All",
    wagonType: "All", zone: "All", shift: "All", employee: "All", status: "All"
  });

  const savedTemplates = useMemo(() => {
    try {
      const stored = localStorage.getItem("uww_report_templates");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTemplate = () => {
    const name = prompt("Enter a name for this report template:");
    if (!name) return;
    const newTemplates = [...savedTemplates, { name, reportType, filters }];
    localStorage.setItem("uww_report_templates", JSON.stringify(newTemplates));
    toast({ title: "Template Saved", description: `Saved as "${name}"` });
    // Force a re-render to show the new template in the list would require state, 
    // but since we navigate/refresh often, this is acceptable for now. Or we can add state.
    window.location.reload(); 
  };

  const loadTemplate = (idx: number) => {
    const t = savedTemplates[idx];
    if (t) {
      setReportType(t.reportType);
      setFilters(t.filters);
      toast({ title: "Template Loaded", description: `Loaded "${t.name}"` });
    }
  };

  const getReportData = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let title = "Report";

    const from = filters.fromDate ? new Date(filters.fromDate) : new Date(0);
    const to = filters.toDate ? new Date(filters.toDate) : new Date();
    to.setHours(23, 59, 59, 999);

    const isInRange = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= from && d <= to;
    };

    const isShiftMatch = (dateStr?: string) => {
      if (filters.shift === "All" || !dateStr) return true;
      const hour = new Date(dateStr).getHours();
      if (filters.shift === "Morning") return hour >= 6 && hour < 14;
      if (filters.shift === "Evening") return hour >= 14 && hour < 22;
      if (filters.shift === "Night") return hour >= 22 || hour < 6;
      return true;
    };

    const passesGlobalFilters = (wagonNo: string, wagonType: string, wagonStatus: string, wagonOwner: string) => {
      if (filters.wagonType !== "All" && wagonType !== filters.wagonType) return false;
      if (filters.zone !== "All" && wagonOwner !== filters.zone) return false;
      if (filters.status !== "All" && wagonStatus !== filters.status) return false;
      return true;
    };

    switch (reportType) {
      case "daily-workshop":
        title = "Advanced Workshop Report";
        headers = ["Wagon No", "Type", "Zone", "Current Status", "Last Action"];
        wagons.forEach(w => {
          if (!passesGlobalFilters(w.wagonNo, w.type, w.status, w.owner || "")) return;
          const wf = workflows.find(wf => wf.wagonId === w.id);
          // For daily, if date filter is set, check if updated recently
          if ((filters.fromDate || filters.toDate) && !isInRange(wf?.updatedAt)) return;
          rows.push([w.wagonNo, w.type, w.owner || "-", w.status, wf?.currentStage || "Pending"]);
        });
        break;

      case "steam":
      case "degassing":
      case "inspection":
      case "repair":
        title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        headers = ["Wagon No", "Type", "Started", "Completed", "Duration (hrs)", "Staff"];
        workflows.forEach(wf => {
          const w = wagons.find(wag => wag.id === wf.wagonId);
          if (w && !passesGlobalFilters(w.wagonNo, w.type, w.status, w.owner || "")) return;
          
          const relevantStages = wf.stages.filter(st => {
            const isTypeMatch = reportType === "steam" ? st.stageName.includes("Steam") :
                                reportType === "degassing" ? st.stageName.includes("Degass") :
                                reportType === "inspection" ? st.stageName.includes("Inspection") :
                                st.stageName.includes("Repair");
            
            const isEmpMatch = filters.employee === "All" || st.staffName === filters.employee;
            
            return isTypeMatch && st.status === "Done" && isInRange(st.completedAt) && isShiftMatch(st.completedAt) && isEmpMatch;
          });

          relevantStages.forEach(st => {
            rows.push([wf.wagonNo, wf.wagonType, new Date(st.startedAt!).toLocaleString(), new Date(st.completedAt!).toLocaleString(), st.durationHours?.toFixed(1) || "0", st.staffName || "-"]);
          });
        });
        break;

      case "released":
        title = "Released Wagon Report";
        headers = ["Wagon No", "Type", "Zone", "Released Date", "Inspector"];
        wagons.filter(w => ["RELEASED", "FIT_READY"].includes(w.status)).forEach(w => {
          if (!passesGlobalFilters(w.wagonNo, w.type, w.status, w.owner || "")) return;
          const wf = workflows.find(wf => wf.wagonId === w.id);
          const finalStage = wf?.stages.find(st => st.stageName.includes("Final") && st.status === "Done");
          
          if (finalStage && isInRange(finalStage.completedAt) && isShiftMatch(finalStage.completedAt)) {
             if (filters.employee !== "All" && finalStage.inspectorName !== filters.employee) return;
             rows.push([w.wagonNo, w.type, w.owner || "-", new Date(finalStage.completedAt!).toLocaleString(), finalStage.inspectorName || "-"]);
          }
        });
        break;

      case "employee-performance":
        title = "Employee Productivity Report";
        headers = ["Employee Name", "Role", "Tasks Completed", "Avg Task Time (hrs)"];
        const empStats: Record<string, { count: number, totalHrs: number, role: string }> = {};
        employees.forEach(emp => empStats[emp.name] = { count: 0, totalHrs: 0, role: emp.role });
        
        workflows.forEach(wf => {
          wf.stages.forEach(st => {
            if (st.status === "Done" && st.staffName && empStats[st.staffName] && isInRange(st.completedAt) && isShiftMatch(st.completedAt)) {
              if (filters.employee !== "All" && st.staffName !== filters.employee) return;
              empStats[st.staffName].count++;
              empStats[st.staffName].totalHrs += st.durationHours || 0;
            }
          });
        });

        Object.entries(empStats).filter(([_, data]) => data.count > 0).forEach(([name, data]) => {
          rows.push([name, data.role, data.count, (data.totalHrs / data.count).toFixed(1)]);
        });
        break;
    }

    // Apply Global Search across all generated rows
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => r.some(cell => String(cell).toLowerCase().includes(q)));
    }

    return { title, headers, rows };
  };

  const { title, headers, rows } = getReportData();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Ultimate Wagon Whisperer", 14, 22);
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text(title, 14, 30);
      doc.setFontSize(10);
      if (filters.fromDate || filters.toDate) {
        doc.text(`Period: ${filters.fromDate || 'Start'} to ${filters.toDate || 'Present'}`, 14, 36);
      }
      autoTable(doc, {
        startY: filters.fromDate || filters.toDate ? 42 : 36,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
      doc.save(`UWW_${reportType}_${new Date().getTime()}.pdf`);
      toast({ title: "Success", description: "PDF generated." });
    } catch (e) { toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" }); }
  };

  const handleExportExcel = () => {
    try {
      const ws = XLSX.utils.aoa_to_sheet([[title], [], headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `UWW_${reportType}_${new Date().getTime()}.xlsx`);
      toast({ title: "Success", description: "Excel file generated." });
    } catch (e) { toast({ title: "Error", description: "Failed to generate Excel.", variant: "destructive" }); }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `UWW_${reportType}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Success", description: "CSV generated." });
    } catch (e) { toast({ title: "Error", description: "Failed to generate CSV.", variant: "destructive" }); }
  };

  const handlePrint = () => {
    let printContents = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1 style="color: #1e3a8a;">Ultimate Wagon Whisperer</h1>
        <h2>${title}</h2>
        ${filters.fromDate || filters.toDate ? `<p>Period: ${filters.fromDate || 'Start'} to ${filters.toDate || 'Present'}</p>` : ''}
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr>${headers.map(h => `<th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f3f4f6;">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td style="border: 1px solid #ddd; padding: 8px;">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const SelectFilter = ({ label, valueKey, options }: { label: string, valueKey: keyof typeof filters, options: string[] }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={filters[valueKey]} onValueChange={(v) => handleFilterChange(valueKey, v)}>
        <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All {label}s</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto mt-2">
      <PageHeader 
        title="Advanced Report Generator" 
        description="Build highly customized enterprise reports with dynamic filtering and templates."
        icon={FileText}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Saved Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {savedTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates saved.</p>
              ) : (
                savedTemplates.map((t: any, i: number) => (
                  <Button key={i} variant="outline" className="w-full justify-start text-xs" onClick={() => loadTemplate(i)}>
                    <History className="mr-2 h-3 w-3" /> {t.name}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
             <CardHeader className="pb-4">
               <CardTitle className="text-lg">Export Actions</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               <Button onClick={handleExportPDF} className="w-full bg-red-600 hover:bg-red-700 shadow-sm justify-start">
                 <FilePdf className="mr-2 h-4 w-4" /> Export to PDF
               </Button>
               <Button onClick={handleExportExcel} className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm justify-start">
                 <Download className="mr-2 h-4 w-4" /> Export to Excel
               </Button>
               <Button onClick={handleExportCSV} className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm justify-start">
                 <FileText className="mr-2 h-4 w-4" /> Export to CSV
               </Button>
               <Button onClick={handlePrint} variant="outline" className="w-full shadow-sm justify-start">
                 <Printer className="mr-2 h-4 w-4" /> Print Report
               </Button>
               <Button onClick={handleSaveTemplate} variant="secondary" className="w-full mt-4 justify-start">
                 <Save className="mr-2 h-4 w-4" /> Save as Template
               </Button>
             </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b">
              <CardTitle>Filters & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-primary font-semibold">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="border-primary/50 bg-primary/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily-workshop">Workshop Status Report</SelectItem>
                      <SelectItem value="steam">Steam Department</SelectItem>
                      <SelectItem value="degassing">Degassing Department</SelectItem>
                      <SelectItem value="inspection">Inspection Department</SelectItem>
                      <SelectItem value="repair">Repair Department</SelectItem>
                      <SelectItem value="released">Released Wagons</SelectItem>
                      <SelectItem value="employee-performance">Employee Productivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range (From)</Label>
                  <Input type="date" value={filters.fromDate} onChange={e => handleFilterChange("fromDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date Range (To)</Label>
                  <Input type="date" value={filters.toDate} onChange={e => handleFilterChange("toDate", e.target.value)} />
                </div>
                
                <SelectFilter label="Wagon Type" valueKey="wagonType" options={masterData.filter(d => d.category === "WAGON_TYPE").map(d => d.value)} />
                <SelectFilter label="Railway Zone" valueKey="zone" options={masterData.filter(d => d.category === "ZONE").map(d => d.value)} />
                <SelectFilter label="Shift" valueKey="shift" options={["Morning", "Evening", "Night"]} />
                <SelectFilter label="Employee" valueKey="employee" options={employees.map(e => e.name)} />
                <SelectFilter label="Status" valueKey="status" options={["ARRIVED", "SICK_LINE", "REPAIR_IN_PROGRESS", "FIT_READY", "RELEASED"]} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Found {rows.length} records matching your filters.</CardDescription>
              </div>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search within report..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {headers.map(h => <th key={h} className="p-3 font-medium whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.length === 0 ? (
                    <tr><td colSpan={headers.length} className="p-8 text-center text-muted-foreground">No data matches the selected filters.</td></tr>
                  ) : (
                    rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {r.map((c: any, ci: number) => <td key={ci} className="p-3 whitespace-nowrap">{c}</td>)}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {rows.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20">
                  Showing first 100 of {rows.length} records. Export to view all.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
