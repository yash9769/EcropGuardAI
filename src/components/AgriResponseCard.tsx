import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConfidenceBadge } from './ConfidenceBadge';
import { cn } from '../lib/utils';

interface AgriCardProps {
  best_answer: string;
  confidence: number;
  mode: 'rag' | 'fallback';
  answers?: { llama?: string; llama8b?: string };
  sources?: { source?: string; preview?: string }[];
  detectedIntent?: string;
  time: string;
}

// Strip AI-generated labels like [STRICT RESEARCH] and [GENERAL ADVISORY]
function stripLabel(text: string): string {
  return text.replace(/^\[(STRICT RESEARCH|GENERAL ADVISORY)\]\s*/i, '').trim();
}

// Parse the LLM text into structured sections intelligently
function parseStructured(text: string): {
  disease?: string;
  actionSteps: string[];
  preventiveTips: string[];
  summary: string;
} {
  const clean = stripLabel(text);
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  let disease = '';
  const actionSteps: string[] = [];
  const preventiveTips: string[] = [];
  const summaryLines: string[] = [];

  let mode: 'summary' | 'action' | 'preventive' = 'summary';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect disease name from headers or "disease: X" pattern
    if (!disease) {
      const match = line.match(/(?:disease|problem|issue|condition)[:\s]+(.+)/i);
      if (match) { disease = match[1].replace(/\*+/g, '').trim(); continue; }
      if (line.startsWith('#')) { disease = line.replace(/^#+\s*/, '').trim(); continue; }
    }

    // Section detection
    if (lower.includes('action') || lower.includes('treatment') || lower.includes('step') || lower.includes('management')) {
      mode = 'action'; continue;
    }
    if (lower.includes('prevent') || lower.includes('tip') || lower.includes('avoid')) {
      mode = 'preventive'; continue;
    }

    // Bullet points
    const isBullet = /^[-•*]\s+|^\d+\.\s+/.test(line);
    const bulletText = line.replace(/^[-•*]\s+|^\d+\.\s+/, '').replace(/\*+/g, '').trim();
    if (!bulletText) continue;

    if (isBullet) {
      if (mode === 'action') actionSteps.push(bulletText);
      else if (mode === 'preventive') preventiveTips.push(bulletText);
      else summaryLines.push(bulletText);
    } else {
      if (mode === 'summary' || summaryLines.length < 3) summaryLines.push(line.replace(/\*+/g, ''));
    }
  }

  // No more hard slicing - show full thorough steps
  const summary = summaryLines.slice(0, 5).join(' ') || clean.substring(0, 500);
  return { disease, actionSteps, preventiveTips, summary };
}

export const AgriResponseCard = ({
  best_answer, confidence, mode, answers, sources, detectedIntent, time
}: AgriCardProps) => {
  const [showCompare, setShowCompare] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const { disease, actionSteps, preventiveTips, summary } = parseStructured(best_answer);

  const urgencyColor = confidence >= 0.8 ? 'border-l-emerald-500' : confidence >= 0.5 ? 'border-l-yellow-400' : 'border-l-red-400';

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-emerald-900/5 border-l-4 overflow-hidden', urgencyColor)}>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {disease && (
            <h3 className="text-sm font-black text-on-surface leading-tight flex items-center gap-2">
              🌿 {disease}
            </h3>
          )}
          <ConfidenceBadge confidence={confidence} mode={mode} />
          {detectedIntent && (
            <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full w-fit border border-emerald-900/5">
              🎯 Detected: {detectedIntent}
            </span>
          )}
        </div>
        <span className="text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-bold shrink-0">{time}</span>
      </div>

      {/* Summary paragraph */}
      <div className="px-4 pb-3">
        <div className="text-sm text-on-surface leading-relaxed prose prose-sm max-w-none prose-emerald">
          <ReactMarkdown>{disease ? summary : stripLabel(best_answer)}</ReactMarkdown>
        </div>
      </div>

      {/* Action Steps */}
      {actionSteps.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-red-50 border border-red-100 p-3">
          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1">
            🚨 Action Steps
          </p>
          <ul className="flex flex-col gap-1.5">
            {actionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-900">
                <span className="w-4 h-4 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[9px] font-black shrink-0 mt-px">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preventive Tips */}
      {preventiveTips.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1">
            ✅ Preventive Tips
          </p>
          <ul className="flex flex-col gap-1">
            {preventiveTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-900">
                <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        {answers && (answers.llama8b || answers.llama) && (
          <button
            onClick={() => setShowCompare(v => !v)}
            className="text-[10px] font-bold text-on-surface-variant px-3 py-1.5 rounded-full bg-surface-container hover:bg-emerald-50 border border-emerald-900/5 transition-colors"
          >
            {showCompare ? '▲ Hide' : '▾ Compare AI Opinions'}
          </button>
        )}
        {sources && sources.length > 0 && (
          <button
            onClick={() => setShowSources(v => !v)}
            className="text-[10px] font-bold text-on-surface-variant px-3 py-1.5 rounded-full bg-surface-container hover:bg-emerald-50 border border-emerald-900/5 transition-colors"
          >
            {showSources ? '▲ Hide Sources' : `📄 ${sources.length} Source${sources.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Expandable: Compare AI Opinions */}
      {showCompare && answers && (
        <div className="border-t border-emerald-900/5 bg-surface-container-low/50 px-4 py-3 flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">AI Opinions</p>
          {[{ key: 'Llama 3.3 70B', text: answers.llama }, { key: 'Llama 3.1 8B', text: answers.llama8b }]
            .filter(a => a.text)
            .map(({ key, text }) => (
              <div key={key} className="rounded-xl bg-white border border-emerald-900/5 p-4">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">{key}</p>
                <div className="text-xs text-on-surface-variant leading-relaxed prose prose-sm max-w-none prose-emerald">
                  <ReactMarkdown>{stripLabel(text || '')}</ReactMarkdown>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Expandable: Sources */}
      {showSources && sources && sources.length > 0 && (
        <div className="border-t border-emerald-900/5 bg-surface-container-low/50 px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Research Sources</p>
          <div className="flex flex-col gap-2">
            {sources.map((s, i) => (
              <div key={i} className="rounded-lg bg-white border border-emerald-900/5 p-2">
                <p className="text-[10px] font-bold text-emerald-800">{s.source || 'Research Document'}</p>
                {s.preview && <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5 line-clamp-2">{s.preview}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
