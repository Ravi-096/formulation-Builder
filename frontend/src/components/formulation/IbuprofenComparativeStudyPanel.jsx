import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Scale,
  Sparkles,
  Layers,
  Activity,
  Globe,
  Share2,
  Clock,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import Badge from '../ui/Badge';

export const IBUPROFEN_STUDY_METADATA = {
  title: 'Comparative Evaluation Quality of Different Brands of Ibuprofen 400 mg Tablets available in Yemeni’s Market',
  authors: [
    { name: 'Abdulmajed Alsaifi', affiliation: 'Department of Chemistry, Sana’a University, Republic of Yemen', role: 'Corresponding Author' },
    { name: 'Ali Alyahawi', affiliation: 'Department of Pharmacy, Al-Razi University, Republic of Yemen', role: 'Co-Author' },
    { name: 'Ali Alkaf', affiliation: 'Faculty of Pharmacy, Sana’a University, Republic of Yemen', role: 'Co-Author' },
  ],
  journal: 'Chronicles of Pharmaceutical Science',
  volume: '2',
  issue: '6',
  year: '2018',
  pages: '724–736',
  issn: '2572-7761',
  publisher: 'Scientia Ricerca Open Access',
  receivedDate: 'August 14, 2018',
  publishedDate: 'August 28, 2018',
  citationText: 'Abdulmajed Alsaifi., et al. "Comparative Evaluation Quality of Different Brands of Ibuprofen 400 mg Tablets available in Yemeni’s Market". Chronicles of Pharmaceutical Science 2.6 (2018): 724-736.',
  openAccessBenefits: [
    'Prompt and fair double-blinded peer review from international experts',
    'Fast and efficient online manuscript submission & processing',
    'Timely status updates and editorial transparency',
    'Social networking enabled sharing and scholarly visibility',
    'Open access: articles freely available online worldwide without barriers',
    'Global attainment and citation impact for regional pharmaceutical research',
  ],
};

