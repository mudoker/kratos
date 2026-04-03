import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Push', A: 120, fullMark: 150 },
  { subject: 'Pull', A: 98, fullMark: 150 },
  { subject: 'Legs', A: 86, fullMark: 150 },
  { subject: 'Core', A: 99, fullMark: 150 },
  { subject: 'Hips', A: 85, fullMark: 150 },
];

export const SymmetryRadarChart: React.FC = () => {
  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-[300px] w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Structural Symmetry</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Kinetic Chain Balance</p>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
            <Radar
              name="Athlete"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
