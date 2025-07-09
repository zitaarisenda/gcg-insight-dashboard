import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { IndicatorDashboard } from '@/components/dashboard/IndicatorDashboard';

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

const Index = () => {
  const [data, setData] = useState<DataRow[]>([]);

  const handleDataUpload = (uploadedData: DataRow[]) => {
    setData(uploadedData);
  };

  const handleDeleteData = () => {
    setData([]);
  };

  const hasData = data.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Dashboard Good Corporate Governance</h1>
            <p className="text-lg opacity-90">Analisis dan Visualisasi Data Penilaian GCG</p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30">
                Aspek Governance
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30">
                Indikator Kinerja
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30">
                Analisis Komprehensif
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!hasData ? (
          /* No Data State */
          <div className="space-y-8">
            <Card className="bg-gradient-card border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  📊 Dashboard GCG
                </CardTitle>
                <CardDescription className="text-lg">
                  Belum ada data yang diinput. Silakan upload file data untuk memulai analisis.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center p-6 bg-primary/5 rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      📈
                    </div>
                    <h3 className="font-semibold mb-2">Analisis Aspek</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Visualisasi capaian dan tren per aspek governance
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-6 bg-success/5 rounded-lg">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
                      🎯
                    </div>
                    <h3 className="font-semibold mb-2">Indikator Detail</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Analisis mendalam per indikator kinerja
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-6 bg-accent/5 rounded-lg">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                      📋
                    </div>
                    <h3 className="font-semibold mb-2">Laporan Lengkap</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Tabel dan visualisasi interaktif
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FileUpload onDataUpload={handleDataUpload} />
          </div>
        ) : (
          /* Data Available State */
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-success text-success-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Data Aspek</p>
                      <p className="text-2xl font-bold">{data.filter(item => item.Type === 'header').length}</p>
                    </div>
                    <div className="text-3xl opacity-80">📊</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Data Indikator</p>
                      <p className="text-2xl font-bold">{data.filter(item => item.Type === 'indicator').length}</p>
                    </div>
                    <div className="text-3xl opacity-80">🎯</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tahun Data</p>
                      <p className="text-2xl font-bold">
                        {data.length > 0 
                          ? [...new Set(data.map(item => item.Tahun))].join(', ')
                          : '-'
                        }
                      </p>
                    </div>
                    <div className="text-3xl opacity-60">📅</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold text-success">Ready</p>
                    </div>
                    <div className="text-3xl opacity-60">✅</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard */}
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dashboard">
                  Dashboard GCG ({data.length} baris data)
                </TabsTrigger>
                <TabsTrigger value="upload">Upload Data Baru</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                {data.length > 0 ? (
                  <IndicatorDashboard data={data} onDeleteData={handleDeleteData} />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Data belum tersedia. Silakan upload data terlebih dahulu.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="upload">
                <FileUpload onDataUpload={handleDataUpload} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
