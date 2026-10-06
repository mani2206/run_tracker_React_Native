# Quick start (zip extract panni inga irundhu)

Requirements: Node 20+, Android Studio (SDK + USB debugging phone) or Xcode (Mac).

```bash
npm install
npx expo install --fix      # Expo SDK-ku sariyaana versions set pannum (important)
npx expo prebuild
npx expo run:android        # real phone connect pannitu
```

Expo Go la odaadhu (MapLibre native code). First build 5-10 min edukkum.

Test: GO press -> permission "Allow all the time" -> screen lock -> 5 min nadanga -> unlock.
Android phone-la Settings > Apps > run-tracker > Battery > Unrestricted.

If `npm install` version error vandha: `npm install --legacy-peer-deps` try pannunga.
