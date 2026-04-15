import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User, Copy, Check, Sparkles, Languages } from 'lucide-react';
import { cn } from '../lib/utils';

interface LLMResponse {
  model: string;
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  responses?: LLMResponse[];
  rag_used?: boolean;
  rag_context_length?: number;
  raw_context?: string;
}

const MODEL_COLORS: Record<string, string> = {
  'llama3-8b': 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
  'llama3-70b': 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
  'qwen3': 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  'allam2': 'from-orange-500/20 to-yellow-500/20 text-orange-400 border-orange-500/30',
  'default': 'from-gray-500/20 to-slate-500/20 text-gray-400 border-gray-500/30'
};

export default function AssistantPage() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('assistant_welcome', 'Hello! I am your AI Agri-Assistant. I can help you with crop health, pest management, and farming best practices in multiple languages.') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<{msg: number, resp: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderFormattedText = (text: string) => {
    // Basic markdown-like formatting
    return text
      .split('\n')
      .map((line, i) => {
        // Handle headers (**text**)
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h3 key={i} className="font-bold text-white mb-2 text-base">{line.slice(2, -2)}</h3>;
        }
        // Handle bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
        // Handle italic text
        line = line.replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>');
        // Handle bullet points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return <li key={i} className="ml-4 text-gray-200" dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />;
        }
        // Handle numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          const num = line.match(/^\d+/)?.[0];
          const content = line.replace(/^\d+\.\s/, '');
          return <li key={i} className="ml-4 text-gray-200" dangerouslySetInnerHTML={{ __html: `${num}. ${content}` }} />;
        }
        // Regular paragraphs
        if (line.trim()) {
          return <p key={i} className="mb-2 text-gray-200" dangerouslySetInnerHTML={{ __html: line }} />;
        }
        return <br key={i} />;
      });
  };

  const copyToClipboard = async (text: string, msgIdx: number, respIdx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex({ msg: msgIdx, resp: respIdx });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const currentLang = i18n.language.split('-')[0]; // Handle cases like 'en-US'
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/rag-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          lang: ['en', 'hi', 'mr'].includes(currentLang) ? currentLang : 'en'
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        responses: data.responses,
        rag_used: data.rag_used,
        rag_context_length: data.rag_context_length,
        raw_context: data.raw_context
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chat_error', 'I encountered an error connecting to the AgriSense engine. Please check your connection.') 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-mesh pb-32">
      {/* Header */}
      <div className="px-6 pt-16 pb-6 glass sticky top-0 z-10 animate-fade-in border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-green-sm bg-green-500/10 border border-green-500/20">
                <Bot size={22} className="text-green-400" />
              </div>
              {t('ai_assistant', 'AI Assistant')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-green-500/80">Multi-Model Engine Active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
               onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : i18n.language === 'hi' ? 'mr' : 'en')}>
            <Languages size={14} className="text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-white/70">
              {i18n.language.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scroll-smooth">
        {messages.map((msg, index) => (
          <div key={index} className={cn('flex flex-col gap-3', msg.role === 'user' ? 'items-end' : 'items-start')}>
            {/* Role Header */}
            <div className={cn('flex items-center gap-2 px-1', msg.role === 'user' ? 'flex-row-reverse' : '')}>
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', 
                msg.role === 'user' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20')}>
                {msg.role === 'user' ? <User size={12} className="text-blue-400" /> : <Bot size={12} className="text-green-400" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {msg.role === 'user' ? t('you', 'You') : t('agrisense', 'AgriSense')}
              </span>
              {msg.role === 'assistant' && msg.rag_used && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Sparkles size={8} className="text-blue-400" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-blue-400">RAG</span>
                </div>
              )}
            </div>

            {/* Content */}
            {msg.role === 'user' || msg.content ? (
              <div className={cn('max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap animate-scale-in', 
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10 rounded-tr-none border border-blue-400/20' 
                  : 'glass text-gray-200 rounded-tl-none border-white/10 shadow-xl')}>
                {msg.content}
              </div>
            ) : (
              <div className="space-y-4 w-full max-w-[95%]">
                <div className="grid grid-cols-1 gap-4">
                  {msg.responses?.map((r, i) => (
                    <div key={i} className="group relative glass-bright rounded-2xl p-5 border-white/10 shadow-2xl animate-fade-up overflow-hidden" 
                         style={{ animationDelay: `${i * 150}ms` }}>
                      {/* Background Accent */}
                      <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 bg-gradient-to-br', 
                        (MODEL_COLORS[r.model] || MODEL_COLORS.default).split(' ')[0])} />

                      <div className="flex items-center justify-between mb-4">
                        <div className={cn('flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r', 
                          MODEL_COLORS[r.model] || MODEL_COLORS.default)}>
                          <Sparkles size={10} />
                          {r.model}
                        </div>
                        
                        <button 
                          onClick={() => copyToClipboard(r.text, index, i)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all press"
                        >
                          {copiedIndex?.msg === index && copiedIndex?.resp === i ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div className="text-sm leading-relaxed text-gray-200 relative z-10">
                        {renderFormattedText(r.text)}
                      </div>
                    </div>
                  ))}
                </div>

                {msg.raw_context && msg.rag_used && (
                  <details className="group w-full p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all backdrop-blur-sm">
                    <summary className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-blue-300 group-open:text-blue-100 mb-3 select-none">
                      <Sparkles size={16} className="text-blue-400 flex-shrink-0" />
                      📚 Sources ({msg.raw_context.split('\n').filter(l => l.trim()).length} documents)
                      <span className="ml-auto text-xs opacity-70">(click to expand)</span>
                    </summary>
                    <div className="ml-6 text-xs space-y-1.5 text-gray-300 max-h-40 overflow-y-auto pr-2">
                      {msg.raw_context.split('\n').map((line, i) => (
                        line.trim() && (
                          <div key={i} className="pl-3 py-1.5 rounded border-l-4 border-blue-500/30 bg-white/2 hover:bg-white/5 transition-colors">
                            {line}
                          </div>
                        )
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-3 items-start animate-fade-in">
             <div className="flex items-center gap-2 px-1">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-green-500/10 border border-green-500/20">
                <Bot size={12} className="text-green-400 animate-spin-slow" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 animate-pulse">
                {t('thinking', 'Neural processing...')}
              </span>
            </div>
            <div className="flex gap-2 p-4 glass rounded-2xl rounded-tl-none border-white/10 min-w-[120px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-wave" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-wave" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-wave" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="px-4 py-8 bg-gradient-to-t from-[#060d06] via-[#060d06]/95 to-transparent absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-[22px] blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
          <div className="relative flex gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-2 pr-3 shadow-2xl focus-within:border-green-500/40 transition-all">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t('ask_placeholder', 'How can I protect my wheat from rust?')} 
              className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none text-white placeholder-white/20"
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-[14px] flex items-center justify-center disabled:opacity-30 press transition-all shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
              style={{ background: 'linear-gradient(135deg, var(--green), var(--green-dim))' }}
            >
              <Send size={18} className="text-[#060d06]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
