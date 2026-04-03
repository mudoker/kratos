import React from 'react';

const generateDays = () => {
  const days = [];
  for (let i = 0; i < 35; i++) {
    // Mock protein adherence (0 to 1)
    days.push(Math.random() > 0.3 ? (Math.random() * 0.4 + 0.6) : Math.random() * 0.4);
  }
  return days;
};

const getColor = (adherence: number) => {
  if (adherence > 0.9) return '#22c55e'; // Hit target
  if (adherence > 0.7) return '#16a34a'; 
  if (adherence > 0.4) return '#15803d';
  if (adherence > 0.2) return '#14532d';
  return '#18181b'; // Missed
};

export const MacroHeatmap: React.FC = () => {
  const days = React.useMemo(() => generateDays(), []);

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-full w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Macro Discipline</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Protein Target Adherence</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
        {days.map((val, i) => (
          <div 
            key={i}
            className="w-4 h-4 rounded-sm transition-all hover:scale-125 cursor-help"
            style={{ backgroundColor: getColor(val) }}
            title={`Day ${i+1}: ${Math.round(val * 100)}% Adherence`}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-[9px] text-muted-foreground uppercase font-bold border-t border-white/5 pt-4">
        <span>35 Day Streak</span>
        <div className="flex items-center space-x-1">
          <span>Less</span>
          {[0, 0.3, 0.6, 1].map(v => (
            <div key={v} className="w-2 h-2 rounded-sm" style={{ backgroundColor: getColor(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
