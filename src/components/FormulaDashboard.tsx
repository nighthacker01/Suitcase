import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FormulaProps {
  label: string;
  enLabel: string;
  formula: string;
  calc: string;
  result: string;
  unit: string;
  description: string;
}

const FormulaItem: React.FC<FormulaProps> = ({ label, enLabel, formula, calc, result, unit, description }) => (
  <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm overflow-hidden group hover:border-zinc-700 transition-colors">
    <CardHeader className="p-3 bg-zinc-800/20">
      <CardTitle className="text-[11px] font-bold flex justify-between items-center text-zinc-100 uppercase tracking-tighter">
        <span>{label} <span className="text-zinc-500 font-normal ml-1">({enLabel})</span></span>
        <span className="text-blue-400 font-mono text-[10px]">{formula}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 space-y-2">
      <div className="font-mono text-[10px] text-zinc-400 leading-relaxed">
        <p className="text-zinc-500 mb-1">即時算式：</p>
        <p className="text-zinc-200">{calc}</p>
        <div className="flex justify-between items-baseline mt-2">
          <span className="text-[9px] text-zinc-500 lowercase italic">{description}</span>
          <span className="text-blue-400 font-bold text-[12px]">
            {result} <span className="text-[9px] font-normal">{unit}</span>
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface Props {
  metrics: {
    compression: number;
    tension: number;
    shear: number;
    bendingMoment: number;
    torsion: number;
    impactForce: number;
    F: number;
    A: number;
    L: number;
    b: number;
    v: number;
    dt: number;
    m: number;
    yieldStrength: number;
    maxLoadKg: number;
    stressRatio: number;
    deflection: number;
    materialName: string;
    comfortScore: number;
    ergonomicStatus: string;
  };
}

export const FormulaDashboard: React.FC<Props> = ({ metrics }) => {
  const isOptimal = metrics.stressRatio >= 0.8 && metrics.stressRatio <= 0.98;
  const isDanger = metrics.stressRatio > 1.0;
  
  // Usability / Stability Logic
  const deflectionLimit = 15; 
  const isWobbly = metrics.deflection > deflectionLimit;
  const stabilityPercent = Math.max(0, 100 - (metrics.deflection / deflectionLimit) * 50);
  const isErgoFail = metrics.comfortScore < 60;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide pointer-events-auto bg-zinc-950">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-8 bg-blue-500 rounded-full" />
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">產品綜合適合度 // Product Suitability</h2>
      </div>

      {/* Product Goal Card */}
      <Card className={`border-2 transition-all duration-500 ${isOptimal && !isWobbly && !isErgoFail ? 'border-green-500/50 bg-green-500/5' : isDanger || isWobbly || isErgoFail ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">當前規格極限承重</p>
              <h3 className={`text-xl font-black ${isDanger ? 'text-red-500' : 'text-zinc-100'}`}>
                {metrics.maxLoadKg.toFixed(1)} <span className="text-sm font-normal">kg</span>
              </h3>
            </div>
            <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${isOptimal && !isWobbly && !isErgoFail ? 'bg-green-500 text-black' : (isDanger || isWobbly || isErgoFail) ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {isDanger ? '結構失效' : isErgoFail ? '高度不符' : isWobbly ? '穩定性不足' : isOptimal ? '量產推薦' : '強度冗餘'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">人體工學評分 (UX)</span>
              <span className={`font-mono font-bold ${isErgoFail ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.comfortScore}%
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">生產安全係數 (SF)</span>
              <span className="text-zinc-300 font-mono">2.0x (工業標準)</span>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-2">
            <p className={`text-[10px] font-bold ${isErgoFail ? 'text-red-400' : 'text-blue-400'}`}>
              臨床評語：{metrics.ergonomicStatus}
            </p>
            <p className="text-[9px] text-zinc-400 leading-normal">
              {isErgoFail ? `筆記：即便是結構強度極高的規格，若管徑(H)超過人手握持範圍或寬度(B)不符肩寬，使用者將難以有效施力，長期使用會造成手腕與雙肩的勞損。產品力學不應犧牲使用者的輕鬆感。` : 
               isOptimal ? `分析：目前尺寸在『拖拉力矩』、『握持手感』與『結構安全性』間達到量產平衡，施力輕鬆且穩定。` : 
               `分析：尺寸偏離人體平均值，建議調整長/寬/厚度以優化使用者的操控體驗。`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mt-6 mb-2">
        <div className="h-1 w-4 bg-zinc-700 rounded-full" />
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">詳細力學常數 // Mechanics</h2>
      </div>

      <FormulaItem
        label="壓力"
        enLabel="Compression"
        formula="P = F / A"
        calc={`${metrics.F.toFixed(1)} N / ${metrics.A.toFixed(1)} mm²`}
        result={metrics.compression.toFixed(2)}
        unit="MPa"
        description="物體受垂直於表面的力作用"
      />

      <FormulaItem
        label="拉力"
        enLabel="Tension"
        formula="T = F"
        calc={`${metrics.F.toFixed(1)} N`}
        result={metrics.tension.toFixed(1)}
        unit="N"
        description="物體受沿軸線方向向外拉伸的力"
      />

      <FormulaItem
        label="剪力"
        enLabel="Shear"
        formula="τ = V / A"
        calc={`${metrics.F.toFixed(1)} N / ${metrics.A.toFixed(1)} mm²`}
        result={metrics.shear.toFixed(2)}
        unit="MPa"
        description="物體兩部分沿平行表面方向錯動的力"
      />

      <FormulaItem
        label="彎曲力"
        enLabel="Bending"
        formula="M = F · d"
        calc={`${metrics.F.toFixed(1)} N · ${metrics.L} mm`}
        result={(metrics.bendingMoment / 1000).toFixed(2)}
        unit="N·m"
        description="導致物體彎曲的力矩"
      />

      <FormulaItem
        label="扭矩力"
        enLabel="Torsion"
        formula="T = F · r"
        calc={`${metrics.F.toFixed(1)} N · ${(metrics.b / 2).toFixed(1)} mm`}
        result={(metrics.torsion / 1000).toFixed(2)}
        unit="N·m"
        description="導致物體繞軸旋轉的力矩"
      />

      <FormulaItem
        label="衝擊力"
        enLabel="Impact"
        formula="Fi ≈ mv / Δt"
        calc={`(${metrics.m} kg · ${metrics.v} m/s) / ${metrics.dt} s`}
        result={metrics.impactForce.toFixed(2)}
        unit="N"
        description="短時間內施加的巨大作用力"
      />
    </div>
  );
};
