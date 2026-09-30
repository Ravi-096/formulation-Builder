/**
 * Virtual Pharmacokinetics (PK / ADME) Simulation Engine
 * 
 * Implements a high-precision 2-compartment open pharmacokinetic model
 * with first-order absorption (oral) and linear elimination using
 * 4th-order Runge-Kutta (RK4) numerical ODE integration.
 */

// ==============================================================================
// 1. Pre-clinical Animal Physiological Baselines
// ==============================================================================
export const ANIMAL_SUBJECTS = {
  mouse: {
    id: 'mouse',
    name: 'Mouse',
    species: 'Mus musculus',
    icon: '🐭',
    bodyWeightKg: 0.025, // 25 g
    bloodVolumeMl: 2.0, // 80 mL/kg
    plasmaVolumeMl: 1.2, // 48 mL/kg
    cardiacOutputMlMin: 14.0,
    hepaticFlowMlMin: 2.2,
    renalGfrMlMin: 0.25,
    baselineClearanceLhKg: 0.22,
    hematocritPct: 45,
    description: 'Standard CD-1 / C57BL/6 rodent model for early exploratory screening.',
  },
  rat: {
    id: 'rat',
    name: 'Rat',
    species: 'Rattus norvegicus',
    icon: '🐀',
    bodyWeightKg: 0.25, // 250 g
    bloodVolumeMl: 16.0, // 64 mL/kg
    plasmaVolumeMl: 10.0, // 40 mL/kg
    cardiacOutputMlMin: 85.0,
    hepaticFlowMlMin: 14.0,
    renalGfrMlMin: 2.0,
    baselineClearanceLhKg: 0.35,
    hematocritPct: 43,
    description: 'Sprague-Dawley / Wistar model for bioavailability, oral PK, and toxicity profiling.',
  },
  dog: {
    id: 'dog',
    name: 'Beagle Dog',
    species: 'Canis familiaris',
    icon: '🐕',
    bodyWeightKg: 10.0, // 10 kg
    bloodVolumeMl: 850.0, // 85 mL/kg
    plasmaVolumeMl: 500.0, // 50 mL/kg
    cardiacOutputMlMin: 1500.0,
    hepaticFlowMlMin: 310.0,
    renalGfrMlMin: 35.0,
    baselineClearanceLhKg: 0.28,
    hematocritPct: 42,
    description: 'Non-rodent standard for gastrointestinal transit and target therapeutic index scaling.',
  },
  monkey: {
    id: 'monkey',
    name: 'Cynomolgus Monkey',
    species: 'Macaca fascicularis',
    icon: '🐒',
    bodyWeightKg: 3.5, // 3.5 kg
    bloodVolumeMl: 245.0, // 70 mL/kg
    plasmaVolumeMl: 145.0, // 41 mL/kg
    cardiacOutputMlMin: 650.0,
    hepaticFlowMlMin: 125.0,
    renalGfrMlMin: 12.0,
    baselineClearanceLhKg: 0.40,
    hematocritPct: 40,
    description: 'Non-human primate model closely mirroring human hepatic CYP metabolism and distribution.',
  },
};

