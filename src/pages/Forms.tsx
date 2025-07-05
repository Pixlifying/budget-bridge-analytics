
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import PageHeader from '@/components/layout/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
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

const Forms = () => {
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [customDepartmentSearch, setCustomDepartmentSearch] = useState('');
  const [showCustomDepartmentDialog, setShowCustomDepartmentDialog] = useState(false);

  // Dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FormEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Inline form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    name: '',
    parentage: '',
    address: '',
    mobile: '',
    remarks: '',
    department: ''
  });

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

  const handleAddForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.parentage || !formData.address || !formData.mobile || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate mobile number (max 10 digits)
    if (!/^\d{1,10}$/.test(formData.mobile)) {
      toast.error("Mobile number must be numeric and not more than 10 digits");
      return;
    }

    try {
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
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        parentage: '',
        address: '',
        mobile: '',
        remarks: '',
        department: ''
      });
      await fetchForms();
    } catch (error) {
      console.error('Error adding form:', error);
      toast.error("Failed to add form entry");
    }
  };

  const handleEditForm = async () => {
    if (!editingForm || !formData.name || !formData.parentage || !formData.address || !formData.mobile || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate mobile number (max 10 digits)
    if (!/^\d{1,10}$/.test(formData.mobile)) {
      toast.error("Mobile number must be numeric and not more than 10 digits");
      return;
    }

    try {
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
      setShowEditDialog(false);
      setEditingForm(null);
      await fetchForms();
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error("Failed to update form entry");
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
    setFormData({
      date: format(new Date(form.date), 'yyyy-MM-dd'),
      name: form.name,
      parentage: form.parentage,
      address: form.address,
      mobile: form.mobile,
      remarks: form.remarks || '',
      department: form.department
    });
    setShowEditDialog(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDepartmentChange = (value: string) => {
    if (value === 'others') {
      setShowCustomDepartmentDialog(true);
    } else {
      setSelectedDepartment(value);
    }
  };

  const handleCustomDepartmentSearch = () => {
    if (customDepartmentSearch.trim()) {
      setSelectedDepartment(customDepartmentSearch.trim());
      setShowCustomDepartmentDialog(false);
      setCustomDepartmentSearch('');
    }
  };

  // Get unique departments from forms data
  const departments = useMemo(() => {
    const uniqueDepts = Array.from(new Set(forms.map(form => form.department))).sort();
    return uniqueDepts;
  }, [forms]);

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
          onDepartmentChange={handleDepartmentChange}
          departments={departments}
          departmentCounts={departmentCounts}
        />

        <FormsPrintExport
          filteredForms={filteredForms}
          selectedDepartment={selectedDepartment}
        />
      </PageHeader>

      <div className="flex-1 p-6 space-y-6">
        {/* Inline Add Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add New Form Entry</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddForm} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
              <div>
                <Label htmlFor="form_date">Date</Label>
                <Input
                  id="form_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_name">Name</Label>
                <Input
                  id="form_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_parentage">Parentage</Label>
                <Input
                  id="form_parentage"
                  value={formData.parentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentage: e.target.value }))}
                  placeholder="Father's/Mother's name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_address">Address</Label>
                <Input
                  id="form_address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Complete address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_mobile">Mobile</Label>
                <Input
                  id="form_mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, mobile: value }));
                  }}
                  placeholder="Mobile number"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_department">Department</Label>
                <Input
                  id="form_department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Department name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="form_remarks">Remarks</Label>
                <Input
                  id="form_remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional remarks"
                />
              </div>
              <Button type="submit">
                <Plus size={16} className="mr-2" />
                Add Entry
              </Button>
            </form>
          </CardContent>
        </Card>

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

      {/* Edit Form Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Form Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_date">Date</Label>
              <Input
                id="edit_date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_name">Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_parentage">Parentage</Label>
              <Input
                id="edit_parentage"
                value={formData.parentage}
                onChange={(e) => setFormData(prev => ({ ...prev, parentage: e.target.value }))}
                placeholder="Father's/Mother's name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Complete address"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_mobile">Mobile</Label>
              <Input
                id="edit_mobile"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData(prev => ({ ...prev, mobile: value }));
                }}
                placeholder="Mobile number"
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Department name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_remarks">Remarks</Label>
              <Textarea
                id="edit_remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional remarks (optional)"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditForm}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Department Search Dialog */}
      <Dialog open={showCustomDepartmentDialog} onOpenChange={setShowCustomDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search Department</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="custom_department">Department Name</Label>
              <Input
                id="custom_department"
                value={customDepartmentSearch}
                onChange={(e) => setCustomDepartmentSearch(e.target.value)}
                placeholder="Enter department name to search"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomDepartmentSearch();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCustomDepartmentDialog(false);
                setCustomDepartmentSearch('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleCustomDepartmentSearch}>
                <Search size={16} className="mr-2" />
                Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
