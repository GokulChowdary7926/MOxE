import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const MOCK_TRACKS = [
  { id: '1', title: 'Fear of the Water', artist: 'TVORCHI (Disco Lights)' },
  { id: '2', title: 'Love on the Brain', artist: 'Rihanna' },
  { id: '3', title: 'Hail to the Victor', artist: '30 seconds to Mars' },
  { id: '4', title: 'Like it Doesn\'t Hurt', artist: 'Charle Cardin' },
];

export default function TrendingAudioPage() {
  return (
    <SettingsPageShell title="Trending audio" backTo="/notes/new/song">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Popular audio for your reels and notes.</p>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_TRACKS.map((t) => (
            <button key={t.id} type="button" className="aspect-square rounded-xl bg-[#262626] overflow-hidden text-left active:bg-white/5">
              <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30" />
              <div className="p-2 -mt-12 relative">
                <p className="text-white font-medium text-sm truncate">{t.title}</p>
                <p className="text-[#a8a8a8] text-xs truncate">{t.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
