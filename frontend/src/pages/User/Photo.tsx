import { useState } from 'react';
import { useResource, type TravelImage } from './catalog';

export const localImageUrl = (value?: string | null) => value && /^\/media\/[a-zA-Z0-9/_.-]+$/.test(value) && !value.includes('..') ? value : null;
const sourceLink = (value?: string | null) => value && /^https:\/\//i.test(value) ? value : undefined;

export function PhotoCredit({ photo }: { photo: TravelImage }) {
  return <span className="photo-credit">{photo.moTa}{photo.tacGia && <>. Ảnh: {photo.tacGia.length > 120 ? <a href={sourceLink(photo.nguon)} target="_blank" rel="noreferrer">Tác giả tại nguồn</a> : photo.tacGia}</>}{photo.giayPhep && <> / <a href={sourceLink(photo.urlGiayPhep) || sourceLink(photo.nguon)} target="_blank" rel="noreferrer">{photo.giayPhep}</a></>}{photo.nguon && <> / <a href={sourceLink(photo.nguon)} target="_blank" rel="noreferrer">Nguồn ảnh</a></>}<span className="photo-resize-note"> (thu nhỏ để hiển thị)</span></span>;
}

export function LibraryPhoto({ photo, className = '', eager = false }: { photo: TravelImage; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = localImageUrl(photo.duongDan);
  return <figure className={`library-photo ${className}`}>
    {!failed && src ? <img src={src} alt={photo.moTa || 'Ảnh du lịch Việt Nam'} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} /> : <div className="catalog-placeholder">Ảnh đang được cập nhật</div>}
    <figcaption><PhotoCredit photo={photo} /></figcaption>
  </figure>;
}

export function PhotoGallery({ images }: { images: TravelImage[] }) {
  const photos = images.filter(p => localImageUrl(p.duongDan));
  const [index, setIndex] = useState(0);
  if (!photos.length) return null;
  const current = photos[Math.min(index, photos.length - 1)];
  return <section className="photo-gallery" aria-label="Bộ ảnh dịch vụ"><LibraryPhoto key={current.maHinhAnh} photo={current} className="detail-photo" eager />{photos.length > 1 && <div className="gallery-controls">{photos.map((photo, i) => <button key={photo.maHinhAnh} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>Ảnh {i + 1}</button>)}</div>}</section>;
}

export function FeaturedLibraryPhoto({ ownerId, type = 'DiaDiem' }: { ownerId: number; type?: string }) {
  const { data } = useResource<TravelImage[]>(`/hinhanh/${type}/${ownerId}`);
  return data?.[0] ? <LibraryPhoto photo={data[0]} eager /> : <div className="catalog-placeholder">Khám phá Việt Nam cùng NVT Du lịch</div>;
}
