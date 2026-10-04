import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

export default function CancellationPanel({ endpoint, id, reason, onChanged }: { endpoint: string; id: number; reason?: string; onChanged: () => void }) {
  const [reply, setReply] = useState('');
  const [decision, setDecision] = useState('Approved');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const editor = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    if (!window.confirm(`${decision === 'Approved' ? 'Duyệt hủy' : 'Từ chối hủy'} đơn #${id}? Thao tác này không hoàn tiền.`)) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.put(`/${endpoint}/${id}`, { cancellationDecisionStatus: decision, cancellationReply: reply }); setOpen(false); onChanged(); }
    catch (err) { setError(errorMessage(err)); reportFormError(editor.current, err, { cancellationReply: ['phản hồi'] }); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="cancellation-review"><h3>Yêu cầu hủy đơn #{id}</h3><p className="preserve-lines">{reason}</p><button type="button" onClick={() => { setError(''); setOpen(true); }}>Xử lý yêu cầu</button>{open && <FormDialog title={`Xử lý yêu cầu hủy đơn #${id}`} onClose={() => setOpen(false)} busy={busy}><ValidatedForm className="user-form" formRef={editor} onSubmit={submit}><p className="preserve-lines">Lý do của khách: {reason}</p><label>Quyết định<select name="cancellationDecisionStatus" value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Duyệt hủy</option><option value="Rejected">Từ chối</option></select></label><label>Phản hồi cho khách<textarea name="cancellationReply" required={decision === 'Rejected'} maxLength={1000} value={reply} onChange={e => setReply(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Đang xử lý…' : 'Lưu quyết định'}</button></ValidatedForm></FormDialog>}</section>;
}
