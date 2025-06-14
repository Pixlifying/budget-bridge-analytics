
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search, Replace, Printer, X, FileText } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';

interface UploadedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  content?: string;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  content?: string;
}

const PrintTemplates = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg', 
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validFiles: FileWithPreview[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name}: Please upload PDF, image, text, or Word document files only.`,
          variant: "destructive",
        });
        continue;
      }

      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: generateFileId(),
      });

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      // Read content for text files
      if (file.type === 'text/plain') {
        try {
          const content = await file.text();
          fileWithPreview.content = content;
        } catch (error) {
          console.error('Error reading text file:', error);
        }
      }

      validFiles.push(fileWithPreview);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId);
      if (activeDocIndex >= updated.length && updated.length > 0) {
        setActiveDocIndex(updated.length - 1);
      }
      return updated;
    });
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const newUploadedDocs: UploadedDocument[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.id}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save document metadata to database
        const { data: docData, error: docError } = await supabase
          .from('uploaded_documents')
          .insert([
            {
              file_name: file.name,
              file_path: uploadData.path,
              file_type: file.type,
              file_size: file.size,
            }
          ])
          .select()
          .single();

        if (docError) throw docError;

        // Get public URL for preview
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path);

        const uploadedDoc: UploadedDocument = {
          ...docData,
          content: file.content
        };

        newUploadedDocs.push(uploadedDoc);
      }

      setUploadedDocs(prev => [...prev, ...newUploadedDocs]);
      setSelectedFiles([]);
      
      toast({
        title: "Files uploaded successfully",
        description: `${newUploadedDocs.length} file(s) have been uploaded and saved.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
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

    const activeDoc = uploadedDocs[activeDocIndex];
    if (!activeDoc?.content) {
      toast({
        title: "Cannot edit this file",
        description: "Find and replace is only available for text files.",
        variant: "destructive",
      });
      return;
    }

    const updatedContent = activeDoc.content.replace(findText, replaceText);
    const updatedDocs = [...uploadedDocs];
    updatedDocs[activeDocIndex] = { ...activeDoc, content: updatedContent };
    setUploadedDocs(updatedDocs);

    toast({
      title: "Find and Replace",
      description: `Replaced first instance of "${findText}" with "${replaceText}"`,
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

    const activeDoc = uploadedDocs[activeDocIndex];
    if (!activeDoc?.content) {
      toast({
        title: "Cannot edit this file",
        description: "Find and replace is only available for text files.",
        variant: "destructive",
      });
      return;
    }

    const regex = new RegExp(findText, 'g');
    const updatedContent = activeDoc.content.replace(regex, replaceText);
    const updatedDocs = [...uploadedDocs];
    updatedDocs[activeDocIndex] = { ...activeDoc, content: updatedContent };
    setUploadedDocs(updatedDocs);

    toast({
      title: "Replace All",
      description: `Replaced all instances of "${findText}" with "${replaceText}"`,
    });
    
    setIsReplaceDialogOpen(false);
    setFindText('');
    setReplaceText('');
  };

  const handlePrint = () => {
    if (uploadedDocs.length === 0) {
      toast({
        title: "No documents",
        description: "Please upload documents first.",
        variant: "destructive",
      });
      return;
    }

    window.print();
    
    toast({
      title: "Print initiated",
      description: "Document sent to printer.",
    });
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'text/plain') return '📝';
    if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📘';
    return '📁';
  };

  const activeDocument = uploadedDocs[activeDocIndex];
  const allFiles = [...selectedFiles, ...uploadedDocs];

  return (
    <PageWrapper title="Print and Templates" subtitle="Upload multiple documents, preview, edit, and print them.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select Multiple Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                  multiple
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, JPG, PNG, TXT, DOC, DOCX (Multiple files allowed)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={uploadFiles} 
                disabled={selectedFiles.length === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              {uploadedDocs.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {uploadedDocs.map((doc, index) => (
                    <Button
                      key={doc.id}
                      variant={index === activeDocIndex ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDocIndex(index)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {doc.file_name.split('.')[0].substring(0, 10)}...
                    </Button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-[400px] max-h-[400px] overflow-auto">
                {activeDocument ? (
                  <div className="w-full h-full">
                    {activeDocument.file_type.startsWith('image/') ? (
                      <img 
                        src={`https://ihnsvmyfuyetvcdufzff.supabase.co/storage/v1/object/public/documents/${activeDocument.file_path}`}
                        alt="Document preview" 
                        className="max-w-full max-h-full object-contain mx-auto rounded"
                      />
                    ) : activeDocument.file_type === 'application/pdf' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📄</div>
                          <p className="text-sm font-medium">{activeDocument.file_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF file uploaded successfully
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.open(`https://ihnsvmyfuyetvcdufzff.supabase.co/storage/v1/object/public/documents/${activeDocument.file_path}`, '_blank')}
                          >
                            Open PDF
                          </Button>
                        </div>
                      </div>
                    ) : activeDocument.file_type === 'text/plain' && activeDocument.content ? (
                      <div className="w-full h-full">
                        <div className="bg-white p-4 rounded border text-sm font-mono whitespace-pre-wrap break-words">
                          {activeDocument.content}
                        </div>
                      </div>
                    ) : (activeDocument.file_type === 'application/msword' || activeDocument.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📘</div>
                          <p className="text-sm font-medium">{activeDocument.file_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Word document uploaded successfully
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.open(`https://ihnsvmyfuyetvcdufzff.supabase.co/storage/v1/object/public/documents/${activeDocument.file_path}`, '_blank')}
                          >
                            Download Document
                          </Button>
                        </div>
                      </div>
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
                  <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    <div>
                      <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Upload documents to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File List */}
        {uploadedDocs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents ({uploadedDocs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {uploadedDocs.map((doc, index) => (
                  <div 
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      index === activeDocIndex ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setActiveDocIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileTypeIcon(doc.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.file_type.includes('word') ? 'DOCX' : doc.file_type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {uploadedDocs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Document Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Dialog open={isReplaceDialogOpen} onOpenChange={setIsReplaceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      disabled={!activeDocument?.content}
                    >
                      <Search className="h-4 w-4" />
                      Find & Replace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Find and Replace in {activeDocument?.file_name}</DialogTitle>
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
              {activeDocument && !activeDocument.content && (
                <p className="text-xs text-muted-foreground mt-2">
                  Find & Replace is only available for text files
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default PrintTemplates;
