import React from 'react';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Diamond, CheckCircle, Bolt, Shield, Science, Waves, Analytics } from '../components/Icons';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const ProPlanScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const features = [
    { label: 'Real-time Satellite Indexing', icon: Analytics },
    { label: 'Hyper-local Weather Modeling', icon: Waves },
    { label: 'Expert Agronomist Live Chat', icon: Science },
    { label: 'Unlimited Historical Data', icon: Bolt },
    { label: 'Multi-farm Sector Management', icon: Shield },
    { label: 'Automated Irrigation Linking', icon: CheckCircle },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-emerald-950">
      <TopBar title="Upgrade to Pro" activeScreen="pro-plan" setScreen={setScreen} dark />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full scrollbar-hide py-16">
        <div className="text-center mb-20 space-y-6">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.3)] mb-8"
            >
                <Diamond className="w-10 h-10 text-emerald-950" fill />
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-headline font-black text-white tracking-tighter">AgriSense <span className="text-emerald-400">Pro</span></h1>
            <p className="text-emerald-100/60 text-xl max-w-2xl mx-auto leading-relaxed font-light">Unlock the full power of predictive agriculture with our enterprise-grade AI modeling suite.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm flex items-center gap-4 group hover:bg-white/10 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                            <feature.icon className="w-6 h-6" fill />
                        </div>
                        <span className="font-bold text-white tracking-tight">{feature.label}</span>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-4 bg-emerald-400 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden h-full">
                <div className="relative z-10 w-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950 opacity-60 mb-8 block">Subscription</span>
                    <div className="flex flex-col items-center mb-8">
                        <span className="text-emerald-950/40 font-bold mb-2">Annual Billing</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-headline font-black text-emerald-950 tracking-tighter">$299</span>
                            <span className="text-emerald-950/60 font-bold">/yr</span>
                        </div>
                    </div>
                    <div className="space-y-4 mb-10 w-full">
                        <div className="bg-emerald-950/10 p-3 rounded-2xl flex justify-between items-center px-6">
                            <span className="text-xs font-bold text-emerald-950">Discount Applied</span>
                            <span className="text-xs font-black text-emerald-950">-20%</span>
                        </div>
                    </div>
                    <button className="w-full py-5 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-2xl transition-all active:scale-95 shadow-xl">Start Pro Journey</button>
                    <p className="mt-6 text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest tracking-widest">30-day money back guarantee</p>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-3xl"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
