import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { api, errorMessage } from '../../lib/api';
import { normalize, useResource } from '../User/catalog';
import { FeaturedLibraryPhoto } from '../User/Photo';
import ProvinceSelect from '../../components/ProvinceSelect';
import ImageManager from './ImageManager';
import { modules, type Row, type Field, type Module } from './schema';
import './admin.css';
import './coverage.css';
import DataExplorer, { Coverage } from './DataExplorer';
import Payments from './Payments';
import { dataSections } from './dataRegistry';
import { AuditLog, Dashboard, Orders, Pager } from './Operations';
const operations: Record<string,string> = { 'tour-orders':'Đơn tour', 'room-orders':'Đơn phòng', audit:'Nhật ký quản trị',payments:'Thanh toán',coverage:'Đối chiếu database',...Object.fromEntries(Object.entries(dataSections).map(([key,value])=>[key,value.title])) };

const text = (value: unknown) => value == null ? '' : String(value);
const navigation = ['destinations','tours','hotels','rooms','restaurants','categories','users','coupons','expenses','activities','departures'];
function Lookup({ field, value, change, disabled }: { field: Field; value: unknown; change: (value: unknown) => void; disabled?: boolean }) {
  const { data, loading, error, reload } = useResource<Row[]>(`/${field.lookup}`);
  return <><select aria-label={field.label} required={field.required} value={text(value)} onChange={e => change(e.target.value ? Number(e.target.value) : null)} disabled={disabled || loading || !!error}><option value="">{loading ? 'Đang tải…' : 'Chọn ' + field.label.toLowerCase()}</option>{data?.map(row => <option key={text(row[field.id!])} value={text(row[field.id!])}>{text(row[field.name!])}</option>)}</select>{error && <span role="alert">{error} <button type="button" onClick={reload}>Thử lại</button></span>}{!!value && ['diadiem','nhahang','khachsan'].includes(field.lookup || '') && <div className="admin-lookup-photo"><FeaturedLibraryPhoto key={text(value)} ownerId={Number(value)} type={field.lookup === 'nhahang' ? 'NhaHang' : field.lookup === 'khachsan' ? 'KhachSan' : 'DiaDiem'} /></div>}</>;
}
function Editor({ config, row, onSaved, onCancel, maxDays }: { config: Module; row: Row; onSaved: (row: Row) => void; onCancel: () => void; maxDays?: number }) {
  const editor = useRef<HTMLFormElement>(null);
  useEffect(() => { editor.current?.scrollIntoView({ block: 'start' }); editor.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll:true }); }, []);
  const [values, setValues] = useState<Row>({ ...row });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editing = !!row[config.id];
  const change = (key: string, value: unknown) => setValues(v => ({ ...v, [key]: value }));
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return; setError('');
    if (Number(values.soNguoiToiThieu) > Number(values.soNguoiToiDa)) { setError('Số khách tối thiểu không được lớn hơn tối đa.'); return; }
    if (Number(values.giaVeMin) > Number(values.giaVeMax)) { setError('Giá vé thấp nhất không được lớn hơn cao nhất.'); return; }
    if (maxDays && Number(values.ngayThu) > maxDays) { setError(`Tour này chỉ có ${maxDays} ngày.`); return; }
    if (Number(values.soChoToiDa) < Number(values.soChoDaDat)) { setError('Tổng số chỗ không được thấp hơn số chỗ đã đặt.'); return; }
    if (values.thoiGianBatDau && values.thoiGianKetThuc && text(values.thoiGianBatDau) >= text(values.thoiGianKetThuc)) { setError('Giờ kết thúc phải sau giờ bắt đầu trong ngày.'); return; }
    if (config.endpoint === 'nhahang' && Number(values.giaMin) > Number(values.giaMax)) { setError('Chi phí thấp nhất không được lớn hơn cao nhất.'); return; }
    if (config.endpoint === 'magiamgia' && (text(values.ngayKetThuc) <= text(values.ngayBatDau) || values.loaiGiam === 'PhanTram' && Number(values.giaTriGiam) > 100)) { setError('Kiểm tra ngày hiệu lực và phần trăm giảm (tối đa 100).'); return; }
    const payload = { ...values };
    if (config.endpoint === 'tour') payload.moTa = values.moTa || '';
    if (config.endpoint === 'tourchitiet') {
      for (const [type, key] of [['DiaDiem','maDiaDiem'],['NhaHang','maNhaHang'],['KhachSan','maKhachSan']]) if (values.loaiDiaDiem !== type) payload[key] = null;
    }
    for (const field of config.fields) {
      if (field.type === 'time') payload[field.key] = values[field.key] ? text(values[field.key]).slice(0,5) + ':00' : null;
      if (field.type === 'password' && editing || field.createOnly && editing) delete payload[field.key];
      if (field.type === 'datetime-local') payload[field.key] = text(values[field.key]).slice(0,16) + ':00';
    }
    setBusy(true);
    try {
      const response = editing ? await api.put(`/${config.endpoint}/${row[config.id]}`,payload) : await api.post(`/${config.endpoint}`,payload);
      const id = row[config.id] || response.data?.[config.id] || response.data?.id;
      if (!id) throw new Error('Không nhận được mã bản ghi sau khi lưu.');
      onSaved({ ...payload, [config.id]: id });
    } catch(e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <form ref={editor} className="admin-panel" onSubmit={save}><div className="admin-section-title"><h2>{editing ? 'Chỉnh sửa' : 'Thêm mới'} {config.title.toLowerCase()}</h2><button type="button" className="secondary" onClick={onCancel} disabled={busy}>Đóng</button></div><fieldset disabled={busy} className="admin-form-grid">{config.fields.filter(field => !(editing && field.type === 'password')).filter(field => !['maDiaDiem','maNhaHang','maKhachSan'].includes(field.key) || config.endpoint !== 'tourchitiet' || field.key === ({ DiaDiem:'maDiaDiem', NhaHang:'maNhaHang', KhachSan:'maKhachSan' }[text(values.loaiDiaDiem)])).map(field => {
    if (config.endpoint === 'loaiphong' && ['tenLoaiPhong','moTa'].includes(field.key))
      field = { ...field, maxLength: field.key === 'tenLoaiPhong' ? 150 : 500 };
    if (config.endpoint === 'tourkhoihanh' && !editing && field.key === 'trangThai')
      field = { ...field, options: field.options?.filter(([value]) => value === 'OpenForBooking' || value === 'FullyBooked') };
    const value = values[field.key];
    if (field.type === 'province') return <ProvinceSelect key={field.key} value={text(value)} onChange={v => change(field.key,v)}/>;
    return <label key={field.key} className={field.type === 'textarea' ? 'wide' : ''}>{field.label}{field.required ? ' *' : ''}
      {field.lookup ? <Lookup field={field} value={value} disabled={editing && field.createOnly} change={v => change(field.key,v)}/> : field.options ? <select disabled={editing && field.createOnly} value={text(value)} required onChange={e => change(field.key,field.type === 'number' ? Number(e.target.value) : e.target.value)}>{field.options.map(([v,label]) => <option value={v} key={v}>{label}</option>)}</select> : field.type === 'textarea' ? <textarea required={field.required} rows={4} value={text(value)} maxLength={field.maxLength || (field.key === 'ghiChu' ? 500 : undefined)} onChange={e => change(field.key,e.target.value)}/> : field.type === 'checkbox' ? <input type="checkbox" checked={!!value} onChange={e => change(field.key,e.target.checked)}/> : <input disabled={editing && field.createOnly} type={field.type || 'text'} required={field.required} min={field.min} max={field.key === 'ngayThu' ? maxDays : field.max} step={field.type === 'number' && ['viDo','kinhDo'].includes(field.key) ? 'any' : undefined} maxLength={field.maxLength || (field.type === 'password' ? 72 : 200)} minLength={field.type === 'password' ? 8 : undefined} autoComplete={field.type === 'password' ? 'new-password' : undefined} value={field.type === 'datetime-local' ? text(value).slice(0,16) : field.type === 'date' ? text(value).slice(0,10) : field.type === 'time' ? text(value).slice(0,5) : text(value)} onChange={e => change(field.key,field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}/>}</label>;
  })}</fieldset>{config.endpoint === 'tourkhoihanh' && editing && <p>Số chỗ đã đặt: {text(values.soChoDaDat)} (hệ thống quản lý theo đơn đặt).</p>}{error && <p className="admin-error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thông tin'}</button></form>;
}

function Manager({ moduleKey, tourId, maxDays }: { moduleKey: string; tourId?: number; maxDays?: number }) {
  const baseConfig = modules[moduleKey];
  const config: Module = !tourId && ['activities','departures'].includes(moduleKey) ? {...baseConfig,fields:[{key:'maTour',label:'Tour',lookup:'tour',id:'maTour',name:'tenTour',required:true},...baseConfig.fields]} : baseConfig;
  const [params,setParams] = useSearchParams();
  const { user } = useSession();
  const { data, loading, error, reload } = useResource<Row[]>(`/${config.endpoint}${tourId ? `/bytour/${tourId}` : ''}`);
  const [selected, setSelected] = useState<Row | null>(null);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [page,setPage]=useState(1);
  const softDelete=['tours','destinations','hotels','restaurants','categories','departures','rooms'].includes(moduleKey);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [tourTab, setTourTab] = useState('activities');
  const rows = (data || []).filter(row => (!params.get('id') || String(row[config.id]) === params.get('id')) && (!params.get('hotel') || String(row.maKhachSan) === params.get('hotel')) && (!params.get('trip') || String(row.maChuyenDi) === params.get('trip'))).filter(row => normalize(`${row[config.name]} ${row[config.id]} ${row.email || ''} ${row.tinhThanh || ''}`).includes(normalize(query)));
  const pages=Math.max(1,Math.ceil(rows.length/10)), current=Math.min(page,pages);
  function edit(row: Row) { setSelected(row); setVersion(n => n+1); setMessage(''); }
  async function remove(row: Row) {
    if (!window.confirm(softDelete ? `Ngừng bán / ẩn “${text(row[config.name])}”? Dữ liệu và đơn cũ được giữ lại.` : `Xóa “${text(row[config.name])}”? Thao tác không hoàn tác.`)) return;
    setBusy(true); setMessage('');
    try { await api.delete(`/${config.endpoint}/${row[config.id]}`); setMessage(softDelete ? 'Đã ngừng bán / ẩn; lịch sử được giữ nguyên.' : 'Đã xóa bản ghi.'); if (selected?.[config.id] === row[config.id]) setSelected(null); reload(); } catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  return <><section className="admin-panel"><div className="admin-section-title"><div><h2>{config.title}</h2></div><button onClick={() => edit({ ...config.defaults, ...(params.get('hotel') ? {maKhachSan:Number(params.get('hotel'))} : {}), ...(params.get('trip') ? {maChuyenDi:Number(params.get('trip'))} : {}), ...(tourId ? { maTour: tourId } : {}), ...(moduleKey === 'tours' ? { maNguoiTao:user!.maNguoiDung } : {}) })}>+ Thêm mới</button></div>{(params.get('id') || params.get('hotel') || params.get('trip')) && <p>Đang lọc theo liên kết. <button className="secondary" onClick={()=>setParams({})}>Xem tất cả</button></p>}{moduleKey === 'coupons' && <p>Quản lý cấu hình mã. Luồng đặt chỗ hiện chưa áp dụng mã vào tổng tiền; không hứa giảm giá cho khách khi chưa tích hợp nghiệp vụ này.</p>}<label className="admin-search">Tìm trong danh sách<input value={query} placeholder="Nhập tên hoặc mã…" onChange={e => {setQuery(e.target.value);setPage(1);}}/></label>{loading && <p role="status">Đang tải dữ liệu…</p>}{error && <p className="admin-error" role="alert">{error} <button onClick={reload}>Thử lại</button></p>}{!loading && !error && <><p className="admin-count">{rows.length} bản ghi</p><div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Mã</th><th>{config.title}</th><th>{moduleKey === 'activities' ? 'Ngày / Thứ tự' : moduleKey === 'expenses' ? 'Số tiền / chuyến đi' : 'Trạng thái'}</th><th>Thao tác</th></tr></thead><tbody>{rows.slice((current-1)*10,current*10).map(row => <tr key={text(row[config.id])}><td>#{text(row[config.id])}</td><td><strong>{text(row[config.name]) || text(row.tenDiaDiem)}</strong><small>{text(row.email || row.tinhThanh || row.diemDen || row.tenDiaDiem)}</small></td><td><span className="admin-badge">{moduleKey === 'expenses' ? `${Number(row.soTien).toLocaleString('vi-VN')} đ / Chuyến #${row.maChuyenDi}` : moduleKey === 'activities' ? `Ngày ${row.ngayThu} · ${row.thuTu}` : row.trangThai === true ? 'Hoạt động' : row.trangThai === false ? 'Đã khóa / ẩn' : text(row.trangThai)}</span></td><td><div className="admin-actions"><button className="secondary" onClick={() => edit(row)}>Chỉnh sửa</button>{!config.noDelete && <button className="danger" disabled={busy} onClick={() => remove(row)}>{softDelete ? 'Ngừng bán / Ẩn' : 'Xóa'}</button>}</div></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty">Chưa có bản ghi phù hợp.</p>}</div><Pager current={current} pages={pages} change={setPage}/></>}</section>{message && <p role="status" className="admin-notice">{message}</p>}
    {selected && <Editor key={version} config={config} row={selected} maxDays={maxDays} onCancel={() => setSelected(null)} onSaved={row => { setSelected(row); setVersion(n => n+1); setMessage('Đã lưu thành công.'); reload(); }}/>} 
    {selected && !!selected[config.id] && config.owner && <ImageManager key={text(selected[config.id])} owner={config.owner} id={Number(selected[config.id])}/>}
    {moduleKey === 'hotels' && selected && !!selected.maKhachSan && <p className="admin-panel"><Link to={`/admin/rooms?hotel=${selected.maKhachSan}`}>Quản lý loại phòng, giá và ảnh của khách sạn này</Link></p>}
    {moduleKey === 'tours' && selected && !!selected.maTour && <section className="admin-tour-children"><div className="admin-tabs"><button className={tourTab === 'activities' ? 'active' : 'secondary'} onClick={() => setTourTab('activities')}>Lịch trình từng ngày</button><button className={tourTab === 'departures' ? 'active' : 'secondary'} onClick={() => setTourTab('departures')}>Ngày khởi hành</button><Link to={`/tours/${selected.maTour}`}>Xem trang khách ↗</Link></div><Manager key={`${selected.maTour}-${tourTab}`} moduleKey={tourTab} tourId={Number(selected.maTour)} maxDays={Number(selected.soNgay)}/></section>}
  </>;
}
function Overview() {
  return <><section className="admin-panel"><h1>Không gian quản trị</h1><p>Danh mục, vận hành và dữ liệu chuyến đi được chia theo nghiệp vụ.</p><Link to="/admin/coverage">Kiểm tra giao diện cho từng bảng database</Link></section><Dashboard/><div className="admin-stat-grid">{navigation.map(key => <Statistic key={key} moduleKey={key}/>)}</div><section className="admin-panel"><h2>Bắt đầu với một tour mới</h2><ol><li>Tạo địa điểm, chọn loại và tỉnh thành; tải bộ ảnh cho từng điểm.</li><li>Tạo tour và lưu thông tin cơ bản ở trạng thái bản nháp.</li><li>Thêm hoạt động theo ngày, chọn địa điểm / nhà hàng / khách sạn.</li><li>Tải ảnh tour, tạo ngày khởi hành và chuyển sang đang mở bán.</li></ol><p>Quản lý tài khoản bằng cách khóa/mở và phân vai trò. Không xóa tài khoản để giữ lịch sử đặt dịch vụ.</p></section></>;
}
function Statistic({ moduleKey }: { moduleKey: string }) { const config = modules[moduleKey]; const { data, error } = useResource<Row[]>(`/${config.endpoint}`); return <Link className="admin-stat" to={`/admin/${moduleKey}`}><span>{config.title} ↗</span><strong>{data ? data.length : error ? '—' : '…'}</strong><small>{error ? 'Chưa tải được dữ liệu' : 'bản ghi trong hệ thống'}</small></Link>; }
export default function AdminPage() {
  const { user, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split('/')[2] || '';
  if (user?.maVaiTro !== 1) return <main className="user-page"><div className="user-container"><h1>Không có quyền truy cập</h1><p>Khu vực này chỉ dành cho quản trị viên.</p><Link to="/">Về trang chủ</Link></div></main>;
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-logo" to="/admin">NVT <span>QUẢN TRỊ</span></Link><label className="admin-mobile-switcher">Đi đến mục quản lý<select value={section} onChange={e=>navigate('/admin/'+e.target.value)}><option value="">Tổng quan</option>{navigation.map(key=><option key={key} value={key}>{modules[key].title}</option>)}{Object.entries(operations).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><nav><NavLink to="/admin" end>Tổng quan</NavLink>{[
    {label:'Danh mục dịch vụ',keys:['destinations','categories','restaurants','hotels','rooms','tours','activities','departures','images']},
    {label:'Đặt chỗ và tài chính',keys:['tour-orders','room-orders','payments','coupons']},
    {label:'Chuyến đi của khách',keys:['trips','days','events','members','expenses']},
    {label:'Khách hàng',keys:['users','roles','reviews','comments','favorites']},
    {label:'Hệ thống',keys:['coverage','audit']}
  ].map(group=><details className="admin-nav-group" key={group.label} open={group.keys.includes(section) || !section}><summary>{group.label}</summary>{group.keys.map(key=><NavLink key={key} to={`/admin/${key}`}>{modules[key]?.title || operations[key]}</NavLink>)}</details>)}</nav><div className="admin-sidebar-bottom"><Link to="/">← Xem website</Link><button className="secondary" onClick={logout}>Đăng xuất</button></div></aside><main className="admin-main"><header className="admin-topbar"><span>Không gian quản trị / {modules[section]?.title || operations[section] || 'Tổng quan'}</span><span>{user.hoTen} <b>Admin</b></span></header><div className="admin-content">{navigation.includes(section) ? <Manager key={section} moduleKey={section}/> : section === 'tour-orders' ? <Orders/> : section === 'room-orders' ? <Orders key="rooms" room/> : section === 'audit' ? <AuditLog/> : section === 'payments' ? <Payments/> : section === 'coverage' ? <Coverage/> : dataSections[section] ? <DataExplorer key={`${section}-${location.search}`} section={section}/> : !section ? <Overview/> : <section className="admin-panel"><h1>Không tìm thấy mục quản lý</h1><Link to="/admin/coverage">Xem danh mục chức năng</Link></section>}</div></main></div>;
}
