import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, MessageCircle, Save, X, ClipboardList } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ChecklistService {
  id: string;
  name: string;
  documents: string;
}

const STORAGE_KEY = 'document_checklist_v1';

const DEFAULT_SERVICES: ChecklistService[] = [
  { id: 's-pan-fresh', name: 'Pan Card - Fresh', documents: 'Adhar Card\nPhotographs (2 Nos)' },
  { id: 's-pan-lost', name: 'Pan Card - Lost', documents: 'Pan Number\nAdhar Card\nPhotographs (2 Nos)' },
  { id: 's-passport-fresh', name: 'Passport - Fresh', documents: 'Adhar Card\nPan Card\n10th Class Marksheet\nBirth Certificate' },
  { id: 's-passport-old', name: 'Passport - Renewal/Old', documents: 'Adhar Card\nOld Passport\nPan Card\nRation Card' },
  { id: 's-ayushman-new', name: 'Ayushman Card - New', documents: 'Adhar Card\nRation Card' },
  { id: 's-ayushman-kyc', name: 'Ayushman Card - KYC', documents: 'Adhar Card\nRation Card\nAyushman Card' },
  { id: 's-income', name: 'Income Certificate', documents: 'Adhar Card (Daughter/Father)\nRation Card\nStatement of Saving Account (1 year)\nAffidavit attested by Notary' },
  { id: 's-ladli', name: 'Ladli Beti Form', documents: 'Adhar Card (Mother/Father/Daughter)\nBirth Certificate\nPhotographs (Mother/Father/Daughter)\nRation Card\nIncome Certificate\nBank Account of Ladli Beti\nPan Card (Father/Mother)\nDomicile Certificate\nVoter Card (Father)\n(All documents should be original)' },
  { id: 's-birth', name: 'Birth Certificate (Newborn)', documents: 'Adhar Card (Father/Mother)\nRation Card\nDischarge Certificate from Hospital' },
  { id: 's-marriage', name: 'Marriage Certificate', documents: 'BRIDE:\nRation Card\nWitness Identity Proof - Aadhar Card (Father/Mother)\nWitness Address Proof - Aadhar Card (Father/Mother)\nAddress Proof - Ration Card\nIdentity Proof - Aadhar Card\nDate of Birth - School Marksheet\n\nGROOM:\nAddress Proof - Domicile Certificate\nIdentity Proof - Aadhar Card\nWitness Identity Proof - Aadhar Card (Father/Mother)\nWitness Address Proof - Aadhar Card (Father/Mother)\nDate of Birth - School Marksheet\nMarriage Card' },
  { id: 's-pension-old', name: 'Pension - Old Age', documents: 'Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO' },
  { id: 's-pension-widow', name: 'Pension - Widow', documents: 'Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO\nDeath Certificate\nNon-Marriage Certificate attested by Gazetted Officer' },
  { id: 's-pension-handicap', name: 'Pension - Handicap', documents: 'Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO\nUDID Card and Certificate' },
  { id: 's-domicile-self', name: 'Domicile Certificate - Self', documents: 'State Subject\nAdhar Card\nPhotograph\nVoter List\nRation Card' },
  { id: 's-domicile-child', name: 'Domicile Certificate - Child', documents: 'State Subject of Father\nAdhar Card of Father and Child\nPan Card of Father\nPhotograph\nRation Card\nDate of Birth Certificate' },
  { id: 's-deceased-no-nom', name: 'Deceased Claim - Without Nomination', documents: 'Adhar Card (All Family Members)\nDeath Certificate\nRation Card\nBank Passbook (Deceased & Claimant)\nLegal Heir Certificate from Tehsildar' },
  { id: 's-deceased-nom', name: 'Deceased Claim - With Nomination', documents: 'Adhar Card (Nominee)\nDeath Certificate\nRation Card\nBank Passbook (Deceased & Claimant)' },
  { id: 's-obc', name: 'OBC Certificate', documents: 'Ward Member Certificate or Sabha Certificate\nVoter List (2005 & 2019)\nIncome Proof: Salary Certificate / ITR / Bank Statement / Bank Passbook\nPan Card\nAdhar Card\nDomicile Certificate\nRation Card\nRevenue Card\n(All documents should be original)' },
  { id: 's-saving', name: 'Saving Account Opening', documents: 'Adhar Card\nPan Card\nRation Card\nPhotographs (2 Nos)\nBonafide Certificate (for student account)' },
  { id: 's-current', name: 'Current Account Opening', documents: 'Adhar Card\nPan Card\nRegistration of Shop / FSSAI Certificate / Form C\nPhotographs (2 Nos)' },
  { id: 's-legal-heir', name: 'Legal Heir Certificate', documents: 'Affidavit of Applicants (All Family) attested by Magistrate\nDeath Certificate of Deceased\nRation Card of Claimant\nNewspaper Cutting\nReport from Numberdar and Chowkidar / Ward Member\nAttestation from Gazette Officer\nIdentity Proof of Applicant\nAadhar Card of Deceased\nAadhar Cards of Applicant\nRelationship Certificate (Adhar Cards)' },
  { id: 's-marriage-asst', name: 'Marriage Assistance for Girls', documents: 'Aadhar Card (Daughter)\nMatriculation Certificate\nDomicile Certificate\nRation Card (Inner & Outer Both)\nBank Passbook\nMarriage Card\nEducation Qualification Certificate (10th Class Marksheet)\nAffidavit duly attested by Judicial Magistrate First Class\nConsent Form for Aadhaar Seeding of Bank Account' },
];

