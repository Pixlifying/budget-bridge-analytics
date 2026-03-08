
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface FormEntry {
  id: string;
  date: string;
  s_no: number;
  name: string;
  parentage: string;
  address: string;
  mobile: string;
  remarks?: string;
  department: string;
  created_at: string;
  updated_at: string;
}

interface FormsTableProps {
  forms: FormEntry[];
  onEdit: (form: FormEntry) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  selectedDepartment: string;
  highlightId?: string | null;
}

const FormsTable = ({ forms, onEdit, onDelete, loading, selectedDepartment, highlightId }: FormsTableProps) => {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <EmptyState
        icon="file"
        title="No Form Entries"
        description={selectedDepartment === 'all' ? 'No form entries found. Start by adding your first form entry.' : `No form entries found for ${selectedDepartment} department.`}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Parentage</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form, index) => (
            <TableRow key={form.id} data-record-id={form.id} className={highlightId === form.id ? 'search-highlight' : ''}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{format(new Date(form.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-medium">{form.name}</TableCell>
              <TableCell>{form.parentage}</TableCell>
              <TableCell className="max-w-[200px] truncate">{form.address}</TableCell>
              <TableCell>{form.mobile}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {form.department}
                </span>
              </TableCell>
              <TableCell className="max-w-[150px] truncate">{form.remarks || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(form)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(form.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FormsTable;
