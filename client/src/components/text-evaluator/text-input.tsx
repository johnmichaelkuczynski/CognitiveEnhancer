import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

interface ProcessedFile {
  filename: string;
  content: string;
  wordCount: number;
  chunks?: any[];
}

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
  wordCount: number;
  charCount: number;
  onFileProcessed: (file: ProcessedFile) => void;
  context: string;
  setContext: (context: string) => void;
}

export default function TextInput({
  text,
  setText,
  wordCount,
  charCount,
  onFileProcessed,
  context,
  setContext
}: TextInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    await processFiles(Array.from(files));
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    setUploading(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const processedFile: ProcessedFile = await response.json();
        onFileProcessed(processedFile);
      }
    } catch (error) {
      console.error('File upload error:', error);
      // Could show toast notification here
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleClear = () => {
    setText("");
    setContext("");
  };

  return (
    <div className="w-1/2 flex flex-col border-r border-border">
      <div className="p-4 border-b border-border bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-foreground" data-testid="text-input-title">
            Text Input
          </h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFileUpload}
              disabled={uploading}
              data-testid="button-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClear}
              data-testid="button-clear"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>
      
      <div 
        className="flex-1 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type, paste, or drag & drop your text/PDF/Word files here..."
          className="w-full h-full resize-none border-0 focus:outline-none text-sm leading-relaxed rounded-none"
          data-testid="textarea-input"
        />
        
        {dragOver && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm text-muted-foreground">Drop your files here</p>
              <p className="text-xs text-muted-foreground mt-1">Supports TXT, DOC, PDF</p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.doc,.docx,.pdf"
          onChange={handleFileChange}
          className="hidden"
          data-testid="file-input"
        />
      </div>
      
      <div className="border-t border-border bg-white p-4">
        <div className="mb-2">
          <label className="text-sm font-medium text-foreground" htmlFor="context-input">
            Context Information (Optional)
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Provide context about the text to help with analysis (e.g., "This is an abstract of a dissertation from 1975" or "This is part of a comedy routine")
          </p>
        </div>
        <Textarea
          id="context-input"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="E.g., 'This is an abstract of a dissertation written 50 years ago' or 'This is part of a journal article' or 'This is part of a comedy routine'..."
          className="w-full h-20 resize-none text-sm"
          data-testid="textarea-context"
        />
      </div>
      
      <div className="p-3 border-t border-border bg-muted/30 text-sm text-muted-foreground">
        <span data-testid="text-word-count">{wordCount} words</span> • <span data-testid="text-char-count">{charCount} characters</span>
      </div>
    </div>
  );
}
