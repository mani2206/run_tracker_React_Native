import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { LOCATION_TASK, startTracking } from '../lib/tracking';
import { useRunStore } from '../store/runStore';
import { haversine, type Pt } from '../lib/geo';

const toPt = (l: LocationObject): Pt => ({
  lat: l.coords.latitude,
  lng: l.coords.longitude,
  t: l.timestamp,
  acc: l.coords.accuracy,
  speed: l.coords.speed,
});

// Battery wave: breathe between "run" (GPS-hungry) and "saver" depending on movement.
let lastSwitch = 0;
function adaptProfile() {
  const { points, profile, setProfile, status } = useRunStore.getState();
  if (status !== 'running' || points.length < 4) return;
  if (Date.now() - lastSwitch < 30_000) return; // hysteresis, avoid flapping

  const recent = points.slice(-4);
  const span = haversine(recent[0], recent[recent.length - 1]);
  const avgSpeed = recent.reduce((s, p) => s + (p.speed ?? 0), 0) / recent.length;

  if (profile === 'run' && span < 10 && avgSpeed < 0.5) {
    lastSwitch = Date.now();
    setProfile('saver'); // standing at a traffic light / paused
    startTracking('saver');
  } else if (profile === 'saver' && avgSpeed > 1.2) {
    lastSwitch = Date.now();
    setProfile('run');
    startTracking('run');
  }
}

// Top-level, runs at import time. No React, no hooks, no UI here.
TaskManager.defineTask<{ locations: LocationObject[] }>(LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.warn('[location task]', error.message);
    return;
  }
  if (!data?.locations?.length) return;
  useRunStore.getState().addPoints(data.locations.map(toPt));
  adaptProfile();
});
