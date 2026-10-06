import './global.css';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteMap from './src/components/RouteMap';
import { useRunStore } from './src/store/runStore';
import { ensurePermissions, isTracking, startTracking, stopTracking } from './src/lib/tracking';
import { fmtPace, fmtTime } from './src/lib/geo';

function Screen() {
  const insets = useSafeAreaInsets();
  const { status, startedAt, points, distance, profile, start, finish } = useRunStore();
  const [now, setNow] = useState(Date.now());

  // Timer is DERIVED from startedAt, so screen-off / JS pauses never cause drift.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Reconcile after app kill / relaunch: store says running, is the OS task still alive?
  useEffect(() => {
    if (status === 'running') {
      isTracking().then((alive) => {
        if (!alive) startTracking(profile).catch(() => finish());
      });
    }
  }, []);

  const elapsed = startedAt ? now - startedAt : 0;

  const onStart = async () => {
    try {
      await ensurePermissions();
      start();
      await startTracking('run');
    } catch (e: any) {
      Alert.alert('Cannot start', e.message);
    }
  };

  const onStop = async () => {
    await stopTracking();
    finish();
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <RouteMap points={points} />

      <View
        className="absolute left-0 right-0 bg-neutral-900/90 px-5 pb-6 pt-5 rounded-b-3xl"
        style={{ top: 0, paddingTop: insets.top + 12 }}
      >
        <View className="flex-row justify-between">
          <Stat label="Distance" value={(distance / 1000).toFixed(2)} unit="km" />
          <Stat label="Time" value={fmtTime(elapsed)} />
          <Stat label="Pace" value={fmtPace(distance, elapsed)} unit="/km" />
        </View>
        {status === 'running' && (
          <Text className="mt-3 text-center text-xs text-neutral-400">
            GPS mode: {profile === 'run' ? 'high accuracy' : 'battery saver (you stopped)'}
          </Text>
        )}
      </View>

      <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 24 }}>
        <Pressable
          onPress={status === 'running' ? onStop : onStart}
          className={`h-20 w-20 items-center justify-center rounded-full ${
            status === 'running' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          <Text className="text-lg font-bold text-white">{status === 'running' ? 'STOP' : 'GO'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <View className="items-center">
    <Text className="text-xs uppercase tracking-wide text-neutral-400">{label}</Text>
    <Text className="text-3xl font-bold text-white">
      {value}
      {unit ? <Text className="text-sm font-normal text-neutral-400"> {unit}</Text> : null}
    </Text>
  </View>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}
