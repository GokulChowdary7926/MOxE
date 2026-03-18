import React from 'react';

export function StoryCantBoostModal({ onChooseDifferent, onCancel }: { onChooseDifferent: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-[#262626] border border-[#363636] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-2">Story can&apos;t be boosted</h3>
        <p className="text-[#a8a8a8] text-sm mb-6">We currently don&apos;t support boosting stories with more than one tappable element. Try removing something from this story, or create a new one.</p>
        <button type="button" onClick={onChooseDifferent} className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mb-2">Choose a different story</button>
        <button type="button" onClick={onCancel} className="w-full py-2 text-[#a8a8a8] font-medium">Cancel</button>
      </div>
    </div>
  );
}
