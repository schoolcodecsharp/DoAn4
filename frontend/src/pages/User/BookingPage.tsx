import { useRef, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { api, dateLabel, errorMessage, money, today } from '../../lib/api';
import { catalogs, itemName, useResource, type CatalogItem, type Departure, type Room } from './catalog';

export default function BookingPage({ kind }: { kind: 'tours' | 'hotels' }) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  // Reset form and success state when a different service/option is selected
  // through client-side navigation (including browser Back/Forward).
  return <BookingForm key={`${kind}/${id}/${params.get(kind === 'tours' ? 'departure' : 'room') || ''}`} kind={kind} />;
}

function BookingForm({ kind }: { kind: 'tours' | 'hotels' }) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { user } = useSession();
  const item = useResource<CatalogItem>(`/${catalogs[kind].endpoint}/${id}`);
  const options = useResource<(Omit<Departure, 'trangThai'> & Omit<Room, 'trangThai'> & { trangThai: string | boolean })[]>(kind === 'tours' ? `/tourkhoihanh/bytour/${id}` : `/loaiphong/bykhachsan/${id}`);
  const [selected, setSelected] = useState(params.get(kind === 'tours' ? 'departure' : 'room') || '');
  const initialCount = (key: string) => { const value = Number(params.get(key)); return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 1; };
  const initialDate = (key: string) => { const value = params.get(key) || ''; return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : ''; };
  const [people, setPeople] = useState(() => initialCount('people'));
  const [rooms, setRooms] = useState(() => initialCount('rooms'));
  const [checkin, setCheckin] = useState(() => initialDate('checkin') || today());
  const [checkout, setCheckout] = useState(() => initialDate('checkout'));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ id: number; total: number } | null>(null);
  const submitting = useRef(false);
  const choices = (options.data || []).filter(o => kind === 'tours' ? o.trangThai === 'OpenForBooking' && o.ngayKhoiHanh.slice(0, 10) >= today() && o.soChoToiDa > o.soChoDaDat : o.trangThai && o.soLuongPhong > 0);
  const choice = choices.find(o => String(kind === 'tours' ? o.maKhoiHanh : o.maLoaiPhong) === selected);
  const nights = Math.max(0, (Date.parse(checkout) - Date.parse(checkin)) / 86400000) || 0;
  const total = choice ? kind === 'tours' ? choice.giaApDung * people : choice.giaMoiDem * rooms * nights : 0;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting.current) return;
    setError('');
    if (!choice) return setError('Vui lòng chọn lịch khởi hành hoặc loại phòng.');
    if (!Number.isInteger(people) || people < 1 || people > 100) return setError('Số khách phải từ 1 đến 100.');
    if (kind === 'tours' && people > choice.soChoToiDa - choice.soChoDaDat) return setError('Số khách vượt quá số chỗ còn lại.');
    if (kind === 'hotels' && (!Number.isInteger(rooms) || rooms < 1 || rooms > choice.soLuongPhong || !nights || nights > 30 || checkin < today() || people > choice.sucChua * rooms)) return setError('Kiểm tra ngày nhận/trả phòng (tối đa 30 đêm), số phòng và sức chứa.');
    submitting.current = true; setBusy(true);
    try {
      const body = kind === 'tours' ? { maKhoiHanh: choice.maKhoiHanh, soNguoi: people, ghiChu: note } : { maLoaiPhong: choice.maLoaiPhong, ngayNhanPhong: checkin, ngayTraPhong: checkout, soLuongPhong: rooms, soNguoi: people, ghiChu: note };
      const { data } = await api.post(`/account/bookings/${kind}`, body);
      setSuccess(data);
    } catch (err) { setError(errorMessage(err)); }
    finally { submitting.current = false; setBusy(false); }
  };
  if (success) return <main className="user-page"><section className="user-container booking-success user-panel"><h1>Yêu cầu đặt chỗ đã được lưu.</h1><p>Đơn {kind === 'tours' ? 'tour' : 'phòng'} số <strong>{success.id}</strong> đang chờ xác nhận.</p><p>Tổng tiền: <strong>{money(success.total)}</strong>. Bạn chưa bị trừ tiền; đây chưa phải xác nhận thanh toán.</p><Link className="user-button" to={`/account?tab=${kind}`}>Xem đơn đặt của tôi</Link></section></main>;
  return <main className="user-page"><div className="user-container"><Link className="user-text-link" to={`/${kind}/${id}`}>Trở lại thông tin chi tiết</Link><div className="detail-heading"><p className="user-kicker">ĐẶT DỊCH VỤ</p><h1>{kind === 'tours' ? 'Sẵn sàng cho chuyến đi.' : 'Chọn ngày nghỉ của bạn.'}</h1><p>{item.data && itemName(item.data)}</p></div>
    {(item.loading || options.loading) && <p role="status">Đang tải thông tin đặt chỗ...</p>}
    {(item.error || options.error) && <div className="user-empty" role="alert"><p>{item.error || options.error}</p><button className="user-button" onClick={() => { item.reload(); options.reload(); }}>Thử lại</button></div>}
    {item.data && options.data && <div className="detail-layout"><form className="user-panel user-form" onSubmit={submit}>
      <h2>Thông tin đặt {kind === 'tours' ? 'tour' : 'phòng'}</h2>
      {!choices.length && <p className="user-alert">Hiện chưa có lựa chọn có thể đặt cho dịch vụ này.</p>}
      <label>{kind === 'tours' ? 'Ngày khởi hành' : 'Loại phòng'}<select required value={selected} onChange={e => setSelected(e.target.value)}><option value="">Chọn {kind === 'tours' ? 'ngày khởi hành' : 'loại phòng'}</option>{choices.map(o => <option key={kind === 'tours' ? o.maKhoiHanh : o.maLoaiPhong} value={kind === 'tours' ? o.maKhoiHanh : o.maLoaiPhong}>{kind === 'tours' ? `${dateLabel(o.ngayKhoiHanh)} - ${money(o.giaApDung)} - còn ${o.soChoToiDa - o.soChoDaDat} chỗ` : `${o.tenLoaiPhong} - ${money(o.giaMoiDem)} / đêm`}</option>)}</select></label>
      {kind === 'hotels' && <div className="user-form-grid"><label>Ngày nhận phòng<input type="date" required min={today()} value={checkin} onChange={e => setCheckin(e.target.value)} /></label><label>Ngày trả phòng<input type="date" required min={checkin} value={checkout} onChange={e => setCheckout(e.target.value)} /></label><label>Số phòng<input type="number" required min={1} max={choice?.soLuongPhong || 20} value={rooms} onChange={e => setRooms(Number(e.target.value))} /></label></div>}
      <label>Số khách<input type="number" required min={1} max={kind === 'tours' && choice ? choice.soChoToiDa - choice.soChoDaDat : 100} value={people} onChange={e => setPeople(Number(e.target.value))} /></label>
      {kind === 'hotels' && choice && <p>Tối đa {choice.sucChua} khách mỗi phòng. Phòng trống được kiểm tra lại khi gửi yêu cầu.</p>}
      <label>Ghi chú (không bắt buộc)<textarea maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="Yêu cầu của bạn cho chuyến đi" /></label>
      {error && <p className="user-alert" role="alert">{error}</p>}
      <button className="user-button" disabled={busy || !choice} type="submit">{busy ? 'Đang gửi yêu cầu...' : 'Xác nhận yêu cầu đặt chỗ'}</button>
    </form><aside className="user-panel detail-aside"><h2>{itemName(item.data)}</h2><p>Người đặt: {user?.hoTen}</p><p>{user?.email}</p><hr /><p>{people} khách{kind === 'hotels' ? ` / ${rooms} phòng / ${nights} đêm` : ''}</p><small>Tổng tiền dự kiến</small><strong className="summary-total">{money(total)}</strong><p>Giá và tình trạng chỗ sẽ được kiểm tra lại khi gửi yêu cầu. Đơn đang chờ xác nhận, chưa thanh toán.</p></aside></div>}
  </div></main>;
}
