
"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Monitor, Smartphone, Tablet, ArrowLeft, RefreshCw, FlaskConical } from 'lucide-react';

const SCREENS = {
  PARTICIPANT: [
    { id: 'p_auto',              name: 'AUTO / NORMAL' },
    { id: 'p_rules',             name: 'RULES' },
    { id: 'p_round_intro',       name: 'ROUND INTRO' },
    { id: 'p_countdown',         name: 'COUNTDOWN' },
    { id: 'p_announcement',      name: 'ANNOUNCEMENT' },
    { id: 'p_constraint_reveal', name: 'CONSTRAINT REVEAL' },
    { id: 'p_paused',            name: 'PAUSED' },
    { id: 'p_round_complete',    name: 'ROUND COMPLETE' },
    { id: 'p_locked',            name: 'LOCKED' },
  ],
  DISPLAY: [
    { id: 'd_auto',         name: 'AUTO' },
    { id: 'd_waiting',      name: 'WAITING' },
    { id: 'd_event_status', name: 'EVENT STATUS' },
    { id: 'd_live_round',   name: 'LIVE ROUND' },
    { id: 'd_leaderboard',  name: 'LEADERBOARD' },
    { id: 'd_custom_text',  name: 'CUSTOM TEXT' },
    { id: 'd_custom_image', name: 'CUSTOM IMAGE' },
  ],
  SYSTEM: [
    { id: 's_offline',    name: 'Offline Banner' },
    { id: 's_success',    name: 'Submission Success' },
    { id: 's_quiz_warn',  name: 'Quiz Auto-Submit Warning' },
    { id: 's_auth_recov', name: 'Auth Recovery Panel' },
    { id: 's_edit_team',  name: 'Edit Team Dialog' },
    { id: 's_confirm',    name: 'Confirmation Dialog' },
  ],
};

const ALL = [...SCREENS.PARTICIPANT, ...SCREENS.DISPLAY, ...SCREENS.SYSTEM];
const CATEGORY_COLORS: Record<string, string> = {
  PARTICIPANT: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  DISPLAY:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  SYSTEM:      'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

type Device = 'desktop' | 'tablet' | 'mobile';

function ScreenLabInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const screenId = searchParams.get('screen');

  const [device, setDevice] = useState<Device>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const activeScreen = ALL.find(s => s.id === screenId);
  const category = screenId
    ? screenId.startsWith('p_') ? 'PARTICIPANT' : screenId.startsWith('d_') ? 'DISPLAY' : 'SYSTEM'
    : null;

  const iframeSize: Record<Device, string> = {
    desktop: 'w-full h-full',
    tablet:  'w-[768px] h-[1024px]',
    mobile:  'w-[390px] h-[844px]',
  };

  if (screenId && activeScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
        {/* Toolbar */}
        <div className="h-14 shrink-0 bg-black/80 border-b border-white/10 flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/organizer/screen-lab')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK
            </button>
            <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest border ${CATEGORY_COLORS[category!]}`}>
              {category}
            </div>
            <span className="font-mono text-sm font-bold text-white tracking-widest">
              {activeScreen.name}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
              REAL COMPONENT
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(['desktop','tablet','mobile'] as Device[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`p-1.5 rounded border font-mono text-xs uppercase tracking-wider transition-colors ${
                  device === d ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                {d === 'desktop' ? <Monitor className="w-4 h-4" /> : d === 'tablet' ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </button>
            ))}
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REPLAY
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto bg-neutral-900 flex items-center justify-center p-4">
          <div className={`${iframeSize[device]} max-w-full bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl`}>
            <iframe
              key={iframeKey}
              src={`/organizer/screen-lab/render?screen=${screenId}`}
              className="w-full h-full border-0"
              title={`Preview: ${activeScreen.name}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-[var(--color-apb-cyan)]" />
          <div>
            <h1 className="text-2xl font-mono font-black tracking-widest uppercase text-white">Screen Lab</h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5 tracking-wide">
              Preview every UI state without affecting the live event
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          {Object.entries(SCREENS).map(([cat, list]) => (
            <div key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${CATEGORY_COLORS[cat]}`}>
              <span className="font-bold">{list.length}</span>
              <span className="opacity-80">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Grid */}
      {Object.entries(SCREENS).map(([category, list]) => (
        <div key={category}>
          <h2 className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 ${CATEGORY_COLORS[category].split(' ')[0]}`}>
            {category} SCREENS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {list.map(screen => (
              <Link
                key={screen.id}
                href={`?screen=${screen.id}`}
                className="group block p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/20 hover:bg-black/60 transition-all"
              >
                <div className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${CATEGORY_COLORS[category].split(' ')[0]}`}>
                  {category}
                </div>
                <div className="text-sm font-mono text-white font-semibold tracking-wide group-hover:text-[var(--color-apb-cyan)] transition-colors">
                  {screen.name}
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                  OPEN PREVIEW →
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScreenLabPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 font-mono text-slate-400 text-sm tracking-widest">
        Loading Screen Lab...
      </div>
    }>
      <ScreenLabInner />
    </Suspense>
  );
}
