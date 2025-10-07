import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, File as FileIcon, CheckCircle2, Loader2, X } from "lucide-react"; // Renamed File to FileIcon
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  rawFile: File; // Store the original file object
  name: string;
  size: number;
  type: string;
  status: "queued" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  chunks?: number;
  error?: string;
}

export const DocumentUploader = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // --- Real API Upload Function ---
  const handleFileUpload = async (fileId: string, file: File) => {
    // 1. Set status to uploading
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading', progress: 50 } : f));

    const formData = new FormData();
    formData.append("files", file);

    try {
        const response = await fetch('http://localhost:8000/api/upload-documents', {
            method: 'POST',
            body: formData,
        });

        // 2. Set status to processing after upload completes
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing', progress: 100 } : f));

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "File processing failed.");
        }

        const result = data.results[0]; // We are uploading one file, so we get one result
        if (result.error) {
            throw new Error(result.error);
        }

        // 3. Set status to completed on success
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'completed' } : f));

    } catch (error: any) {
        // 4. Set status to error on failure
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', error: error.message } : f));
        toast({
            title: `Error uploading ${file.name}`,
            description: error.message,
            variant: "destructive",
        });
    }
  };
  
  const processFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      rawFile: file,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      status: "queued",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Start the upload for each new file
    newFiles.forEach((file) => {
      handleFileUpload(file.id, file.rawFile);
    });

    toast({
      title: "Files Queued",
      description: `${newFiles.length} file(s) added to the upload queue.`,
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files for intelligent processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Drag and drop files here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse from your computer
            </p>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                />
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Queue</CardTitle>
            <CardDescription>
              {files.filter((f) => f.status === "completed").length} of {files.length} processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.status === "uploading" && (
                        <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading</Badge>
                      )}
                      {file.status === "processing" && (
                        <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>
                      )}
                      {file.status === "completed" && (
                         <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
                      )}
                      {file.status === "error" && (
                         <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Error</Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {(file.status === "uploading" || file.status === "processing") && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                   {file.status === "error" && (
                    <p className="text-xs text-destructive">{file.error}</p>
                   )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};