import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, parseJsonResponse } from '../lib/utils';
import { TrendingUp, AlertCircle, Info } from './Icons';

type MarketConfig = {
  commodity: string;
  state: string;
  district?: string;
};

export const MarketPriceWidget = ({ district }: { district?: string }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commodity, setCommodity] = useState('Cotton'); // Default

  useEffect(() => {
    let active = true;
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          commodity,
          state: 'Maharashtra',
        });
        if (district) {
          queryParams.append('district', district);
        }
        
        // Fast fallback to static generic data if the API gets blocked/rate-limited
        const resp = await fetch(`/api/market/prices?${queryParams.toString()}`);
        if (!resp.ok) throw new Error('API Error');
        const result = await parseJsonResponse<any>(resp);
        
        if (active && result && result.prices) {
          setData(result.prices.slice(0, 5)); // Top 5
          setStale(result.stale || false);
        }
      } catch (err) {
        console.error('Market price fetch error', err);
        if (active) {
          setStale(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPrices();
    return () => { active = false; };
  }, [district, commodity]);

  if (loading) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-emerald-900/5 shadow-sm animate-pulse min-h-[300px] flex flex-col pt-8">
        <div className="h-6 w-48 bg-emerald-900/10 rounded-full mb-6 relative left-2" />
        <div className="flex-1 w-full bg-emerald-900/5 rounded-2xl" />
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.market,
    price: item.modal_price || item.max_price || 0,
    unit: item.unit
  }));

  return (
    <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-emerald-900/5 shadow-sm relative w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          <TrendingUp className="w-6 h-6" /> Market Prices
        </h2>
        {stale && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-warning-container text-on-warning-container flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Stale (Cached)
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
        {['Cotton', 'Soyabean', 'Wheat', 'Onion'].map(c => (
           <button
             key={c}
             onClick={() => setCommodity(c)}
             className={cn(
               "px-4 py-2 rounded-xl text-xs font-bold transition-all",
               commodity === c ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
             )}
           >
             {c}
           </button>
        ))}
      </div>

      {chartData.length > 0 ? (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                 cursor={{ fill: 'rgba(0, 100, 0, 0.05)' }} 
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="price" fill="#2d6a4f" radius={[6, 6, 6, 6]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[250px] w-full flex flex-col items-center justify-center text-center px-4 bg-surface-container-low/30 rounded-3xl">
          <Info className="w-10 h-10 text-outline mb-2 opacity-50" />
          <p className="text-on-surface-variant text-sm font-medium">No recent price data available for {commodity} in this region.</p>
        </div>
      )}
    </div>
  );
};
