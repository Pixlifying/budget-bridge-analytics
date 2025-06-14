import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText, Printer } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { exportToPDF } from '@/utils/calculateUtils';

interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Class {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
}

interface Subject {
  id: string;
  class_id: string;
  name: string;
  paper_count: number;
  amount: number;
  created_at: string;
}

interface SchoolWithClasses extends School {
  classes: (Class & { subjects: Subject[] })[];
}

const Papers = () => {
  const [schools, setSchools] = useState<SchoolWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithClasses | null>(null);
  const [printSchoolId, setPrintSchoolId] = useState<string>('all');

  // Dialog states
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'school' | 'class' | 'subject'>('school');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Form states
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState({
    name: '',
    paper_count: '',
    amount: ''
  });

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      const schoolsWithData = await Promise.all(
        (schoolsData || []).map(async (school) => {
          // Fetch classes
          const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('*')
            .eq('school_id', school.id)
            .order('created_at', { ascending: false });

          if (classesError) {
            console.error('Error fetching classes:', classesError);
          }

          const classesWithSubjects = await Promise.all(
            (classesData || []).map(async (classItem) => {
              const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', classItem.id)
                .order('created_at', { ascending: false });

              if (subjectsError) {
                console.error('Error fetching subjects:', subjectsError);
              }

              return {
                ...classItem,
                subjects: subjectsData || []
              };
            })
          );

          return {
            ...school,
            classes: classesWithSubjects
          };
        })
      );

      setSchools(schoolsWithData);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error("Failed to load papers data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleAddSchool = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolForm.name,
          address: schoolForm.address || null,
          phone: schoolForm.phone || null,
        })
        .select();

      if (error) throw error;

      toast.success("School added successfully");
      setShowSchoolDialog(false);
      setSchoolForm({ name: '', address: '', phone: '' });
      await fetchSchools();
    } catch (error) {
      console.error('Error adding school:', error);
      toast.error("Failed to add school");
    }
  };

  const handleEditSchool = async () => {
    if (!editingSchool) return;

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: schoolForm.name,
          address: schoolForm.address || null,
          phone: schoolForm.phone || null,
        })
        .eq('id', editingSchool.id);

      if (error) throw error;

      toast.success("School updated successfully");
      setShowSchoolDialog(false);
      setEditingSchool(null);
      setSchoolForm({ name: '', address: '', phone: '' });
      await fetchSchools();
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error("Failed to update school");
    }
  };

  const handleAddClass = async (schoolId: string) => {
    if (!newClassName.trim()) return;

    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          school_id: schoolId,
          name: newClassName,
        });

      if (error) throw error;

      toast.success("Class added successfully");
      setNewClassName('');
      await fetchSchools();
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error("Failed to add class");
    }
  };

  const handleAddSubject = async (classId: string) => {
    if (!newSubject.name.trim() || !newSubject.paper_count || !newSubject.amount) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          class_id: classId,
          name: newSubject.name,
          paper_count: parseInt(newSubject.paper_count),
          amount: parseFloat(newSubject.amount),
        });

      if (error) throw error;

      toast.success("Subject added successfully");
      setNewSubject({ name: '', paper_count: '', amount: '' });
      await fetchSchools();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error("Failed to add subject");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      if (deleteType === 'school') {
        const { error } = await supabase
          .from('schools')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;
        toast.success("School deleted successfully");
      } else if (deleteType === 'class') {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;
        toast.success("Class deleted successfully");
      } else {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;
        toast.success("Subject deleted successfully");
      }

      setShowDeleteConfirm(false);
      setDeleteId(null);
      await fetchSchools();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${deleteType}`);
    }
  };

  const openEditSchool = (school: School) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name,
      address: school.address || '',
      phone: school.phone || ''
    });
    setShowSchoolDialog(true);
  };

  const initiateDelete = (id: string, type: 'school' | 'class' | 'subject') => {
    setDeleteId(id);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const getSchoolsToPrint = () => {
    if (printSchoolId === 'all') {
      return filteredSchools;
    }
    return filteredSchools.filter(school => school.id === printSchoolId);
  };

  const handlePrint = () => {
    const schoolsToPrint = getSchoolsToPrint();
    const schoolTotal = schoolsToPrint.reduce((total, school) => {
      return total + school.classes.reduce((classTotal, classItem) => {
        return classTotal + classItem.subjects.reduce((subjectTotal, subject) => {
          return subjectTotal + (subject.paper_count * subject.amount);
        }, 0);
      }, 0);
    }, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Papers Report</title>
          <style>
            @page { 
              size: A4; 
              margin: 20mm;
              @top-left { content: none; }
              @top-center { content: none; }
              @top-right { content: none; }
              @bottom-left { content: none; }
              @bottom-center { content: none; }
              @bottom-right { content: none; }
            }
            @media print {
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              header, footer { display: none !important; }
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              margin: 0;
              padding: 0;
            }
            h1 { text-align: center; margin-bottom: 20px; }
            .school-section { margin-bottom: 30px; border: 1px solid #000; padding: 15px; }
            .school-header { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Papers Report${printSchoolId !== 'all' ? ` - ${schoolsToPrint[0]?.name || ''}` : ''}</h1>
          <div class="total">Total Amount: ₹${schoolTotal.toFixed(2)}</div>
          ${schoolsToPrint.map((school) => `
            <div class="school-section">
              <div class="school-header">
                ${school.name}
                ${school.address ? `<br/>Address: ${school.address}` : ''}
                ${school.phone ? `<br/>Phone: ${school.phone}` : ''}
              </div>
              ${school.classes.map((classItem) => `
                <h4>${classItem.name}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Paper Count</th>
                      <th>Amount per Paper</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${classItem.subjects.map((subject) => `
                      <tr>
                        <td>${subject.name}</td>
                        <td>${subject.paper_count}</td>
                        <td>₹${subject.amount.toFixed(2)}</td>
                        <td>₹${(subject.paper_count * subject.amount).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="total">Class Total: ₹${classItem.subjects.reduce((total, subject) => total + (subject.paper_count * subject.amount), 0).toFixed(2)}</div>
              `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const schoolsToPrint = getSchoolsToPrint();
    const pdfData = schoolsToPrint.flatMap(school =>
      school.classes.flatMap(classItem =>
        classItem.subjects.map(subject => ({
          school: school.name,
          class: classItem.name,
          subject: subject.name,
          papers: subject.paper_count,
          amount: subject.amount,
          total: subject.paper_count * subject.amount
        }))
      )
    );
    
    const fileName = printSchoolId === 'all' ? 'papers-report' : `papers-report-${schoolsToPrint[0]?.name.replace(/\s+/g, '-').toLowerCase()}`;
    exportToPDF(pdfData, fileName);
    toast.success("Papers report downloaded successfully");
  };

  const filteredSchools = useMemo(() => {
    return schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const grandTotal = useMemo(() => {
    return schools.reduce((total, school) => {
      return total + school.classes.reduce((classTotal, classItem) => {
        return classTotal + classItem.subjects.reduce((subjectTotal, subject) => {
          return subjectTotal + (subject.paper_count * subject.amount);
        }, 0);
      }, 0);
    }, 0);
  }, [schools]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Papers Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by school name..."
      >
        <div className="flex items-center gap-2">
          <Select value={printSchoolId} onValueChange={setPrintSchoolId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select school to print" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
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

        <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSchool(null); setSchoolForm({ name: '', address: '', phone: '' }); }}>
              <Plus size={16} className="mr-2" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="school_name">School Name *</Label>
                <Input
                  id="school_name"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="School name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="school_address">Address</Label>
                <Input
                  id="school_address"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="School address (optional)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="school_phone">Phone Number</Label>
                <Input
                  id="school_phone"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number (optional)"
                />
              </div>
              <Button 
                onClick={editingSchool ? handleEditSchool : handleAddSchool}
                disabled={!schoolForm.name}
              >
                {editingSchool ? 'Update School' : 'Save School'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6">
        {/* Grand Total Summary */}
        <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Grand Total</h3>
          <p className="text-2xl font-bold text-primary">₹{grandTotal.toFixed(2)}</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading schools data...</div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schools found
            </div>
          ) : (
            filteredSchools.map((school) => (
              <div key={school.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="cursor-pointer" onClick={() => setSelectedSchool(selectedSchool?.id === school.id ? null : school)}>
                    <h3 className="text-xl font-semibold hover:text-primary transition-colors">{school.name}</h3>
                    {school.address && (
                      <p className="text-muted-foreground">📍 {school.address}</p>
                    )}
                    {school.phone && (
                      <p className="text-muted-foreground">📞 {school.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSchool(school)}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateDelete(school.id, 'school')}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {selectedSchool?.id === school.id && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Add Class Section */}
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded">
                      <h4 className="font-medium mb-2">Add Class</h4>
                      <div className="flex gap-2">
                        <Input
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Class name"
                          className="flex-1"
                        />
                        <Button onClick={() => handleAddClass(school.id)} disabled={!newClassName.trim()}>
                          Add Class
                        </Button>
                      </div>
                    </div>

                    {/* Classes List */}
                    <div className="space-y-3">
                      {school.classes.map((classItem) => {
                        const classTotal = classItem.subjects.reduce((total, subject) => total + (subject.paper_count * subject.amount), 0);
                        
                        return (
                          <div key={classItem.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h5 className="font-medium">{classItem.name}</h5>
                                <p className="text-sm text-primary font-medium">Total: ₹{classTotal.toFixed(2)}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => initiateDelete(classItem.id, 'class')}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>

                            {/* Add Subject Section */}
                            <div className="mb-3 p-3 bg-white dark:bg-slate-600 rounded">
                              <h6 className="font-medium mb-2">Add Subject</h6>
                              <div className="grid grid-cols-4 gap-2">
                                <Input
                                  value={newSubject.name}
                                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Subject name"
                                />
                                <Input
                                  type="number"
                                  value={newSubject.paper_count}
                                  onChange={(e) => setNewSubject(prev => ({ ...prev, paper_count: e.target.value }))}
                                  placeholder="Paper count"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={newSubject.amount}
                                  onChange={(e) => setNewSubject(prev => ({ ...prev, amount: e.target.value }))}
                                  placeholder="Amount"
                                />
                                <Button 
                                  onClick={() => handleAddSubject(classItem.id)}
                                  disabled={!newSubject.name.trim() || !newSubject.paper_count || !newSubject.amount}
                                  size="sm"
                                >
                                  Add
                                </Button>
                              </div>
                            </div>

                            {/* Subjects List */}
                            <div className="space-y-2">
                              {classItem.subjects.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No subjects added</p>
                              ) : (
                                <div className="grid gap-2">
                                  <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground">
                                    <span>Subject</span>
                                    <span>Papers</span>
                                    <span>Amount</span>
                                    <span>Total</span>
                                    <span>Action</span>
                                  </div>
                                  {classItem.subjects.map((subject) => (
                                    <div key={subject.id} className="grid grid-cols-5 gap-2 text-sm p-2 bg-white dark:bg-slate-600 rounded">
                                      <span className="font-medium">{subject.name}</span>
                                      <span>{subject.paper_count}</span>
                                      <span>₹{subject.amount.toFixed(2)}</span>
                                      <span className="font-medium">₹{(subject.paper_count * subject.amount).toFixed(2)}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => initiateDelete(subject.id, 'subject')}
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteType === 'school' ? 'School' : deleteType === 'class' ? 'Class' : 'Subject'}?`}
        description={`Are you sure you want to delete this ${deleteType}? ${deleteType === 'school' ? 'This will also delete all classes and subjects for this school.' : deleteType === 'class' ? 'This will also delete all subjects for this class.' : ''} This action cannot be undone.`}
      />
    </div>
  );
};

export default Papers;
