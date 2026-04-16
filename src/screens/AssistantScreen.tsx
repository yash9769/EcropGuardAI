import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartToy, Send, ImageIcon, Science, PottedPlant, WbSunny } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { AgriResponseCard } from '../components/AgriResponseCard';
import { type Screen } from '../components/Sidebar';
import { ragAPI, ChatResponse } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// --- Language label map ---
const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };

// --- Quick suggestion chips ---
const SUGGESTIONS = [
  { emoji: '🍇', text: 'Bhuri in grapes' },
  { emoji: '🍅', text: 'Tomato leaf spots' },
  { emoji: '🌾', text: 'Rice pest control' },
  { emoji: '🧅', text: 'Onion downy mildew' },
  { emoji: '🌽', text: 'Corn fungal disease' },
];

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  // Structured data for assistant messages
  structured?: {
    best_answer: string;
    confidence: number;
    mode: 'rag' | 'fallback';
    answers?: { llama?: string; mixtral?: string };
    sources?: any[];
    detectedIntent?: string;
  };
}

// Simple intent detector
function detectIntent(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('grape') || q.includes('द्राक्ष')) return 'Disease → Grapes';
  if (q.includes('tomato') || q.includes('टमाटर')) return 'Disease → Tomato';
  if (q.includes('rice') || q.includes('wheat') || q.includes('धान')) return 'Pest → Cereal crop';
  if (q.includes('soil') || q.includes('मिट्टी')) return 'Soil health';
  if (q.includes('fertilizer') || q.includes('खाद')) return 'Fertilizer advice';
  if (q.includes('pest') || q.includes('insect')) return 'Pest control';
  if (/disease|rog|mildew|blight|rust|spot/i.test(q)) return 'Disease query';
  return '';
}

