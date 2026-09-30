import React, { useState, useEffect } from 'react';
import {
  Atom,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import StructureViewer from './StructureViewer';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export const POPULAR_PRESETS = [
  {
    name: 'Ibuprofen',
    category: 'Analgesic / NSAID',
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    doseMg: 400,
    vehicle: 'oral_tablet',
    targetPh: 6.5,
    description: 'BCS Class II lipophilic weak acid. Carboxylic acid group prone to insoluble divalent salt formation.',
  },
  {
    name: 'Paclitaxel',
    category: 'Antineoplastic / Taxane',
    smiles: 'CC1=C2C(C(=O)C3(C(CC4C(C3C(C(C2(C)C)(CC1OC(=O)C(C(C5=CC=CC=C5)NC(=O)C6=CC=CC=C6)O)O)OC(=O)C7=CC=CC=C7)(CO4)OC(=O)C)O)C)OC(=O)C',
    doseMg: 30,
    vehicle: 'liposome',
    targetPh: 7.4,
    description: 'BCS Class IV highly hydrophobic molecule requiring lipid nanoparticles or polymeric surfactants.',
  },
  {
    name: 'Metformin HCl',
    category: 'Antidiabetic / Biguanide',
    smiles: 'CN(C)C(=N)N=C(N)N',
    doseMg: 500,
    vehicle: 'oral_tablet',
    targetPh: 7.0,
    description: 'BCS Class III highly water-soluble compound with low intestinal passive membrane permeability.',
  },
  {
    name: 'Amoxicillin',
    category: 'Beta-Lactam Antibiotic',
    smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)C(c3ccc(cc3)O)N)C(=O)O)C',
    doseMg: 500,
    vehicle: 'oral_tablet',
    targetPh: 6.0,
    description: 'Contains aliphatic primary amine susceptible to Maillard browning degradation with reducing sugars.',
  },
  {
    name: 'Ciprofloxacin',
    category: 'Fluoroquinolone',
    smiles: 'C1CC1N2C=C(C(=O)C3=CC(=C(C=C32)N4CCNCC4)F)C(=O)O',
    doseMg: 200,
    vehicle: 'iv_infusion',
    targetPh: 5.5,
    description: 'Zwitterionic antimicrobial agent with pH-dependent solubility, formulated for intravenous infusion.',
  },
  {
    name: 'Atorvastatin',
    category: 'HMG-CoA Reductase Inhibitor',
    smiles: 'CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4',
    doseMg: 20,
    vehicle: 'oral_tablet',
    targetPh: 7.0,
    description: 'BCS Class II lipophilic statin with high permeability but dissolution rate-limited bioavailability.',
  },
];

