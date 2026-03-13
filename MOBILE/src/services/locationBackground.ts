/**
 * Background location updates for Nearby & proximity alerts.
 * Uses expo-task-manager + expo-location. Call startNearbyBackground() when user enables Nearby on Map.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { apiPost, getStoredToken } from '../config/api';

const TASK_NAME = 'moxe-nearby-location';

export type LocationBackgroundState = 'idle' | 'requesting' | 'active' | 'error';

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[MOxE location task]', error);
    return;
  }
  const locations = (data as { locations?: { coords: { latitude: number; longitude: number } }[] })?.locations;
  const loc = locations?.[0];
  if (!loc?.coords) return;
  const token = await getStoredToken();
  if (!token) return;
  try {
    await apiPost('location', {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  } catch (e) {
    console.warn('[MOxE location task] post failed', e);
  }
});

export async function requestLocationPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function startNearbyBackground(options?: {
  distanceIntervalMeters?: number;
}): Promise<{ success: boolean; error?: string }> {
  const granted = await requestLocationPermissions();
  if (!granted) {
    return { success: false, error: 'Background location permission denied' };
  }
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
    if (running) return { success: true };
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: options?.distanceIntervalMeters ?? 100,
      showsBackgroundLocationIndicator: true,
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Failed to start background location' };
  }
}

export async function stopNearbyBackground(): Promise<void> {
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
    if (running) await Location.stopLocationUpdatesAsync(TASK_NAME);
  } catch (_) {}
}

export async function isNearbyBackgroundRunning(): Promise<boolean> {
  try {
    return Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  } catch {
    return false;
  }
}
