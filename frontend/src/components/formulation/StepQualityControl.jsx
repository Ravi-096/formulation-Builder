import React, { useState, useMemo } from 'react';
import {
  Beaker,
  Droplet,
  FlaskConical,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  Wind,
  Waves,
  Zap,
  Activity,
} from 'lucide-react';
import Badge from '../ui/Badge';

// ============================================================================
// Dissolution Profile Data (USP Apparatus I & II)
// ============================================================================
const DISSOLUTION_PROFILES = {
  oral_tablet: {
    label: 'Oral Tablet — USP Apparatus II (Paddle)',
    medium: '900 mL 0.1 N HCl (pH 1.2), then pH 6.8 phosphate buffer',
    rpmRange: '50–75 rpm',
    temperature: '37 ± 0.5 °C',
    timePoints: [5, 10, 15, 20, 30, 45, 60],
    targets: { Q: 80, at: 45, label: 'Q80% at 45 min (USP ≥Q)' },
    fdaGuidance: 'IR solid: ≥85% in 30 min at pH 6.8 constitutes rapid dissolution (BCS waiver).',
  },
  oral_solution: {
    label: 'Oral Solution — In Vitro Membrane Dialysis',
    medium: 'pH 7.4 PBS (simulated intestinal fluid)',
    rpmRange: '100 rpm orbital',
    temperature: '37 ± 0.5 °C',
    timePoints: [5, 10, 15, 20, 30, 45, 60],
    targets: { Q: 100, at: 15, label: 'Full release: ≥85% within 15 min expected' },
    fdaGuidance: 'Solutions are presumed 100% biologically available. Stability testing focuses on precipitation at physiological pH.',
  },
  iv_infusion: {
    label: 'IV Infusion — Not Applicable (Solution)',
    medium: 'N/A — injectable solution is pre-dissolved',
    rpmRange: 'N/A',
    temperature: '37 ± 0.5 °C',
    timePoints: [],
    targets: { Q: 100, at: 0, label: '100% bioavailable (bypass first pass)' },
    fdaGuidance: 'IV formulations require particulate matter testing per USP 788 and sterility assurance.',
  },
  nanoparticle_lipid: {
    label: 'LNP — USP Apparatus IV (Flow-Through Cell)',
    medium: 'FaSSIF (pH 6.5) / FeSSIF (pH 5.0) biorelevant media',
    rpmRange: '16 mL/min flow rate',
    temperature: '37 ± 0.5 °C',
    timePoints: [15, 30, 60, 120, 240, 360, 480],
    targets: { Q: 80, at: 120, label: 'Q80% at 2 h in biorelevant FaSSIF' },
    fdaGuidance: 'Nanoformulations require biorelevant two-stage dissolution and lipolysis testing per FDA nanotechnology guidance.',
  },
};

function simulateDissolutionCurve(timePoints, Q80_at, vehicle) {
  if (!timePoints || timePoints.length === 0) return [];
  const k = 4.5 / (Q80_at || 45);
  return timePoints.map((t) => {
    let pct = 100 / (1 + Math.exp(-k * (t - Q80_at / 2)));
    if (vehicle === 'iv_infusion') pct = 100;
    const noise = (Math.random() - 0.5) * 2.5;
    return { time: t, dissolution: Math.min(100, Math.max(0, +(pct + noise).toFixed(1))) };
  });
}

function getDissolutionRating(bcsClass, vehicle) {
  if (vehicle === 'iv_infusion') return { label: 'N/A', color: 'info' };
  if (!bcsClass) return { label: 'Pending', color: 'default' };
  if (bcsClass.includes('Class I')) return { label: 'Rapid — BCS I', color: 'success' };
  if (bcsClass.includes('Class II')) return { label: 'Dissolution Rate-Limited', color: 'warning' };
  if (bcsClass.includes('Class III')) return { label: 'Permeability-Limited', color: 'info' };
  return { label: 'Challenging — BCS IV', color: 'error' };
}

