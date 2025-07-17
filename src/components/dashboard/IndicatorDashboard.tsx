
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
  Jumlah_Parameter?: number;
  Bobot?: number;
  Skor?: number;
  Capaian?: number | string;
  Penjelasan?: string;
  Tahun?: number;
  Penilai?: string;
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
  const [selectedPenilai, setSelectedPenilai] = useState<string>('all');

  // Helper function to parse numeric values and handle invalid data
  const parseNumericValue = (value: unknown): number => {
    if (value === '-' || value === '' || value == null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Filter data to get indicators only (Type = "indicator")
  const indicatorData = data.filter(item => item.Type === 'indicator');
  // Get unique Penilai values
  const penilaiList = Array.from(new Set(data.map(item => item.Penilai).filter(Boolean)));
  
  // Extract aspect data: combine header info with subtotal values, per tahun & section
  const aspectData: IndicatorData[] = [];
  const uniqueTahunSection = Array.from(new Set(data.filter(item => item.Type === 'header').map(item => `${item.Tahun}__${item.Section}`)));
  for (const key of uniqueTahunSection) {
    const [tahunStr, section] = key.split('__');
    const tahun = parseInt(tahunStr);
    // Cari baris header untuk tahun & section ini
    const headerRow = data.find(item => item.Type === 'header' && item.Tahun === tahun && item.Section === section);
    // Cari baris subtotal untuk tahun & section ini
    const subtotalRow = data.find(item => item.Type === 'subtotal' && item.Tahun === tahun && item.Section === section);
    // Deskripsi dari header, Bobot/Skor/Capaian dari subtotal (atau header jika subtotal tidak ada)
    const deskripsi = headerRow?.Aspek_Pengujian || headerRow?.Deskripsi || `Aspek ${section}`;
    // Bobot dan Skor: tetap number (0 jika kosong), hanya Capaian yang boleh string kosong
    const rawBobot = subtotalRow ? subtotalRow.Bobot : headerRow?.Bobot;
    const bobot = (rawBobot === '' || rawBobot === null || typeof rawBobot === 'undefined') ? 0 : parseNumericValue(rawBobot);
    const rawSkor = subtotalRow ? subtotalRow.Skor : headerRow?.Skor;
    const skor = (rawSkor === '' || rawSkor === null || typeof rawSkor === 'undefined') ? 0 : parseNumericValue(rawSkor);
    const rawCapaian = subtotalRow ? subtotalRow.Capaian : headerRow?.Capaian;
    const capaian = (rawCapaian === '' || rawCapaian === null || typeof rawCapaian === 'undefined') ? '' : parseNumericValue(rawCapaian);
    aspectData.push({
      ...headerRow,
      Tahun: tahun,
      Section: section,
      Type: 'aspek',
      No: section,
      Deskripsi: deskripsi,
      Bobot: bobot,
      Skor: skor,
      Capaian: capaian,
      Penjelasan: capaian === '' ? '' : (capaian > 85 ? 'Sangat Baik' : capaian > 75 ? 'Baik' : capaian > 60 ? 'Cukup Baik' : capaian > 50 ? 'Kurang Baik' :'Perlu Perbaikan'),
      Penilai: headerRow?.Penilai ?? '',
      ...(subtotalRow && {
        Jumlah_Parameter: subtotalRow.Jumlah_Parameter,
      })
    });
  }
  

  // Gabungkan tahun dari indikator dan aspek untuk filter tahun
  const indicatorYears = indicatorData.map(item => item.Tahun);
  const aspectYearsAll = aspectData.map(item => item.Tahun);
  const years = Array.from(new Set([...indicatorYears, ...aspectYearsAll])).filter(Boolean).sort((a, b) => a - b);
  const sections = [...new Set(indicatorData.map(item => item.Section))].sort();

  // Get unique years from aspectData (for aspect visualizations)
  const aspectYears = [...new Set(aspectData.map(item => item.Tahun))].sort();
  // Get unique sections from aspectData (for aspect visualizations)
  const aspectSections = [...new Set(aspectData.map(item => item.No))].sort();

  // Filter indicator data
  const filteredData = indicatorData.filter(item => {
    const yearMatch = (yearFrom === 'all' && yearTo === 'all') || 
      (yearFrom === 'all' ? item.Tahun <= parseInt(yearTo) : 
       yearTo === 'all' ? item.Tahun >= parseInt(yearFrom) :
       item.Tahun >= parseInt(yearFrom) && item.Tahun <= parseInt(yearTo));
    const sectionMatch = selectedSections.length === 0 || selectedSections.includes(item.Section);
    const capaianValue = typeof item.Capaian === 'number' ? item.Capaian : parseFloat(item.Capaian as string);
    const capaianMatch = (!minCapaian || capaianValue >= parseFloat(minCapaian)) &&
                         (!maxCapaian || capaianValue <= parseFloat(maxCapaian));
    const penilaiMatch = selectedPenilai === 'all' || item.Penilai === selectedPenilai;
    return yearMatch && sectionMatch && capaianMatch && penilaiMatch;
  });

  // Get filtered years and sections for chart data (indicator visualizations)
  const filteredYears = yearFrom === 'all' && yearTo === 'all' ? years :
    years.filter(year => 
      (yearFrom === 'all' || year >= parseInt(yearFrom)) &&
      (yearTo === 'all' || year <= parseInt(yearTo))
    );
  const filteredSections = selectedSections.length === 0 ? sections : selectedSections;

  // Get filtered years and sections for aspect visualizations
  const filteredAspectYears = yearFrom === 'all' && yearTo === 'all' ? aspectYears :
    aspectYears.filter(year => 
      (yearFrom === 'all' || year >= parseInt(yearFrom)) &&
      (yearTo === 'all' || year <= parseInt(yearTo))
    );
  const filteredAspectSections = selectedSections.length === 0 ? aspectSections : selectedSections;

  // Filter aspect data based on selections
  const filteredAspectData = aspectData.filter(item => {
    const yearMatch = filteredAspectYears.includes(item.Tahun);
    const sectionMatch = filteredAspectSections.length === 0 || filteredAspectSections.includes(String(item.No));
    const penilaiMatch = selectedPenilai === 'all' || item.Penilai === selectedPenilai;
    return yearMatch && sectionMatch && penilaiMatch;
  });

  // ASPECT LEVEL VISUALIZATIONS
  
  // 1. Pie Chart by Penjelasan (Aspect Status)
  const aspectPenjelasanCounts = filteredAspectData
    .filter(item => item.Capaian !== '')
    .reduce((acc, item) => {
      acc[item.Penjelasan] = (acc[item.Penjelasan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const aspectPenjelasanData = Object.entries(aspectPenjelasanCounts).map(([key, value], index) => ({
    name: key,
    value,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  // 2. Total Score per Year (Aspect Level)
  const aspectTotalScoreData = filteredAspectYears
    .map(year => {
      const yearData = filteredAspectData.filter(item => item.Tahun === year);
      const totalScore = yearData.reduce((sum, item) => sum + item.Skor, 0);
      return { year, totalScore: Number(totalScore.toFixed(2)) };
    })
    .filter(item => item.totalScore > 0);

  // Filter tahun yang total skor > 0 untuk grafik capaian aspek
  const aspectYearsWithScore = aspectTotalScoreData.map(item => item.year);

  // 3. Aspect Achievement Trend by Year
  const aspectAchievementTrendByYear = aspectYearsWithScore.map(year => {
    const yearData: Record<string, number> = { year };
    filteredAspectSections.forEach(aspect => {
      const yearAspectData = aspectData.find(item => String(item.No) === String(aspect) && item.Tahun === year);
      yearData[`aspek_${aspect}`] = yearAspectData ? Number(yearAspectData.Capaian) : 0;
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
  // Only include aspects that are NOT empty in all selected years for the chart
  const aspekKosongSet = new Set(
    filteredAspectData
      .filter(item => item.Capaian === '' && item.Penjelasan === '')
      .map(item => String(item.No))
  );
  const aspectAchievement = filteredSections
    .filter(section => !aspekKosongSet.has(String(section)))
    .map(section => {
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
  // Exclude indicators from aspects with empty Capaian & Penjelasan
  const aspekKosongSetForIndikator = new Set(
    filteredAspectData
      .filter(item => item.Capaian === '' && item.Penjelasan === '')
      .map(item => String(item.No))
  );
  const filteredDataForTopBottom = filteredData.filter(item => !aspekKosongSetForIndikator.has(String(item.Section)));
  const sortedByCapaian = [...filteredDataForTopBottom].sort((a, b) => Number(b.Capaian) - Number(a.Capaian));
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

  // State for table row limits
  const [showAllAspek, setShowAllAspek] = useState(false);
  const [showAllIndikator, setShowAllIndikator] = useState(false);

  // Row limits
  const aspekTableLimit = 10;
  const indikatorTableLimit = 10;

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
            <li className="mt-2 mb-1 text-xs uppercase tracking-wider text-zinc-500 font-bold">Level Aspek</li>
            <ul className="space-y-1 mb-4">
              <li><a href={`#${anchorIds.aspek1}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Distribusi Status Aspek</a></li>
              <li><a href={`#${anchorIds.aspek2}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Distribusi Bobot Antar Aspek</a></li>
              <li><a href={`#${anchorIds.aspek3}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Jumlah Skor Tiap Tahun</a></li>
              <li><a href={`#${anchorIds.aspek4}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Capaian Tiap Aspek dari Tahun ke Tahun</a></li>
              <li><a href={`#${anchorIds.aspek5}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Data Detail Aspek</a></li>
            </ul>
            <li className="mb-1 text-xs uppercase tracking-wider text-zinc-500 font-bold">Level Indikator</li>
            <ul className="space-y-1">
              <li><a href={`#${anchorIds.indikator1}`} className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition" onClick={() => setSidebarOpen(false)}>Rekap Capaian Tiap Aspek</a></li>
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
            <button
              className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:bg-muted/70 border border-zinc-300 ml-4"
              type="button"
              onClick={() => {
                setYearFrom('all');
                setYearTo('all');
                setSelectedSections([]);
                setMinCapaian('');
                setMaxCapaian('');
                setSelectedPenilai('all');
              }}
            >
              Clear Filter
            </button>
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
              <div>
                <label className="text-sm font-medium">Penilai:</label>
                <Select value={selectedPenilai} onValueChange={setSelectedPenilai}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {penilaiList.map(penilai => (
                      <SelectItem key={penilai} value={penilai}>{penilai}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {/* Keterangan aspek yang tidak ditampilkan di grafik */}
                  {(() => {
                    // Group by No, collect years
                    const aspekKosong = filteredAspectData.filter(item => item.Capaian === '' && item.Penjelasan === '');
                    if (aspekKosong.length === 0) return null;
                    const grouped = aspekKosong.reduce((acc, item) => {
                      const key = item.No;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(item.Tahun);
                      return acc;
                    }, {} as Record<string, (number | string)[]>);
                    return (
                      <div className="mt-4 text-xs text-muted-foreground">
                        <div className="font-semibold mb-1">Data yang tidak ditampilkan:</div>
                        <ul className="list-disc pl-5">
                          {Object.entries(grouped).map(([no, years], idx) => (
                            <li key={idx}>
                              Aspek {no} Tahun {years.sort((a, b) => Number(b) - Number(a)).join(', ')} (kolom Capaian & Penjelasan kosong).
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
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
                <CardTitle>Jumlah Skor Tiap Tahun</CardTitle>
                <CardDescription>Total skor seluruh aspek per tahun</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={aspectTotalScoreData}
                  xKey="year"
                  yKeys={[{ key: 'totalScore', name: 'Jumlah Skor', color: 'hsl(var(--primary))' }]}
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
                  yKeys={filteredAspectSections
                    .filter(aspekNo => {
                      // Only show aspects that are NOT empty in all selected years
                      return filteredAspectData.some(item => String(item.No) === String(aspekNo) && item.Capaian !== '' && item.Penjelasan !== '');
                    })
                    .map((aspect, index) => ({
                      key: `aspek_${aspect}`,
                      name: `Aspek ${aspect}`,
                      color: `hsl(var(--chart-${(index % 5) + 1}))`
                    }))}
                />
                {/* Keterangan aspek yang tidak ditampilkan di grafik tren capaian */}
                {(() => {
                  // Group by No, collect years
                  const aspekKosong = filteredAspectData.filter(item => item.Capaian === '' && item.Penjelasan === '');
                  if (aspekKosong.length === 0) return null;
                  const grouped = aspekKosong.reduce((acc, item) => {
                    const key = item.No;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item.Tahun);
                    return acc;
                  }, {} as Record<string, (number | string)[]>);
                  return (
                    <div className="mt-4 text-xs text-muted-foreground">
                      <div className="font-semibold mb-1">Data yang tidak ditampilkan:</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(grouped).map(([no, years], idx) => (
                          <li key={idx}>
                            Aspek {no} Tahun {years.sort((a, b) => Number(b) - Number(a)).join(', ')} (kolom Capaian kosong).
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
          {/* 3. Aspect Details Table */}
          <Card id={anchorIds.aspek5}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Detail Aspek</CardTitle>
                <CardDescription>Tabel lengkap data aspek yang telah difilter</CardDescription>
              </div>

            </CardHeader>
            <CardContent>
              <div
                className={'overflow-x-auto max-h-[600px] overflow-y-auto'}
                style={{ scrollbarColor: '#e5e7eb transparent', scrollbarWidth: 'thin' }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aspek</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Bobot</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead>Capaian (%)</TableHead>
                      <TableHead>Penjelasan</TableHead>
                      <TableHead>Tahun</TableHead>
                      <TableHead>Penilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAspectData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">Aspek {item.No}</TableCell>
                        <TableCell className="max-w-md">{item.Deskripsi}</TableCell>
                        <TableCell>{item.Bobot.toFixed(3)}</TableCell>
                        <TableCell>{item.Skor.toFixed(3)}</TableCell>
                        <TableCell>
                          {item.Capaian === '' ? '' : `${Number(item.Capaian).toFixed(2)}%`}
                        </TableCell>
                        <TableCell>
                          {item.Capaian === '' ? '' : (
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
                              {item.Penjelasan}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{item.Tahun}</TableCell>
                        <TableCell>{String(item.Penilai ?? '')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!showAllAspek && (
                  <style>{`
                    .overflow-x-auto::-webkit-scrollbar {
                      height: 8px;
                      width: 8px;
                    }
                    .overflow-x-auto::-webkit-scrollbar-thumb {
                      background: #e5e7eb;
                      border-radius: 6px;
                    }
                    .overflow-x-auto::-webkit-scrollbar-track {
                      background: transparent;
                    }
                  `}</style>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* INDICATOR LEVEL VISUALIZATIONS */}
        <div className="space-y-6 mt-12">
          <h2 className="text-xl font-bold text-center">Analisis Level Indikator</h2>
          {filteredData.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-16">
              <span className="text-lg text-muted-foreground">Data indikator tidak tersedia</span>
            </div>
          ) : (
            <>
              {/* 1. Rekap Capaian */}
              <Card id={anchorIds.indikator1}>
                <CardHeader>
                  <CardTitle>Rekap Capaian Tiap Aspek</CardTitle>
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
                  {/* Keterangan aspek yang tidak ditampilkan di grafik rekap capaian */}
                  {(() => {
                    // Only show years where the aspect has indicator data for that year
                    const aspekKosong = filteredAspectData.filter(item => item.Capaian === '' && item.Penjelasan === '');
                    if (aspekKosong.length === 0) return null;
                    // Build a map: aspectNo -> [years with indicator data but Capaian kosong]
                    const indicatorYearsBySection = {} as Record<string, Set<number>>;
                    filteredData.forEach(item => {
                      if (!indicatorYearsBySection[item.Section]) indicatorYearsBySection[item.Section] = new Set();
                      indicatorYearsBySection[item.Section].add(item.Tahun);
                    });
                    const grouped = aspekKosong.reduce((acc, item) => {
                      const key = item.No;
                      // Only include this year if there is indicator data for this aspect in this year
                      if (indicatorYearsBySection[key] && indicatorYearsBySection[key].has(item.Tahun)) {
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(item.Tahun);
                      }
                      return acc;
                    }, {} as Record<string, (number | string)[]>);
                    // Only show aspects that have at least one year to show
                    const groupedEntries = Object.entries(grouped).filter(([_, years]) => years.length > 0);
                    if (groupedEntries.length === 0) return null;
                    return (
                      <div className="mt-4 text-xs text-muted-foreground">
                        <div className="font-semibold mb-1">Data yang tidak ditampilkan:</div>
                        <ul className="list-disc pl-5">
                          {groupedEntries.map(([no, years], idx) => (
                            <li key={idx}>
                              Aspek {no} Tahun {years.sort((a, b) => Number(b) - Number(a)).join(', ')} (kolom Capaian kosong).
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
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
                {/* Keterangan aspek yang tidak ditampilkan di Top & Bottom 5 */}
                {(() => {
                  // Only show years where the aspect has indicator data for that year
                  const aspekKosong = filteredAspectData.filter(item => item.Capaian === '' && item.Penjelasan === '');
                  if (aspekKosong.length === 0) return null;
                  // Build a map: aspectNo -> [years with indicator data but Capaian kosong]
                  const indicatorYearsBySection = {} as Record<string, Set<number>>;
                  filteredData.forEach(item => {
                    if (!indicatorYearsBySection[item.Section]) indicatorYearsBySection[item.Section] = new Set();
                    indicatorYearsBySection[item.Section].add(item.Tahun);
                  });
                  const grouped = aspekKosong.reduce((acc, item) => {
                    const key = item.No;
                    // Only include this year if there is indicator data for this aspect in this year
                    if (indicatorYearsBySection[key] && indicatorYearsBySection[key].has(item.Tahun)) {
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(item.Tahun);
                    }
                    return acc;
                  }, {} as Record<string, (number | string)[]>);
                  // Only show aspects that have at least one year to show
                  const groupedEntries = Object.entries(grouped).filter(([_, years]) => years.length > 0);
                  if (groupedEntries.length === 0) return null;
                  return (
                    <div className="lg:col-span-2 mt-4 text-xs text-muted-foreground">
                      <div className="font-semibold mb-1">Data yang tidak ditampilkan pada Top & Bottom 5 Indikator:</div>
                      <ul className="list-disc pl-5">
                        {groupedEntries.map(([no, years], idx) => (
                          <li key={idx}>
                            Aspek {no} Tahun {years.sort((a, b) => Number(b) - Number(a)).join(', ')} (kolom Capaian kosong).
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
              {/* 3. Pie Charts Bobot per Aspek */}
              <div className="space-y-4" id={anchorIds.indikator3}>
                <h3 className="text-lg font-semibold">Distribusi Bobot Indikator per Aspek</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aspectWeightCharts.map(({ section, data }) => {
                    // Check for negative or all zero/negative values
                    const hasNegative = data.some(d => d.totalBobot < 0);
                    const allZeroOrNegative = data.every(d => d.totalBobot <= 0);
                    // If there are negative weights, group by indicator number and list years
                    let negativeDetails = null;
                    if (hasNegative) {
                      // Find all indicator numbers with negative weights, group by No, collect years
                      // We need to look at the raw indicatorData, not just the pie data
                      const sectionDataAllYears = indicatorData.filter(item => item.Section === section);
                      const negativeMap = {};
                      sectionDataAllYears.forEach(item => {
                        if (item.Bobot < 0) {
                          const no = item.No;
                          if (!negativeMap[no]) negativeMap[no] = [];
                          if (!negativeMap[no].includes(item.Tahun)) negativeMap[no].push(item.Tahun);
                        }
                      });
                      // Format: Indikator No. X Tahun 2022, 2021
                      const entries = Object.entries(negativeMap);
                      if (entries.length > 0) {
                        negativeDetails = (
                          <ul className="list-disc pl-5 text-left">
                            {entries.map(([no, years], idx) => (
                              <li key={idx}>
                                Indikator No. {no} Tahun {years.sort((a, b) => Number(b) - Number(a)).join(', ')} (bobot negatif)
                              </li>
                            ))}
                          </ul>
                        );
                      }
                    }
                    return (
                      <Card key={section}>
                        <CardHeader>
                          <CardTitle className="text-base">Aspek {section}</CardTitle>
                          <CardDescription>Distribusi bobot indikator</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {hasNegative || allZeroOrNegative ? (
                            <div className="text-xs text-muted-foreground min-h-[120px] flex flex-col items-center justify-center text-center">
                              {hasNegative ? (
                                <>
                                  <div className="mb-1">Tidak dapat menampilkan grafik:</div>
                                  {negativeDetails}
                                </>
                              ) : (
                                'Tidak ada data bobot positif untuk aspek ini.'
                              )}
                            </div>
                          ) : (
                            <DonutChart data={data} tooltipType="bobot" />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              {/* 4. Data Table */}
              <Card id={anchorIds.indikator4}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Data Detail Indikator</CardTitle>
                    <CardDescription>Tabel lengkap data indikator yang telah difilter</CardDescription>
                  </div>

                </CardHeader>
                <CardContent>
                  <div
                    className={'overflow-x-auto max-h-[600px] overflow-y-auto'}
                    style={{ scrollbarColor: '#e5e7eb transparent', scrollbarWidth: 'thin' }}
                  >
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
                          <TableHead>Penilai</TableHead>
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
                              {item.Capaian === '' ? '' : (
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
                              )}
                            </TableCell>
                            <TableCell>{item.Tahun}</TableCell>
                            <TableCell>{String(item.Penilai ?? '')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {!showAllIndikator && (
                      <style>{`
                        .overflow-x-auto::-webkit-scrollbar {
                          height: 8px;
                          width: 8px;
                        }
                        .overflow-x-auto::-webkit-scrollbar-thumb {
                          background: #e5e7eb;
                          border-radius: 6px;
                        }
                        .overflow-x-auto::-webkit-scrollbar-track {
                          background: transparent;
                        }
                      `}</style>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
