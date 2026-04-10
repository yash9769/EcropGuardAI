import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ScanLine, TrendingUp, Shield, Leaf, ChevronRight, Sprout,
  Sun, Moon, Globe, ChevronDown
} from 'lucide-react';
import { type Scan } from '../lib/supabase';
import { type Profile } from '../lib/supabase';
import SeverityBadge from '../components/SeverityBadge';
import WeatherWidget from '../components/WeatherWidget';
import { formatDate } from '../lib/utils';

interface HomePageProps {
  profile: Profile | null;
  isGuest: boolean;
  scans: Scan[];
  onScan: () => void;
  onViewHistory: () => void;
  onViewScan: (scan: Scan) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },
];

const TIPS_COUNT = 5;

export default function HomePage({ profile, isGuest, scans, onScan, onViewHistory, onViewScan, isDarkMode, toggleTheme }: HomePageProps) {
  const { t, i18n } = useTranslation();
  const [showLang, setShowLang] = useState(false);

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
      {/* Header with controls - z-50 to stay above cards */}
      <div className="flex items-start justify-between animate-fade-up relative z-50">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text)' }}>
            {userName}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowLang(!showLang)}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center press"
              style={{ color: 'var(--green)' }}
            >
              <Globe size={18} />
            </button>
            
            {showLang && (
              <div className="absolute top-full mt-2 right-0 w-36 glass rounded-2xl p-2 shadow-xl animate-scale-in z-[100]">
                <div className="max-h-48 overflow-auto gap-1 flex flex-col">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        i18n.changeLanguage(l.code);
                        setShowLang(false);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        i18n.language === l.code ? 'bg-[var(--green)] text-white' : 'hover:bg-white/10 text-[var(--text)]'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center press"
            style={{ color: 'var(--green)' }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Quick Scan CTA */}
      <button
        onClick={onScan}
        className="relative w-full rounded-3xl overflow-hidden press animate-fade-up delay-100"
        style={{
          background: 'linear-gradient(135deg, var(--green-dim) 0%, var(--green) 100%)',
          border: '1px solid var(--border-bright)',
          padding: '24px 20px',
        }}
      >
        {/* Glow blob */}
        <div
          className="absolute right-0 top-0 w-40 h-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-display font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {t('quick_scan')}
            </p>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: '#ffffff' }}>
              Scan Your Crop
            </h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 180 }}>
              AI-powered disease detection in seconds
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/20 shadow-xl"
            style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ScanLine size={26} style={{ color: '#ffffff' }} />
          </div>
        </div>
      </button>

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up delay-200">
        {[
          { label: t('total_scans'), value: totalScans, icon: ScanLine, color: 'var(--blue)' },
          { label: t('diseases_found'), value: diseaseScans, icon: TrendingUp, color: 'var(--red)' },
          { label: t('healthy_crops'), value: healthyScans, icon: Shield, color: 'var(--green)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="glass rounded-2xl p-3 flex flex-col items-center gap-1"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
              style={{ background: `color-mix(in srgb, ${color}, transparent 90%)` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>{value}</span>
            <span className="text-center leading-tight" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{label}</span>
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
            style={{ background: 'color-mix(in srgb, var(--amber), transparent 90%)' }}
          >
            <Sprout size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div>
            <p className="text-xs font-display font-semibold mb-1" style={{ color: 'var(--amber)' }}>
              {t('tip_of_day')}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tip}</p>
          </div>
        </div>
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="animate-fade-up delay-400">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
              {t('recent_scans')}
            </h2>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1 text-xs font-display font-semibold"
              style={{ color: 'var(--green)' }}
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
                  style={{ background: 'var(--green-glow)' }}
                >
                  <Leaf size={18} style={{ color: 'var(--green)' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                    {scan.disease_name || 'Unknown'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
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
            style={{ background: 'var(--green-glow)', border: '1px solid var(--border)' }}
          >
            <Leaf size={28} style={{ color: 'var(--green)' }} />
          </div>
          <p className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>
            Start Scanning
          </p>
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)', maxWidth: 220 }}>
            Tap the scan button to detect diseases in your crops instantly.
          </p>
        </div>
      )}
    </div>
  );
}
