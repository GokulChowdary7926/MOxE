import React from 'react';
import { ThemedText } from './Themed';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionClick?: () => void;
};

/**
 * EmptyState – MOxE centered empty state.
 * Use for empty feeds, notifications, saved, etc.
 */
export function EmptyState({ icon, title, message, actionLabel, onActionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-moxe-md py-moxe-xl gap-moxe-sm">
      {icon && <div className="mb-moxe-sm text-moxe-textSecondary">{icon}</div>}
      <ThemedText className="text-moxe-headline font-semibold">{title}</ThemedText>
      {message && (
        <ThemedText secondary className="text-moxe-body max-w-xs">
          {message}
        </ThemedText>
      )}
      {actionLabel && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="mt-moxe-sm px-moxe-lg py-moxe-sm rounded-moxe-md bg-moxe-primary text-white text-moxe-body font-semibold active:opacity-80"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

