import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}

export const AspectDashboard = ({ data }: AspectDashboardProps) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('all');

  // Get unique years and aspects
  const years = [...new Set(data.map(item => item.Tahun))].sort();
  const aspects = [...new Set(data.map(item => item.No))].sort();

  // Filter data based on selections
  const filteredData = data.filter(item => {
    const aspectData = item.Type === 'aspek';
    const yearMatch = selectedYear === 'all' || item.Tahun.toString() === selectedYear;
    const aspectMatch = selectedAspect === 'all' || item.No === selectedAspect;
    return aspectData && yearMatch && aspectMatch;
  });

  // 1. Total Aspek Tercapai/Belum Tercapai
  const threshold = 85;
  const achievementData = years.map(year => {
    const yearData = data.filter(item => item.Tahun === year && item.Type === 'aspek');
    const tercapai = yearData.filter(item => item.Capaian >= threshold).length;
    const belumTercapai = yearData.filter(item => item.Capaian < threshold).length;
    return { year, tercapai, belumTercapai };
  });

  const donutData = selectedYear === 'all' 
    ? [
        { 
          name: 'Tercapai', 
          value: achievementData.reduce((sum, item) => sum + item.tercapai, 0),
          color: 'hsl(var(--success))'
        },
        { 
          name: 'Belum Tercapai', 
          value: achievementData.reduce((sum, item) => sum + item.belumTercapai, 0),
          color: 'hsl(var(--warning))'
        }
      ]
    : (() => {
        const yearData = achievementData.find(item => item.year.toString() === selectedYear);
        return yearData ? [
          { name: 'Tercapai', value: yearData.tercapai, color: 'hsl(var(--success))' },
          { name: 'Belum Tercapai', value: yearData.belumTercapai, color: 'hsl(var(--warning))' }
        ] : [];
      })();

  // 2. Skor Rata-rata Tiap Tahun
  const avgScoreData = years.map(year => {
    const yearData = data.filter(item => item.Tahun === year && item.Type === 'aspek');
    const avgScore = yearData.reduce((sum, item) => sum + item.Skor, 0) / yearData.length;
    return { year, avgScore: Number(avgScore.toFixed(2)) };
  });

  // 3. Skor per Aspek per Tahun
  const aspectScoreData = aspects.map(aspect => {
    const aspectData: any = { aspect };
    years.forEach(year => {
      const yearAspectData = data.find(item => item.No === aspect && item.Tahun === year && item.Type === 'aspek');
      aspectData[`year_${year}`] = yearAspectData ? yearAspectData.Skor : 0;
    });
    return aspectData;
  });

  // 4. Capaian per Aspek (latest year)
  const latestYear = Math.max(...years);
  const achievementPerAspect = aspects.map(aspect => {
    const aspectData = data.find(item => item.No === aspect && item.Tahun === latestYear && item.Type === 'aspek');
    return {
      aspect: `Aspek ${aspect}`,
      bobot: aspectData?.Bobot || 0,
      skor: aspectData?.Skor || 0,
      capaian: aspectData?.Capaian || 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAspect} onValueChange={setSelectedAspect}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aspek</SelectItem>
            {aspects.map(aspect => (
              <SelectItem key={aspect} value={aspect}>Aspek {aspect}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 1. Ringkasan Umum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Aspek Tercapai/Belum Tercapai</CardTitle>
            <CardDescription>Berdasarkan threshold 85%</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutData} />
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
              yKeys={years.map((year, index) => ({
                key: `year_${year}`,
                name: year.toString(),
                color: `hsl(var(--chart-${(index % 5) + 1}))`
              }))}
              layout="vertical"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capaian per Aspek ({latestYear})</CardTitle>
            <CardDescription>Perbandingan bobot, skor, dan capaian</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={achievementPerAspect}
              xKey="aspect"
              yKeys={[
                { key: 'bobot', name: 'Bobot', color: 'hsl(var(--muted))' },
                { key: 'skor', name: 'Skor', color: 'hsl(var(--primary))' },
                { key: 'capaian', name: 'Capaian (%)', color: 'hsl(var(--success))' }
              ]}
              layout="vertical"
            />
          </CardContent>
        </Card>
      </div>

      {/* 3. Data Table */}
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
                        item.Capaian >= threshold 
                          ? 'bg-success/10 text-success-foreground' 
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