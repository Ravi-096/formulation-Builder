import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Clock,
  TrendingUp,
  Droplet,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  Share2,
  Download,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export const PkSimulationDashboard = ({
  simulationResult,
  apiName,
  deliveryVehicle,
  animalKey,
  doseMgKg,
  validationResult,
  onRerun,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [timeHorizon, setTimeHorizon] = useState(48); // 24 or 48 hours

  const timeSeries = simulationResult?.timeSeries || [];
  const metrics = simulationResult?.metrics || {};

  // Filter points according to time horizon
  const displayPoints = useMemo(() => {
    return timeSeries.filter((p) => p.time <= timeHorizon);
  }, [timeSeries, timeHorizon]);

  // Compute SVG chart bounds & scales
  const chartConfig = useMemo(() => {
    if (displayPoints.length === 0) return null;

    const maxTime = timeHorizon;
    // Max Cp including MTC and padding
    const maxVal = Math.max(
      ...displayPoints.map((p) => Math.max(p.plasmaConc, p.mtc * 1.15))
    );
    const maxY = Math.ceil(maxVal * 1.1) || 10;

    const width = 800;
    const height = 320;
    const padding = { top: 25, right: 30, bottom: 45, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const scaleX = (t) => padding.left + (t / maxTime) * plotW;
    const scaleY = (v) => padding.top + plotH - (v / maxY) * plotH;

    // SVG path string for Plasma Concentration
    const linePath = displayPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.time).toFixed(1);
      const y = scaleY(pt.plasmaConc).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    // Area path for gradient fill
    const areaPath = `${linePath} L ${scaleX(maxTime).toFixed(1)} ${scaleY(0).toFixed(
      1
    )} L ${scaleX(0).toFixed(1)} ${scaleY(0).toFixed(1)} Z`;

    // Coordinates for Therapeutic Window band (between MEC and MTC)
    const mecY = scaleY(metrics.mec || 1);
    const mtcY = scaleY(metrics.mtc || 5);
    const zeroY = scaleY(0);

    return {
      width,
      height,
      padding,
      plotW,
      plotH,
      maxTime,
      maxY,
      scaleX,
      scaleY,
      linePath,
      areaPath,
      mecY,
      mtcY,
      zeroY,
    };
  }, [displayPoints, timeHorizon, metrics]);

  // Hovered coordinate point
  const activePoint = hoverIndex !== null ? displayPoints[hoverIndex] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ------------------------------------------------------------------------
          Header & Horizon Toggle
      ------------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-mono">
              4
            </span>
            Virtual Pharmacokinetics (PK/ADME) Dashboard
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            2-Compartment in-vivo clearance simulation over time. Hover over the curve to inspect real-time plasma concentrations.
          </p>
        </div>

        {/* Time Horizon Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setTimeHorizon(24)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeHorizon === 24
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              24 Hours
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon(48)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeHorizon === 48
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              48 Hours
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Safety Flags & Toxicity Margin Banners
      ------------------------------------------------------------------------ */}
      {metrics.isToxic ? (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 flex items-start gap-3.5 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                Toxicity Threshold Exceeded
              </span>
              <Badge variant="danger" size="xs">
                Cmax {metrics.cMax} µg/mL &gt; MTC {metrics.mtc} µg/mL
              </Badge>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              Peak plasma concentration exceeds the Minimum Toxic Concentration (MTC) by{' '}
              <strong>
                {Math.round(((metrics.cMax - metrics.mtc) / metrics.mtc) * 100)}%
              </strong>
              . Risk of dose-dependent acute systemic or organ toxicity. Recommended action: Titrate
              dose down or formulate as extended-release to flatten Cmax.
            </p>
          </div>
        </div>
      ) : metrics.isSubtherapeutic ? (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 flex items-start gap-3.5 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Subtherapeutic Plasma Exposure
              </span>
              <Badge variant="warning" size="xs">
                Cmax {metrics.cMax} µg/mL &lt; MEC {metrics.mec} µg/mL
              </Badge>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Peak plasma levels fail to cross the Minimum Effective Concentration (MEC). The
              formulation is insufficient to elicit therapeutic efficacy in the selected{' '}
              <strong className="capitalize">{animalKey}</strong> model. Consider increasing dose
              (mg/kg) or incorporating bio-enhancing surfactants (e.g. TPGS, Polysorbate 80).
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-start gap-3.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                Optimal Therapeutic Profile
              </span>
              <Badge variant="success" size="xs">
                {metrics.pctInWindow}% in Therapeutic Window
              </Badge>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Plasma concentration profile stays safely between MEC ({metrics.mec} µg/mL) and MTC (
              {metrics.mtc} µg/mL) without incurring toxicity risks, maintaining steady therapeutic
              efficacy throughout preclinical exposure.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------
          Interactive Plasma Concentration Curve (SVG)
      ------------------------------------------------------------------------ */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" />
              Plasma Concentration vs Time Profile: Cp(t)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Simulated 2-compartment disposition for {apiName} ({doseMgKg} mg/kg in{' '}
              <span className="capitalize">{animalKey}</span>)
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-brand-500 rounded-sm" /> Plasma Cp(t)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xs" />{' '}
              Therapeutic Window
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-rose-500" /> MTC Limit
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="relative w-full overflow-hidden">
          {chartConfig && (
            <svg
              viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
              className="w-full h-auto select-none"
              onMouseLeave={() => setHoverIndex(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * chartConfig.width;
                const plotX = mouseX - chartConfig.padding.left;
                if (plotX >= 0 && plotX <= chartConfig.plotW) {
                  const frac = plotX / chartConfig.plotW;
                  const idx = Math.min(
                    displayPoints.length - 1,
                    Math.max(0, Math.round(frac * (displayPoints.length - 1)))
                  );
                  setHoverIndex(idx);
                }
              }}
            >
              <defs>
                <linearGradient id="plasmaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Shaded Therapeutic Window Band (between MEC and MTC) */}
              <rect
                x={chartConfig.padding.left}
                y={chartConfig.mtcY}
                width={chartConfig.plotW}
                height={Math.max(0, chartConfig.mecY - chartConfig.mtcY)}
                fill="#10b981"
                fillOpacity="0.08"
              />

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const yVal = chartConfig.padding.top + frac * chartConfig.plotH;
                const concVal = ((1 - frac) * chartConfig.maxY).toFixed(1);
                return (
                  <g key={`y-${frac}`}>
                    <line
                      x1={chartConfig.padding.left}
                      y1={yVal}
                      x2={chartConfig.width - chartConfig.padding.right}
                      y2={yVal}
                      stroke="currentColor"
                      strokeOpacity="0.07"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartConfig.padding.left - 8}
                      y={yVal + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-zinc-400"
                    >
                      {concVal}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Ticks (Hours) */}
              {[0, 6, 12, 18, 24, 30, 36, 42, 48]
                .filter((h) => h <= timeHorizon)
                .map((hour) => {
                  const xVal = chartConfig.scaleX(hour);
                  return (
                    <g key={`x-${hour}`}>
                      <line
                        x1={xVal}
                        y1={chartConfig.height - chartConfig.padding.bottom}
                        x2={xVal}
                        y2={chartConfig.height - chartConfig.padding.bottom + 5}
                        stroke="currentColor"
                        strokeOpacity="0.2"
                      />
                      <text
                        x={xVal}
                        y={chartConfig.height - chartConfig.padding.bottom + 18}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-zinc-400"
                      >
                        {hour}h
                      </text>
                    </g>
                  );
                })}

              {/* MTC Ceiling Line (Red Dashed) */}
              <line
                x1={chartConfig.padding.left}
                y1={chartConfig.mtcY}
                x2={chartConfig.width - chartConfig.padding.right}
                y2={chartConfig.mtcY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={chartConfig.width - chartConfig.padding.right}
                y={chartConfig.mtcY - 4}
                textAnchor="end"
                className="text-[9px] font-mono font-bold fill-rose-500"
              >
                MTC ({metrics.mtc} µg/mL)
              </text>

              {/* MEC Floor Line (Emerald Dashed) */}
              <line
                x1={chartConfig.padding.left}
                y1={chartConfig.mecY}
                x2={chartConfig.width - chartConfig.padding.right}
                y2={chartConfig.mecY}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={chartConfig.width - chartConfig.padding.right}
                y={chartConfig.mecY - 4}
                textAnchor="end"
                className="text-[9px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400"
              >
                MEC ({metrics.mec} µg/mL)
              </text>

              {/* Gradient Area Fill */}
              <path d={chartConfig.areaPath} fill="url(#plasmaGrad)" />

              {/* Plasma Concentration Line */}
              <path
                d={chartConfig.linePath}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Peak Cmax marker dot */}
              {metrics.tMax !== undefined && (
                <g>
                  <circle
                    cx={chartConfig.scaleX(metrics.tMax)}
                    cy={chartConfig.scaleY(metrics.cMax)}
                    r="4.5"
                    className="fill-brand-500 stroke-white dark:stroke-zinc-950 stroke-2"
                  />
                  <text
                    x={chartConfig.scaleX(metrics.tMax)}
                    y={chartConfig.scaleY(metrics.cMax) - 8}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-brand-600 dark:fill-brand-400"
                  >
                    Cmax: {metrics.cMax} µg/mL
                  </text>
                </g>
              )}

              {/* Interactive Hover Crosshair */}
              {activePoint && (
                <g>
                  <line
                    x1={chartConfig.scaleX(activePoint.time)}
                    y1={chartConfig.padding.top}
                    x2={chartConfig.scaleX(activePoint.time)}
                    y2={chartConfig.height - chartConfig.padding.bottom}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={chartConfig.scaleX(activePoint.time)}
                    cy={chartConfig.scaleY(activePoint.plasmaConc)}
                    r="5"
                    className="fill-brand-500 stroke-white dark:stroke-zinc-900 stroke-2 shadow-lg"
                  />
                </g>
              )}
            </svg>
          )}

          {/* Interactive Tooltip Card */}
          {activePoint && (
            <div className="absolute top-2 right-2 bg-zinc-950/85 text-white backdrop-blur-md p-3 rounded-xl border border-zinc-700/60 shadow-xl text-xs font-mono space-y-1 z-10 pointer-events-none">
              <div className="text-[10px] text-zinc-400">
                Time: <strong>{activePoint.time} hours</strong>
              </div>
              <div className="text-sky-400 font-bold">
                Cp(t): {activePoint.plasmaConc} µg/mL
              </div>
              <div className="text-zinc-400 text-[10px]">
                Tissue: {activePoint.tissueConc} µg/mL
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Primary Pharmacokinetic Parameters Grid
      ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cmax */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Peak Conc (Cmax)</span>
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.cMax}{' '}
            <span className="text-xs font-normal text-zinc-400">µg/mL</span>
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            MEC: {metrics.mec} | MTC: {metrics.mtc}
          </span>
        </div>

        {/* Tmax */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Time to Peak (Tmax)</span>
            <Clock className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.tMax}{' '}
            <span className="text-xs font-normal text-zinc-400">hours</span>
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Absorption rate (ka): 1.2 h⁻¹
          </span>
        </div>

        {/* AUC */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Exposure (AUC₀₋₄₈)</span>
            <Layers className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.auc}{' '}
            <span className="text-xs font-normal text-zinc-400">µg·h/mL</span>
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Total bioavailable mass
          </span>
        </div>

        {/* Half Life */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Half-Life (t½)</span>
            <RotateCcw className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.tHalf}{' '}
            <span className="text-xs font-normal text-zinc-400">hours</span>
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Terminal clearance rate
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Secondary Parameters & Actionable Recommendations
      ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Secondary Parameters Card */}
        <div className="lg:col-span-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2.5">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-brand-500" />
            Physiological Disposition Parameters
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Bioavailability (F)</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {metrics.bioavailabilityPct}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Clearance (CL)</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {metrics.clearance} L/h
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Volume of Dist. (Vd)</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {metrics.volumeDistribution} L
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">In Window Exposure</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.pctInWindow}% of 48h
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Formulation Insights Card */}
        <div className="lg:col-span-6 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Formulation Optimization Insights
          </h4>

          <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <strong>BCS Class:</strong>{' '}
              {validationResult?.bcs_solubility_flag?.split('(')[0] || 'Class II'} formulation
              shows steady clearance with{' '}
              {metrics.bioavailabilityPct > 70 ? 'favorable' : 'rate-limited'} oral absorption.
            </li>
            <li>
              <strong>Vehicle Influence:</strong>{' '}
              {deliveryVehicle === 'iv_infusion'
                ? 'IV injection eliminates first-pass hepatic loss, providing instantaneous Cmax.'
                : 'Oral solid delivery incorporates dissolution lag time, smoothing peak concentration.'}
            </li>
            <li>
              <strong>In-Vivo Model:</strong> Selected{' '}
              <span className="capitalize">{animalKey}</span> physiological clearance scales
              allometrically to human dosing with a BSA Km factor of{' '}
              {animalKey === 'mouse' ? '3' : animalKey === 'rat' ? '6' : '20'}.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PkSimulationDashboard;
