/**
 * Engineering calculations for suitcase components
 */

export interface Material {
  name: string;
  elasticModulus: number; // GPa
  yieldStrength: number; // MPa
}

export const MATERIALS: Record<string, Material> = {
  aluminum: {
    name: "與鋁合金 6061-T6 (70 GPa)",
    elasticModulus: 70,
    yieldStrength: 275,
  },
  steel: {
    name: "不鏽鋼 AISI 304 (200 GPa)",
    elasticModulus: 200,
    yieldStrength: 505,
  },
  polycarbonate: {
    name: "聚碳酸酯 PC (2.4 GPa)",
    elasticModulus: 2.4,
    yieldStrength: 65,
  },
  wood: {
    name: "實木材 (硬木 12 GPa)",
    elasticModulus: 12,
    yieldStrength: 45,
  }
};

/**
 * Calculate Moment of Inertia (I) in mm^4
 */
export function calculateI(b: number, h: number, t?: number, isHollow: boolean = false, isCircular: boolean = false): number {
  if (isCircular) {
    const D = b;
    if (!isHollow) {
      return (Math.PI * Math.pow(D, 4)) / 64;
    } else {
      const wallT = t || 1.5;
      const d = D - 2 * wallT;
      if (d <= 0) return (Math.PI * Math.pow(D, 4)) / 64;
      return (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4))) / 64;
    }
  }

  if (!isHollow) {
    return (b * Math.pow(h, 3)) / 12;
  } else {
    const wallT = t || 1.5;
    const outerI = (b * Math.pow(h, 3)) / 12;
    const innerB = b - 2 * wallT;
    const innerH = h - 2 * wallT;
    if (innerB <= 0 || innerH <= 0) return outerI;
    const innerI = (innerB * Math.pow(innerH, 3)) / 12;
    return outerI - innerI;
  }
}

/**
 * Calculate Cross Sectional Area (A) in mm^2
 */
export function calculateArea(b: number, h: number, t?: number, isHollow: boolean = false, isCircular: boolean = false): number {
  if (isCircular) {
    const D = b;
    if (!isHollow) {
      return (Math.PI * Math.pow(D, 2)) / 4;
    } else {
      const wallT = t || 1.5;
      const d = D - 2 * wallT;
      if (d <= 0) return (Math.PI * Math.pow(D, 2)) / 4;
      return (Math.PI * (Math.pow(D, 2) - Math.pow(d, 2))) / 4;
    }
  }

  const outerArea = b * h;
  if (!isHollow) {
    return outerArea;
  } else {
    const wallT = t || 1.5;
    const innerB = b - 2 * wallT;
    const innerH = h - 2 * wallT;
    if (innerB <= 0 || innerH <= 0) return outerArea;
    const innerArea = innerB * innerH;
    return outerArea - innerArea;
  }
}

/**
 * Standard bending stress calculation
 */
export function calculateBendingStress(F: number, L: number, I: number, h: number): number {
  const M = (F * L) / 4;
  const c = h / 2;
  return (M * c) / I;
}

/**
 * Standard deflection calculation (mm)
 */
export function calculateDeflection(F: number, L: number, E: number, I: number): number {
  const E_mpa = E * 1000;
  return (F * Math.pow(L, 3)) / (48 * E_mpa * I);
}

/**
 * Cantilever bending stress (for axles)
 */
export function calculateAxleStress(F: number, L: number, I: number, h: number): number {
  const M = F * L;
  const c = h / 2;
  return (M * c) / I;
}

// --- SIX REQUESTED MECHANICS CALCULATIONS ---

/**
 * 1. Compression (P = F / A)
 */
export function calculateCompression(F: number, A: number): number {
  if (A <= 0) return 0;
  return F / A;
}

/**
 * 2. Tension (T = F)
 */
export function calculateTension(F: number): number {
  return F;
}

/**
 * 3. Shear (tau = V / A)
 */
export function calculateShear(V: number, A: number): number {
  if (A <= 0) return 0;
  return V / A;
}

/**
 * 4. Bending Moment (M = F * d)
 */
export function calculateBendingMoment(F: number, d: number): number {
  return F * d;
}

/**
 * 5. Torsion (T_torsion = F * r)
 */
export function calculateTorsion(F: number, r: number): number {
  return F * r;
}

/**
 * 6. Impact Force (F_impact = mv / delta_t)
 */
export function calculateImpactForce(m: number, v: number, dt: number): number {
  if (dt <= 0) return 0;
  return (m * v) / dt;
}
