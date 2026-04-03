import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const AgenticOverlays: React.FC = () => {
  const { agenticNotification, setAgenticNotification } = useAppStore();

  if (!agenticNotification) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-20 right-6 z-[100] w-full max-w-sm pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          className="pointer-events-auto bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
        >
          {/* Status Glow */}
          <div 
            className={`absolute top-0 left-0 w-1 h-full ${
              agenticNotification.type === 'CRITICAL' ? 'bg-red-500' :
              agenticNotification.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
            }`} 
          />

          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${
              agenticNotification.type === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
              agenticNotification.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              {agenticNotification.type === 'CRITICAL' ? <AlertCircle size={20} /> :
               agenticNotification.type === 'WARNING' ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">{agenticNotification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{agenticNotification.message}</p>
              
              <button 
                onClick={() => setAgenticNotification(null)}
                className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all border border-white/5"
              >
                {agenticNotification.action}
              </button>
            </div>

            <button onClick={() => setAgenticNotification(null)} className="text-muted-foreground hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
