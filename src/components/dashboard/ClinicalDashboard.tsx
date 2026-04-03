import React from 'react';
import { LivingAnatomyModel } from '../anatomy/LivingAnatomyModel';
import { MetabolicTrajectoryChart } from './MetabolicTrajectoryChart';
import { BanisterModelChart } from './BanisterModelChart';
import { MacroHeatmap } from './MacroHeatmap';
import { InWorkoutCrucible } from '../workout/InWorkoutCrucible';
import { Activity, Battery, Flame, Zap } from 'lucide-react';

export const ClinicalDashboard: React.FC = () => {
  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      {/* Top Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Readiness', value: '88', icon: <Zap size={16} />, color: 'text-blue-400' },
          { label: 'CNS Fatigue', value: 'Low', icon: <Battery size={16} />, color: 'text-green-400' },
          { label: 'Net Calories', value: '-350', icon: <Flame size={16} />, color: 'text-amber-400' },
          { label: 'SFR Status', value: 'Adaptive', icon: <Activity size={16} />, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{stat.label}</p>
              <p className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2 bg-white/5 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Living Model & Workout */}
        <div className="lg:col-span-4 space-y-8">
          <LivingAnatomyModel />
          <InWorkoutCrucible />
        </div>

        {/* Center/Right Column: Analytics */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MetabolicTrajectoryChart />
            <BanisterModelChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
                <MacroHeatmap />
             </div>
             <div className="bg-blue-600 rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                <div className="relative z-10">
                   <h4 className="text-lg font-bold uppercase tracking-tight">AI Strategy Insight</h4>
                   <p className="text-sm opacity-90 mt-2 leading-relaxed">
                     Based on 300kcal deficit and high volume, your quad progression will plateau in 4 days. Suggesting deload block.
                   </p>
                </div>
                <button className="relative z-10 mt-6 w-full bg-white text-blue-600 font-bold uppercase text-[10px] tracking-widest py-3 rounded-lg hover:bg-opacity-90 transition-all">
                   View Trajectory Oracle
                </button>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
