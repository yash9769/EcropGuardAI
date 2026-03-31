import { cn } from '../lib/utils';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

const config = {
  low:      { label: 'Low',      color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dot: '#4ade80' },
  medium:   { label: 'Moderate', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', dot: '#fbbf24' },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', dot: '#f97316' },
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)',dot: '#f87171' },
};

export default function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const cfg = config[severity as keyof typeof config] || config.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-display font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span
        className="rounded-full animate-pulse"
        style={{
          width: size === 'sm' ? 5 : 6,
          height: size === 'sm' ? 5 : 6,
          background: cfg.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
