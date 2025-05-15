
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  created_at: string;
  updated_at: string;
}

interface TemplateEditorProps {
  template: Template;
  onSave: (updatedTemplate: Template) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave }) => {
  const { toast } = useToast();
  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>(template.placeholders || []);
  const [newPlaceholder, setNewPlaceholder] = useState({ key: "", label: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Extract placeholders from content
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    
    const extractedKeys = matches.map(match => match[1].trim());
    
    // Check if we need to add new placeholders
    const existingKeys = placeholders.map(p => p.key);
    const newKeys = extractedKeys.filter(key => !existingKeys.includes(key));
    
    if (newKeys.length > 0) {
      const newPlaceholders = [
        ...placeholders,
        ...newKeys.map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1) }))
      ];
      setPlaceholders(newPlaceholders);
    }
  }, [content]);

  const handleAddPlaceholder = () => {
    if (newPlaceholder.key && newPlaceholder.label) {
      setPlaceholders([...placeholders, newPlaceholder]);
      setContent(`${content}{{${newPlaceholder.key}}}`);
      setNewPlaceholder({ key: "", label: "" });
    }
  };

  const handleRemovePlaceholder = (keyToRemove: string) => {
    // Remove placeholder from list
    const updatedPlaceholders = placeholders.filter(p => p.key !== keyToRemove);
    setPlaceholders(updatedPlaceholders);
    
    // Optional: Remove all instances from content
    const updatedContent = content.replace(new RegExp(`\\{\\{${keyToRemove}\\}\\}`, 'g'), '');
    setContent(updatedContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Convert the placeholders to a format that Supabase accepts
      const placeholdersJson = placeholders as unknown as Record<string, unknown>[];
      
      const { data, error } = await supabase
        .from("templates")
        .update({
          name,
          content,
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
        // Safe type conversion for the returned data
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

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="template-content">Template Content</Label>
        <Textarea
          id="template-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="mt-1 font-mono min-h-[300px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {{placeholder}} syntax to define placeholders in your template.
        </p>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Placeholders</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNewPlaceholder({ key: "", label: "" })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {newPlaceholder.key !== undefined && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Key (e.g. customer_name)"
                value={newPlaceholder.key}
                onChange={e => setNewPlaceholder({ ...newPlaceholder, key: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Label (e.g. Customer Name)"
                value={newPlaceholder.label}
                onChange={e => setNewPlaceholder({ ...newPlaceholder, label: e.target.value })}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddPlaceholder}
              disabled={!newPlaceholder.key || !newPlaceholder.label}
            >
              Add
            </Button>
          </div>
        )}
        
        {placeholders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No placeholders defined yet. Add placeholders to make your template dynamic.
          </p>
        ) : (
          <div className="space-y-2">
            {placeholders.map((placeholder) => (
              <div key={placeholder.key} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <div>
                  <Badge variant="outline" className="mr-2">{`{{${placeholder.key}}}`}</Badge>
                  <span className="text-sm">{placeholder.label}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePlaceholder(placeholder.key)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-end">
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
      </div>
    </div>
  );
};

export default TemplateEditor;
