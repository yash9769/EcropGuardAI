import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Leaf, Eye, EyeOff, AlertCircle, Globe, ChevronDown, Sun, Moon } from 'lucide-react';

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGuest: () => void;
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

export default function AuthPage({ onSignIn, onSignUp, onGuest, isDarkMode, toggleTheme }: AuthPageProps) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLang, setShowLang] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') await onSignIn(email, password);
      else await onSignUp(email, password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 bg-mesh relative overflow-hidden"
    >
      {/* Top Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 animate-fade-in">
        <div className="relative">
          <button 
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-display font-bold press"
            style={{ color: 'var(--green)' }}
          >
            <Globe size={14} />
            {LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
            <ChevronDown size={14} className={`transition-transform duration-300 ${showLang ? 'rotate-180' : ''}`} />
          </button>
          
          {showLang && (
            <div className="absolute top-full mt-2 left-0 w-40 glass rounded-2xl p-2 shadow-xl animate-scale-in z-[100]">
              <div className="grid grid-cols-1 gap-1">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      i18n.changeLanguage(l.code);
                      setShowLang(false);
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      i18n.language === l.code ? 'bg-[var(--green)] text-slate-900' : 'hover:bg-white/10 text-[var(--text)]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center press"
          style={{ color: 'var(--green)' }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      {/* Background orbs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="animate-fade-up flex flex-col items-center mb-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 glow-green animate-float"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}
        >
          <Leaf size={38} style={{ color: 'var(--green)' }} />
        </div>
        <h1
          className="font-display font-bold text-3xl text-glow"
          style={{ color: 'var(--green)' }}
        >
          {t('app_name')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('tagline')}</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm glass rounded-3xl p-6 animate-fade-up delay-100"
      >
        {/* Mode toggle */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ background: 'var(--bg-card)' }}
        >
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200 press"
              style={{
                background: mode === m ? 'var(--green-soft)' : 'transparent',
                color: mode === m ? 'var(--green)' : 'var(--text-dim)',
                border: mode === m ? '1px solid var(--border-bright)' : '1px solid transparent',
              }}
            >
              {m === 'signin' ? t('sign_in') : t('sign_up')}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm animate-fade-up"
            style={{ background: 'var(--red-glow)', color: 'var(--red)', border: '1px solid var(--border)' }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs font-display font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
            {t('email')}
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs font-display font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
            {t('password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-dim)' }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full py-3.5 rounded-xl font-display font-bold text-sm transition-all duration-200 press disabled:opacity-50"
          style={{
            background: 'var(--green)',
            color: '#ffffff',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--green), transparent 70%)',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading...
            </span>
          ) : mode === 'signin' ? t('sign_in') : t('sign_up')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('or_continue_as_guest')}</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Guest */}
        <button
          onClick={onGuest}
          className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-all duration-200 press"
          style={{
            background: 'var(--green-glow)',
            border: '1px solid var(--border)',
            color: 'var(--green)',
          }}
        >
          {t('continue_guest')}
        </button>
      </div>

      {/* Version */}
      <p className="mt-8 text-xs animate-fade-up delay-300" style={{ color: 'var(--text-dim)' }}>
        {t('app_name')} v1.0.0
      </p>
    </div>
  );
}
