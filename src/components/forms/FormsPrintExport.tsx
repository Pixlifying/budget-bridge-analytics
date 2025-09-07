
import { Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF } from '@/utils/calculateUtils';
import { format } from 'date-fns';
import { escapeHtml } from '@/lib/sanitize';
import { toast } from "sonner";

interface FormEntry {
  id: string;
  date: string;
  s_no: number;
  name: string;
  parentage: string;
  address: string;
  mobile: string;
  remarks?: string;
  department: string;
  created_at: string;
  updated_at: string;
}

interface FormsPrintExportProps {
  filteredForms: FormEntry[];
  selectedDepartment: string;
}

const FormsPrintExport = ({ filteredForms, selectedDepartment }: FormsPrintExportProps) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(`Forms Report - ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`)}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm;
            }
            @media print {
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
              html, body { margin: 0 !important; padding: 0 !important; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              margin: 0;
              padding: 0;
            }
            h1 { text-align: center; margin-bottom: 20px; font-size: 18px; }
            .department { text-align: center; margin-bottom: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Forms Report</h1>
          <div class="department">Department: ${escapeHtml(selectedDepartment === 'all' ? 'All Departments' : selectedDepartment)}</div>
          <div class="total">Total Entries: ${filteredForms.length}</div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Name</th>
                <th>Parentage</th>
                <th>Address</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredForms.map((form, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(format(new Date(form.date), 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(form.name)}</td>
                  <td>${escapeHtml(form.parentage)}</td>
                  <td>${escapeHtml(form.address)}</td>
                  <td>${escapeHtml(form.mobile)}</td>
                  <td>${escapeHtml(form.department)}</td>
                  <td>${escapeHtml(form.remarks || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const pdfData = filteredForms.map((form, index) => ({
      'S.No': index + 1,
      'Date': format(new Date(form.date), 'dd/MM/yyyy'),
      'Name': form.name,
      'Parentage': form.parentage,
      'Address': form.address,
      'Mobile': form.mobile,
      'Department': form.department,
      'Remarks': form.remarks || '-'
    }));
    
    const fileName = selectedDepartment === 'all' 
      ? 'forms-report-all-departments' 
      : `forms-report-${selectedDepartment.toLowerCase()}`;
    
    exportToPDF(pdfData, fileName);
    toast.success("Forms report downloaded successfully");
  };

  return (
    <>
      <Button onClick={handlePrint} variant="outline">
        <Printer size={16} className="mr-2" />
        Print
      </Button>

      <Button onClick={handleDownloadPDF} variant="outline">
        <FileText size={16} className="mr-2" />
        Download PDF
      </Button>
    </>
  );
};

export default FormsPrintExport;
