import { Home, ScanLine, History, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

type Tab = 'home' | 'scan' | 'history' | 'assistant';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const navItems = [
  { id: 'home' as Tab, icon: Home, label: 'home' },
  { id: 'scan' as Tab, icon: ScanLine, label: 'scan' },
  { id: 'history' as Tab, icon: History, label: 'history' },
  { id: 'assistant' as Tab, icon: Bot, label: 'assistant' },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe glass"
      style={{
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          const isScan = id === 'scan';

          if (isScan) {
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="relative -top-5 press"
                aria-label={t(label)}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                    isActive
                      ? 'glow-green'
                      : 'shadow-lg'
                  )}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
                      : 'linear-gradient(135deg, #1a3a1a 0%, #0f2a0f 100%)',
                    border: isActive ? 'none' : '1px solid var(--border-bright)',
                  }}
                >
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ color: isActive ? '#060d06' : 'var(--green)' }}
                  />
                </div>
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse-ring"
                    style={{ background: 'var(--green-glow)', transform: 'scale(1)' }}
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-0.5 py-1 px-4 press"
              aria-label={t(label)}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                  isActive && 'glow-green-sm'
                )}
                style={{
                  background: isActive ? 'var(--green-soft)' : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? 'var(--green)' : 'var(--text-dim)' }}
                />
              </div>
              <span
                className="text-xs font-display transition-all duration-200"
                style={{
                  color: isActive ? 'var(--green)' : 'var(--text-dim)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '10px',
                }}
              >
                {t(label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
