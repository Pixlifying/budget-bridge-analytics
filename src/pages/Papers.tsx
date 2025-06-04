
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';

interface PapersClass {
  id: string;
  name: string;
  school_name?: string;
  subjects?: PapersSubject[];
}

interface PapersSubject {
  id: string;
  class_id: string;
  name: string;
  paper_count: number;
  amount: number;
}

const Papers = () => {
  const [classes, setClasses] = useState<PapersClass[]>([]);
  const [subjects, setSubjects] = useState<PapersSubject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editingClassValue, setEditingClassValue] = useState('');

  const fetchClassesAndSubjects = async () => {
    try {
      setLoading(true);
      
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('papers_classes')
        .select('*')
        .order('name');

      if (classesError) throw classesError;

      // Fetch all subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('papers_subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;

      setClasses(classesData || []);
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndSubjects();
  }, []);

  const addClass = async () => {
    try {
      const { error } = await supabase
        .from('papers_classes')
        .insert({ name: `New Class ${classes.length + 1}` });

      if (error) throw error;
      
      toast.success('Class added successfully');
      fetchClassesAndSubjects();
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error('Failed to add class');
    }
  };

  const deleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('papers_classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      
      toast.success('Class deleted successfully');
      fetchClassesAndSubjects();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  const updateClassName = async (classId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('papers_classes')
        .update({ name: newName })
        .eq('id', classId);

      if (error) throw error;
      
      setEditingClass(null);
      fetchClassesAndSubjects();
      toast.success('Class name updated');
    } catch (error) {
      console.error('Error updating class name:', error);
      toast.error('Failed to update class name');
    }
  };

  const addSubject = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('papers_subjects')
        .insert({
          class_id: classId,
          name: 'New Subject',
          paper_count: 0,
          amount: 0
        });

      if (error) throw error;
      
      fetchClassesAndSubjects();
      toast.success('Subject added');
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    }
  };

  // Debounced update function to reduce lag
  const debouncedUpdateSubject = useCallback(
    debounce(async (subjectId: string, updates: Partial<PapersSubject>) => {
      try {
        const { error } = await supabase
          .from('papers_subjects')
          .update(updates)
          .eq('id', subjectId);

        if (error) throw error;
        
        fetchClassesAndSubjects();
      } catch (error) {
        console.error('Error updating subject:', error);
        toast.error('Failed to update subject');
      }
    }, 500),
    []
  );

  const updateSubject = (subjectId: string, updates: Partial<PapersSubject>) => {
    // Immediately update local state for responsive UI
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, ...updates } : s));
    // Debounced database update
    debouncedUpdateSubject(subjectId, updates);
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('papers_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;
      
      fetchClassesAndSubjects();
      toast.success('Subject deleted');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['School/Class', 'Subject', 'Paper Count', 'Amount per Paper', 'Total Amount']
    ];

    classes.forEach(classItem => {
      const classSubjects = subjects.filter(s => s.class_id === classItem.id);
      
      if (classSubjects.length === 0) {
        csvData.push([classItem.name, '-', '0', '0', '0']);
      } else {
        classSubjects.forEach(subject => {
          csvData.push([
            classItem.name,
            subject.name,
            subject.paper_count.toString(),
            subject.amount.toString(),
            (subject.paper_count * subject.amount).toString()
          ]);
        });
      }
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'papers_report.csv';
    link.click();
  };

  const saveRecord = async (classId: string, totalAmount: number) => {
    try {
      const { error } = await supabase
        .from('papers_records')
        .insert({
          class_id: classId,
          total_amount: totalAmount
        });

      if (error) throw error;
      
      toast.success('Record saved successfully');
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Failed to save record');
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassTotal = (classId: string) => {
    return subjects
      .filter(s => s.class_id === classId)
      .reduce((sum, subject) => sum + (subject.paper_count * subject.amount), 0);
  };

  const grandTotal = classes.reduce((sum, classItem) => sum + getClassTotal(classItem.id), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Papers Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search schools/classes..."
      >
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        <Button onClick={addClass} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add School/Class
        </Button>
      </PageHeader>

      {/* Grand Total Summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Grand Total Summary:</span>
            <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Total from {classes.length} schools/classes
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredClasses.map((classItem, index) => {
          const classSubjects = subjects.filter(s => s.class_id === classItem.id);
          const classTotal = getClassTotal(classItem.id);

          return (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {editingClass === classItem.id ? (
                        <Input
                          value={editingClassValue}
                          onChange={(e) => setEditingClassValue(e.target.value)}
                          onBlur={() => updateClassName(classItem.id, editingClassValue)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateClassName(classItem.id, editingClassValue);
                            }
                          }}
                          className="text-lg font-semibold"
                          autoFocus
                        />
                      ) : (
                        <CardTitle 
                          className="cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setEditingClass(classItem.id);
                            setEditingClassValue(classItem.name);
                          }}
                        >
                          {classItem.name}
                          <Edit className="h-4 w-4" />
                        </CardTitle>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">
                      Total: ₹{classTotal.toFixed(2)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => saveRecord(classItem.id, classTotal)}
                    >
                      Save Record
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSubject(classItem.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteClass(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 font-semibold border-b pb-2">
                    <div>Subject</div>
                    <div>Papers</div>
                    <div>Amount per Paper</div>
                    <div>Total Amount</div>
                    <div>Actions</div>
                  </div>
                  
                  {classSubjects.map((subject) => (
                    <div key={subject.id} className="grid grid-cols-5 gap-4 items-center">
                      <Input
                        value={subject.name}
                        onChange={(e) => updateSubject(subject.id, { name: e.target.value })}
                        placeholder="Subject name"
                      />
                      <Input
                        type="number"
                        value={subject.paper_count}
                        onChange={(e) => updateSubject(subject.id, { paper_count: Number(e.target.value) })}
                        placeholder="Paper count"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={subject.amount}
                        onChange={(e) => updateSubject(subject.id, { amount: Number(e.target.value) })}
                        placeholder="Amount per paper"
                      />
                      <div className="font-medium">
                        ₹{(subject.paper_count * subject.amount).toFixed(2)}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {classSubjects.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No subjects added yet. Click the + button to add subjects.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClasses.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-8">
          No schools/classes found. Add a new school/class to get started.
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export default Papers;
