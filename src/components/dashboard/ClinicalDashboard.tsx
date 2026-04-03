import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LivingAnatomyModel } from '../anatomy/LivingAnatomyModel';
import { MetabolicTrajectoryChart } from './MetabolicTrajectoryChart';
import { BanisterModelChart } from './BanisterModelChart';
import { SymmetryRadarChart } from './SymmetryRadarChart';
import { MacroHeatmap } from './MacroHeatmap';
import { SportsScienceFeed } from './SportsScienceFeed';
import { InWorkoutCrucible } from '../workout/InWorkoutCrucible';
import { RecoveryProtocolOverlay } from '../ai/RecoveryProtocolOverlay';
import { Activity, Battery, Flame, Zap, Maximize2, X } from 'lucide-react';
import { db } from '../../lib/db/dexie';
import { calculateHRS, calculateACWR, getACWRStatus, calculateDailyTonnage } from '../../lib/science/models';
import { Sparkline } from '../ui/Sparkline';
import { useAgenticOS } from '../../hooks/useAgenticOS';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Button, Card } from '../ui/Primitives';

export const ClinicalDashboard: React.FC = React.memo(() => {
  const [stats, setStats] = useState({
    hrs: 0,
    acwr: 1.0,
    status: { label: 'Optimal', color: 'text-green-400', alert: false },
    netCals: 0,
    trends: {
      hrs: [70, 70, 70, 70, 70, 70, 70] as number[],
      cals: [2500, 2500, 2500, 2500, 2500, 2500, 2500] as number[],
      fatigue: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] as number[]
    }
  });
  
  const [isRecoveryOpen, setRecoveryOpen] = useState(false);
  const [isWorkoutExpanded, setWorkoutExpanded] = useState(false);

  useAgenticOS(stats.hrs);

  useEffect(() => {
    if (stats.hrs > 0 && stats.hrs < 60) setRecoveryOpen(true);
  }, [stats.hrs]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const now = new Date();
        const acuteThreshold = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const chronicThreshold = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));

        const workouts = await db.workouts.where('date').above(chronicThreshold).toArray();
        const dailyTonnages: Record<string, number> = {};
        workouts.forEach(w => {
           const dateStr = w.date.toISOString().split('T')[0];
           dailyTonnages[dateStr] = (dailyTonnages[dateStr] || 0) + calculateDailyTonnage(w);
        });

        const acuteTonnages = Object.keys(dailyTonnages)
          .filter(d => new Date(d) >= acuteThreshold)
          .map(d => dailyTonnages[d]);
        const chronicTonnages = Object.values(dailyTonnages);
        
        const acwrValue = calculateACWR(acuteTonnages, chronicTonnages);

        const lastSleep = await db.sleep.orderBy('date').last();
        const lastNutrition = await db.nutrition.orderBy('timestamp').last();
        const biometrics = await db.biometrics.orderBy('date').toArray();
        const lastWeight = biometrics[biometrics.length - 1]?.weight || 88;

        const last7DaysSleep = await db.sleep.where('date').above(acuteThreshold.toISOString().split('T')[0]).toArray();
        const last7DaysNutrition = await db.nutrition.where('timestamp').above(acuteThreshold).toArray();
        
        const hrsTrend = last7DaysSleep.map((s, i) => {
           const n = last7DaysNutrition[i] || { kcals: 2500, protein: 160 };
           return calculateHRS(s, n as any, lastWeight, 2500, 1.0);
        });

        if (lastSleep && lastNutrition) {
          const hrsValue = calculateHRS(lastSleep, lastNutrition, lastWeight, 2500, acwrValue);
          setStats({
            hrs: hrsValue,
            acwr: acwrValue,
            status: getACWRStatus(acwrValue),
            netCals: lastNutrition.kcals - 2800,
            trends: {
              hrs: hrsTrend.length ? hrsTrend : [70, 70, 70],
              cals: last7DaysNutrition.map(n => n.kcals),
              fatigue: acuteTonnages.length ? acuteTonnages.map(t => t / 5000) : [1.0, 1.0, 1.0]
            }
          });
        }
      } catch (err) {
        console.error("Dexie Query Failed:", err);
      }
    };
    fetchDashboardStats();
  }, []);

  const memoizedStats = useMemo(() => [
    { label: 'Readiness', value: stats.hrs, icon: <Zap size={16} />, color: stats.hrs < 60 ? 'text-red-400' : 'text-blue-400', trend: stats.trends.hrs },
    { label: 'ACWR Status', value: stats.status.label, icon: <Activity size={16} />, color: stats.status.color, trend: stats.trends.fatigue },
    { label: 'Net Calories', value: stats.netCals > 0 ? `+${stats.netCals}` : stats.netCals, icon: <Flame size={16} />, color: 'text-amber-400', trend: stats.trends.cals },
    { label: 'System Fatigue', value: stats.acwr.toFixed(2), icon: <Battery size={16} />, color: stats.acwr > 1.3 ? 'text-red-400' : 'text-green-400', trend: stats.trends.fatigue },
  ], [stats]);

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto relative">
      <RecoveryProtocolOverlay isOpen={isRecoveryOpen} hrs={stats.hrs} onClose={() => setRecoveryOpen(false)} />

      {/* Top Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {memoizedStats.map((stat, i) => (
          <motion.div 
            key={i} 
            whileTap={{ scale: 0.97 }}
            className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-default group"
          >
            <div>
              <div className="flex items-center">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{stat.label}</p>
                <Sparkline data={stat.trend} color={stat.color.replace('text-', '').replace('-400', '')} />
              </div>
              <p className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2 bg-white/5 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Living Model & Workout */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-6 relative group overflow-hidden">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-black uppercase text-white tracking-widest">Active Session</h3>
               <button onClick={() => setWorkoutExpanded(!isWorkoutExpanded)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                 <Maximize2 size={14} className="text-muted-foreground" />
               </button>
            </div>
            <ErrorBoundary>
              <LivingAnatomyModel />
            </ErrorBoundary>
            <div className="mt-8">
              <ErrorBoundary>
                <motion.div layoutId="workout-crucible">
                  <InWorkoutCrucible />
                </motion.div>
              </ErrorBoundary>
            </div>
          </Card>
        </div>

        {/* Center/Right Column: Analytics */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <MetabolicTrajectoryChart />
            </div>
            <div className="md:col-span-1">
              <BanisterModelChart />
            </div>
            <div className="md:col-span-1">
              <SymmetryRadarChart />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1">
                <MacroHeatmap />
             </div>
             <div className="lg:col-span-1">
                <SportsScienceFeed />
             </div>
             <Card className="bg-blue-600 rounded-[2rem] p-8 flex flex-col justify-between text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group border-none">
                <div className="relative z-10">
                   <div className="flex items-center space-x-2 mb-4">
                      <Zap size={20} fill="white" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Strategy Oracle</h4>
                   </div>
                   <p className="text-lg font-bold leading-tight">
                     Based on 300kcal deficit, your quad progression will plateau in 4.2 days.
                   </p>
                   <p className="text-sm opacity-80 mt-4 leading-relaxed font-medium">
                     AI suggests pivoting to a Deload Block starting Monday to prevent ligamentous inflammation.
                   </p>
                </div>
                <Button className="relative z-10 mt-8 w-full bg-white text-blue-600 hover:bg-white/90 py-4 shadow-xl">
                   Accept Protocol
                </Button>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
             </Card>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWorkoutExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-3xl p-6 flex items-center justify-center"
          >
            <motion.div 
              layoutId="workout-crucible"
              className="max-w-4xl w-full"
            >
              <div className="flex justify-end mb-4">
                <button onClick={() => setWorkoutExpanded(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white">
                  <X size={24} />
                </button>
              </div>
              <InWorkoutCrucible />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
