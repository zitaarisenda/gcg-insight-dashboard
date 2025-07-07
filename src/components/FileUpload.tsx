import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataUpload: (data: any[], dataType: 'aspect' | 'indicator') => void;
}

export const FileUpload = ({ onDataUpload }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, dataType: 'aspect' | 'indicator') => {
    setIsLoading(true);
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would parse the Excel/CSV file here
      // For now, we'll simulate with sample data
      const sampleData = generateSampleData(dataType);
      onDataUpload(sampleData, dataType);
      
      toast({
        title: "File berhasil diupload",
        description: `Data ${dataType === 'aspect' ? 'Keseluruhan Aspek' : 'Per Indikator'} telah diproses`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memproses file. Pastikan format file sudah benar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSubmit = async (dataType: 'aspect' | 'indicator') => {
    if (!linkUrl) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, you would fetch data from the URL
      // For now, we'll simulate with sample data
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sampleData = generateSampleData(dataType);
      onDataUpload(sampleData, dataType);
      
      toast({
        title: "Data berhasil diambil",
        description: `Data dari link telah diproses`,
      });
      setLinkUrl('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data dari link",
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
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">atau</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aspect-link">Link ke File</Label>
                <div className="flex gap-2">
                  <Input
                    id="aspect-link"
                    placeholder="https://example.com/data.xlsx"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => handleLinkSubmit('aspect')}
                    disabled={isLoading || !linkUrl}
                  >
                    {isLoading ? 'Processing...' : 'Upload'}
                  </Button>
                </div>
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
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">atau</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="indicator-link">Link ke File</Label>
                <div className="flex gap-2">
                  <Input
                    id="indicator-link"
                    placeholder="https://example.com/data.xlsx"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => handleLinkSubmit('indicator')}
                    disabled={isLoading || !linkUrl}
                  >
                    {isLoading ? 'Processing...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};