import { Link } from 'react-router-dom';
import { useResource, type TravelImage } from './catalog';
import { LibraryPhoto } from './Photo';

export default function ImageCreditsPage() {
  const { data, loading, error, reload } = useResource<TravelImage[]>('/hinhanh');
  const images = [...new Map((data || []).map(photo => [photo.duongDan, photo])).values()];
  return <main className="user-page"><div className="user-container"><Link to="/" className="user-text-link">Về trang chủ</Link><div className="detail-heading"><p className="user-kicker">THƯ VIỆN ẢNH VIỆT NAM</p><h1>Nguồn ảnh và ghi công.</h1><p>Ảnh được lưu trên máy chủ của NVT Du lịch, không tải trực tiếp từ website bên ngoài khi bạn xem tour. Các bản ảnh được thu nhỏ; khung thẻ có thể cắt phần hiển thị để vừa bố cục, không chỉnh sửa nội dung ảnh.</p><p>Ảnh mang tính giới thiệu điểm đến, không cam kết góc nhìn hoặc thời tiết thực tế của chuyến đi.</p></div>{loading && <p role="status">Đang tải thư viện ảnh...</p>}{error && <div role="alert"><p>{error}</p><button onClick={reload}>Thử lại</button></div>}<div className="catalog-grid">{images.map(photo => <article className="catalog-card" key={photo.duongDan}><LibraryPhoto photo={photo} />{photo.tacGia && photo.tacGia.length > 120 && <div className="catalog-card-body"><p className="preserve-lines">{photo.tacGia}</p></div>}</article>)}</div></div></main>;
}
