/**
 * Screenshot & download protection for sensitive content (stories, view-once DMs).
 * Uses expo-screen-capture. When user views protected content, call enableScreenshotProtection().
 * On screenshot event, POST to backend so content owner can be notified.
 */
import * as ScreenCapture from 'expo-screen-capture';
import React, { useEffect } from 'react';
import { apiPost } from '../config/api';

let screenshotSubscription: ScreenCapture.Subscription | null = null;

export type ScreenshotProtectionOptions = {
  contentId: string;
  contentType: 'POST' | 'STORY';
  onDetected?: () => void;
};

export async function enableScreenshotProtection(options: ScreenshotProtectionOptions): Promise<void> {
  try {
    await ScreenCapture.preventScreenCaptureAsync();
  } catch (_) {}
  screenshotSubscription?.remove();
  screenshotSubscription = ScreenCapture.addScreenshotListener(async () => {
    options.onDetected?.();
    try {
      await apiPost('content/screenshot-detected', {
        contentId: options.contentId,
        contentType: options.contentType,
      });
    } catch (_) {}
  });
}

export async function disableScreenshotProtection(): Promise<void> {
  screenshotSubscription?.remove();
  screenshotSubscription = null;
  try {
    await ScreenCapture.allowScreenCaptureAsync();
  } catch (_) {}
}

/**
 * React hook helper for viewer screens.
 * Usage:
 *   useScreenshotProtection({ contentId: storyId, contentType: 'STORY' });
 */
export function useScreenshotProtection(options?: ScreenshotProtectionOptions | null) {
  useEffect(() => {
    if (!options) return;
    enableScreenshotProtection(options);
    return () => {
      disableScreenshotProtection();
    };
  }, [options?.contentId, options?.contentType]);
}
