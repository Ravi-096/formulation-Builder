import React, { useState } from 'react';
import {
  Atom,
  Boxes,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Sliders,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export const EXCIPIENT_CATEGORIES = [
  { id: 'all', label: 'All Library' },
  { id: 'binder', label: 'Binders & Fillers' },
  { id: 'surfactant', label: 'Surfactants & Solubilizers' },
  { id: 'solvent', label: 'Solvents & Co-solvents' },
  { id: 'disintegrant', label: 'Disintegrants' },
  { id: 'lubricant', label: 'Lubricants' },
  { id: 'buffer', label: 'Buffers & pH' },
];

export const StepExcipients = ({
  apiName = 'Active Drug',
  apiSmiles = '',
  apiConcentrationPct = 50.0,
  setApiConcentrationPct,
  excipients,
  setExcipients,
  excipientCatalog,
  isLoadingCatalog,
  validationResult,
  targetPh,
  setTargetPh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Total concentration
  const totalExcipients = excipients.reduce(
    (sum, item) => sum + (Number(item.concentration_pct) || 0),
    0
  );
  const apiPct = Number(apiConcentrationPct) || 0;
  const totalFormulation = totalExcipients + apiPct;

  // Auto-balance remainder to 100%
  const handleAutoBalance = () => {
    if (excipients.length > 0) {
      const targetIdx = excipients.findIndex((e) =>
        e.excipient_name.toLowerCase().includes('cellulose') ||
        e.excipient_name.toLowerCase().includes('lactose')
      );
      const idxToAdjust = targetIdx >= 0 ? targetIdx : 0;
      const otherExcipients = excipients.reduce(
        (sum, item, idx) => (idx === idxToAdjust ? sum : sum + (Number(item.concentration_pct) || 0)),
        0
      );
      const needed = Math.max(0.5, Number((100 - apiPct - otherExcipients).toFixed(1)));
      const next = [...excipients];
      next[idxToAdjust] = {
        ...next[idxToAdjust],
        concentration_pct: needed,
      };
      setExcipients(next);
    } else if (setApiConcentrationPct) {
      setApiConcentrationPct(100);
    }
  };

  // Update concentration of single item
  const handleUpdateConc = (idx, val) => {
    const next = [...excipients];
    next[idx] = {
      ...next[idx],
      concentration_pct: Math.max(0, Math.min(100, Number(val) || 0)),
    };
    setExcipients(next);
  };

  // Remove excipient
  const handleRemove = (idx) => {
    setExcipients(excipients.filter((_, i) => i !== idx));
  };

  // Add excipient from library
  const handleAdd = (exc) => {
    if (excipients.some((e) => e.excipient_name.toLowerCase() === exc.name.toLowerCase())) {
      return;
    }
    const defaultVal = Math.min(10.0, exc.max_recommended_concentration_pct || 10.0);
    setExcipients([...excipients, { excipient_name: exc.name, concentration_pct: defaultVal }]);
  };

  // Filter catalog
  const filteredCatalog = (excipientCatalog || []).filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (item.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchFilter.trim() ||
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.function || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const criticalIssues = (validationResult?.compatibility_flags || []).filter(
    (f) => f.severity === 'critical'
  );
  const warningIssues = (validationResult?.compatibility_flags || []).filter(
    (f) => f.severity === 'warning'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ------------------------------------------------------------------------
          Header
      ------------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-mono">
              2
            </span>
            Excipients, Binders & Delivery Solvents
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pick biocompatible excipients from the pre-seeded pharmaceutical library and balance concentration ratios (% w/w).
          </p>
        </div>

        {/* Target pH Control */}
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Target Formulation pH:
          </span>
          <input
            type="number"
            min="1.0"
            max="14.0"
            step="0.1"
            value={targetPh}
            onChange={(e) => setTargetPh(Number(e.target.value) || 7.0)}
            className="w-16 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Chemical Compatibility & Reactive Substructure Alerts
      ------------------------------------------------------------------------ */}
      {(criticalIssues.length > 0 || warningIssues.length > 0) && (
        <div className="space-y-2.5">
          {criticalIssues.map((flag, idx) => (
            <div
              key={`crit-${idx}`}
              className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200"
            >
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{flag.source}</span>
                <p className="mt-0.5 leading-relaxed">{flag.message}</p>
              </div>
            </div>
          ))}

          {warningIssues.map((flag, idx) => (
            <div
              key={`warn-${idx}`}
              className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{flag.source}</span>
                <p className="mt-0.5 leading-relaxed">{flag.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------------
          Main Formulation Table & Catalog Selector
      ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Excipients Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-500" />
                  Active Formulation Composition
                </h3>
                <span className="text-[11px] text-zinc-400">
                  1 Active Drug + {excipients.length} Excipients ({excipients.length + 1} components total)
                </span>
              </div>

              {/* Total Concentration Indicator */}
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    API: <span className="font-mono font-bold text-brand-600">{apiPct.toFixed(1)}%</span>
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Excipients: <span className="font-mono font-bold text-zinc-700">{totalExcipients.toFixed(1)}%</span>
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      Math.abs(totalFormulation - 100) < 0.1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : totalFormulation > 100
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Total: {totalFormulation.toFixed(1)}% w/w
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Formula Composition Bar */}
            <div className="mt-3 mb-3">
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, (apiPct / Math.max(100, totalFormulation)) * 100)}%` }}
                  className="bg-brand-500 h-full transition-all"
                  title={`Active Drug (API): ${apiPct.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${Math.min(100, (totalExcipients / Math.max(100, totalFormulation)) * 100)}%` }}
                  className={`h-full transition-all ${
                    totalFormulation > 100 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  title={`Excipients: ${totalExcipients.toFixed(1)}%`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Active Drug ({apiPct.toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Excipients ({totalExcipients.toFixed(1)}%)
                </span>
                <span>
                  {Math.abs(totalFormulation - 100) < 0.1 ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Balanced Recipe
                    </span>
                  ) : totalFormulation > 100 ? (
                    <span className="text-rose-600 font-semibold">Exceeds 100% (+{(totalFormulation - 100).toFixed(1)}%)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="text-brand-600 hover:text-brand-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      Fill remaining {(100 - totalFormulation).toFixed(1)}% to 100%
                    </button>
                  )}
                </span>
              </div>
            </div>

            {/* 1. Pinned Active Drug (API) Row */}
            <div className="p-3.5 my-3 rounded-xl border border-brand-200 bg-brand-50/70 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Atom className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {apiName || 'Active Pharmaceutical Ingredient'}
                      </span>
                      <Badge variant="primary" size="sm" className="shrink-0 text-[10px] py-0 px-1.5 font-bold">
                        API / Active Drug
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5" title={apiSmiles}>
                      {apiSmiles ? `SMILES: ${apiSmiles}` : 'Core Drug Molecule'}
                    </span>
                  </div>
                </div>

                {/* API Concentration Control */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0.1"
                      max="99.9"
                      step="0.5"
                      value={apiPct}
                      onChange={(e) =>
                        setApiConcentrationPct?.(
                          Math.max(0.1, Math.min(99.9, Number(e.target.value) || 0))
                        )
                      }
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-right rounded-lg border border-brand-300 bg-white text-brand-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500 shadow-2xs"
                    />
                    <span className="text-xs text-brand-700 font-semibold ml-1.5">% w/w</span>
                  </div>
                  <span className="text-[10px] text-brand-700 bg-brand-100 border border-brand-200/80 px-2 py-0.5 rounded-md font-medium select-none">
                    Pinned
                  </span>
                </div>
              </div>

              {/* Slider for drug loading */}
              <div className="mt-2.5 pt-2 border-t border-brand-100 flex items-center gap-3">
                <span className="text-[10px] text-brand-700 font-medium whitespace-nowrap">
                  Drug Loading (% w/w):
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="90"
                  step="0.5"
                  value={apiPct}
                  onChange={(e) =>
                    setApiConcentrationPct?.(Number(e.target.value) || 0.5)
                  }
                  className="w-full h-1.5 bg-brand-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <span className="text-[10px] font-mono font-bold text-brand-800 shrink-0">
                  {apiPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-2 pb-1 flex items-center justify-between border-t border-zinc-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Pharmaceutical Excipients ({excipients.length})
              </span>
              <span className="text-[10px] text-zinc-400">
                Adjust sliders to balance formulation
              </span>
            </div>

            {/* List of active excipients */}
            <div className="divide-y divide-zinc-100 mt-1">
              {excipients.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  No excipients selected. Pick ingredients from the library on the right.
                </div>
              ) : (
                excipients.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                        {item.excipient_name}
                      </span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <input
                          type="range"
                          min="0.5"
                          max="90"
                          step="0.5"
                          value={item.concentration_pct}
                          onChange={(e) => handleUpdateConc(idx, e.target.value)}
                          className="w-full max-w-xs h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.5"
                          value={item.concentration_pct}
                          onChange={(e) => handleUpdateConc(idx, e.target.value)}
                          className="w-16 px-2 py-1 text-xs font-mono font-bold text-right rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                        />
                        <span className="absolute right-1 top-1 text-[10px] text-zinc-400 pointer-events-none">
                          %
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Remove component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Excipient Library Browser (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-brand-500" />
                Pre-Seeded Library
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filteredCatalog.length} available
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search excipients..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {EXCIPIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No matching excipients found.
                </div>
              ) : (
                filteredCatalog.map((exc) => {
                  const isAdded = excipients.some(
                    (e) => e.excipient_name.toLowerCase() === exc.name.toLowerCase()
                  );
                  return (
                    <div
                      key={exc.id || exc.name}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 hover:border-brand-500/40 transition-all"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                          {exc.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" size="xs">
                            {exc.category}
                          </Badge>
                          <span className="text-[10px] text-zinc-400 truncate">
                            Max: {exc.max_recommended_concentration_pct}%
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="xs"
                        variant={isAdded ? 'secondary' : 'outline'}
                        disabled={isAdded}
                        onClick={() => handleAdd(exc)}
                        leftIcon={isAdded ? CheckCircle2 : Plus}
                        className="shrink-0 text-[11px]"
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepExcipients;