export const StepApiSelection = ({
  apiName,
  setApiName,
  apiSmiles,
  setApiSmiles,
  onSelectPreset,
  validationResult,
  isValidating,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingPubChem, setIsSearchingPubChem] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Compute Lipinski Rule of 5 evaluation from properties
  const props = validationResult?.physicochemical_properties;

  const lipinskiChecks = [
    {
      label: 'Molecular Weight',
      value: props ? `${props.molecular_weight} g/mol` : '—',
      threshold: '≤ 500 g/mol',
      passed: props ? props.molecular_weight <= 500 : null,
      desc: 'Ensures optimal diffusion through biological cell membranes.',
    },
    {
      label: 'Lipophilicity (LogP)',
      value: props ? props.logp : '—',
      threshold: '≤ 5.0',
      passed: props ? props.logp <= 5.0 : null,
      desc: 'Balances lipid bilayer partitioning vs aqueous solubility.',
    },
    {
      label: 'H-Bond Donors (HBD)',
      value: props ? props.hbd : '—',
      threshold: '≤ 5',
      passed: props ? props.hbd <= 5 : null,
      desc: 'Fewer donors minimize desolvation energy during membrane transit.',
    },
    {
      label: 'H-Bond Acceptors (HBA)',
      value: props ? props.hba : '—',
      threshold: '≤ 10',
      passed: props ? props.hba <= 10 : null,
      desc: 'Excessive acceptors inhibit passive intracellular absorption.',
    },
  ];

  const veberChecks = [
    {
      label: 'Rotatable Bonds',
      value: props ? props.rotatable_bonds : '—',
      threshold: '≤ 10',
      passed: props ? props.rotatable_bonds <= 10 : null,
      desc: 'Molecular rigidity promotes oral bioavailability.',
    },
    {
      label: 'Polar Surface Area (TPSA)',
      value: props ? `${props.tpsa} Å²` : '—',
      threshold: '≤ 140 Å²',
      passed: props ? props.tpsa <= 140 : null,
      desc: 'Determines passive paracellular & transcellular permeability.',
    },
  ];

  const passedLipinskiCount = lipinskiChecks.filter((c) => c.passed === true).length;
  const passedVeberCount = veberChecks.filter((c) => c.passed === true).length;
  const totalScore = passedLipinskiCount + passedVeberCount;

  // Search PubChem API
  const handlePubChemSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearchingPubChem(true);
    setSearchError(null);

    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
        searchTerm.trim()
      )}/property/CanonicalSMILES,IsomericSMILES,ConnectivitySMILES,SMILES,MolecularWeight,MolecularFormula/JSON`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Compound "${searchTerm.trim()}" not found in PubChem repository.`);
      }

      const data = await res.json();
      const propsData = data?.PropertyTable?.Properties?.[0];

      const smiles =
        propsData?.ConnectivitySMILES ||
        propsData?.SMILES ||
        propsData?.CanonicalSMILES ||
        propsData?.IsomericSMILES;

      if (propsData && smiles) {
        setApiName(searchTerm.trim());
        setApiSmiles(smiles);
        setSearchTerm('');
      } else {
        throw new Error('No SMILES chemical structure returned for this molecule.');
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to search PubChem.');
    } finally {
      setIsSearchingPubChem(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ------------------------------------------------------------------------
          Header & Overview
      ------------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-mono">
              1
            </span>
            Active Pharmaceutical Ingredient (API)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Specify the drug molecule via chemical SMILES syntax, PubChem database search, or choose a validated benchmark preset.
          </p>
        </div>

        {/* Drug-Likeness Summary Badge */}
        {props && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Drug-Likeness:
            </span>
            <Badge
              variant={totalScore >= 5 ? 'success' : totalScore >= 4 ? 'warning' : 'danger'}
              size="sm"
            >
              {totalScore}/6 Rules Passed
            </Badge>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------
          Compound Search & Presets Grid
      ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          {/* PubChem live search bar */}
          <form onSubmit={handlePubChemSearch} className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>PubChem Compound Search</span>
              <span className="text-[11px] font-normal text-zinc-400 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Live NIH PubChem REST API
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type generic drug name (e.g., Atorvastatin, Aspirin, Doxorubicin)..."
                className="w-full pl-9 pr-24 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="absolute right-1.5 py-1 px-3 text-xs"
                disabled={isSearchingPubChem || !searchTerm.trim()}
              >
                {isSearchingPubChem ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Resolve'
                )}
              </Button>
            </div>
            {searchError && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {searchError}
              </p>
            )}
          </form>

          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
              Or Select a Validated Benchmark Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_PRESETS.map((p) => {
                const isSelected = apiName.toLowerCase() === p.name.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => onSelectPreset(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-1 ring-brand-500/50'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {p.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5 truncate">
                      {p.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Chemical Name & SMILES Inputs */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Compound Name
                </label>
                <Input
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  placeholder="e.g. Ibuprofen"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Validation Status
                </label>
                <div className="h-10 px-3 flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs">
                  {isValidating ? (
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                      Evaluating with RDKit...
                    </span>
                  ) : validationResult?.is_valid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SMILES Validated
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1.5 font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      Invalid Chemical Structure
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Canonical / Isomeric SMILES
              </label>
              <textarea
                rows={2}
                value={apiSmiles}
                onChange={(e) => setApiSmiles(e.target.value)}
                placeholder="Enter SMILES representation (e.g. CC(C)Cc1ccc(cc1)C(C)C(=O)O)"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------
            Right Column: 2D Structure Canvas & BCS Classification
        ---------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-4">
          <StructureViewer
            smiles={apiSmiles}
            apiName={apiName}
            properties={props}
            className="w-full"
          />

          {/* BCS Classification Card */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                Biopharmaceutics Classification (BCS)
              </span>
              <Badge variant="primary" size="sm">
                {validationResult?.bcs_solubility_flag?.split('(')[0] || 'Evaluating'}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {validationResult?.bcs_solubility_flag ||
                'Calculates aqueous solubility and intestinal permeability limits to predict oral absorption.'}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Lipinski Rule of 5 & Drug-Likeness Criteria Table
      ------------------------------------------------------------------------ */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Drug-Likeness: Lipinski's Rule of 5 & Veber Bioavailability Metrics
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Verified via RDKit 2D descriptor engines to assess oral bioavailability and druggability profiles.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-zinc-500">
            {passedLipinskiCount}/4 Lipinski · {passedVeberCount}/2 Veber
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...lipinskiChecks, ...veberChecks].map((item, idx) => {
            const hasStatus = item.passed !== null;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  item.passed === true
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : item.passed === false
                    ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.label}
                  </span>
                  {hasStatus && (
                    item.passed ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> ALERT
                      </span>
                    )
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Limit: {item.threshold}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepApiSelection;
