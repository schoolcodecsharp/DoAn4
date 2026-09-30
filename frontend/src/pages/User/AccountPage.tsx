import { FeaturedLibraryPhoto } from './Photo';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { api, dateLabel, errorMessage, money } from '../../lib/api';
import { SavedEvents } from './ItineraryEvents';
import type { SavedEvent } from './itinerary';
import TripMembers from './TripMembers';
import { useResource } from './catalog';

type Booking = { id: number; name: string; startDate: string; endDate?: string; people: number; rooms?: number; total: number; status: string };
type Trip = { isOwner: boolean; maChuyenDi: number; tenChuyenDi: string; diemDen: string; ngayBatDau: string; ngayKetThuc: string; soNguoi: number; nganSach: number; moTa?: string; days: { ngayThu: number; ngay?: string; tieuDe: string; ghiChu: string; activities?: SavedEvent[] }[] };
type Invitation = { id: number; name: string; destination: string; startDate: string; ownerName: string };
type AccountData = { tours: Booking[]; hotels: Booking[]; trips: Trip[]; invitations: Invitation[] };
const statusLabel: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Completed: 'Đã hoàn thành', CheckedIn: 'Đã nhận phòng', CheckedOut: 'Đã trả phòng', Paid: 'Đã thanh toán' };

export default function AccountPage() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<AccountData>('/account');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'hotels' ? 'hotels' : params.get('tab') === 'trips' ? 'trips' : 'tours';
  const setTab = (value: 'tours' | 'hotels' | 'trips') => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    if (value !== 'trips') next.delete('trip');
    setParams(next);
  };
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [responding, setResponding] = useState(false);
  const changed = (message: string) => { setNotice(message); setActionError(''); reload(); };
  const respond = async (id: number, status: 'Accepted' | 'Rejected') => {
    if (responding) return;
    setResponding(true); setActionError('');
    try {
      await api.put(`/account/invitations/${id}`, { status });
      if (status === 'Accepted') setTab('trips');
      changed(status === 'Accepted' ? 'Bạn đã tham gia chuyến đi. Lịch trình chung hiển thị bên dưới.' : 'Đã từ chối lời mời.');
    } catch (err) { setActionError(errorMessage(err)); }
    finally { setResponding(false); }
  };
  return <main className="user-page"><div className="user-container"><section className="account-welcome"><div><p className="user-kicker">KHÔNG GIAN CỦA BẠN</p><h1>Xin chào, {user?.hoTen}.</h1><p>Mọi đặt chỗ và lịch trình của bạn, gọn gàng trong một nơi.</p><Link className="user-button" to="/planner">Tạo lịch trình mới</Link></div><FeaturedLibraryPhoto ownerId={10} /></section>
    <div className="account-layout"><aside className="user-panel account-profile"><p className="user-kicker">THÔNG TIN TÀI KHOẢN</p><h2>{user?.hoTen}</h2><dl><dt>Email</dt><dd>{user?.email}</dd><dt>Số điện thoại</dt><dd>{user?.soDienThoai || 'Chưa cung cấp'}</dd></dl><Link to="/tours">Khám phá tour</Link><Link to="/hotels">Tìm khách sạn</Link><Link to="/destinations">Xem điểm đến</Link><Link to="/restaurants">Tìm nhà hàng</Link><button className="user-button secondary" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button></aside>
    <section className="account-content"><div className="account-stats"><div><strong>{data?.tours.length ?? '—'}</strong><span>Đơn tour</span></div><div><strong>{data?.hotels.length ?? '—'}</strong><span>Đơn phòng</span></div><div><strong>{data?.trips.length ?? '—'}</strong><span>Lịch trình</span></div></div>
    {notice && <p role="status" className="user-panel">{notice}</p>}
    {actionError && <p role="alert" className="user-alert">{actionError}</p>}
    {!!data?.invitations.length && <section className="user-panel trip-invitations"><h2>Lời mời chuyến đi ({data.invitations.length})</h2>{data.invitations.map(invitation => <article key={invitation.id}>
      <h3>{invitation.name}</h3><p>{invitation.ownerName} mời bạn đến {invitation.destination} · {dateLabel(invitation.startDate)}</p>
      <p>Chấp nhận để xem lịch trình, ghi chú và ngân sách chung.</p>
      <div className="member-actions"><button className="user-button" disabled={responding} onClick={() => respond(invitation.id, 'Accepted')}>Chấp nhận</button>
      <button className="user-button secondary" disabled={responding} onClick={() => respond(invitation.id, 'Rejected')}>Từ chối</button></div>
    </article>)}</section>}
    <div className="account-tabs" aria-label="Danh mục tài khoản">{([['tours', 'Tour đã đặt'], ['hotels', 'Phòng đã đặt'], ['trips', 'Lịch trình của tôi']] as const).map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
    {loading && <div className="user-empty" role="status">Đang tải dữ liệu của bạn...</div>}
    {error && <div className="user-empty" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {data && !data[tab].length && <div className="user-empty"><h2>{tab === 'trips' ? 'Chuyến đi tiếp theo bắt đầu từ đây.' : 'Bạn chưa có đặt chỗ nào.'}</h2><p>{tab === 'trips' ? 'Tự sắp xếp từng ngày và lưu lại kế hoạch của riêng mình.' : 'Khám phá dịch vụ và chọn hành trình phù hợp với bạn.'}</p><Link className="user-button" to={tab === 'trips' ? '/planner' : `/${tab}`}>{tab === 'trips' ? 'Lập lịch trình' : 'Khám phá ngay'}</Link></div>}
    {data && tab !== 'trips' && data[tab].map(b => <article className="user-panel booking-record" key={b.id}><div className="section-line"><p className="user-kicker">MÃ ĐƠN {b.id}</p><span className="status-label">{statusLabel[b.status] || b.status}</span></div><h3>{b.name}</h3><p>{dateLabel(b.startDate)}{b.endDate ? ` đến ${dateLabel(b.endDate)}` : ''} / {b.people} khách{b.rooms ? ` / ${b.rooms} phòng` : ''}</p><strong>{money(b.total)}</strong><p className="subtle">Trạng thái trên là trạng thái đặt chỗ, không phải biên lai thanh toán.</p></article>)}
    {data && tab === 'trips' && data.trips.map(trip => <article className="user-panel" key={trip.maChuyenDi}><p className="user-kicker">LỊCH TRÌNH {trip.maChuyenDi} / {trip.diemDen}</p><h3>{trip.tenChuyenDi}</h3><p className="subtle">{trip.isOwner ? 'Bạn là chủ chuyến đi' : 'Chuyến đi bạn đã tham gia · Chỉ xem'}</p><p>{dateLabel(trip.ngayBatDau)} đến {dateLabel(trip.ngayKetThuc)} / {trip.soNguoi} người</p><p>Ngân sách dự kiến: {money(trip.nganSach)}</p>{trip.moTa && <p>{trip.moTa}</p>}<details open={params.get('trip') === String(trip.maChuyenDi) || undefined}><summary>Xem kế hoạch từng ngày</summary>{trip.days.map(day => <div className="trip-day" key={day.ngayThu}><h4>Ngày {day.ngayThu}: {day.tieuDe}</h4>{day.ngay && <p>{dateLabel(day.ngay)}</p>}<p className="preserve-lines">{day.ghiChu || 'Chưa có ghi chú.'}</p><SavedEvents events={day.activities || []} /></div>)}</details>{trip.isOwner && <TripMembers tripId={trip.maChuyenDi} onChanged={changed} />}</article>)}
    </section></div></div></main>;
}
