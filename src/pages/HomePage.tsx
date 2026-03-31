import { useTranslation } from 'react-i18next';
import { ScanLine, TrendingUp, Shield, Leaf, ChevronRight, Sprout } from 'lucide-react';
import { type Scan } from '../lib/supabase';
import { type Profile } from '../lib/supabase';
import SeverityBadge from '../components/SeverityBadge';
import { formatDate } from '../lib/utils';

interface HomePageProps {
  profile: Profile | null;
  isGuest: boolean;
  scans: Scan[];
  onScan: () => void;
  onViewHistory: () => void;
  onViewScan: (scan: Scan) => void;
}

const TIPS_COUNT = 5;

export default function HomePage({ profile, isGuest, scans, onScan, onViewHistory, onViewScan }: HomePageProps) {
  const { t } = useTranslation();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('good_morning') : hour < 17 ? t('good_afternoon') : t('good_evening');
  const userName = profile?.name || (isGuest ? t('guest_mode') : 'Farmer');

  const tipIndex = (new Date().getDate() % TIPS_COUNT) + 1;
  const tip = t(`tips.${tipIndex}`);

  const totalScans = scans.length;
  const healthyScans = scans.filter(s => s.disease_name === 'Healthy Crop' || s.severity === 'low').length;
  const diseaseScans = totalScans - healthyScans;

  const recentScans = scans.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 px-4 pt-12 pb-28 bg-mesh min-h-screen">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-sm mb-1" style={{ color: '#6b8a6b' }}>{greeting} 👋</p>
        <h1 className="font-display font-bold text-2xl" style={{ color: '#e8f5e9' }}>
          {userName}
        </h1>
      </div>

      {/* Quick Scan CTA */}
      <button
        onClick={onScan}
        className="relative w-full rounded-3xl overflow-hidden press animate-fade-up delay-100"
        style={{
          background: 'linear-gradient(135deg, #0d2e14 0%, #163d1e 50%, #0a2310 100%)',
          border: '1px solid rgba(74,222,128,0.25)',
          padding: '24px 20px',
        }}
      >
        {/* Glow blob */}
        <div
          className="absolute right-0 top-0 w-40 h-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-display font-semibold mb-1" style={{ color: '#4ade80' }}>
              {t('quick_scan')}
            </p>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: '#e8f5e9' }}>
              Scan Your Crop
            </h2>
            <p className="text-xs" style={{ color: '#6b8a6b', maxWidth: 180 }}>
              AI-powered disease detection in seconds
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 glow-green"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}
          >
            <ScanLine size={26} style={{ color: '#060d06' }} />
          </div>
        </div>
      </button>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up delay-200">
        {[
          { label: t('total_scans'), value: totalScans, icon: ScanLine, color: '#60a5fa' },
          { label: t('diseases_found'), value: diseaseScans, icon: TrendingUp, color: '#f87171' },
          { label: t('healthy_crops'), value: healthyScans, icon: Shield, color: '#4ade80' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="glass rounded-2xl p-3 flex flex-col items-center gap-1"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
              style={{ background: `${color}15` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#e8f5e9' }}>{value}</span>
            <span className="text-center leading-tight" style={{ color: '#6b8a6b', fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Tip of day */}
      <div
        className="glass rounded-2xl p-4 animate-fade-up delay-300 relative overflow-hidden"
      >
        <div
          className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }}
        />
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)' }}
          >
            <Sprout size={18} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <p className="text-xs font-display font-semibold mb-1" style={{ color: '#fbbf24' }}>
              {t('tip_of_day')}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#a8c5a8' }}>{tip}</p>
          </div>
        </div>
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="animate-fade-up delay-400">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base" style={{ color: '#e8f5e9' }}>
              {t('recent_scans')}
            </h2>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1 text-xs font-display font-semibold"
              style={{ color: '#4ade80' }}
            >
              {t('view_all')} <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recentScans.map((scan, i) => (
              <button
                key={scan.id}
                onClick={() => onViewScan(scan)}
                className="glass rounded-2xl p-3.5 flex items-center gap-3 press text-left w-full animate-fade-up"
                style={{ animationDelay: `${0.4 + i * 0.05}s` }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(74,222,128,0.1)' }}
                >
                  <Leaf size={18} style={{ color: '#4ade80' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate" style={{ color: '#e8f5e9' }}>
                    {scan.disease_name || 'Unknown'}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#6b8a6b' }}>
                    {scan.crop_type} · {formatDate(scan.created_at)}
                  </p>
                </div>

                {/* Severity */}
                {scan.severity && <SeverityBadge severity={scan.severity} size="sm" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {scans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 animate-fade-up delay-400">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}
          >
            <Leaf size={28} style={{ color: '#4ade80' }} />
          </div>
          <p className="font-display font-semibold text-base mb-1" style={{ color: '#e8f5e9' }}>
            Start Scanning
          </p>
          <p className="text-sm text-center" style={{ color: '#6b8a6b', maxWidth: 220 }}>
            Tap the scan button to detect diseases in your crops instantly.
          </p>
        </div>
      )}
    </div>
  );
}
