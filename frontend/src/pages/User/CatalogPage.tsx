import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { money } from '../../lib/api';
import { catalogs, itemId, itemLocation, itemName, normalize, useResource, type CatalogItem, type Kind } from './catalog';
import { LibraryPhoto } from './Photo';

export default function CatalogPage({ kind }: { kind: Kind }) {
  const config = catalogs[kind];
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('keyword') || '');
  const keyword = params.get('keyword') || '';
  const { data, loading, error, reload } = useResource<CatalogItem[]>(`/${config.endpoint}`);
  const heroPhoto = data?.flatMap(item => item.hinhAnh || [])[0];
  const items = (data || []).filter(item => item.trangThai !== false && item.trangThai !== 'Draft' && item.trangThai !== 'Cancelled').filter(item => normalize(`${itemName(item)} ${itemLocation(item)}`).includes(normalize(keyword)));
  const submit = (e: FormEvent) => { e.preventDefault(); setParams(input.trim() ? { keyword: input.trim() } : {}); };
  return <main className="user-page"><div className="user-container">
    <section className="catalog-intro"><div><p className="user-kicker">NVT DU LỊCH / {config.title}</p><h1>{config.heading}</h1><p>{config.description}</p><span className="guest-note">Xem tự do. Chỉ cần đăng nhập khi đặt chỗ hoặc lập lịch trình.</span></div>{heroPhoto && <LibraryPhoto key={heroPhoto.maHinhAnh} photo={heroPhoto} eager />}</section>
    <form className="catalog-search" onSubmit={submit}><label htmlFor="catalog-keyword">Bạn muốn đến đâu?</label><div><input id="catalog-keyword" value={input} onChange={e => setInput(e.target.value)} placeholder="Tên dịch vụ hoặc điểm đến tại Việt Nam" /><button className="user-button" type="submit">Tìm kiếm</button></div></form>
    <div className="section-line"><h2>{config.title} dành cho bạn</h2>{!loading && !error && <span>{items.length} kết quả{keyword ? ` cho “${keyword}”` : ''}</span>}</div>
    {loading && <div className="user-empty" role="status">Đang tải {config.title.toLowerCase()}...</div>}
    {error && <div className="user-empty" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {!loading && !error && !items.length && <div className="user-empty"><h3>Chưa có kết quả phù hợp</h3><p>Hãy thử một tên địa điểm khác hoặc quay lại sau khi dữ liệu được cập nhật.</p>{keyword && <button className="user-button secondary" onClick={() => { setInput(''); setParams({}); }}>Xóa bộ lọc</button>}</div>}
    <div className="catalog-grid">{items.map(item => {
      const photo = item.hinhAnh?.[0];
      const price = kind === 'tours' ? item.giaTour : kind === 'hotels' ? item.giaPhongMin : item.giaVe;
      return <article className="catalog-card" key={itemId(item, kind)}>
        {photo ? <LibraryPhoto key={photo.maHinhAnh} photo={photo} /> : <div className="catalog-placeholder"><span>{kind === 'hotels' ? 'NƠI LƯU TRÚ' : 'KHÁM PHÁ VIỆT NAM'}</span><strong>{itemLocation(item)}</strong><small>Hình ảnh đang được cập nhật</small></div>}
        <div className="catalog-card-body"><p className="user-kicker">{itemLocation(item)}</p><h3><Link to={`/${kind}/${itemId(item, kind)}`}>{itemName(item)}</Link></h3><p className="card-description">{item.moTa || 'Xem thông tin chi tiết để tìm hiểu thêm về dịch vụ.'}</p><p className="card-meta">{kind === 'tours' ? `${item.soNgay || 1} ngày / ${item.soDem || 0} đêm` : kind === 'hotels' ? (item.loaiLuuTru || 'Lưu trú') : (item.diaChi || 'Điểm tham quan tại Việt Nam')}</p><div className="card-bottom"><div><small>{kind === 'tours' ? 'Giá tham khảo / người' : kind === 'hotels' ? 'Giá từ / đêm' : 'Giá vé tham khảo'}</small><strong>{price !== undefined && price > 0 ? money(price) : 'Xem chi tiết'}</strong></div><Link className="user-text-link" to={`/${kind}/${itemId(item, kind)}`}>Xem chi tiết</Link></div></div>
      </article>;
    })}</div>
    <footer className="user-footer">NVT DU LỊCH <span>Những hành trình trên dải đất Việt Nam.</span></footer>
  </div></main>;
}
