import { useState, useEffect } from 'react';
import { supabase, type Scan } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useScans(user: User | null, isGuest: boolean) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);

  // For guest, store scans in localStorage
  const GUEST_SCANS_KEY = 'ecropguard_guest_scans';

  useEffect(() => {
    if (user) {
      fetchScans();
    } else if (isGuest) {
      const stored = localStorage.getItem(GUEST_SCANS_KEY);
      if (stored) setScans(JSON.parse(stored));
    }
  }, [user, isGuest]);

  async function fetchScans() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setScans(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function saveScan(scan: Omit<Scan, 'id' | 'user_id' | 'created_at'>) {
    if (isGuest) {
      const newScan: Scan = {
        ...scan,
        id: crypto.randomUUID(),
        user_id: 'guest',
        created_at: new Date().toISOString(),
      };
      const updated = [newScan, ...scans];
      setScans(updated);
      localStorage.setItem(GUEST_SCANS_KEY, JSON.stringify(updated));
      return newScan;
    }

    if (!user) return null;

    const { data, error } = await supabase
      .from('scans')
      .insert([{ ...scan, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    setScans(prev => [data, ...prev]);
    return data;
  }

  async function deleteScan(id: string) {
    if (isGuest) {
      const updated = scans.filter(s => s.id !== id);
      setScans(updated);
      localStorage.setItem(GUEST_SCANS_KEY, JSON.stringify(updated));
      return;
    }

    await supabase.from('scans').delete().eq('id', id);
    setScans(prev => prev.filter(s => s.id !== id));
  }

  return { scans, loading, saveScan, deleteScan, refetch: fetchScans };
}
