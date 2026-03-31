import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGuest: () => void;
}

export default function AuthPage({ onSignIn, onSignUp, onGuest }: AuthPageProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      {/* Background orbs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="animate-fade-up flex flex-col items-center mb-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 glow-green animate-float"
          style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #0f2a0f 100%)', border: '1px solid rgba(74,222,128,0.3)' }}
        >
          <Leaf size={38} style={{ color: '#4ade80' }} />
        </div>
        <h1
          className="font-display font-bold text-3xl text-glow"
          style={{ color: '#4ade80' }}
        >
          {t('app_name')}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b8a6b' }}>{t('tagline')}</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm glass rounded-3xl p-6 animate-fade-up delay-100"
      >
        {/* Mode toggle */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200 press"
              style={{
                background: mode === m ? 'rgba(74,222,128,0.15)' : 'transparent',
                color: mode === m ? '#4ade80' : '#3d5c3d',
                border: mode === m ? '1px solid rgba(74,222,128,0.25)' : '1px solid transparent',
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
            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs font-display font-semibold mb-1.5 block" style={{ color: '#6b8a6b' }}>
            {t('email')}
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3d5c3d' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(74,222,128,0.15)',
                color: '#e8f5e9',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(74,222,128,0.15)'}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-xs font-display font-semibold mb-1.5 block" style={{ color: '#6b8a6b' }}>
            {t('password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3d5c3d' }} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(74,222,128,0.15)',
                color: '#e8f5e9',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(74,222,128,0.15)'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: '#3d5c3d' }}
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
            background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
            color: '#060d06',
            boxShadow: '0 4px 20px rgba(74,222,128,0.3)',
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
          <div className="flex-1 h-px" style={{ background: 'rgba(74,222,128,0.1)' }} />
          <span className="text-xs" style={{ color: '#3d5c3d' }}>{t('or_continue_as_guest')}</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(74,222,128,0.1)' }} />
        </div>

        {/* Guest */}
        <button
          onClick={onGuest}
          className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-all duration-200 press"
          style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ade80',
          }}
        >
          {t('continue_guest')}
        </button>
      </div>

      {/* Version */}
      <p className="mt-8 text-xs animate-fade-up delay-300" style={{ color: '#3d5c3d' }}>
        {t('app_name')} v1.0.0
      </p>
    </div>
  );
}
