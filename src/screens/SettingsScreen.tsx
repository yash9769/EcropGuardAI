import React from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Settings as SettingsIcon, Mail, Lock, Shield, Bolt, Help, ChevronRight, CheckCircle } from '../components/Icons';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const SettingsScreen = ({ setScreen, user, profile, onUpdateProfile, signOut }: { setScreen: (s: Screen) => void, user: any, profile: any, onUpdateProfile: any, signOut: () => Promise<void> }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(!user);

  React.useEffect(() => {
    if (!user) {
        setLoading(false);
    }
  }, [user]);


  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setLoading(false);
    }
  };

  const displayLocation = profile?.location ?? user?.location ?? 'Global';
  const displayName = user?.name ?? 'User';
  const displayInitial = user?.name?.[0] ?? 'U';
  const displayEmail = user?.email ?? t('no_email');
  const [activeSection, setActiveSection] = React.useState<'account' | 'field' | 'notifications' | 'privacy'>('account');
  const [profileForm, setProfileForm] = React.useState({
    name: displayName,
    location: displayLocation,
    emailNotifications: true,
    harvestAlerts: true,
    privacyMode: false,
  });

  React.useEffect(() => {
    setProfileForm({
      name: displayName,
      location: displayLocation,
      emailNotifications: true,
      harvestAlerts: true,
      privacyMode: false,
    });
  }, [displayName, displayLocation]);

  if (loading) return <div className="p-20 text-center animate-pulse">{t('synchronizing_tokens')}</div>;

  const sections = [
    { id: 'account', title: t('account_settings'), desc: displayEmail, icon: SettingsIcon },
    { id: 'field', title: t('field_parameters'), desc: t('location', { location: displayLocation }), icon: Bolt },
    { id: 'notifications', title: t('notifications'), desc: t('customized_harvest'), icon: Help },
    { id: 'privacy', title: t('privacy_security'), desc: t('encryption_active'), icon: Shield },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('system_settings')} activeScreen="settings" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-12 scrollbar-hide">
        <div className="flex items-center gap-8 mb-12">
            <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
<div className="text-4xl font-headline font-black text-emerald-800">{displayInitial}</div>
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                    <CheckCircle className="w-4 h-4" />
                </button>
            </div>
            <div>
<h2 className="text-3xl font-headline font-black text-primary">{displayName}</h2>
                <p className="text-on-surface-variant font-medium">Farmer · {displayLocation}</p>
                <div className="mt-2 flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-900/5">{t('verified_node')}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center justify-between p-6 bg-surface-container-lowest rounded-3xl border border-emerald-900/5 transition-all group text-left",
                    activeSection === section.id ? "bg-emerald-50/80 shadow-md border-emerald-900/20" : "hover:bg-emerald-50/50"
                  )}
                >
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary transition-all",
                            activeSection === section.id ? "bg-primary text-white" : "group-hover:bg-primary group-hover:text-white"
                        )}>
                            <section.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-headline font-bold text-lg text-on-surface">{section.title}</h3>
                            <p className="text-sm text-on-surface-variant font-medium">{section.desc}</p>
                        </div>
                    </div>
                    <ChevronRight className={cn("w-6 h-6 text-outline transition-all", activeSection === section.id ? "text-primary translate-x-1" : "group-hover:text-primary group-hover:translate-x-1")} />
                </button>
            ))}
        </div>

        <div className="mt-8 p-8 rounded-3xl bg-surface-container-lowest border border-emerald-900/5 shadow-sm">
          <h3 className="text-2xl font-headline font-black text-primary mb-4">
            {sections.find((section) => section.id === activeSection)?.title}
          </h3>
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">{t('name')}</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-3xl border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">{t('email_address')}</label>
                <input
                  value={displayEmail}
                  disabled
                  className="w-full rounded-3xl border border-emerald-900/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant outline-none"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onUpdateProfile({ name: profileForm.name });
                  } catch (error) {
                    console.error('Profile save failed', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-3 bg-primary text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-800 transition-colors"
              >
                {t('save_changes')}
              </button>
            </div>
          )}

          {activeSection === 'field' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">{t('location_label')}</label>
                <input
                  value={profileForm.location}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-3xl border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onUpdateProfile({ location: profileForm.location });
                  } catch (error) {
                    console.error('Profile save failed', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-3 bg-primary text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-800 transition-colors"
              >
                {t('save_changes')}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-3xl border border-emerald-900/10 bg-white/80 p-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('email_notifications')}</p>
                  <p className="text-xs text-on-surface-variant">{t('receive_updates')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.emailNotifications}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="h-5 w-5 accent-primary"
                />
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-emerald-900/10 bg-white/80 p-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('harvest_alerts')}</p>
                  <p className="text-xs text-on-surface-variant">{t('customized_harvest')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.harvestAlerts}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, harvestAlerts: e.target.checked }))}
                  className="h-5 w-5 accent-primary"
                />
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4">
                <p className="text-sm font-bold text-on-surface">{t('privacy_mode')}</p>
                <p className="text-xs text-on-surface-variant">{t('encryption_active')}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm">{t('privacy_mode')}</span>
                  <input
                    type="checkbox"
                    checked={profileForm.privacyMode}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, privacyMode: e.target.checked }))}
                    className="h-5 w-5 accent-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-outline-variant/10">
            <button 
                onClick={handleLogout}
                className="px-8 py-4 bg-error-container text-on-error-container rounded-2xl font-bold flex items-center gap-3 hover:bg-error transition-colors shadow-sm"
            >
                {t('log_out')}
            </button>
        </div>
      </div>
    </div>
  );
};
