import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversine, type Pt } from '../lib/geo';

export type Profile = 'run' | 'saver';

const MAX_ACCURACY_M = 25; // drop noisy fixes (tunnels, urban canyons)
const MIN_STEP_M = 3; // drop GPS jitter while standing still

interface RunState {
  status: 'idle' | 'running';
  startedAt: number | null;
  points: Pt[];
  distance: number; // metres
  profile: Profile;
  start: () => void;
  finish: () => void;
  addPoints: (incoming: Pt[]) => void;
  setProfile: (p: Profile) => void;
}

export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      startedAt: null,
      points: [],
      distance: 0,
      profile: 'run',

      start: () =>
        set({ status: 'running', startedAt: Date.now(), points: [], distance: 0, profile: 'run' }),

      finish: () => set({ status: 'idle' }),

      setProfile: (profile) => set({ profile }),

      addPoints: (incoming) => {
        if (get().status !== 'running') return;
        const pts = [...get().points];
        let dist = get().distance;

        for (const p of incoming) {
          if (p.acc != null && p.acc > MAX_ACCURACY_M) continue;
          const last = pts[pts.length - 1];
          if (last) {
            const d = haversine(last, p);
            if (d < MIN_STEP_M) continue;
            dist += d;
          }
          pts.push(p);
        }
        set({ points: pts, distance: dist });
      },
    }),
    {
      name: 'run-store',
      storage: createJSONStorage(() => AsyncStorage),
      // The headless task may be the only thing alive: persisting means a
      // killed-and-restarted JS runtime picks the run up where it left off.
    }
  )
);