export const COMPARATIVE_BRANDS_DATA = [
  {
    code: 'Brand A',
    id: 'A',
    batchNo: 'B651231',
    mfgDate: '01/2015',
    expDate: '02/2018',
    strength: '400 mg',
    avgWeightMg: 557.7,
    weightRsd: '0.903%',
    assayPct: 103.05,
    assayRsd: '1.86%',
    hardnessKgCm2: 8.61,
    hardnessRsd: '1.265%',
    friabilityPct: 0.10,
    disintegrationMin: 2.00,
    dissolution30MinPct: 119.82,
    dissolutionRsd: '6.65%',
    bpAssayCompliant: true, // 95-105%
    uspAssayCompliant: true, // 90-110%
    bpHardnessRange: false, // 5-8 kg
    disintegrationCompliant: true, // < 30 min
    friabilityCompliant: true, // < 1%
    dissolutionCompliant: true, // > 80%
    highlights: 'Lightest total tablet mass (557.7 mg), fastest disintegration (2.00 min), highest 30-min dissolution (119.82%).',
  },
  {
    code: 'Brand B',
    id: 'B',
    batchNo: 'B150307',
    mfgDate: '03/2015',
    expDate: '03/2018',
    strength: '400 mg',
    avgWeightMg: 635.9,
    weightRsd: '2.36%',
    assayPct: 109.00,
    assayRsd: '4.64%',
    hardnessKgCm2: 11.11,
    hardnessRsd: '0.74%',
    friabilityPct: 0.03,
    disintegrationMin: 4.05,
    dissolution30MinPct: 89.50,
    dissolutionRsd: '8.56%',
    bpAssayCompliant: false, // 109% > 105% BP limit
    uspAssayCompliant: true, // < 110% USP limit
    bpHardnessRange: false,
    disintegrationCompliant: true,
    friabilityCompliant: true,
    dissolutionCompliant: true,
    highlights: 'High assay (109.00%, USP compliant), low friability (0.03%), rapid disintegration in 4.05 min.',
  },
  {
    code: 'Brand C',
    id: 'C',
    batchNo: '2949',
    mfgDate: '03/2015',
    expDate: '03/2018',
    strength: '400 mg',
    avgWeightMg: 683.55,
    weightRsd: '1.330%',
    assayPct: 106.05,
    assayRsd: '1.46%',
    hardnessKgCm2: 14.67,
    hardnessRsd: '0.45%',
    friabilityPct: 0.10,
    disintegrationMin: 3.20,
    dissolution30MinPct: 90.72,
    dissolutionRsd: '13.35%',
    bpAssayCompliant: false, // 106.05% > 105% BP limit
    uspAssayCompliant: true, // < 110% USP limit
    bpHardnessRange: false,
    disintegrationCompliant: true,
    friabilityCompliant: true,
    dissolutionCompliant: true,
    highlights: 'Very firm tablet (14.67 kg/cm²), yet disintegrates rapidly within 3.20 min due to efficient superdisintegrants.',
  },
  {
    code: 'Brand D',
    id: 'D',
    batchNo: 'XQ10660',
    mfgDate: 'Apr 2018',
    expDate: 'Apr 2021',
    strength: '400 mg',
    avgWeightMg: 926.0,
    weightRsd: '4.44%',
    assayPct: 99.95,
    assayRsd: '1.93%',
    hardnessKgCm2: 6.73,
    hardnessRsd: '0.87%',
    friabilityPct: 0.02,
    disintegrationMin: 16.15,
    dissolution30MinPct: 89.00,
    dissolutionRsd: '11.75%',
    bpAssayCompliant: true,
    uspAssayCompliant: true,
    bpHardnessRange: true, // 6.73 is strictly within BP 5-8 kg range!
    disintegrationCompliant: true,
    friabilityCompliant: true,
    dissolutionCompliant: true,
    highlights: 'Heaviest tablet (926 mg, high excipient ratio), lowest friability (0.02%), strictly meets BP hardness range (6.73 kg/cm²).',
  },
  {
    code: 'Brand E',
    id: 'E',
    batchNo: '70',
    mfgDate: '01/2015',
    expDate: '01/2020',
    strength: '400 mg',
    avgWeightMg: 617.25,
    weightRsd: '0.699%',
    assayPct: 101.88,
    assayRsd: '0.926%',
    hardnessKgCm2: 17.52,
    hardnessRsd: '0.40%',
    friabilityPct: 0.06,
    disintegrationMin: 2.40,
    dissolution30MinPct: 99.30,
    dissolutionRsd: '6.65%',
    bpAssayCompliant: true,
    uspAssayCompliant: true,
    bpHardnessRange: false,
    disintegrationCompliant: true,
    friabilityCompliant: true,
    dissolutionCompliant: true,
    highlights: 'Highest hardness (17.52 kg/cm²), tightest weight RSD (0.70%), near-ideal assay (101.88%) and fast disintegration (2.40 min).',
  },
];

