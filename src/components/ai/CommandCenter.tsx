import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Send, Sparkles, Terminal, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { parseNutritionText } from '../../lib/ai/nlpNutritionParser';
import { NutritionCard } from './NutritionCard';

type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  component?: React.ReactNode;
};

export const CommandCenter: React.FC = () => {
  const { isCommandCenterOpen, setCommandCenterOpen } = useAppStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Human Performance OS active. How can I assist with your physiology today? (Try: 'I just had beef pho')"
    }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandCenterOpen(!isCommandCenterOpen);
      }
      if (e.key === 'Escape') {
        setCommandCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  useEffect(() => {
    if (isCommandCenterOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandCenterOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI logic
    const aiResponseId = (Date.now() + 1).toString();
    
    if (input.toLowerCase().includes('had') || input.toLowerCase().includes('ate') || input.toLowerCase().includes('pho')) {
      const parsed = await parseNutritionText(input);
      setMessages(prev => [...prev, {
        id: aiResponseId,
        type: 'ai',
        content: "I've parsed your nutrition input. Does this look accurate?",
        component: <NutritionCard log={parsed} />
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: aiResponseId,
        type: 'ai',
        content: "Acknowledged. I am correlating that with your current CNS fatigue and caloric state. No trajectory shifts detected."
      }]);
    }
  };

  if (!isCommandCenterOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0a0a0c] border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                <Terminal size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Kratos Core</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">AI Sports Scientist Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCommandCenterOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Stream */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide scroll-smooth"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.type === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none' : 'space-y-3'}`}>
                  {msg.type === 'ai' && (
                    <div className="flex items-center space-x-2 text-blue-400 mb-1">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">OS Intelligence</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.component && (
                    <div className="mt-2 text-foreground">
                      {msg.component}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSend}
            className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center space-x-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Log nutrition, training, or ask for trajectory..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
            </div>
            <button
              type="submit"
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
