import React from 'react';
import { Link } from 'react-router-dom';
import { Image, Camera, Film, Radio } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';

const modes = [
  { to: '/create/post', label: 'Post', icon: Image, description: 'Share a photo or carousel' },
  { to: '/create/story', label: 'Story', icon: Camera, description: 'Share to your story' },
  { to: '/create/reel', label: 'Reel', icon: Film, description: 'Short-form video' },
  { to: '/live', label: 'Live', icon: Radio, description: 'Go live' },
];

export default function Create() {
  return (
    <PageLayout title="Create" backTo="/">
      <div className="py-4 px-4 space-y-2">
        <ThemedText secondary className="text-moxe-body block mb-4">
          Choose what you want to share.
        </ThemedText>
        {modes.map(({ to, label, icon: Icon, description }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 py-3 px-4 rounded-moxe-md bg-moxe-surface border border-moxe-border active:bg-moxe-surface/80"
          >
            <div className="w-12 h-12 rounded-full bg-moxe-background flex items-center justify-center">
              <Icon className="w-6 h-6 text-moxe-textSecondary" />
            </div>
            <div className="flex-1">
              <ThemedText className="font-semibold text-moxe-body">{label}</ThemedText>
              <ThemedText secondary className="text-moxe-caption block">{description}</ThemedText>
            </div>
            <span className="text-moxe-textSecondary">›</span>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
