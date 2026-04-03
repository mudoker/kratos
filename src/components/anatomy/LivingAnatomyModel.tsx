import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Mock SFR data (0 to 1, where 1 is MAV achieved, >1 is overreached)
interface MuscleState {
  id: string;
  name: string;
  sfr: number; // 0 (recovered) to 1 (full volume)
  status: 'Recovered' | 'Adaptive' | 'Overreached';
}

const MUSCLE_GROUPS: MuscleState[] = [
  { id: 'chest', name: 'Pectorals', sfr: 0.8, status: 'Adaptive' },
  { id: 'quads', name: 'Quadriceps', sfr: 1.2, status: 'Overreached' },
  { id: 'back', name: 'Latissimus Dorsi', sfr: 0.2, status: 'Recovered' },
  { id: 'shoulders', name: 'Deltoids', sfr: 0.5, status: 'Recovered' },
  { id: 'arms', name: 'Biceps/Triceps', sfr: 0.9, status: 'Adaptive' },
];

const getColor = (sfr: number) => {
  if (sfr < 0.4) return '#3b82f6'; // Bright Blue (Recovered)
  if (sfr <= 1.0) return '#f59e0b'; // Glowing Amber (MAV)
  return '#ef4444'; // Deep Red (MRV Exceeded)
};

export const LivingAnatomyModel: React.FC = () => {
  return (
    <div className="relative bg-black/40 border border-white/5 rounded-2xl p-6 h-full flex flex-col items-center">
      <div className="absolute top-4 left-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Biomechanical Heatmap</h3>
        <p className="text-[10px] text-muted-foreground uppercase font-medium">Interpolating SFR Landmarks</p>
      </div>

      <div className="flex-1 w-full max-w-[200px] mt-8 relative">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          {/* Head */}
          <circle cx="50" cy="20" r="15" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          
          {/* Torso/Chest */}
          <motion.path
            d="M35 40 L65 40 L70 80 L30 80 Z"
            fill={getColor(MUSCLE_GROUPS.find(m => m.id === 'chest')?.sfr || 0)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="cursor-help transition-colors duration-1000"
          />

          {/* Shoulders */}
          <motion.circle cx="30" cy="45" r="8" fill={getColor(MUSCLE_GROUPS.find(m => m.id === 'shoulders')?.sfr || 0)} />
          <motion.circle cx="70" cy="45" r="8" fill={getColor(MUSCLE_GROUPS.find(m => m.id === 'shoulders')?.sfr || 0)} />

          {/* Arms */}
          <motion.path
            d="M25 55 L15 100"
            stroke={getColor(MUSCLE_GROUPS.find(m => m.id === 'arms')?.sfr || 0)}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M75 55 L85 100"
            stroke={getColor(MUSCLE_GROUPS.find(m => m.id === 'arms')?.sfr || 0)}
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Quads */}
          <motion.path
            d="M35 120 L48 180"
            stroke={getColor(MUSCLE_GROUPS.find(m => m.id === 'quads')?.sfr || 0)}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <motion.path
            d="M65 120 L52 180"
            stroke={getColor(MUSCLE_GROUPS.find(m => m.id === 'quads')?.sfr || 0)}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>

        {/* Floating Tooltips (Simplified) */}
        {MUSCLE_GROUPS.map((muscle, i) => (
          <div 
            key={muscle.id}
            className="absolute hidden lg:block"
            style={{ 
              top: `${20 + i * 15}%`, 
              right: i % 2 === 0 ? '-80px' : 'auto',
              left: i % 2 !== 0 ? '-80px' : 'auto'
            }}
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 backdrop-blur-md">
              <p className="text-[10px] font-bold text-white uppercase">{muscle.name}</p>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getColor(muscle.sfr) }} 
                />
                <span className="text-[9px] text-muted-foreground uppercase">{muscle.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 w-full border-t border-white/5 pt-4">
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground uppercase font-bold">CNS Recovery</p>
          <p className="text-sm font-mono text-blue-400">92%</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground uppercase font-bold">MEV/MAV Range</p>
          <p className="text-sm font-mono text-amber-400">Optimal</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground uppercase font-bold">Injury Risk</p>
          <p className="text-sm font-mono text-green-400">Low</p>
        </div>
      </div>
    </div>
  );
};
