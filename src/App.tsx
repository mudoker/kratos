import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { ClinicalDashboard } from './components/dashboard/ClinicalDashboard';
import { CommandCenter } from './components/ai/CommandCenter';
import { AgenticOverlays } from './components/ai/AgenticOverlays';
import { haptics } from './lib/ui/feedback';
import { Shield, Sparkles } from 'lucide-react';

function App() {
  const { setCommandCenterOpen,  } = useAppStore();

  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      // Shift + W to toggle active workout (demo)
      if (e.shiftKey && e.key.toLowerCase() === 'w') {
        haptics.tap();
        console.log("OS: Workout context requested via hotkey");
      }
      if (e.key === 'Escape') {
        setCommandCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [setCommandCenterOpen]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans">
      {/* Navigation / Header */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl">
        <div className="flex items-center space-x-3 group cursor-default">
           <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
             <Shield size={20} fill="white" />
           </div>
           <div>
             <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-tight">Kratos</h1>
             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Human Perf. OS v1.0</p>
           </div>
        </div>

        <div className="flex items-center space-x-6">
           <button 
             onClick={() => { haptics.tap(); setCommandCenterOpen(true); }}
             className="flex items-center space-x-3 bg-white/[0.03] border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all group active:scale-95"
           >
              <div className="flex items-center -space-x-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cmd</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">+</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">K</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center space-x-2">
                <Sparkles size={14} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Command</span>
              </div>
           </button>
           
           <div className="hidden md:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none">Status</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500 leading-none mt-1">Primed</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 border border-white/10" />
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pb-20">
        <ClinicalDashboard />
      </main>

      {/* Overlays */}
      <CommandCenter />
      <AgenticOverlays />

      {/* Global Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
    </div>
  );
}

export default App;
