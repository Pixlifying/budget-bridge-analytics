import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Printer, Pencil, Trash2, Plus, ShieldCheck, CalendarRange, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as pdfjsLib from 'pdfjs-dist';
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
const SCHEME_LABEL: Record<Scheme, string> = {
  PMSBY: 'PMSBY',
  PMJJBY: 'PMJJBY',
  APY: 'APY',
  DLC: 'Digital Life Certificate',
};

interface JSRecord {
  id: string;
  date: string; // yyyy-MM-dd
  scheme: Scheme;
  name: string;
  mobile: string;
  urn: string;
  account: string;
  policy: string;
  ppo?: string;
  remarks: string;
}

type ParsedRecord = Omit<JSRecord, 'id'>;

const emptyForm = (): ParsedRecord => ({
  date: format(new Date(), 'yyyy-MM-dd'),
  scheme: 'PMSBY',
  name: '',
  mobile: '',
  urn: '',
  account: '',
  policy: '',
  ppo: '',
  remarks: '',
});

const DEMO_TEXT = `Pradhan Mantri Suraksha Bima Yojana (PMSBY) - Certificate of Insurance
Name of Member AJAY KUMAR
Date of Birth 02/01/1990
Mobile Number 6005051275
Address RS PURA JAMMU
Unique Reference Number (URN) JNS-PMSBY-26-27-
00405007578-953
Name of Bank J&K BANK
Bank / Post office a/c no. 0025040800601467
Master Policy Number 35120166269200000001
Date of Commencement of Cover 14/08/2026
Cover End Date 31/05/2027`;

const LABELS = [
  'Name of Member', 'Name of the Member', 'Member Name', 'Name of Pensioner', 'Name of Subscriber',
  'Date of Birth', 'DOB', 'Age', 'Gender', 'Mobile Number', 'Mobile No', 'Email',
  'Address', 'Aadhar Number', 'Aadhaar Number', 'Aadhaar', 'Name of Nominee', 'Age of Nominee',
  'Relationship', 'Master Policy Number', 'Master Policy No', 'Insurer', 'Name of Insurance Company',
  'Unique Reference Number', 'URN', 'Name of Bank', 'Bank / Post office a/c no', 'Bank/Post office a/c no',
  'Account Number', 'A/c No', 'Branch Code', 'Branch Name', 'Branch Address', 'IFSC',
  'Date of Commencement of Cover', 'Date of Commencement', 'Cover End Date', 'Sum Assured',
  'Annual Renewal Date', 'Premium Amount', 'Signature', 'PRAN', 'Pension Amount',
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const LABEL_RE = new RegExp('^(?:' + LABELS.map(escape).join('|') + ')\\b', 'i');

const isLabelLine = (line: string) => LABEL_RE.test(line.trim());

// Matches a label appearing *inside* a line (two-column PDFs merge
// "Name of Member RAHUL KUMAR Master Policy Number 3512...").
const INLINE_LABEL_RE = new RegExp(
  '\\s(?:' + LABELS.slice().sort((a, b) => b.length - a.length).map(escape).join('|') + ')\\b',
  'i',
);

/** Trim everything from the next label token onward. */
const cutAtLabel = (value: string) => {
  const m = value.match(INLINE_LABEL_RE);
  return (m && m.index !== undefined ? value.slice(0, m.index) : value).trim();
};

/** Trim everything from the first address / bank token onward. */
const stripAfterAddress = (value: string) => {
  const m = value.match(/\b(?:Address|Add\.?|Branch|Name of Bank|Bank\s*\/|A\/c No|Account Number|IFSC|Mobile)\b/i);
  return m && m.index !== undefined && m.index > 0 ? value.slice(0, m.index).trim() : value.trim();
};

/**
 * Line-aware field extraction. Handles:
 *  - "Label : value" on one line
 *  - two-column layouts where the value sits after the label on the same visual line
 *  - values wrapped onto the following line(s)
 */
const grabLines = (lines: string[], labels: string[], continuation?: RegExp) => {
  for (const label of labels) {
    const re = new RegExp('^' + escape(label) + '\\s*[:.\\-]?\\s*(.*)$', 'i');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const m = line.match(re);
      if (!m) continue;
      let value = m[1].trim();
      value = cutAtLabel(value);
      // value wrapped onto next line(s)
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j].trim();
        if (!next || isLabelLine(next)) break;
        const nextVal = cutAtLabel(next);
        if (!nextVal) break;
        if (!value) {
          value = nextVal;
        } else if (continuation && continuation.test(nextVal)) {
          value += nextVal;
        } else break;
        j++;
        if (nextVal !== next) break;
        if (!continuation) break;
      }
      value = value.replace(/\s{2,}/g, ' ').trim();
      if (value) return value;
    }
  }
  return '';
};

