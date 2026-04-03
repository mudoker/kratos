import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap,   } from 'lucide-react';
import { Button } from '../ui/Primitives';

interface RecoveryProtocolOverlayProps {
  isOpen: boolean;
  hrs: number;
  onClose: () => void;
}

export const RecoveryProtocolOverlay: React.FC<RecoveryProtocolOverlayProps> = ({ isOpen, hrs, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="max-w-lg w-full bg-white/[0.02] border border-red-500/20 rounded-[2rem] p-8 text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 bg-red-500/20 rounded-2xl text-red-500 mb-6 animate-pulse">
                <ShieldAlert size={48} />
              </div>
              
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">CNS Critical Failure</h2>
              <p className="text-red-400 font-mono text-sm mb-8 tracking-widest">Readiness Score: {hrs}/100</p>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-left mb-8 w-full">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest">AI Intervention Protocol</h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 text-sm text-white">
                    <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p>Heavy compound movements (Squats/Deads) have been locked.</p>
                  </div>
                  <div className="flex items-start space-x-3 text-sm text-white">
                    <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p>Suggested replacement: 20-min Mobility & Isometric Flow.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full space-y-3">
                <Button 
                  onClick={onClose}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                >
                  Initiate Recovery Flow
                </Button>
                <button 
                  onClick={onClose}
                  className="text-[10px] font-black uppercase text-muted-foreground hover:text-white tracking-widest py-2 transition-colors"
                >
                  Override Protocol (Not Recommended)
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
