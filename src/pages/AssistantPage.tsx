import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('assistant_greeting') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: t('system_prompt_agri') },
            ...newMessages
          ]
        })
      });

      const data = await response.json();
      const reply = data.choices[0].message.content;
      
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: t('groq_error') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-mesh pb-24">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 glass sticky top-0 z-10 animate-fade-up">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center glow-green-sm" style={{ background: 'var(--green-soft)' }}>
            <Bot size={18} style={{ color: 'var(--green)' }} />
          </div>
          {t('ai_chatbot')}
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('powered_by_groq')}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={cn('flex gap-3 max-w-[85%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                 style={{ background: msg.role === 'user' ? 'var(--blue-soft)' : 'var(--green-soft)' }}>
              {msg.role === 'user' ? <User size={16} className="text-blue-500" /> : <Bot size={16} className="text-green-500" />}
            </div>
            <div className={cn('p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap', 
              msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'glass rounded-tl-sm text-gray-200')}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 mr-auto items-center text-gray-400 p-2">
            <Bot size={16} className="animate-pulse" /> <span className="text-xs animate-pulse">{t('thinking_probabilistically')}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#060d06]/80 backdrop-blur-md border-t border-white/5 absolute bottom-20 left-0 right-0">
        <div className="flex gap-2 relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('ask_placeholder')} 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 text-white placeholder-gray-500"
          />
          <button 
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-50 press"
            style={{ background: 'var(--green-soft)' }}
          >
            <Send size={18} className="text-green-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
