
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText, Printer, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { exportToPDF } from '@/utils/calculateUtils';
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

  // Form states
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    name: '',
    parentage: '',
    address: '',
    mobile: '',
    remarks: '',
    department: 'General'
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

  const handleAddForm = async () => {
    try {
      // Validate mobile number (max 10 digits)
      if (!/^\d{1,10}$/.test(formData.mobile)) {
        toast.error("Mobile number must be numeric and not more than 10 digits");
        return;
      }

      const { data, error } = await supabase
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
      setShowFormDialog(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        parentage: '',
        address: '',
        mobile: '',
        remarks: '',
        department: 'General'
      });
      await fetchForms();
    } catch (error) {
      console.error('Error adding form:', error);
      toast.error("Failed to add form entry");
    }
  };

  const handleEditForm = async () => {
    if (!editingForm) return;

    try {
      // Validate mobile number (max 10 digits)
      if (!/^\d{1,10}$/.test(formData.mobile)) {
        toast.error("Mobile number must be numeric and not more than 10 digits");
        return;
      }

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
      setShowFormDialog(false);
      setEditingForm(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        parentage: '',
        address: '',
        mobile: '',
        remarks: '',
        department: 'General'
      });
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
    setShowFormDialog(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Forms Report - ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm;
            }
            @media print {
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              margin: 0;
              padding: 0;
            }
            h1 { text-align: center; margin-bottom: 20px; font-size: 18px; }
            .department { text-align: center; margin-bottom: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Forms Report</h1>
          <div class="department">Department: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}</div>
          <div class="total">Total Entries: ${filteredForms.length}</div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Name</th>
                <th>Parentage</th>
                <th>Address</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredForms.map((form, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(form.date), 'dd/MM/yyyy')}</td>
                  <td>${form.name}</td>
                  <td>${form.parentage}</td>
                  <td>${form.address}</td>
                  <td>${form.mobile}</td>
                  <td>${form.department}</td>
                  <td>${form.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const pdfData = filteredForms.map((form, index) => ({
      'S.No': index + 1,
      'Date': format(new Date(form.date), 'dd/MM/yyyy'),
      'Name': form.name,
      'Parentage': form.parentage,
      'Address': form.address,
      'Mobile': form.mobile,
      'Department': form.department,
      'Remarks': form.remarks || '-'
    }));
    
    const fileName = selectedDepartment === 'all' 
      ? 'forms-report-all-departments' 
      : `forms-report-${selectedDepartment.toLowerCase()}`;
    
    exportToPDF(pdfData, fileName);
    toast.success("Forms report downloaded successfully");
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
        <div className="flex items-center gap-2">
          <Filter size={16} />
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept} {departmentCounts[dept] ? `(${departmentCounts[dept]})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handlePrint} variant="outline">
          <Printer size={16} className="mr-2" />
          Print
        </Button>

        <Button onClick={handleDownloadPDF} variant="outline">
          <FileText size={16} className="mr-2" />
          Download PDF
        </Button>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingForm(null); 
              setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                name: '',
                parentage: '',
                address: '',
                mobile: '',
                remarks: '',
                department: 'General'
              }); 
            }}>
              <Plus size={16} className="mr-2" />
              Add Form Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingForm ? 'Edit Form Entry' : 'Add New Form Entry'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentage">Parentage *</Label>
                <Input
                  id="parentage"
                  value={formData.parentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentage: e.target.value }))}
                  placeholder="Father's/Mother's name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Complete address"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, mobile: value }));
                  }}
                  placeholder="Mobile number (max 10 digits)"
                  maxLength={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional remarks (optional)"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowFormDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingForm ? handleEditForm : handleAddForm}
                  disabled={!formData.name || !formData.parentage || !formData.address || !formData.mobile || !formData.department}
                >
                  {editingForm ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
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
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading form entries...</div>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                {selectedDepartment === 'all' ? 'No form entries found' : `No form entries found for ${selectedDepartment} department`}
              </div>
            </div>
          ) : (
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
                  {filteredForms.map((form, index) => (
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
                            onClick={() => openEditForm(form)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initiateDelete(form.id)}
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
          )}
        </div>
      </div>

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
