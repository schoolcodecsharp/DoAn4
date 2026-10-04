import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { ActivityEstimate } from './planner-pricing';

export function useRoomQuote(hotel: string, room: string, checkin: string, nights: number, rooms: number, people: number, enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const valid = enabled && !!room && Number.isInteger(nights) && nights > 0 && nights <= 30 && Number.isInteger(rooms) && rooms > 0 && Number.isInteger(people) && people > 0 && people <= 100;
  const body = JSON.stringify({ ngayBatDau: checkin, soNguoi: people, days: [{ activities: [{ loaiDiaDiem: 'KhachSan', maDoiTuong: Number(hotel), roomId: Number(room), rooms, nights, quantity: people }] }] });
  const key = `${attempt}:${body}`;
  const [state, setState] = useState<{ key: string; quote?: ActivityEstimate; error?: string }>({ key: '' });
  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api.post<{ days: ActivityEstimate[][] }>('/account/itineraries/estimate', JSON.parse(body), { signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setState({ key, quote: data.days[0]?.[0] }); })
        .catch(err => { if (!controller.signal.aborted) setState({ key, error: errorMessage(err) }); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [valid, body, key]);
  return { loading: valid && state.key !== key, quote: valid && state.key === key ? state.quote : undefined,
    error: valid && state.key === key ? state.error : undefined, reload: () => setAttempt(n => n + 1) };
}
