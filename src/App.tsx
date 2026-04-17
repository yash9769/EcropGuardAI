import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Sidebar, type Screen } from './components/Sidebar';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { UploadScreen } from './screens/UploadScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { ForumsScreen } from './screens/ForumsScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { FieldMapScreen } from './screens/FieldMapScreen';
import { SoilMetricsScreen } from './screens/SoilMetricsScreen';
import { WeatherScreen } from './screens/WeatherScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SupportScreen } from './screens/SupportScreen';
import { ProPlanScreen } from './screens/ProPlanScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { Dashboard, History, Add, Analytics, Settings } from './components/Icons';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { AdvisoryBanner } from './components/AdvisoryBanner';

export default function App() {
  const { t, i18n } = useTranslation();
  const [screen, setScreen] = useState<Screen>('dashboard');

  useEffect(() => {
    document.title = `${t('app_name')} - ${t('digital_agronomist')}`;
  }, [t, i18n.language]);

  const auth = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Chatbot Persistence State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedAssistantModel, setSelectedAssistantModel] = useState('llama-3.3-70b-versatile');

  if (auth.loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-surface gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return authMode === 'login' ? (
      <LoginScreen 
        onLogin={auth.signIn} 
        onSwitchToRegister={() => setAuthMode('register')} 
        onContinueGuest={auth.continueAsGuest}
      />
    ) : (
      <RegisterScreen 
        onRegister={auth.signUp} 
        onSwitchToLogin={() => setAuthMode('login')} 
      />
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden font-sans text-on-surface">
      <Sidebar activeScreen={screen} setScreen={setScreen} />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Subtle Background Art */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/20 blur-[150px] -z-10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-800/10 blur-[120px] -z-10 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <AdvisoryBanner userId={auth.user?.id} />

        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
          >
            {screen === 'assistant' && (
              <AssistantScreen 
                setScreen={setScreen} 
                messages={chatMessages} 
                setMessages={setChatMessages} 
                selectedModel={selectedAssistantModel}
                setSelectedModel={setSelectedAssistantModel}
              />
            )}
            {screen === 'history' && <HistoryScreen setScreen={setScreen} />}
            {screen === 'crop-health' && (
              <UploadScreen 
                setScreen={setScreen} 
                setSelectedImg={setSelectedImg} 
                setAnalysisResult={setAnalysisResult} 
              />
            )}
            {screen === 'analysis' && (
              <AnalysisScreen 
                setScreen={setScreen} 
                image={selectedImg} 
                result={analysisResult} 
              />
            )}
            {screen === 'forums' && <ForumsScreen setScreen={setScreen} />}
            {screen === 'community' && <CommunityScreen setScreen={setScreen} />}
            {screen === 'dashboard' && <DashboardScreen setScreen={setScreen} />}
            {screen === 'field-map' && <FieldMapScreen setScreen={setScreen} />}
            {screen === 'soil-metrics' && <SoilMetricsScreen setScreen={setScreen} />}
            {screen === 'weather' && <WeatherScreen setScreen={setScreen} />}
            {screen === 'settings' && (
              <SettingsScreen 
                setScreen={setScreen} 
                user={auth.user} 
                profile={auth.profile} 
                onUpdateProfile={auth.updateProfile} 
                signOut={auth.signOut} 
              />
            )}
            {screen === 'support' && <SupportScreen setScreen={setScreen} />}
            {screen === 'pro-plan' && <ProPlanScreen setScreen={setScreen} />}
            {screen === 'analytics' && <AnalyticsScreen setScreen={setScreen} />}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Bottom Navigation (Visible only on small screens) */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-2xl border border-emerald-900/10 px-6 py-4 rounded-[2rem] flex justify-between items-center z-50 shadow-2xl">
          <button 
            onClick={() => setScreen('dashboard')}
            className={cn("flex flex-col items-center gap-1.5 transition-all", screen === 'dashboard' ? "text-primary scale-110" : "text-on-surface-variant opacity-60")}
          >
            <Dashboard className="w-5 h-5" fill={screen === 'dashboard'} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('home')}</span>
          </button>
          
          <button 
            onClick={() => setScreen('history')}
            className={cn("flex flex-col items-center gap-1.5 transition-all", screen === 'history' ? "text-primary scale-110" : "text-on-surface-variant opacity-60")}
          >
            <History className="w-5 h-5" fill={screen === 'history'} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('history_tab')}</span>
          </button>
          
          <div className="relative -mt-12 group">
            <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <button 
              onClick={() => setScreen('crop-health')}
              className="w-16 h-16 signature-gradient rounded-full shadow-2xl flex items-center justify-center text-white relative z-10 active:scale-90 transition-transform"
            >
              <Add className="w-8 h-8" />
            </button>
          </div>
          
          <button 
            onClick={() => setScreen('analytics')}
            className={cn("flex flex-col items-center gap-1.5 transition-all", screen === 'analytics' ? "text-primary scale-110" : "text-on-surface-variant opacity-60")}
          >
            <Analytics className="w-5 h-5" fill={screen === 'analytics'} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('data')}</span>
          </button>
          
          <button 
            onClick={() => setScreen('settings')}
            className={cn("flex flex-col items-center gap-1.5 transition-all", screen === 'settings' ? "text-primary scale-110" : "text-on-surface-variant opacity-60")}
          >
            <Settings className="w-5 h-5" fill={screen === 'settings'} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t('profile')}</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
