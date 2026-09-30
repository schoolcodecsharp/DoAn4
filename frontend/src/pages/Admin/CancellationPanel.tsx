import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';

export default function CancellationPanel({ endpoint, id, reason, onChanged }: { endpoint: string; id: number; reason?: string; onChanged: () => void }) {
  const [reply, setReply] = useState('');
  const [decision, setDecision] = useState('Approved');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    if (!window.confirm(`${decision === 'Approved' ? 'Duyệt hủy' : 'Từ chối hủy'} đơn #${id}? Thao tác này không hoàn tiền.`)) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.put(`/${endpoint}/${id}`, { cancellationDecisionStatus: decision, cancellationReply: reply }); onChanged(); }
    catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form className="cancellation-review" onSubmit={submit}><h3>Yêu cầu hủy đơn #{id}</h3><p className="preserve-lines">{reason}</p><div className="admin-filter-row"><label>Quyết định<select value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Duyệt hủy</option><option value="Rejected">Từ chối</option></select></label><label>Phản hồi cho khách<textarea required={decision === 'Rejected'} maxLength={1000} value={reply} onChange={e => setReply(e.target.value)} /></label><button disabled={busy}>{busy ? 'Đang xử lý...' : 'Lưu quyết định'}</button></div>{error && <p role="alert">{error}</p>}</form>;
}
