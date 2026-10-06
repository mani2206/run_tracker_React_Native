import * as Location from 'expo-location';
import type { Profile } from '../store/runStore';

export const LOCATION_TASK = 'run-tracker-location';

// Battery levers: accuracy picks the sensor (GPS vs fused/wifi/cell),
// distanceInterval/timeInterval stop the radio from waking the CPU for every tiny move.
const PROFILES: Record<Profile, Location.LocationTaskOptions> = {
  run: {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 5,
    timeInterval: 3000, // Android only
  },
  saver: {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 25,
    timeInterval: 15000,
  },
};

export async function ensurePermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Location permission denied');
  // Must be requested AFTER foreground; on Android 11+ this sends the user to Settings.
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') throw new Error('Choose "Allow all the time" to track with the screen off');
}

export async function startTracking(profile: Profile = 'run') {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    ...PROFILES[profile],
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false, // iOS: don't let the OS decide you stopped
    showsBackgroundLocationIndicator: true, // iOS blue pill
    foregroundService: {
      // Android: this notification is what keeps the process alive when the screen is off
      notificationTitle: 'Run in progress',
      notificationBody: 'Recording your route',
      notificationColor: '#16a34a',
    },
  });
}

export async function stopTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

export const isTracking = () => Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
