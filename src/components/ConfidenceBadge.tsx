import React from 'react';
import { cn } from '../lib/utils';

interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  mode?: 'rag' | 'fallback';
  className?: string;
}

export const ConfidenceBadge = ({ confidence, mode, className }: ConfidenceBadgeProps) => {
  const pct = Math.round(confidence * 100);

  const level =
    pct >= 80 ? { label: 'High', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' }
    : pct >= 50 ? { label: 'Medium', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400' }
    : { label: 'Low', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' };

  const sourceLabel = mode === 'rag'
    ? { icon: '📚', text: 'Based on research' }
    : { icon: '🧠', text: 'General advice' };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn('flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider', level.color)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', level.dot)} />
        {level.label} Confidence · {pct}%
      </span>
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant border border-emerald-900/5">
        {sourceLabel.icon} {sourceLabel.text}
      </span>
    </div>
  );
};
