import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Leaf, Search, Trash2, AlertCircle, X } from 'lucide-react';
import { type Scan } from '../lib/supabase';
import SeverityBadge from '../components/SeverityBadge';
import ConfidenceRing from '../components/ConfidenceRing';
import { formatDate } from '../lib/utils';

interface HistoryPageProps {
  scans: Scan[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function HistoryPage({ scans, loading, onDelete }: HistoryPageProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = scans.filter(s =>
    !search ||
    s.disease_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.crop_type?.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    onDelete(id);
    setConfirmDelete(null);
    if (selectedScan?.id === id) setSelectedScan(null);
  }

  // Detail modal
  if (selectedScan) {
    return (
      <div className="flex flex-col min-h-screen px-4 pt-14 pb-28 bg-mesh overflow-auto">
        <div className="flex items-center gap-3 mb-5 animate-fade-up">
          <button
            onClick={() => setSelectedScan(null)}
            className="w-9 h-9 rounded-xl flex items-center justify-center press"
            style={{ background: 'var(--green-glow)' }}
          >
            <X size={18} style={{ color: 'var(--green)' }} />
          </button>
          <h1 className="font-display font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>
            {selectedScan.disease_name || 'Unknown'}
          </h1>
          <button
            onClick={() => setConfirmDelete(selectedScan.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center press"
            style={{ background: 'color-mix(in srgb, var(--red), transparent 90%)' }}
          >
            <Trash2 size={16} style={{ color: 'var(--red)' }} />
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div
            className="glass rounded-2xl p-4 mb-4 animate-scale-in"
            style={{ border: '1px solid rgba(248,113,113,0.3)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>{t('confirm_delete')}</p>
            <div className="flex gap-3">
               <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-display font-semibold press"
                style={{ background: 'var(--green-glow)', color: 'var(--green)', border: '1px solid var(--border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl text-sm font-display font-bold press"
                style={{ background: 'color-mix(in srgb, var(--red), transparent 85%)', color: 'var(--red)', border: '1px solid var(--red)' }}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="glass rounded-3xl p-5 mb-4 animate-scale-in">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>
                {selectedScan.disease_name}
              </h2>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{selectedScan.crop_type}</p>
              {selectedScan.severity && <SeverityBadge severity={selectedScan.severity} />}
            </div>
            {selectedScan.confidence !== null && selectedScan.confidence !== undefined && (
              <ConfidenceRing value={selectedScan.confidence} />
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{formatDate(selectedScan.created_at)}</p>
        </div>

        {selectedScan.recommendations && selectedScan.recommendations.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-3 animate-fade-up delay-100">
            <p className="text-xs font-display font-semibold mb-3" style={{ color: 'var(--green)' }}>
              {t('recommendations')}
            </p>
            <ul className="space-y-2">
              {selectedScan.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedScan.treatment_steps && selectedScan.treatment_steps.length > 0 && (
          <div className="glass rounded-2xl p-4 animate-fade-up delay-200">
            <p className="text-xs font-display font-semibold mb-3" style={{ color: 'var(--blue)' }}>
              {t('treatment')}
            </p>
            <ol className="space-y-2">
              {selectedScan.treatment_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
                    style={{ background: 'var(--blue)', color: '#ffffff' }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-14 pb-28 bg-mesh">
      {/* Header */}
      <div className="animate-fade-up mb-5">
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text)' }}>
          {t('history_title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{scans.length} scans recorded</p>
      </div>

      {/* Search */}
      {scans.length > 0 && (
        <div className="relative mb-4 animate-fade-up delay-100">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search disease, crop..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton rounded-2xl h-20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && scans.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 animate-fade-up">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'var(--green-glow)', border: '1px solid var(--border)' }}
          >
            <History size={28} style={{ color: 'var(--green)' }} />
          </div>
          <p className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>
            {t('no_history')}
          </p>
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)', maxWidth: 220 }}>
            {t('no_history_sub')}
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && scans.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
          <AlertCircle size={28} style={{ color: 'var(--text-dim)' }} className="mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results for "{search}"</p>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((scan, i) => (
          <button
            key={scan.id}
            onClick={() => setSelectedScan(scan)}
            className="glass rounded-2xl p-4 flex items-center gap-3 press text-left w-full animate-fade-up"
            style={{ animationDelay: `${0.1 + i * 0.04}s` }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--green-glow)' }}
            >
              <Leaf size={20} style={{ color: 'var(--green)' }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm truncate mb-0.5" style={{ color: 'var(--text)' }}>
                {scan.disease_name || 'Unknown Disease'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {scan.crop_type || 'Unknown crop'} · {formatDate(scan.created_at)}
              </p>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {scan.severity && <SeverityBadge severity={scan.severity} size="sm" />}
              {scan.confidence !== null && scan.confidence !== undefined && (
                <span className="text-xs font-display font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {scan.confidence}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