const ChecklistDocs = () => {
  const [services, setServices] = useState<ChecklistService[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', documents: '' });
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setServices(JSON.parse(raw));
      } else {
        setServices(DEFAULT_SERVICES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
      }
    } catch {
      setServices(DEFAULT_SERVICES);
    }
  }, []);

  const persist = (next: ChecklistService[]) => {
    setServices(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(s =>
      s.name.toLowerCase().includes(q) || s.documents.toLowerCase().includes(q)
    );
  }, [services, search]);

  const selected = services.find(s => s.id === selectedId);

  const resetForm = () => {
    setForm({ name: '', documents: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.documents.trim()) {
      toast.error('Service name and documents are required');
      return;
    }
    if (editingId) {
      persist(services.map(s => s.id === editingId ? { ...s, name: form.name.trim(), documents: form.documents.trim() } : s));
      toast.success('Service updated');
    } else {
      const newSvc: ChecklistService = {
        id: `s-${Date.now()}`,
        name: form.name.trim(),
        documents: form.documents.trim(),
      };
      persist([newSvc, ...services]);
      setSelectedId(newSvc.id);
      toast.success('Service added');
    }
    resetForm();
  };

  const handleEdit = (s: ChecklistService) => {
    setEditingId(s.id);
    setForm({ name: s.name, documents: s.documents });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this service?')) return;
    persist(services.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId('');
    toast.success('Service deleted');
  };

  const handleWhatsApp = (svc?: ChecklistService) => {
    const target = svc || selected;
    if (!target) {
      toast.error('Select a service first');
      return;
    }
    const message = `*Documents Required for ${target.name}*\n\n${target.documents}\n\nPlease send the above documents along with your details.`;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <PageWrapper title="Check List Docs" subtitle="Document requirements for every service">
      <div className="space-y-6">
        {/* Top controls: search + dropdown */}
        <div className="p-4 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Search Services</Label>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search by service name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Select Service</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service..." />
                </SelectTrigger>
                <SelectContent className="max-h-72 z-50">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                  ) : filtered.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selected service details */}
        {selected && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-md">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardList size={18} className="text-primary" />
                {selected.name}
              </h3>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(selected)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(selected.id)}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Required Documents:</p>
            <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">{selected.documents}</pre>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1">
                <Label className="text-xs">Customer WhatsApp (optional)</Label>
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button onClick={() => handleWhatsApp()} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle size={16} className="mr-2" />
                Send via WhatsApp
              </Button>
            </div>
          </div>
        )}

        {/* Add / Edit form */}
        <div className="p-4 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          {!showForm ? (
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={14} className="mr-1" />
              Add New Service
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{editingId ? 'Edit Service' : 'Add New Service'}</h4>
                <Button size="sm" variant="ghost" onClick={resetForm}><X size={14} /></Button>
              </div>
              <div>
                <Label>Service Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Driving Licence"
                />
              </div>
              <div>
                <Label>Required Documents (one per line)</Label>
                <Textarea
                  value={form.documents}
                  onChange={(e) => setForm(p => ({ ...p, documents: e.target.value }))}
                  rows={8}
                  placeholder={'Adhar Card\nPan Card\n...'}
                />
              </div>
              <Button onClick={handleSave}>
                <Save size={14} className="mr-1" />
                {editingId ? 'Update Service' : 'Save Service'}
              </Button>
            </div>
          )}
        </div>

        {/* All services grid */}
        <div className="p-4 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            All Services ({filtered.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map(s => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${selectedId === s.id ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'}`}
                onClick={() => setSelectedId(s.id)}
              >
                <span className="text-sm truncate flex-1">{s.name}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    title="WhatsApp"
                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(s); }}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                  >
                    <MessageCircle size={14} className="text-green-600" />
                  </button>
                  <button
                    title="Edit"
                    onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ChecklistDocs;