export const parseCertificateText = (raw: string): ParsedRecord | null => {
  const lines = raw
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((l) => l.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);
  const text = lines.join(' ');

  let name = grabLines(lines, [
    'Name of the Member',
    'Name of Member',
    'Member Name',
    'Name of Subscriber',
    'Name of Pensioner',
    'Name',
  ]);
  // guard against picking up headings / insurer names
  if (/CERTIFICATE|YOJANA|INSURANCE|ASSURANCE|COMPANY|LIMITED|BANK/i.test(name)) {
    const clean = name.replace(/.*?(?:CERTIFICATE[^)]*\)|YOJANA\)?)/i, '').trim();
    name = /^[A-Za-z .]{3,}$/.test(clean) ? clean : '';
  }
  name = name.replace(/\bRs\.?\s*[\d.,]+\b/gi, '').replace(/\s{2,}/g, ' ').trim();

  const mobile = (grabLines(lines, ['Mobile Number', 'Mobile No']).match(/\d{10}/) ||
    text.match(/\b[6-9]\d{9}\b/) || [''])[0];

  // URN may wrap across lines -> join continuation fragments, then keep only the policy reference
  let urn = stripAfterAddress(
    grabLines(
      lines,
      ['Unique Reference Number (URN)', 'Unique Reference Number', 'URN'],
      /^[\dA-Z-]{2,}$/,
    ),
  ).replace(/\s+/g, '');
  const urnMatch = (urn || text.replace(/\s+/g, '')).match(/JNS-[A-Z]+-[\dA-Z-]+/i) ||
    urn.match(/[A-Z]{2,5}-[A-Z]{2,8}-[\dA-Z-]{4,}/i);
  urn = (urnMatch ? urnMatch[0] : urn).toUpperCase().replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  if (/[A-Z]{12,}/.test(urn) && !urn.includes('-')) urn = '';

  const accountRaw = grabLines(lines, [
    'Bank / Post office a/c no',
    'Bank/Post office a/c no',
    'Bank / Post office a/c',
    'Account Number',
    'A/c No',
  ]);
  let account = (accountRaw.match(/\d[\d\s-]{8,}/) || [''])[0].replace(/\D/g, '');
  if (!account) {
    const fallback = text.match(/\b\d{11,18}\b/g) || [];
    account = fallback.find((n) => n.length >= 11 && n.length <= 18) || '';
  }
  account = account.slice(0, 20);

  const policy =
    (grabLines(lines, ['Master Policy Number', 'Master Policy No']).match(/[\dA-Z]{6,}/i) || [''])[0] || '';

  const upper = text.toUpperCase();
  let scheme: Scheme = 'PMSBY';
  if (upper.includes('PMJJBY') || upper.includes('JEEVAN JYOTI')) scheme = 'PMJJBY';
  else if (upper.includes('ATAL PENSION') || /\bAPY\b/.test(upper) || upper.includes('PRAN')) scheme = 'APY';
  else if (upper.includes('LIFE CERTIFICATE') || upper.includes('JEEVAN PRAMAAN') || /\bDLC\b/.test(upper)) scheme = 'DLC';
  else if (upper.includes('PMSBY') || upper.includes('SURAKSHA BIMA')) scheme = 'PMSBY';

  const toIso = (d: string) => {
    const m = d.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
  };
  const date =
    toIso(grabLines(lines, ['Date of Commencement of Cover', 'Date of Commencement'])) ||
    toIso(text.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})/)?.[0] || '') ||
    format(new Date(), 'yyyy-MM-dd');

  const ppo = grabLines(lines, ['PPO Number', 'PPO No', 'PPO']).replace(/\s+/g, '');

  if (!name && !urn && !account) return null;
  return { date, scheme, name, mobile, urn, account, policy, ppo, remarks: '' };
};

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
  const [hoverScheme, setHoverScheme] = useState<'all' | Scheme | null>(null);
  const [period, setPeriod] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [search, setSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [editing, setEditing] = useState<JSRecord | null>(null);
  const [form, setForm] = useState<ParsedRecord>(emptyForm());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Hovering a scheme card previews that scheme's data; leaving restores the chosen filter.
  const effectiveFilter = hoverScheme ?? schemeFilter;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 0;
    const from = days ? new Date(now.getTime() - days * 86400000) : null;
    return records
      .filter((r) => effectiveFilter === 'all' || r.scheme === effectiveFilter)
      .filter((r) => !from || new Date(`${r.date}T23:59:59.999`) >= from)
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.urn.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          r.account.toLowerCase().includes(q),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, effectiveFilter, search, period]);

  const counts = useMemo(
    () => SCHEMES.map((s) => ({ scheme: s, count: records.filter((r) => r.scheme === s).length })),
    [records],
  );

  const dedupeKey = (r: Pick<JSRecord, 'urn' | 'name' | 'account'>) =>
    (r.urn || `${r.name}|${r.account}`).replace(/\s+/g, '').toUpperCase();

  const addParsed = (list: ParsedRecord[]) => {
    const existing = new Set(records.map(dedupeKey));
    const fresh: JSRecord[] = [];
    let dupes = 0;
    for (const parsed of list) {
      const key = dedupeKey(parsed);
      if (existing.has(key)) {
        dupes++;
        continue;
      }
      existing.add(key);
      fresh.push({ ...parsed, id: crypto.randomUUID() });
    }
    if (fresh.length) setRecords((prev) => [...fresh, ...prev]);
    return { added: fresh.length, dupes };
  };

  const pdfToText = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let out = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      // Rebuild visual lines using item coordinates so two-column layouts
      // ("Label            VALUE") stay on the same line.
      const rows = new Map<number, { x: number; str: string }[]>();
      for (const item of tc.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5] / 3) * 3; // tolerance for baseline jitter
        const x = item.transform[4];
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y)!.push({ x, str: item.str });
      }
      const lines = [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, items]) =>
          items
            .sort((a, b) => a.x - b.x)
            .map((i) => i.str)
            .join(' ')
            .replace(/\s{2,}/g, ' ')
            .trim(),
        )
        .filter(Boolean);
      out += lines.join('\n') + '\n';
    }
    return out;
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsParsing(true);
    const parsedList: ParsedRecord[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          failed++;
          continue;
        }
        const parsed = parseCertificateText(await pdfToText(file));
        if (parsed) parsedList.push(parsed);
        else failed++;
      } catch (err) {
        console.error(err);
        failed++;
      }
    }
    const { added, dupes } = addParsed(parsedList);
    setIsParsing(false);
    if (fileRef.current) fileRef.current.value = '';
    if (added) toast.success(`${added} record(s) extracted`);
    if (dupes) toast.info(`${dupes} duplicate entry(ies) skipped`);
    if (failed) toast.error(`${failed} file(s) could not be read`);
  };

  const saveForm = () => {
    if (!form.name.trim()) return toast.error('Member name is required');
    if (editing) {
      setRecords((prev) => prev.map((r) => (r.id === editing.id ? { ...editing, ...form } : r)));
      toast.success('Record updated');
      setEditing(null);
    } else {
      const { added, dupes } = addParsed([form]);
      if (!added && dupes) return toast.error('This entry already exists');
      toast.success('Record added');
    }
    setForm(emptyForm());
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    setRecords((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
    toast.success('Record deleted');
  };

  const sendWhatsApp = (r: JSRecord) => {
    const digits = r.mobile.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('No valid mobile number for this record');
      return;
    }
    const to = digits.length === 10 ? '91' + digits : digits;
    const msg =
      r.scheme === 'DLC'
        ? `*Digital Life Certificate*\nName: ${r.name}\nAccount: ${r.account}\nPPO: ${r.ppo || ''}\nRemarks: ${r.remarks || ''}`
        : `*Jan Suraksha - ${r.scheme}*\nName: ${r.name}\nURN: ${r.urn}\nBank A/c: ${r.account}\nMaster Policy No: ${r.policy || ''}\nRemarks: ${r.remarks || ''}`;
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isDlcView = effectiveFilter === 'DLC';

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Jan Suraksha Records</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;font-size:10px}
      h1{text-align:center;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #000;padding:5px;text-align:left}th{background:#f0f0f0}</style></head><body>
      <h1>Jan Suraksha Records</h1>
      <p>Total: ${filtered.length} | Generated: ${format(new Date(), 'dd/MM/yyyy')}</p>
      <table><thead><tr>${
        isDlcView
          ? '<th>#</th><th>Date</th><th>Name</th><th>Account (16 Digits)</th><th>PPO</th><th>Mobile</th><th>Remarks</th>'
          : '<th>#</th><th>Date</th><th>Scheme</th><th>Member Name</th><th>Mobile</th><th>URN</th><th>Bank A/c</th><th>Master Policy No</th><th>Remarks</th>'
      }</tr></thead>
      <tbody>${filtered
        .map((r, i) =>
          isDlcView
            ? `<tr><td>${i + 1}</td><td>${format(new Date(r.date), 'dd/MM/yyyy')}</td><td>${r.name}</td><td>${r.account}</td><td>${r.ppo || ''}</td><td>${r.mobile}</td><td>${r.remarks}</td></tr>`
            : `<tr><td>${i + 1}</td><td>${format(new Date(r.date), 'dd/MM/yyyy')}</td><td>${r.scheme}</td><td>${r.name}</td><td>${r.mobile}</td><td>${r.urn}</td><td>${r.account}</td><td>${r.policy}</td><td>${r.remarks}</td></tr>`,
        )
        .join('')}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <PageWrapper
      title="Jansuraksha Data Extraction Utility"
      subtitle="Supports PMSBY • PMJJBY • APY • Digital Life Certificate (DLC)"
      icon={<ShieldCheck size={20} />}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={isParsing}>
            <Upload size={16} className="mr-2" />
            {isParsing ? 'Extracting…' : 'Browse PDFs & Extract'}
          </Button>
          <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
          <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[180px]">
              <CalendarRange size={16} className="mr-2 shrink-0" />
              <SelectValue placeholder="Report Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="week">Weekly Report</SelectItem>
              <SelectItem value="month">Monthly Report</SelectItem>
              <SelectItem value="year">Yearly Report</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm());
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
          <Card
            key={scheme}
            className="border-border/60 cursor-pointer transition-colors hover:border-primary/40"
            onMouseEnter={() => setHoverScheme(scheme)}
            onMouseLeave={() => setHoverScheme(null)}
          >
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{SCHEME_LABEL[scheme]}</p>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select value={schemeFilter} onValueChange={(v) => setSchemeFilter(v as any)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schemes</SelectItem>
            {SCHEMES.map((s) => (
              <SelectItem key={s} value={s}>
                {SCHEME_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name, mobile, URN or account…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {isDlcView ? (
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Account (16 Digits)</th>
                <th className="p-3 text-left">PPO</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            ) : (
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Scheme</th>
                <th className="p-3 text-left">Member Name</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Unique Reference Number (URN)</th>
                <th className="p-3 text-left">Bank A/c</th>
                <th className="p-3 text-left">Master Policy No</th>
                <th className="p-3 text-left">Remarks</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isDlcView ? 8 : 10} className="p-10 text-center text-muted-foreground">
                  No records yet. Use “Browse PDFs &amp; Extract” to import certificates.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                  {isDlcView ? (
                    <>
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3">{r.account}</td>
                      <td className="p-3">{r.ppo || ''}</td>
                      <td className="p-3">{r.mobile}</td>
                      <td className="p-3">{r.remarks}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{r.scheme}</td>
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3">{r.mobile}</td>
                      <td className="p-3 break-all">{r.urn}</td>
                      <td className="p-3">{r.account}</td>
                      <td className="p-3">{r.policy}</td>
                      <td className="p-3">{r.remarks}</td>
                    </>
                  )}
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                        title="Send WhatsApp"
                        onClick={() => sendWhatsApp(r)}
                      >
                        <MessageCircle size={15} />
                      </Button>
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
                      {SCHEME_LABEL[s]}
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
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <Label>Unique Reference Number (URN)</Label>
              <Input value={form.urn} onChange={(e) => setForm({ ...form, urn: e.target.value })} />
            </div>
            <div>
              <Label>Bank A/c</Label>
              <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
            </div>
            <div>
              <Label>Master Policy No</Label>
              <Input value={form.policy} onChange={(e) => setForm({ ...form, policy: e.target.value })} />
            </div>
            <div>
              <Label>PPO</Label>
              <Input value={form.ppo || ''} onChange={(e) => setForm({ ...form, ppo: e.target.value })} />
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
