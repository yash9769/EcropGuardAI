import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User, ChevronLeft, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { queryKnowledgeBase } from '../lib/ragService';
import { useAuth } from '../hooks/useAuth';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Agri-Assistant powered by Groq and your private research library. I use RAG, Neural Networks, and Probabilistic concepts to answer your agriculture queries. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Better scrolling with a small delay for DOM updates
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading, searching]);

  // Simple Markdown-lite renderer to handle bold and lists without adding dependencies
  const renderContent = (content: string) => {
    // Detect image request (e.g. if the AI mentions a specific crop/disease)
    const renderWithImages = (text: string) => {
      // Split into paragraphs
      return text.split('\n').map((line, i) => {
        let processed = line;
        
        // Handle bold: **text**
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle bullet points: * text
        if (processed.trim().startsWith('* ')) {
          return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed.trim().substring(2) }} />;
        }

        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: processed }} />;
      });
    };

    return <div className="space-y-1">{renderWithImages(content)}</div>;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // 1. Retrieve Context from Knowledge Base (RAG)
      setSearching(true);
      const context = await queryKnowledgeBase(userMessage, 5, profile?.state);
      setSearching(false);

      // 2. Build Augmented Prompt
      const systemPrompt = `You are AgriSense, an advanced agricultural AI. 
      The user is located in ${profile?.state || 'India'}.
      
      You have access to a repository of specialized agricultural research and technical reports.
      
      ${context 
        ? `Here is RELEVANT CONTEXT from your private research library regarding the user's query:
           ---
           ${context}
           ---
           Use the above information to provide a highly accurate, technical, and grounded answer specific to the user's region (${profile?.state || 'India'}). 
           If the context doesn't contain the answer, use your general knowledge but prioritize the provided snippets.`
        : "No specific research context found. Answer using your general agricultural expertise (Soft Computing, Fuzzy Logic, PGMs)."
      }
      
      Maintain a professional, helpful, and scientific tone. Use local terminology (like 'Bhuri' for Powdery Mildew in Maharashtra) if appropriate.`;

      // 3. Call Groq with Augmented Context
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const reply = data.choices[0].message.content;
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the Groq Neural Network.' }]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-mesh pb-32">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 glass sticky top-0 z-10 animate-fade-up">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center glow-green-sm" style={{ background: 'var(--green-soft)' }}>
            <Bot size={18} style={{ color: 'var(--green)' }} />
          </div>
          AI Chatbot
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Powered by Groq ⚡ & Private Research Context</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-40">
        {messages.map((msg, index) => (
          <div key={index} className={cn('flex gap-3 max-w-[90%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                 style={{ background: msg.role === 'user' ? 'var(--blue-soft)' : 'var(--green-soft)' }}>
              {msg.role === 'user' ? <User size={16} className="text-blue-500" /> : <Bot size={16} className="text-green-500" />}
            </div>
            <div className="space-y-2 flex-1">
              <div className={cn('p-4 rounded-2xl text-sm leading-relaxed shadow-sm', 
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'glass-dark rounded-tl-sm text-gray-200 border border-white/5')}>
                {renderContent(msg.content)}
              </div>
              
              {/* IMAGE DISPLAY: Dynamic Reference image with robust fallbacks */}
              {msg.role === 'assistant' && index === messages.length - 1 && !loading && (
                <div className="mt-2 rounded-xl overflow-hidden glass border border-white/5 animate-fade-in max-w-sm">
                  {(() => {
                    const keywords = msg.content.match(/(Bhuri|Bhurud|Powdery Mildew|Blight|Wilt|Sorghum|Chickpea|Wheat)/i)?.[0] || 'agriculture';
                    return (
                      <img 
                        src={`https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600&sig=${index}`}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600';
                        }}
                        className="w-full h-44 object-cover"
                        alt="Crop reference"
                      />
                    );
                  })()}
                  <div className="p-2 text-[10px] text-gray-400 bg-black/60 backdrop-blur-md italic flex items-center justify-between">
                    <span className="flex items-center gap-1"><Search size={10} /> Research Library Context...</span>
                    <span className="text-[9px] opacity-70">{profile?.state || 'Maharashtra'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {searching && (
          <div className="flex gap-3 mr-auto items-center text-blue-400 p-2 animate-pulse">
            <Search size={16} /> <span className="text-xs">Searching research papers...</span>
          </div>
        )}
        {loading && !searching && (
          <div className="flex gap-3 mr-auto items-center text-gray-400 p-2">
            <Bot size={16} className="animate-pulse" /> <span className="text-xs animate-pulse">Analyzing context & thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-20" />
      </div>

      {/* Input - Positioned ABOVE the BottomNav */}
      <div className="px-4 py-3 bg-[#060d06]/95 backdrop-blur-2xl border-t border-white/10 fixed bottom-[72px] left-0 right-0 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2 max-w-4xl mx-auto items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && input.trim()) {
                sendMessage();
              }
            }}
            placeholder="Ask anything about crops..." 
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-green-500/50 text-white placeholder-gray-500 shadow-inner transition-all focus:bg-white/[0.05]"
          />
          <button 
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-30 press shadow-lg transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--green-soft) 0%, rgba(34, 197, 94, 0.1) 100%)' }}
          >
            <Send size={20} className="text-green-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
