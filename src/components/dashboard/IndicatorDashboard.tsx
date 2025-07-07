import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Get unique years and sections
  const years = [...new Set(data.map(item => item.Tahun))].sort();
  const sections = [...new Set(data.map(item => item.Section))].sort();

  // Filter data
  const filteredData = data.filter(item => {
    const yearMatch = selectedYear === 'all' || item.Tahun.toString() === selectedYear;
    const sectionMatch = selectedSection === 'all' || item.Section === selectedSection;
    return yearMatch && sectionMatch;
  });

  // 1. Rekap Capaian Skor Tiap Aspek
  const aspectAchievement = sections.map(section => {
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
  const yearComparison = years.map(year => {
    const result: any = { year };
    sections.forEach(section => {
      const sectionYearData = data.filter(item => item.Tahun === year && item.Section === section);
      const totalSkor = sectionYearData.reduce((sum, item) => sum + item.Skor, 0);
      const totalBobot = sectionYearData.reduce((sum, item) => sum + item.Bobot, 0);
      const capaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
      result[`aspek_${section}`] = Number(capaian.toFixed(2));
    });
    return result;
  });

  // 3. Proporsi Capaian Tiap Aspek
  const proportionData = sections.map(section => {
    const sectionData = filteredData.filter(item => item.Section === section);
    const totalSkor = sectionData.reduce((sum, item) => sum + item.Skor, 0);
    return {
      name: `Aspek ${section}`,
      value: Number(totalSkor.toFixed(2)),
      color: `hsl(var(--chart-${(sections.indexOf(section) % 5) + 1}))`
    };
  });

  // 4. Indikator Belum Tercapai Maksimal
  const belumMaksimal = filteredData.filter(item => 
    item.Capaian < 100 || item.Skor < item.Bobot
  ).sort((a, b) => a.Capaian - b.Capaian);

  // 5. Top 5 dan Bottom 5 Indikator
  const sortedBySkor = [...filteredData].sort((a, b) => b.Skor - a.Skor);
  const top5 = sortedBySkor.slice(0, 5);
  const bottom5 = sortedBySkor.slice(-5).reverse();

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

        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aspek</SelectItem>
            {sections.map(section => (
              <SelectItem key={section} value={section}>Aspek {section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 1. Rekap Capaian dan Proporsi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Proporsi Kontribusi Skor</CardTitle>
            <CardDescription>Distribusi skor antar aspek</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={proportionData} />
          </CardContent>
        </Card>
      </div>

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
            yKeys={sections.map((section, index) => ({
              key: `aspek_${section}`,
              name: `Aspek ${section}`,
              color: `hsl(var(--chart-${(index % 5) + 1}))`
            }))}
          />
        </CardContent>
      </Card>

      {/* 3. Top 5 dan Bottom 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Indikator Terbaik</CardTitle>
            <CardDescription>Indikator dengan skor tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-success/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Aspek {item.Section} - No. {item.No}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.Deskripsi}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-success">{item.Skor.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.Capaian.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bottom 5 Indikator</CardTitle>
            <CardDescription>Indikator yang perlu diperbaiki</CardDescription>
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
                    <p className="font-bold text-warning">{item.Skor.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.Capaian.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Indikator Belum Tercapai Maksimal */}
      <Card>
        <CardHeader>
          <CardTitle>Indikator Belum Tercapai Maksimal</CardTitle>
          <CardDescription>Daftar indikator yang perlu peningkatan</CardDescription>
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
                  <TableHead>Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {belumMaksimal.slice(0, 10).map((item, index) => (
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
                    <TableCell className="text-destructive">
                      -{(item.Bobot - item.Skor).toFixed(3)}
                    </TableCell>
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