/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  MATERIALS, 
  calculateI, 
  calculateBendingStress, 
  calculateDeflection, 
  calculateAxleStress,
  calculateArea,
  calculateCompression,
  calculateTension,
  calculateShear,
  calculateBendingMoment,
  calculateTorsion,
  calculateImpactForce
} from './lib/physics';
import { SuitcaseVisualizer3D } from './components/SuitcaseVisualizer3D';
import { FormulaDashboard } from './components/FormulaDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, Ruler, Weight, Calculator, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'handle' | 'wheel'>('handle');
  const [materialKey, setMaterialKey] = useState<string>('aluminum');
  const [loadKg, setLoadKg] = useState(20);

  // Independent parameters for handle and wheel
  const [handleParams, setHandleParams] = useState({ L: 400, b: 25, h: 15 });
  const [wheelParams, setWheelParams] = useState({ L: 25, D: 10 });

  // New Impact parameters
  const [velocity, setVelocity] = useState(2); // m/s
  const [impactTime, setImpactTime] = useState(0.1); // s

  const material = MATERIALS[materialKey];
  const force = loadKg * 9.81; // Newtons

  const results = useMemo(() => {
    let I = 0;
    let A = 0;
    let stress = 0;
    let deflection = 0;
    let currentL = 0;
    let currentB = 0;
    let currentH = 0;

    if (activeTab === 'handle') {
      currentL = handleParams.L;
      currentB = handleParams.b;
      currentH = 15; 
      I = calculateI(currentB, currentH, 0, false, false);
      A = calculateArea(currentB, currentH, 0, false, false);
      stress = calculateBendingStress(force, currentL, I, currentH);
      deflection = calculateDeflection(force, currentL, material.elasticModulus, I);
    } else {
      currentL = wheelParams.L;
      currentB = wheelParams.D; 
      currentH = wheelParams.D;
      I = calculateI(currentB, currentH, 0, false, true);
      A = calculateArea(currentB, currentH, 0, false, true);
      const axleForce = force / 4;
      stress = calculateAxleStress(axleForce, currentL, I, currentB);
      deflection = calculateDeflection(axleForce, currentL * 2, material.elasticModulus, I);
    }

    // Calculate all 6 mechanics
    const compression = calculateCompression(force, A);
    const tension = calculateTension(force);
    const shear = calculateShear(force, A);
    const bendingMoment = calculateBendingMoment(force, currentL);
    const torsion = calculateTorsion(force, currentB / 2);
    const impactForce = calculateImpactForce(loadKg, velocity, impactTime);

    // --- ERGONOMIC SUITABILITY (User Comfort) ---
    let comfortScore = 0;
    let ergonomicStatus = "";
    
    if (activeTab === 'handle') {
      // 1. Length (L): Ergonomic height score (450-550mm is optimal)
      const lengthScore = currentL >= 420 && currentL <= 580 ? 40 : 15;
      
      // 2. Width (B): Shoulder alignment & Stability (160-220mm is optimal)
      const widthScore = currentB >= 160 && currentB <= 220 ? 30 : 10;
      
      // 3. Grip (H): Hand wrap & Comfort (18-28mm is optimal)
      const gripScore = currentH >= 15 && currentH <= 30 ? 30 : 10;
      
      comfortScore = lengthScore + widthScore + gripScore;

      if (currentL < 350) {
        ergonomicStatus = "長度過短：腰部需過度彎曲，極易疲勞";
      } else if (currentL > 650) {
        ergonomicStatus = "長度過長：拉送重心不穩，操控費力";
      } else if (currentH > 35) {
        ergonomicStatus = "規格過粗：超出人手握持極限，難以有效施力";
      } else if (currentH < 12) {
        ergonomicStatus = "規格過細：受力接觸壓強過大，握持痛感明顯";
      } else if (currentB > 250) {
        ergonomicStatus = "寬度過寬：超出雙肩舒適寬度，操控彆扭";
      } else if (currentB < 140) {
        ergonomicStatus = "寬度過窄：轉向力矩不足，操控靈活性差";
      } else {
        ergonomicStatus = "黃金比例：符合人體工學 (握持適中、操控輕鬆)";
      }
    } else {
      // Wheels: Diameter vs Surface
      const diameterScore = currentB >= 35 && currentB <= 55 ? 60 : 30;
      const lengthScore = currentL >= 20 && currentL <= 35 ? 40 : 20;
      comfortScore = diameterScore + lengthScore;

      if (currentB < 30) {
        ergonomicStatus = "輪徑太小：崎嶇路面通行困難";
      } else if (currentB > 60) {
        ergonomicStatus = "輪徑過大：重心過高增加翻倒風險";
      } else {
        ergonomicStatus = "規格適中：通行性與重心平衡";
      }
    }

    // --- REFINED MAX LOAD CALCULATION (considering multiple failure modes & Safety Factor) ---
    const c = currentH / 2;
    const SAFETY_FACTOR = 2.0; // Production safety margin
    
    // 1. Static Bending Limit
    const maxForceBending = (material.yieldStrength * 4 * I) / (currentL * c * SAFETY_FACTOR);
    
    // 2. Shear Limit (Approximated as 0.577 * Yield Stress)
    const shearYield = (material.yieldStrength * 0.577) / SAFETY_FACTOR;
    const maxForceShear = shearYield * A;

    // 3. Impact Limit (Dynamic Load)
    const fAllowable = Math.min(maxForceBending, maxForceShear);
    const maxLoadImpactKg = (fAllowable * impactTime) / velocity;

    // The true bottleneck for a professional product
    const maxForceFinal = Math.min(maxForceBending, maxForceShear);
    const maxLoadStaticKg = maxForceFinal / 9.81;
    
    // Total Max Load considers Impact as the "Real World" bottleneck
    // Capping at 150kg as real-world suitcase shells usually fail beyond this
    const rawMaxLoad = Math.min(maxLoadStaticKg, maxLoadImpactKg);
    const maxLoadKg = Math.min(rawMaxLoad, 150); 

    return { 
      I, A,
      stress, 
      deflection, 
      stressRatio: stress / material.yieldStrength,
      metrics: {
        compression,
        tension,
        shear,
        bendingMoment,
        torsion,
        impactForce,
        F: force,
        A, L: currentL, b: currentB, v: velocity, dt: impactTime, m: loadKg,
        yieldStrength: material.yieldStrength,
        maxLoadKg,
        stressRatio: stress / material.yieldStrength,
        deflection,
        materialName: material.name.split(' ')[0],
        comfortScore,
        ergonomicStatus
      },
      L: currentL,
      b: currentB,
      h: currentH
    };
  }, [activeTab, material, handleParams, wheelParams, force, loadKg, velocity, impactTime]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: CONTROLS */}
      <aside className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col z-20 shadow-2xl overflow-y-auto scrollbar-hide">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">
              Suitcase Lab<br />
              <span className="text-[10px] text-zinc-500 font-mono italic not-uppercase tracking-normal">Engineering Visualizer v4.0</span>
            </h1>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Analysis Toggle */}
          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">分析模式 // Mode</Label>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-zinc-800">
                <TabsTrigger value="handle" className="text-[11px] data-[state=active]:bg-zinc-800">拉桿 (Handle)</TabsTrigger>
                <TabsTrigger value="wheel" className="text-[11px] data-[state=active]:bg-zinc-800">輪軸 (Axle)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Materials */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2">
                <Box className="w-3 h-3 text-blue-400" /> 材質選擇 // Material
              </Label>
              <Select value={materialKey} onValueChange={setMaterialKey}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  {Object.entries(MATERIALS).map(([key, mat]) => (
                    <SelectItem key={key} value={key} className="text-xs">{mat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-zinc-800/50" />

            {/* Geometry */}
            <div className="space-y-5">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2">
                <Ruler className="w-3 h-3 text-emerald-400" /> 幾何參數 // Geo
              </Label>
              
              {activeTab === 'handle' ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400 font-mono uppercase">長度 (L)</span>
                      <span className="text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">{handleParams.L} mm</span>
                    </div>
                    <Slider value={[handleParams.L]} min={100} max={800} step={1} onValueChange={(v) => setHandleParams(p => ({...p, L: v[0]}))} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400 font-mono uppercase">寬度 (b)</span>
                      <span className="text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">{handleParams.b} mm</span>
                    </div>
                    <Slider value={[handleParams.b]} min={10} max={50} step={1} onValueChange={(v) => setHandleParams(p => ({...p, b: v[0]}))} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400 font-mono uppercase">軸長 (L)</span>
                      <span className="text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">{wheelParams.L} mm</span>
                    </div>
                    <Slider value={[wheelParams.L]} min={10} max={40} step={1} onValueChange={(v) => setWheelParams(p => ({...p, L: v[0]}))} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400 font-mono uppercase">直徑 (D)</span>
                      <span className="text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">{wheelParams.D} mm</span>
                    </div>
                    <Slider value={[wheelParams.D]} min={10} max={60} step={1} onValueChange={(v) => setWheelParams(p => ({...p, D: v[0]}))} />
                  </div>
                </>
              )}
            </div>

            <Separator className="bg-zinc-800/50" />

            {/* Environment */}
            <div className="space-y-5">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2">
                <Weight className="w-3 h-3 text-orange-400" /> 負重與環境 // Load
              </Label>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-mono uppercase">總承重 (m)</span>
                  <span className="text-orange-400 px-1.5 py-0.5 bg-orange-500/10 rounded">{loadKg} kg</span>
                </div>
                <Slider value={[loadKg]} min={2} max={40} step={1} onValueChange={(v) => setLoadKg(v[0])} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-mono uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 衝擊速度 (v)
                  </span>
                  <span className="text-zinc-300 px-1.5 py-0.5 bg-zinc-800 rounded">{velocity} m/s</span>
                </div>
                <Slider value={[velocity]} min={0.5} max={10} step={0.5} onValueChange={(v) => setVelocity(v[0])} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-mono uppercase">作用時間 (Δt)</span>
                  <span className="text-zinc-300 px-1.5 py-0.5 bg-zinc-800 rounded">{impactTime} s</span>
                </div>
                <Slider value={[impactTime]} min={0.01} max={0.5} step={0.01} onValueChange={(v) => setImpactTime(v[0])} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: 3D VIEW */}
      <main className="flex-1 relative bg-black flex flex-col items-center justify-center cursor-crosshair">
        <div className="absolute inset-0">
          <SuitcaseVisualizer3D
            type={activeTab}
            handleParams={{ ...handleParams, h: results.h }}
            wheelParams={wheelParams}
            deflection={results.deflection}
            stressRatio={results.stressRatio}
          />
        </div>

        {/* Global HUD elements */}
        <div className="absolute top-6 left-6 pointer-events-none z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full animate-pulse ${(results.stressRatio > 1 || results.deflection > 15 || results.metrics.comfortScore < 60) ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              {results.stressRatio > 1 ? '結構狀態: 超過負荷 (Danger)' : 
               (results.metrics.comfortScore < 60 ? '結構狀態: 人體工學不符 (UX Fail)' : 
               (results.deflection > 15 ? '結構狀態: 剛性不足 (Wobbly)' : 
               (results.stressRatio > 0.8 ? '結構狀態: 最適量產規格 (Optimal)' : '結構狀態: 安全 (Safe)')))}
            </span>
          </div>
        </div>

        {/* Footer info bar overlaps center main */}
        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end pointer-events-none z-10">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">Suitcase Physics Engine 4.0 // Core Matrix Active</p>
            <p className="text-[9px] text-zinc-700 italic">Engineering real-time stress analysis for structural integrity verification.</p>
          </div>
          <div className="flex gap-1">
            <div className="h-6 w-[2px] bg-zinc-800" />
            <div className="h-6 w-[2px] bg-zinc-800/50" />
            <div className="h-6 w-[2px] bg-zinc-800/20" />
          </div>
        </div>
      </main>

      {/* RIGHT COLUMN: FORMULA DASHBOARD */}
      <aside className="w-[340px] border-l border-zinc-800 bg-zinc-950 flex flex-col z-20 shadow-2xl overflow-hidden">
        <FormulaDashboard metrics={results.metrics} />
      </aside>
    </div>
  );
}
