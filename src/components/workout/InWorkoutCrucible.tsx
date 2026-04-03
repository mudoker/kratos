import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Timer, TrendingDown, AlertCircle } from 'lucide-react';
import { getRecommendedRest } from '../../lib/science/models';
import { haptics, speak } from '../../lib/ui/feedback';

export const InWorkoutCrucible: React.FC = React.memo(() => {
  const [activeSet, setActiveSet] = useState<number>(1);
  const [exerciseName, setExerciseName] = useState('Leg Press');
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(10);
  const [rpe, setRpe] = useState(8);
  const [restTime, setRestTime] = useState(0);
  const [targetRest, setTargetRest] = useState(180);
  const [isResting, setIsResting] = useState(false);
  const [autoRegulated, setAutoRegulated] = useState(false);
  const [atpWarning, setAtpWarning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting) {
      interval = setInterval(() => {
        setRestTime(prev => prev + 1);
        
        // Voice cue 30s before rest ends
        if (targetRest - restTime === 30) {
          speak(`30 seconds left. Get ready for set ${activeSet}. Target weight is ${weight} kilograms.`);
        }
      }, 1000);
    }
    return () => clearInterval(interval!);
  }, [isResting, restTime, targetRest, activeSet, weight]);

  const handleCompleteSet = useCallback(() => {
    haptics.success();
    
    // AI Spotter Intervention
    if (rpe >= 10) {
      const reduction = Math.round(weight * 0.90);
      setWeight(reduction);
      setAutoRegulated(true);
      speak(`Heavy set detected. Reducing next load to ${reduction} kilograms to protect Central Nervous System.`);
      setTimeout(() => setAutoRegulated(false), 5000);
    }
    
    const nextRest = getRecommendedRest(exerciseName, rpe);
    setTargetRest(nextRest);
    setIsResting(true);
    setRestTime(0);
    setActiveSet(prev => prev + 1);
  }, [weight, rpe, exerciseName]);

  const handleStartSet = useCallback(() => {
    if (isResting && restTime < targetRest * 0.5) {
      haptics.warning();
      setAtpWarning(true);
      speak("ATP not fully replenished. Force start anyway?");
      return;
    }
    haptics.tap();
    setIsResting(false);
    setAtpWarning(false);
  }, [isResting, restTime, targetRest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative group/crucible">
      <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 animate-pulse">
            <Play size={16} />
          </div>
          <div>
            <input 
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-white uppercase tracking-widest leading-tight focus:outline-none focus:ring-1 focus:ring-white/20 rounded w-32"
            />
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Set {activeSet} of 4</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full">
             <Timer size={14} className={isResting ? 'text-blue-400' : 'text-muted-foreground'} />
             <span className={`text-xs font-mono font-bold ${isResting ? 'text-blue-400' : 'text-muted-foreground'}`}>
               {formatTime(restTime)} / {formatTime(targetRest)}
             </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Weight (kg)</label>
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Reps</label>
            <input 
              type="number" 
              value={reps} 
              onChange={(e) => setReps(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">RPE</label>
            <select 
              value={rpe} 
              onChange={(e) => setRpe(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none appearance-none"
            >
              {[6, 7, 8, 9, 10].map(v => <option key={v} value={v} className="bg-[#0a0a0c] text-white">{v}</option>)}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {autoRegulated && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-3 text-amber-500"
            >
              <TrendingDown size={18} />
              <p className="text-xs font-medium uppercase tracking-tight">AI Spotter: Load drop applied (-10%).</p>
            </motion.div>
          )}
          {atpWarning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between text-red-500"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle size={18} />
                <p className="text-xs font-bold uppercase tracking-tighter">ATP Depletion Warning</p>
              </div>
              <button onClick={() => { haptics.tap(); setIsResting(false); setAtpWarning(false); }} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-black uppercase">Override</button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isResting ? handleStartSet : handleCompleteSet}
          className={`w-full ${isResting ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-600 text-white hover:bg-blue-700'} font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2`}
        >
          {isResting ? <span>Initiate Set</span> : <span>Log Set</span>}
          <ChevronRight size={18} />
        </motion.button>

        <div className="pt-4 border-t border-white/5">
           <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold mb-4">
             <span>ATP-PC Recovery</span>
             <span className={isResting && restTime < targetRest ? 'text-blue-400 animate-pulse' : 'text-green-500'}>
               {isResting && restTime < targetRest ? 'Refilling...' : 'Optimized'}
             </span>
           </div>
           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${isResting && restTime < targetRest ? 'bg-blue-500' : 'bg-green-500'}`}
                initial={{ width: '0%' }}
                animate={{ width: isResting ? `${Math.min((restTime / targetRest) * 100, 100)}%` : '100%' }}
                transition={{ duration: 0.5 }}
              />
           </div>
        </div>
      </div>
    </div>
  );
});