// ============================================================================
// Solubility Estimators
// ============================================================================
function estimateWaterSolubility(logp, mw) {
  if (logp === undefined || logp === null) return null;
  const logS = 0.5 - logp;
  const solMgL = Math.pow(10, logS) * (mw || 300);
  return { logS: +logS.toFixed(2), mgPerL: +solMgL.toFixed(2) };
}

function estimateEthanolSolubility(logp) {
  if (logp === undefined || logp === null) return null;
  if (logp < 1) return 'Low (< 10 mg/mL) — polar API poorly compatible with ethanol';
  if (logp < 2.5) return 'Moderate (10–50 mg/mL) — partial ethanol miscibility';
  if (logp < 4.5) return 'High (50–200 mg/mL) — lipophilic API, good ethanol solubility';
  return 'Very High (> 200 mg/mL) — highly hydrophobic, ethanol preferred cosolvent';
}

function getSolubilityCategory(logS) {
  if (logS === null || logS === undefined) return { label: 'Unknown', color: 'default' };
  if (logS >= 0) return { label: 'Freely Soluble (>= 1 g/L)', color: 'success' };
  if (logS >= -2) return { label: 'Soluble (10–100 mg/L)', color: 'success' };
  if (logS >= -4) return { label: 'Slightly Soluble (0.1–10 mg/L)', color: 'warning' };
  return { label: 'Practically Insoluble (< 0.1 mg/L)', color: 'error' };
}

// ============================================================================
// Colour / Texture / Odour Reference Tables
// ============================================================================
const COLOUR_REFS = [
  { label: 'White / Off-white', hex: '#f5f5f0', common: 'MCC tablets, lactose granules, most compendial standards' },
  { label: 'Yellow / Cream', hex: '#f9e87a', common: 'Riboflavin-containing formulations, carotenoid excipients' },
  { label: 'Brown / Amber', hex: '#c8851c', common: 'Oxidative degradation (Maillard products), polyphenol APIs' },
  { label: 'Pale Pink', hex: '#f7b8c4', common: 'Film coating with Lake Red #40 dye' },
  { label: 'Light Green', hex: '#b3e5b5', common: 'Chlorophyllin excipients, enteric coatings' },
  { label: 'Transparent', hex: '#e8f4fd', common: 'Oral liquids, IV solutions (absence of turbidity expected)' },
];

const TEXTURE_REFS = [
  { label: 'Smooth / Glossy', icon: '✦', desc: 'Ideal for coated tablets (film or sugar); good patient compliance', acceptable: true },
  { label: 'Rough / Granular', icon: '⬡', desc: 'Acceptable for immediate-release uncoated tablets; surface friability check required', acceptable: true },
  { label: 'Sticky / Tacky', icon: '◆', desc: 'Unacceptable — indicates moisture uptake or high HPC/PEG concentration', acceptable: false },
  { label: 'Friable / Crumbling', icon: '◇', desc: 'Unacceptable — friability > 1% (USP 1216) fails specification; harden formulation', acceptable: false },
  { label: 'Waxy / Oily', icon: '●', desc: 'Indicates excess Mg Stearate or lipid phase; revise lubricant concentration', acceptable: false },
];

const ODOUR_REFS = [
  { label: 'Odourless / Neutral', standard: true, desc: 'Most preferred — no API or excipient off-gassing; baseline accepted standard' },
  { label: 'Faint Characteristic', standard: true, desc: 'Faint odour attributable to known API (e.g. acetic acid derivatives)' },
  { label: 'Alcoholic', standard: true, desc: 'Ethanol or PEG-based formulations; acceptable if within 20% EtOH limit' },
  { label: 'Rancid / Sulfuric', standard: false, desc: 'Indicates oxidation or microbial contamination — FAIL condition' },
  { label: 'Ammonia / Amine', standard: false, desc: 'Amine API hydrolysis or aminolysis product — stability failure indicator' },
  { label: 'Burnt / Caramel', standard: false, desc: 'Maillard reaction degradation — evaluate lactose/reducing sugar incompatibility' },
];

