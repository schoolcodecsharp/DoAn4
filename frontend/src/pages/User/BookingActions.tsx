import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage, today } from '../../lib/api';
import type { Booking } from './AccountPage';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

export default function BookingActions({ booking: b, kind, onChanged }: { booking: Booking; kind: 'tours' | 'hotels'; onChanged: (message: string) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const editor = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const send = async (e: FormEvent) => {
    e.preventDefault(); if (lock.current) return;
    if (!reason.trim()) { setError('Nhập lý do bạn muốn hủy đơn.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { const response = await api.post(`/account/bookings/${kind}/${b.id}/cancellation`, { reason }); setOpen(false); onChanged(response.data.message); }
    catch (err) { setError(errorMessage(err)); reportFormError(editor.current, err, { reason: ['lý do'] }); }
    finally { lock.current = false; setBusy(false); }
  };
  if (b.cancellationStatus) return <div className="booking-actions"><p><strong>{b.cancellationStatus === 'Pending' ? 'Yêu cầu hủy đang chờ admin duyệt' : b.cancellationStatus === 'Approved' ? 'Yêu cầu hủy đã được duyệt' : 'Yêu cầu hủy bị từ chối'}</strong></p><p className="preserve-lines">Lý do: {b.cancellationReason}</p>{b.cancellationReply && <p className="preserve-lines">Phản hồi: {b.cancellationReply}</p>}{b.cancellationStatus === 'Pending' && <p>Đơn vẫn giữ chỗ. Hệ thống không tự hoàn tiền.</p>}</div>;
  if (!['Pending', 'Confirmed'].includes(b.status) || b.startDate.slice(0, 10) <= today()) return null;
  return <div className="booking-actions"><button type="button" className="user-button secondary" onClick={() => { setError(''); setOpen(true); }}>Yêu cầu hủy đơn</button>{open && <FormDialog title={`Yêu cầu hủy đơn #${b.id}`} busy={busy} onClose={() => setOpen(false)}><ValidatedForm className="user-form" formRef={editor} onSubmit={send}><p>Đơn vẫn giữ chỗ cho đến khi admin duyệt. Hệ thống không tự hoàn tiền.</p><label>Lý do hủy<textarea name="reason" required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <p className="user-alert" role="alert">{error}</p>}<button className="user-button secondary" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu hủy'}</button></ValidatedForm></FormDialog>}</div>;
}
