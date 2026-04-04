import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Phone, MapPin, Globe, LogOut, Save, ChevronDown,
  Leaf, Info, CheckCircle2, Sun, Moon
} from 'lucide-react';
import { type Profile } from '../lib/supabase';
import i18n from '../i18n/i18n';

interface ProfilePageProps {
  profile: Profile | null;
  isGuest: boolean;
  onUpdate: (updates: Partial<Profile>) => Promise<void>;
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
];

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

function Field({
  label, icon: Icon, value, onChange, placeholder, type = 'text',
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-display font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <Icon size={12} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--green)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

function SelectField({
  label, icon: Icon, value, options, onChange
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-display font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <Icon size={12} />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3.5 py-3 rounded-xl text-sm outline-none appearance-none transition-all pr-9"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: value ? 'var(--text)' : 'var(--text-muted)',
          }}
          onFocus={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--green)'}
          onBlur={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--border)'}
        >
          <option value="">Select...</option>
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: 'var(--bg-card)' }}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
}

export default function ProfilePage({ profile, isGuest, onUpdate, onSignOut, isDarkMode, toggleTheme }: ProfilePageProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [state, setState] = useState(profile?.state || '');
  const [lang, setLang] = useState(profile?.preferred_language || i18n.language || 'en');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({ name, phone, village, district, state, preferred_language: lang });
      i18n.changeLanguage(lang);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const avatarLetter = name ? name[0].toUpperCase() : isGuest ? 'G' : 'F';

  return (
    <div className="flex flex-col min-h-screen px-4 pt-14 pb-28 bg-mesh overflow-auto">
      {/* Header */}
      <div className="animate-fade-up mb-6 flex justify-between items-center">
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text)' }}>
          {t('profile_title')}
        </h1>
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center press"
          style={{ color: 'var(--green)' }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 animate-fade-up delay-100">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-3 glow-green"
          style={{
            background: 'var(--bg-glass)',
            border: '2px solid var(--border)',
            fontSize: 32,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--green)',
          }}
        >
          {avatarLetter}
        </div>
        {isGuest && (
          <span
            className="px-3 py-1 rounded-full text-xs font-display font-semibold"
            style={{ background: 'var(--amber-glow)', color: 'var(--amber)', border: '1px solid var(--border)' }}
          >
            {t('guest_mode')}
          </span>
        )}
      </div>

      {/* Form */}
      {!isGuest ? (
        <div className="glass rounded-3xl p-5 mb-4 animate-fade-up delay-200">
          <div className="flex flex-col gap-4">
            <Field label={t('name')} icon={User} value={name} onChange={setName} placeholder="Your name" />
            <Field label={t('phone')} icon={Phone} value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" type="tel" />
            <Field label={t('village')} icon={MapPin} value={village} onChange={setVillage} />
            <Field label={t('district')} icon={MapPin} value={district} onChange={setDistrict} />
            <SelectField
              label={t('state')}
              icon={MapPin}
              value={state}
              options={STATES.map(s => ({ value: s, label: s }))}
              onChange={setState}
            />
            <SelectField
              label={t('language')}
              icon={Globe}
              value={lang}
              options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
              onChange={setLang}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 press disabled:opacity-60 transition-all"
            style={{
              background: saved ? 'var(--green-glow)' : 'var(--green)',
              color: saved ? 'var(--green)' : '#ffffff',
              border: saved ? '1px solid var(--border)' : 'none',
              boxShadow: saved ? 'none' : '0 4px 20px color-mix(in srgb, var(--green), transparent 70%)',
            }}
          >
            {saved ? (
              <><CheckCircle2 size={16} /> {t('saved')}</>
            ) : (
              <><Save size={16} /> {t('save')}</>
            )}
          </button>
        </div>
      ) : (
        /* Guest — language only */
        <div className="glass rounded-3xl p-5 mb-4 animate-fade-up delay-200">
          <SelectField
            label={t('language')}
            icon={Globe}
            value={lang}
            options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
            onChange={v => { setLang(v); i18n.changeLanguage(v); }}
          />
        </div>
      )}

      {/* About */}
      <div className="glass rounded-2xl p-4 mb-4 animate-fade-up delay-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-glow)' }}>
            <Leaf size={18} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>{t('app_name')}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0.0 · AI Powered</p>
          </div>
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Powered by Google Gemini AI. Provides guidance for crop disease identification. Always consult a certified agronomist for critical decisions.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-display font-semibold text-sm press animate-fade-up delay-400"
        style={{
          background: 'var(--red-glow)',
          border: '1px solid var(--border)',
          color: 'var(--red)',
        }}
      >
        <LogOut size={16} />
        {t('sign_out')}
      </button>
    </div>
  );
}
