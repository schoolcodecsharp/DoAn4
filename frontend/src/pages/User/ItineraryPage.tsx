import SiteFooter from '../../components/SiteFooter';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, dateLabel, errorMessage, today } from '../../lib/api';
import { useResource, type CatalogItem } from './catalog';
import { LocationSuggestions, type PlannerPlace } from './PlannerSuggestions';
import './planner-suggestions.css';
import ItineraryEvents from './ItineraryEvents';
import { eventError, type PlannedEvent } from './itinerary';
import type { AccountData, Trip } from './AccountPage';
import { CostLedger } from './PlannerCosts';
import { dayDate, useEstimates } from './planner-pricing';
import './planner-costs.css';
import { useSession } from '../../context/AuthContext';
import { usePlannerDraft, type PlannerDay } from './planner-draft';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';
const newDay = () => ({ key: crypto.randomUUID(), tieuDe: '', ghiChu: '', activities: [] as PlannedEvent[] });

function DayForm({ day, onSave, onClose }: { day: PlannerDay; onSave: (day: PlannerDay) => void; onClose: () => void }) {
  const [values, setValues] = useState({ ...day });
  return <FormDialog title={day.tieuDe ? 'Chỉnh sửa thông tin ngày' : 'Thêm ngày vào lịch trình'} onClose={onClose}><ValidatedForm className="user-form" onSubmit={e => { e.preventDefault(); onSave(values); }}><label>Tiêu đề ngày<input name="tieuDe" required maxLength={200} value={values.tieuDe} onChange={e => setValues(v => ({ ...v, tieuDe: e.target.value }))} placeholder="Ví dụ: Dạo phố cổ và thưởng thức ẩm thực" /></label><label>Ghi chú cho ngày này<textarea name="ghiChu" maxLength={4000} value={values.ghiChu} onChange={e => setValues(v => ({ ...v, ghiChu: e.target.value }))} /></label><button className="user-button">Lưu ngày vào bản nháp</button></ValidatedForm></FormDialog>;
}

export default function ItineraryPage() {
  const [params] = useSearchParams();
  const { user } = useSession();
  const id = params.get('edit');
  return id ? <EditItinerary key={`${user?.maNguoiDung}:${id}`} id={id} /> : <ItineraryForm key={`${user?.maNguoiDung}:${params.toString()}`} />;
}

