import React from 'react';
import { ThemedText } from './Themed';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

/**
 * ErrorState – simple error block with “Try again”.
 * Use anywhere a list or feed can fail to load.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="px-moxe-md py-moxe-md flex flex-col gap-moxe-sm">
      <ThemedText secondary className="text-moxe-caption">
        {message || "Something went wrong. Check your connection and try again."}
      </ThemedText>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-moxe-primary text-moxe-body font-semibold active:opacity-80 self-start"
        >
          Try again
        </button>
      )}
    </div>
  );
}

