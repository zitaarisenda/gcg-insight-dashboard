import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface IndicatorData {
  Level: number;
  Type: string;
  Section: string;
  No: number;
  Deskripsi: string;
  Jumlah_Parameter: number;
  Bobot: number;
  Skor: number;
  Capaian: number;
  Tahun: number;
}

interface IndicatorDashboardProps {
  data: IndicatorData[];
}

export const IndicatorDashboard = ({ data }: IndicatorDashboardProps) => {
  const [yearFrom, setYearFrom] = useState<string>('all');
  const [yearTo, setYearTo] = useState<string>('all');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [minCapaian, setMinCapaian] = useState<string>('');
  const [maxCapaian, setMaxCapaian] = useState<string>('');

  // Get unique years and sections
  const years = [...new Set(data.map(item => item.Tahun))].sort();
  const sections = [...new Set(data.map(item => item.Section))].sort();

  // Filter data
  const filteredData = data.filter(item => {
    const yearMatch = (yearFrom === 'all' && yearTo === 'all') || 
      (yearFrom === 'all' ? item.Tahun <= parseInt(yearTo) : 
       yearTo === 'all' ? item.Tahun >= parseInt(yearFrom) :
       item.Tahun >= parseInt(yearFrom) && item.Tahun <= parseInt(yearTo));
    const sectionMatch = selectedSections.length === 0 || selectedSections.includes(item.Section);
    const capaianMatch = (!minCapaian || item.Capaian >= parseFloat(minCapaian)) &&
                         (!maxCapaian || item.Capaian <= parseFloat(maxCapaian));
    return yearMatch && sectionMatch && capaianMatch;
  });

  // Get filtered years and sections for chart data
  const filteredYears = yearFrom === 'all' && yearTo === 'all' ? years :
    years.filter(year => 
      (yearFrom === 'all' || year >= parseInt(yearFrom)) &&
      (yearTo === 'all' || year <= parseInt(yearTo))
    );
  const filteredSections = selectedSections.length === 0 ? sections : selectedSections;

  // 1. Rekap Capaian Skor Tiap Aspek
  const aspectAchievement = filteredSections.map(section => {
    const sectionData = filteredData.filter(item => item.Section === section);
    const totalSkor = sectionData.reduce((sum, item) => sum + item.Skor, 0);
    const totalBobot = sectionData.reduce((sum, item) => sum + item.Bobot, 0);
    const capaianPersen = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
    
    return {
      section: `Aspek ${section}`,
      totalSkor: Number(totalSkor.toFixed(2)),
      totalBobot: Number(totalBobot.toFixed(2)),
      capaianPersen: Number(capaianPersen.toFixed(2))
    };
  });

  // 2. Perbandingan Capaian antar Tahun
  const yearComparison = filteredYears.map(year => {
    const result: any = { year };
    filteredSections.forEach(section => {
      const sectionYearData = data.filter(item => item.Tahun === year && item.Section === section);
      const totalSkor = sectionYearData.reduce((sum, item) => sum + item.Skor, 0);
      const totalBobot = sectionYearData.reduce((sum, item) => sum + item.Bobot, 0);
      const capaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
      result[`aspek_${section}`] = Number(capaian.toFixed(2));
    });
    return result;
  });

  // 3. Top 5 dan Bottom 5 Indikator berdasarkan Capaian
  const sortedByCapaian = [...filteredData].sort((a, b) => b.Capaian - a.Capaian);
  const top5 = sortedByCapaian.slice(0, 5);
  const bottom5 = sortedByCapaian.slice(-5).reverse();

  // 4. Pie chart bobot setiap indikator dalam tiap aspek
  const aspectWeightCharts = filteredSections.map(section => {
    const sectionData = filteredData.filter(item => item.Section === section);
    const totalBobot = sectionData.reduce((sum, item) => sum + item.Bobot, 0);
    const pieData = sectionData.map((item, index) => ({
      name: `No. ${item.No}`,
      value: Number(((item.Bobot / totalBobot) * 100).toFixed(1)),
      color: `hsl(var(--chart-${(index % 5) + 1}))`
    }));
    
    return {
      section,
      data: pieData
    };
  });

  // 5. Progress Capaian per indikator dalam tiap aspek
  const aspectProgressCharts = filteredSections.map(section => {
    const sectionData = filteredData.filter(item => item.Section === section);
    const progressData = sectionData.map(item => ({
      indicator: `No. ${item.No}`,
      capaian: item.Capaian,
      skor: item.Skor,
      bobot: item.Bobot
    }));
    
    return {
      section,
      data: progressData
    };
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <label className="text-sm font-medium">Min Capaian (%):</label>
              <Input 
                type="number" 
                placeholder="0" 
                value={minCapaian} 
                onChange={(e) => setMinCapaian(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Capaian (%):</label>
              <Input 
                type="number" 
                placeholder="100" 
                value={maxCapaian} 
                onChange={(e) => setMaxCapaian(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Pilih Aspek (kosong = semua):</label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {sections.map(section => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox
                    id={section}
                    checked={selectedSections.includes(section)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSections([...selectedSections, section]);
                      } else {
                        setSelectedSections(selectedSections.filter(s => s !== section));
                      }
                    }}
                  />
                  <label htmlFor={section} className="text-sm">Aspek {section}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Rekap Capaian */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap Capaian Skor Tiap Aspek</CardTitle>
          <CardDescription>Persentase capaian per aspek</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart 
            data={aspectAchievement}
            xKey="section"
            yKeys={[
              { key: 'capaianPersen', name: 'Capaian (%)', color: 'hsl(var(--primary))' }
            ]}
            layout="vertical"
          />
        </CardContent>
      </Card>

      {/* 2. Perbandingan Antar Tahun */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Capaian Antar Tahun</CardTitle>
          <CardDescription>Tren capaian per aspek dari tahun ke tahun</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart 
            data={yearComparison}
            xKey="year"
            yKeys={filteredSections.map((section, index) => ({
              key: `aspek_${section}`,
              name: `Aspek ${section}`,
              color: `hsl(var(--chart-${(index % 5) + 1}))`
            }))}
          />
        </CardContent>
      </Card>

      {/* 3. Top 5 dan Bottom 5 berdasarkan Capaian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Indikator Terbaik</CardTitle>
            <CardDescription>Indikator dengan capaian tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Aspek {item.Section} - No. {item.No}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.Deskripsi}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-success">{item.Capaian.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Skor: {item.Skor.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bottom 5 Indikator</CardTitle>
            <CardDescription>Indikator dengan capaian terendah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottom5.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Aspek {item.Section} - No. {item.No}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.Deskripsi}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-warning">{item.Capaian.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Skor: {item.Skor.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Pie Charts Bobot per Aspek */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Distribusi Bobot Indikator per Aspek</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aspectWeightCharts.map(({ section, data }) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-base">Aspek {section}</CardTitle>
                <CardDescription>Distribusi bobot indikator</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={data} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Progress Charts per Aspek */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Progress Capaian per Indikator dalam Tiap Aspek</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aspectProgressCharts.map(({ section, data }) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-base">Aspek {section}</CardTitle>
                <CardDescription>Capaian per indikator</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={data}
                  xKey="indicator"
                  yKeys={[
                    { key: 'capaian', name: 'Capaian (%)', color: 'hsl(var(--success))' },
                    { key: 'skor', name: 'Skor', color: 'hsl(var(--primary))' }
                  ]}
                  layout="vertical"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Detail Indikator</CardTitle>
          <CardDescription>Tabel lengkap data indikator yang telah difilter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspek</TableHead>
                  <TableHead>No</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Skor</TableHead>
                  <TableHead>Bobot</TableHead>
                  <TableHead>Capaian</TableHead>
                  <TableHead>Tahun</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>Aspek {item.Section}</TableCell>
                    <TableCell>{item.No}</TableCell>
                    <TableCell className="max-w-md">{item.Deskripsi}</TableCell>
                    <TableCell>{item.Skor.toFixed(3)}</TableCell>
                    <TableCell>{item.Bobot.toFixed(3)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.Capaian >= 90 
                          ? 'bg-success/10 text-success' 
                          : item.Capaian >= 70
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {item.Capaian.toFixed(1)}%
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