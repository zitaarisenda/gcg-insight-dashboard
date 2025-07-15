
// ...removed duplicate useState import...
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React, { useState } from 'react';

interface IndicatorData {
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

interface IndicatorDashboardProps {
  data: IndicatorData[];
  onDeleteData?: () => void;
}

export const IndicatorDashboard = ({ data, onDeleteData }: IndicatorDashboardProps) => {
  const [yearFrom, setYearFrom] = useState<string>('all');
  const [yearTo, setYearTo] = useState<string>('all');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [minCapaian, setMinCapaian] = useState<string>('');
  const [maxCapaian, setMaxCapaian] = useState<string>('');

  // Helper function to parse numeric values and handle invalid data
  const parseNumericValue = (value: unknown): number => {
    if (value === '-' || value === '' || value == null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Filter data to get indicators only (Type = "indicator")
  const indicatorData = data.filter(item => item.Type === 'indicator');
  
  // Extract aspect data: combine header info with subtotal values
  const aspectData = data.filter(item => item.Type === 'header').map(item => {
    // Find corresponding subtotal row for this section
    const subtotalRow = data.find(subtotal => 
      subtotal.Type === 'subtotal' && subtotal.Section === item.Section
    );
    
    // Use subtotal values if available, otherwise use header values
    const bobot = subtotalRow ? parseNumericValue(subtotalRow.Bobot) : parseNumericValue(item.Bobot);
    const skor = subtotalRow ? parseNumericValue(subtotalRow.Skor) : parseNumericValue(item.Skor);
    const capaian = subtotalRow ? parseNumericValue(subtotalRow.Capaian) : parseNumericValue(item.Capaian);
    
    return {
      ...item,
      Type: 'aspek',
      No: item.Section,
      Deskripsi: item.Deskripsi || item.Aspek_Pengujian || `Aspek ${item.Section}`,
      Bobot: bobot,
      Skor: skor,
      Capaian: capaian,
      Penjelasan: capaian > 85 ? 'Sangat Baik' : capaian > 75 ? 'Baik' : capaian > 60 ? 'Cukup Baik' : capaian > 50 ? 'Kurang Baik' :'Perlu Perbaikan',
      // Copy other fields from subtotal if available
      ...(subtotalRow && {
        Jumlah_Parameter: subtotalRow.Jumlah_Parameter,
        // Any other fields after Aspek_Pengujian from subtotal
      })
    };
  });
  
  // Get unique years and sections from indicator data
  const years = [...new Set(indicatorData.map(item => item.Tahun))].sort();
  const sections = [...new Set(indicatorData.map(item => item.Section))].sort();

  // Filter indicator data
  const filteredData = indicatorData.filter(item => {
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

  // Filter aspect data based on selections
  const filteredAspectData = aspectData.filter(item => {
    const yearMatch = (yearFrom === 'all' && yearTo === 'all') || 
      (yearFrom === 'all' ? item.Tahun <= parseInt(yearTo) : 
       yearTo === 'all' ? item.Tahun >= parseInt(yearFrom) :
       item.Tahun >= parseInt(yearFrom) && item.Tahun <= parseInt(yearTo));
    const sectionMatch = selectedSections.length === 0 || selectedSections.includes(item.No);
    return yearMatch && sectionMatch;
  });

  // ASPECT LEVEL VISUALIZATIONS
  
  // 1. Pie Chart by Penjelasan (Aspect Status)
  const aspectPenjelasanCounts = filteredAspectData.reduce((acc, item) => {
    acc[item.Penjelasan] = (acc[item.Penjelasan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const aspectPenjelasanData = Object.entries(aspectPenjelasanCounts).map(([key, value], index) => ({
    name: key,
    value,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  // 2. Average Score per Year (Aspect Level)
  const aspectAvgScoreData = filteredYears.map(year => {
    const yearData = filteredAspectData.filter(item => item.Tahun === year);
    const avgScore = yearData.length > 0 ? yearData.reduce((sum, item) => sum + item.Skor, 0) / yearData.length : 0;
    return { year, avgScore: Number(avgScore.toFixed(2)) };
  });

  // 3. Aspect Achievement Trend by Year
  const aspectAchievementTrendByYear = filteredYears.map(year => {
    const yearData: Record<string, number> = { year };
    filteredSections.forEach(aspect => {
      const yearAspectData = aspectData.find(item => item.No === aspect && item.Tahun === year);
      yearData[`aspek_${aspect}`] = yearAspectData ? yearAspectData.Capaian : 0;
    });
    return yearData;
  });

  // ...removed aspectTrendData and selectedAspectForTrend logic...

  // 5. Aspect Weight Distribution
  const totalAspectBobot = filteredAspectData.reduce((sum, item) => sum + item.Bobot, 0);
  const aspectWeightData = filteredSections.map((aspect, index) => {
    const aspectDataForWeight = filteredAspectData.filter(item => item.No === aspect);
    const totalAspectBobotForSection = aspectDataForWeight.reduce((sum, item) => sum + item.Bobot, 0);
    return {
      name: `Aspek ${aspect}`,
      value: Number(((totalAspectBobotForSection / totalAspectBobot) * 100).toFixed(1)),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
      totalBobot: Number(totalAspectBobotForSection.toFixed(2)),
    };
  });

  // INDICATOR LEVEL VISUALIZATIONS (existing)

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
    const result: Record<string, number> = { year };
    filteredSections.forEach(section => {
      const sectionYearData = indicatorData.filter(item => item.Tahun === year && item.Section === section);
      const totalSkor = sectionYearData.reduce((sum, item) => sum + item.Skor, 0);
      const totalBobot = sectionYearData.reduce((sum, item) => sum + item.Bobot, 0);
      const capaian = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0;
      result[`aspek_${section}`] = Number(capaian.toFixed(2));
    });
    return result;
  });

  // 3. Top 5 dan Bottom 5 Indikator berdasarkan Capaian
  const sortedByCapaian = [...filteredData].sort((a, b) => Number(b.Capaian) - Number(a.Capaian));
  const top5 = sortedByCapaian.slice(0, 5);
  const bottom5 = sortedByCapaian.slice(-5).reverse();

  // 4. Pie chart bobot setiap indikator dalam tiap aspek (akumulasi semua tahun)
  const aspectWeightCharts = filteredSections.map(section => {
    // Ambil semua indikator untuk section ini di SEMUA tahun
    const sectionDataAllYears = indicatorData.filter(item => item.Section === section);
    // Total bobot seluruh indikator pada aspek ini (semua tahun)
    const totalBobot = sectionDataAllYears.reduce((sum, item) => sum + item.Bobot, 0);
    // Gabungkan indikator dengan No yang sama (di tahun berbeda), jumlahkan bobotnya
    const indikatorMap = new Map();
    sectionDataAllYears.forEach(item => {
      const key = item.No;
      if (!indikatorMap.has(key)) {
        indikatorMap.set(key, { ...item });
      } else {
        indikatorMap.get(key).Bobot += item.Bobot;
      }
    });
    const pieData = Array.from(indikatorMap.values()).map((item, index) => ({
      name: `No. ${item.No}`,
      value: totalBobot > 0 ? Number(((item.Bobot / totalBobot) * 100).toFixed(1)) : 0,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
      totalBobot: item.Bobot // bobot asli indikator ini (akumulasi semua tahun)
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

  // Anchor IDs for sidebar navigation
  const anchorIds = {
    filter: 'filter-data',
    aspek1: 'aspek-status',
    aspek2: 'aspek-bobot',
    aspek3: 'aspek-avgscore',
    aspek4: 'aspek-trend',
    aspek5: 'aspek-table',
    indikator1: 'indikator-rekap',
    indikator2: 'indikator-topbottom',
    indikator3: 'indikator-bobot',
    indikator4: 'indikator-table',
  };

  // Sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex gap-6">
      {/* Sidebar Drawer Button */}
      <button
        className="fixed top-1/2 left-0 z-40 -translate-y-1/2 bg-primary text-primary-foreground shadow-lg rounded-r-full w-10 h-20 flex items-center justify-center transition hover:bg-primary/90"
        style={{ borderTopLeftRadius: '40px', borderBottomLeftRadius: '40px' }}
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka Navigasi"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* Sidebar Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-zinc-900 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderTopRightRadius: '32px', borderBottomRightRadius: '32px' }}
        tabIndex={-1}
        aria-label="Navigasi Dashboard"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="font-bold text-lg text-primary">Navigasi</span>
          <button
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup Navigasi"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <nav className="px-6 py-6 overflow-y-auto h-[calc(100%-64px)]">
          <ul className="space-y-4 text-base">
            <li>
              <a href={`#${anchorIds.filter}`} className="block px-3 py-2 rounded-lg font-semibold text-primary hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>
                Filter Data
              </a>
            </li>
            <li className="mt-2 mb-1 text-xs uppercase tracking-wider text-zinc-500 font-bold">Analisis Aspek</li>
            <ul className="space-y-1 mb-4">
              <li><a href={`#${anchorIds.aspek1}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Distribusi Status Aspek</a></li>
              <li><a href={`#${anchorIds.aspek2}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Distribusi Bobot Antar Aspek</a></li>
              <li><a href={`#${anchorIds.aspek3}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Skor Rata-rata Aspek Tiap Tahun</a></li>
              <li><a href={`#${anchorIds.aspek4}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Capaian Tiap Aspek dari Tahun ke Tahun</a></li>
              <li><a href={`#${anchorIds.aspek5}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Data Detail Aspek</a></li>
            </ul>
            <li className="mb-1 text-xs uppercase tracking-wider text-zinc-500 font-bold">Analisis Indikator</li>
            <ul className="space-y-1">
              <li><a href={`#${anchorIds.indikator1}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Rekap Capaian Skor Tiap Aspek</a></li>
              <li><a href={`#${anchorIds.indikator2}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Top & Bottom 5 Indikator</a></li>
              <li><a href={`#${anchorIds.indikator3}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Distribusi Bobot Indikator per Aspek</a></li>
              <li><a href={`#${anchorIds.indikator4}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Data Detail Indikator</a></li>
            </ul>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 space-y-6">
        {/* Enhanced Filters */}
        <Card id={anchorIds.filter}>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        {/* ASPECT LEVEL VISUALIZATIONS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-center">Analisis Level Aspek</h2>
          {/* 1. Aspect Overview - Mixed Layout */}
          <div className="space-y-6">
            {/* Distribusi Charts - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card id={anchorIds.aspek1}>
                <CardHeader>
                  <CardTitle>Distribusi Status Aspek</CardTitle>
                  <CardDescription>Berdasarkan tingkat capaian</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart 
                    data={aspectPenjelasanData.map(d => ({ ...d, totalAspek: aspectPenjelasanData.reduce((sum, item) => sum + item.value, 0) }))}
                    tooltipType="aspek"
                  />
                </CardContent>
              </Card>
              <Card id={anchorIds.aspek2}>
                <CardHeader>
                  <CardTitle>Distribusi Bobot Antar Aspek</CardTitle>
                  <CardDescription>Persentase bobot setiap aspek (berdasarkan total bobot seluruh indikator di aspek tersebut, semua tahun)</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart data={aspectWeightData} />
                </CardContent>
              </Card>
            </div>
            {/* Trend Charts - Vertical */}
            <Card id={anchorIds.aspek3}>
              <CardHeader>
                <CardTitle>Skor Rata-rata Aspek Tiap Tahun</CardTitle>
                <CardDescription>Tren kinerja aspek dari tahun ke tahun</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={aspectAvgScoreData}
                  xKey="year"
                  yKeys={[{ key: 'avgScore', name: 'Rata-rata Skor', color: 'hsl(var(--primary))' }]}
                />
              </CardContent>
            </Card>
            <Card id={anchorIds.aspek4}>
              <CardHeader>
                <CardTitle>Capaian Tiap Aspek dari Tahun ke Tahun</CardTitle>
                <CardDescription>Tren capaian per aspek (Y: Capaian, X: Tahun)</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={aspectAchievementTrendByYear}
                  xKey="year"
                  yKeys={filteredSections.map((aspect, index) => ({
                    key: `aspek_${aspect}`,
                    name: `Aspek ${aspect}`,
                    color: `hsl(var(--chart-${(index % 5) + 1}))`
                  }))}
                />
              </CardContent>
            </Card>
          </div>
          {/* 3. Aspect Details Table */}
          <Card id={anchorIds.aspek5}>
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
                    {filteredAspectData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">Aspek {item.No}</TableCell>
                        <TableCell className="max-w-md">{item.Deskripsi}</TableCell>
                        <TableCell>{item.Bobot.toFixed(3)}</TableCell>
                        <TableCell>{item.Skor.toFixed(3)}</TableCell>
                        <TableCell>{item.Capaian.toFixed(2)}%</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.Capaian > 85
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : item.Capaian > 75
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                              : item.Capaian > 60
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                              : item.Capaian > 50
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
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

        {/* INDICATOR LEVEL VISUALIZATIONS */}
        <div className="space-y-6 mt-12">
          <h2 className="text-xl font-bold text-center">Analisis Level Indikator</h2>
          {/* 1. Rekap Capaian */}
          <Card id={anchorIds.indikator1}>
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
          {/* 2. Top 5 dan Bottom 5 berdasarkan Capaian */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id={anchorIds.indikator2}>
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
                        <p className="font-medium text-sm">Aspek {item.Section} - No. {item.No} <span className="text-xs text-muted-foreground">(Tahun: {item.Tahun})</span></p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.Deskripsi}</p>
                      </div>
                      <div className="text-right ml-4">
                    <p className="font-bold text-success">{Number(item.Capaian).toFixed(1)}%</p>
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
                        <p className="font-medium text-sm">Aspek {item.Section} - No. {item.No} <span className="text-xs text-muted-foreground">(Tahun: {item.Tahun})</span></p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.Deskripsi}</p>
                      </div>
                      <div className="text-right ml-4">
                    <p className="font-bold text-warning">{Number(item.Capaian).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Skor: {item.Skor.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 3. Pie Charts Bobot per Aspek */}
          <div className="space-y-4" id={anchorIds.indikator3}>
            <h3 className="text-lg font-semibold">Distribusi Bobot Indikator per Aspek</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aspectWeightCharts.map(({ section, data }) => (
                <Card key={section}>
                  <CardHeader>
                    <CardTitle className="text-base">Aspek {section}</CardTitle>
                    <CardDescription>Distribusi bobot indikator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonutChart data={data} tooltipType="bobot" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* 4. Data Table */}
          <Card id={anchorIds.indikator4}>
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
                      <TableHead>Bobot</TableHead>
                      <TableHead>Skor</TableHead>
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
                        <TableCell>{item.Bobot.toFixed(3)}</TableCell>
                        <TableCell>{item.Skor.toFixed(3)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number(item.Capaian) > 85
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : Number(item.Capaian) > 75
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            : Number(item.Capaian) > 60
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : Number(item.Capaian) > 50
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {Number(item.Capaian).toFixed(1)}%
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
      </div>
    </div>
  );
};
