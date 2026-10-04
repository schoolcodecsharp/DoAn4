import { useEffect, useRef, useState } from 'react';
import type { PlannedEvent } from './itinerary';

export type PlannerForm = { tenChuyenDi: string; diemKhoiHanh: string; diemDen: string; ngayBatDau: string; soNguoi: number; nganSach: number; moTa: string };
export type PlannerDay = { key: string; tieuDe: string; ghiChu: string; activities: PlannedEvent[] };
type Draft = { version: 1; revision: number | null; savedAt: number; form: PlannerForm; days: PlannerDay[] };
const lifetime = 7 * 86400000;
const text = (v: unknown) => typeof v === 'string';
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
export function validDraft(v: unknown): v is Draft {
  if (!v || typeof v !== 'object') return false;
  const d = v as Draft, f = d.form;
  return d.version === 1 && finite(d.savedAt) && Date.now() - d.savedAt <= lifetime && d.savedAt <= Date.now() + 60000 &&
    (d.revision === null || finite(d.revision)) && !!f && [f.tenChuyenDi, f.diemKhoiHanh, f.diemDen, f.ngayBatDau, f.moTa].every(text) &&
    finite(f.soNguoi) && finite(f.nganSach) && Array.isArray(d.days) && d.days.length >= 1 && d.days.length <= 30 &&
    d.days.every(day => !!day && [day.key, day.tieuDe, day.ghiChu].every(text) && Array.isArray(day.activities) && day.activities.length <= 20 && day.activities.every(a =>
      !!a && [a.key, a.thoiGianBatDau, a.thoiGianKetThuc, a.ghiChu].every(text) && ['DiaDiem', 'KhachSan', 'NhaHang'].includes(a.loaiDiaDiem) && finite(a.maDoiTuong) &&
      [a.quantity, a.roomId, a.rooms, a.nights].every(n => n === undefined || finite(n))));
}

export function usePlannerDraft(key: string, revision: number | null, form: PlannerForm, days: PlannerDay[]) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { draft: null, message: '' };
      const value: unknown = JSON.parse(raw);
      if (validDraft(value) && value.revision === revision) return { draft: value, message: '' };
      localStorage.removeItem(key);
      return { draft: null, message: 'Bản nháp cũ đã hết hạn hoặc lịch trình đã đổi trên hệ thống. Đang dùng dữ liệu mới nhất.' };
    } catch { return { draft: null, message: 'Không đọc được bản nháp trên thiết bị này. Bạn vẫn có thể soạn và lưu lên tài khoản.' }; }
  });
  const [pending, setPending] = useState<Draft | null>(initial.draft);
  const [message, setMessage] = useState(initial.message);
  // Store editable values only; never persist cached prices, availability, photos or account details.
  const payload = JSON.stringify({ form, days: days.map(day => ({ ...day, activities: day.activities.map(a => ({ key: a.key, loaiDiaDiem: a.loaiDiaDiem, maDoiTuong: a.maDoiTuong, thoiGianBatDau: a.thoiGianBatDau, thoiGianKetThuc: a.thoiGianKetThuc, ghiChu: a.ghiChu, quantity: a.quantity, roomId: a.roomId, rooms: a.rooms, nights: a.nights })) })) });
  const [baseline] = useState(payload);
  const completed = useRef(false);
  const dirty = payload !== baseline;
  useEffect(() => {
    if (!dirty || pending || completed.current) return;
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, revision, savedAt: Date.now(), ...JSON.parse(payload) }));
      // Report the outcome of this external-storage synchronization to the user.
      // eslint-disable-next-line react/set-state-in-effect
      setMessage('Đã lưu nháp trên thiết bị này. Chưa lưu lên tài khoản.');
    } catch { setMessage('Không thể lưu nháp: bộ nhớ bị chặn hoặc đã đầy. Hãy lưu lịch trình trước khi rời trang.'); }
  }, [key, revision, payload, dirty, pending]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (!completed.current) { event.preventDefault(); event.returnValue = ''; } };
    const leave = (event: MouseEvent) => {
      if (completed.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download') || !link.href) return;
      const url = new URL(link.href);
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (!window.confirm('Lịch trình chưa được lưu lên tài khoản. Bạn vẫn muốn rời trang?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, [dirty]);
  const discard = () => { try { localStorage.removeItem(key); } catch { /* The editor remains usable when storage is blocked. */ } setPending(null); setMessage('Đã bỏ bản nháp.'); };
  const finish = () => { completed.current = true; try { localStorage.removeItem(key); } catch { /* Saved server data is authoritative. */ } };
  return { pending, message, dirty, discard, finish, restored: () => setPending(null) };
}
