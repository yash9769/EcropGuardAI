interface ConfidenceRingProps {
  value: number;
  size?: number;
}

export default function ConfidenceRing({ value, size = 80 }: ConfidenceRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = value >= 80 ? '#4ade80' : value >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(74,222,128,0.1)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease, stroke 0.3s',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-display font-bold leading-none"
          style={{ color, fontSize: size > 70 ? 20 : 14 }}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}
