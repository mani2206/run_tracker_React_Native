export type Pt = {
  lat: number;
  lng: number;
  t: number; // ms epoch
  acc: number | null; // metres
  speed: number | null; // m/s
};

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: Pt, b: Pt): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

export const fmtPace = (distM: number, ms: number) => {
  if (distM < 50) return '--:--';
  const secPerKm = ms / 1000 / (distM / 1000);
  const m = Math.floor(secPerKm / 60);
  const s = String(Math.round(secPerKm % 60)).padStart(2, '0');
  return `${m}:${s}`;
};
