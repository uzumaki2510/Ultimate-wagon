import { useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { saveDocumentBlob, deleteDocumentBlob } from "@/lib/documentDb";
import { WagonDocument, DocumentType } from "@/types";
import { DocumentPreviewer } from "./DocumentPreviewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

export function DocumentManager({ wagonId }: { wagonId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addDocumentMeta, removeDocumentMeta, getWagonDocuments } = useAppStore();
  
  const documents = getWagonDocuments(wagonId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<WagonDocument | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const id = nanoid();
      
      // Save blob to IndexedDB
      await saveDocumentBlob(id, file);
      
      // Save metadata to Store
      addDocumentMeta({
        id,
        wagonId,
        type: selectedType as DocumentType,
        name: file.name,
        fileType: file.type,
        size: file.size,
        uploadedBy: user?.name || "System",
        uploadedAt: new Date().toISOString(),
        version: 1 // Actual version handled in store logic
      });

      toast({ title: "Success", description: "Document uploaded successfully." });
      setSelectedType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast({ title: "Upload Failed", description: "Could not save document.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: WagonDocument) => {
    if (!confirm(`Are you sure you want to delete ${doc.name}?`)) return;
    try {
      await deleteDocumentBlob(doc.id);
      removeDocumentMeta(doc.id);
      toast({ title: "Deleted", description: "Document removed successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const certificates = documents.filter(d => !d.type.includes("Image"));
  const gallery = documents.filter(d => d.type.includes("Image"));

  return (
    <div className="space-y-6">
      
      <Card className="shadow-sm border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 border-b border-primary/10">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <UploadCloud className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>Upload certificates or images related to this wagon.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select value={selectedType} onValueChange={(val) => setSelectedType(val as DocumentType)}>
              <SelectTrigger className="w-full sm:w-[250px] bg-background">
                <SelectValue placeholder="Select Document Type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inspection Report">Inspection Report</SelectItem>
                <SelectItem value="Gas Free Certificate">Gas Free Certificate</SelectItem>
                <SelectItem value="Fit Certificate">Fit Certificate</SelectItem>
                <SelectItem value="Repair Document">Repair Document</SelectItem>
                <SelectItem value="Wagon Image">Wagon Image</SelectItem>
                <SelectItem value="Damage Image">Damage Image</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 w-full">
              <Input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={!selectedType || isUploading}
                className="bg-background cursor-pointer"
                accept=".pdf,image/png,image/jpeg"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Accepted formats: PDF, PNG, JPG (Max 5MB).</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificates & Reports */}
        <Card className="shadow-sm border-border/50 h-full">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Certificates & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No certificates uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {certificates.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-blue-500/10 rounded">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {doc.type} v{doc.version} • {formatSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Gallery */}
        <Card className="shadow-sm border-border/50 h-full">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Image Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {gallery.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No images uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {gallery.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-emerald-500/10 rounded">
                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {doc.type} v{doc.version} • {formatSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DocumentPreviewer document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
