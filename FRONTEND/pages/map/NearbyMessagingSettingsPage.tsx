import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { Radio, MessageCircle, Globe, ChevronDown } from 'lucide-react';

const RADII = ['500m', '1km', '2km', '3km', '4km', '5km'];

export default function NearbyMessagingSettingsPage() {
  const [radiusIndex, setRadiusIndex] = useState(5); // 5km
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [visibility, setVisibility] = useState('Public');
  const [postText, setPostText] = useState('');

  return (
    <SettingsPageShell title="Nearby Messaging" backTo="/map/nearby-messaging">
      <div className="px-4 py-4 space-y-6">
        {/* Settings card */}
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-[#a855f7]" />
            <span className="text-white font-semibold">Nearby Messaging</span>
          </div>
          <p className="text-[#a8a8a8] text-sm mb-4">Connect with people in your immediate area (up to 5km radius).</p>
          <p className="text-[#a8a8a8] text-sm mb-1">Set Radius:</p>
          <div className="flex gap-2 items-center mb-2 overflow-x-auto pb-1">
            {RADII.map((r, i) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusIndex(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 ${
                  radiusIndex === i ? 'bg-[#a855f7] text-white' : 'bg-[#363636] text-[#a8a8a8]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-[#737373] text-xs mb-4">{RADII[radiusIndex]} selected</p>
          <div className="flex items-center justify-between py-2">
            <span className="text-white">Anonymous Mode</span>
            <button
              type="button"
              onClick={() => setAnonymousMode(!anonymousMode)}
              className={`w-11 h-6 rounded-full ${anonymousMode ? 'bg-[#a855f7]' : 'bg-[#363636]'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${anonymousMode ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>
        </div>

        {/* What's on your mind */}
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#a855f7]" />
            <span className="text-white font-semibold">What&apos;s on your mind?</span>
          </div>
          <p className="text-[#a8a8a8] text-sm mb-4">Share with people in your immediate area</p>
          <p className="text-[#a8a8a8] text-sm mb-1">Post Visibility:</p>
          <button type="button" className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#363636] border border-[#262626] text-white text-sm mb-4">
            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> {visibility}</span>
            <ChevronDown className="w-4 h-4 text-[#737373]" />
          </button>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What's on your mind? Share with nearby users..."
            className="w-full min-h-[100px] px-3 py-2.5 rounded-lg bg-[#363636] border border-[#262626] text-white placeholder:text-[#737373] text-sm resize-none"
          />
        </div>
      </div>
    </SettingsPageShell>
  );
}
