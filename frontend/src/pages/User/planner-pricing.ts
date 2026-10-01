import { useEffect, useState } from 'react';
import { api, errorMessage, money } from '../../lib/api';
import type { PlannedEvent } from './itinerary';

export type ActivityEstimate = {
  unit: string; quantity: number; free: boolean; unitMin: number | null; unitMax: number | null;
  minTotal: number | null; maxTotal: number | null; roomId?: number; roomName?: string; capacity?: number;
  rooms?: number; nights?: number; checkin?: string; checkout?: string;
  availableRooms?: number; available?: boolean; message: string; checkedAt: string;
  roomOptions?: { id: number; name: string; price: number; capacity: number; available: number }[];
};
export const costRange = (min: number, max: number) => min === max ? money(min) : `${money(min)} – ${money(max)}`;
export const dayDate = (start: string, offset: number) => {
  const date = new Date(`${start}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
export function useEstimates(start: string, people: number, days: { activities: PlannedEvent[] }[]) {
  const body = JSON.stringify({ ngayBatDau: start, soNguoi: people, days: days.map(d => ({ activities: d.activities.map(a => ({
    loaiDiaDiem: a.loaiDiaDiem, maDoiTuong: a.maDoiTuong, quantity: a.quantity, roomId: a.roomId, rooms: a.rooms, nights: a.nights,
  })) })) });
  const [state, setState] = useState<{ key: string; days?: ActivityEstimate[][]; error?: string }>({ key: '' });
  const [revision, setRevision] = useState(0);
  const key = `${revision}:${body}`;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api.post<{ days: ActivityEstimate[][] }>('/account/itineraries/estimate', JSON.parse(body), { signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setState({ key, days: r.data.days }); })
        .catch(e => { if (!controller.signal.aborted) setState({ key, error: errorMessage(e) }); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [body, key]);
  // Never show a previous date/quantity's quote while the latest request is pending.
  return { days: state.key === key ? state.days : undefined, error: state.key === key ? state.error : undefined,
    loading: state.key !== key, reload: () => setRevision(v => v + 1) };
}
