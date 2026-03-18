import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

export default function ReviewsPage() {

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/activity" className="p-2 -m-2 text-white" aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="flex-1 text-center text-white font-semibold">Reviews</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-20 h-20 rounded-full border-2 border-orange-500/50 flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-purple-500">!</span>
          </div>
          <h2 className="text-white font-semibold text-xl text-center mb-2">No review activity</h2>
          <p className="text-[#a8a8a8] text-sm text-center">
            When you submit reviews on MOxE, they will appear here.
          </p>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
