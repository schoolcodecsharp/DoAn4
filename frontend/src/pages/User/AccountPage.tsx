import { FeaturedLibraryPhoto } from './Photo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { dateLabel, money } from '../../lib/api';
import { useResource } from './catalog';

type Booking = { id: number; name: string; startDate: string; endDate?: string; people: number; rooms?: number; total: number; status: string };
type Trip = { maChuyenDi: number; tenChuyenDi: string; diemDen: string; ngayBatDau: string; ngayKetThuc: string; soNguoi: number; nganSach: number; moTa?: string; days: { ngayThu: number; tieuDe: string; ghiChu: string }[] };
type AccountData = { tours: Booking[]; hotels: Booking[]; trips: Trip[] };
const statusLabel: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Completed: 'Đã hoàn thành', CheckedIn: 'Đã nhận phòng', CheckedOut: 'Đã trả phòng', Paid: 'Đã thanh toán' };

export default function AccountPage() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<AccountData>('/account');
  const [tab, setTab] = useState<'tours' | 'hotels' | 'trips'>('tours');
  return <main className="user-page"><div className="user-container"><section className="account-welcome"><div><p className="user-kicker">KHÔNG GIAN CỦA BẠN</p><h1>Xin chào, {user?.hoTen}.</h1><p>Mọi đặt chỗ và lịch trình của bạn, gọn gàng trong một nơi.</p><Link className="user-button" to="/planner">Tạo lịch trình mới</Link></div><FeaturedLibraryPhoto ownerId={10} /></section>
    <div className="account-layout"><aside className="user-panel account-profile"><p className="user-kicker">THÔNG TIN TÀI KHOẢN</p><h2>{user?.hoTen}</h2><dl><dt>Email</dt><dd>{user?.email}</dd><dt>Số điện thoại</dt><dd>{user?.soDienThoai || 'Chưa cung cấp'}</dd></dl><Link to="/tours">Khám phá tour</Link><Link to="/hotels">Tìm khách sạn</Link><Link to="/destinations">Xem điểm đến</Link><button className="user-button secondary" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button></aside>
    <section className="account-content"><div className="account-stats"><div><strong>{data?.tours.length ?? '—'}</strong><span>Đơn tour</span></div><div><strong>{data?.hotels.length ?? '—'}</strong><span>Đơn phòng</span></div><div><strong>{data?.trips.length ?? '—'}</strong><span>Lịch trình</span></div></div>
    <div className="account-tabs" aria-label="Danh mục tài khoản">{([['tours', 'Tour đã đặt'], ['hotels', 'Phòng đã đặt'], ['trips', 'Lịch trình của tôi']] as const).map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
    {loading && <div className="user-empty" role="status">Đang tải dữ liệu của bạn...</div>}
    {error && <div className="user-empty" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {data && !data[tab].length && <div className="user-empty"><h2>{tab === 'trips' ? 'Chuyến đi tiếp theo bắt đầu từ đây.' : 'Bạn chưa có đặt chỗ nào.'}</h2><p>{tab === 'trips' ? 'Tự sắp xếp từng ngày và lưu lại kế hoạch của riêng mình.' : 'Khám phá dịch vụ và chọn hành trình phù hợp với bạn.'}</p><Link className="user-button" to={tab === 'trips' ? '/planner' : `/${tab}`}>{tab === 'trips' ? 'Lập lịch trình' : 'Khám phá ngay'}</Link></div>}
    {data && tab !== 'trips' && data[tab].map(b => <article className="user-panel booking-record" key={b.id}><div className="section-line"><p className="user-kicker">MÃ ĐƠN {b.id}</p><span className="status-label">{statusLabel[b.status] || b.status}</span></div><h3>{b.name}</h3><p>{dateLabel(b.startDate)}{b.endDate ? ` đến ${dateLabel(b.endDate)}` : ''} / {b.people} khách{b.rooms ? ` / ${b.rooms} phòng` : ''}</p><strong>{money(b.total)}</strong><p className="subtle">Trạng thái trên là trạng thái đặt chỗ, không phải biên lai thanh toán.</p></article>)}
    {data && tab === 'trips' && data.trips.map(trip => <article className="user-panel" key={trip.maChuyenDi}><p className="user-kicker">LỊCH TRÌNH {trip.maChuyenDi} / {trip.diemDen}</p><h3>{trip.tenChuyenDi}</h3><p>{dateLabel(trip.ngayBatDau)} đến {dateLabel(trip.ngayKetThuc)} / {trip.soNguoi} người</p><p>Ngân sách dự kiến: {money(trip.nganSach)}</p>{trip.moTa && <p>{trip.moTa}</p>}<details><summary>Xem kế hoạch từng ngày</summary>{trip.days.map(day => <div className="trip-day" key={day.ngayThu}><h4>Ngày {day.ngayThu}: {day.tieuDe}</h4><p className="preserve-lines">{day.ghiChu || 'Chưa có ghi chú.'}</p></div>)}</details></article>)}
    </section></div></div></main>;
}