// ============================================================================
// Disintegration Reference
// ============================================================================
const DISINTEGRATION_REFS = {
  oral_tablet: {
    label: 'Uncoated Oral Tablet — USP 701',
    medium: 'Water or Simulated Gastric Fluid (SGF)',
    temperature: '37 ± 2 °C',
    passCriteria: '<= 30 minutes for uncoated; <= 60 min enteric; <= 4 h for modified release',
    fdaRef: 'USP 701 Disintegration; JP XVI; Ph. Eur. 2.9.1',
    key: 'Critical disintegrants: Croscarmellose Na (Ac-Di-Sol), Sodium Starch Glycolate (Explotab), Crospovidone. Target: <= 15 min for rapid disintegrating tablets (RDT).',
  },
  oral_solution: {
    label: 'Oral Solution — N/A (Pre-dissolved)',
    medium: 'N/A',
    temperature: 'N/A',
    passCriteria: 'Not applicable — assess precipitation & clarity instead',
    fdaRef: 'USP 1 Clarity of Solution',
    key: 'Verify solution remains optically clear (absence of turbidity > NTU 0.5) at 37 °C.',
  },
  iv_infusion: {
    label: 'IV Solution — USP 788 Particulate Matter',
    medium: 'N/A',
    temperature: '37 ± 0.5 °C',
    passCriteria: '<= 25 particles/mL (>= 10 µm); <= 3 particles/mL (>= 25 µm)',
    fdaRef: 'USP 788, 789, 1 Sterility',
    key: 'Use light obscuration particle counting. Apply 0.22 µm sterile filtration. Ensure no aggregation at pH extremes.',
  },
  nanoparticle_lipid: {
    label: 'LNP / Liposome — Vesicle Integrity & Leakage Assay',
    medium: 'PBS pH 7.4 (37 °C), fluorescence encapsulation assay',
    temperature: '37 ± 0.5 °C',
    passCriteria: 'Encapsulation efficiency >= 80%; drug leakage < 10% at 24 h storage',
    fdaRef: 'FDA Guidance: Liposome Drug Products (2018)',
    key: 'Characterize Z-average particle size (100–200 nm), PDI < 0.2, zeta potential <= -20 mV or >= +20 mV for stability.',
  },
};

