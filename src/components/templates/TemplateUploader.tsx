
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TemplateUploaderProps {
  onSuccess: () => void;
  variant?: "default" | "outline";
  label?: string;
}

const TemplateUploader = ({ 
  onSuccess, 
  variant = "default", 
  label = "Upload Template" 
}: TemplateUploaderProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is a word document or text file
      if (
        selectedFile.type === "application/msword" || 
        selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "text/plain" ||
        selectedFile.type === "application/pdf"
      ) {
        setFile(selectedFile);
        setError("");
        
        // Set default template name from filename
        if (!templateName) {
          const fileName = selectedFile.name.split('.')[0];
          setTemplateName(fileName);
        }
      } else {
        setFile(null);
        setError("Please upload a Word document (.doc, .docx), PDF, or text file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !templateName) {
      setError("Please select a file and provide a template name");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 1. Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from("templates")
        .upload(fileName, file);
        
      if (fileError) throw fileError;
      
      // 2. Read file content
      let content = "";
      
      if (file.type === "text/plain") {
        content = await file.text();
      } else {
        // For non-text files, we'll just store metadata and handle display separately
        content = `File uploaded: ${file.name}`;
      }
      
      // 3. Create template record
      const { data: templateData, error: templateError } = await supabase
        .from("templates")
        .insert([{
          name: templateName,
          content: content,
          placeholders: [],
          file_path: fileName
        }])
        .select();
        
      if (templateError) throw templateError;
      
      toast({
        title: "Template uploaded",
        description: "Your template has been uploaded successfully."
      });
      
      setOpen(false);
      setFile(null);
      setTemplateName("");
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred while uploading the template",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Upload className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-file">Template File</Label>
            <div 
              className={cn(
                "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors",
                error ? "border-destructive" : "border-muted"
              )}
              onClick={() => document.getElementById("template-file")?.click()}
            >
              <Input
                id="template-file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".doc,.docx,.pdf,.txt"
              />
              <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Click to upload a file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Word documents (.doc, .docx), PDF, or text files
                  </p>
                </>
              )}
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !file || !templateName}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Template"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateUploader;
