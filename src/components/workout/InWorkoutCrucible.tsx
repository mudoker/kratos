import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play,  Timer, TrendingDown } from 'lucide-react';


export const InWorkoutCrucible: React.FC = () => {
  const [activeSet, setActiveSet] = useState<number>(1);
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(10);
  const [rir, setRir] = useState(2);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [autoRegulated, setAutoRegulated] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isResting) {
      interval = setInterval(() => {
        setRestTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting]);

  const handleCompleteSet = () => {
    // Auto-regulation logic: If RIR hits 0, suggest dropping weight for next set
    if (rir === 0) {
      setWeight(prev => Math.round(prev * 0.95));
      setAutoRegulated(true);
      setTimeout(() => setAutoRegulated(false), 5000);
    }
    
    setIsResting(true);
    setRestTime(0);
    setActiveSet(prev => prev + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500 animate-pulse">
            <Play size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-tight">Leg Press</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Set {activeSet} of 4</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full">
           <Timer size={14} className={isResting ? 'text-blue-400' : 'text-muted-foreground'} />
           <span className={`text-xs font-mono font-bold ${isResting ? 'text-blue-400' : 'text-muted-foreground'}`}>
             {formatTime(restTime)}
           </span>
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
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">RIR</label>
            <select 
              value={rir} 
              onChange={(e) => setRir(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg font-mono font-bold text-white focus:outline-none appearance-none"
            >
              {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v} className="bg-[#0a0a0c]">{v}</option>)}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {autoRegulated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-3 text-amber-500"
            >
              <TrendingDown size={18} />
              <p className="text-xs font-medium">Auto-Regulation Active: Load reduced -5% due to 0 RIR threshold.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCompleteSet}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center space-x-2"
        >
          {isResting ? <span>Start Next Set</span> : <span>Complete Set</span>}
          <ChevronRight size={18} />
        </button>

        <div className="pt-4 border-t border-white/5">
           <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold mb-4">
             <span>Energy Systems Status</span>
             <span className="text-blue-400">ATP Refilling...</span>
           </div>
           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: isResting ? `${Math.min((restTime / 120) * 100, 100)}%` : '100%' }}
                transition={{ duration: 0.5 }}
              />
           </div>
        </div>
      </div>
    </div>
  );
};
