
import { useState } from 'react';
import { Download, Calendar, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { exportToExcel } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';

const Downloads = () => {
  const [selectedTable, setSelectedTable] = useState('');
  const [downloadType, setDownloadType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const tables = [
    { value: 'banking_services', label: 'Banking Services' },
    { value: 'banking_accounts', label: 'Banking Accounts' },
    { value: 'od_records', label: 'OD Records' },
    { value: 'online_services', label: 'Online Services' },
    { value: 'applications', label: 'Applications' },
    { value: 'photostat', label: 'Photostat' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'misc_expenses', label: 'Misc Expenses' },
    { value: 'pending_balances', label: 'Pending Balances' },
    { value: 'customers', label: 'Customers' },
    { value: 'khata_customers', label: 'Khata Customers' },
    { value: 'khata_transactions', label: 'Khata Transactions' },
    { value: 'account_details', label: 'Account Details' },
  ];

  const handleDownload = async () => {
    if (!selectedTable) {
      toast({
        title: "Error",
        description: "Please select a table to download",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let query = supabase.from(selectedTable).select('*');

      // Apply date filters based on download type
      if (downloadType === 'specific' && specificDate) {
        query = query.eq('date', specificDate);
      } else if (downloadType === 'range' && fromDate && toDate) {
        query = query.gte('date', fromDate).lte('date', toDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No data found for the selected criteria",
          variant: "destructive",
        });
        return;
      }

      // Format data for export
      const formattedData = data.map(record => {
        const formatted: any = {};
        
        Object.keys(record).forEach(key => {
          if (key.includes('date') || key.includes('_at')) {
            try {
              formatted[key] = format(new Date(record[key]), 'dd/MM/yyyy HH:mm:ss');
            } catch {
              formatted[key] = record[key];
            }
          } else {
            formatted[key] = record[key];
          }
        });

        return formatted;
      });

      // Generate filename based on filters
      let filename = selectedTable;
      if (downloadType === 'specific' && specificDate) {
        filename += `_${specificDate}`;
      } else if (downloadType === 'range' && fromDate && toDate) {
        filename += `_${fromDate}_to_${toDate}`;
      } else {
        filename += '_all_data';
      }

      exportToExcel(formattedData, filename);

      toast({
        title: "Success",
        description: `Downloaded ${data.length} records successfully`,
      });

    } catch (error) {
      console.error('Error downloading data:', error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAllPages = async () => {
    setIsLoading(true);

    try {
      const allData: any = {};
      const errors: string[] = [];

      // Download data from all tables
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table.value)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            errors.push(`${table.label}: ${error.message}`);
            continue;
          }

          if (data && data.length > 0) {
            // Format data for export
            const formattedData = data.map(record => {
              const formatted: any = {};
              
              Object.keys(record).forEach(key => {
                if (key.includes('date') || key.includes('_at')) {
                  try {
                    formatted[key] = format(new Date(record[key]), 'dd/MM/yyyy HH:mm:ss');
                  } catch {
                    formatted[key] = record[key];
                  }
                } else {
                  formatted[key] = record[key];
                }
              });

              return formatted;
            });

            allData[table.label] = formattedData;
          }
        } catch (tableError) {
          errors.push(`${table.label}: Failed to fetch data`);
        }
      }

      if (Object.keys(allData).length === 0) {
        toast({
          title: "No Data",
          description: "No data found in any table",
          variant: "destructive",
        });
        return;
      }

      // Create a combined export with multiple sheets
      const combinedData = Object.entries(allData).flatMap(([tableName, records]) => 
        (records as any[]).map(record => ({
          Table: tableName,
          ...record
        }))
      );

      exportToExcel(combinedData, `all_pages_data_${format(new Date(), 'yyyy-MM-dd')}`);

      let message = `Downloaded data from ${Object.keys(allData).length} tables successfully`;
      if (errors.length > 0) {
        message += `. Some tables had errors: ${errors.join(', ')}`;
      }

      toast({
        title: "Success",
        description: message,
      });

    } catch (error) {
      console.error('Error downloading all data:', error);
      toast({
        title: "Error",
        description: "Failed to download all data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper title="Download Data">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Table Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download size={20} />
                Download Specific Table
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="table">Select Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a table to download" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="downloadType">Download Type</Label>
                <Select value={downloadType} onValueChange={setDownloadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="specific">Specific Date</SelectItem>
                    <SelectItem value="range">Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {downloadType === 'specific' && (
                <div>
                  <Label htmlFor="specificDate">Select Date</Label>
                  <Input
                    id="specificDate"
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                  />
                </div>
              )}

              {downloadType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleDownload} 
                disabled={isLoading || !selectedTable}
                className="w-full"
              >
                <Download size={16} className="mr-2" />
                {isLoading ? 'Downloading...' : 'Download Table Data'}
              </Button>
            </CardContent>
          </Card>

          {/* All Pages Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Download All Pages Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download data from all available tables in a single Excel file. 
                This will include all records from every table in the system.
              </p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">This will include data from:</h4>
                <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  {tables.map((table) => (
                    <div key={table.value}>• {table.label}</div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleDownloadAllPages} 
                disabled={isLoading}
                className="w-full"
                variant="secondary"
              >
                <Database size={16} className="mr-2" />
                {isLoading ? 'Downloading...' : 'Download All Pages Data'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Quick Download Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDownloadType('specific');
                  setSpecificDate(format(new Date(), 'yyyy-MM-dd'));
                }}
                disabled={isLoading}
              >
                Today's Data
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDownloadType('range');
                  setFromDate(format(firstDay, 'yyyy-MM-dd'));
                  setToDate(format(today, 'yyyy-MM-dd'));
                }}
                disabled={isLoading}
              >
                This Month's Data
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDownloadType('all');
                }}
                disabled={isLoading}
              >
                All Time Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Downloads;
