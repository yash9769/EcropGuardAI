import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Close, ChevronRight } from './Icons';

export const AdvisoryBanner = ({ userId }: { userId?: string }) => {
  const [advisory, setAdvisory] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!userId || !supabase?.channel) return;

    // Listen to real-time advisory broadcast
    const channel = supabase.channel(`advisories:${userId}`);
    
    channel.on('broadcast', { event: 'new_advisory' }, (payload: any) => {
      console.log('Realtime Advisory received:', payload);
      if (payload?.payload?.advisory) {
        setAdvisory(payload.payload.advisory);
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!advisory) return null;

  const isCritical = advisory.severity === 'critical' || advisory.severity === 'high';

  return (
    <>
      <AnimatePresence>
        {!showDetail && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl bg-surface/90 backdrop-blur-3xl border ${isCritical ? 'border-error/20 shadow-error/10' : 'border-emerald-900/10 shadow-emerald-900/10'} shadow-2xl rounded-[2rem] p-4 flex items-center gap-4 cursor-pointer hover:bg-surface/95 transition-all`}
            onClick={() => setShowDetail(true)}
          >
            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${isCritical ? 'bg-error-container text-on-error-container' : 'bg-warning-container text-on-warning-container'} shadow-inner`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-on-surface truncate pr-2">{advisory.title}</h4>
              <p className="text-xs text-on-surface-variant truncate pr-2 mt-0.5">{advisory.body}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setAdvisory(null); }}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center shrink-0 transition-colors"
            >
              <Close className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-surface rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowDetail(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                  <Close className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6 flex items-center gap-3">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isCritical ? 'bg-error-container text-on-error-container' : 'bg-warning-container text-on-warning-container'}`}>
                    <AlertCircle className="w-7 h-7" />
                 </div>
                 <div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'text-error' : 'text-warning'}`}>
                       {advisory.severity} Alert
                    </span>
                 </div>
              </div>

              <h2 className="text-2xl font-headline font-bold text-primary mb-4 leading-tight">{advisory.title}</h2>
              
              <div className="bg-surface-container-low p-6 rounded-3xl mb-8">
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">{advisory.body}</p>
              </div>
              
              <button 
                onClick={() => { setShowDetail(false); setAdvisory(null); }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Acknowledge & Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
