import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#3b82f6' }) => {
  const min = Math.min(...data);
  const max = Math.max(...max = Math.max(...data), min + 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 40,
    y: 10 - ((v - min) / (max - min)) * 10,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width="40" height="12" viewBox="0 0 40 10" className="overflow-visible inline-block ml-2">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
    </svg>
  );
};
