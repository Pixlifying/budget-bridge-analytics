
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import PageHeader from '@/components/layout/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import FormDialog from '@/components/forms/FormDialog';
import FormsFilters from '@/components/forms/FormsFilters';
import FormsPrintExport from '@/components/forms/FormsPrintExport';
import FormsTable from '@/components/forms/FormsTable';
import { format } from 'date-fns';

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

const DEPARTMENTS = [
  'General',
  'Education',
  'Health',
  'Legal',
  'Finance',
  'Government',
  'Transport',
  'Others'
];

const Forms = () => {
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FormEntry | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error("Failed to load forms data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleSaveForm = async (formData: any) => {
    try {
      // Validate mobile number (max 10 digits)
      if (!/^\d{1,10}$/.test(formData.mobile)) {
        toast.error("Mobile number must be numeric and not more than 10 digits");
        return;
      }

      if (editingForm) {
        const { error } = await supabase
          .from('forms')
          .update({
            date: formData.date,
            name: formData.name,
            parentage: formData.parentage,
            address: formData.address,
            mobile: formData.mobile,
            remarks: formData.remarks || null,
            department: formData.department,
          })
          .eq('id', editingForm.id);

        if (error) throw error;
        toast.success("Form entry updated successfully");
      } else {
        const { error } = await supabase
          .from('forms')
          .insert({
            date: formData.date,
            name: formData.name,
            parentage: formData.parentage,
            address: formData.address,
            mobile: formData.mobile,
            remarks: formData.remarks || null,
            department: formData.department,
          })
          .select();

        if (error) throw error;
        toast.success("Form entry added successfully");
      }

      setShowFormDialog(false);
      setEditingForm(null);
      await fetchForms();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(editingForm ? "Failed to update form entry" : "Failed to add form entry");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success("Form entry deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
      await fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error("Failed to delete form entry");
    }
  };

  const openEditForm = (form: FormEntry) => {
    setEditingForm(form);
    setShowFormDialog(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const openAddForm = () => {
    setEditingForm(null);
    setShowFormDialog(true);
  };

  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.parentage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.mobile.includes(searchTerm) ||
        form.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all' || form.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  }, [forms, searchTerm, selectedDepartment]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    forms.forEach(form => {
      counts[form.department] = (counts[form.department] || 0) + 1;
    });
    return counts;
  }, [forms]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Forms Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, parentage, mobile, or department..."
      >
        <FormsFilters
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          departments={DEPARTMENTS}
          departmentCounts={departmentCounts}
        />

        <FormsPrintExport
          filteredForms={filteredForms}
          selectedDepartment={selectedDepartment}
        />

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogTrigger asChild>
            <Button onClick={openAddForm}>
              <Plus size={16} className="mr-2" />
              Add Form Entry
            </Button>
          </DialogTrigger>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Form Entries ({filteredForms.length})
              {selectedDepartment !== 'all' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {selectedDepartment} Department
                </span>
              )}
            </h2>
          </div>
          
          <FormsTable
            forms={filteredForms}
            onEdit={openEditForm}
            onDelete={initiateDelete}
            loading={loading}
            selectedDepartment={selectedDepartment}
          />
        </div>
      </div>

      <FormDialog
        isOpen={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        onSave={handleSaveForm}
        editingForm={editingForm}
        departments={DEPARTMENTS}
      />

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Form Entry"
        description="Are you sure you want to delete this form entry? This action cannot be undone."
      />
    </div>
  );
};

export default Forms;
