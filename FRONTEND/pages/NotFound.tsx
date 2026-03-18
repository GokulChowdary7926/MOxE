import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ThemedView, ThemedText } from '../components/ui/Themed';

/**
 * 404 Not Found – shown for invalid routes. Replaces redirect-to-home for better UX.
 */
export default function NotFound() {
  const location = useLocation();

  return (
    <ThemedView className="min-h-screen flex flex-col items-center justify-center px-6 bg-moxe-background">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold text-moxe-textSecondary/30">404</p>
        <ThemedText className="text-xl font-semibold mt-4 text-moxe-text">
          Page not found
        </ThemedText>
        <ThemedText secondary className="text-moxe-body mt-2 text-moxe-textSecondary">
          The page at <code className="bg-moxe-surface px-1 rounded text-xs break-all">{location.pathname}</code> doesn’t exist or was moved.
        </ThemedText>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-moxe-primary text-white font-medium"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go back
          </button>
        </div>
      </div>
    </ThemedView>
  );
}
