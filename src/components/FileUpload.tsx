import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataUpload: (data: any[], dataType: 'aspect' | 'indicator') => void;
}

export const FileUpload = ({ onDataUpload }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('File tidak dapat dibaca'));
            return;
          }

          let jsonData: any[] = [];
          
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
              const obj: any = {};
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
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
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

  const handleFileUpload = async (file: File, dataType: 'aspect' | 'indicator') => {
    setIsLoading(true);
    try {
      const data = await readFile(file);
      if (!data || data.length === 0) {
        throw new Error('File kosong atau format tidak valid');
      }

      // Validate required columns
      if (dataType === 'aspect') {
        const requiredColumns = ['Type', 'No', 'Deskripsi', 'Bobot', 'Skor', 'Capaian', 'Penjelasan', 'Tahun'];
        const hasRequiredColumns = requiredColumns.every(col => 
          data[0].hasOwnProperty(col)
        );
        if (!hasRequiredColumns) {
          throw new Error(`File harus memiliki kolom: ${requiredColumns.join(', ')}`);
        }
      } else {
        const requiredColumns = ['Level', 'Type', 'Section', 'No', 'Deskripsi', 'Jumlah_Parameter', 'Bobot', 'Skor', 'Capaian', 'Tahun'];
        const hasRequiredColumns = requiredColumns.every(col => 
          data[0].hasOwnProperty(col)
        );
        if (!hasRequiredColumns) {
          throw new Error(`File harus memiliki kolom: ${requiredColumns.join(', ')}`);
        }
      }

      onDataUpload(data, dataType);
      
      toast({
        title: "File berhasil diupload",
        description: `${data.length} baris data ${dataType === 'aspect' ? 'Keseluruhan Aspek' : 'Per Indikator'} telah diproses`,
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


  const generateSampleData = (dataType: 'aspect' | 'indicator') => {
    if (dataType === 'aspect') {
      return [
        { Type: 'aspek', No: 'I', Deskripsi: 'Komitmen Terhadap Penerapan Tata Kelola Perusahaan yang Baik Secara Berkelanjutan', Bobot: 7, Skor: 6.366, Capaian: 90.942, Penjelasan: 'Sangat Baik', Tahun: 2022 },
        { Type: 'aspek', No: 'II', Deskripsi: 'Pemegang Saham dan RUPS/Pemilik Modal', Bobot: 9, Skor: 8.243, Capaian: 91.588, Penjelasan: 'Sangat Baik', Tahun: 2022 },
        { Type: 'aspek', No: 'III', Deskripsi: 'Dewan Komisaris/Dewan Pengawas', Bobot: 35, Skor: 32.561, Capaian: 93.032, Penjelasan: 'Sangat Baik', Tahun: 2022 },
        { Type: 'aspek', No: 'IV', Deskripsi: 'Direksi', Bobot: 35, Skor: 30.875, Capaian: 88.214, Penjelasan: 'Sangat Baik', Tahun: 2022 },
        { Type: 'aspek', No: 'V', Deskripsi: 'Pengungkapan Informasi dan Transparansi', Bobot: 9, Skor: 7.187, Capaian: 79.854, Penjelasan: 'Baik', Tahun: 2022 },
        { Type: 'aspek', No: 'I', Deskripsi: 'Komitmen Terhadap Penerapan Tata Kelola Perusahaan yang Baik Secara Berkelanjutan', Bobot: 7, Skor: 6.366, Capaian: 90.942, Penjelasan: 'Sangat Baik', Tahun: 2023 },
        { Type: 'aspek', No: 'II', Deskripsi: 'Pemegang Saham dan RUPS/Pemilik Modal', Bobot: 9, Skor: 8.243, Capaian: 91.588, Penjelasan: 'Sangat Baik', Tahun: 2023 },
        { Type: 'aspek', No: 'III', Deskripsi: 'Dewan Komisaris/Dewan Pengawas', Bobot: 35, Skor: 32.561, Capaian: 93.032, Penjelasan: 'Sangat Baik', Tahun: 2023 },
        { Type: 'aspek', No: 'IV', Deskripsi: 'Direksi', Bobot: 35, Skor: 30.875, Capaian: 88.214, Penjelasan: 'Sangat Baik', Tahun: 2023 },
        { Type: 'aspek', No: 'V', Deskripsi: 'Pengungkapan Informasi dan Transparansi', Bobot: 9, Skor: 7.187, Capaian: 79.854, Penjelasan: 'Baik', Tahun: 2023 },
      ];
    } else {
      return [
        { Level: 2, Type: 'indicator', Section: 'I', No: 1, Deskripsi: 'Perusahaan memiliki Pedoman Tata Kelola Perusahaan yang Baik (GCG Code) dan pedoman perilaku (code of conduct)', Jumlah_Parameter: 2, Bobot: 1.218, Skor: 1.218, Capaian: 100, Tahun: 2022 },
        { Level: 2, Type: 'indicator', Section: 'I', No: 2, Deskripsi: 'Perusahaan melaksanakan Pedoman Tata Kelola Perusahaan yang Baik dan Pedoman Perilaku secara konsisten', Jumlah_Parameter: 2, Bobot: 1.217, Skor: 1.002, Capaian: 82.30, Tahun: 2022 },
        { Level: 2, Type: 'indicator', Section: 'I', No: 3, Deskripsi: 'Perusahaan melakukan pengukuran terhadap penerapan Tata Kelola Perusahaan yang Baik', Jumlah_Parameter: 2, Bobot: 0.608, Skor: 0.570, Capaian: 93.75, Tahun: 2022 },
        { Level: 2, Type: 'indicator', Section: 'II', No: 7, Deskripsi: 'RUPS/Pemilik Modal melakukan pengangkatan dan pemberhentian Direksi', Jumlah_Parameter: 6, Bobot: 2.423, Skor: 2.423, Capaian: 100, Tahun: 2022 },
        { Level: 2, Type: 'indicator', Section: 'II', No: 8, Deskripsi: 'RUPS/Pemilik Modal melakukan pengangkatan dan pemberhentian Dewan Komisaris/Dewan Pengawas', Jumlah_Parameter: 5, Bobot: 1.731, Skor: 1.493, Capaian: 86.26, Tahun: 2022 },
      ];
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Data GCG</CardTitle>
        <CardDescription>
          Upload file Excel (.xlsx), CSV (.csv), atau masukkan link untuk menganalisis data Good Corporate Governance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="aspect" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aspect">Data Keseluruhan Aspek</TabsTrigger>
            <TabsTrigger value="indicator">Data Per Indikator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="aspect" className="space-y-4">
            <Alert>
              <AlertDescription>
                Upload data yang berisi kolom: Type, No, Deskripsi, Bobot, Skor, Capaian, Penjelasan, Tahun
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="aspect-file">Upload File</Label>
                <Input
                  id="aspect-file"
                  type="file"
                  accept=".xlsx,.csv"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'aspect');
                  }}
                  disabled={isLoading}
                />
              </div>
              
            </div>
          </TabsContent>
          
          <TabsContent value="indicator" className="space-y-4">
            <Alert>
              <AlertDescription>
                Upload data yang berisi kolom: Level, Type, Section, No, Deskripsi, Jumlah_Parameter, Bobot, Skor, Capaian, Tahun
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="indicator-file">Upload File</Label>
                <Input
                  id="indicator-file"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'indicator');
                  }}
                  disabled={isLoading}
                />
              </div>
              
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};