function EditItinerary({ id }: { id: string }) {
  const { data, loading, error, reload } = useResource<AccountData>('/account');
  if (loading) return <main className="user-page"><div className="user-container" role="status">Đang tải lịch trình...</div><SiteFooter /></main>;
  if (error) return <main className="user-page"><div className="user-container"><p role="alert">{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div><SiteFooter /></main>;
  const trip = data?.trips.find(t => String(t.maChuyenDi) === id && t.canEdit);
  if (!trip) return <main className="user-page"><div className="user-container"><p role="alert">Không thể sửa lịch trình này. Chỉ chủ chuyến đi được sửa kế hoạch chưa qua ngày bắt đầu.</p><Link to="/account?tab=trips">Về lịch trình của tôi</Link></div><SiteFooter /></main>;
  return <ItineraryForm initial={trip} />;
}

function ItineraryForm({ initial }: { initial?: Trip }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const [form, setForm] = useState(initial ? { tenChuyenDi: initial.tenChuyenDi, diemKhoiHanh: initial.diemKhoiHanh, diemDen: initial.diemDen, ngayBatDau: initial.ngayBatDau.slice(0, 10), soNguoi: initial.soNguoi, nganSach: initial.nganSach, moTa: initial.moTa || '' } : { tenChuyenDi: '', diemKhoiHanh: '', diemDen: params.get('destination') || '', ngayBatDau: today(), soNguoi: 1, nganSach: 0, moTa: '' });
  const [days, setDays] = useState<PlannerDay[]>(() => {
    if (initial?.days.length) return initial.days.map(d => ({ key: crypto.randomUUID(), tieuDe: d.tieuDe, ghiChu: d.ghiChu || '', activities: (d.activities || []).map(a => ({ ...a, quantity: a.estimate?.quantity, roomId: a.estimate?.roomId, rooms: a.estimate?.rooms, nights: a.estimate?.nights, key: crypto.randomUUID(), ghiChu: a.ghiChu || '', thoiGianBatDau: a.thoiGianBatDau?.slice(0, 5) || '', thoiGianKetThuc: a.thoiGianKetThuc?.slice(0, 5) || '' })) }));
    const day = newDay();
    const restaurant = Number(params.get('restaurant'));
    if (Number.isSafeInteger(restaurant) && restaurant > 0) day.activities.push({ key: crypto.randomUUID(), loaiDiaDiem: 'NhaHang', maDoiTuong: restaurant, thoiGianBatDau: '', thoiGianKetThuc: '', ghiChu: '' });
    return [day];
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const editor = useRef<HTMLFormElement>(null);
  const [editingDay, setEditingDay] = useState<PlannerDay | null>(null);
  const [notice, setNotice] = useState('');
  const draft = usePlannerDraft(`nvt:planner:v1:${user!.maNguoiDung}:${initial ? `edit-${initial.maChuyenDi}` : 'new'}`, initial?.revision ?? null, form, days);
  const catalog = useResource<PlannerPlace[]>('/diadiem');
  const restaurants = useResource<CatalogItem[]>('/nhahang');
  const hotels = useResource<CatalogItem[]>('/khachsan');
  const eventCatalog = { DiaDiem: catalog, NhaHang: restaurants, KhachSan: hotels };
  const estimate = useEstimates(form.ngayBatDau, form.soNguoi, days);
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
      const payload = { ...form, revision: initial?.revision, days: days.map(d => ({ tieuDe: d.tieuDe, ghiChu: d.ghiChu, activities: d.activities.map(a => ({ loaiDiaDiem: a.loaiDiaDiem, maDoiTuong: a.maDoiTuong, ghiChu: a.ghiChu, quantity: a.quantity, roomId: a.roomId, rooms: a.rooms, nights: a.nights, thoiGianBatDau: a.thoiGianBatDau + ':00', thoiGianKetThuc: a.thoiGianKetThuc + ':00' })) })) };
      const response = initial ? await api.put(`/account/itineraries/${initial.maChuyenDi}`, payload) : await api.post('/account/itineraries', payload);
      draft.finish();
      navigate(`/account?tab=trips&trip=${response.data.id}`, { replace: true, state: { formNotice: initial ? 'Đã cập nhật lịch trình thành công.' : 'Đã tạo lịch trình thành công.' } });
    }
    catch (err) { setError(errorMessage(err)); reportFormError(editor.current, err, { tenChuyenDi: ['tên chuyến đi'], diemDen: ['điểm đến'], ngayBatDau: ['ngày bắt đầu'], soNguoi: ['số người'], nganSach: ['ngân sách'] }); }
    finally { setBusy(false); submitting.current = false; }
  };
  return <main className="user-page planner-page"><div className="user-container"><Link className="user-text-link" to={initial ? `/account/trips/${initial.maChuyenDi}` : '/account'}>{initial ? 'Trở lại lịch trình (không lưu thay đổi)' : 'Tài khoản của tôi'}</Link><div className="detail-heading"><h1>{initial ? 'Sửa lịch trình của bạn.' : 'Một chuyến đi, rõ từng ngày.'}</h1><p>Sắp xếp điểm dừng, chọn nơi nghỉ và dự tính chi phí trước khi lên đường.</p></div>
    <FormDialog wide unsaved={draft.dirty} title={initial ? 'Chỉnh sửa lịch trình' : 'Tạo lịch trình mới'} busy={busy} onClose={() => navigate(initial ? `/account/trips/${initial.maChuyenDi}` : '/account?tab=trips')}>
    {draft.pending && <section className="planner-draft-notice" aria-label="Khôi phục bản nháp"><h2>Bạn có một bản nháp chưa lưu</h2><p>Lưu trên thiết bị lúc {new Date(draft.pending.savedAt).toLocaleString('vi-VN')}. Giá và phòng trống sẽ được tính lại khi khôi phục.</p><button className="user-button" type="button" onClick={() => { setForm(draft.pending!.form); setDays(draft.pending!.days); draft.restored(); }}>Khôi phục bản nháp</button> <button className="user-button secondary" type="button" onClick={draft.discard}>Bỏ bản nháp</button></section>}
    <p className="planner-draft-status" role="status">{draft.message || 'Bản nháp tự lưu trên trình duyệt này trong 7 ngày, riêng theo tài khoản. Không đồng bộ sang thiết bị khác.'}</p>
    <ValidatedForm formRef={editor} onSubmit={submit}><fieldset className="detail-layout planner-layout planner-editor" disabled={!!draft.pending || busy}><div className="planner-main">
    <section className="user-panel user-form"><h2>Thông tin chuyến đi</h2><label>Tên chuyến đi<input name="tenChuyenDi" required maxLength={200} value={form.tenChuyenDi} onChange={e => change('tenChuyenDi', e.target.value)} placeholder="Ví dụ: Cuối tuần khám phá Hội An" /></label><div className="user-form-grid"><LocationSuggestions name="diemKhoiHanh" label="Khởi hành từ" value={form.diemKhoiHanh} options={origins} onChange={value => change('diemKhoiHanh', value)} /><LocationSuggestions name="diemDen" label="Điểm đến tại Việt Nam" value={form.diemDen} options={destinations} onChange={value => change('diemDen', value)} /><label>Ngày bắt đầu<input name="ngayBatDau" required type="date" min={today()} value={form.ngayBatDau} onChange={e => change('ngayBatDau', e.target.value)} /></label><label>Số người<input name="soNguoi" required type="number" min={1} max={100} value={form.soNguoi} onChange={e => change('soNguoi', Number(e.target.value))} /></label><label>Ngân sách dự kiến (VND)<input name="nganSach" required type="number" min={0} max={1000000000} step={1000} value={form.nganSach} onChange={e => change('nganSach', Number(e.target.value))} /></label></div><label>Ghi chú chung<textarea name="moTa" maxLength={2000} value={form.moTa} onChange={e => change('moTa', e.target.value)} placeholder="Điều bạn muốn trải nghiệm trong chuyến đi" /></label></section>
    <section className="user-panel user-form"><h2>Kế hoạch từng ngày</h2>
      <p>Thêm điểm tham quan, nhà hàng hoặc khách sạn. Các hoạt động sẽ được xếp theo giờ khi lưu; tối đa 20 hoạt động mỗi ngày.</p>{notice && <p role="status">{notice}</p>}{days.map((day, index) => <fieldset className="planner-day" key={day.key}><legend>Ngày {index + 1} · {dateLabel(dayDate(form.ngayBatDau, index))}</legend><h3>{day.tieuDe || 'Chưa đặt tiêu đề ngày'}</h3><p className="preserve-lines">{day.ghiChu || 'Chưa có ghi chú.'}</p><button type="button" className="user-button secondary" onClick={() => setEditingDay(day)}>Chỉnh sửa ngày {index + 1}</button>{!day.tieuDe.trim() && error && <p role="alert" className="form-field-error">Nhập tiêu đề bằng biểu mẫu Chỉnh sửa ngày {index + 1}.</p>}<ItineraryEvents events={day.activities} day={index + 1} date={dayDate(form.ngayBatDau, index)} people={form.soNguoi} estimates={estimate.days?.[index]} estimating={estimate.loading} destination={form.diemDen} catalog={eventCatalog} onChange={activities => setDays(old => old.map(d => d.key === day.key ? { ...d, activities } : d))} />{days.length > 1 && <button type="button" className="user-text-link" onClick={() => { if (!day.activities.length || window.confirm('Bỏ ngày này và các hoạt động đã thêm? Ngày phía sau sẽ được dời lên.')) setDays(old => old.filter((_, i) => i !== index)); }}>Bỏ ngày này</button>}</fieldset>)}<button className="user-button secondary" type="button" disabled={days.length >= 30} onClick={() => setEditingDay(newDay())}>Thêm một ngày</button><p className="subtle">Tối đa 30 ngày cho một lịch trình.</p></section>
    </div><aside className="user-panel detail-aside planner-ledger"><div className="planner-ledger-content" tabIndex={0} aria-label="Chi tiết dự toán có thể cuộn"><p>{form.diemDen || 'Chuyến đi của bạn'} · {days.length} ngày / {form.soNguoi} người</p>{estimate.loading ? <p role="status">Đang cập nhật dự toán…</p> : estimate.error ? <p role="alert">{estimate.error}</p> : <CostLedger days={estimate.days || []} budget={form.nganSach} people={form.soNguoi} endDate={dayDate(form.ngayBatDau, days.length - 1)} />}<button className="user-text-link" type="button" disabled={estimate.loading} onClick={estimate.reload}>Kiểm tra lại giá và phòng</button><p className="cost-disclaimer">Lưu lịch trình không đặt vé, giữ phòng hay đặt bàn. Giá và phòng trống sẽ được kiểm tra lại khi đặt dịch vụ.</p>{error && <p className="user-alert" role="alert">{error}</p>}</div><div className="planner-save-actions"><button className="user-button" type="submit" disabled={busy || estimate.loading || !!estimate.error}>{busy ? 'Đang lưu...' : 'Lưu lịch trình'}</button></div></aside></fieldset></ValidatedForm></FormDialog>{editingDay && <DayForm key={editingDay.key} day={editingDay} onClose={() => setEditingDay(null)} onSave={day => { const exists = days.some(d => d.key === day.key); setDays(old => exists ? old.map(d => d.key === day.key ? day : d) : [...old, day]); setEditingDay(null); setNotice(exists ? 'Đã cập nhật ngày trong bản nháp.' : 'Đã thêm ngày vào bản nháp.'); }} />}</div><SiteFooter /></main>;
}
