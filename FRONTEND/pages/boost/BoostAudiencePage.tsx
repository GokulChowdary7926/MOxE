import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BoostLayout } from './BoostLayout';

export default function BoostAudiencePage() {
  const navigate = useNavigate();
  const [suggested, setSuggested] = useState(true);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [financialToggle, setFinancialToggle] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  return (
    <BoostLayout title="Audience" step={2} onCancel={() => navigate(-1)}>
      <div className="px-4 py-6">
        <h2 className="text-white font-bold text-xl mb-6">Who should see your ad?</h2>

        <button type="button" onClick={() => setSpecialOpen(!specialOpen)} className="w-full flex items-center justify-between py-3 border-b border-[#262626] text-left">
          <div>
            <p className="text-white font-medium">Special requirements</p>
            <p className="text-[#a8a8a8] text-sm">Review these if your ad is about financial products and services, employment, housing, social issues, elections or politics.</p>
          </div>
          <span className="text-[#737373]">{specialOpen ? '▲' : '▼'}</span>
        </button>

        <div className="py-4 border-b border-[#262626]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Suggested audience</p>
              <p className="text-[#a8a8a8] text-sm">Targets this ad to people similar to your followers.</p>
              <p className="text-[#0095f6] text-sm mt-1">India · Edit</p>
            </div>
            <button type="button" onClick={() => setSuggested(!suggested)} className={`w-11 h-6 rounded-full flex-shrink-0 ${suggested ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${suggested ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="py-4 border-b border-[#262626]">
          <p className="text-white font-medium">This ad is about financial products and services.</p>
          <p className="text-[#a8a8a8] text-sm">Includes ads about securities and investments.</p>
          <button type="button" onClick={() => setFinancialToggle(!financialToggle)} className={`mt-2 w-11 h-6 rounded-full flex-shrink-0 ${financialToggle ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${financialToggle ? 'ml-5' : 'ml-0.5'}`} />
          </button>
        </div>

        {financialToggle && (
          <button type="button" onClick={() => setShowCategories(true)} className="mt-4 text-[#0095f6] text-sm font-medium">Select categories</button>
        )}

        <Link to="/boost/create-audience" className="block w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center mt-8">Next</Link>
      </div>

      {showCategories && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center" onClick={() => setShowCategories(false)}>
          <div className="w-full max-w-lg bg-[#262626] rounded-t-2xl p-4 pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Select categories</span>
              <button type="button" onClick={() => setShowCategories(false)} className="text-[#0095f6] font-medium">Done</button>
            </div>
            <div className="space-y-3">
              {['Financial products and services', 'Employment', 'Housing', 'Social issues, elections or politics'].map((cat) => (
                <div key={cat} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-white font-medium">{cat}</p>
                    <p className="text-[#a8a8a8] text-xs">Category description</p>
                  </div>
                  <span className="w-5 h-5 rounded-full border-2 border-[#363636]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BoostLayout>
  );
}
