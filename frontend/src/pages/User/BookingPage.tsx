import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { api, dateLabel, errorMessage, money, today } from '../../lib/api';
import { catalogs, itemName, useResource, type CatalogItem, type Departure, type Room } from './catalog';
import { useRoomQuote } from './useRoomQuote';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

export default function BookingPage({ kind }: { kind: 'tours' | 'hotels' }) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  // Reset form and success state when a different service/option is selected
  // through client-side navigation (including browser Back/Forward).
  return <BookingForm key={`${kind}/${id}/${params.get(kind === 'tours' ? 'departure' : 'room') || ''}`} kind={kind} />;
}

function BookingForm({ kind }: { kind: 'tours' | 'hotels' }) {
  const navigate = useNavigate();
  const editor = useRef<HTMLFormElement>(null);
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
  const quote = useRoomQuote(id, selected, checkin, nights, rooms, people, kind === 'hotels' && !!choice && checkin >= today());
  const ready = !!choice && (kind === 'tours' || (!quote.loading && !quote.error && quote.quote?.available === true));
  const validate = () => {
    const errors: Record<string, string> = {};
    if (kind === 'hotels') {
      if (checkout && (!nights || nights > 30)) errors.ngayTraPhong = 'Ngày trả phải sau ngày nhận phòng, tối đa 30 đêm.';
      if (choice && people > choice.sucChua * rooms) errors.soNguoi = `Số phòng đã chọn chỉ đủ cho ${choice.sucChua * rooms} khách. Giảm số khách hoặc tăng số phòng.`;
      if (quote.quote?.available === false) errors.soLuongPhong = quote.quote.message || 'Không đủ phòng cho kỳ lưu trú đã chọn.';
    }
    return errors;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting.current) return;
    setError('');
    if (!choice) return setError('Vui lòng chọn lịch khởi hành hoặc loại phòng.');
    if (!Number.isInteger(people) || people < 1 || people > 100) return setError('Số khách phải từ 1 đến 100.');
    if (kind === 'tours' && people > choice.soChoToiDa - choice.soChoDaDat) return setError('Số khách vượt quá số chỗ còn lại.');
    if (kind === 'hotels') {
      if (!nights || nights > 30 || checkin < today()) return setError('Chọn ngày nhận phòng từ hôm nay và ngày trả sau ngày nhận, tối đa 30 đêm.');
      if (!Number.isInteger(rooms) || rooms < 1 || rooms > choice.soLuongPhong) return setError('Số phòng phải là số nguyên trong số lượng đang mở bán.');
      if (people > choice.sucChua * rooms) return setError(`Số phòng đã chọn chỉ đủ cho ${choice.sucChua * rooms} khách. Hãy tăng số phòng hoặc giảm số khách.`);
      if (!ready) return setError('Hãy kiểm tra lại phòng trống cho ngày đã chọn trước khi gửi yêu cầu.');
    }
    submitting.current = true; setBusy(true);
    try {
      const body = kind === 'tours' ? { maKhoiHanh: choice.maKhoiHanh, soNguoi: people, ghiChu: note } : { maLoaiPhong: choice.maLoaiPhong, ngayNhanPhong: checkin, ngayTraPhong: checkout, soLuongPhong: rooms, soNguoi: people, ghiChu: note };
      const { data } = await api.post(`/account/bookings/${kind}`, body);
      setSuccess(data);
    } catch (err) { setError(errorMessage(err)); reportFormError(editor.current, err, { selected: ['maKhoiHanh', 'maLoaiPhong', 'loại phòng', 'lịch khởi hành'], soNguoi: ['số khách', 'số người', 'sức chứa'], soLuongPhong: ['số phòng', 'phòng trống'], ngayNhanPhong: ['ngày nhận'], ngayTraPhong: ['ngày trả'], ghiChu: ['ghi chú'] }); }
    finally { submitting.current = false; setBusy(false); }
  };
  if (success) return <main className="user-page"><section className="user-container booking-success user-panel"><h1 role="status">Yêu cầu đặt chỗ đã được lưu thành công.</h1><p>Đơn {kind === 'tours' ? 'tour' : 'phòng'} số <strong>{success.id}</strong> đang chờ xác nhận.</p><p>Tổng tiền: <strong>{money(success.total)}</strong>. Bạn chưa bị trừ tiền; đây chưa phải xác nhận thanh toán.</p><Link className="user-button" to={`/account?tab=${kind}`}>Xem đơn đặt của tôi</Link></section></main>;
  return <main className="user-page"><div className="user-container"><Link className="user-text-link" to={`/${kind}/${id}`}>Trở lại thông tin chi tiết</Link><div className="detail-heading"><p className="user-kicker">ĐẶT DỊCH VỤ</p><h1>{kind === 'tours' ? 'Sẵn sàng cho chuyến đi.' : 'Chọn ngày nghỉ của bạn.'}</h1><p>{item.data && itemName(item.data)}</p></div>
    {(item.loading || options.loading) && <p role="status">Đang tải thông tin đặt chỗ...</p>}
    {(item.error || options.error) && <div className="user-empty" role="alert"><p>{item.error || options.error}</p><button className="user-button" onClick={() => { item.reload(); options.reload(); }}>Thử lại</button></div>}
    {item.data && options.data && <FormDialog wide title={`Đặt ${kind === 'tours' ? 'tour' : 'phòng'} · ${itemName(item.data)}`} busy={busy} onClose={() => navigate(`/${kind}/${id}`)}><div className="detail-layout"><ValidatedForm className="user-panel user-form" formRef={editor} onSubmit={submit} validate={validate}>
      <h2>Thông tin đặt {kind === 'tours' ? 'tour' : 'phòng'}</h2>
      {!choices.length && <p className="user-alert">Hiện chưa có lựa chọn có thể đặt cho dịch vụ này.</p>}
      <label>{kind === 'tours' ? 'Ngày khởi hành' : 'Loại phòng'}<select name="selected" required value={selected} onChange={e => setSelected(e.target.value)}><option value="">Chọn {kind === 'tours' ? 'ngày khởi hành' : 'loại phòng'}</option>{choices.map(o => <option key={kind === 'tours' ? o.maKhoiHanh : o.maLoaiPhong} value={kind === 'tours' ? o.maKhoiHanh : o.maLoaiPhong}>{kind === 'tours' ? `${dateLabel(o.ngayKhoiHanh)} - ${money(o.giaApDung)} - còn ${o.soChoToiDa - o.soChoDaDat} chỗ` : `${o.tenLoaiPhong} - ${money(o.giaMoiDem)} / đêm`}</option>)}</select></label>
      {kind === 'hotels' && <div className="user-form-grid"><label>Ngày nhận phòng<input name="ngayNhanPhong" type="date" required min={today()} value={checkin} onChange={e => setCheckin(e.target.value)} /></label><label>Ngày trả phòng<input name="ngayTraPhong" type="date" required min={checkin} value={checkout} onChange={e => setCheckout(e.target.value)} /></label><label>Số phòng<input name="soLuongPhong" type="number" required min={1} max={choice?.soLuongPhong || 20} value={rooms} onChange={e => setRooms(Number(e.target.value))} /></label></div>}
      <label>Số khách<input name="soNguoi" type="number" required min={1} max={kind === 'tours' && choice ? choice.soChoToiDa - choice.soChoDaDat : 100} value={people} onChange={e => setPeople(Number(e.target.value))} /></label>
      {kind === 'hotels' && choice && <p>Tối đa {choice.sucChua} khách mỗi phòng. Phòng trống được kiểm tra lại khi gửi yêu cầu.</p>}
      <label>Ghi chú (không bắt buộc)<textarea name="ghiChu" maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="Yêu cầu của bạn cho chuyến đi" /></label>
      {error && <p className="user-alert" role="alert">{error}</p>}
      <section className="booking-confirmation" aria-label="Kiểm tra trước khi đặt"><h3>Kiểm tra trước khi gửi</h3><p>{people} khách{kind === 'hotels' ? ` · ${rooms} phòng · ${nights} đêm` : ''}</p>{kind === 'hotels' ? <p>{dateLabel(checkin)} – {checkout ? dateLabel(checkout) : 'Chưa chọn ngày trả'}</p> : choice && <p>Khởi hành {dateLabel(choice.ngayKhoiHanh)}</p>}
        {kind === 'hotels' && <div aria-live="polite">{quote.loading ? <p>Đang kiểm tra phòng theo ngày đã chọn…</p> : quote.error ? <p role="alert">{quote.error}</p> : quote.quote ? <p>{quote.quote.available ? `Còn ${quote.quote.availableRooms} phòng cho toàn bộ kỳ nghỉ.` : quote.quote.message || 'Không đủ phòng cho lựa chọn này.'}</p> : <p>Chọn loại phòng, ngày nhận–trả và số phòng để kiểm tra.</p>}<button type="button" className="user-text-link" disabled={quote.loading || !choice || !nights} onClick={quote.reload}>Kiểm tra lại phòng</button></div>}
        <small>Tổng tiền dự kiến</small><strong className="summary-total">{kind === 'hotels' ? quote.quote?.minTotal != null ? money(quote.quote.minTotal) : 'Chờ kiểm tra lựa chọn' : choice ? money(total) : 'Chưa chọn ngày khởi hành'}</strong><p>Gửi yêu cầu chưa phải thanh toán hoặc xác nhận giữ chỗ. Giá và chỗ còn sẽ được kiểm tra lại khi gửi.</p>
      </section><button className="user-button" disabled={busy || quote.loading || !!quote.error || !choices.length} type="submit">{busy ? 'Đang gửi yêu cầu...' : 'Xác nhận yêu cầu đặt chỗ'}</button>
    </ValidatedForm><aside className="user-panel detail-aside"><h2>{itemName(item.data)}</h2><p>Người đặt: {user?.hoTen}</p><p>{user?.email}</p><hr /><h3>Sau khi gửi yêu cầu</h3><p>Theo dõi trạng thái đặt chỗ và thanh toán riêng trong tài khoản của bạn.</p><p>Bạn có thể gửi yêu cầu hủy trước ngày sử dụng nếu đơn đủ điều kiện; quản trị viên sẽ xử lý yêu cầu.</p></aside></div></FormDialog>}
  </div></main>;
}
