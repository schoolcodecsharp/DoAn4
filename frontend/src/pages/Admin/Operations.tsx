import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, dateLabel, errorMessage, money } from '../../lib/api';
import { useResource } from '../User/catalog';

const statusNames: Record<string,string> = { Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận', Cancelled:'Đã hủy', Completed:'Hoàn thành', CheckedIn:'Đã nhận phòng', CheckedOut:'Đã trả phòng' };
const nextStates = (state: string, room: boolean): string[] => state === 'Pending' ? ['Confirmed','Cancelled'] : state === 'Confirmed' ? [room ? 'CheckedIn' : 'Completed','Cancelled'] : room && state === 'CheckedIn' ? ['CheckedOut'] : [];
type Order = { maDatTour?: number; maDatPhong?: number; maNguoiDung: number; maTour?: number; maLoaiPhong?: number; ngayKhoiHanh?: string; ngayNhanPhong?: string; ngayTraPhong?: string; tongTien: number; soNguoi: number; trangThai: string; ghiChu?: string };
export function Orders({ room = false }: { room?: boolean }) {
  const endpoint = room ? 'datphong' : 'dattour';
  const [params,setParams] = useSearchParams();
  const { data, loading, error, reload } = useResource<Order[]>(`/${endpoint}`);
  const [status, setStatus] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [busy, setBusy] = useState<number | null>(null), [notice, setNotice] = useState('');
  const id = (o: Order) => (room ? o.maDatPhong : o.maDatTour)!;
  const rows = (data || []).filter(o => (!params.get('id') || String(id(o)) === params.get('id')) && (!status || o.trangThai === status) && `${id(o)} ${o.maNguoiDung}`.includes(query.trim()));
  const pages = Math.max(1,Math.ceil(rows.length/10)), current = Math.min(page,pages);
  async function change(o: Order, next: string) {
    if (!window.confirm(`Chuyển đơn #${id(o)} sang “${statusNames[next]}”? Đơn đã hủy/hoàn tất không được mở lại.`)) return;
    setBusy(id(o)); setNotice('');
    try { await api.put(`/${endpoint}/${id(o)}`,{ trangThai:next }); setNotice('Đã cập nhật trạng thái và giữ nguyên lịch sử đơn.'); reload(); }
    catch(e) { setNotice(errorMessage(e)); } finally { setBusy(null); }
  }
  return <section className="admin-panel"><h1>{room ? 'Đơn đặt phòng' : 'Đơn đặt tour'}</h1><p>Giá được tính tại server. Đơn mới chờ xác nhận; không xóa hoặc sửa giá/khách của đơn đã tạo. Đơn đã thu tiền cần xử lý hoàn tiền trước khi hủy.</p>
    <div className="admin-filter-row"><label>Tìm mã đơn / khách<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><label>Trạng thái<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Tất cả</option>{Object.entries(statusNames).filter(([v])=>room ? v!=='Completed' : !['CheckedIn','CheckedOut'].includes(v)).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label><button className="secondary" onClick={reload}>Làm mới</button></div>
    <p><Link to="/admin/payments">Quản lý thanh toán của các đơn</Link></p>{params.get('id') && <button className="secondary" onClick={()=>setParams({})}>Bỏ lọc mã đơn</button>}
    {notice && <p role="status" className="admin-notice">{notice}</p>}{loading && <p role="status">Đang tải đơn…</p>}{error && <p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}
    {!loading && !error && <><p>{rows.length} đơn</p><div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Mã / khách</th><th>Dịch vụ / ngày</th><th>Tổng tiền</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{rows.slice((current-1)*10,current*10).map(o=><tr key={id(o)} data-testid={`order-${id(o)}`}><td>#{id(o)}<small>Khách #{o.maNguoiDung}</small></td><td>{room ? 'Loại phòng #'+o.maLoaiPhong : 'Tour #'+o.maTour}<small>{dateLabel((o.ngayKhoiHanh || o.ngayNhanPhong)!)}{o.ngayTraPhong && ' – '+dateLabel(o.ngayTraPhong)}</small><small>{o.soNguoi} khách</small></td><td>{money(o.tongTien)}</td><td>{statusNames[o.trangThai] || o.trangThai}</td><td><div className="admin-actions">{nextStates(o.trangThai,room).map(next=><button key={next} className={next==='Cancelled'?'danger':'secondary'} disabled={busy!==null} onClick={()=>change(o,next)}>{statusNames[next]}</button>)}{!nextStates(o.trangThai,room).length && <small>Đã kết thúc</small>}</div></td></tr>)}</tbody></table>{!rows.length && <p>Không có đơn phù hợp.</p>}</div><Pager current={current} pages={pages} change={setPage}/></>}
  </section>;
}
export function Pager({current,pages,change}:{current:number;pages:number;change:(page:number)=>void}) {
  return <nav className="list-pagination" aria-label="Phân trang"><button className="secondary" disabled={current<=1} onClick={()=>change(current-1)}>Trang trước</button><span aria-live="polite">Trang {current} / {pages}</span><button className="secondary" disabled={current>=pages} onClick={()=>change(current+1)}>Trang sau</button></nav>;
}
type Dashboard = {summary:{receivedRevenue:number;tourOrders:number;roomOrders:number;pendingOrders:number;cancelledOrders:number;activeTours:number};topTours:{id:number;name:string;orders:number;guests:number}[];monthly:{month:string;revenue:number}[];definition:string};
export function Dashboard() {
  const {data,loading,error,reload}=useResource<Dashboard>('/admin/dashboard');
  return <section className="admin-panel"><div className="admin-section-title"><h2>Hoạt động kinh doanh</h2><button className="secondary" onClick={reload}>Làm mới số liệu</button></div>{loading && <p role="status">Đang tổng hợp…</p>}{error && <p role="alert">{error}</p>}{data && <><div className="admin-stat-grid business-stats">{[
    ['Tiền đã thu',money(data.summary.receivedRevenue)],['Đơn tour',data.summary.tourOrders],['Đơn phòng',data.summary.roomOrders],['Chờ xác nhận',data.summary.pendingOrders],['Đã hủy',data.summary.cancelledOrders],['Tour mở bán',data.summary.activeTours]
  ].map(([label,value])=><div key={label} className="admin-stat"><span>{label}</span><strong>{value}</strong></div>)}</div><p className="subtle">{data.definition}</p><h3>Tour có nhiều khách đặt nhất</h3>{data.topTours.length ? <div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Tour</th><th>Đơn không hủy</th><th>Khách</th></tr></thead><tbody>{data.topTours.map(t=><tr key={t.id}><td>{t.name}</td><td>{t.orders}</td><td>{t.guests}</td></tr>)}</tbody></table></div> : <p>Chưa có đơn tour.</p>}<h3>Tiền đã thu theo tháng</h3><p>12 tháng gần nhất có giao dịch thành công.</p>{data.monthly.length ? <ul className="revenue-bars">{data.monthly.map(m=><li key={m.month}><span>{m.month}</span><meter min={0} max={Math.max(1,...data.monthly.map(x=>x.revenue))} value={m.revenue} aria-label={`Tiền thu tháng ${m.month}`}/><strong>{money(m.revenue)}</strong></li>)}</ul> : <p>Chưa có giao dịch thành công.</p>}</>}</section>;
}
type AuditPage = {items:{id:number;actorId:number;method:string;entity:string;entityId?:string;outcome:string;status?:number;createdAt:string;traceId:string}[];total:number};
export function AuditLog() {
  const [page,setPage]=useState(1); const {data,loading,error,reload}=useResource<AuditPage>(`/admin/audit?page=${page}&pageSize=20`);
  return <section className="admin-panel"><div className="admin-section-title"><h1>Nhật ký quản trị</h1><button onClick={reload}>Làm mới</button></div><p>Thời gian UTC. Chỉ đọc; không chứa mật khẩu/token. “Chưa xác nhận” nghĩa là chưa ghi nhận được kết quả cuối, không khẳng định thao tác đã thành công.</p>{loading && <p role="status">Đang tải nhật ký…</p>}{error && <p role="alert">{error}</p>}{data && <><div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Thời gian UTC</th><th>Admin</th><th>Thao tác</th><th>Kết quả</th></tr></thead><tbody>{data.items.map(log=><tr key={log.id}><td>{log.createdAt.replace('T',' ')}</td><td>#{log.actorId}</td><td>{log.method} {log.entity} {log.entityId && '#'+log.entityId}<small>{log.traceId}</small></td><td>{log.outcome==='Succeeded'?'Thành công':log.outcome==='Rejected'?'Không thành công':'Chưa xác nhận'} {log.status}</td></tr>)}</tbody></table></div>{!data.items.length && <p>Chưa có nhật ký.</p>}<Pager current={page} pages={Math.max(1,Math.ceil(data.total/20))} change={setPage}/></>}</section>;
}
