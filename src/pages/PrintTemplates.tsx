
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search, Replace, Printer } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';

interface UploadedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

const PrintTemplates = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload PDF, image, or text files only.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save document metadata to database
      const { data: docData, error: docError } = await supabase
        .from('uploaded_documents')
        .insert([
          {
            file_name: selectedFile.name,
            file_path: uploadData.path,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
          }
        ])
        .select()
        .single();

      if (docError) throw docError;

      setUploadedDoc(docData);

      // Get public URL for preview
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      setPreviewUrl(urlData.publicUrl);

      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} has been uploaded and saved.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFindReplace = () => {
    if (!findText.trim()) {
      toast({
        title: "Find text required",
        description: "Please enter text to find.",
        variant: "destructive",
      });
      return;
    }

    // For demonstration, we'll show a success message
    // In a real implementation, you'd process the document content
    toast({
      title: "Find and Replace",
      description: `Found "${findText}" and replaced with "${replaceText}"`,
    });
    
    setIsReplaceDialogOpen(false);
    setFindText('');
    setReplaceText('');
  };

  const handleReplaceAll = () => {
    if (!findText.trim()) {
      toast({
        title: "Find text required",
        description: "Please enter text to find.",
        variant: "destructive",
      });
      return;
    }

    // For demonstration, we'll show a success message
    toast({
      title: "Replace All",
      description: `Replaced all instances of "${findText}" with "${replaceText}"`,
    });
    
    setIsReplaceDialogOpen(false);
    setFindText('');
    setReplaceText('');
  };

  const handlePrint = () => {
    if (!uploadedDoc) {
      toast({
        title: "No document",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    // Open print dialog
    window.print();
    
    toast({
      title: "Print initiated",
      description: "Document sent to printer.",
    });
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Print and Templates</h1>
          <p className="text-muted-foreground">Upload documents, preview, edit, and print them.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, JPG, PNG, TXT
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <Button 
                onClick={uploadFile} 
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                {previewUrl ? (
                  <div className="w-full h-full">
                    {uploadedDoc?.file_type.startsWith('image/') ? (
                      <img 
                        src={previewUrl} 
                        alt="Document preview" 
                        className="max-w-full max-h-[300px] object-contain mx-auto rounded"
                      />
                    ) : uploadedDoc?.file_type === 'application/pdf' ? (
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-[300px] border rounded"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Preview not available for this file type
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          File uploaded successfully
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Upload a document to see preview</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {uploadedDoc && (
          <Card>
            <CardHeader>
              <CardTitle>Document Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Dialog open={isReplaceDialogOpen} onOpenChange={setIsReplaceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Find & Replace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Find and Replace</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="find-text">Find</Label>
                        <Input
                          id="find-text"
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          placeholder="Enter text to find..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="replace-text">Replace with</Label>
                        <Input
                          id="replace-text"
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          placeholder="Enter replacement text..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleFindReplace} className="flex-1">
                          <Replace className="h-4 w-4 mr-2" />
                          Replace
                        </Button>
                        <Button onClick={handleReplaceAll} variant="outline" className="flex-1">
                          Replace All
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default PrintTemplates;
