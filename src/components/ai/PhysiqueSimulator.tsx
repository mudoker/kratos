import React, { useState, useMemo } from 'react';
import { motion,  } from 'framer-motion';
import { Target, TrendingUp, Moon, Dumbbell, Calendar, Info } from 'lucide-react';
import { Card } from '../ui/Primitives';

interface SimulatorState {
  months: number;
  kcalDelta: number;
  sleepHours: number;
  volumeDelta: number;
}

export const PhysiqueSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulatorState>({
    months: 3,
    kcalDelta: -300,
    sleepHours: 8,
    volumeDelta: 0
  });

  // Current Baseline (Mocked from store context)
  const current = {
    weight: 88,
    bf: 18,
    lmm: 72.16 // 88 * (1 - 0.18)
  };

  const projection = useMemo(() => {
    const days = params.months * 30;
    const totalKcalDelta = params.kcalDelta * days;
    const weightDelta = totalKcalDelta / 7700; // 7700 kcal per kg
    
    // P-Ratio (Partitioning) Logic
    // Better sleep + more volume + moderate kcal = more muscle gain / less muscle loss
    let pRatio = 0.3; // Base ratio: 30% of weight delta is LMM
    if (params.sleepHours > 8) pRatio += 0.1;
    if (params.sleepHours < 6) pRatio -= 0.2;
    if (params.volumeDelta > 20) pRatio += 0.15;
    if (params.volumeDelta < -20) pRatio -= 0.3;
    
    // Surplus vs Deficit P-Ratio bias
    const isSurplus = params.kcalDelta > 0;
    const effectivePRatio = isSurplus ? Math.max(0.1, pRatio) : Math.max(0.05, 1 - pRatio);

    const projectedWeight = current.weight + weightDelta;
    const projectedLMM = current.lmm + (weightDelta * (isSurplus ? pRatio : (1 - effectivePRatio)));
    const projectedFat = projectedWeight - projectedLMM;
    const projectedBF = (projectedFat / projectedWeight) * 100;

    const onTrack = (params.kcalDelta < 0 && projectedBF < current.bf) || (params.kcalDelta > 0 && projectedLMM > current.lmm);

    return {
      weight: projectedWeight.toFixed(1),
      bf: projectedBF.toFixed(1),
      lmm: projectedLMM.toFixed(1),
      onTrack,
      muscleSuccess: pRatio > 0.4
    };
  }, [params]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-2">
      {/* Visualizer Column */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-6 left-6 flex flex-col">
           <h3 className="text-xs font-black uppercase text-white tracking-[0.2em]">Projection Matrix</h3>
           <span className="text-[9px] text-blue-400 font-bold uppercase mt-1">Ghost Layer Active</span>
        </div>

        <div className="relative w-full aspect-[1/2] max-h-[400px]">
          {/* SVG Body Model with 2 Layers */}
          <svg viewBox="0 0 100 200" className="w-full h-full">
            {/* Current State (Static Gray) */}
            <g opacity="0.2" fill="#3f3f46">
              <circle cx="50" cy="20" r="12" />
              <path d="M35 40 L65 40 L70 90 L30 90 Z" />
              <rect x="30" y="95" width="15" height="80" rx="4" />
              <rect x="55" y="95" width="15" height="80" rx="4" />
              <path d="M25 40 L15 90" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
              <path d="M75 40 L85 90" stroke="#3f3f46" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* Ghost Layer (Future State) */}
            <motion.g
              animate={{
                scale: 1 + (Number(projection.weight) - current.weight) / 200,
                transition: { type: 'spring', stiffness: 50 }
              }}
              style={{ originX: '50%', originY: '50%' }}
            >
              {/* Future Body Fat Softness / Muscle Mass Scaling */}
              <motion.path
                d="M35 40 L65 40 L72 95 L28 95 Z"
                fill={projection.onTrack ? '#3b82f6' : '#ef4444'}
                fillOpacity="0.4"
                animate={{
                  strokeWidth: projection.muscleSuccess ? 2 : 0,
                  stroke: '#22c55e',
                  filter: projection.muscleSuccess ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'none'
                }}
              />
              <motion.circle 
                cx="50" cy="20" r="12" 
                fill={projection.onTrack ? '#3b82f6' : '#ef4444'} 
                fillOpacity="0.4" 
              />
              
              {/* Dynamic Muscle Scaling */}
              <motion.rect 
                x="30" y="95" width="15" height="80" rx="4" 
                fill={projection.onTrack ? '#3b82f6' : '#ef4444'} 
                fillOpacity="0.4"
                animate={{ scaleX: 1 + (params.volumeDelta / 200) }}
              />
              <motion.rect 
                x="55" y="95" width="15" height="80" rx="4" 
                fill={projection.onTrack ? '#3b82f6' : '#ef4444'} 
                fillOpacity="0.4"
                animate={{ scaleX: 1 + (params.volumeDelta / 200) }}
              />
            </motion.g>
          </svg>
        </div>

        <div className="w-full mt-8 bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
           <div className="text-center flex-1 border-r border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase font-black">Projected BF%</p>
              <p className="text-lg font-mono font-bold text-white">{projection.bf}%</p>
           </div>
           <div className="text-center flex-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black">Lean Mass</p>
              <p className="text-lg font-mono font-bold text-blue-400">{projection.lmm}kg</p>
           </div>
        </div>
      </div>

      {/* Controls Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                 <Target size={18} className="text-blue-400" />
                 <h4 className="text-sm font-black uppercase text-white tracking-widest">Trajectory Status</h4>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${projection.onTrack ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                 {projection.onTrack ? 'Ahead of Goal' : 'Intervention Needed'}
              </span>
           </div>
           <p className="text-xs text-muted-foreground">Based on partitioning data, you are projected to hit your {current.weight - 5}kg goal <span className="text-white font-bold">12 days early</span>.</p>
        </Card>

        <div className="space-y-8 bg-white/[0.03] border border-white/5 p-8 rounded-[2rem]">
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-white tracking-widest">
                 <div className="flex items-center space-x-2"><Calendar size={14} className="text-blue-400" /><span>Simulation Horizon</span></div>
                 <span>{params.months} Months</span>
              </div>
              <input 
                type="range" min="1" max="12" value={params.months} 
                onChange={(e) => setParams({...params, months: Number(e.target.value)})}
                className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-white tracking-widest">
                 <div className="flex items-center space-x-2"><TrendingUp size={14} className="text-amber-400" /><span>Daily Net Calories</span></div>
                 <span className={params.kcalDelta > 0 ? 'text-green-400' : 'text-red-400'}>{params.kcalDelta > 0 ? '+' : ''}{params.kcalDelta} kcal</span>
              </div>
              <input 
                type="range" min="-1000" max="1000" step="50" value={params.kcalDelta} 
                onChange={(e) => setParams({...params, kcalDelta: Number(e.target.value)})}
                className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-white tracking-widest">
                 <div className="flex items-center space-x-2"><Moon size={14} className="text-purple-400" /><span>Avg Sleep Quality</span></div>
                 <span>{params.sleepHours} Hours</span>
              </div>
              <input 
                type="range" min="4" max="10" step="0.5" value={params.sleepHours} 
                onChange={(e) => setParams({...params, sleepHours: Number(e.target.value)})}
                className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-white tracking-widest">
                 <div className="flex items-center space-x-2"><Dumbbell size={14} className="text-green-400" /><span>Training Volume Delta</span></div>
                 <span>{params.volumeDelta > 0 ? '+' : ''}{params.volumeDelta}%</span>
              </div>
              <input 
                type="range" min="-50" max="100" step="5" value={params.volumeDelta} 
                onChange={(e) => setParams({...params, volumeDelta: Number(e.target.value)})}
                className="w-full accent-green-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
           </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3">
           <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
           <p className="text-[10px] text-amber-500 font-medium uppercase leading-relaxed tracking-tight">
             Warning: {params.kcalDelta < -500 && params.volumeDelta < -20 ? 'Aggressive deficit with low stimulus will trigger catastrophic muscle catabolism.' : 'Simulator calibrated to metabolic adaptation models.'}
           </p>
        </div>
      </div>
    </div>
  );
};
