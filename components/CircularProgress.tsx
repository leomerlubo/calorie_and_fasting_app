
import React from 'react';

interface CircularProgressProps {
  percentage: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  isRedAlert?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  label,
  subLabel,
  size = 200,
  strokeWidth = 12,
  color = 'text-blue-500',
  isRedAlert = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const displayColor = isRedAlert ? 'text-red-500' : color;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${displayColor} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-3xl font-bold ${displayColor}`}>{label}</span>
        {subLabel && <span className="text-slate-500 text-sm mt-1">{subLabel}</span>}
      </div>
    </div>
  );
};

export default CircularProgress;
