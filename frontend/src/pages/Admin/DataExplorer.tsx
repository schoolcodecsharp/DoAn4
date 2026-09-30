import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, dateLabel, errorMessage, money } from '../../lib/api';
import { normalize, useResource, type TravelImage } from '../User/catalog';
import { LibraryPhoto, FeaturedLibraryPhoto } from '../User/Photo';
import { dataSections, tableCoverage } from './dataRegistry';
import { Pager } from './Operations';
import ImageManager from './ImageManager';
import type { Row } from './schema';

const labels: Record<string,string> = {Planning:'Đang lập kế hoạch',Draft:'Bản nháp',Ongoing:'Đang đi',Completed:'Hoàn thành',Cancelled:'Đã hủy',Pending:'Chờ phản hồi',Accepted:'Đã tham gia',Rejected:'Đã từ chối',Owner:'Chủ chuyến đi',Member:'Thành viên',DiaDiem:'Điểm tham quan',NhaHang:'Nhà hàng',KhachSan:'Khách sạn',Tour:'Tour',LoaiPhong:'Loại phòng'};
const refRoutes: Record<string,string> = {maNguoiDung:'users',maChuyenDi:'trips',maLichTrinh:'days',maTour:'tours',maDiaDiem:'destinations',maNhaHang:'restaurants',maKhachSan:'hotels'};
function valueOf(key:string,value:unknown) {
  if(key==='daXacMinh')return value?'Đã xác minh':'Chưa xác minh';
  if(value===null||value===undefined||value==='')return 'Chưa cập nhật';
  if(typeof value==='boolean')return value?'Hiển thị / hoạt động':'Đã ẩn / khóa';
  if(['nganSach','chiPhi','soTien'].includes(key))return money(Number(value));
  if(key.startsWith('ngay')&&typeof value==='string')return dateLabel(value);
  if(key.startsWith('thoiGian'))return String(value).slice(0,5);
  return labels[String(value)] || String(value);
}
export function Coverage() {
  const {data,loading,error,reload}=useResource<{tables:string[]}>('/admin/coverage');
  const [query,setQuery]=useState('');
  const actual=new Set(data?.tables.map(t=>t.toLowerCase()));
  const unknown=data?.tables.filter(t=>!tableCoverage.some(([name])=>name.toLowerCase()===t.toLowerCase()))||[];
  const matched=tableCoverage.filter(([name])=>actual.has(name.toLowerCase()));
  return <section className="admin-panel"><div className="admin-section-title"><h1>Đối chiếu database</h1><button className="secondary" onClick={reload}>Kiểm tra lại</button></div><p>Mỗi bảng được nối với màn hình phù hợp. Các dữ liệu hệ thống và lịch sử có thể chỉ xem để bảo vệ nghiệp vụ.</p>{loading&&<p role="status">Đang đọc danh sách bảng từ database…</p>}{error&&<p role="alert">{error}</p>}{data&&<><p role="status"><strong>{matched.length}/{data.tables.length} bảng hiện có đã được ánh xạ.</strong></p>{unknown.length>0&&<p className="admin-error" role="alert">Chưa có giao diện cho: {unknown.join(', ')}.</p>}<label className="admin-search">Tìm bảng hoặc chức năng<input value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Bảng dữ liệu</th><th>Chức năng</th><th>Đi đến</th></tr></thead><tbody>{tableCoverage.filter(row=>normalize(row.join(' ')).includes(normalize(query))).map(([name,route,note])=><tr key={name}><td>{name}{!actual.has(name.toLowerCase())&&<small>Không có trong database hiện tại</small>}</td><td>{note}</td><td><Link to={`/admin/${route}`}>Mở quản lý</Link></td></tr>)}</tbody></table></div></>}</section>;
}
export default function DataExplorer({section}:{section:string}) {
  const config=dataSections[section];
  const {data,loading,error,reload}=useResource<Row[]>(`/${config.endpoint}`);
  const [params,setParams]=useSearchParams();
  const [query,setQuery]=useState(''),[page,setPage]=useState(1),[selected,setSelected]=useState<Row|null>(null);
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [album,setAlbum]=useState<{type:string;id:number}|null>(null);
  const idFilter=params.get('id'),trip=params.get('trip'),day=params.get('day');
  const rows=(data||[]).filter(r=>(!idFilter||String(r[config.id])===idFilter)&&(!trip||String(r.maChuyenDi)===trip)&&(!day||String(r.maLichTrinh)===day)&&normalize(config.fields.map(([key])=>String(r[key]??'')).join(' ')).includes(normalize(query)));
  const pages=Math.max(1,Math.ceil(rows.length/10)),current=Math.min(page,pages);
  async function moderate(row:Row) {
    const label=section==='comments'?'bình luận':'đánh giá';
    if(!window.confirm(`${row.trangThai?'Ẩn':'Hiện lại'} ${label} #${row[config.id]}? Nội dung của khách được giữ nguyên.`))return;
    setBusy(true);setNotice('');
    try {await api.put(`/${config.endpoint}/${row[config.id]}`,{trangThai:!row.trangThai});setSelected(null);setNotice(`Đã cập nhật trạng thái ${label}.`);reload();}catch(e){setNotice(errorMessage(e));}finally{setBusy(false);}
  }
  function cell(key:string,value:unknown) {
    return refRoutes[key]&&value ? <Link to={`/admin/${refRoutes[key]}?id=${value}`}>#{String(value)}</Link> : valueOf(key,value);
  }
  return <><section className="admin-panel"><div className="admin-section-title"><h1>{config.title}</h1><button className="secondary" onClick={reload}>Làm mới</button></div><p>{config.description}</p><label className="admin-search">Tìm trong dữ liệu<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label>{(idFilter||trip||day)&&<p>Đang lọc theo liên kết. <button className="secondary" onClick={()=>{setParams({});setSelected(null);}}>Xem tất cả</button></p>}{notice&&<p role="status" className="admin-notice">{notice}</p>}{loading&&<p role="status">Đang tải dữ liệu…</p>}{error&&<p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}{!loading&&!error&&<><p>{rows.length} bản ghi</p><div className="admin-table-wrap" role="region" tabIndex={0} aria-label="Bảng dữ liệu, cuộn ngang để xem thêm"><table><thead><tr><th>Mã</th>{config.fields.slice(0,4).map(([key,label])=><th key={key}>{label}</th>)}<th>Chi tiết</th></tr></thead><tbody>{rows.slice((current-1)*10,current*10).map(row=><tr key={String(row[config.id])}><td>#{String(row[config.id])}</td>{config.fields.slice(0,4).map(([key])=><td key={key}>{cell(key,row[key])}</td>)}<td><button className="secondary" onClick={()=>{setSelected(row);setAlbum(null);}}>Xem chi tiết #{String(row[config.id])}</button></td></tr>)}</tbody></table></div>{!rows.length&&<p>Chưa có bản ghi phù hợp. Thử bỏ bộ lọc hoặc tìm kiếm khác.</p>}<Pager current={current} pages={pages} change={setPage}/></>}</section>
    {selected&&<section className="admin-panel" aria-label="Chi tiết bản ghi"><div className="admin-section-title"><h2>Chi tiết #{String(selected[config.id])}</h2><button className="secondary" onClick={()=>{setSelected(null);setAlbum(null);}}>Đóng chi tiết</button></div><dl className="admin-record-detail">{config.fields.filter(([key])=>selected[key]!==null&&selected[key]!==undefined).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{cell(key,selected[key])}</dd></div>)}</dl>
      {section==='trips'&&<nav className="admin-related" aria-label="Dữ liệu chuyến đi"><Link to={`/admin/days?trip=${selected.maChuyenDi}`}>Xem từng ngày</Link><Link to={`/admin/members?trip=${selected.maChuyenDi}`}>Thành viên</Link><Link to={`/admin/expenses?trip=${selected.maChuyenDi}`}>Các khoản chi</Link></nav>}
      {section==='days'&&<Link to={`/admin/events?day=${selected.maLichTrinh}`}>Xem hoạt động trong ngày</Link>}
      {section==='reviews'&&<button disabled={busy} onClick={()=>moderate(selected)}>{selected.trangThai?'Ẩn đánh giá':'Hiện đánh giá'}</button>}
      {section==='comments'&&<button disabled={busy} onClick={()=>moderate(selected)}>{selected.trangThai?'Ẩn bình luận':'Hiện bình luận'}</button>}
      {section==='events'&&<FeaturedLibraryPhoto ownerId={Number(selected.maDiaDiem||selected.maNhaHang||selected.maKhachSan)} type={String(selected.loaiDiaDiem)}/>}
      {section==='images'&&<><LibraryPhoto photo={selected as unknown as TravelImage} className="admin-library-preview"/><button onClick={()=>setAlbum({type:String(selected.loaiDoiTuong),id:Number(selected.maDoiTuong)})}>Quản lý bộ ảnh dịch vụ này</button></>}
    </section>}{album&&<ImageManager key={`${album.type}/${album.id}`} owner={album.type} id={album.id}/>}</>;
}
