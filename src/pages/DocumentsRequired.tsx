import { useEffect, useMemo, useState } from 'react';
import { Printer, Plus, Save, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { escapeHtml } from '@/lib/sanitize';

const STORAGE_KEY = 'documents_required_v1';

const DEFAULT_DOCS: Record<string, string> = {
  'Pan Card': `For Fresh Pan: Adhar Card, Photographs 2Nos\nFor Lost Pan: Pan Number, Adhar Card, Photographs 2Nos`,
  'Passport': `For Fresh Passport: Adhar Card, Pan Card, 10th Class mark sheet, Birth Certificate\nFor Old Passport: Adhar Card, Old Passport, Pan Card, Ration Card`,
  'E Stamp': `Particulars                Amount\nAffidavit                  10\nAffidavit (witness)        10\nPower of Attorney          100\nLetter of indemnity        500\n\n1st party ................................\n2nd Party ................................`,
  'Ayushman Card': `For New Ayushman: Adhar Card, Ration Card\nFor KYC: Adhar Card, Ration Card, Ayushman Card`,
  'Income Certificate': `Adhar Card (Daughter/Father)\nRation Card\nStatement of Saving Account\nAffidavit\nWard Member / Sarpanch Certificate\n\nAll documents should be original`,
  'Ladli Beti Form': `Adhar Card (Mother/Father/Daughter)\nBirth Certificate\nPhotographs (Mother/Father/Daughter)\nRation Card\nIncome Certificate\nBank Account of Ladli Beti\nPan Card\nDomicile Certificate (Father)\nVoter Card (Father)\n\nAll documents should be original`,
  'Birth Certificate (New Born)': `Adhar Card (Father / Mother)\nRation Card\nDischarge Certificate from Hospital`,
  'Marriage Certificate': `दुल्हन\nRation Card\nWitness Identity Proof: Aadhar Card (Father/Mother)\nWitness Address Proof: Aadhar Card (Father/Mother)\nAddress Proof: Ration Card\nIdentity Proof: Aadhar Card\nDate of Birth: School Marksheet\n\nदूल्हा\nAddress Proof: Domicile Certificate\nIdentity Proof: Aadhar Card\nWitness Identity Proof: Aadhar Card (Father/Mother)\nWitness Address Proof: Aadhar Card (Father/Mother)\nDate of Birth: School Marksheet\nMarriage Card`,
  'Old Age Pension': `Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO`,
  'Widow Pension': `Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO\nDeath Certificate\nNon-Marriage Certificate attested by Gazetted Officer`,
  'Handicap Pension': `Adhar Card\nRation Card (PHH)\nBank Passbook\nDomicile Certificate\nAffidavit attested by 1st Class Magistrate\nAdhar Linkage form duly stamped by bank\nAge Certificate attested by BMO\nUDID Card and Certificate`,
  'Domicile Certificate (Self)': `State Subject\nAdhar Card\nPhotograph\nVoter List\nRation Card`,
  'Domicile Certificate (Child)': `State Subject of Father\nAdhar Card of Father and Child\nPan Card of Father\nPhotograph\nRation Card\nDate of Birth Certificate`,
  'Deceased Claim (Without Nomination)': `Adhar Card (All Family Members)\nDeath Certificate\nRation Card\nBank Passbook (Deceased & Claimant)\nLegal Heir Certificate from Tehsildar (if amount exceeding Rs 20000)`,
  'Deceased Claim (With Nomination)': `Adhar Card (Nominee)\nDeath Certificate\nRation Card\nBank Passbook (Deceased & Claimant)`,
  'OBC Certificate': `Ward Member Certificate or Sabha Certificate\nVoter List - 2005 & 2019\nIncome Proof: Salary Certificate / ITR / Bank Statement / Bank Passbook\nPan Card\nAdhar Card\nDomicile Certificate\nRation Card\n\nAll documents should be original`,
  'Legal Heir Certificate': `Affidavit of applicants attested by Magistrate\nDeath Certificate of Deceased\nRation Card of Applicant\nNewspaper Cutting\nReport from Numberdar and Chowkidar\nAttestation from Gazette Officer\nAadhar Card`,
  'Saving Account Opening': `1. Adhar Card\n2. Pan Card\n3. Ration Card\n4. Photographs (2 Nos)\n5. Bonafide Certificate (for student account)`,
  'Current Account Opening': `1. Adhar Card\n2. Pan Card\n3. Registration of Shop / FSSAI Certificate / Form C\n4. Photographs (2 Nos)\n5. Affidavit duly notarized`,
  'Marriage Assistance for Girls': `1. Aadhar Card daughter/mother/father (both sides)\n2. Matriculation Certificate\n3. Domicile Certificate\n4. Ration Card (Inner & Outer both)\n5. Bank Passbook\n6. Marriage Card\n7. Education Qualification Certificate (10th class marksheet)\n8. Affidavit duly attested by Judicial Magistrate First Class\n9. Consent Form for Aadhaar Seeding of the Bank Account`,
};

const loadDocs = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_DOCS };
};

