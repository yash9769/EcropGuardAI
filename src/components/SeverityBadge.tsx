import { cn } from '../lib/utils';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

const config = {
  low:      { label: 'Low',      color: 'var(--green)', bg: 'rgba(34,197,94,0.12)',  dot: 'var(--green)' },
  medium:   { label: 'Moderate', color: 'var(--amber)', bg: 'rgba(251,191,36,0.12)', dot: 'var(--amber)' },
  high:     { label: 'High',     color: 'var(--orange)', bg: 'rgba(249,115,22,0.12)', dot: 'var(--orange)' },
  critical: { label: 'Critical', color: 'var(--red)', bg: 'rgba(239,68,68,0.12)',   dot: 'var(--red)' },
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
