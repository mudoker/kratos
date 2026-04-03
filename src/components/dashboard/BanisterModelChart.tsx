import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  
} from 'recharts';

const data = [
  { day: 'Mon', fitness: 60, fatigue: 40, readiness: 20 },
  { day: 'Tue', fitness: 62, fatigue: 65, readiness: -3 },
  { day: 'Wed', fitness: 61, fatigue: 55, readiness: 6 },
  { day: 'Thu', fitness: 65, fatigue: 80, readiness: -15 },
  { day: 'Fri', fitness: 64, fatigue: 70, readiness: -6 },
  { day: 'Sat', fitness: 63, fatigue: 50, readiness: 13 },
  { day: 'Sun', fitness: 62, fatigue: 40, readiness: 22 },
];

export const BanisterModelChart: React.FC = () => {
  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 h-[300px] w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Fitness vs Fatigue</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Banister Impulse Model</p>
        </div>
        <div className="flex space-x-2">
           <div className="flex items-center space-x-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <span className="text-[9px] text-muted-foreground uppercase">Fitness</span>
           </div>
           <div className="flex items-center space-x-1">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
             <span className="text-[9px] text-muted-foreground uppercase">Fatigue</span>
           </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#71717a" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="fitness" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="fatigue" 
              stroke="#ef4444" 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="readiness" 
              stroke="#22c55e" 
              strokeWidth={1.5} 
              strokeDasharray="3 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
