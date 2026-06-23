import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, File as FilePdf, Printer, Mail } from "lucide-react";
import { reportApi } from "@/api/reports";
import { useToast } from "@/hooks/use-toast";

export default function ReportGenerator() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("wagons");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    wagonNumber: "",
    department: "",
    status: ""
  });
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleExport = async (format: "pdf" | "excel") => {
    setLoading(true);
    try {
      let blob;
      if (format === "pdf") {
        blob = await reportApi.exportPDF(reportType, filters);
      } else {
        blob = await reportApi.exportExcel(reportType, filters);
      }

      // Create a link to download the blob
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `wagon-whisper-${reportType}-report.${format === "pdf" ? "pdf" : "xlsx"}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the report.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    toast({ title: "Print Setup", description: "Please export as PDF and print directly from your browser." });
  };

  const handleEmail = () => {
    toast({ title: "Email Not Configured", description: "SMTP settings have not been configured for automated dispatch." });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Generator</h1>
        <p className="text-sm text-muted-foreground">Select report type and apply filters before exporting.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Set the parameters for your custom report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wagons">Wagon Register</SelectItem>
                <SelectItem value="repairs">Repair History</SelectItem>
                <SelectItem value="employees">Employee Directory</SelectItem>
                <SelectItem value="audit-logs">Audit Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
            </div>
            <div className="space-y-2">
              <Label>Wagon Number (Optional)</Label>
              <Input placeholder="Search by number..." name="wagonNumber" value={filters.wagonNumber} onChange={handleFilterChange} />
            </div>
            <div className="space-y-2">
              <Label>Status Filter (Optional)</Label>
              <Input placeholder="e.g. pending, completed" name="status" value={filters.status} onChange={handleFilterChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 justify-between">
            <div className="flex gap-4">
              <Button onClick={() => handleExport("pdf")} disabled={loading} className="bg-red-600 hover:bg-red-700">
                <FilePdf className="mr-2 h-4 w-4" /> {loading ? "Generating..." : "Export PDF"}
              </Button>
              <Button onClick={() => handleExport("excel")} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> {loading ? "Generating..." : "Export Excel"}
              </Button>
            </div>
            <div className="flex gap-4">
               <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button onClick={handleEmail} variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Email Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
