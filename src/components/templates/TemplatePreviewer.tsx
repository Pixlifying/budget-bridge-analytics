
import React, { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

const TemplatePreviewer: React.FC<TemplatePreviewerProps> = ({ template, mode, onSave }) => {
  const { toast } = useToast();
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableContent, setEditableContent] = useState(template.content);
  const [editableName, setEditableName] = useState(template.name);
  const [showPlaceholderForm, setShowPlaceholderForm] = useState(mode === "print");

  // Initialize content when template changes
  useEffect(() => {
    setEditableContent(template.content);
    setEditableName(template.name);
    setPlaceholderValues({});
  }, [template.id]);

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
  const previewContent = mode === "print" ? replaceContent(template.content) : editableContent;

  // Handle placeholder change
  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value
    }));
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
      
      // Update template in database
      const { data, error } = await supabase
        .from("templates")
        .update({
          name: editableName,
          content: editableContent,
          placeholders: updatedPlaceholders,
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

  // Print document
  const handlePrint = () => {
    if (!showPlaceholderForm && template.placeholders.length > 0) {
      setShowPlaceholderForm(true);
      return;
    }
    
    window.print();
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
            {template.placeholders.map(placeholder => (
              <div key={placeholder.key}>
                <Label htmlFor={`placeholder-${placeholder.key}`} className="text-sm">
                  {placeholder.label}
                </Label>
                <Input
                  id={`placeholder-${placeholder.key}`}
                  value={placeholderValues[placeholder.key] || ""}
                  onChange={(e) => handlePlaceholderChange(placeholder.key, e.target.value)}
                  className="mt-1"
                  placeholder={placeholder.label}
                />
              </div>
            ))}
          </div>
          <Separator className="my-6" />
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
              <div className="whitespace-pre-wrap">{previewContent}</div>
            ) : (
              <Card className="p-6">
                <Textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="font-mono min-h-[400px] w-full border-none focus-visible:ring-0 resize-none"
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {mode === "full" && (
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
        )}
        
        {mode === "print" && (
          <Button onClick={handlePrint}>
            {showPlaceholderForm && template.placeholders.length > 0 ? "Print" : "Continue to Print"}
          </Button>
        )}
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
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
          }
        `}
      </style>
    </div>
  );
};

export default TemplatePreviewer;
