import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash2, MessageCircle, Printer, Upload, Search, ArrowDownCircle, ArrowUpCircle, User, Phone, IndianRupee } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/calculateUtils';
import useLocalStorage from '@/hooks/useLocalStorage';

interface KEntry {
  id: string;
  date: string;
  type: 'debit' | 'credit'; // debit = You Gave, credit = You Got
  amount: number;
  note?: string;
}

interface KCustomer {
  id: string;
  name: string;
  phone: string;
  entries: KEntry[];
  created_at: string;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const seed = (): KCustomer[] => [
  {
    id: uid(),
    name: 'Aarif Ahmad',
    phone: '9876543210',
    created_at: new Date().toISOString(),
    entries: [
      { id: uid(), date: format(new Date(Date.now() - 86400000 * 5), 'yyyy-MM-dd'), type: 'debit', amount: 5000, note: 'Supply' },
      { id: uid(), date: format(new Date(Date.now() - 86400000 * 2), 'yyyy-MM-dd'), type: 'credit', amount: 2000, note: 'Cash received' },
    ],
  },
  {
    id: uid(),
    name: 'Suhail Khan',
    phone: '9123456780',
    created_at: new Date().toISOString(),
    entries: [
      { id: uid(), date: format(new Date(Date.now() - 86400000 * 3), 'yyyy-MM-dd'), type: 'debit', amount: 1500, note: 'Recharge' },
    ],
  },
];

const KhataEntry = () => {
  const [customers, setCustomers] = useLocalStorage<KCustomer[]>('khata_entry_customers_v1', seed());
  const [selectedId, setSelectedId] = useState<string | null>(customers[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [newCust, setNewCust] = useState({ name: '', phone: '' });
  const [form, setForm] = useState<{ type: 'debit' | 'credit'; amount: string; note: string; date: string }>({
    type: 'debit',
    amount: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [customers, search]
  );

  const selected = customers.find(c => c.id === selectedId) || null;

  const balanceOf = (c: KCustomer) =>
    c.entries.reduce((s, e) => s + (e.type === 'debit' ? e.amount : -e.amount), 0);

  const totals = useMemo(() => {
    let gave = 0, got = 0;
    customers.forEach(c => c.entries.forEach(e => {
      if (e.type === 'debit') gave += e.amount; else got += e.amount;
    }));
    return { gave, got, net: gave - got };
  }, [customers]);

  const addCustomer = () => {
    if (!newCust.name.trim()) return toast.error('Enter name');
    const c: KCustomer = { id: uid(), name: newCust.name.trim(), phone: newCust.phone.trim(), entries: [], created_at: new Date().toISOString() };
    setCustomers([c, ...customers]);
    setSelectedId(c.id);
    setNewCust({ name: '', phone: '' });
    toast.success('Customer added');
  };

  const deleteCustomer = (id: string) => {
    if (!confirm('Delete this customer and all entries?')) return;
    const next = customers.filter(c => c.id !== id);
    setCustomers(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const addEntry = () => {
    if (!selected) return toast.error('Select a customer');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter valid amount');
    const e: KEntry = { id: uid(), date: form.date, type: form.type, amount: amt, note: form.note.trim() };
    setCustomers(customers.map(c => c.id === selected.id ? { ...c, entries: [e, ...c.entries] } : c));
    setForm({ ...form, amount: '', note: '' });
    toast.success(form.type === 'debit' ? 'You Gave saved' : 'You Got saved');
  };

  const deleteEntry = (eid: string) => {
    if (!selected) return;
    setCustomers(customers.map(c => c.id === selected.id ? { ...c, entries: c.entries.filter(e => e.id !== eid) } : c));
  };

  const buildMessage = (c: KCustomer) => {
    const bal = balanceOf(c);
    const status = bal > 0 ? `You need to pay ₹${bal.toLocaleString('en-IN')}` : bal < 0 ? `Advance balance ₹${Math.abs(bal).toLocaleString('en-IN')}` : `All settled ✅`;
    const lines = [
      `*KHIDMAT CENTER — Khata Statement*`,
      `Customer: ${c.name}`,
      `Date: ${format(new Date(), 'dd MMM yyyy')}`,
      ``,
      `Recent Entries:`,
      ...c.entries.slice(0, 6).map(e => `• ${format(new Date(e.date), 'dd/MM')} — ${e.type === 'debit' ? 'Debit' : 'Credit'} ₹${e.amount.toLocaleString('en-IN')}${e.note ? ' (' + e.note + ')' : ''}`),
      ``,
      `Total Debit: ₹${c.entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}`,
      `Total Credit: ₹${c.entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}`,
      ``,
      `*${status}*`,
      ``,
      `Thank you 🙏`,
    ];
    return lines.join('\n');
  };

  const sendWhatsApp = (c: KCustomer) => {
    if (!c.phone) return toast.error('No phone number');
    const raw = c.phone.replace(/\D/g, '');
    const phone = raw.length === 10 ? '91' + raw : raw;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(c))}`;
    window.open(url, '_blank');
  };

  const printStatement = (c: KCustomer) => {
    const bal = balanceOf(c);
    const totalDebit = c.entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    const totalCredit = c.entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
    const rows = [...c.entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => `<tr>
        <td>${format(new Date(e.date), 'dd/MM/yyyy')}</td>
        <td>${e.note || '-'}</td>
        <td style="text-align:right;color:#b91c1c">${e.type === 'debit' ? '₹' + e.amount.toLocaleString('en-IN') : ''}</td>
        <td style="text-align:right;color:#047857">${e.type === 'credit' ? '₹' + e.amount.toLocaleString('en-IN') : ''}</td>
      </tr>`).join('');
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Khata — ${c.name}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#111}
        h1{margin:0;font-size:22px;text-align:center;letter-spacing:1px}
        .sub{text-align:center;color:#555;margin-bottom:16px;font-size:12px}
        .meta{display:flex;justify-content:space-between;border:1px solid #ddd;padding:10px;border-radius:8px;margin-bottom:12px;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#f3f4f6;text-align:left}
        tfoot td{font-weight:bold;background:#fafafa}
        .balance{margin-top:14px;text-align:right;font-size:16px;font-weight:bold}
        .pos{color:#b91c1c}.neg{color:#047857}
        @media print{@page{size:A4;margin:12mm} button{display:none}}
      </style></head><body>
      <h1>KHIDMAT CENTER</h1>
      <div class="sub">Digital Khata Statement</div>
      <div class="meta">
        <div><b>Customer:</b> ${c.name}<br/><b>Phone:</b> ${c.phone || '-'}</div>
        <div style="text-align:right"><b>Date:</b> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Details</th><th style="text-align:right">Debit (You Gave)</th><th style="text-align:right">Credit (You Got)</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#888">No entries</td></tr>'}</tbody>
        <tfoot><tr><td colspan="2">Totals</td>
          <td style="text-align:right;color:#b91c1c">₹${totalDebit.toLocaleString('en-IN')}</td>
          <td style="text-align:right;color:#047857">₹${totalCredit.toLocaleString('en-IN')}</td></tr></tfoot>
      </table>
      <div class="balance ${bal > 0 ? 'pos' : 'neg'}">
        ${bal > 0 ? 'Balance Due: ₹' + bal.toLocaleString('en-IN') : bal < 0 ? 'Advance: ₹' + Math.abs(bal).toLocaleString('en-IN') : 'Settled'}
      </div>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`);
    w.document.close();
  };

  const onFile = async (f: File) => {
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
      if (!rows.length) return toast.error('Empty sheet');
      const norm = (k: string) => k.toLowerCase().replace(/[^a-z]/g, '');
      const grouped: Record<string, KCustomer> = {};
      customers.forEach(c => { grouped[c.name.toLowerCase() + '|' + (c.phone || '')] = { ...c, entries: [...c.entries] }; });
      let added = 0;
      for (const r of rows) {
        const obj: any = {};
        Object.keys(r).forEach(k => { obj[norm(k)] = r[k]; });
        const name = String(obj.name || obj.customer || obj.customername || '').trim();
        const phone = String(obj.phone || obj.mobile || obj.mobileno || '').trim();
        const debit = parseFloat(obj.debit || obj.yougave || obj.given || 0) || 0;
        const credit = parseFloat(obj.credit || obj.yougot || obj.received || 0) || 0;
        const note = String(obj.note || obj.description || obj.remarks || '').trim();
        const dateRaw = obj.date;
        let date = format(new Date(), 'yyyy-MM-dd');
        if (dateRaw) {
          const d = typeof dateRaw === 'number' ? new Date(Math.round((dateRaw - 25569) * 86400 * 1000)) : new Date(dateRaw);
          if (!isNaN(d.getTime())) date = format(d, 'yyyy-MM-dd');
        }
        if (!name) continue;
        const key = name.toLowerCase() + '|' + phone;
        if (!grouped[key]) grouped[key] = { id: uid(), name, phone, entries: [], created_at: new Date().toISOString() };
        if (debit > 0) { grouped[key].entries.unshift({ id: uid(), date, type: 'debit', amount: debit, note }); added++; }
        if (credit > 0) { grouped[key].entries.unshift({ id: uid(), date, type: 'credit', amount: credit, note }); added++; }
      }
      setCustomers(Object.values(grouped));
      toast.success(`Imported ${added} entries`);
    } catch (e: any) {
      toast.error('Import failed: ' + e.message);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Name: 'Sample Person', Phone: '9999999999', Date: format(new Date(), 'yyyy-MM-dd'), Debit: 500, Credit: 0, Note: 'Opening' },
      { Name: 'Sample Person', Phone: '9999999999', Date: format(new Date(), 'yyyy-MM-dd'), Debit: 0, Credit: 200, Note: 'Received' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Khata');
    XLSX.writeFile(wb, 'khata-template.xlsx');
  };

  return (
    <PageWrapper title="Khata Entry" subtitle="Digital ledger — Debit / Credit with WhatsApp & Print" action={
      <div className="flex flex-wrap gap-2 items-center">
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1" /> Browse Excel
        </Button>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>Template</Button>
      </div>
    }>
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Customers</div><div className="text-2xl font-bold">{customers.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">You Gave (Debit)</div><div className="text-2xl font-bold text-rose-600">{formatCurrency(totals.gave)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">You Got (Credit)</div><div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.got)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Net Balance</div><div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(Math.abs(totals.net))}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Customers panel */}
        <Card className="p-3 flex flex-col max-h-[75vh]">
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-2 top-3 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
            <Input placeholder="Name" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} />
            <Input placeholder="Phone" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
            <Button size="icon" onClick={addCustomer}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
            {filtered.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No customers</div>}
            {filtered.map(c => {
              const bal = balanceOf(c);
              const active = c.id === selectedId;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${active ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-muted/50 border-transparent'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{c.name}</div>
                      {c.phone && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                    </div>
                    <div className={`text-xs font-bold whitespace-nowrap ${bal > 0 ? 'text-rose-600' : bal < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {bal === 0 ? '—' : (bal > 0 ? '+' : '') + formatCurrency(Math.abs(bal))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Ledger panel */}
        <Card className="p-4 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground py-20">
              Select or add a customer to start
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b mb-3">
                <div>
                  <div className="text-lg font-bold">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.phone || 'No phone'} · Since {format(new Date(selected.created_at), 'dd MMM yyyy')}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => printStatement(selected)}><Printer className="w-4 h-4 mr-1" />Print</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => sendWhatsApp(selected)}>
                    <MessageCircle className="w-4 h-4 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCustomer(selected.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              {(() => {
                const bal = balanceOf(selected);
                return (
                  <div className={`p-3 rounded-xl mb-3 text-center font-semibold ${bal > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30' : bal < 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-muted'}`}>
                    {bal > 0 ? `You will get ${formatCurrency(bal)}` : bal < 0 ? `You will give ${formatCurrency(Math.abs(bal))}` : 'All settled'}
                  </div>
                );
              })()}

              <Tabs value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })} className="mb-3">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="debit" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                    <ArrowUpCircle className="w-4 h-4 mr-1" /> You Gave (Debit)
                  </TabsTrigger>
                  <TabsTrigger value="credit" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <ArrowDownCircle className="w-4 h-4 mr-1" /> You Got (Credit)
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={form.type} className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[130px_140px_1fr_auto] gap-2">
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 absolute left-2 top-3 text-muted-foreground" />
                      <Input className="pl-7" type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <Input placeholder="Note (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    <Button onClick={addEntry} className={form.type === 'debit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
                      <Plus className="w-4 h-4 mr-1" />Save
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Note</th>
                      <th className="p-2 text-right text-rose-600">Debit</th>
                      <th className="p-2 text-right text-emerald-600">Credit</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.entries.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No entries yet</td></tr>
                    )}
                    {selected.entries.map(e => (
                      <tr key={e.id} className="border-t hover:bg-muted/30">
                        <td className="p-2">{format(new Date(e.date), 'dd/MM/yyyy')}</td>
                        <td className="p-2">{e.note || '-'}</td>
                        <td className="p-2 text-right text-rose-600 font-medium">{e.type === 'debit' ? formatCurrency(e.amount) : ''}</td>
                        <td className="p-2 text-right text-emerald-600 font-medium">{e.type === 'credit' ? formatCurrency(e.amount) : ''}</td>
                        <td className="p-2 text-right">
                          <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">WhatsApp Message Preview</Label>
                <Textarea readOnly value={buildMessage(selected)} className="mt-1 font-mono text-xs h-40" />
              </div>
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default KhataEntry;