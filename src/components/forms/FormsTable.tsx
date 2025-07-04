
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
}

const FormsTable = ({ forms, onEdit, onDelete, loading, selectedDepartment }: FormsTableProps) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading form entries...</div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          {selectedDepartment === 'all' ? 'No form entries found' : `No form entries found for ${selectedDepartment} department`}
        </div>
      </div>
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
            <TableRow key={form.id}>
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
