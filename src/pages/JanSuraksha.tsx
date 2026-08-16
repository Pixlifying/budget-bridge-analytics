import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Printer, Download, Pencil, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

const STORAGE_KEY = 'jan-suraksha-records';
const SCHEMES = ['PMSBY', 'PMJJBY', 'APY', 'DLC'] as const;
type Scheme = (typeof SCHEMES)[number];

interface JSRecord {
  id: string;
  date: string; // yyyy-MM-dd
  scheme: Scheme;
  name: string;
  urn: string;
  account: string;
  remarks: string;
}

const emptyForm = (): Omit<JSRecord, 'id'> => ({
  date: format(new Date(), 'yyyy-MM-dd'),
  scheme: 'PMSBY',
  name: '',
  urn: '',
  account: '',
  remarks: '',
});

const JanSuraksha = () => {
  const [records, setRecords] = useState<JSRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as JSRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [schemeFilter, setSchemeFilter] = useState<'all' | Scheme>('all');
  const [search, setSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [editing, setEditing] = useState<JSRecord | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((r) => schemeFilter === 'all' || r.scheme === schemeFilter)
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.urn.toLowerCase().includes(q) ||
          r.account.toLowerCase().includes(q),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, schemeFilter, search]);

  const counts = useMemo(
    () => SCHEMES.map((s) => ({ scheme: s, count: records.filter((r) => r.scheme === s).length })),
    [records],
  );

  const dedupeKey = (r: Pick<JSRecord, 'urn' | 'name' | 'account'>) =>
    (r.urn || `${r.name}|${r.account}`).replace(/\s+/g, '').toUpperCase();

  const parsePdf = async (file: File): Promise<Omit<JSRecord, 'id'> | null> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      fullText += ' ' + (tc.items as any[]).map((i) => i.str).join(' ');
    }
    const text = fullText.replace(/\s+/g, ' ').trim();

    const NEXT =
      '(?:Date of Birth|Mobile Number|Address\\b|Aadhar Number|Aadhaar|Name of Nominee|Age of Nominee|Master Policy Number|Insurer|Unique Reference Number|Name of Bank|Bank\\s*/\\s*Post office a\\/c no|Branch Code|Branch Address|Date of Commencement|Cover End Date|Sum Assured|Annual Renewal|Premium Amount|Signature|$)';
    const grab = (labelRe: RegExp) => {
      const m = text.match(new RegExp(labelRe.source + '\\s*:?\\s*(.+?)\\s*(?=' + NEXT + ')', 'i'));
      return m ? m[1].trim().replace(/\s{2,}/g, ' ') : '';
    };

    const name = grab(/Name of (?:the )?Member|Member Name|Name of Pensioner/i);
    const urn = grab(/Unique Reference Number\s*(?:\(URN\))?|URN/i)
      .replace(/\s+/g, '')
      .replace(/-+/g, '-')
      .replace(/(\d{6,})-(\d+)/g, '$1$2')
      .replace(/^-|-$/g, '');
    const accountRaw = grab(/Bank\s*\/\s*Post office a\/c no\.?|Account Number|A\/c No\.?/i);
    const account = (accountRaw.match(/[\d\s-]+/)?.[0] || '').replace(/\D/g, '').slice(0, 20);

    const upper = (urn + ' ' + text).toUpperCase();
    let scheme: Scheme = 'PMSBY';
    if (upper.includes('PMJJBY') || upper.includes('PMJJY') || upper.includes('JEEVAN JYOTI')) scheme = 'PMJJBY';
    else if (upper.includes('ATAL PENSION') || /\bAPY\b/.test(upper)) scheme = 'APY';
    else if (upper.includes('LIFE CERTIFICATE') || upper.includes('JEEVAN PRAMAAN') || /\bDLC\b/.test(upper))
      scheme = 'DLC';

    // Certificate date if present, else today
    const dateMatch = text.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
    const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : format(new Date(), 'yyyy-MM-dd');

    if (!name && !urn && !account) return null;
    return { date, scheme, name, urn, account, remarks: '' };
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsParsing(true);
    let added = 0;
    let dupes = 0;
    let failed = 0;
    const existing = new Set(records.map(dedupeKey));
    const fresh: JSRecord[] = [];

    for (const file of files) {
      try {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          failed++;
          continue;
        }
        const parsed = await parsePdf(file);
        if (!parsed) {
          failed++;
          continue;
        }
        const key = dedupeKey(parsed);
        if (existing.has(key)) {
          dupes++;
          continue;
        }
        existing.add(key);
        fresh.push({ ...parsed, id: crypto.randomUUID() });
        added++;
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    if (fresh.length) setRecords((prev) => [...fresh, ...prev]);
    setIsParsing(false);
    if (fileRef.current) fileRef.current.value = '';

    if (added) toast.success(`${added} record(s) extracted`);
    if (dupes) toast.info(`${dupes} duplicate file(s) skipped`);
    if (failed) toast.error(`${failed} file(s) could not be read`);
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditing(null);
  };

  const saveForm = () => {
    if (!form.name.trim()) {
      toast.error('Member name is required');
      return;
    }
    if (editing) {
      setRecords((prev) => prev.map((r) => (r.id === editing.id ? { ...editing, ...form } : r)));
      toast.success('Record updated');
      setEditing(null);
    } else {
      const key = dedupeKey(form);
      if (records.some((r) => dedupeKey(r) === key)) {
        toast.error('This entry already exists');
        return;
      }
      setRecords((prev) => [{ ...form, id: crypto.randomUUID() }, ...prev]);
      toast.success('Record added');
    }
    setForm(emptyForm());
    setDialogOpen(false);
  };

  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
    toast.success('Record deleted');
  };

  const handleExport = () => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      Date: format(new Date(r.date), 'dd/MM/yyyy'),
      Scheme: r.scheme,
      'Member Name': r.name,
      URN: r.urn,
      'Account No.': r.account,
      Remarks: r.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jan Suraksha');
    XLSX.writeFile(wb, `jan-suraksha-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Jan Suraksha Records</title>
      <style>@page{size:A4 landscape;margin:15mm}body{font-family:Arial,sans-serif;font-size:11px}
      h1{text-align:center;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #000;padding:6px;text-align:left}th{background:#f0f0f0}</style></head><body>
      <h1>Jan Suraksha Records</h1>
      <p>Total: ${filtered.length} | Generated: ${format(new Date(), 'dd/MM/yyyy')}</p>
      <table><thead><tr><th>#</th><th>Date</th><th>Scheme</th><th>Member Name</th><th>URN</th><th>Account No.</th><th>Remarks</th></tr></thead>
      <tbody>${filtered
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${format(new Date(r.date), 'dd/MM/yyyy')}</td><td>${r.scheme}</td><td>${r.name}</td><td>${r.urn}</td><td>${r.account}</td><td>${r.remarks}</td></tr>`,
        )
        .join('')}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <PageWrapper
      title="Jan Suraksha"
      subtitle="PMSBY • PMJJBY • APY • Digital Life Certificate — automated PDF extraction"
      icon={<ShieldCheck size={20} />}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={isParsing}>
            <Upload size={16} className="mr-2" />
            {isParsing ? 'Extracting…' : 'Browse PDF & Extract'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              openAdd();
              setDialogOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Row
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {counts.map(({ scheme, count }) => (
          <Card key={scheme} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{scheme}</p>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select value={schemeFilter} onValueChange={(v) => setSchemeFilter(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schemes</SelectItem>
            {SCHEMES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name, URN or account…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Scheme</th>
              <th className="p-3 text-left">Member Name</th>
              <th className="p-3 text-left">Unique Reference Number (URN)</th>
              <th className="p-3 text-left">Account No.</th>
              <th className="p-3 text-left">Remarks</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground">
                  No Jan Suraksha data available. Use “Browse PDF &amp; Extract” to import certificates.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                  <td className="p-3">{r.scheme}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 break-all">{r.urn}</td>
                  <td className="p-3">{r.account}</td>
                  <td className="p-3">{r.remarks}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(r);
                          const { id, ...rest } = r;
                          setForm(rest);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Record' : 'Add Record'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Scheme</Label>
              <Select value={form.scheme} onValueChange={(v) => setForm({ ...form, scheme: v as Scheme })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Member Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Unique Reference Number (URN)</Label>
              <Input value={form.urn} onChange={(e) => setForm({ ...form, urn: e.target.value })} />
            </div>
            <div>
              <Label>Account No.</Label>
              <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
            </div>
            <div>
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveForm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Record"
        description="Do you want to delete this Jan Suraksha record? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default JanSuraksha;
