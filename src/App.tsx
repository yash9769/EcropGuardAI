import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import { useScans } from './hooks/useScans';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';
import { type Scan } from './lib/supabase';

type Tab = 'home' | 'scan' | 'history' | 'profile';

export default function App() {
  const { t } = useTranslation();
  const { user, profile, loading, isGuest, isAuthenticated, signIn, signUp, signOut, continueAsGuest, updateProfile } = useAuth();
  const { scans, loading: scansLoading, saveScan, deleteScan } = useScans(user, isGuest);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Loading splash
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center animate-float glass"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 28 }}>🌿</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--green)',
                  animation: 'wave 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : 'light'}>
        <AuthPage
          onSignIn={signIn}
          onSignUp={signUp}
          onGuest={continueAsGuest}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      </div>
    );
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedScan(null);
  }

  function handleViewScan(scan: Scan) {
    setSelectedScan(scan);
    setActiveTab('history');
  }

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      <div className="relative min-h-screen">
        {/* Pages */}
        <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
          <HomePage
            profile={profile}
            isGuest={isGuest}
            scans={scans}
            onScan={() => setActiveTab('scan')}
            onViewHistory={() => setActiveTab('history')}
            onViewScan={handleViewScan}
          />
        </div>

        <div style={{ display: activeTab === 'scan' ? 'block' : 'none' }}>
          <ScanPage
            onSave={async (scan) => {
              await saveScan(scan as Parameters<typeof saveScan>[0]);
            }}
          />
        </div>

        <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
          <HistoryPage
            scans={scans}
            loading={scansLoading}
            onDelete={deleteScan}
          />
        </div>

        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          <ProfilePage
            profile={profile}
            isGuest={isGuest}
            onUpdate={updateProfile}
            onSignOut={signOut}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* Bottom navigation */}
        <BottomNav active={activeTab} onChange={handleTabChange} />
      </div>
    </div>
  );
}
