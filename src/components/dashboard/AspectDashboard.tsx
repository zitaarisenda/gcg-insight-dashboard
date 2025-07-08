import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AspectData {
  Type: string;
  No: string;
  Deskripsi: string;
  Bobot: number;
  Skor: number;
  Capaian: number;
  Penjelasan: string;
  Tahun: number;
}

interface AspectDashboardProps {
  data: AspectData[];
  onDeleteData?: () => void;
}

export const AspectDashboard = ({ data, onDeleteData }: AspectDashboardProps) => {
  const [yearFrom, setYearFrom] = useState<string>('all');
  const [yearTo, setYearTo] = useState<string>('all');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [selectedAspectForTrend, setSelectedAspectForTrend] = useState<string>('');

  // Helper function to parse numeric values and handle invalid data
  const parseNumericValue = (value: any): number => {
    if (value === '-' || value === '' || value == null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Clean and filter data - only include rows where Type = 'aspek'
  const cleanedData = data.filter(item => item.Type === 'aspek').map(item => ({
    ...item,
    Bobot: parseNumericValue(item.Bobot),
    Skor: parseNumericValue(item.Skor),
    Capaian: parseNumericValue(item.Capaian)
  }));

  // Get unique years and aspects - ensure we read ALL data
  const years = [...new Set(cleanedData.map(item => item.Tahun))].sort();
  const aspects = [...new Set(cleanedData.map(item => item.No))].sort();

  // Filter data based on selections
  const filteredData = cleanedData.filter(item => {
    const yearMatch = (yearFrom === 'all' && yearTo === 'all') || 
      (yearFrom === 'all' ? item.Tahun <= parseInt(yearTo) : 
       yearTo === 'all' ? item.Tahun >= parseInt(yearFrom) :
       item.Tahun >= parseInt(yearFrom) && item.Tahun <= parseInt(yearTo));
    const aspectMatch = selectedAspects.length === 0 || selectedAspects.includes(item.No);
    return yearMatch && aspectMatch;
  });

  // Get filtered years and aspects for chart data
  const filteredYears = yearFrom === 'all' && yearTo === 'all' ? years :
    years.filter(year => 
      (yearFrom === 'all' || year >= parseInt(yearFrom)) &&
      (yearTo === 'all' || year <= parseInt(yearTo))
    );
  const filteredAspects = selectedAspects.length === 0 ? aspects : selectedAspects;

  // 1. Pie Chart by Penjelasan
  const penjelasanCounts = filteredData.reduce((acc, item) => {
    acc[item.Penjelasan] = (acc[item.Penjelasan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const penjelasanData = Object.entries(penjelasanCounts).map(([key, value], index) => ({
    name: key,
    value,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  // 2. Skor Rata-rata Tiap Tahun
  const avgScoreData = filteredYears.map(year => {
    const yearData = filteredData.filter(item => item.Tahun === year);
    const avgScore = yearData.length > 0 ? yearData.reduce((sum, item) => sum + item.Skor, 0) / yearData.length : 0;
    return { year, avgScore: Number(avgScore.toFixed(2)) };
  });

  // 3. Skor per Aspek per Tahun
  const aspectScoreData = filteredAspects.map(aspect => {
    const aspectData: any = { aspect: `Aspek ${aspect}` };
    filteredYears.forEach(year => {
      const yearAspectData = cleanedData.find(item => item.No === aspect && item.Tahun === year);
      aspectData[`year_${year}`] = yearAspectData ? yearAspectData.Skor : 0;
    });
    return aspectData;
  });

  // 4. Capaian per Aspek dari Tahun ke Tahun (Line Chart)
  const aspectAchievementTrend = filteredAspects.map(aspect => {
    const trendData: any = { aspect: `Aspek ${aspect}` };
    filteredYears.forEach(year => {
      const yearAspectData = cleanedData.find(item => item.No === aspect && item.Tahun === year);
      trendData[`year_${year}`] = yearAspectData ? yearAspectData.Capaian : 0;
    });
    return trendData;
  });

  // 5. Individual Trend Data
  const trendData = selectedAspectForTrend ? filteredYears.map(year => {
    const yearAspectData = cleanedData.find(item => item.No === selectedAspectForTrend && item.Tahun === year);
    return { year, skor: yearAspectData ? yearAspectData.Skor : 0 };
  }) : [];

  // 6. Weight Distribution
  const totalBobot = filteredData.reduce((sum, item) => sum + item.Bobot, 0);
  const weightData = filteredAspects.map((aspect, index) => {
    const aspectData = filteredData.filter(item => item.No === aspect);
    const totalAspectBobot = aspectData.reduce((sum, item) => sum + item.Bobot, 0);
    return {
      name: `Aspek ${aspect}`,
      value: Number(((totalAspectBobot / totalBobot) * 100).toFixed(1)),
      color: `hsl(var(--chart-${(index % 5) + 1}))`
    };
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filter Data</CardTitle>
          {onDeleteData && (
            <button
              onClick={onDeleteData}
              className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Hapus Dataset
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tahun Dari:</label>
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tahun Sampai:</label>
              <Select value={yearTo} onValueChange={setYearTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Aspek untuk Tren:</label>
              <Select value={selectedAspectForTrend} onValueChange={setSelectedAspectForTrend}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih aspek" />
                </SelectTrigger>
                <SelectContent>
                  {aspects.map(aspect => (
                    <SelectItem key={aspect} value={aspect}>Aspek {aspect}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Pilih Aspek (kosong = semua):</label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {aspects.map(aspect => (
                <div key={aspect} className="flex items-center space-x-2">
                  <Checkbox
                    id={aspect}
                    checked={selectedAspects.includes(aspect)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAspects([...selectedAspects, aspect]);
                      } else {
                        setSelectedAspects(selectedAspects.filter(a => a !== aspect));
                      }
                    }}
                  />
                  <label htmlFor={aspect} className="text-sm">Aspek {aspect}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Ringkasan Umum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Penilaian</CardTitle>
            <CardDescription>Berdasarkan kolom penjelasan</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={penjelasanData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skor Rata-rata Tiap Tahun</CardTitle>
            <CardDescription>Tren kinerja dari tahun ke tahun</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={avgScoreData}
              xKey="year"
              yKeys={[{ key: 'avgScore', name: 'Rata-rata Skor', color: 'hsl(var(--primary))' }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capaian Tiap Aspek dari Tahun ke Tahun</CardTitle>
            <CardDescription>Tren capaian per aspek</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={aspectAchievementTrend}
              xKey="aspect"
              yKeys={filteredYears.map((year, index) => ({
                key: `year_${year}`,
                name: year.toString(),
                color: `hsl(var(--chart-${(index % 5) + 1}))`
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Bobot Antar Aspek</CardTitle>
            <CardDescription>Persentase bobot setiap aspek</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={weightData} />
          </CardContent>
        </Card>
      </div>

      {/* 2. Analisis Per Aspek */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skor per Aspek per Tahun</CardTitle>
            <CardDescription>Perbandingan skor antar aspek</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={aspectScoreData}
              xKey="aspect"
              yKeys={filteredYears.map((year, index) => ({
                key: `year_${year}`,
                name: year.toString(),
                color: `hsl(var(--chart-${(index % 5) + 1}))`
              }))}
              layout="vertical"
            />
          </CardContent>
        </Card>

      </div>

      {/* 3. Tren Individual */}
      {selectedAspectForTrend && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Individual - Aspek {selectedAspectForTrend}</CardTitle>
            <CardDescription>Perubahan skor dari tahun ke tahun</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={trendData}
              xKey="year"
              yKeys={[{ key: 'skor', name: 'Skor', color: 'hsl(var(--success))' }]}
            />
          </CardContent>
        </Card>
      )}

      {/* 4. Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Detail Aspek</CardTitle>
          <CardDescription>Tabel lengkap data aspek yang telah difilter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspek</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Bobot</TableHead>
                  <TableHead>Skor</TableHead>
                  <TableHead>Capaian (%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tahun</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">Aspek {item.No}</TableCell>
                    <TableCell className="max-w-md">{item.Deskripsi}</TableCell>
                    <TableCell>{item.Bobot}</TableCell>
                    <TableCell>{item.Skor.toFixed(3)}</TableCell>
                    <TableCell>{item.Capaian.toFixed(2)}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.Penjelasan.toLowerCase().includes('sangat baik') || item.Penjelasan.toLowerCase().includes('excellent') 
                          ? 'bg-success/10 text-success-foreground' 
                          : item.Penjelasan.toLowerCase().includes('baik') || item.Penjelasan.toLowerCase().includes('good')
                          ? 'bg-primary/10 text-primary-foreground'
                          : 'bg-warning/10 text-warning-foreground'
                      }`}>
                        {item.Penjelasan}
                      </span>
                    </TableCell>
                    <TableCell>{item.Tahun}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};