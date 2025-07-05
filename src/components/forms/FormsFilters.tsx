
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormsFiltersProps {
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  departmentCounts: Record<string, number>;
}

const FormsFilters = ({ selectedDepartment, onDepartmentChange, departments, departmentCounts }: FormsFiltersProps) => {
  return (
    <div className="flex items-center gap-2">
      <Filter size={16} />
      <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(dept => (
            <SelectItem key={dept} value={dept}>
              {dept} {departmentCounts[dept] ? `(${departmentCounts[dept]})` : ''}
            </SelectItem>
          ))}
          <SelectItem value="others">Others (Search Specific)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FormsFilters;
