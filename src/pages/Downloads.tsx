import { useState } from 'react';
import { Download, Calendar, Database, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
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
    { value: 'photostats', label: 'Photostat' },
    { value: 'forms', label: 'Forms' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'misc_expenses', label: 'Misc Expenses' },
    { value: 'pending_balances', label: 'Pending Balances' },
    { value: 'customers', label: 'Customers' },
    { value: 'khata_customers', label: 'Khata Customers' },
    { value: 'khata_transactions', label: 'Khata Transactions' },
    { value: 'account_details', label: 'Account Details' },
  ];

  const handlePrint = async (isAllPages = false) => {
    if (!isAllPages && !selectedTable) {
      toast({
        title: "Error",
        description: "Please select a table to print",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let dataToProcess: any = {};
      
      if (isAllPages) {
        // Get data from all tables for printing
        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table.value as any)
              .select('*')
              .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
              dataToProcess[table.label] = data;
            }
          } catch (tableError) {
            console.error(`Error fetching ${table.label}:`, tableError);
          }
        }
      } else {
        // Get data from selected table for printing
        let query = supabase.from(selectedTable as any).select('*');

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

        const tableLabel = tables.find(t => t.value === selectedTable)?.label || selectedTable;
        dataToProcess[tableLabel] = data;
      }

      // Generate print content
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      let printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${escapeHtml(isAllPages ? 'All Pages Data Report' : `${Object.keys(dataToProcess)[0]} Report`)}</title>
            <style>
              @page { 
                size: A4; 
                margin: 15mm;
              }
              @media print {
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                html, body { margin: 0 !important; padding: 0 !important; }
                .no-print { display: none !important; }
                .page-break { page-break-before: always; }
              }
              body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                margin: 0;
                padding: 0;
              }
              h1 { 
                text-align: center; 
                margin-bottom: 20px; 
                font-size: 18px; 
                color: #333;
              }
              h2 { 
                font-size: 16px; 
                margin: 20px 0 10px 0; 
                color: #555;
                border-bottom: 2px solid #ddd;
                padding-bottom: 5px;
              }
              .report-header { 
                text-align: center; 
                margin-bottom: 20px; 
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
              }
              .total { 
                font-weight: bold; 
                text-align: right; 
                margin: 10px 0; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 10px 0 20px 0; 
              }
              th, td { 
                border: 1px solid #000; 
                padding: 4px; 
                text-align: left; 
                font-size: 10px; 
              }
              th { 
                background-color: #f5f5f5; 
                font-weight: bold; 
              }
              .summary { 
                margin-top: 20px; 
                padding: 10px; 
                background-color: #f9f9f9; 
                border: 1px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h1>${escapeHtml(isAllPages ? 'Complete Data Report' : `${Object.keys(dataToProcess)[0]} Report`)}</h1>
              <p>Generated on: ${escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm:ss'))}</p>
            </div>
      `;

      let totalRecords = 0;
      let tableCount = 0;

      Object.entries(dataToProcess).forEach(([tableName, records], index) => {
        const recordsArray = records as any[];
        totalRecords += recordsArray.length;
        tableCount++;

        if (index > 0) {
          printContent += '<div class="page-break"></div>';
        }

        printContent += `
          <h2>${escapeHtml(tableName)}</h2>
          <div class="total">Total Records: ${recordsArray.length}</div>
        `;

        if (recordsArray.length > 0) {
          const headers = Object.keys(recordsArray[0]).filter(key => 
            !key.includes('id') && !key.includes('created_at') && !key.includes('updated_at')
          );

          printContent += `
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  ${headers.map(header => `<th>${escapeHtml(header.replace(/_/g, ' ').toUpperCase())}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
          `;

          recordsArray.forEach((record, index) => {
            printContent += `
              <tr>
                <td>${index + 1}</td>
                ${headers.map(header => {
                  let value = record[header];
                  if (header.includes('date') && value) {
                    try {
                      value = format(new Date(value), 'dd/MM/yyyy');
                    } catch {
                      // Keep original value if date parsing fails
                    }
                  }
                  return `<td>${escapeHtml(value || '-')}</td>`;
                }).join('')}
              </tr>
            `;
          });

          printContent += `
              </tbody>
            </table>
          `;
        } else {
          printContent += '<p>No records found.</p>';
        }
      });

      // Add summary for all pages report
      if (isAllPages && tableCount > 1) {
        printContent += `
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Tables:</strong> ${tableCount}</p>
            <p><strong>Total Records:</strong> ${totalRecords}</p>
            <p><strong>Report Generated:</strong> ${escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm:ss'))}</p>
          </div>
        `;
      }

      printContent += `
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();

      toast({
        title: "Success",
        description: `Print dialog opened for ${isAllPages ? 'all pages data' : Object.keys(dataToProcess)[0]}`,
      });

    } catch (error) {
      console.error('Error preparing print data:', error);
      toast({
        title: "Error",
        description: "Failed to prepare data for printing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      let query = supabase.from(selectedTable as any).select('*');

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
            .from(table.value as any)
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

              <div className="flex gap-2">
                <Button 
                  onClick={handleDownload} 
                  disabled={isLoading || !selectedTable}
                  className="flex-1"
                >
                  <Download size={16} className="mr-2" />
                  {isLoading ? 'Downloading...' : 'Download Excel'}
                </Button>
                <Button 
                  onClick={() => handlePrint(false)} 
                  disabled={isLoading || !selectedTable}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer size={16} className="mr-2" />
                  {isLoading ? 'Processing...' : 'Print'}
                </Button>
              </div>
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

              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadAllPages} 
                  disabled={isLoading}
                  className="flex-1"
                  variant="secondary"
                >
                  <Database size={16} className="mr-2" />
                  {isLoading ? 'Downloading...' : 'Download All Excel'}
                </Button>
                <Button 
                  onClick={() => handlePrint(true)} 
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer size={16} className="mr-2" />
                  {isLoading ? 'Processing...' : 'Print All'}
                </Button>
              </div>
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
