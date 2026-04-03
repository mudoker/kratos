import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info, Save, X } from 'lucide-react';
import type { NutritionLog } from '../../lib/db/schema';
import { saveNutritionLog } from '../../lib/ai/nlpNutritionParser';

interface NutritionCardProps {
  log: Partial<NutritionLog>;
  onSave?: () => void;
  onCancel?: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ log, onSave, onCancel }) => {
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = async () => {
    await saveNutritionLog(log);
    setIsSaved(true);
    onSave?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-l-4 border-blue-500 rounded-lg p-4 shadow-sm space-y-3"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-foreground">AI Nutrition Parse</h4>
          <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{log.rawText}"</p>
        </div>
        <div className="flex items-center space-x-1 text-blue-500">
          <Info size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{Math.round((log.confidence || 0) * 100)}% Conf</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-muted/50 p-2 rounded">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Kcals</p>
          <p className="text-lg font-mono font-bold leading-tight">{log.kcals}</p>
        </div>
        <div className="bg-muted/50 p-2 rounded">
          <p className="text-[10px] uppercase font-bold text-muted-foreground text-blue-400">P</p>
          <p className="text-lg font-mono font-bold leading-tight">{log.protein}g</p>
        </div>
        <div className="bg-muted/50 p-2 rounded">
          <p className="text-[10px] uppercase font-bold text-muted-foreground text-green-400">C</p>
          <p className="text-lg font-mono font-bold leading-tight">{log.carbs}g</p>
        </div>
        <div className="bg-muted/50 p-2 rounded">
          <p className="text-[10px] uppercase font-bold text-muted-foreground text-amber-400">F</p>
          <p className="text-lg font-mono font-bold leading-tight">{log.fats}g</p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {!isSaved ? (
          <>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-md shadow-blue-500/20"
            >
              <Save size={16} />
              <span>Confirm Macros</span>
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-2 text-green-500 font-medium text-sm py-1.5">
            <Check size={18} />
            <span>Logged to Intake</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
