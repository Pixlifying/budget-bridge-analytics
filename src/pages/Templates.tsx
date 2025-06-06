
import React, { useState, useEffect } from "react";
import { FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageWrapper from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TemplateUploader from "@/components/templates/TemplateUploader";
import TemplateList from "@/components/templates/TemplateList";
import TemplatePreviewer from "@/components/templates/TemplatePreviewer";

interface Template {
  id: string;
  name: string;
  content: string;
  placeholders: any[];
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

const Templates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeView, setActiveView] = useState<"preview" | "print">("preview");
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [processedContent, setProcessedContent] = useState("");

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching templates",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data as Template[];
    },
  });

  // Handle template selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setActiveView("preview");
    setProcessedContent(template.content);
  };

  // Handle template update
  const handleTemplateUpdate = (updatedTemplate: Template) => {
    setSelectedTemplate(updatedTemplate);
    setProcessedContent(updatedTemplate.content);
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  };

  // Handle template deletion
  const handleTemplateDelete = (templateId: string) => {
    setSelectedTemplate(null);
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  };

  // Handle find and replace
  const handleFindReplace = () => {
    if (!selectedTemplate || !findText) return;
    
    const updatedContent = processedContent.replace(new RegExp(findText, 'g'), replaceText);
    setProcessedContent(updatedContent);
    toast({
      title: "Text replaced",
      description: `Replaced "${findText}" with "${replaceText}"`
    });
  };

  // Handle print with find/replace dialog
  const handlePrintClick = () => {
    if (!selectedTemplate) return;
    setShowFindReplace(true);
  };

  // Handle print
  const handlePrint = () => {
    try {
      // Create a temporary div to hold the content
      const printContent = document.createElement('div');
      printContent.innerHTML = processedContent;
      
      // Apply print styles
      printContent.style.fontFamily = 'Arial, sans-serif';
      printContent.style.lineHeight = '1.5';
      printContent.style.color = '#333';
      printContent.style.fontSize = '12pt';
      printContent.style.margin = '0';
      printContent.style.padding = '20px';
      
      // Hide the original content
      const originalContents = document.body.innerHTML;
      
      // Replace body content with print content
      document.body.innerHTML = printContent.outerHTML;
      
      // Add print styles to the document
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            font-size: 12pt;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Print
      window.print();
      
      // Restore original content
      document.body.innerHTML = originalContents;
      document.head.removeChild(style);
      
      // Close dialog
      setShowFindReplace(false);
      
      toast({
        title: "Document sent to printer",
        description: "Your document has been sent to the printer successfully."
      });
      
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print error",
        description: "There was an error while printing. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Reset processed content when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setProcessedContent(selectedTemplate.content);
    }
  }, [selectedTemplate]);

  return (
    <PageWrapper
      title="Templates"
      subtitle="Upload, edit and use document templates"
      icon={<FileText className="h-6 w-6" />}
      action={
        <TemplateUploader
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast({
              title: "Template uploaded",
              description: "Your template has been uploaded successfully."
            });
          }}
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Your Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateList 
              templates={templates} 
              isLoading={isLoading}
              selectedTemplateId={selectedTemplate?.id}
              onSelect={handleSelectTemplate}
            />
          </CardContent>
        </Card>

        {/* Template Preview/Print */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activeView === "print" ? "Print Template" : "Template Preview"}
            </CardTitle>
            {selectedTemplate && (
              <div className="flex items-center gap-2">
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "preview" | "print")}>
                  <TabsList>
                    <TabsTrigger value="preview">
                      Edit Document
                    </TabsTrigger>
                    <TabsTrigger value="print">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTemplate ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-md">
                <FileText className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">No template selected</h3>
                <p className="mb-4">Select a template from the list or upload a new one to get started.</p>
                <TemplateUploader
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["templates"] });
                    toast({
                      title: "Template uploaded",
                      description: "Your template has been uploaded successfully."
                    });
                  }}
                  variant="outline"
                  label="Upload Template"
                />
              </div>
            ) : activeView === "print" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Print Preview</h3>
                  <Button onClick={handlePrintClick}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Document
                  </Button>
                </div>
                <div className="print-preview bg-white p-8 mx-auto max-w-[21cm] min-h-[29.7cm] shadow-md border">
                  <div dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </div>
            ) : (
              <TemplatePreviewer
                template={selectedTemplate}
                mode="full"
                onSave={handleTemplateUpdate}
                onDelete={handleTemplateDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Find and Replace Dialog */}
      <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Find and Replace</DialogTitle>
            <DialogDescription>
              Replace text in the document before printing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="find-text">Find</Label>
              <Input
                id="find-text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find"
              />
            </div>
            <div>
              <Label htmlFor="replace-text">Replace with</Label>
              <Input
                id="replace-text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Enter replacement text"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFindReplace(false)}>
              Cancel
            </Button>
            <Button onClick={handleFindReplace} disabled={!findText}>
              Replace All
            </Button>
            <Button onClick={handlePrint}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Templates;
