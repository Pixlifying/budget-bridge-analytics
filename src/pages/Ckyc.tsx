import { FormEvent, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Printer, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import PageSkeleton from '@/components/ui/PageSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { escapeHtml } from '@/lib/sanitize';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CkycRecord {
  id: string;
  record_date: string;
  account_number: string;
  name: string;
  address: string;
  mobile_number: string | null;
  created_at: string;
  updated_at: string;
}

interface CkycForm {
  record_date: string;
  account_number: string;
  name: string;
  address: string;
  mobile_number: string;
}

const createEmptyForm = (): CkycForm => ({
  record_date: format(new Date(), 'yyyy-MM-dd'),
  account_number: '',
  name: '',
  address: '',
  mobile_number: '',
});

const sortRecords = (items: CkycRecord[]) =>
  [...items].sort(
    (a, b) =>
      b.record_date.localeCompare(a.record_date) ||
      b.created_at.localeCompare(a.created_at),
  );

const displayDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd-MM-yyyy');
};

const Ckyc = () => {
  const [records, setRecords] = useState<CkycRecord[]>([]);
  const [form, setForm] = useState<CkycForm>(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CkycRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;

    const loadRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('ckyc_records')
          .select('*')
          .order('record_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (active) setRecords(data ?? []);
      } catch (error) {
        console.error('Unable to load CKYC records:', error);
        if (active) toast.error('Unable to load CKYC records.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRecords();
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const payload = {
      record_date: form.record_date,
      account_number: form.account_number.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      mobile_number: form.mobile_number.trim() || null,
    };

    if (!payload.account_number || !payload.name || !payload.address) {
      toast.error('Enter the account number, name, and address.');
      return;
    }

    setSaving(true);
    try {
      let savedRecord: CkycRecord;

      if (editingId) {
        const { data, error } = await supabase
          .from('ckyc_records')
          .update(payload)
          .eq('id', editingId)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('No updated CKYC record was returned.');
        savedRecord = data;
        setRecords((current) =>
          sortRecords(current.map((record) => (record.id === editingId ? savedRecord : record))),
        );
        toast.success('CKYC record updated.');
      } else {
        const { data, error } = await supabase
          .from('ckyc_records')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('No CKYC record was returned.');
        savedRecord = data;
        setRecords((current) => sortRecords([savedRecord, ...current]));
        toast.success('CKYC record saved.');
      }

      resetForm();
    } catch (error) {
      console.error('Unable to save CKYC record:', error);
      toast.error('Unable to save the CKYC record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (record: CkycRecord) => {
    setEditingId(record.id);
    setForm({
      record_date: record.record_date,
      account_number: record.account_number,
      name: record.name,
      address: record.address,
      mobile_number: record.mobile_number ?? '',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('ckyc_records')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setRecords((current) => current.filter((record) => record.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      toast.success('CKYC record deleted.');
    } catch (error) {
      console.error('Unable to delete CKYC record:', error);
      toast.error('Unable to delete the CKYC record. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    if (records.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups to print CKYC records.');
      return;
    }

    const rows = sortRecords(records)
      .map(
        (record) => `
          <tr>
            <td>${escapeHtml(displayDate(record.record_date))}</td>
            <td>${escapeHtml(record.account_number)}</td>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.address)}</td>
            <td>${escapeHtml(record.mobile_number || '—')}</td>
          </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CKYC Records</title>
          <style>
            @page { size: A4 landscape; margin: 14mm; }
            body { font-family: Arial, sans-serif; color: CanvasText; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid currentColor; padding: 7px; text-align: left; vertical-align: top; }
            th { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>CKYC Records</h1>
          <table>
            <thead>
              <tr><th>Date</th><th>Account Number</th><th>Name</th><th>Address</th><th>Mobile Number</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  };

  if (loading) return <PageSkeleton type="table" />;

  return (
    <PageWrapper
      title="CKYC"
      subtitle="Customer records"
      action={(
        <Button onClick={handlePrint} disabled={records.length === 0} className="gap-2">
          <Printer size={16} />
          Print
        </Button>
      )}
    >
      <section ref={formRef} className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {editingId ? 'Edit CKYC record' : 'New CKYC record'}
          </h2>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="gap-2">
              <X size={16} />
              Cancel edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-1">
            <Label htmlFor="ckyc-date">Date</Label>
            <Input
              id="ckyc-date"
              type="date"
              required
              value={form.record_date}
              onChange={(event) => setForm((current) => ({ ...current, record_date: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="ckyc-account">Account Number</Label>
            <Input
              id="ckyc-account"
              required
              value={form.account_number}
              onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="ckyc-name">Name</Label>
            <Input
              id="ckyc-name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <Label htmlFor="ckyc-mobile">Mobile Number (optional)</Label>
            <Input
              id="ckyc-mobile"
              type="tel"
              value={form.mobile_number}
              onChange={(event) => setForm((current) => ({ ...current, mobile_number: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <Label htmlFor="ckyc-address">Address</Label>
            <Textarea
              id="ckyc-address"
              required
              rows={2}
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Record'}
            </Button>
          </div>
        </form>
      </section>

      <section aria-label="Saved CKYC records">
        {records.length === 0 ? (
          <EmptyState
            icon="data"
            title="No CKYC records yet"
            description="Saved records will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortRecords(records).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">{displayDate(record.record_date)}</TableCell>
                      <TableCell className="font-medium">{record.account_number}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell className="max-w-sm whitespace-normal">{record.address}</TableCell>
                      <TableCell>{record.mobile_number || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit CKYC record for ${record.name}`}
                            title="Edit record"
                            onClick={() => startEditing(record)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete CKYC record for ${record.name}`}
                            title="Delete record"
                            onClick={() => setDeleteTarget(record)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this CKYC record?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm the record details below. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="break-words font-medium text-foreground">{displayDate(deleteTarget.record_date)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Account Number</dt>
                <dd className="break-words font-medium text-foreground">{deleteTarget.account_number}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="break-words font-medium text-foreground">{deleteTarget.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mobile Number</dt>
                <dd className="break-words font-medium text-foreground">{deleteTarget.mobile_number || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="break-words font-medium text-foreground">{deleteTarget.address}</dd>
              </div>
            </dl>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default Ckyc;