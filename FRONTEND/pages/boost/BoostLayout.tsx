import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { Info } from 'lucide-react';

const STEPS = 4;

export function BoostLayout({
  title,
  step,
  onCancel,
  right,
  children,
}: {
  title: string;
  step: number;
  onCancel?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const handleCancel = onCancel ?? (() => navigate(-1));
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={handleCancel} className="text-[#0095f6] font-medium text-sm">
            Cancel
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold">{title}</span>
          <div className="min-w-[80px] flex justify-end">{right ?? <button type="button" className="p-1 text-white" aria-label="Info"><Info className="w-5 h-5" /></button>}</div>
        </header>
        <div className="px-4 h-1 flex gap-1 bg-black">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 rounded-full ${i + 1 <= step ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-[#262626]'}`} />
          ))}
        </div>
        <div className="flex-1 overflow-auto pb-24">{children}</div>
      </MobileShell>
    </ThemedView>
  );
}
