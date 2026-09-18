"use client";
import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const SCREENS = {
  PARTICIPANT: [
    { id: 'p_auto', name: 'AUTO' },
    { id: 'p_rules', name: 'RULES' },
    { id: 'p_round_intro', name: 'ROUND INTRO' },
    { id: 'p_countdown', name: 'COUNTDOWN' },
    { id: 'p_announcement', name: 'ANNOUNCEMENT' },
    { id: 'p_constraint_reveal', name: 'CONSTRAINT REVEAL' },
    { id: 'p_paused', name: 'PAUSED' },
    { id: 'p_round_complete', name: 'ROUND COMPLETE' },
    { id: 'p_locked', name: 'LOCKED' },
  ],
  DISPLAY: [
    { id: 'd_auto', name: 'AUTO' },
    { id: 'd_waiting', name: 'WAITING' },
    { id: 'd_event_status', name: 'EVENT STATUS' },
    { id: 'd_live_round', name: 'LIVE ROUND' },
    { id: 'd_leaderboard', name: 'LEADERBOARD' },
    { id: 'd_custom_text', name: 'CUSTOM TEXT' },
    { id: 'd_custom_image', name: 'CUSTOM IMAGE' },
  ],
  SYSTEM: [
    { id: 's_offline_banner', name: 'Offline Banner' },
    { id: 's_submission_success', name: 'Submission Success' },
    { id: 's_quiz_warning', name: 'Quiz Auto-Submit Warning' },
    { id: 's_active_sessions', name: 'Active Sessions Modal' },
    { id: 's_edit_team', name: 'Edit Team Dialog' },
    { id: 's_auth_recovery', name: 'Auth Recovery Panel' },
  ]
};

export default function ScreenLab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const screenId = searchParams.get('screen');
  const [device, setDevice] = useState('desktop');

  const handleClose = () => {
    router.push('/organizer/screen-lab');
  };

  const totalScreens = SCREENS.PARTICIPANT.length + SCREENS.DISPLAY.length + SCREENS.SYSTEM.length;

  return (
    <div className="min-h-screen bg-neutral-900 text-emerald-400 font-mono p-6">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400">SCREEN LAB: ACCESSIBILITY AUDIT</h1>
      
      <div className="mb-8 p-4 border border-emerald-500/30 rounded bg-black/50">
        <h2 className="text-xl mb-2 text-cyan-300">Screen Inventory</h2>
        <ul className="flex gap-6 text-sm">
          <li>Total: {totalScreens}</li>
          <li>Participant: {SCREENS.PARTICIPANT.length}</li>
          <li>Display: {SCREENS.DISPLAY.length}</li>
          <li>System: {SCREENS.SYSTEM.length}</li>
        </ul>
      </div>

      {!screenId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl mb-4 border-b border-emerald-500/50 pb-2">PARTICIPANT SCREENS</h2>
            <ul className="space-y-2">
              {SCREENS.PARTICIPANT.map(s => (
                <li key={s.id} className="flex justify-between items-center bg-black/30 p-2 border border-emerald-500/20 rounded">
                  <span>{s.name}</span>
                  <Link href={`/organizer/screen-lab?screen=${s.id}`} className="text-cyan-400 hover:text-cyan-300 underline text-sm">OPEN PREVIEW</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl mb-4 border-b border-emerald-500/50 pb-2">DISPLAY SCREENS</h2>
            <ul className="space-y-2">
              {SCREENS.DISPLAY.map(s => (
                <li key={s.id} className="flex justify-between items-center bg-black/30 p-2 border border-emerald-500/20 rounded">
                  <span>{s.name}</span>
                  <Link href={`/organizer/screen-lab?screen=${s.id}`} className="text-cyan-400 hover:text-cyan-300 underline text-sm">OPEN PREVIEW</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl mb-4 border-b border-emerald-500/50 pb-2">HIDDEN / SYSTEM SCREENS</h2>
            <ul className="space-y-2">
              {SCREENS.SYSTEM.map(s => (
                <li key={s.id} className="flex justify-between items-center bg-black/30 p-2 border border-emerald-500/20 rounded">
                  <span>{s.name}</span>
                  <Link href={`/organizer/screen-lab?screen=${s.id}`} className="text-cyan-400 hover:text-cyan-300 underline text-sm">OPEN PREVIEW</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-neutral-900 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black border-b border-emerald-500/50">
            <button onClick={handleClose} className="px-4 py-2 border border-emerald-500 rounded text-emerald-400 hover:bg-emerald-900/30">
              ← Back
            </button>
            <div className="flex gap-4">
              <span className="text-cyan-400 flex items-center">Device:</span>
              {['desktop', 'tablet', 'mobile'].map(d => (
                <button 
                  key={d}
                  onClick={() => setDevice(d)}
                  className={`px-3 py-1 rounded border ${device === d ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'border-emerald-500/30 text-emerald-500 hover:border-emerald-400'}`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-sm text-emerald-500">
              Previewing: {screenId}
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-neutral-800">
            <div className={`transition-all duration-300 bg-black border border-emerald-500/20 shadow-2xl overflow-hidden ${
              device === 'mobile' ? 'w-[375px] h-[812px] rounded-[2rem]' : 
              device === 'tablet' ? 'w-[768px] h-[1024px] rounded-xl' : 
              'w-full h-full rounded-none'
            }`}>
              <iframe 
                src={`/organizer/screen-lab/render?screen=${screenId}`}
                className="w-full h-full border-0 bg-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