// ==============================================================================
// 2. Derive Pharmacokinetic Rate Constants from Chemistry & Animal Model
// ==============================================================================
export const calculatePkParameters = ({
  apiProps,
  bcsClass = 'BCS Class I',
  deliveryVehicle = 'oral_tablet',
  route = 'oral',
  doseMgKg = 10,
  animalKey = 'rat',
  excipients = [],
}) => {
  const animal = ANIMAL_SUBJECTS[animalKey] || ANIMAL_SUBJECTS.rat;
  const bw = animal.bodyWeightKg;

  // 1. Total absolute dose administered (mg)
  const totalDoseMg = Number(doseMgKg) * bw;

  // 2. Extract physicochemical indicators
  const mw = apiProps?.molecular_weight || 300.0;
  const logp = apiProps?.logp !== undefined ? apiProps.logp : 2.0;
  const tpsa = apiProps?.tpsa || 60.0;

  // 3. Central & Peripheral Volumes of Distribution (L)
  // Base plasma volume in Liters:
  const vPlasmaL = animal.plasmaVolumeMl / 1000.0;
  
  // Apparent distribution volume factor driven by lipophilicity (higher LogP -> tissue penetration)
  const lipoDistributionFactor = 1.0 + Math.max(0.1, logp * 0.45);
  const v1 = Math.max(vPlasmaL, vPlasmaL * lipoDistributionFactor); // Central compartment volume (L)
  const v2 = v1 * (1.2 + Math.max(0.2, (logp - 1.0) * 0.3)); // Peripheral tissue volume (L)

  // 4. Systemic Clearance (L/h)
  // Allometric scaling: CL = CL_baseline * (BW / 0.25)^0.75
  const baselineCl = animal.baselineClearanceLhKg * bw;
  // Molecular weight and lipophilic metabolic clearance adjustment
  const mwFactor = Math.min(1.5, Math.max(0.6, Math.sqrt(350 / mw)));
  const cl = Math.max(0.005, baselineCl * mwFactor);

  // 5. Inter-compartmental distribution rate constants (1/h)
  const k10 = cl / v1; // Elimination rate constant from central compartment
  const k12 = 0.45 + (logp > 2.5 ? 0.25 : 0.05); // Central to peripheral
  const k21 = (k12 * v1) / v2; // Peripheral to central

  // 6. Absorption Rate Constant (ka in 1/h) and Bioavailability (F in [0, 1])
  let ka = 1.2; // default 1/h
  let fBio = 1.0;

  if (route === 'iv' || deliveryVehicle === 'iv_infusion') {
    ka = 0.0;
    fBio = 1.0;
  } else {
    // Oral vehicle absorption modulation
    if (deliveryVehicle === 'oral_solution') {
      ka = 2.2; // rapid liquid absorption
    } else if (deliveryVehicle === 'oral_tablet') {
      ka = 0.85; // dissolution rate-limited
    } else if (deliveryVehicle === 'nanoparticle_lipid' || deliveryVehicle === 'liposome') {
      ka = 1.5; // enhanced lymphatic/endothelial uptake
    }

    // Baseline F based on BCS classification
    const bcsUpper = String(bcsClass).toUpperCase();
    if (bcsUpper.includes('CLASS I')) {
      fBio = 0.88;
    } else if (bcsUpper.includes('CLASS II')) {
      fBio = 0.35; // solubility limited
    } else if (bcsUpper.includes('CLASS III')) {
      fBio = 0.42; // permeability limited
    } else if (bcsUpper.includes('CLASS IV')) {
      fBio = 0.18; // challenging
    } else {
      fBio = 0.65;
    }

    // Excipient solubilization & absorption boosters (e.g. TPGS, Polysorbate 80, SLS, PEG)
    const excipientBoost = excipients.reduce((acc, exc) => {
      const name = (exc.excipient_name || '').toLowerCase();
      const conc = Number(exc.concentration_pct) || 0;
      if (name.includes('tpgs') || name.includes('polysorbate') || name.includes('phospholipon')) {
        return acc + Math.min(0.20, conc * 0.025);
      }
      if (name.includes('sodium lauryl sulfate') || name.includes('sls') || name.includes('croscarmellose')) {
        return acc + Math.min(0.12, conc * 0.015);
      }
      return acc;
    }, 0);

    fBio = Math.min(0.98, Math.max(0.10, fBio + excipientBoost));
  }

  // 7. Establish dynamic Therapeutic Window (MEC and MTC in ug/mL or mg/L)
  // Scaling relative to total dose and V1
  const baselineNominalCp = (totalDoseMg * fBio) / v1;
  const mec = Math.max(0.5, +(baselineNominalCp * 0.22).toFixed(2));
  const mtc = Math.max(mec * 2.8, +(baselineNominalCp * 1.65).toFixed(2));

  return {
    animal,
    bw,
    totalDoseMg,
    v1,
    v2,
    cl,
    k10,
    k12,
    k21,
    ka,
    fBio,
    mec,
    mtc,
  };
};

