import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Send, Sparkles, Terminal, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { parseNutritionText } from '../../lib/ai/nlpNutritionParser';
import { NutritionCard } from './NutritionCard';
import { PhysiqueSimulator } from './PhysiqueSimulator';
import { Button } from '../ui/Primitives';

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
      content: "Human Performance OS active. Protocol: Natural Language Intake. How can I assist?"
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
      if (e.key === 'Escape') setCommandCenterOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  useEffect(() => {
    if (isCommandCenterOpen && inputRef.current) inputRef.current.focus();
  }, [isCommandCenterOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    const aiResponseId = (Date.now() + 1).toString();
    
    if (currentInput.toLowerCase().includes('simulate') || currentInput.toLowerCase().includes('physique') || currentInput.toLowerCase().includes('future')) {
      setMessages(prev => [...prev, {
        id: aiResponseId,
        type: 'ai',
        content: "Initializing Trajectory Matrix. You can now adjust the ghost layer parameters:",
        component: <PhysiqueSimulator />
      }]);
    } else {
      const parsed = await parseNutritionText(currentInput);
      setMessages(prev => [...prev, {
        id: aiResponseId,
        type: 'ai',
        content: (parsed.confidence ?? 0) > 0.5 ? "Macros derived from biological intake data:" : "I couldn't find a precise match. Here is my best estimate:",
        component: <NutritionCard log={parsed} />
      }]);
    }
  };

  if (!isCommandCenterOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-md">
        <div className="absolute inset-0" onClick={() => setCommandCenterOpen(false)} />
        
        <motion.div
          layoutId="command-center"
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative bg-[#0a0a0c] border-t sm:border border-white/10 w-full max-w-4xl rounded-t-[2rem] sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[700px]"
        >
          <div className="sm:hidden w-full flex justify-center py-3">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Kratos Intelligence</h3>
                <span className="text-[10px] text-green-500 uppercase font-black tracking-tighter animate-pulse">Neural Link Active</span>
              </div>
            </div>
            <button onClick={() => setCommandCenterOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[95%] ${msg.type === 'user' ? 'bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg' : 'space-y-4 w-full'}`}>
                  {msg.type === 'ai' && (
                    <div className="flex items-center space-x-2 text-blue-400 mb-1">
                      <Terminal size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Agentic Stream</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                  {msg.component && <div className="mt-2">{msg.component}</div>}
                </div>
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 sm:p-6 bg-white/[0.02] border-t border-white/5 flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Log meal, query status, or target goal..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <Button type="submit" className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-blue-500/20">
              <Send size={20} />
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
