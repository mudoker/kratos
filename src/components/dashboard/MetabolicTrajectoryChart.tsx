import React from 'react';
import {
  
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const data = [
  { day: 'Mon', weight: 88.5, trend: 88.4, kcal: 2800 },
  { day: 'Tue', weight: 88.2, trend: 88.3, kcal: 2750 },
  { day: 'Wed', weight: 88.4, trend: 88.2, kcal: 2600 },
  { day: 'Thu', weight: 87.9, trend: 88.1, kcal: 2500 },
  { day: 'Fri', weight: 87.7, trend: 87.9, kcal: 2900 },
  { day: 'Sat', weight: 87.8, trend: 87.8, kcal: 3100 },
  { day: 'Sun', weight: 87.5, trend: 87.7, kcal: 2700 },
];

export const MetabolicTrajectoryChart: React.FC = () => {
  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-[300px] w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Metabolic Trajectory</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Thermodynamic Weight Trend</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-blue-400">-1.2kg / wk</p>
          <p className="text-[9px] text-muted-foreground uppercase">Projected</p>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#71717a" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              hide 
              domain={['dataMin - 1', 'dataMax + 1']} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorWeight)" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="trend" 
              stroke="#60a5fa" 
              strokeDasharray="5 5" 
              dot={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
