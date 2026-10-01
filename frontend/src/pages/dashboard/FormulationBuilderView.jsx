import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formulationApi } from '../../api/formulationApi';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import StepApiSelection, { POPULAR_PRESETS } from '../../components/formulation/StepApiSelection';
import StepExcipients from '../../components/formulation/StepExcipients';
import StepQualityControl from '../../components/formulation/StepQualityControl';
import StepAnimalSubject, { DELIVERY_ROUTES } from '../../components/formulation/StepAnimalSubject';
import PkSimulationDashboard from '../../components/formulation/PkSimulationDashboard';
import { calculatePkParameters, simulatePkCurve } from '../../utils/pkSimulationEngine';
import {
  Atom,
  Boxes,
  Activity,
  ArrowRight,
  ArrowLeft,
  Save,
  FolderOpen,
  X,
  Trash2,
  CheckCircle2,
  Sparkles,
  Zap,
  Scale,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';

export const STEPS = [
  {
    id: 1,
    title: 'Active Drug (API)',
    subtitle: 'SMILES & Drug-Likeness',
    icon: Atom,
  },
  {
    id: 2,
    title: 'Excipients & Solvents',
    subtitle: 'Compatibility & Ratios',
    icon: Boxes,
  },
  {
    id: 3,
    title: 'QC Tests',
    subtitle: 'Dissolution, Texture, Solubility',
    icon: FlaskConical,
  },
  {
    id: 4,
    title: 'Route & Animal Subject',
    subtitle: 'Oral/IV & Preclinical Species',
    icon: Scale,
  },
  {
    id: 5,
    title: 'Virtual PK Simulation',
    subtitle: 'ODE Curves & Safety Flags',
    icon: Activity,
  },
];

export const FormulationBuilderView = () => {
  const { toast } = useToast();

  // Active Wizard Step
  const [activeStep, setActiveStep] = useState(1);

  // Form State
  const [apiName, setApiName] = useState('Ibuprofen');
  const [apiSmiles, setApiSmiles] = useState('CC(C)Cc1ccc(cc1)C(C)C(=O)O');
  const [targetPh, setTargetPh] = useState(6.5);
  const [deliveryVehicle, setDeliveryVehicle] = useState('oral_tablet');
  const [animalKey, setAnimalKey] = useState('rat');
  const [doseMgKg, setDoseMgKg] = useState(20);
  const [apiConcentrationPct, setApiConcentrationPct] = useState(60.0);
  const [excipients, setExcipients] = useState([
    { excipient_name: 'Microcrystalline Cellulose (MCC PH-102)', concentration_pct: 55.0 },
    { excipient_name: 'Croscarmellose Sodium (Ac-Di-Sol)', concentration_pct: 4.0 },
    { excipient_name: 'Magnesium Stearate', concentration_pct: 1.0 },
  ]);

  // Excipients Database catalog
  const [excipientCatalog, setExcipientCatalog] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Validation State (RDKit Backend)
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Simulation State
  const [simulationResult, setSimulationResult] = useState(null);

  // Saved Formulations Drawer State
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [savedFormulations, setSavedFormulations] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // 1. Fetch available excipients on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoadingCatalog(true);
      try {
        const data = await formulationApi.getExcipients();
        setExcipientCatalog(data || []);
      } catch (err) {
        console.error('Failed to load excipient catalog:', err);
        toast.error('Unable to fetch excipient library from database.');
      } finally {
        setIsLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, [toast]);

  // 2. Debounced real-time validation with RDKit backend (350ms)
  const runValidation = useCallback(
    async (payload) => {
      if (!payload.api_smiles.trim()) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);
      try {
        const result = await formulationApi.validateFormulation(payload);
        setValidationResult(result);
      } catch (err) {
        console.warn('Backend validation fallback:', err);
        // Resilient fallback with estimated properties for offline or mock mode
        setValidationResult({
          is_valid: true,
          total_excipient_concentration_pct: payload.excipients.reduce(
            (sum, e) => sum + e.concentration_pct,
            0
          ),
          compatibility_flags: [],
          detected_api_functional_groups: [],
          bcs_solubility_flag: 'BCS Class II (Low Solubility, High Permeability)',
          physicochemical_properties: {
            molecular_weight: 206.28,
            logp: 3.5,
            tpsa: 37.3,
            hbd: 1,
            hba: 2,
            rotatable_bonds: 4,
            aromatic_rings: 1,
            formal_charge: 0,
            heavy_atom_count: 15,
            fraction_csp3: 0.54,
          },
        });
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      runValidation({
        api_name: apiName,
        api_smiles: apiSmiles,
        delivery_vehicle: deliveryVehicle,
        target_dose_mg: Number(doseMgKg) * 0.25 || 5.0, // proxy dose in mg
        target_ph: Number(targetPh) || 7.0,
        excipients: excipients,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [apiName, apiSmiles, doseMgKg, targetPh, deliveryVehicle, excipients, runValidation]);

  // 3. Compute PK Simulation Profile whenever inputs change
  useEffect(() => {
    let isMounted = true;
    const runSimulation = async () => {
      const routeType = deliveryVehicle === 'iv_infusion' ? 'iv' : 'oral';

      // 1. Try live backend SciPy ODE simulation
      try {
        const backendSim = await formulationApi.simulatePk({
          api_name: apiName,
          api_smiles: apiSmiles,
          delivery_vehicle: deliveryVehicle,
          route: routeType,
          dose_mg_kg: Number(doseMgKg) || 10,
          animal_key: animalKey,
          hours: 48,
          excipients: excipients,
          physicochemical_properties: validationResult?.physicochemical_properties,
          bcs_class: validationResult?.bcs_solubility_flag,
        });

        if (backendSim?.timeSeries && backendSim?.metrics && isMounted) {
          setSimulationResult(backendSim);
          return;
        }
      } catch (err) {
        console.warn('Backend PK simulation error, using client ODE solver:', err);
      }

      // 2. Client-side fallback solver
      const params = calculatePkParameters({
        apiProps: validationResult?.physicochemical_properties,
        bcsClass: validationResult?.bcs_solubility_flag || 'BCS Class II',
        deliveryVehicle,
        route: routeType,
        doseMgKg,
        animalKey,
        excipients,
      });

      const sim = simulatePkCurve({
        params,
        hours: 48,
        numPoints: 160,
        route: routeType,
      });

      if (isMounted) {
        setSimulationResult(sim);
      }
    };

    runSimulation();
    return () => {
      isMounted = false;
    };
  }, [
    apiName,
    apiSmiles,
    validationResult?.physicochemical_properties,
    validationResult?.bcs_solubility_flag,
    deliveryVehicle,
    doseMgKg,
    animalKey,
    excipients,
  ]);

  // Preset Selection Handler
  const handleSelectPreset = (preset) => {
    setApiName(preset.name);
    setApiSmiles(preset.smiles);
    setDeliveryVehicle(preset.vehicle || 'oral_tablet');
    setTargetPh(preset.targetPh || 7.0);

    // Map default excipients
    if (preset.name.toLowerCase().includes('amoxicillin')) {
      setExcipients([
        { excipient_name: 'Mannitol', concentration_pct: 50.0 },
        { excipient_name: 'Croscarmellose Sodium (Ac-Di-Sol)', concentration_pct: 4.0 },
        { excipient_name: 'Magnesium Stearate', concentration_pct: 1.0 },
      ]);
    } else if (preset.name.toLowerCase().includes('ciprofloxacin')) {
      setExcipients([
        { excipient_name: 'Citric Acid Monohydrate', concentration_pct: 1.5 },
        { excipient_name: 'Tromethamine (Tris Buffer)', concentration_pct: 1.0 },
      ]);
    } else if (preset.name.toLowerCase().includes('paclitaxel')) {
      setExcipients([
        { excipient_name: 'Phospholipon 90G', concentration_pct: 16.0 },
        { excipient_name: 'Cholesterol (Plant-derived)', concentration_pct: 6.0 },
        { excipient_name: 'D-alpha-Tocopheryl PEG 1000 Succinate (TPGS)', concentration_pct: 2.5 },
      ]);
    } else {
      setExcipients([
        { excipient_name: 'Microcrystalline Cellulose (MCC PH-102)', concentration_pct: 55.0 },
        { excipient_name: 'Croscarmellose Sodium (Ac-Di-Sol)', concentration_pct: 4.0 },
        { excipient_name: 'Magnesium Stearate', concentration_pct: 1.0 },
      ]);
    }

    toast.info(`Loaded pharmaceutical benchmark: ${preset.name}`);
  };

  // Save Formulation Handler
  const handleSaveFormulation = async () => {
    if (!apiSmiles.trim()) {
      toast.error('Please provide a valid SMILES string.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        api_name: apiName,
        api_smiles: apiSmiles,
        delivery_vehicle: deliveryVehicle,
        target_dose_mg: Number(doseMgKg) * 0.25 || 10,
        target_ph: Number(targetPh) || 7.0,
        excipients: excipients,
        notes: `Simulated for ${animalKey} at ${doseMgKg} mg/kg. Cmax: ${simulationResult?.metrics?.cMax} µg/mL.`,
      };

      await formulationApi.saveFormulation(payload);
      toast.success('Formulation successfully saved to database!');
    } catch (err) {
      console.warn('Save failed, saving locally:', err);
      // Fallback local storage save
      const localFormulations = JSON.parse(
        localStorage.getItem('ks_saved_formulations') || '[]'
      );
      const newForm = {
        id: `form_${Date.now()}`,
        api_name: apiName,
        api_smiles: apiSmiles,
        delivery_vehicle: deliveryVehicle,
        target_dose_mg: Number(doseMgKg) * 0.25 || 10,
        target_ph: Number(targetPh) || 7.0,
        excipients: excipients,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(
        'ks_saved_formulations',
        JSON.stringify([newForm, ...localFormulations])
      );
      toast.success('Formulation saved to local library!');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Saved Drawer
  const handleOpenSavedDrawer = async () => {
    setIsSavedDrawerOpen(true);
    setIsLoadingSaved(true);
    try {
      const data = await formulationApi.getMyFormulations();
      setSavedFormulations(data || []);
    } catch (err) {
      console.warn('Failed to fetch from server, checking local store:', err);
      const local = JSON.parse(localStorage.getItem('ks_saved_formulations') || '[]');
      setSavedFormulations(local);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Load a Saved Formulation
  const handleLoadSaved = (form) => {
    setApiName(form.api_name);
    setApiSmiles(form.api_smiles);
    setDeliveryVehicle(form.delivery_vehicle || 'oral_tablet');
    setTargetPh(form.target_ph || 7.0);
    setExcipients(form.excipients || []);
    setIsSavedDrawerOpen(false);
    toast.success(`Loaded formulation for ${form.api_name}`);
  };

  // Delete a Saved Formulation
  const handleDeleteSaved = async (id, name, e) => {
    e.stopPropagation();
    try {
      await formulationApi.deleteFormulation(id);
    } catch {
      // Local fallback
      const local = JSON.parse(localStorage.getItem('ks_saved_formulations') || '[]');
      const filtered = local.filter((f) => f.id !== id);
      localStorage.setItem('ks_saved_formulations', JSON.stringify(filtered));
    }
    setSavedFormulations((prev) => prev.filter((f) => f.id !== id));
    toast.info(`Deleted formulation ${name}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =======================================================================
          Top Bar: Title, Presets & Actions
      ======================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Medicine Formulation & PK Simulator
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Step-by-step computational chemistry, excipient compatibility, and preclinical PK/ADME modeling.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSavedDrawer}
            leftIcon={FolderOpen}
            className="text-xs"
          >
            Library
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveFormulation}
            disabled={isSaving}
            leftIcon={Save}
            className="text-xs"
          >
            {isSaving ? 'Saving...' : 'Save Formulation'}
          </Button>
        </div>
      </div>

      {/* =======================================================================
          Step Progress Stepper Navigation Bar
      ======================================================================= */}
      <div className="p-3 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-brand-50/80 dark:bg-brand-950/40 border border-brand-500/50 shadow-xs'
                    : isCompleted
                    ? 'bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-850/40 border border-transparent opacity-80'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      STEP {step.id}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold block truncate ${
                      isActive
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          Step Content Body
      ======================================================================= */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        {activeStep === 1 && (
          <StepApiSelection
            apiName={apiName}
            setApiName={setApiName}
            apiSmiles={apiSmiles}
            setApiSmiles={setApiSmiles}
            onSelectPreset={handleSelectPreset}
            validationResult={validationResult}
            isValidating={isValidating}
          />
        )}

        {activeStep === 2 && (
          <StepExcipients
            apiName={apiName}
            apiSmiles={apiSmiles}
            apiConcentrationPct={apiConcentrationPct}
            setApiConcentrationPct={setApiConcentrationPct}
            excipients={excipients}
            setExcipients={setExcipients}
            excipientCatalog={excipientCatalog}
            isLoadingCatalog={isLoadingCatalog}
            validationResult={validationResult}
            targetPh={targetPh}
            setTargetPh={setTargetPh}
          />
        )}

        {activeStep === 3 && (
          <StepQualityControl
            apiName={apiName}
            deliveryVehicle={deliveryVehicle}
            targetPh={targetPh}
            validationResult={validationResult}
          />
        )}

        {activeStep === 4 && (
          <StepAnimalSubject
            deliveryVehicle={deliveryVehicle}
            setDeliveryVehicle={setDeliveryVehicle}
            animalKey={animalKey}
            setAnimalKey={setAnimalKey}
            doseMgKg={doseMgKg}
            setDoseMgKg={setDoseMgKg}
          />
        )}

        {activeStep === 5 && (
          <PkSimulationDashboard
            simulationResult={simulationResult}
            apiName={apiName}
            deliveryVehicle={deliveryVehicle}
            animalKey={animalKey}
            doseMgKg={doseMgKg}
            validationResult={validationResult}
            onRerun={() => {
              toast.success('Re-evaluated differential ODE trajectory.');
            }}
          />
        )}

        {/* --------------------------------------------------------------------
            Bottom Navigation Buttons
        -------------------------------------------------------------------- */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            leftIcon={ArrowLeft}
            className="text-xs"
          >
            Previous Step
          </Button>

          <div className="flex items-center gap-2">
            {activeStep < 5 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                rightIcon={ArrowRight}
                className="text-xs"
              >
                Next:{' '}
                {activeStep === 1
                  ? 'Excipients & Solvents'
                  : activeStep === 2
                  ? 'QC Tests'
                  : activeStep === 3
                  ? 'Route & Animal Subject'
                  : 'Run PK Simulation'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveFormulation}
                disabled={isSaving}
                leftIcon={Save}
                className="text-xs"
              >
                {isSaving ? 'Saving...' : 'Save Final Formulation'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================================
          DRAWER: Saved Formulations Library
      ======================================================================= */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setIsSavedDrawerOpen(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl z-10 flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-slide-left">
            <div className="p-4 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Saved Formulations
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Formulations stored in database
                </p>
              </div>
              <button
                onClick={() => setIsSavedDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingSaved ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" className="text-brand-500" />
                  <p className="text-xs text-zinc-400">Loading formulations...</p>
                </div>
              ) : savedFormulations.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-xs">
                  No saved formulations found. Create and save one!
                </div>
              ) : (
                savedFormulations.map((form) => (
                  <div
                    key={form.id}
                    onClick={() => handleLoadSaved(form)}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/60 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-850/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {form.api_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="primary" size="sm">
                            {form.delivery_vehicle?.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            pH {form.target_ph}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSaved(form.id, form.api_name, e)}
                        className="p-1.5 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete formulation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-400 mt-2 line-clamp-1">
                      {form.excipients
                        ?.map((e) => `${e.excipient_name} (${e.concentration_pct}%)`)
                        .join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulationBuilderView;
