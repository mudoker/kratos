import React, { useEffect, useState } from 'react';
import { LivingAnatomyModel } from '../anatomy/LivingAnatomyModel';
import { MetabolicTrajectoryChart } from './MetabolicTrajectoryChart';
import { BanisterModelChart } from './BanisterModelChart';
import { MacroHeatmap } from './MacroHeatmap';
import { InWorkoutCrucible } from '../workout/InWorkoutCrucible';
import { Activity, Battery, Flame, Zap, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/db/dexie';
import { calculateHRS, calculateACWR, getACWRStatus } from '../../lib/science/models';

export const ClinicalDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    hrs: 0,
    acwr: 1.0,
    status: { label: 'Optimal', color: 'text-green-400', alert: false },
    netCals: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const lastSleep = await db.sleep.orderBy('date').last();
      const lastNutrition = await db.nutrition.orderBy('timestamp').last();
      const biometrics = await db.biometrics.orderBy('date').toArray();
      const lastWeight = biometrics[biometrics.length - 1]?.weight || 88;

      // Mock tonnage for ACWR demonstration
      const acuteTonnage = [5000, 5200, 4800, 5500, 5100, 5300, 5400];
      const chronicTonnage = Array(28).fill(5000);
      const acwrValue = calculateACWR(acuteTonnage, chronicTonnage);

      if (lastSleep && lastNutrition) {
        const hrsValue = calculateHRS(lastSleep, lastNutrition, lastWeight, 2500, acwrValue);
        setStats({
          hrs: hrsValue,
          acwr: acwrValue,
          status: getACWRStatus(acwrValue),
          netCals: lastNutrition.kcals - 2800 // Mock TDEE
        });
      }
    };
    fetchDashboardStats();
  }, []);

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      {/* Top Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Readiness', value: stats.hrs, icon: <Zap size={16} />, color: stats.hrs < 60 ? 'text-red-400' : 'text-blue-400' },
          { label: 'ACWR Status', value: stats.status.label, icon: <Activity size={16} />, color: stats.status.color },
          { label: 'Net Calories', value: stats.netCals > 0 ? `+${stats.netCals}` : stats.netCals, icon: <Flame size={16} />, color: 'text-amber-400' },
          { label: 'System Fatigue', value: stats.acwr.toFixed(2), icon: <Battery size={16} />, color: stats.acwr > 1.3 ? 'text-red-400' : 'text-green-400' },
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

      {stats.status.alert && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center space-x-4 text-red-500">
           <AlertTriangle size={24} />
           <div>
             <h4 className="font-bold uppercase tracking-tight">Injury Danger Zone Detected</h4>
             <p className="text-sm">Your Acute:Chronic workload ratio is {stats.acwr.toFixed(2)}. Dropping volume by 20% is strongly suggested to prevent systemic failure.</p>
           </div>
        </div>
      )}
      
      {stats.hrs < 60 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center space-x-4 text-amber-500">
           <Zap size={24} className="animate-pulse" />
           <div>
             <h4 className="font-bold uppercase tracking-tight">System Recalibration: Active Recovery</h4>
             <p className="text-sm">Readiness Score is critical ({stats.hrs}). AI routes current block to Deload status. Skip heavy compounds today.</p>
           </div>
        </div>
      )}

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
