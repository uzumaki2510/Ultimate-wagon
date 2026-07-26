import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { getDocumentBlob } from "@/lib/documentDb";
import { WagonDocument } from "@/types";

interface DocumentPreviewerProps {
  document: WagonDocument | null;
  onClose: () => void;
}

export function DocumentPreviewer({ document, onClose }: DocumentPreviewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    
    const loadBlob = async () => {
      if (!document) return;
      try {
        const blob = await getDocumentBlob(document.id);
        if (blob) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } else {
          setError("Document file not found in storage.");
        }
      } catch (err) {
        setError("Failed to load document.");
      }
    };
    
    loadBlob();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [document]);

  if (!document) return null;

  const handleDownload = () => {
    if (blobUrl) {
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const isImage = document.fileType.startsWith("image/");
  const isPDF = document.fileType === "application/pdf";

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/10 shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg">{document.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {document.type} • Version {document.version} • Uploaded by {document.uploadedBy} on {new Date(document.uploadedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} disabled={!blobUrl}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-center justify-center">
          {error ? (
            <div className="text-destructive text-center">
              <p className="font-semibold">{error}</p>
              <p className="text-sm mt-2 text-muted-foreground">The file may have been cleared from local storage.</p>
            </div>
          ) : !blobUrl ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : isImage ? (
            <img src={blobUrl} alt={document.name} className="max-w-full max-h-full object-contain rounded-md shadow-sm border" />
          ) : isPDF ? (
            <iframe src={blobUrl} className="w-full h-full rounded-md shadow-sm border" title={document.name} />
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Preview not available for this file type.</p>
              <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Download to View</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
