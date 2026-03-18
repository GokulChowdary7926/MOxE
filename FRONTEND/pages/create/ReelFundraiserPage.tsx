import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/** Placeholder: Add Fundraiser – same for all accounts. */
export default function ReelFundraiserPage() {
  const navigate = useNavigate();
  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Add Fundraiser</span>
          <div className="w-10" />
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <ThemedText secondary className="text-center text-sm">Fundraiser options coming soon.</ThemedText>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
