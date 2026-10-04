import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { catalogPrice, matchesBudget } from './catalog-price';
import { money } from '../../lib/api';
import { catalogs, itemId, itemLocation, itemName, normalize, useResource, type CatalogItem, type Kind } from './catalog';
import { LibraryPhoto } from './Photo';
import { ProvinceFilter } from '../../components/ProvinceSelect';
import { provinceNames, provinceSearchText, resolveProvince, useProvinces } from '../../lib/provinces';

export default function CatalogPage({ kind }: { kind: Kind }) {
  const config = catalogs[kind];
  const location = useLocation();
  const returnState = { catalogUrl: location.pathname + location.search };
  const [params, setParams] = useSearchParams();
  const pendingParams=useRef(params);
  useLayoutEffect(()=>{ pendingParams.current=params; },[params]);
  const commit=(next:URLSearchParams) => { pendingParams.current=next; setParams(next,{replace:true}); };
  const clear=()=>{setInput('');commit(new URLSearchParams());};
  const [input, setInput] = useState(params.get('keyword') || '');
  const keyword = params.get('keyword') || '';
  const provinceResource = useProvinces();
  const provinces = provinceResource.data || [];
  const provinceParam = params.get('province') || '';
  const province = resolveProvince(provinceParam, provinces) || provinceParam;
  const { data, loading, error, reload } = useResource<CatalogItem[]>(`/${config.endpoint}`);
  const availability = useResource<{ tours: number[]; hotels: number[] }>('/catalog-availability');
  const hasInventory = (item: CatalogItem) => kind === 'tours' ? availability.data?.tours.includes(item.maTour!) : kind === 'hotels' ? availability.data?.hotels.includes(item.maKhachSan!) : false;
  const onlyBookable = (kind === 'tours' || kind === 'hotels') && params.get('availability') === 'bookable';
  const heroPhoto = data?.flatMap(item => item.hinhAnh || [])[0];
  const items = (data || []).filter(item => item.trangThai !== false && item.trangThai !== 'Draft' && item.trangThai !== 'Cancelled' && item.trangThai !== 'Inactive')
    .filter(item => normalize(`${itemName(item)} ${itemLocation(item)} ${provinceSearchText(item.tinhThanh || item.diemDen || '', provinces)}`).includes(normalize(keyword)))
    .filter(item => !province || provinceNames(item.tinhThanh || item.diemDen || '', provinces).some(name => normalize(name) === normalize(province)));
  const priceOf = (item: CatalogItem) => catalogPrice(item, kind);
  const numeric = (key:string) => { const v=Number(params.get(key)); return Number.isFinite(v) && v>=0 ? v : 0; };
  const minPrice=numeric('minPrice'), maxPrice=numeric('maxPrice'), days=numeric('days'), sort=params.get('sort') || '';
  const invalidPrice=maxPrice>0 && minPrice>maxPrice;
  const filtered=items.filter(item=>!invalidPrice && matchesBudget(priceOf(item), minPrice, maxPrice) && (!days || item.soNgay===days) && (!onlyBookable || hasInventory(item)))
    .sort((a,b)=> {
      if (sort === 'price-asc' || sort === 'price-desc') {
        const aPrice = priceOf(a), bPrice = priceOf(b);
        if (aPrice === null || bPrice === null) return Number(aPrice === null) - Number(bPrice === null);
        return sort === 'price-asc' ? aPrice-bPrice : bPrice-aPrice;
      }
      return sort === 'name' ? itemName(a).localeCompare(itemName(b),'vi') : (b.diemDanhGia || 0)-(a.diemDanhGia || 0) || (b.soLuotDanhGia || 0)-(a.soLuotDanhGia || 0);
    });
  const pages=Math.max(1,Math.ceil(filtered.length/6)), page=Math.min(pages,Math.max(1,Math.floor(numeric('page'))));
  const update=(key:string,value:string) => { const next=new URLSearchParams(pendingParams.current); if(value) next.set(key,value); else next.delete(key); if(key!=='page')next.delete('page'); commit(next); };
  const submit = (e: FormEvent) => { e.preventDefault(); const next = new URLSearchParams(pendingParams.current); if (input.trim()) next.set('keyword', input.trim()); else next.delete('keyword'); next.delete('page'); commit(next); };
  return <main className="user-page"><div className="user-container">
    <section className="catalog-intro"><div><p className="user-kicker">NVT DU LỊCH / {config.title}</p><h1>{config.heading}</h1><p>{config.description}</p><span className="guest-note">Xem tự do. Chỉ cần đăng nhập khi đặt chỗ hoặc lập lịch trình.</span></div>{heroPhoto && <LibraryPhoto key={heroPhoto.maHinhAnh} photo={heroPhoto} eager />}</section>
    <form className="catalog-search catalog-search--provinces" onSubmit={submit}><div className="catalog-keyword-filter"><label htmlFor="catalog-keyword">Bạn muốn đến đâu?</label><input id="catalog-keyword" value={input} onChange={e => setInput(e.target.value)} placeholder="Tên dịch vụ hoặc điểm đến tại Việt Nam" /></div><ProvinceFilter resource={provinceResource} value={province} onChange={value => { const next = new URLSearchParams(pendingParams.current); if (value) next.set('province', value); else next.delete('province'); next.delete('page'); commit(next); }} /><button className="user-button" type="submit">Tìm kiếm</button></form>
    {(kind === 'tours' || kind === 'hotels') && <div className="catalog-availability"><label><input type="checkbox" checked={onlyBookable} onChange={e => update('availability', e.target.checked ? 'bookable' : '')} />{kind === 'tours' ? 'Chỉ hiện tour có lịch khởi hành còn chỗ' : 'Chỉ hiện khách sạn có loại phòng mở bán'}</label><small>{kind === 'hotels' ? 'Phòng còn theo ngày sẽ được kiểm tra khi chọn kỳ nghỉ.' : 'Chỗ còn được kiểm tra lại khi gửi yêu cầu.'}</small>{availability.loading && <p role="status">Đang kiểm tra lựa chọn đặt…</p>}{availability.error && <p role="alert">Chưa kiểm tra được lựa chọn đặt. <button type="button" onClick={availability.reload}>Thử lại</button></p>}</div>}
    <details className="catalog-filter-disclosure" open={!!(minPrice || maxPrice || days || sort)}><summary>Bộ lọc thêm{[minPrice, maxPrice, days, sort].filter(Boolean).length > 0 ? ` · ${[minPrice, maxPrice, days, sort].filter(Boolean).length} đang áp dụng` : ''}</summary><section className="catalog-advanced" aria-label="Bộ lọc nâng cao">
      <label>Giá từ (đ)<input type="number" min="0" step="100000" value={params.get('minPrice') || ''} onChange={e=>update('minPrice',e.target.value)} placeholder="0"/></label>
      <label>Giá đến (đ)<input type="number" min="0" step="100000" value={params.get('maxPrice') || ''} onChange={e=>update('maxPrice',e.target.value)} placeholder="Không giới hạn"/></label>
      {kind==='tours' && <label>Số ngày<select aria-label="Số ngày" value={days || ''} onChange={e=>update('days',e.target.value)}><option value="">Tất cả</option>{[...new Set((data || []).map(t=>t.soNgay).filter(Boolean))].sort((a,b)=>a!-b!).map(d=><option key={d} value={d}>{d} ngày</option>)}</select></label>}
      <label>Sắp xếp<select aria-label="Sắp xếp" value={sort} onChange={e=>update('sort',e.target.value)}><option value="">{kind === 'restaurants' ? 'Mặc định' : 'Đánh giá cao nhất'}</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="name">Tên A–Z</option></select></label>
    </section></details>{invalidPrice && <p role="alert">Giá đến phải lớn hơn hoặc bằng giá từ.</p>}
    <div className="section-line"><h2>{config.title} dành cho bạn</h2>{!loading && !error && !(onlyBookable && (availability.loading || availability.error)) && <span>{filtered.length} kết quả{keyword ? ` cho “${keyword}”` : ''}{province ? ` tại ${province}` : ''}</span>}{(keyword || province || minPrice || maxPrice || days || sort || onlyBookable) && <button className="user-text-link" onClick={clear}>Xóa bộ lọc</button>}</div>
    {loading && <div className="user-empty" role="status">Đang tải {config.title.toLowerCase()}...</div>}
    {error && <div className="user-empty" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {!loading && !error && !(onlyBookable && (availability.loading || availability.error)) && !filtered.length && <div className="user-empty"><h3>Chưa có kết quả phù hợp</h3><p>Thử mở rộng tỉnh/thành, ngân sách hoặc xem cả dịch vụ tham khảo.</p><button className="user-button secondary" onClick={clear}>Xóa bộ lọc</button></div>}
    <div className="catalog-grid">{filtered.slice((page-1)*6,page*6).map(item => {
      const photo = item.hinhAnh?.[0];
      const price = priceOf(item);
      return <article className="catalog-card" key={itemId(item, kind)}>
        {(kind === 'tours' || kind === 'hotels') && availability.data && <p className="catalog-inventory">{hasInventory(item) ? kind === 'tours' ? 'Có lịch khởi hành còn chỗ' : 'Có loại phòng mở bán · cần chọn ngày' : 'Tham khảo · chưa có lựa chọn đặt'}</p>}
        {!!item.soLuotDanhGia && <p className="catalog-rating" aria-label={`${item.diemDanhGia} trên 5 sao, ${item.soLuotDanhGia} đánh giá đã xác minh`}>{item.diemDanhGia?.toLocaleString('vi-VN')}/5 sao · {item.soLuotDanhGia} đánh giá đã xác minh</p>}
        {photo ? <LibraryPhoto key={photo.maHinhAnh} photo={photo} /> : <div className="catalog-placeholder"><span>{kind === 'hotels' ? 'NƠI LƯU TRÚ' : 'KHÁM PHÁ VIỆT NAM'}</span><strong>{itemLocation(item)}</strong><small>Hình ảnh đang được cập nhật</small></div>}
        <div className="catalog-card-body"><p className="user-kicker">{itemLocation(item)}</p><h3><Link state={returnState} to={`/${kind}/${itemId(item, kind)}`}>{itemName(item)}</Link></h3><p className="card-description">{item.moTa || 'Xem thông tin chi tiết để tìm hiểu thêm về dịch vụ.'}</p><p className="card-meta">{kind === 'tours' ? `${item.soNgay || 1} ngày / ${item.soDem || 0} đêm` : kind === 'hotels' ? (item.loaiLuuTru || 'Lưu trú') : (item.diaChi || 'Điểm tham quan tại Việt Nam')}</p><div className="card-bottom"><div><small>{kind === 'tours' ? 'Giá tham khảo / người' : kind === 'hotels' ? 'Giá từ / đêm' : kind === 'restaurants' ? 'Chi phí tham khảo từ' : 'Giá vé tham khảo'}</small><strong>{price === null ? 'Chưa có giá xác nhận' : price === 0 ? 'Miễn phí vé vào cửa' : money(price)}</strong></div><Link state={returnState} className="user-text-link" to={`/${kind}/${itemId(item, kind)}`}>Xem chi tiết</Link></div></div>
      </article>;
    })}</div>
    {!loading && !error && filtered.length>0 && <nav className="catalog-pagination" aria-label="Phân trang kết quả"><button className="user-button secondary" disabled={page<=1} onClick={()=>update('page',String(page-1))}>Trang trước</button><span aria-live="polite">Trang {page} / {pages}</span><button className="user-button secondary" disabled={page>=pages} onClick={()=>update('page',String(page+1))}>Trang sau</button></nav>}
    <footer className="user-footer">NVT DU LỊCH <span>Những hành trình trên dải đất Việt Nam.</span></footer>
  </div></main>;
}