// ==============================================================================
// 3. 4th-Order Runge-Kutta (RK4) Numerical ODE Solver
// ==============================================================================
export const simulatePkCurve = ({
  params,
  hours = 48,
  numPoints = 180,
  route = 'oral',
}) => {
  const { totalDoseMg, v1, k10, k12, k21, ka, fBio, mec, mtc } = params;

  // State Vector y = [A_gut, A1, A2] (Amounts in mg)
  let y = route === 'iv' ? [0.0, totalDoseMg, 0.0] : [totalDoseMg, 0.0, 0.0];

  const tStart = 0;
  const tEnd = hours;
  const dt = (tEnd - tStart) / numPoints;

  // System of differential equations:
  // dA_gut/dt = -ka * A_gut
  // dA1/dt    = ka * F * A_gut - (k10 + k12) * A1 + k21 * A2
  // dA2/dt    = k12 * A1 - k21 * A2
  const derivatives = (t, state) => {
    const [aGut, a1, a2] = state;
    const dAGut = route === 'iv' ? 0.0 : -ka * aGut;
    const dA1 = (route === 'iv' ? 0.0 : ka * fBio * aGut) - (k10 + k12) * a1 + (k21 * a2);
    const dA2 = (k12 * a1) - (k21 * a2);
    return [dAGut, dA1, dA2];
  };

  const points = [];
  let t = tStart;

  for (let i = 0; i <= numPoints; i++) {
    // Current plasma concentration: Cp = A1 / V1 (mg/L == ug/mL)
    const cp = Math.max(0, y[1] / v1);
    const cTissue = Math.max(0, y[2] / params.v2);

    points.push({
      time: +t.toFixed(2),
      plasmaConc: +cp.toFixed(3),
      tissueConc: +cTissue.toFixed(3),
      gutRemaining: +Math.max(0, y[0]).toFixed(3),
      mec,
      mtc,
    });

    if (i === numPoints) break;

    // Runge-Kutta 4th Order Step:
    const k1 = derivatives(t, y);
    const yK1 = y.map((val, idx) => val + 0.5 * dt * k1[idx]);

    const k2 = derivatives(t + 0.5 * dt, yK1);
    const yK2 = y.map((val, idx) => val + 0.5 * dt * k2[idx]);

    const k3 = derivatives(t + 0.5 * dt, yK2);
    const yK3 = y.map((val, idx) => val + dt * k3[idx]);

    const k4 = derivatives(t + dt, yK3);

    y = y.map((val, idx) => val + (dt / 6.0) * (k1[idx] + 2 * k2[idx] + 2 * k3[idx] + k4[idx]));
    t += dt;
  }

  // ============================================================================
  // 4. Calculate Key Pharmacokinetic Metrics & AUC (Trapezoidal Rule)
  // ============================================================================
  let cMax = 0;
  let tMax = 0;
  let auc = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.plasmaConc > cMax) {
      cMax = pt.plasmaConc;
      tMax = pt.time;
    }

    if (i > 0) {
      const prev = points[i - 1];
      const deltaT = pt.time - prev.time;
      auc += 0.5 * (prev.plasmaConc + pt.plasmaConc) * deltaT;
    }
  }

  // Terminal elimination rate constant (lambda_z) and half-life (t1/2)
  const sumK = k10 + k12 + k21;
  const discriminant = Math.max(0, sumK * sumK - 4 * k10 * k21);
  const lambdaZ = 0.5 * (sumK - Math.sqrt(discriminant));
  const tHalf = lambdaZ > 0.0001 ? Math.log(2) / lambdaZ : Math.log(2) / k10;

  // Time in therapeutic window evaluation
  let pointsInWindow = 0;
  let pointsAboveMtc = 0;
  points.forEach((p) => {
    if (p.plasmaConc >= mec && p.plasmaConc <= mtc) pointsInWindow++;
    if (p.plasmaConc > mtc) pointsAboveMtc++;
  });

  const pctInWindow = Math.round((pointsInWindow / points.length) * 100);
  const isToxic = cMax > mtc;
  const isSubtherapeutic = cMax < mec;

  return {
    timeSeries: points,
    metrics: {
      cMax: +cMax.toFixed(2),
      tMax: +tMax.toFixed(2),
      auc: +auc.toFixed(1),
      tHalf: +tHalf.toFixed(2),
      bioavailabilityPct: Math.round(fBio * 100),
      clearance: +params.cl.toFixed(3),
      volumeDistribution: +params.v1.toFixed(3),
      totalDoseMg: +params.totalDoseMg.toFixed(2),
      mec: +mec.toFixed(2),
      mtc: +mtc.toFixed(2),
      pctInWindow,
      isToxic,
      isSubtherapeutic,
    },
  };
};
