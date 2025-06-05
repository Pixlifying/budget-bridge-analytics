
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { exportToPDF } from '@/utils/calculateUtils';

interface PapersClass {
  id: string;
  name: string;
  school_name?: string;
  created_at: string;
}

interface PapersSubject {
  id: string;
  class_id: string;
  name: string;
  paper_count: number;
  amount: number;
  created_at: string;
}

interface PapersRecord {
  id: string;
  class_id: string;
  total_amount: number;
  date: string;
  created_at: string;
}

interface ClassWithSubjects extends PapersClass {
  subjects: PapersSubject[];
  records: PapersRecord[];
}

const Papers = () => {
  const [classes, setClasses] = useState<ClassWithSubjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');

  // Dialog states
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'class' | 'subject'>('class');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<PapersClass | null>(null);
  const [editingSubject, setEditingSubject] = useState<PapersSubject | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Form states
  const [classForm, setClassForm] = useState({
    name: '',
    school_name: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    paper_count: 0,
    amount: 0
  });

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: classesData, error: classesError } = await supabase
        .from('papers_classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      const classesWithData = await Promise.all(
        (classesData || []).map(async (classItem) => {
          // Fetch subjects
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('papers_subjects')
            .select('*')
            .eq('class_id', classItem.id)
            .order('created_at', { ascending: false });

          if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
          }

          // Fetch records with date filtering
          let recordsQuery = supabase
            .from('papers_records')
            .select('*')
            .eq('class_id', classItem.id);

          if (viewMode === 'day') {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            recordsQuery = recordsQuery.eq('date', dateStr);
          } else if (viewMode === 'month') {
            const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
            recordsQuery = recordsQuery.gte('date', startDate).lte('date', endDate);
          }

          const { data: recordsData, error: recordsError } = await recordsQuery
            .order('date', { ascending: false });

          if (recordsError) {
            console.error('Error fetching records:', recordsError);
          }

          return {
            ...classItem,
            subjects: subjectsData || [],
            records: recordsData || []
          };
        })
      );

      setClasses(classesWithData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error("Failed to load papers data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleAddClass = async () => {
    try {
      const { data, error } = await supabase
        .from('papers_classes')
        .insert({
          name: classForm.name,
          school_name: classForm.school_name || null,
        })
        .select();

      if (error) throw error;

      toast.success("Class added successfully");
      setShowClassDialog(false);
      setClassForm({ name: '', school_name: '' });
      await fetchClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error("Failed to add class");
    }
  };

  const handleEditClass = async () => {
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from('papers_classes')
        .update({
          name: classForm.name,
          school_name: classForm.school_name || null,
        })
        .eq('id', editingClass.id);

      if (error) throw error;

      toast.success("Class updated successfully");
      setShowClassDialog(false);
      setEditingClass(null);
      setClassForm({ name: '', school_name: '' });
      await fetchClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error("Failed to update class");
    }
  };

  const handleAddSubject = async () => {
    try {
      const { data, error } = await supabase
        .from('papers_subjects')
        .insert({
          class_id: selectedClassId,
          name: subjectForm.name,
          paper_count: subjectForm.paper_count,
          amount: subjectForm.amount,
        })
        .select();

      if (error) throw error;

      // Create a record for this subject
      const { error: recordError } = await supabase
        .from('papers_records')
        .insert({
          class_id: selectedClassId,
          total_amount: subjectForm.amount,
          date: format(new Date(), 'yyyy-MM-dd'),
        });

      if (recordError) {
        console.error('Error creating record:', recordError);
      }

      toast.success("Subject added successfully");
      setShowSubjectDialog(false);
      setSubjectForm({ name: '', paper_count: 0, amount: 0 });
      await fetchClasses();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error("Failed to add subject");
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubject) return;

    try {
      const { error } = await supabase
        .from('papers_subjects')
        .update({
          name: subjectForm.name,
          paper_count: subjectForm.paper_count,
          amount: subjectForm.amount,
        })
        .eq('id', editingSubject.id);

      if (error) throw error;

      toast.success("Subject updated successfully");
      setShowSubjectDialog(false);
      setEditingSubject(null);
      setSubjectForm({ name: '', paper_count: 0, amount: 0 });
      await fetchClasses();
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error("Failed to update subject");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      if (deleteType === 'class') {
        // Delete all subjects first
        const { error: subjectsError } = await supabase
          .from('papers_subjects')
          .delete()
          .eq('class_id', deleteId);

        if (subjectsError) throw subjectsError;

        // Delete all records
        const { error: recordsError } = await supabase
          .from('papers_records')
          .delete()
          .eq('class_id', deleteId);

        if (recordsError) throw recordsError;

        // Delete the class
        const { error: classError } = await supabase
          .from('papers_classes')
          .delete()
          .eq('id', deleteId);

        if (classError) throw classError;

        toast.success("Class deleted successfully");
      } else {
        // Delete subject
        const { error } = await supabase
          .from('papers_subjects')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;

        toast.success("Subject deleted successfully");
      }

      setShowDeleteConfirm(false);
      setDeleteId(null);
      await fetchClasses();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${deleteType}`);
    }
  };

  const openEditClass = (classItem: PapersClass) => {
    setEditingClass(classItem);
    setClassForm({
      name: classItem.name,
      school_name: classItem.school_name || ''
    });
    setShowClassDialog(true);
  };

  const openEditSubject = (subject: PapersSubject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      paper_count: subject.paper_count,
      amount: subject.amount
    });
    setShowSubjectDialog(true);
  };

  const initiateDelete = (id: string, type: 'class' | 'subject') => {
    setDeleteId(id);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const handleDownloadPDF = () => {
    const pdfData = classes.flatMap(classItem =>
      classItem.subjects.map(subject => ({
        class: classItem.name,
        school: classItem.school_name || '',
        subject: subject.name,
        papers: subject.paper_count,
        amount: subject.amount
      }))
    );
    
    exportToPDF(pdfData, 'papers-report');
    toast.success("Papers report downloaded successfully");
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(classItem =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.school_name && classItem.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [classes, searchTerm]);

  const grandTotal = useMemo(() => {
    return classes.reduce((total, classItem) => {
      return total + classItem.records.reduce((recordTotal, record) => recordTotal + record.total_amount, 0);
    }, 0);
  }, [classes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Papers Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by class or school name..."
      >
        <DateRangePicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          mode={viewMode}
          onModeChange={setViewMode}
        />
        
        <Button onClick={handleDownloadPDF} variant="outline">
          <FileText size={16} className="mr-2" />
          Download PDF
        </Button>

        <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingClass(null); setClassForm({ name: '', school_name: '' }); }}>
              <Plus size={16} className="mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="class_name">Class Name *</Label>
                <Input
                  id="class_name"
                  value={classForm.name}
                  onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Class name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={classForm.school_name}
                  onChange={(e) => setClassForm(prev => ({ ...prev, school_name: e.target.value }))}
                  placeholder="School name (optional)"
                />
              </div>
              <Button 
                onClick={editingClass ? handleEditClass : handleAddClass}
                disabled={!classForm.name}
              >
                {editingClass ? 'Update Class' : 'Save Class'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6">
        {/* Grand Total Summary */}
        <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Summary for {viewMode === 'day' ? format(selectedDate, 'dd/MM/yyyy') : format(selectedDate, 'MMMM yyyy')}</h3>
          <p className="text-2xl font-bold text-primary">Grand Total: ₹{grandTotal.toFixed(2)}</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading papers data...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No classes found
            </div>
          ) : (
            filteredClasses.map((classItem) => {
              const classTotal = classItem.records.reduce((total, record) => total + record.total_amount, 0);
              
              return (
                <div key={classItem.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{classItem.name}</h3>
                      {classItem.school_name && (
                        <p className="text-muted-foreground">{classItem.school_name}</p>
                      )}
                      <p className="text-lg font-medium text-primary">
                        Total: ₹{classTotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClassId(classItem.id);
                          setEditingSubject(null);
                          setSubjectForm({ name: '', paper_count: 0, amount: 0 });
                          setShowSubjectDialog(true);
                        }}
                      >
                        <Plus size={14} className="mr-1" />
                        Add Subject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditClass(classItem)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => initiateDelete(classItem.id, 'class')}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Subjects:</h4>
                    {classItem.subjects.length === 0 ? (
                      <p className="text-muted-foreground">No subjects added</p>
                    ) : (
                      classItem.subjects.map((subject) => (
                        <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded">
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Papers: {subject.paper_count} | Amount: ₹{subject.amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditSubject(subject)}
                            >
                              <Edit size={12} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => initiateDelete(subject.id, 'subject')}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject_name">Subject Name *</Label>
              <Input
                id="subject_name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Subject name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paper_count">Paper Count *</Label>
              <Input
                id="paper_count"
                type="number"
                value={subjectForm.paper_count}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, paper_count: Number(e.target.value) }))}
                placeholder="Number of papers"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={subjectForm.amount}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Amount"
              />
            </div>
            <Button 
              onClick={editingSubject ? handleEditSubject : handleAddSubject}
              disabled={!subjectForm.name || subjectForm.paper_count <= 0 || subjectForm.amount <= 0}
            >
              {editingSubject ? 'Update Subject' : 'Save Subject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteType === 'class' ? 'Class' : 'Subject'}?`}
        description={`Are you sure you want to delete this ${deleteType}? ${deleteType === 'class' ? 'This will also delete all subjects and records for this class.' : ''} This action cannot be undone.`}
      />
    </div>
  );
};

export default Papers;
