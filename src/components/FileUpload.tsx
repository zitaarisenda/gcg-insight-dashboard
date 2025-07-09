import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface DataRow {
  Level?: number;
  Type?: string;
  Section?: string;
  No?: number | string;
  Deskripsi?: string;
  Aspek_Pengujian?: string;
  Jumlah_Parameter?: number;
  Bobot?: number;
  Skor?: number;
  Capaian?: number | string;
  Penjelasan?: string;
  Tahun?: number;
  [key: string]: unknown;
}

interface FileUploadProps {
  onDataUpload: (data: DataRow[]) => void;
}

export const FileUpload = ({ onDataUpload }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('File tidak dapat dibaca'));
            return;
          }

          let jsonData: DataRow[] = [];
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              reject(new Error('File CSV harus memiliki header dan minimal 1 baris data'));
              return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            jsonData = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const obj: DataRow = {};
              headers.forEach((header, index) => {
                const value = values[index] || '';
                // Try to convert to number if possible
                if (!isNaN(Number(value)) && value !== '') {
                  obj[header] = Number(value);
                } else {
                  obj[header] = value;
                }
              });
              return obj;
            });
          } else if (file.name.endsWith('.xlsx')) {
            // Parse Excel
            console.log('Parsing Excel file...');
            const workbook = XLSX.read(data, { type: 'binary' });
            console.log('Workbook sheets:', workbook.SheetNames);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Raw Excel data length:', jsonData.length);
            console.log('Raw first row:', jsonData[0]);
            
            // Handle column name variations and data cleaning
            jsonData = jsonData.map(row => {
              const newRow = { ...row };
              
              // Map Aspek_Pengujian to Deskripsi if it exists
              if (Object.prototype.hasOwnProperty.call(newRow, 'Aspek_Pengujian') && !Object.prototype.hasOwnProperty.call(newRow, 'Deskripsi')) {
                newRow.Deskripsi = newRow.Aspek_Pengujian;
                delete newRow.Aspek_Pengujian;
              }
              
              // Clean percentage values (remove % symbol and convert to number)
              if (newRow.Capaian && typeof newRow.Capaian === 'string' && newRow.Capaian.includes('%')) {
                const numValue = parseFloat(newRow.Capaian.replace('%', '').trim());
                newRow.Capaian = isNaN(numValue) ? newRow.Capaian : numValue;
              }
              
              return newRow;
            });
            console.log('After column mapping, first row:', jsonData[0]);
            console.log('After mapping, first row keys:', jsonData[0] ? Object.keys(jsonData[0]) : 'No data');
          } else {
            reject(new Error('Format file tidak didukung. Gunakan .xlsx atau .csv'));
            return;
          }

          resolve(jsonData);
        } catch (error) {
          reject(new Error('Gagal memproses file: ' + (error instanceof Error ? error.message : 'Unknown error')));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    console.log('Starting file upload for:', file.name);
    try {
      const data = await readFile(file);
      console.log('File read successfully. Data length:', data?.length);
      console.log('First row keys:', data?.[0] ? Object.keys(data[0]) : 'No data');
      console.log('First row sample:', data?.[0]);
      
      if (!data || data.length === 0) {
        throw new Error('File kosong atau format tidak valid');
      }

      // Validate required columns - check for both indicator and header data
      const indicatorRow = data.find(row => row.Level === 2 || row.Type === 'indicator');
      if (!indicatorRow) {
        throw new Error('File tidak mengandung data indikator. Pastikan ada baris dengan Level=2 atau Type="indicator"');
      }
      
      const requiredColumns = ['Level', 'Type', 'Section', 'No', 'Deskripsi', 'Bobot', 'Skor', 'Capaian', 'Tahun'];
      const actualColumns = Object.keys(indicatorRow);
      const missingColumns = requiredColumns.filter(col => !Object.prototype.hasOwnProperty.call(indicatorRow, col));
      
      console.log('Validating data row:', indicatorRow);
      console.log('Required columns:', requiredColumns);
      console.log('Actual columns:', actualColumns);
      console.log('Missing columns:', missingColumns);
      
      if (missingColumns.length > 0) {
        throw new Error(`File harus memiliki kolom: ${requiredColumns.join(', ')}.\nKolom yang hilang: ${missingColumns.join(', ')}.\nKolom yang ditemukan: ${actualColumns.join(', ')}`);
      }

      onDataUpload(data);
      
      toast({
        title: "File berhasil diupload",
        description: `${data.length} baris data telah diproses`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses file. Pastikan format file sudah benar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Data GCG</CardTitle>
        <CardDescription>
          Upload file Excel (.xlsx) atau CSV (.csv) untuk menganalisis data Good Corporate Governance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Upload data yang berisi kolom: Level, Type, Section, No, Deskripsi, Bobot, Skor, Capaian, Tahun
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="data-file">Upload File Data GCG</Label>
            <Input
              id="data-file"
              type="file"
              accept=".xlsx,.csv"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};