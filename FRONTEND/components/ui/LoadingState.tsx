import React from 'react';
import { ThemedText } from './Themed';

type LoadingStateProps = {
  message?: string;
};

/**
 * LoadingState – centered loading indicator.
 * Use when profile, feed, or list is loading.
 */
export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8 min-h-[120px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-moxe-primary border-t-transparent rounded-full animate-spin" />
        <ThemedText secondary className="text-moxe-caption">
          {message}
        </ThemedText>
      </div>
    </div>
  );
}
