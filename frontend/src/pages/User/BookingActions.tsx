import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage, today } from '../../lib/api';
import type { Booking } from './AccountPage';

export default function BookingActions({ booking: b, kind, onChanged }: { booking: Booking; kind: 'tours' | 'hotels'; onChanged: (message: string) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const send = async (e: FormEvent) => {
    e.preventDefault(); if (lock.current) return;
    if (!reason.trim()) { setError('Nhập lý do bạn muốn hủy đơn.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { const response = await api.post(`/account/bookings/${kind}/${b.id}/cancellation`, { reason }); onChanged(response.data.message); }
    catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  };
  if (b.cancellationStatus) return <div className="booking-actions"><p><strong>{b.cancellationStatus === 'Pending' ? 'Yêu cầu hủy đang chờ admin duyệt' : b.cancellationStatus === 'Approved' ? 'Yêu cầu hủy đã được duyệt' : 'Yêu cầu hủy bị từ chối'}</strong></p><p className="preserve-lines">Lý do: {b.cancellationReason}</p>{b.cancellationReply && <p className="preserve-lines">Phản hồi: {b.cancellationReply}</p>}{b.cancellationStatus === 'Pending' && <p>Đơn vẫn giữ chỗ. Hệ thống không tự hoàn tiền.</p>}</div>;
  if (!['Pending', 'Confirmed'].includes(b.status) || b.startDate.slice(0, 10) <= today()) return null;
  return <details className="booking-actions"><summary>Yêu cầu hủy đơn</summary><form className="user-form" onSubmit={send}><p>Gửi trước ngày sử dụng dịch vụ. Mỗi đơn gửi một yêu cầu; admin sẽ duyệt hoặc phản hồi. Đơn vẫn giữ chỗ cho đến khi được duyệt. Không tự hoàn tiền.</p><label>Lý do hủy đơn #{b.id}<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <p className="user-alert" role="alert">{error}</p>}<button className="user-button secondary" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}</button></form></details>;
}
