
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

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
}

interface TemplatePreviewerProps {
  template: Template;
  mode: "full" | "print";
}

const TemplatePreviewer: React.FC<TemplatePreviewerProps> = ({ template, mode }) => {
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize placeholder values when template changes
  useEffect(() => {
    // Reset placeholder values when template changes
    setPlaceholderValues({});
  }, [template.id]);

  // Function to replace placeholders with actual values
  const replaceContent = (content: string) => {
    let result = content;
    
    template.placeholders.forEach(placeholder => {
      const value = placeholderValues[placeholder.key] || `[${placeholder.label}]`;
      result = result.replace(new RegExp(`\\{\\{${placeholder.key}\\}\\}`, 'g'), value);
    });
    
    return result;
  };

  // Extract final content
  const previewContent = replaceContent(template.content);

  // Handle placeholder change
  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Placeholder Form */}
      {template.placeholders && template.placeholders.length > 0 && (
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
              <Card className="p-6 whitespace-pre-wrap">{previewContent}</Card>
            )}
          </div>
        </div>
      )}

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