// ============================================================================
// Main Component
// ============================================================================
export const StepQualityControl = ({
  apiName = 'Active Drug',
  deliveryVehicle = 'oral_tablet',
  targetPh = 7.0,
  validationResult = null,
}) => {
  const [openPanel, setOpenPanel] = useState('dissolution');
  const [selectedColour, setSelectedColour] = useState(COLOUR_REFS[0]);
  const [selectedTexture, setSelectedTexture] = useState(TEXTURE_REFS[0]);
  const [selectedOdour, setSelectedOdour] = useState(ODOUR_REFS[0]);

  const toggle = (panel) => setOpenPanel((prev) => (prev === panel ? null : panel));

  const props = validationResult?.physicochemical_properties || null;
  const logp = props?.logp ?? null;
  const mw = props?.molecular_weight ?? null;
  const bcsClass = validationResult?.bcs_solubility_flag || null;

  const waterSol = useMemo(() => estimateWaterSolubility(logp, mw), [logp, mw]);
  const ethanolSol = useMemo(() => estimateEthanolSolubility(logp), [logp]);
  const solCategory = useMemo(() => getSolubilityCategory(waterSol?.logS ?? null), [waterSol]);
  const dissProfile = DISSOLUTION_PROFILES[deliveryVehicle] || DISSOLUTION_PROFILES.oral_tablet;
  const dissRating = getDissolutionRating(bcsClass, deliveryVehicle);
  const disintRef = DISINTEGRATION_REFS[deliveryVehicle] || DISINTEGRATION_REFS.oral_tablet;

  const dissolutionCurve = useMemo(
    () => simulateDissolutionCurve(dissProfile.timePoints, dissProfile.targets.at, deliveryVehicle),
    [dissProfile, deliveryVehicle]
  );

  const overallQCStatus = useMemo(() => {
    const issues = [];
    if (selectedTexture && !selectedTexture.acceptable) issues.push('Texture');
    if (selectedOdour && !selectedOdour.standard) issues.push('Odour');
    if (solCategory.color === 'error') issues.push('Solubility');
    return issues;
  }, [selectedTexture, selectedOdour, solCategory]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Pharmaceutical Quality Control Tests
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                USP / Ph. Eur. compliance panels for{' '}
                <span className="font-semibold text-brand-600 dark:text-brand-400">{apiName}</span>
              </p>
            </div>
          </div>
        </div>
        {overallQCStatus.length === 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">All QC Panels Nominal</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Flags: {overallQCStatus.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* PANEL 1: Dissolution */}
      <QCAccordion
        id="dissolution"
        open={openPanel === 'dissolution'}
        onToggle={() => toggle('dissolution')}
        icon={<Waves className="w-4 h-4" />}
        iconColor="text-blue-600 dark:text-blue-400 bg-blue-500/15"
        title="Dissolution Profile"
        subtitle={dissProfile.label}
        badge={
          <Badge
            variant={
              dissRating.color === 'success'
                ? 'success'
                : dissRating.color === 'warning'
                ? 'warning'
                : 'default'
            }
            size="sm"
          >
            {dissRating.label}
          </Badge>
        }
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <InfoField label="Dissolution Medium" value={dissProfile.medium} />
          <InfoField label="Apparatus / Speed" value={dissProfile.rpmRange} />
          <InfoField label="Temperature" value={dissProfile.temperature} />
          <InfoField label="Pass Criterion" value={dissProfile.targets.label} highlight />
        </div>
        {dissolutionCurve.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
              Simulated Cumulative Release Curve
            </p>
            <DissolutionChart points={dissolutionCurve} target={dissProfile.targets} />
          </div>
        )}
        <InfoAlert>{dissProfile.fdaGuidance}</InfoAlert>
      </QCAccordion>

      {/* PANEL 2: Disintegration */}
      <QCAccordion
        id="disintegration"
        open={openPanel === 'disintegration'}
        onToggle={() => toggle('disintegration')}
        icon={<Zap className="w-4 h-4" />}
        iconColor="text-amber-600 dark:text-amber-400 bg-amber-500/15"
        title="Disintegration Test"
        subtitle={disintRef.label}
        badge={<Badge variant="default" size="sm">USP 701</Badge>}
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <InfoField label="Test Medium" value={disintRef.medium} />
          <InfoField label="Temperature" value={disintRef.temperature} />
          <InfoField label="Pass Criteria" value={disintRef.passCriteria} highlight />
          <InfoField label="Reference Standard" value={disintRef.fdaRef} />
        </div>
        <div className="p-3 bg-amber-500/8 border border-amber-500/25 rounded-xl">
          <div className="flex gap-2 items-start">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{disintRef.key}</p>
          </div>
        </div>
        <DisintegrantCheck deliveryVehicle={deliveryVehicle} />
      </QCAccordion>

      {/* PANEL 3: Texture */}
      <QCAccordion
        id="texture"
        open={openPanel === 'texture'}
        onToggle={() => toggle('texture')}
        icon={<Layers className="w-4 h-4" />}
        iconColor="text-violet-600 dark:text-violet-400 bg-violet-500/15"
        title="Texture Analysis"
        subtitle="Surface morphology, friability & hardness evaluation"
        badge={
          selectedTexture.acceptable
            ? <Badge variant="success" size="sm">Acceptable</Badge>
            : <Badge variant="error" size="sm">Flag</Badge>
        }
      >
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
          Select the observed texture profile for this formulation batch:
        </p>
        <div className="grid grid-cols-1 gap-2">
          {TEXTURE_REFS.map((tex) => (
            <button
              key={tex.label}
              type="button"
              onClick={() => setSelectedTexture(tex)}
              className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all ${
                selectedTexture.label === tex.label
                  ? tex.acceptable
                    ? 'border-emerald-500/60 bg-emerald-500/8 dark:bg-emerald-950/30'
                    : 'border-rose-500/60 bg-rose-500/8 dark:bg-rose-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40'
              }`}
            >
              <span className="text-lg leading-none mt-0.5">{tex.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{tex.label}</span>
                  {tex.acceptable
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{tex.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </QCAccordion>

      {/* PANEL 4: Colour */}
      <QCAccordion
        id="colour"
        open={openPanel === 'colour'}
        onToggle={() => toggle('colour')}
        icon={<Eye className="w-4 h-4" />}
        iconColor="text-pink-600 dark:text-pink-400 bg-pink-500/15"
        title="Colour Assessment"
        subtitle="Visual appearance, uniformity & Maillard degradation indicator"
        badge={<Badge variant="default" size="sm">Appearance</Badge>}
      >
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
          Identify the observed colour against compendial colour standards:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COLOUR_REFS.map((col) => (
            <button
              key={col.label}
              type="button"
              onClick={() => setSelectedColour(col)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                selectedColour.label === col.label
                  ? 'border-brand-500/60 bg-brand-500/8 dark:bg-brand-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg border-2 border-white/60 shadow-sm shrink-0"
                style={{ backgroundColor: col.hex }}
              />
              <div>
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{col.label}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{col.common}</p>
              </div>
            </button>
          ))}
        </div>
        {selectedColour.label.includes('Brown') && (
          <div className="mt-3 p-3 bg-rose-500/8 border border-rose-500/25 rounded-xl">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                <strong className="text-rose-600">Maillard Degradation Suspected:</strong> Brown discolouration
                in solid dosage forms containing reducing sugars (lactose) may indicate Maillard condensation
                products. Switch to non-reducing fillers (Mannitol, Dicalcium Phosphate).
              </p>
            </div>
          </div>
        )}
      </QCAccordion>

      {/* PANEL 5: Odour */}
      <QCAccordion
        id="odour"
        open={openPanel === 'odour'}
        onToggle={() => toggle('odour')}
        icon={<Wind className="w-4 h-4" />}
        iconColor="text-teal-600 dark:text-teal-400 bg-teal-500/15"
        title="Odour / Aroma Profiling"
        subtitle="Organoleptic olfactory evaluation — ICH Q6A characteristic test"
        badge={
          selectedOdour.standard
            ? <Badge variant="success" size="sm">Acceptable</Badge>
            : <Badge variant="error" size="sm">Investigation Required</Badge>
        }
      >
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
          Select the odour profile observed for this formulation batch (trained sensory panel evaluation):
        </p>
        <div className="grid grid-cols-1 gap-2">
          {ODOUR_REFS.map((od) => (
            <button
              key={od.label}
              type="button"
              onClick={() => setSelectedOdour(od)}
              className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all ${
                selectedOdour.label === od.label
                  ? od.standard
                    ? 'border-emerald-500/60 bg-emerald-500/8 dark:bg-emerald-950/30'
                    : 'border-rose-500/60 bg-rose-500/8 dark:bg-rose-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                  od.standard ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}
              >
                {od.standard
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  : <AlertTriangle className="w-3 h-3 text-rose-500" />}
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{od.label}</span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{od.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </QCAccordion>

      {/* PANEL 6: Solubility */}
      <QCAccordion
        id="solubility"
        open={openPanel === 'solubility'}
        onToggle={() => toggle('solubility')}
        icon={<Beaker className="w-4 h-4" />}
        iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-500/15"
        title="Solubility — pH, Water & Ethanol"
        subtitle="Thermodynamic solubility estimations from RDKit physicochemical descriptors"
        badge={
          <Badge
            variant={
              solCategory.color === 'success'
                ? 'success'
                : solCategory.color === 'warning'
                ? 'warning'
                : 'error'
            }
            size="sm"
          >
            {solCategory.label}
          </Badge>
        }
      >
        {!props ? (
          <div className="py-8 text-center text-zinc-400 text-xs">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>Enter a SMILES string in Step 1 to compute solubility estimates.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-indigo-500" />
                pH-Dependent Solubility Profile
              </p>
              <PhSolubilityChart logp={logp} mw={mw} targetPh={targetPh} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Water Solubility */}
              <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    Water Solubility (25 °C)
                  </span>
                </div>
                {waterSol ? (
                  <>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {waterSol.mgPerL < 0.01
                        ? '< 0.01 mg/L'
                        : waterSol.mgPerL > 10000
                        ? '> 10 g/L'
                        : `${waterSol.mgPerL} mg/L`}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      logS = {waterSol.logS} (Yalkowsky estimation)
                    </p>
                    <div
                      className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        solCategory.color === 'success'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : solCategory.color === 'warning'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {solCategory.label}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                      Based on Yalkowsky equation: logS ≈ 0.5 − logP. Experimental validation required for
                      regulatory submission.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">Awaiting SMILES input...</p>
                )}
              </div>

              {/* Ethanol Solubility */}
              <div className="p-4 rounded-xl border border-teal-500/25 bg-teal-500/5 dark:bg-teal-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                    Ethanol Solubility (EtOH)
                  </span>
                </div>
                {ethanolSol ? (
                  <>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium leading-snug">
                      {ethanolSol}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        Cosolvent System Recommendations:
                      </p>
                      <EthanolRecommendation logp={logp} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">Awaiting SMILES input...</p>
                )}
              </div>
            </div>

            {/* Target pH note */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-2">
                <Activity className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-0.5">
                    Solubility at Target Formulation pH {targetPh}
                  </p>
                  <PhSolubilityNote logp={logp} targetPh={Number(targetPh)} bcsClass={bcsClass} />
                </div>
              </div>
            </div>
          </div>
        )}

        <InfoAlert className="mt-3">
          ICH Q1A(R2) recommends solubility measurements at three pH values (1.2, 4.5, 6.8) simulating
          fasted gastric, intestinal, and colonic conditions. BCS defines low solubility as the highest
          therapeutic dose not fully dissolved in 250 mL at all tested pH values.
        </InfoAlert>
      </QCAccordion>
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================
function QCAccordion({ open, onToggle, icon, iconColor, title, subtitle, badge, children }) {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        open ? 'border-brand-500/40 shadow-sm' : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left rounded-2xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100">{title}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {open ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, highlight }) {
  return (
    <div
      className={`p-3 rounded-xl ${
        highlight
          ? 'bg-brand-500/8 border border-brand-500/25 dark:border-brand-500/20'
          : 'bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
      <p
        className={`text-[11px] font-medium leading-snug ${
          highlight ? 'text-brand-700 dark:text-brand-300' : 'text-zinc-700 dark:text-zinc-300'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoAlert({ children, className = '' }) {
  return (
    <div
      className={`mt-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl flex gap-2 items-start ${className}`}
    >
      <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{children}</p>
    </div>
  );
}

function DissolutionChart({ points, target }) {
  if (!points || points.length === 0) return null;
  const W = 360, H = 110;
  const PADt = 8, PADr = 8, PADb = 24, PADl = 32;
  const cw = W - PADl - PADr;
  const ch = H - PADt - PADb;
  const maxT = points[points.length - 1]?.time || 60;

  const toX = (t) => PADl + (t / maxT) * cw;
  const toY = (v) => PADt + ch - (v / 100) * ch;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.time)} ${toY(p.dissolution)}`).join(' ');
  const fillD = `${pathD} L ${toX(maxT)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
  const targetY = toY(target.Q);
  const targetX = toX(target.at);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="dissGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#dissGrad)" opacity="0.25" />
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={PADl} y1={targetY} x2={W - PADr} y2={targetY} stroke="#22c55e" strokeDasharray="4 3" strokeWidth="1.2" opacity="0.7" />
        <line x1={targetX} y1={PADt} x2={targetX} y2={H - PADb} stroke="#22c55e" strokeDasharray="4 3" strokeWidth="1.2" opacity="0.7" />
        {points.map((p) => (
          <circle key={p.time} cx={toX(p.time)} cy={toY(p.dissolution)} r="3" fill="#6366f1" />
        ))}
        {points.map((p, i) =>
          i % 2 === 0 ? (
            <text key={p.time} x={toX(p.time)} y={H - 6} textAnchor="middle" fontSize="7" fill="#a1a1aa">
              {p.time}
            </text>
          ) : null
        )}
        <text x={PADl / 2} y={PADt + ch / 2} textAnchor="middle" fontSize="7" fill="#a1a1aa" transform={`rotate(-90, ${PADl / 2}, ${PADt + ch / 2})`}>
          % Released
        </text>
        <text x={W / 2} y={H} textAnchor="middle" fontSize="7" fill="#a1a1aa">
          Time (min)
        </text>
        <text x={W - PADr - 2} y={targetY - 3} textAnchor="end" fontSize="7" fill="#22c55e" fontWeight="bold">
          Q{target.Q}%
        </text>
      </svg>
      <p className="text-[9px] text-zinc-400 text-center mt-1">
        Simulated — for predictive modeling only. Experimental verification required.
      </p>
    </div>
  );
}

function PhSolubilityChart({ logp, mw, targetPh }) {
  const pHPoints = [1.0, 1.2, 2.0, 3.0, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 6.8, 7.0, 7.4, 8.0];
  const estimates = pHPoints.map((ph) => {
    const pKa = 4.5;
    const phAdjust = ph > pKa ? ph - pKa : 0;
    const logS = 0.5 - (logp || 2) + phAdjust * 0.35;
    const mgPerL = Math.min(100000, Math.max(0.001, Math.pow(10, logS) * (mw || 300)));
    return { ph, mgPerL: +mgPerL.toFixed(2) };
  });

  const W = 360, H = 100;
  const PADt = 8, PADr = 8, PADb = 20, PADl = 40;
  const cw = W - PADl - PADr;
  const ch = H - PADt - PADb;
  const maxV = Math.max(...estimates.map((e) => e.mgPerL));
  const minPh = 1, maxPh = 8;

  const toX = (ph) => PADl + ((ph - minPh) / (maxPh - minPh)) * cw;
  const toY = (v) => PADt + ch - (Math.log10(v + 0.001) / Math.log10(maxV + 0.001)) * ch;

  const pathD = estimates.map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(e.ph)} ${toY(e.mgPerL)}`).join(' ');
  const fillD = `${pathD} L ${toX(8)} ${toY(0)} L ${toX(1)} ${toY(0)} Z`;
  const targetX = toX(Number(targetPh));

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#phGrad)" opacity="0.2" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={targetX} y1={PADt} x2={targetX} y2={H - PADb} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth="1.5" />
        <text x={targetX + 3} y={PADt + 10} fontSize="7" fill="#f59e0b" fontWeight="bold">
          pH {targetPh}
        </text>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((ph) => (
          <text key={ph} x={toX(ph)} y={H - 5} textAnchor="middle" fontSize="7" fill="#a1a1aa">
            {ph}
          </text>
        ))}
        <text x={PADl - 2} y={PADt + ch / 2} textAnchor="middle" fontSize="7" fill="#a1a1aa" transform={`rotate(-90, ${PADl - 2}, ${PADt + ch / 2})`}>
          Sol (mg/L)
        </text>
        <text x={W / 2} y={H} textAnchor="middle" fontSize="7" fill="#a1a1aa">
          pH
        </text>
      </svg>
    </div>
  );
}

function PhSolubilityNote({ logp, targetPh, bcsClass }) {
  if (logp === null)
    return <p className="text-[11px] text-zinc-400">Enter SMILES to estimate solubility.</p>;
  const isBCSII = bcsClass?.includes('Class II') || bcsClass?.includes('Class IV');
  const isLowPh = targetPh < 3.5;
  const isHighPh = targetPh > 8.0;
  if (isBCSII && isLowPh)
    return (
      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
        BCS Class II/IV API at low pH {targetPh}: solubility likely very low. Consider pH adjustment,
        salt formation, or nano-formulation strategy.
      </p>
    );
  if (isBCSII)
    return (
      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
        BCS Class II/IV: Solubility rate-limited at pH {targetPh}. Excipient selection (TPGS, Polysorbate 80)
        can significantly improve apparent solubility through micellar solubilization.
      </p>
    );
  if (isHighPh)
    return (
      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
        High target pH {targetPh}: verify API alkaline stability. Carbonate/phosphate buffers may cause
        salt precipitation with divalent cations.
      </p>
    );
  return (
    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
      At target pH {targetPh}, the solubility profile appears within acceptable physiological range. Confirm
      with shake-flask experimental solubility per ICH Q6A.
    </p>
  );
}

function EthanolRecommendation({ logp }) {
  if (logp === null) return null;
  const recs =
    logp > 3.5
      ? [
          { label: 'PEG 400 / Ethanol (1:1)', desc: 'Effective cosolvent blend for highly lipophilic APIs' },
          { label: 'Cremophor EL + EtOH', desc: 'Paclitaxel-type solubilization (max 5% EtOH for IV)' },
        ]
      : logp > 1.5
      ? [
          { label: 'PEG 400 (10–30%)', desc: 'Moderate lipophilicity — PEG cosolvent adequate' },
          { label: 'Propylene Glycol (< 25%)', desc: 'Alternative hydrophilic cosolvent for parenteral' },
        ]
      : [
          { label: 'Aqueous Buffer only', desc: 'Hydrophilic API — no cosolvent needed' },
          { label: 'Cyclodextrin complexation', desc: 'If taste masking or stability improvement needed' },
        ];
  return (
    <div className="space-y-1">
      {recs.map((r) => (
        <div key={r.label} className="flex items-start gap-1.5">
          <span className="text-teal-500 mt-0.5 text-[10px]">▸</span>
          <div>
            <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">{r.label}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400"> — {r.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DisintegrantCheck({ deliveryVehicle }) {
  if (deliveryVehicle !== 'oral_tablet' && deliveryVehicle !== 'oral_solution') return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[
        { name: 'Croscarmellose Na', grade: 'Ac-Di-Sol', rating: '★★★★★', time: '< 5 min' },
        { name: 'Na Starch Glycolate', grade: 'Explotab', rating: '★★★★☆', time: '5–10 min' },
        { name: 'Crospovidone', grade: 'PVPP XL', rating: '★★★★★', time: '< 3 min' },
      ].map((d) => (
        <div key={d.name} className="p-2.5 bg-amber-500/6 border border-amber-500/20 rounded-xl text-center">
          <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{d.name}</p>
          <p className="text-[9px] text-zinc-400">{d.grade}</p>
          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1">{d.time}</p>
          <p className="text-[9px] text-zinc-400">{d.rating}</p>
        </div>
      ))}
    </div>
  );
}

export default StepQualityControl;
