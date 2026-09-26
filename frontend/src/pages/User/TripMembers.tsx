import { useId, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useResource } from './catalog';
import './trip-members.css';

type Member = { id: number; name: string; email: string; status: string };
const labels: Record<string, string> = { Pending: 'Chờ phản hồi', Accepted: 'Đã tham gia', Rejected: 'Đã từ chối' };

function MemberList({ tripId, onChanged }: { tripId: number; onChanged: (message: string) => void }) {
  const { data, loading, error, reload } = useResource<Member[]>(`/account/itineraries/${tripId}/members`);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [removeId, setRemoveId] = useState<number | null>(null);
  const inputId = useId();
  async function invite(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      await api.post(`/account/itineraries/${tripId}/members`, { email });
      onChanged('Đã gửi lời mời. Người được mời xem và phản hồi trong trang tài khoản.');
    } catch (err) { setMessage(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      await api.delete(`/account/itineraries/${tripId}/members/${id}`);
      setRemoveId(null); reload();
    } catch (err) { setMessage(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <div className="trip-members">
    <p>Mời bằng email tài khoản đã đăng ký. Người được mời chỉ xem lịch trình chung sau khi chấp nhận; chỉ bạn có thể quản lý thành viên.</p>
    <form className="user-form member-invite-form" onSubmit={invite}>
      <label htmlFor={inputId}>Email thành viên</label>
      <div className="member-invite-controls"><input id={inputId} type="email" required maxLength={150} value={email} onChange={e => setEmail(e.target.value)} placeholder="banbe@example.com" />
      <button className="user-button" disabled={busy} type="submit">{busy ? 'Đang xử lý…' : 'Gửi lời mời'}</button></div>
    </form>
    {message && <p role="alert" className="user-alert">{message}</p>}
    {loading && <p role="status">Đang tải thành viên…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={reload}>Thử lại</button></p>}
    {data && !data.length && <p>Chưa mời thành viên nào. Bạn là chủ chuyến đi.</p>}
    {data && data.length > 0 && <ul className="member-list">{data.map(member => <li key={member.id}>
      <div><strong>{member.name}</strong><small>{member.email}</small><span>{labels[member.status] || member.status}</span></div>
      {removeId === member.id ? <div className="member-actions"><span>Thu hồi lời mời hoặc quyền xem chuyến đi?</span><button type="button" disabled={busy} onClick={() => remove(member.id)}>Xác nhận gỡ</button><button type="button" disabled={busy} onClick={() => setRemoveId(null)}>Giữ lại</button></div> :
        <button type="button" className="user-text-link" disabled={busy} onClick={() => setRemoveId(member.id)}>Gỡ thành viên</button>}
    </li>)}</ul>}
  </div>;
}

export default function TripMembers({ tripId, onChanged }: { tripId: number; onChanged: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className="trip-members-section">
    <button type="button" className="user-button secondary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? 'Ẩn thành viên' : 'Quản lý thành viên'}</button>
    <div id={id}>{open && <MemberList tripId={tripId} onChanged={onChanged} />}</div>
  </div>;
}