interface AssistantScreenProps {
  setScreen: (s: Screen) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

let msgId = 0;

export const AssistantScreen = ({
  setScreen, messages, setMessages, selectedModel, setSelectedModel
}: AssistantScreenProps) => {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryPayload, setRetryPayload] = useState<{ query: string; lang: string } | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = i18n.language?.split('-')[0] || 'en';
  const langLabel = LANG_LABELS[lang] || 'English';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: ++msgId,
        role: 'assistant',
        text: `🌱 Namaste! I'm your AI Agronomist. Ask me about diseases, pests, soil, or fertilizers. I speak **${langLabel}**.`,
        time: now(),
      }]);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserLocation(`${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}`);
    });
  }, []);

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleSend = async (overrideText?: string) => {
    const query = (overrideText ?? inputText).trim();
    if (!query || loading) return;

    const detectedIntent = detectIntent(query);
    const userMsg: Message = { id: ++msgId, role: 'user', text: query, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setRetryPayload(null);

    try {
      // Language mapping: send full language name to backend
      const langMap: Record<string, string> = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
      const displayLang = langMap[lang] || 'English';

      const response: ChatResponse = await ragAPI.sendMessage(query, displayLang, userLocation || undefined);

      const assistantMsg: Message = {
        id: ++msgId,
        role: 'assistant',
        text: response.best_answer,
        time: now(),
        structured: {
          best_answer: response.best_answer,
          confidence: response.confidence,
          mode: (response as any).mode || (response.confidence >= 0.8 ? 'rag' : 'fallback'),
          answers: {
            llama: response.answers?.llama,
            mixtral: response.answers?.mixtral,
          },
          sources: response.sources || [],
          detectedIntent: detectedIntent || undefined,
        },
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('API Error:', err);
      setRetryPayload({ query, lang });
      setMessages(prev => [...prev, {
        id: ++msgId,
        role: 'assistant',
        text: '⚠️ Connection issue. Tap **Retry** to try again.',
        time: now(),
        structured: {
          best_answer: '⚠️ Connection issue. Tap Retry to try again.',
          confidence: 0,
          mode: 'fallback',
        },
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryPayload) {
      handleSend(retryPayload.query);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <TopBar title="Ask AI Agronomist" activeScreen="assistant" setScreen={setScreen} />

      {/* Language indicator bar */}
      <div className="bg-surface-container-low/80 backdrop-blur-md border-b border-emerald-900/5 px-6 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Responding in</span>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            🌐 {langLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-full border border-emerald-900/5">
          {(['en', 'hi', 'mr'] as const).map(l => (
            <button
              key={l}
              onClick={() => i18n.changeLanguage(l)}
              className={cn(
                'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all',
                lang === l ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:bg-emerald-50'
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-5 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex items-end gap-3', m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start')}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0',
                m.role === 'assistant' ? 'signature-gradient' : 'bg-emerald-100 border border-emerald-200'
              )}>
                {m.role === 'assistant'
                  ? <SmartToy className="text-white w-4 h-4" fill />
                  : <span className="text-emerald-700 text-xs font-black">Y</span>
                }
              </div>

              {/* Content */}
              <div className={cn('max-w-[88%] sm:max-w-[78%]', m.role === 'user' && 'items-end flex flex-col')}>
                {m.role === 'user' ? (
                  // User message — simple pill
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm">
                    {m.text}
                  </div>
                ) : m.structured ? (
                  // Assistant message — full structured card
                  <AgriResponseCard
                    best_answer={m.structured.best_answer}
                    confidence={m.structured.confidence}
                    mode={m.structured.mode}
                    answers={m.structured.answers}
                    sources={m.structured.sources}
                    detectedIntent={m.structured.detectedIntent}
                    time={m.time}
                  />
                ) : (
                  // Welcome / simple text message
                  <div className="bg-white border border-emerald-900/5 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-on-surface shadow-sm leading-relaxed">
                    {m.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                )}

                {/* Retry button */}
                {retryPayload && m.role === 'assistant' && m.id === messages[messages.length - 1]?.id && (
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                  >
                    🔄 Retry
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex items-end gap-3 self-start">
              <div className="w-8 h-8 rounded-full signature-gradient flex items-center justify-center shadow-sm animate-pulse shrink-0">
                <SmartToy className="text-white w-4 h-4" fill />
              </div>
              <div className="bg-white border border-emerald-900/5 rounded-2xl rounded-tl-sm p-4 shadow-sm flex flex-col gap-2 w-64">
                <div className="h-2.5 bg-emerald-100 rounded-full animate-pulse w-3/4" />
                <div className="h-2.5 bg-emerald-50 rounded-full animate-pulse w-full" />
                <div className="h-2.5 bg-emerald-50 rounded-full animate-pulse w-5/6" />
                <p className="text-[10px] text-on-surface-variant/60 mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="ml-1">Analysing...</span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 sm:p-5 bg-surface-container-low/40 border-t border-emerald-900/5">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide no-scrollbar">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-900 whitespace-nowrap hover:bg-emerald-50 hover:shadow-sm transition-all shadow-xs"
                >
                  {s.emoji} {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Quick nav chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide no-scrollbar">
            <button
              onClick={() => setScreen('crop-health')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-900/5 rounded-full text-[11px] font-bold text-on-surface-variant whitespace-nowrap hover:bg-surface-container transition-colors"
            >
              <PottedPlant size={12} /> Scan Crop
            </button>
            <button
              onClick={() => setScreen('weather')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-900/5 rounded-full text-[11px] font-bold text-on-surface-variant whitespace-nowrap hover:bg-surface-container transition-colors"
            >
              <WbSunny size={12} /> Weather
            </button>
            <button
              onClick={() => setScreen('soil-metrics')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-900/5 rounded-full text-[11px] font-bold text-on-surface-variant whitespace-nowrap hover:bg-surface-container transition-colors"
            >
              <Science size={12} /> Soil Analysis
            </button>
          </div>

          {/* Text input */}
          <div className="bg-white border border-emerald-900/10 p-1.5 pl-4 rounded-2xl shadow-premium focus-within:border-primary/40 transition-all flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about disease, pests, fertilizer..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 outline-none text-on-surface placeholder:text-on-surface-variant/40"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || loading}
              className="w-11 h-11 flex items-center justify-center signature-gradient text-white rounded-xl shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-40"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
