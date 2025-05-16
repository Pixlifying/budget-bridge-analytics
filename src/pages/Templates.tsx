
import React, { useState, useEffect } from "react";
import { FilePen, Eye, Printer, Upload, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageWrapper from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateUploader from "@/components/templates/TemplateUploader";
import TemplateList from "@/components/templates/TemplateList";
import TemplateEditor from "@/components/templates/TemplateEditor";
import TemplatePreviewer from "@/components/templates/TemplatePreviewer";

interface Placeholder {
  key: string;
  label: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  placeholders: Placeholder[];
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

const Templates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeView, setActiveView] = useState<"preview" | "edit" | "print">("preview");
  const [previewMode, setPreviewMode] = useState<"full" | "print">("full");

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
      
      return data.map(template => ({
        ...template,
        placeholders: template.placeholders as unknown as Placeholder[]
      })) as Template[];
    },
  });

  // Handle template selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setActiveView("preview");
  };

  // Handle template update
  const handleTemplateUpdate = (updatedTemplate: Template) => {
    setSelectedTemplate(updatedTemplate);
    queryClient.invalidateQueries({ queryKey: ["templates"] });
  };

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

        {/* Template Editor/Preview */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activeView === "edit" ? "Edit Template" : 
               activeView === "print" ? "Print Template" : "Template Preview"}
            </CardTitle>
            {selectedTemplate && (
              <div className="flex items-center gap-2">
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "preview" | "edit" | "print")}>
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <FilePen className="mr-2 h-4 w-4" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="print">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {activeView === "preview" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                )}
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
            ) : activeView === "edit" ? (
              <TemplateEditor 
                template={selectedTemplate} 
                onSave={handleTemplateUpdate}
              />
            ) : activeView === "print" ? (
              <TemplatePreviewer
                template={selectedTemplate}
                mode="print"
              />
            ) : (
              <TemplatePreviewer
                template={selectedTemplate}
                mode="full"
                onSave={handleTemplateUpdate}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Templates;
