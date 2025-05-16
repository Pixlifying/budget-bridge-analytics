
import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  Save, 
  Trash2,
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ListOrdered, 
  ListUnordered 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DeleteConfirmation from "@/components/ui/DeleteConfirmation";

interface Placeholder {
  key: string;
  label: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  placeholders: Placeholder[];
  file_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TemplatePreviewerProps {
  template: Template;
  mode: "full" | "print";
  onSave?: (updatedTemplate: Template) => void;
  onDelete?: (templateId: string) => void;
}

const TemplatePreviewer: React.FC<TemplatePreviewerProps> = ({ 
  template, 
  mode, 
  onSave,
  onDelete 
}) => {
  const { toast } = useToast();
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableContent, setEditableContent] = useState(template.content);
  const [editableName, setEditableName] = useState(template.name);
  const [showPlaceholderForm, setShowPlaceholderForm] = useState(mode === "print");
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null);
  
  // Initialize content when template changes
  useEffect(() => {
    setEditableContent(template.content);
    setEditableName(template.name);
    setPlaceholderValues({});
  }, [template.id]);

  // Split content into pages (based on page break markers or size)
  const pages = editableContent.split('---page-break---');
  
  // Function to replace placeholders with actual values
  const replaceContent = (content: string) => {
    let result = content;
    
    template.placeholders.forEach(placeholder => {
      const value = placeholderValues[placeholder.key] || `{{${placeholder.key}}}`;
      result = result.replace(new RegExp(`\\{\\{${placeholder.key}\\}\\}`, 'g'), value);
    });
    
    return result;
  };

  // Extract final content
  const previewContent = mode === "print" ? replaceContent(pages[currentPage] || '') : pages[currentPage] || '';

  // Handle placeholder change
  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Navigate between pages
  const handlePageChange = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex);
    }
  };

  // Apply formatting to selected text
  const applyFormatting = (format: string) => {
    if (!editorRef) return;
    
    document.execCommand(format, false);
    // Update the editable content after formatting
    if (editorRef) {
      const updatedPages = [...pages];
      updatedPages[currentPage] = editorRef.innerHTML;
      setEditableContent(updatedPages.join('---page-break---'));
    }
  };

  const handleAlignment = (alignment: string) => {
    if (!editorRef) return;
    document.execCommand('justify' + alignment, false);
    // Update content after alignment
    if (editorRef) {
      const updatedPages = [...pages];
      updatedPages[currentPage] = editorRef.innerHTML;
      setEditableContent(updatedPages.join('---page-break---'));
    }
  };

  const addBulletList = (ordered: boolean) => {
    if (!editorRef) return;
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
    // Update content after adding list
    if (editorRef) {
      const updatedPages = [...pages];
      updatedPages[currentPage] = editorRef.innerHTML;
      setEditableContent(updatedPages.join('---page-break---'));
    }
  };

  // Add a new page
  const addNewPage = () => {
    const updatedContent = editableContent + '\n---page-break---\n';
    setEditableContent(updatedContent);
    setCurrentPage(pages.length);
  };

  // Save changes to the template
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    
    try {
      // Extract placeholders from content
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = [...editableContent.matchAll(regex)];
      const extractedKeys = [...new Set(matches.map(match => match[1].trim()))];
      
      // Create placeholder objects
      const updatedPlaceholders = extractedKeys.map(key => {
        const existing = template.placeholders.find(p => p.key === key);
        return existing || { key, label: key.charAt(0).toUpperCase() + key.slice(1) };
      });
      
      // Convert placeholders to a format Supabase accepts
      const placeholdersJson = JSON.parse(JSON.stringify(updatedPlaceholders));
      
      // Update template in database
      const { data, error } = await supabase
        .from("templates")
        .update({
          name: editableName,
          content: editableContent,
          placeholders: placeholdersJson,
          updated_at: new Date().toISOString()
        })
        .eq("id", template.id)
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Template saved",
        description: "Your changes have been saved successfully."
      });
      
      if (data && data[0]) {
        const updatedTemplate: Template = {
          ...data[0],
          placeholders: data[0].placeholders as unknown as Placeholder[]
        };
        onSave(updatedTemplate);
      }
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message || "An error occurred while saving the template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete template
  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await supabase
        .from("templates")
        .delete()
        .eq("id", template.id);
      
      onDelete(template.id);
      toast({
        title: "Template deleted",
        description: "The template has been removed successfully."
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "An error occurred while deleting the template",
        variant: "destructive"
      });
    }
  };

  // Print document
  const handlePrint = () => {
    if (!showPlaceholderForm && template.placeholders.length > 0) {
      setShowPlaceholderForm(true);
      return;
    }
    
    window.print();
  };

  // Handle content change
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const updatedPages = [...pages];
    updatedPages[currentPage] = e.currentTarget.innerHTML;
    setEditableContent(updatedPages.join('---page-break---'));
  };

  return (
    <div className="space-y-6">
      {/* Editable Name (only in full mode) */}
      {mode === "full" && (
        <div>
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={editableName}
            onChange={(e) => setEditableName(e.target.value)}
            className="mt-1"
          />
        </div>
      )}

      {/* Placeholder Form (shown in print mode or when preparing to print) */}
      {showPlaceholderForm && template.placeholders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Fill in the placeholders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.placeholders.map(p => (
              <div key={p.key}>
                <Label htmlFor={`placeholder-${p.key}`} className="text-sm">
                  {p.label}
                </Label>
                <Input
                  id={`placeholder-${p.key}`}
                  value={placeholderValues[p.key] || ""}
                  onChange={(e) => handlePlaceholderChange(p.key, e.target.value)}
                  className="mt-1"
                  placeholder={p.label}
                />
              </div>
            ))}
          </div>
          <Separator className="my-6" />
        </div>
      )}
      
      {/* Formatting Controls (only in full mode) */}
      {mode === "full" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Toggle 
              aria-label="Toggle bold" 
              onClick={() => applyFormatting('bold')}
              size="sm"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle 
              aria-label="Toggle italic" 
              onClick={() => applyFormatting('italic')}
              size="sm"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle 
              aria-label="Toggle underline" 
              onClick={() => applyFormatting('underline')}
              size="sm"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>

          <div className="flex items-center gap-1 border rounded-md p-1">
            <ToggleGroup type="single">
              <ToggleGroupItem value="left" aria-label="Align left" onClick={() => handleAlignment('Left')} size="sm">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center" onClick={() => handleAlignment('Center')} size="sm">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right" onClick={() => handleAlignment('Right')} size="sm">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-1 border rounded-md p-1">
            <Toggle aria-label="Add ordered list" onClick={() => addBulletList(true)} size="sm">
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle aria-label="Add unordered list" onClick={() => addBulletList(false)} size="sm">
              <ListUnordered className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      )}

      {/* Page navigation (only in full mode and if multiple pages) */}
      {mode === "full" && pages.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous Page
          </Button>
          <span className="text-sm">
            Page {currentPage + 1} of {pages.length}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
          >
            Next Page
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addNewPage}
          >
            Add Page
          </Button>
        </div>
      )}
      
      {/* Preview */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={mode === "print" ? "print-document" : ""}>
          <div className={`
            relative
            ${mode === "print" ? "p-8 bg-white shadow-none max-w-[21cm] mx-auto min-h-[29.7cm]" : ""}
          `}>
            {mode === "print" ? (
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: previewContent }} />
            ) : (
              <Card className="p-6">
                <div
                  ref={setEditorRef}
                  contentEditable={mode === "full"}
                  className="min-h-[400px] w-full focus:outline-none"
                  onInput={handleContentChange}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-2">
        {mode === "full" && (
          <>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Template
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </>
        )}
        
        {mode === "print" && (
          <Button onClick={handlePrint}>
            {showPlaceholderForm && template.placeholders.length > 0 ? "Print" : "Continue to Print"}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page { 
              margin: 0;
              size: auto;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            body * {
              visibility: hidden;
            }
            .print-document,
            .print-document * {
              visibility: visible;
            }
            .print-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            /* Hide URL and page info */
            html {-webkit-print-color-adjust: exact;}
            
            /* Remove header/footer */
            @page { margin: 0; }
            html { margin: 0; }
            body { margin: 15mm; }
          }
        `}
      </style>
    </div>
  );
};

export default TemplatePreviewer;
