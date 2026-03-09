
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ClipboardList, Printer, Edit, Trash2 } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import DownloadButton from '@/components/ui/DownloadButton';
import { escapeHtml } from '@/lib/sanitize';

interface WorkEntry {
  id: string;
  date: string;
  name: string;
  mobile: string | null;
  service_type: string;
  created_at: string;
  updated_at: string;
}

const SERVICE_TYPES = [
  'Adhar', 'Application', 'Printout', 'Forms', 'Pension Forms',
  'Affidavit', 'PAN Card', 'Passport', 'Banking', 'Documentation', 'Other'
];

const WorkToBe = () => {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    mobile: '',
    service_type: '',
  });

  const [editForm, setEditForm] = useState({
    date: '',
    name: '',
    mobile: '',
    service_type: '',
  });

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_to_be' as any)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching work entries:', error);
      toast.error('Failed to load work entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filteredEntries = entries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || 
           e.service_type.toLowerCase().includes(q) ||
           (e.mobile && e.mobile.includes(q));
  });

  const handleAdd = async () => {
    if (!formData.name || !formData.service_type) {
      toast.error('Please fill in name and service type');
      return;
    }

    try {
      const { error } = await supabase
        .from('work_to_be' as any)
        .insert({
          date: formData.date,
          name: formData.name,
          mobile: formData.mobile || null,
          service_type: formData.service_type,
        } as any);

      if (error) throw error;

      setFormData({ date: new Date().toISOString().split('T')[0], name: '', mobile: '', service_type: '' });
      toast.success('Work entry added successfully');
      fetchEntries();
    } catch (error) {
      console.error('Error adding work entry:', error);
      toast.error('Failed to add work entry');
    }
  };

  const handleEdit = async () => {
    if (!editingEntry) return;
    try {
      const { error } = await supabase
        .from('work_to_be' as any)
        .update({
          date: editForm.date,
          name: editForm.name,
          mobile: editForm.mobile || null,
          service_type: editForm.service_type,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', editingEntry.id);

      if (error) throw error;

      setEditingEntry(null);
      toast.success('Work entry updated');
      fetchEntries();
    } catch (error) {
      console.error('Error updating work entry:', error);
      toast.error('Failed to update work entry');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('work_to_be' as any)
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setDeleteId(null);
      toast.success('Work entry deleted');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting work entry:', error);
      toast.error('Failed to delete work entry');
    }
  };

  const openEdit = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: entry.date,
      name: entry.name,
      mobile: entry.mobile || '',
      service_type: entry.service_type,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Work To Be Report</title>
      <style>@page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;font-size:12px}
      h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #000;padding:8px;text-align:left;font-size:10px}
      th{background:#f5f5f5;font-weight:bold}</style></head><body>
      <h1>Work To Be Report</h1><table><thead><tr><th>Date</th><th>Name</th><th>Mobile</th><th>Service Type</th></tr></thead><tbody>
      ${filteredEntries.map(e => `<tr><td>${escapeHtml(e.date)}</td><td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.mobile || '-')}</td><td>${escapeHtml(e.service_type)}</td></tr>`).join('')}
      </tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <PageWrapper
      title="Work To Be"
      subtitle="Track pending work items"
      icon={<ClipboardList size={24} />}
      action={
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[180px] h-9"
          />
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer size={16} className="mr-2" /> Print
          </Button>
          <DownloadButton data={entries} filename="work-to-be" currentData={filteredEntries} />
        </div>
      }
    >
      {/* Add Form */}
      <div className="mb-6 p-4 bg-card rounded-lg shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-4">Add Work Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <Label htmlFor="w_date">Date</Label>
            <Input id="w_date" type="date" value={formData.date}
              onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="w_name">Name</Label>
            <Input id="w_name" value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Customer name" />
          </div>
          <div>
            <Label htmlFor="w_mobile">Mobile</Label>
            <Input id="w_mobile" value={formData.mobile}
              onChange={(e) => setFormData(p => ({ ...p, mobile: e.target.value }))}
              placeholder="Mobile number" />
          </div>
          <div>
            <Label htmlFor="w_service">Service Type</Label>
            <Select value={formData.service_type}
              onValueChange={(v) => setFormData(p => ({ ...p, service_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd}>Save</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12"><p>Loading...</p></div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Work Entries</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add a new work entry to get started.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.mobile || '-'}</TableCell>
                  <TableCell>{entry.service_type}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Work Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={editForm.date}
                onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={editForm.name}
                onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Mobile</Label>
              <Input value={editForm.mobile}
                onChange={(e) => setEditForm(p => ({ ...p, mobile: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Service Type</Label>
              <Select value={editForm.service_type}
                onValueChange={(v) => setEditForm(p => ({ ...p, service_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEdit}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Work Entry"
        description="Are you sure you want to delete this work entry?"
      />
    </PageWrapper>
  );
};

export default WorkToBe;
