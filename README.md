# Run tracker: background GPS, live route, battery-aware

Expo + TypeScript, expo-location, expo-task-manager, MapLibre, zustand, NativeWind.

## 1. Setup

```bash
npx create-expo-app@latest run-tracker -t expo-template-blank-typescript
cd run-tracker
npx expo install expo-location expo-task-manager react-native-safe-area-context \
  @react-native-async-storage/async-storage
npm i zustand @maplibre/maplibre-react-native@^10 nativewind@^4 tailwindcss@^3
```

Copy the files from this folder over the project (index.ts, App.tsx, app.json, src/*, tailwind/babel/metro configs, global.css).
In package.json set `"main": "index.ts"`.

**You cannot use Expo Go.** MapLibre is native code and background location needs a real build:

```bash
npx expo prebuild
npx expo run:android   # or: npx expo run:ios --device
```

(Use a physical phone for the real test. Simulators fake GPS and never really sleep.)

Check the MapLibre RN version you install: the code here uses the v10 API (`MapLibreGL.MapView`, `ShapeSource`, `LineLayer`). Newer major versions may rename components.

## 2. How the pieces fit

```
OS location service ──► TaskManager task (locationTask.ts, no UI)
                              │ addPoints()
                              ▼
                        zustand store (persisted) ◄── React UI reads it
                              │
                        RouteMap draws GeoJSON LineString
```

- **The task is the source of truth, the UI is just a viewer.** With the screen off the UI may not even exist. The task writes to the store; React re-renders whenever it is alive.
- **defineTask at module top level**, imported from index.ts. Never inside a component.
- **Android foreground service**: `foregroundService` option shows the notification that keeps the process alive. Without it Android kills tracking within minutes of screen-off.
- **iOS**: needs `UIBackgroundModes: location` and "Always" permission. Blue pill = `showsBackgroundLocationIndicator`.
- **Timer from `startedAt`**, never from counting ticks. JS timers pause when the screen is off.

## 3. Battery design

| Lever | Why it matters |
|---|---|
| `accuracy` | BestForNavigation = GPS chip on. Balanced = fused/wifi/cell, much cheaper. |
| `distanceInterval` | OS stays asleep until you actually move N metres. |
| `timeInterval` (Android) | Batches/limits wake-ups. |
| Adaptive profile | `adaptProfile()` drops to "saver" when you stand still (traffic light, water break), back to "run" when speed picks up. 30 s hysteresis prevents flapping. |
| Filtering | Reject fixes with accuracy > 25 m and steps < 3 m: less jitter, fewer renders, fewer writes. |
| Map | Only draw one GeoJSON source; update `shape`, don't add a layer per point. |

## 4. Gotchas you will hit

- **Persisting every point** to AsyncStorage is fine for a tutorial; for long runs move points to `expo-sqlite` and append rows.
- **Android OEMs (Xiaomi, Oppo, Samsung)** have extra battery killers. Tell the user to set the app to "Unrestricted" battery.
- **Android 11+ background permission** is granted in Settings, not a dialog. That's why `ensurePermissions` asks foreground first, then background.
- **Android 13+**: notification permission must be granted or the foreground-service notification is hidden.
- **Task restart after kill**: App.tsx checks `hasStartedLocationUpdatesAsync` on launch and restarts if the store says "running".
- **Tiles**: the OpenFreeMap style is for demos. Use your own provider for production and keep attribution.
- **Distance is raw haversine.** For nicer numbers add a Kalman/smoothing step later.

## 5. Test checklist

1. Start a run, lock the screen, walk 5 min, unlock: line continues without a gap.
2. Swipe the app away mid-run: notification persists, reopen and the route continues.
3. Stand still 1 min: header switches to "battery saver"; move again: back to "high accuracy".
4. Deny background permission: the app shows the explanation instead of silently failing.
