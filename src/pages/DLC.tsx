import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Printer, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import PageWrapper from '@/components/layout/PageWrapper';
import { exportToPDF, formatDate } from '@/utils/calculateUtils';

interface DLCRecord {
  id: string;
  date: Date;
  pensioner_name: string;
  ppo_number: string;
  account_number: string;
  remarks: string | null;
}

const DLC = () => {
  const [records, setRecords] = useState<DLCRecord[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    pensioner_name: '',
    ppo_number: '',
    account_number: '',
    remarks: '',
  });
  const [editForm, setEditForm] = useState({
    date: '',
    pensioner_name: '',
    ppo_number: '',
    account_number: '',
    remarks: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('dlc_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching DLC records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch DLC records',
        variant: 'destructive',
      });
      return;
    }

    setRecords(
      data.map((record) => ({
        ...record,
        date: new Date(record.date),
      }))
    );
  };

  const handleAddEntry = async () => {
    if (!newEntry.pensioner_name || !newEntry.ppo_number || !newEntry.account_number) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('dlc_records').insert([
        {
          date: newEntry.date,
          pensioner_name: newEntry.pensioner_name,
          ppo_number: newEntry.ppo_number,
          account_number: newEntry.account_number,
          remarks: newEntry.remarks || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'DLC record added successfully',
      });

      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        pensioner_name: '',
        ppo_number: '',
        account_number: '',
        remarks: '',
      });
      setIsAddingNew(false);
      fetchRecords();
    } catch (error) {
      console.error('Error adding DLC record:', error);
      toast({
        title: 'Error',
        description: 'Failed to add DLC record',
        variant: 'destructive',
      });
    }
  };

  const handleEditEntry = async () => {
    if (!editingId || !editForm.pensioner_name || !editForm.ppo_number || !editForm.account_number) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('dlc_records')
        .update({
          date: editForm.date,
          pensioner_name: editForm.pensioner_name,
          ppo_number: editForm.ppo_number,
          account_number: editForm.account_number,
          remarks: editForm.remarks || null,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'DLC record updated successfully',
      });

      setEditingId(null);
      fetchRecords();
    } catch (error) {
      console.error('Error updating DLC record:', error);
      toast({
        title: 'Error',
        description: 'Failed to update DLC record',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('dlc_records').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'DLC record deleted successfully',
      });

      fetchRecords();
    } catch (error) {
      console.error('Error deleting DLC record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete DLC record',
        variant: 'destructive',
      });
    }
  };

  const openEditEntry = (record: DLCRecord) => {
    setEditingId(record.id);
    setEditForm({
      date: new Date(record.date).toISOString().split('T')[0],
      pensioner_name: record.pensioner_name,
      ppo_number: record.ppo_number,
      account_number: record.account_number,
      remarks: record.remarks || '',
    });
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Life Certificate (DLC) Records - Print</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 { 
              text-align: center; 
              color: #1e40af;
              margin-bottom: 30px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #1e40af; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .header-info {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f3f4f6;
              border-radius: 5px;
            }
            @media print {
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Life Certificate (DLC) Records</h1>
          <div class="header-info">
            <strong>Total Records:</strong> ${records.length}<br>
            <strong>Generated on:</strong> ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Pensioner Name</th>
                <th>PPO Number</th>
                <th>Account Number</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (record) => `
                <tr>
                  <td>${formatDate(new Date(record.date))}</td>
                  <td>${record.pensioner_name}</td>
                  <td>${record.ppo_number}</td>
                  <td>${record.account_number}</td>
                  <td>${record.remarks || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const exportData = records.map((record) => ({
      Date: formatDate(new Date(record.date)),
      'Pensioner Name': record.pensioner_name,
      'PPO Number': record.ppo_number,
      'Account Number': record.account_number,
      Remarks: record.remarks || '-',
    }));

    exportToPDF(exportData, 'DLC_Records');
    toast({
      title: 'Success',
      description: 'DLC records downloaded successfully',
    });
  };

  return (
    <PageWrapper
      title="Life Certificate (DLC)"
      subtitle="Manage Digital Life Certificate records"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <Button onClick={() => setIsAddingNew(!isAddingNew)} size="sm">
            {isAddingNew ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Records"
            value={records.length.toString()}
          />
        </div>

        {isAddingNew && (
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-date">Date of DLC Issuance</Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="new-pensioner-name">Pensioner Name</Label>
                  <Input
                    id="new-pensioner-name"
                    value={newEntry.pensioner_name}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, pensioner_name: e.target.value })
                    }
                    placeholder="Enter pensioner name"
                  />
                </div>
                <div>
                  <Label htmlFor="new-ppo-number">PPO Number</Label>
                  <Input
                    id="new-ppo-number"
                    value={newEntry.ppo_number}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, ppo_number: e.target.value })
                    }
                    placeholder="Enter PPO number"
                  />
                </div>
                <div>
                  <Label htmlFor="new-account-number">Account Number</Label>
                  <Input
                    id="new-account-number"
                    value={newEntry.account_number}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, account_number: e.target.value })
                    }
                    placeholder="Enter account number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new-remarks">Remarks</Label>
                  <Textarea
                    id="new-remarks"
                    value={newEntry.remarks}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, remarks: e.target.value })
                    }
                    placeholder="Enter any additional remarks"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleAddEntry}>Save Entry</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div key={record.id}>
              {editingId === record.id ? (
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-date">Date of DLC Issuance</Label>
                        <Input
                          id="edit-date"
                          type="date"
                          value={editForm.date}
                          onChange={(e) =>
                            setEditForm({ ...editForm, date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-pensioner-name">Pensioner Name</Label>
                        <Input
                          id="edit-pensioner-name"
                          value={editForm.pensioner_name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pensioner_name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-ppo-number">PPO Number</Label>
                        <Input
                          id="edit-ppo-number"
                          value={editForm.ppo_number}
                          onChange={(e) =>
                            setEditForm({ ...editForm, ppo_number: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-account-number">Account Number</Label>
                        <Input
                          id="edit-account-number"
                          value={editForm.account_number}
                          onChange={(e) =>
                            setEditForm({ ...editForm, account_number: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-remarks">Remarks</Label>
                        <Textarea
                          id="edit-remarks"
                          value={editForm.remarks}
                          onChange={(e) =>
                            setEditForm({ ...editForm, remarks: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleEditEntry}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ServiceCard
                  id={record.id}
                  title={record.pensioner_name}
                  date={record.date}
                  data={{
                    ppo_number: record.ppo_number,
                    account_number: record.account_number,
                    remarks: record.remarks || '-',
                  }}
                  labels={{
                    ppo_number: 'PPO Number',
                    account_number: 'Account Number',
                    remarks: 'Remarks',
                  }}
                  onEdit={() => openEditEntry(record)}
                  onDelete={() => handleDeleteEntry(record.id)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DLC;
