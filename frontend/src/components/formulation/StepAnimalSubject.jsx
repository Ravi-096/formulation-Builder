import React from 'react';
import {
  Pill,
  Syringe,
  FlaskConical,
  Boxes,
  Sparkles,
  Activity,
  Heart,
  Droplet,
  Scale,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { ANIMAL_SUBJECTS } from '../../utils/pkSimulationEngine';

export const DELIVERY_ROUTES = [
  {
    id: 'oral_tablet',
    route: 'oral',
    label: 'Oral Tablet',
    category: 'Oral Solid',
    icon: Pill,
    badge: 'Solid Formulation',
    description: 'Requires tablet disintegration and dissolution before gastrointestinal absorption.',
  },
  {
    id: 'oral_solution',
    route: 'oral',
    label: 'Oral Solution',
    category: 'Oral Liquid',
    icon: FlaskConical,
    badge: 'Rapid Absorption',
    description: 'Directly dissolved drug in liquid vehicle; faster gastric emptying and uptake.',
  },
  {
    id: 'iv_infusion',
    route: 'iv',
    label: 'IV Infusion / Bolus',
    category: 'Parenteral',
    icon: Syringe,
    badge: '100% Bioavailability',
    description: 'Direct vascular administration into central plasma compartment (bypasses gut barrier).',
  },
  {
    id: 'nanoparticle_lipid',
    route: 'oral',
    label: 'Lipid Nanoparticles',
    category: 'Nanocarrier',
    icon: Boxes,
    badge: 'Enhanced Delivery',
    description: 'Lipid-encapsulated carrier designed to boost bioavailability of low-solubility APIs.',
  },
];

export const StepAnimalSubject = ({
  deliveryVehicle,
  setDeliveryVehicle,
  animalKey,
  setAnimalKey,
  doseMgKg,
  setDoseMgKg,
}) => {
  const currentAnimal = ANIMAL_SUBJECTS[animalKey] || ANIMAL_SUBJECTS.rat;
  const currentRouteObj =
    DELIVERY_ROUTES.find((r) => r.id === deliveryVehicle) || DELIVERY_ROUTES[0];

  // Dynamic absolute dose calculation: Dose_total = Dose_mg_kg * BW
  const totalDoseMg = +(Number(doseMgKg) * currentAnimal.bodyWeightKg).toFixed(3);

  // FDA Human Equivalent Dose (HED) BSA Km factors:
  // Mouse: 3, Rat: 6, Dog: 20, Human: 37
  const kmFactors = { mouse: 3, rat: 6, dog: 20, monkey: 12 };
  const animalKm = kmFactors[animalKey] || 6;
  const humanEquivalentDoseMgKg = +((Number(doseMgKg) * animalKm) / 37).toFixed(2);
  const humanTotalDoseMg = +(humanEquivalentDoseMgKg * 70).toFixed(1); // Standard 70 kg human

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ------------------------------------------------------------------------
          Header
      ------------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-mono">
              3
            </span>
            Administration Route & Virtual Animal Subject
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure the delivery pathway, select preclinical in-vivo species models, and titrate weight-adjusted dosage (mg/kg).
          </p>
        </div>

        {/* Live Dose Summary Tag */}
        <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-950/40 px-3.5 py-1.5 rounded-xl border border-brand-200 dark:border-brand-900/60">
          <Scale className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <div className="text-xs font-mono">
            <span className="text-zinc-500 dark:text-zinc-400">Total Dose: </span>
            <span className="font-bold text-brand-700 dark:text-brand-300">
              {totalDoseMg} mg
            </span>
            <span className="text-zinc-400 text-[10px] ml-1">
              ({doseMgKg} mg/kg × {currentAnimal.bodyWeightKg} kg)
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Route Selection
      ------------------------------------------------------------------------ */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
          Select Delivery Route & Vehicle
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DELIVERY_ROUTES.map((route) => {
            const Icon = route.icon;
            const isSelected = deliveryVehicle === route.id;
            return (
              <div
                key={route.id}
                onClick={() => setDeliveryVehicle(route.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-1 ring-brand-500/40 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant={isSelected ? 'primary' : 'secondary'} size="xs">
                    {route.badge}
                  </Badge>
                </div>

                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  {route.label}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {route.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Virtual Animal Subject Selection
      ------------------------------------------------------------------------ */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
          Choose Virtual Animal Subject Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(ANIMAL_SUBJECTS).map((animal) => {
            const isSelected = animalKey === animal.id;
            return (
              <div
                key={animal.id}
                onClick={() => setAnimalKey(animal.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-1 ring-brand-500/40 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl" role="img" aria-label={animal.name}>
                    {animal.icon}
                  </span>
                  {isSelected && (
                    <Badge variant="success" size="xs">
                      Active Model
                    </Badge>
                  )}
                </div>

                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                  {animal.name}
                </span>
                <span className="text-[10px] text-zinc-400 italic block">
                  {animal.species}
                </span>

                {/* Biological Parameters */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Body Weight:</span>
                    <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                      {animal.bodyWeightKg >= 1
                        ? `${animal.bodyWeightKg} kg`
                        : `${animal.bodyWeightKg * 1000} g`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Plasma Vol:</span>
                    <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                      {animal.plasmaVolumeMl} mL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Clearance:</span>
                    <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                      {animal.baselineClearanceLhKg} L/h/kg
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------------
          Dosage Configuration & Allometric Scaling Card
      ------------------------------------------------------------------------ */}
      <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-500" />
              Preclinical Dosage Configuration
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Specify dose normalized by animal body weight (mg/kg) to compute systemic clearance mass.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Dosage (mg/kg):
            </span>
            <input
              type="number"
              min="0.1"
              max="250"
              step="0.5"
              value={doseMgKg}
              onChange={(e) => setDoseMgKg(Math.max(0.1, Number(e.target.value) || 1))}
              className="w-20 px-2.5 py-1 text-sm font-mono font-bold text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Dosage Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.5"
            max="100"
            step="0.5"
            value={doseMgKg}
            onChange={(e) => setDoseMgKg(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>0.5 mg/kg (Micro-dose)</span>
            <span>25 mg/kg</span>
            <span>50 mg/kg</span>
            <span>100 mg/kg (High dose)</span>
          </div>
        </div>

        {/* Allometric Human Translation Card */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                FDA Interspecies Allometric Scaling (BSA)
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Calculated Human Equivalent Dose (HED) based on Km normalization:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono self-end sm:self-auto">
            <span className="text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {humanEquivalentDoseMgKg} mg/kg
            </span>
            <span className="text-zinc-400 text-[11px]">
              (~{humanTotalDoseMg} mg for 70kg human)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepAnimalSubject;
