import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartToy, Help, WbSunny, WaterDrop, AddCircle, ImageIcon, Send, PottedPlant, Science } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { chatAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const AssistantScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      text: t('assistant_welcome'),
      time: '09:14 AM'
    }
  ]);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const generateResponses = (query: string) => {
    const condition = query.toLowerCase().includes('blight')
      ? t('leaf_blight_risk')
      : query.toLowerCase().includes('rust')
      ? t('rust_risk')
      : query.toLowerCase().includes('yellow')
      ? t('nutrient_deficiency')
      : t('crop_health_issue');

    return [
      {
        model: 'ResNet50',
        title: t('resnet_model'),
        summary: t('resnet_summary', { condition }),
        confidence: 84,
        badge: t('local_model'),
      },
      {
        model: 'Blackgram',
        title: t('blackgram_model'),
        summary: t('blackgram_summary', { condition }),
        confidence: 79,
        badge: t('regional_model'),
      },
      {
        model: 'Gemini',
        title: t('gemini_model'),
        summary: t('gemini_summary', { condition }),
        confidence: 82,
        badge: t('cloud_ai'),
      },
    ];
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const userMsg = { role: 'user', text: inputText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const fallbackCards = generateResponses(inputText);
      const response = await chatAPI.sendMessage(inputText);
      let cards = fallbackCards;
      let assistantText = t('assistant_response_card_intro');

      if (response?.cards?.length) {
        cards = response.cards;
      } else if (response?.modelResponses?.length) {
        cards = response.modelResponses;
      } else if (typeof response?.message === 'string') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: response.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: assistantText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cards,
      }]);
    } catch (err: any) {
      const cards = generateResponses(inputText);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: t('assistant_response_card_intro'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cards,
      }] );
    } finally {
      setLoading(false);
    }
  };

  const triggerAction = (action: string) => {
    if (action === 'Activate Irrigation') {
      setIsIrrigating(true);
      setShowNotification("Irrigation sequence activated for Sector B-12");
      setTimeout(() => setShowNotification(null), 3000);
    } else if (action === 'Compare with Sector A') {
      setScreen('analysis');
    } else if (action === 'Schedule Manual Check') {
      setShowNotification("Manual inspection scheduled for 2:00 PM today");
      setTimeout(() => setShowNotification(null), 3000);
    }
  };
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('assistant_session')} activeScreen="assistant" setScreen={setScreen} />
      
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8 max-w-4xl mx-auto w-full scrollbar-hide">
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            layout
            initial={{ opacity: 0, x: m.role === 'assistant' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={m.role === 'assistant' ? { scale: 1.005 } : undefined}
            transition={{ duration: 0.25 }}
            className={cn(
              "flex items-start gap-4 max-w-[85%]",
              m.role === 'user' && "self-end flex-row-reverse"
            )}
          >
            {m.role === 'assistant' ? (
              <div className="w-10 h-10 shrink-0 rounded-full signature-gradient flex items-center justify-center shadow-sm">
                <SmartToy className="text-white w-6 h-6" fill />
              </div>
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="User" />
              </div>
            )}
            <div className={cn(
              "flex flex-col gap-2",
              m.role === 'user' && "items-end"
            )}>
              <div className={cn(
                "p-5 rounded-2xl shadow-sm bg-surface-container-lowest leading-relaxed",
                m.role === 'assistant' ? "rounded-tl-none border border-emerald-900/5" : "bg-primary text-on-primary rounded-tr-none"
              )}>
                 {m.text}
                 {m.cards && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {m.cards.map((card: any, idx: number) => (
                      <motion.div key={idx} whileHover={{ y: -4, boxShadow: '0 20px 45px rgba(16, 185, 129, 0.08)' }} transition={{ duration: 0.2 }} className="rounded-3xl border border-emerald-900/5 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-emerald-600">{card.model}</p>
                            <h3 className="text-sm font-semibold text-emerald-950">{card.title}</h3>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">{card.badge}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant mb-4">{card.summary}</p>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] font-semibold text-emerald-600">
                          <span>{t('confidence')}</span>
                          <span>{card.confidence}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-semibold">{m.time}</span>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 shrink-0 rounded-full signature-gradient flex items-center justify-center shadow-sm animate-pulse">
              <SmartToy className="text-white w-6 h-6" fill />
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-lowest p-5 rounded-2xl rounded-tl-none border border-emerald-900/5 shadow-sm text-on-surface-variant flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Input Section */}
      <div className="p-6 bg-surface-container-low/40 backdrop-blur-md border-t border-emerald-900/5">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('crop-health')}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-emerald-900/5 rounded-full text-xs font-semibold text-emerald-900 whitespace-nowrap hover:shadow-sm transition-all"
            >
              <PottedPlant className="w-4 h-4" />
              {t('check_crop_disease')}
            </motion.button>
            <button 
              onClick={() => setScreen('weather')}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-emerald-900/5 rounded-full text-xs font-semibold text-emerald-900 whitespace-nowrap hover:shadow-sm transition-all"
            >
              <WbSunny className="w-4 h-4" />
              {t('get_weather_info')}
            </button>
            <button 
              onClick={() => setScreen('analysis')}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-emerald-900/5 rounded-full text-xs font-semibold text-emerald-900 whitespace-nowrap hover:shadow-sm transition-all"
            >
              <Science className="w-4 h-4" />
              {t('soil_health_tips')}
            </button>
          </div>

          <motion.div className="relative group" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="absolute inset-0 bg-emerald-900/5 rounded-2xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100"></div>
            <motion.div whileHover={{ scale: 1.005 }} className="relative flex items-center bg-surface-container-lowest border border-emerald-900/10 p-2 pl-4 rounded-2xl shadow-sm">
              <button className="p-2 text-on-surface-variant hover:text-emerald-900 transition-colors">
                <AddCircle className="w-6 h-6" />
              </button>
              <button className="p-2 text-on-surface-variant hover:text-emerald-900 transition-colors mr-2">
                <ImageIcon className="w-6 h-6" />
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ask_about_crop_diseases')}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/50 py-3"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="ml-2 w-12 h-12 flex items-center justify-center signature-gradient text-white rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Send className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </motion.div>
          <p className="text-[10px] text-center text-on-surface-variant/40 font-medium">{t('translation_warning')}</p>
        </div>
      </div>
      {/* Simple Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[100] flex items-center gap-3 border border-emerald-400/20"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {showNotification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
