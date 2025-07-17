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
            
            <FileUpload onDataUpload={handleDataUpload} />
          </div>
        ) : (
          /* Data Available State */
          <div className="space-y-6">
            {/* Status Cards (separate, text shifted down) */}
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-success text-success-foreground col-span-1 md:col-start-1 lg:col-start-1">
                <CardContent className="p-4 mt-3">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm opacity-90">Data Aspek</p>
                    <p className="text-2xl font-bold">{data.filter(item => item.Type === 'header').length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary text-primary-foreground col-span-1">
                <CardContent className="p-4 mt-3">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm opacity-90">Data Indikator</p>
                    <p className="text-2xl font-bold">{data.filter(item => item.Type === 'indicator').length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card col-span-3">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">Tahun Data</p>
                      <div
                        className="flex gap-2 mt-2 overflow-x-auto flex-nowrap max-w-full"
                        style={{
                          scrollbarColor: '#e5e7eb transparent',
                          scrollbarWidth: 'thin',
                        }}
                      >
                        {data.length > 0 ? (
                          Array.from(new Set(data.map(item => item.Tahun)))
                            .filter(tahun => tahun !== undefined && tahun !== null)
                            .map((tahun) => {
                              const adaLevel2 = data.some(item => item.Tahun === tahun && item.Level === 2);
                              return (
                                <span key={tahun} className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${adaLevel2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {tahun}: {adaLevel2 ? 'indikator lengkap' : 'hanya aspek'}
                                </span>
                              );
                            })
                        ) : <span>-</span>}
                      </div>
                      {/* Custom scrollbar for Webkit browsers */}
                      <style>{`
                        .bg-card .overflow-x-auto::-webkit-scrollbar {
                          height: 8px;
                        }
                        .bg-card .overflow-x-auto::-webkit-scrollbar-thumb {
                          background: #e5e7eb;
                          border-radius: 6px;
                        }
                        .bg-card .overflow-x-auto::-webkit-scrollbar-track {
                          background: transparent;
                        }
                      `}</style>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card col-span-1">
                <CardContent className="p-4 mt-3">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold text-success">Ready</p>
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
                <TabsTrigger value="upload">Hapus Dataset</TabsTrigger>
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
                <Card>
                  <CardContent className="p-8 text-center">
                    <button
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded font-semibold hover:bg-destructive/90"
                      onClick={handleDeleteData}
                    >
                      Hapus Seluruh Dataset
                    </button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