export const IbuprofenComparativeStudyPanel = () => {
  const [selectedBrandId, setSelectedBrandId] = useState('A');
  const [activeMetricTab, setActiveMetricTab] = useState('all');

  const selectedBrand = COMPARATIVE_BRANDS_DATA.find((b) => b.id === selectedBrandId) || COMPARATIVE_BRANDS_DATA[0];

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------
          Paper Citation & Overview Banner
      ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-brand-500/5 to-teal-500/10 border border-emerald-500/25 dark:border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" size="sm">
                Peer-Reviewed Empirical Benchmark
              </Badge>
              <Badge variant="default" size="sm">
                Chronicles of Pharm. Sci. (2018)
              </Badge>
              <span className="text-[10px] font-mono text-zinc-500">ISSN: 2572-7761</span>
            </div>

            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {IBUPROFEN_STUDY_METADATA.title}
            </h3>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Authors:</span>{' '}
              Abdulmajed Alsaifi (Sana’a Univ.), Ali Alyahawi (Al-Razi Univ.), Ali Alkaf (Sana’a Univ.)
            </p>
          </div>

          <div className="shrink-0 flex md:flex-col items-center md:items-end gap-2 text-right">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              5 Commercial Brands Evaluated
            </span>
            <span className="text-[10px] text-zinc-400">Film-Coated 400 mg Tablets</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
          <div>
            <span className="text-zinc-400 block">Pharmacopeias Used:</span>
            <strong className="text-zinc-700 dark:text-zinc-300">BP 2009 & USP 30 / 34</strong>
          </div>
          <div>
            <span className="text-zinc-400 block">Assay Analytical Method:</span>
            <strong className="text-zinc-700 dark:text-zinc-300">Agilent 1260 HPLC (C18)</strong>
          </div>
          <div>
            <span className="text-zinc-400 block">Dissolution Apparatus:</span>
            <strong className="text-zinc-700 dark:text-zinc-300">USP App II (900 mL 0.1N HCl)</strong>
          </div>
          <div>
            <span className="text-zinc-400 block">Hardness / Friability:</span>
            <strong className="text-zinc-700 dark:text-zinc-300">Monsanto & Roche Friabilator</strong>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Brand Selector Pills
      ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-500" />
            Select Commercial Ibuprofen Brand to Inspect Quality Control Profile:
          </label>
          <span className="text-[10px] text-zinc-400">Retail Pharmacies (Sana’a, Yemen)</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {COMPARATIVE_BRANDS_DATA.map((brand) => {
            const isSelected = brand.id === selectedBrandId;
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => setSelectedBrandId(brand.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-950/40 ring-1 ring-brand-500/50 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{brand.code}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {brand.avgWeightMg} mg
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      brand.bpAssayCompliant ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[9px] font-semibold text-zinc-600 dark:text-zinc-400">
                    {brand.assayPct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Selected Brand In-Depth Metric Card
      ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {selectedBrand.code} — Detailed QC Assessment
              </span>
              <Badge variant="primary" size="sm">
                Batch: {selectedBrand.batchNo}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Mfg Date: {selectedBrand.mfgDate} | Expiry: {selectedBrand.expDate} | Labeled: {selectedBrand.strength}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              USP Specifications Satisfied
            </span>
          </div>
        </div>

        {/* 6 Key Compendial Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Weight Uniformity */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Avg Weight</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.avgWeightMg} mg
            </div>
            <div className="text-[10px] text-zinc-500">RSD: ±{selectedBrand.weightRsd}</div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              BP Pass (±5%)
            </div>
          </div>

          {/* 2. HPLC Assay */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">HPLC Assay</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.assayPct}%
            </div>
            <div className="text-[10px] text-zinc-500">RSD: ±{selectedBrand.assayRsd}</div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold">
              {selectedBrand.bpAssayCompliant ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> BP & USP Pass
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" /> USP Pass (BP &gt; 105%)
                </span>
              )}
            </div>
          </div>

          {/* 3. Hardness */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Hardness</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.hardnessKgCm2} kg/cm²
            </div>
            <div className="text-[10px] text-zinc-500">RSD: ±{selectedBrand.hardnessRsd}</div>
            <div className="mt-1.5 text-[9px] font-semibold">
              {selectedBrand.bpHardnessRange ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> BP Range (5–8 kg)
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Compact (&gt; 4 kg min)
                </span>
              )}
            </div>
          </div>

          {/* 4. Friability */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Friability</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.friabilityPct}%
            </div>
            <div className="text-[10px] text-zinc-500">Limit: &lt; 1.00%</div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              BP/USP Pass
            </div>
          </div>

          {/* 5. Disintegration */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Disintegration</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.disintegrationMin.toFixed(2)} min
            </div>
            <div className="text-[10px] text-zinc-500">Limit: &lt; 30 min</div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              Rapid Release
            </div>
          </div>

          {/* 6. Dissolution (30 min) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Dissolution (30m)</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedBrand.dissolution30MinPct}%
            </div>
            <div className="text-[10px] text-zinc-500">RSD: ±{selectedBrand.dissolutionRsd}</div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              Exceeds Q80%
            </div>
          </div>
        </div>

        {/* Brand Key Observation Callout */}
        <div className="p-3 bg-brand-500/8 border border-brand-500/20 rounded-xl flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
            <strong className="text-brand-700 dark:text-brand-300">Formulation Observation:</strong>{' '}
            {selectedBrand.highlights}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Full Cross-Brand Comparative Matrix Table (Table 4 of Study)
      ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Cross-Brand Comparative Quality Control Matrix (Alsaifi et al., 2018)
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Empirical data compiled across all five film-coated Ibuprofen 400 mg tablet brands.
            </p>
          </div>
          <Badge variant="default" size="sm">
            BP & USP Standards
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="p-3">Brand</th>
                <th className="p-3">Avg Weight (mg)</th>
                <th className="p-3">HPLC Content (%)</th>
                <th className="p-3">Hardness (kg/cm²)</th>
                <th className="p-3">Friability (%)</th>
                <th className="p-3">Disintegration (min)</th>
                <th className="p-3">Dissolution @ 30m (%)</th>
                <th className="p-3 text-right">USP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-950">
              {COMPARATIVE_BRANDS_DATA.map((row) => {
                const isSelected = row.id === selectedBrandId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedBrandId(row.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-500/10 dark:bg-brand-950/40 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <td className="p-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        {row.id}
                      </span>
                      <span>{row.code}</span>
                    </td>
                    <td className="p-3">
                      <span>{row.avgWeightMg}</span>
                      <span className="text-[10px] text-zinc-400 block font-normal">±{row.weightRsd}</span>
                    </td>
                    <td className="p-3">
                      <span className={row.bpAssayCompliant ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                        {row.assayPct}%
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-normal">±{row.assayRsd}</span>
                    </td>
                    <td className="p-3">
                      <span>{row.hardnessKgCm2}</span>
                      <span className="text-[10px] text-zinc-400 block font-normal">
                        {row.bpHardnessRange ? 'BP Range' : 'Compact'}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                      {row.friabilityPct}%
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{row.disintegrationMin.toFixed(2)} min</span>
                      <span className="text-[10px] text-zinc-400 block font-normal">
                        {row.disintegrationMin < 5 ? 'Ultra-rapid' : 'Standard'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.dissolution30MinPct}%</span>
                      <span className="text-[10px] text-zinc-400 block font-normal">±{row.dissolutionRsd}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Key Formulation & Scientific Takeaways
      ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Excipient Weight Variability</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Average tablet weights ranged from <strong>557.7 mg (Brand A)</strong> to <strong>926.0 mg (Brand D)</strong>.
            This 66% mass increase reflects distinct excipient filler loading (e.g. MCC vs Dibasic Calcium Phosphate)
            while delivering the identical 400 mg active dose.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Hardness vs Disintegration</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tablet crushing strength varied between <strong>6.73 kg/cm²</strong> and <strong>17.52 kg/cm²</strong>.
            Remarkably, Brand E had the highest hardness (17.52 kg/cm²) yet disintegrated in just <strong>2.40 min</strong>,
            proving disintegrant mechanism (wicking/swelling) decouples disintegration from high compaction.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pharmacopeial Compliance</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All 5 brands met USP standards for weight uniformity, friability (&lt;1%), disintegration (&lt;30 min),
            and dissolution (&gt;80%). Only Brand D complied strictly with BP crushing range (5–8 kg), though hardness is
            defined as an in-process non-compendial control.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Scientia Ricerca Open Access Publication & Indexing Details
      ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-zinc-100">
              Scientia Ricerca Open Access — Publication Information
            </span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Open Access Publishing & Global Research Dissemination
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
          {IBUPROFEN_STUDY_METADATA.openAccessBenefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-2 bg-zinc-800/50 p-2 rounded-xl border border-zinc-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300 text-[10px] leading-snug">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400 border-t border-zinc-800/60">
          <div>
            Citation: <em className="text-zinc-300">{IBUPROFEN_STUDY_METADATA.citationText}</em>
          </div>
          <div className="shrink-0 font-mono text-[9px] text-brand-400">
            Volume 2 • Issue 6 • August 2018 • pp. 724–736
          </div>
        </div>
      </div>
    </div>
  );
};

export default IbuprofenComparativeStudyPanel;
