import React from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';

interface Props {
  title: string;
}

export default function StubSetting({ title }: Props) {
  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title={title}
        left={
          <Link to="/settings" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 px-moxe-md py-moxe-md">
        <ThemedText secondary>Coming soon.</ThemedText>
      </div>
    </ThemedView>
  );
}
