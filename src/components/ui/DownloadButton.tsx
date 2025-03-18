
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/utils/calculateUtils';

interface DownloadButtonProps<T> {
  data: T[];
  filename: string;
  currentData: T[];
  label?: string;
}

function DownloadButton<T>({ data, filename, currentData, label = "Download" }: DownloadButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadAll = () => {
    exportToExcel(data, `${filename}-all`);
    setIsOpen(false);
  };

  const handleDownloadCurrent = () => {
    exportToExcel(currentData, `${filename}-current-view`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-50 bg-background border shadow-md">
        <DropdownMenuItem onClick={handleDownloadAll} className="cursor-pointer">
          Download All Data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCurrent} className="cursor-pointer">
          Download Current View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DownloadButton;
