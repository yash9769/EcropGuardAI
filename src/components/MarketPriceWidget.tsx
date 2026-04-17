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

const MOCK_PRICES: Record<string, any[]> = {
  'Cotton': [
    { market: 'Yavatmal', modal_price: 7200, unit: 'Quintal' },
    { market: 'Amravati', modal_price: 7050, unit: 'Quintal' },
    { market: 'Akola', modal_price: 7100, unit: 'Quintal' },
    { market: 'Wardha', modal_price: 7150, unit: 'Quintal' },
    { market: 'Nagpur', modal_price: 7300, unit: 'Quintal' }
  ],
  'Soyabean': [
    { market: 'Latur', modal_price: 4500, unit: 'Quintal' },
    { market: 'Nanded', modal_price: 4420, unit: 'Quintal' },
    { market: 'Hingoli', modal_price: 4380, unit: 'Quintal' },
    { market: 'Parbhani', modal_price: 4450, unit: 'Quintal' },
    { market: 'Washim', modal_price: 4400, unit: 'Quintal' }
  ],
  'Wheat': [
    { market: 'Pune', modal_price: 2450, unit: 'Quintal' },
    { market: 'Mumbai', modal_price: 2600, unit: 'Quintal' },
    { market: 'Solapur', modal_price: 2380, unit: 'Quintal' },
    { market: 'Jalgaon', modal_price: 2320, unit: 'Quintal' },
    { market: 'Ahmednagar', modal_price: 2400, unit: 'Quintal' }
  ],
  'Onion': [
    { market: 'Lasalgaon', modal_price: 1850, unit: 'Quintal' },
    { market: 'Pimpalgaon', modal_price: 1920, unit: 'Quintal' },
    { market: 'Yeola', modal_price: 1780, unit: 'Quintal' },
    { market: 'Manmad', modal_price: 1750, unit: 'Quintal' },
    { market: 'Chakan', modal_price: 1800, unit: 'Quintal' }
  ]
};

export const MarketPriceWidget = ({ district }: { district?: string }) => {
  const { t } = useTranslation();
  const [commodity, setCommodity] = useState('Cotton'); 
  const [data, setData] = useState<any[]>(MOCK_PRICES['Cotton']);
  const [stale, setStale] = useState(true); // Initial state is mock/cached
  const [loading, setLoading] = useState(false);

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
        
        const resp = await fetch(`/api/market/prices?${queryParams.toString()}`);
        if (!resp.ok) throw new Error('API Error');
        const result = await parseJsonResponse<any>(resp);
        
        if (active && result && result.prices) {
          if (result.prices.length === 0) {
            throw new Error('API returned empty prices, use mock data');
          }
          setData(result.prices.slice(0, 5));
          setStale(result.stale || false);
        }
      } catch (err) {
        console.error('Market price fetch error', err);
        if (active) {
          setData(MOCK_PRICES[commodity] || MOCK_PRICES['Cotton']);
          setStale(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPrices();
    return () => { active = false; };
  }, [district, commodity]);

  // Loading indicator only shows for the very first fetch if we had NO data, 
  // but since we pre-fill, we can skip the full-screen loader to prevent flicker.
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
            <AlertCircle className="w-3 h-3" /> DEMO DATA
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

      <div className={cn("h-[250px] w-full transition-opacity duration-300", loading ? "opacity-30" : "opacity-100")}>
        {chartData.length > 0 ? (
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
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center px-4 bg-surface-container-low/30 rounded-3xl">
            <Info className="w-10 h-10 text-outline mb-2 opacity-50" />
            <p className="text-on-surface-variant text-sm font-medium">No recent price data available for {commodity}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

