import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money, today } from '../../lib/api';
import { useResource, type CatalogItem } from './catalog';
import { LocationSuggestions, type PlannerPlace } from './PlannerSuggestions';
import './planner-suggestions.css';
import ItineraryEvents from './ItineraryEvents';
import { eventError, type PlannedEvent } from './itinerary';
const newDay = () => ({ key: crypto.randomUUID(), tieuDe: '', ghiChu: '', activities: [] as PlannedEvent[] });

export default function ItineraryPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenChuyenDi: '', diemKhoiHanh: '', diemDen: params.get('destination') || '', ngayBatDau: today(), soNguoi: 1, nganSach: 0, moTa: '' });
  const [days, setDays] = useState(() => {
    const day = newDay();
    const restaurant = Number(params.get('restaurant'));
    if (Number.isSafeInteger(restaurant) && restaurant > 0) day.activities.push({ key: crypto.randomUUID(), loaiDiaDiem: 'NhaHang', maDoiTuong: restaurant, thoiGianBatDau: '', thoiGianKetThuc: '', ghiChu: '' });
    return [day];
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const catalog = useResource<PlannerPlace[]>('/diadiem');
  const restaurants = useResource<CatalogItem[]>('/nhahang');
  const hotels = useResource<CatalogItem[]>('/khachsan');
  const eventCatalog = { DiaDiem: catalog, NhaHang: restaurants, KhachSan: hotels };
  const places = (catalog.data || []).filter(place => place.trangThai);
  const unique = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => !!value?.trim()))];
  const origins = unique(['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Huế', 'Cần Thơ', ...places.flatMap(place => [place.tinhThanh, place.quanHuyen])]);
  const destinations = unique(places.flatMap(place => [place.tinhThanh, place.quanHuyen, place.tenDiaDiem]));
  const change = (name: string, value: string | number) => setForm(old => ({ ...old, [name]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting.current) return;
    if (!form.tenChuyenDi.trim() || !form.diemDen.trim() || days.some(d => !d.tieuDe.trim())) return setError('Nhập tên chuyến đi, điểm đến và tiêu đề cho mỗi ngày.');
    for (let i = 0; i < days.length; i++) {
      const problem = eventError(days[i].activities);
      if (problem) return setError(`Ngày ${i + 1}: ${problem}`);
    }
    setError(''); setBusy(true); submitting.current = true;
    try {
      const response = await api.post('/account/itineraries', { ...form, days: days.map(d => ({ tieuDe: d.tieuDe, ghiChu: d.ghiChu, activities: d.activities.map(a => ({ loaiDiaDiem: a.loaiDiaDiem, maDoiTuong: a.maDoiTuong, ghiChu: a.ghiChu, thoiGianBatDau: a.thoiGianBatDau + ':00', thoiGianKetThuc: a.thoiGianKetThuc + ':00' })) })) });
      navigate(`/account?tab=trips&trip=${response.data.id}`, { replace: true });
    }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); submitting.current = false; }
  };
  return <main className="user-page"><div className="user-container"><Link className="user-text-link" to="/account">Tài khoản của tôi</Link><div className="detail-heading"><h1>Đi theo cách của riêng mình.</h1><p>Sắp xếp giờ tham quan, nghỉ ngơi và ăn uống cho từng ngày của chuyến đi.</p></div><form className="detail-layout" onSubmit={submit}><div>
    <section className="user-panel user-form"><h2>Thông tin chuyến đi</h2><label>Tên chuyến đi<input required maxLength={200} value={form.tenChuyenDi} onChange={e => change('tenChuyenDi', e.target.value)} placeholder="Ví dụ: Cuối tuần khám phá Hội An" /></label><div className="user-form-grid"><LocationSuggestions label="Khởi hành từ" value={form.diemKhoiHanh} options={origins} onChange={value => change('diemKhoiHanh', value)} /><LocationSuggestions label="Điểm đến tại Việt Nam" value={form.diemDen} options={destinations} onChange={value => change('diemDen', value)} /><label>Ngày bắt đầu<input required type="date" min={today()} value={form.ngayBatDau} onChange={e => change('ngayBatDau', e.target.value)} /></label><label>Số người<input required type="number" min={1} max={100} value={form.soNguoi} onChange={e => change('soNguoi', Number(e.target.value))} /></label><label>Ngân sách dự kiến (VND)<input required type="number" min={0} max={1000000000} step={1000} value={form.nganSach} onChange={e => change('nganSach', Number(e.target.value))} /></label></div><label>Ghi chú chung<textarea maxLength={2000} value={form.moTa} onChange={e => change('moTa', e.target.value)} placeholder="Điều bạn muốn trải nghiệm trong chuyến đi" /></label></section>
    <section className="user-panel user-form"><h2>Kế hoạch từng ngày</h2>
      <p>Thêm điểm tham quan, nhà hàng hoặc khách sạn. Các hoạt động sẽ được xếp theo giờ khi lưu; tối đa 20 hoạt động mỗi ngày.</p>{days.map((day, index) => <fieldset className="planner-day" key={day.key}><legend>Ngày {index + 1}</legend><label>Tiêu đề<input required maxLength={200} value={day.tieuDe} onChange={e => setDays(old => old.map((d, i) => i === index ? { ...d, tieuDe: e.target.value } : d))} placeholder="Ví dụ: Dạo phố cổ và thưởng thức ẩm thực" /></label><label htmlFor={`planner-notes-${index}`}>Ghi chú cho ngày này</label><textarea id={`planner-notes-${index}`} maxLength={4000} value={day.ghiChu} onChange={e => setDays(old => old.map((d, i) => i === index ? { ...d, ghiChu: e.target.value } : d))} placeholder="Buổi sáng: ...&#10;Buổi chiều: ...&#10;Buổi tối: ..." /><ItineraryEvents events={day.activities} day={index + 1} destination={form.diemDen} catalog={eventCatalog} onChange={activities => setDays(old => old.map(d => d.key === day.key ? { ...d, activities } : d))} />{days.length > 1 && <button type="button" className="user-text-link" onClick={() => setDays(old => old.filter((_, i) => i !== index))}>Bỏ ngày này</button>}</fieldset>)}<button className="user-button secondary" type="button" disabled={days.length >= 30} onClick={() => setDays(old => [...old, newDay()])}>Thêm một ngày</button><p className="subtle">Tối đa 30 ngày cho một lịch trình.</p></section>
    </div><aside className="user-panel detail-aside"><h2>{form.diemDen || 'Chuyến đi của bạn'}</h2><p>{days.length} ngày / {form.soNguoi} người</p><strong className="summary-total">{money(form.nganSach)}</strong><p>Kế hoạch này được lưu riêng trong tài khoản của bạn. Việc lưu lịch trình không tạo đơn đặt tour, đặt phòng hay đặt bàn nhà hàng.</p>{error && <p className="user-alert" role="alert">{error}</p>}<button className="user-button" type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu lịch trình'}</button></aside></form></div></main>;
}
