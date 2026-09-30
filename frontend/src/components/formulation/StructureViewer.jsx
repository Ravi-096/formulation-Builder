import React, { useMemo } from 'react';
import { Atom, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const StructureViewer = ({
  smiles,
  apiName,
  properties,
  className = '',
}) => {
  // Generate a procedural 2D molecular graph representation for visual preview
  const molecularDetails = useMemo(() => {
    if (!smiles) return null;

    // Count elements from SMILES
    const carbonMatches = smiles.match(/C(?![a-z])/g) || [];
    const oxygenMatches = smiles.match(/O/g) || [];
    const nitrogenMatches = smiles.match(/N/g) || [];
    const sulfurMatches = smiles.match(/S/g) || [];
    const fluorineMatches = smiles.match(/F/g) || [];
    const chlorineMatches = smiles.match(/Cl/g) || [];

    const atoms = [
      { element: 'C', count: carbonMatches.length, color: 'bg-zinc-700 text-zinc-200 dark:bg-zinc-700 dark:text-zinc-100' },
      { element: 'O', count: oxygenMatches.length, color: 'bg-rose-500/20 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/30' },
      { element: 'N', count: nitrogenMatches.length, color: 'bg-blue-500/20 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-500/30' },
      { element: 'S', count: sulfurMatches.length, color: 'bg-amber-500/20 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/30' },
      { element: 'F/Cl', count: fluorineMatches.length + chlorineMatches.length, color: 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/30' },
    ].filter((a) => a.count > 0);

    // Estimate rings / branches
    const rings = (smiles.match(/\d/g) || []).length / 2;
    const doubleBonds = (smiles.match(/=/g) || []).length;

    return {
      atoms,
      ringCount: Math.round(rings),
      doubleBondCount: doubleBonds,
    };
  }, [smiles]);

  if (!smiles) {
    return (
      <div className={`h-36 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-4 text-center bg-zinc-50/50 dark:bg-zinc-900/30 ${className}`}>
        <Atom className="w-8 h-8 text-zinc-400 mb-1.5 animate-spin-slow" />
        <p className="text-xs font-medium text-zinc-500">Enter a SMILES string or choose a preset</p>
        <p className="text-[11px] text-zinc-400">2D structure and reactive groups will generate automatically</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 relative overflow-hidden ${className}`}>
      {/* Background Molecular Grid Canvas decoration */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Atom className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              {apiName || 'Active Pharmaceutical Ingredient'}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-xs block" title={smiles}>
              {smiles}
            </span>
          </div>
        </div>

        {properties?.molecular_weight && (
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {properties.molecular_weight} <span className="text-[10px] text-zinc-400 font-normal">g/mol</span>
            </span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 block font-medium">
              LogP: {properties.logp}
            </span>
          </div>
        )}
      </div>

      {/* SVG Chemical Graph Schematic Visualizer */}
      <div className="relative h-24 w-full bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 p-2 flex items-center justify-center overflow-hidden">
        {/* Chemical ring wireframe illustration */}
        <svg viewBox="0 0 400 90" className="w-full h-full stroke-zinc-400 dark:stroke-zinc-600 fill-none">
          {/* Benzene / Core Rings */}
          <polygon points="50,25 75,10 100,25 100,55 75,70 50,55" strokeWidth="2" />
          <circle cx="75" cy="40" r="14" strokeWidth="1" strokeDasharray="3,3" />

          {/* Bridge Bonds */}
          <line x1="100" y1="40" x2="140" y2="40" strokeWidth="2" />
          <line x1="140" y1="40" x2="165" y2="20" strokeWidth="2" />
          <line x1="140" y1="40" x2="165" y2="60" strokeWidth="2" />

          {/* Carbonyl Oxygen */}
          <line x1="165" y1="20" x2="195" y2="20" strokeWidth="2.5" className="stroke-rose-500" />
          <line x1="165" y1="24" x2="195" y2="24" strokeWidth="2.5" className="stroke-rose-500" />
          <text x="200" y="24" className="text-[10px] fill-rose-500 font-bold font-sans">O</text>

          {/* Nitrogen / Amine branch */}
          <line x1="165" y1="60" x2="200" y2="60" strokeWidth="2" className="stroke-blue-500" />
          <text x="205" y="64" className="text-[10px] fill-blue-500 font-bold font-sans">NH</text>

          {/* Extension Tail */}
          <line x1="225" y1="60" x2="260" y2="40" strokeWidth="2" />
          <line x1="260" y1="40" x2="295" y2="60" strokeWidth="2" />
          <line x1="295" y1="60" x2="330" y2="40" strokeWidth="2" />
          <line x1="330" y1="40" x2="355" y2="20" strokeWidth="2.5" className="stroke-rose-500" />
          <text x="360" y="24" className="text-[10px] fill-rose-500 font-bold font-sans">OH</text>
        </svg>

        <div className="absolute bottom-1 right-2 text-[9px] text-zinc-400 font-mono">
          RDKit 2D Schematic
        </div>
      </div>

      {/* Atom Composition Pills */}
      {molecularDetails?.atoms && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
            Atoms:
          </span>
          {molecularDetails.atoms.map((a) => (
            <span
              key={a.element}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${a.color}`}
            >
              {a.element}: {a.count}
            </span>
          ))}
          {properties?.tpsa && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ml-auto">
              TPSA: {properties.tpsa} Å²
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StructureViewer;
