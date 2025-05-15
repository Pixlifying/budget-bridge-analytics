
import React from "react";
import { FileText, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  created_at: string;
}

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  selectedTemplateId?: string;
  onSelect: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  isLoading,
  selectedTemplateId,
  onSelect,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-muted-foreground border border-dashed rounded-md">
        <FileText className="h-10 w-10 mb-2" />
        <h3 className="font-medium mb-1">No templates yet</h3>
        <p className="text-sm">Upload your first template to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "flex items-center gap-2 p-3 rounded-md cursor-pointer transition-colors",
              selectedTemplateId === template.id
                ? "bg-primary/10 hover:bg-primary/15"
                : "hover:bg-muted"
            )}
            onClick={() => onSelect(template)}
          >
            <FileText className={cn(
              "h-5 w-5",
              selectedTemplateId === template.id ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium truncate",
                selectedTemplateId === template.id ? "text-primary" : ""
              )}>
                {template.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TemplateList;