const DocumentsRequired = () => {
  const [docs, setDocs] = useState<Record<string, string>>(() => loadDocs());
  const [selected, setSelected] = useState<string>('Pan Card');
  const [draft, setDraft] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs]);

  useEffect(() => {
    setDraft(docs[selected] || '');
    setEditing(false);
  }, [selected, docs]);

  const services = useMemo(() => Object.keys(docs).sort(), [docs]);

  const handleSave = () => {
    setDocs(prev => ({ ...prev, [selected]: draft }));
    setEditing(false);
    toast.success('Saved');
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${selected}"?`)) return;
    const next = { ...docs };
    delete next[selected];
    setDocs(next);
    const remaining = Object.keys(next);
    setSelected(remaining[0] || '');
    toast.success('Deleted');
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Service name required');
      return;
    }
    if (docs[name]) {
      toast.error('Service already exists');
      return;
    }
    setDocs(prev => ({ ...prev, [name]: newContent }));
    setSelected(name);
    setNewName('');
    setNewContent('');
    setAddOpen(false);
    toast.success('Service added');
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const content = docs[selected] || '';
    const html = `<!DOCTYPE html><html><head><title>${escapeHtml(selected)} - Documents Required</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; color: #000; }
        h1 { text-align: center; margin-bottom: 4px; }
        h2 { text-align: center; font-weight: 500; margin-top: 0; font-size: 16px; color: #333; }
        pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; border-top: 2px solid #000; padding-top: 16px; }
      </style></head><body>
      <h1>Documents Required</h1>
      <h2>${escapeHtml(selected)}</h2>
      <pre>${escapeHtml(content)}</pre>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <PageWrapper
      title="Documents Required"
      subtitle="Reference list of documents required for each service"
      action={
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} variant="outline">
            <Plus size={16} className="mr-2" /> Add Service
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" /> Print
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Service list */}
        <div className="lg:col-span-1 bg-card border rounded-2xl p-3 max-h-[70vh] overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground px-2 pb-2 uppercase tracking-wider">Services</div>
          <div className="space-y-1">
            {services.map(s => (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  <span className="truncate">{s}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 bg-card border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Loan / Service Type</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 sm:self-end">
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit size={16} className="mr-2" /> Edit
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  <Save size={16} className="mr-2" /> Save
                </Button>
              )}
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {editing ? (
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter document requirements..."
            />
          ) : (
            <div className="bg-muted/30 border rounded-xl p-4 min-h-[300px]">
              <h3 className="font-semibold text-lg mb-3">{selected}</h3>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{docs[selected] || 'No content yet. Click Edit to add documents.'}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Home Loan" />
            </div>
            <div>
              <Label>Required Documents</Label>
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={10} placeholder="List the required documents..." />
            </div>
            <Button onClick={handleAdd} className="w-full">Add Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default DocumentsRequired;