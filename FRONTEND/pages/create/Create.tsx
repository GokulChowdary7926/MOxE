import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, LayoutGrid, Image, PlusCircle, Heart, Radio, Sparkles } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';

/**
 * Create page – bottom sheet style, same for all accounts.
 * Options: Reel, Edits (NEW), Post, Story, Highlights, Live, AI.
 */
const options = [
  { key: 'reel', label: 'Reel', icon: Film, to: '/create/reel' },
  { key: 'edits', label: 'Edits', icon: LayoutGrid, to: '/create/reel', badge: 'NEW' },
  { key: 'post', label: 'Post', icon: Image, to: '/create/post' },
  { key: 'story', label: 'Story', icon: PlusCircle, to: '/stories/create' },
  { key: 'highlights', label: 'Highlights', icon: Heart, to: '/highlights/manage' },
  { key: 'live', label: 'Live', icon: Radio, to: '/live' },
  { key: 'ai', label: 'AI', icon: Sparkles, to: '/create/reel' },
];

export default function Create() {
  const navigate = useNavigate();

  return (
    <ThemedView className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => navigate(-1)}>
      <div className="w-full max-w-[428px] mx-auto flex flex-col items-stretch">
        <div
          className="w-full rounded-t-2xl bg-[#1c1c1e] border-t border-[#262626] pb-8 safe-area-pb"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2 pb-1">
            <div className="w-8 h-0.5 rounded-full bg-white/30 mx-auto" />
          </div>
          <p className="text-white font-semibold text-lg text-center py-3">Create</p>
          <div className="px-4 space-y-0">
            {options.map(({ key, label, icon: Icon, to, badge }) => (
              <Link
                key={key}
                to={to}
                data-testid={key === 'post' ? 'create-post-link-post' : undefined}
                className="flex items-center gap-4 py-3.5 border-b border-[#262626] last:border-0 active:bg-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-white">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-white font-medium flex-1">{label}</span>
                {badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0095f6] text-white text-[10px] font-semibold">
                    {badge}
                  </span>
                )}
                <span className="text-[#737373]">›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ThemedView>
  );
}
