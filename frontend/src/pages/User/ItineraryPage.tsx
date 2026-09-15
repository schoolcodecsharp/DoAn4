import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money, today } from '../../lib/api';

export default function ItineraryPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenChuyenDi: '', diemKhoiHanh: '', diemDen: params.get('destination') || '', ngayBatDau: today(), soNguoi: 1, nganSach: 0, moTa: '' });
  const [days, setDays] = useState([{ tieuDe: '', ghiChu: '' }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const change = (name: string, value: string | number) => setForm(old => ({ ...old, [name]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting.current) return;
    if (!form.tenChuyenDi.trim() || !form.diemDen.trim() || days.some(d => !d.tieuDe.trim())) return setError('Nhập tên chuyến đi, điểm đến và tiêu đề cho mỗi ngày.');
    setError(''); setBusy(true); submitting.current = true;
    try { await api.post('/account/itineraries', { ...form, days }); navigate('/account', { replace: true }); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); submitting.current = false; }
  };
  return <main className="user-page"><div className="user-container"><Link className="user-text-link" to="/account">Tài khoản của tôi</Link><div className="detail-heading"><p className="user-kicker">HÀNH TRÌNH DO BẠN VIẾT</p><h1>Đi theo cách của riêng mình.</h1><p>Sắp xếp điểm đến, ghi chú từng ngày và lưu kế hoạch vào tài khoản.</p></div><form className="detail-layout" onSubmit={submit}><div>
    <section className="user-panel user-form"><h2>Thông tin chuyến đi</h2><label>Tên chuyến đi<input required maxLength={200} value={form.tenChuyenDi} onChange={e => change('tenChuyenDi', e.target.value)} placeholder="Ví dụ: Cuối tuần khám phá Hội An" /></label><div className="user-form-grid"><label>Khởi hành từ<input required maxLength={200} value={form.diemKhoiHanh} onChange={e => change('diemKhoiHanh', e.target.value)} placeholder="Thành phố của bạn" /></label><label>Điểm đến tại Việt Nam<input required maxLength={200} value={form.diemDen} onChange={e => change('diemDen', e.target.value)} placeholder="Bạn muốn đến đâu?" /></label><label>Ngày bắt đầu<input required type="date" min={today()} value={form.ngayBatDau} onChange={e => change('ngayBatDau', e.target.value)} /></label><label>Số người<input required type="number" min={1} max={100} value={form.soNguoi} onChange={e => change('soNguoi', Number(e.target.value))} /></label><label>Ngân sách dự kiến (VND)<input required type="number" min={0} max={1000000000} step={1000} value={form.nganSach} onChange={e => change('nganSach', Number(e.target.value))} /></label></div><label>Ghi chú chung<textarea maxLength={2000} value={form.moTa} onChange={e => change('moTa', e.target.value)} placeholder="Điều bạn muốn trải nghiệm trong chuyến đi" /></label></section>
    <section className="user-panel user-form"><h2>Kế hoạch từng ngày</h2>{days.map((day, index) => <fieldset className="planner-day" key={index}><legend>Ngày {index + 1}</legend><label>Tiêu đề<input required maxLength={200} value={day.tieuDe} onChange={e => setDays(old => old.map((d, i) => i === index ? { ...d, tieuDe: e.target.value } : d))} placeholder="Ví dụ: Dạo phố cổ và thưởng thức ẩm thực" /></label><label>Các điểm đến và hoạt động<textarea maxLength={4000} value={day.ghiChu} onChange={e => setDays(old => old.map((d, i) => i === index ? { ...d, ghiChu: e.target.value } : d))} placeholder="Buổi sáng: ...&#10;Buổi chiều: ...&#10;Buổi tối: ..." /></label>{days.length > 1 && <button type="button" className="user-text-link" onClick={() => setDays(old => old.filter((_, i) => i !== index))}>Bỏ ngày này</button>}</fieldset>)}<button className="user-button secondary" type="button" disabled={days.length >= 30} onClick={() => setDays(old => [...old, { tieuDe: '', ghiChu: '' }])}>Thêm một ngày</button><p className="subtle">Tối đa 30 ngày cho một lịch trình.</p></section>
    </div><aside className="user-panel detail-aside"><p className="user-kicker">TỔNG QUAN</p><h2>{form.diemDen || 'Chuyến đi của bạn'}</h2><p>{days.length} ngày / {form.soNguoi} người</p><strong className="summary-total">{money(form.nganSach)}</strong><p>Kế hoạch này được lưu riêng trong tài khoản của bạn. Việc lưu lịch trình không tạo đơn đặt tour hay đặt phòng.</p>{error && <p className="user-alert" role="alert">{error}</p>}<button className="user-button" type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu lịch trình'}</button></aside></form></div></main>;
}
