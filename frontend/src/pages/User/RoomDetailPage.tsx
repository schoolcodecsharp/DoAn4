import { Link, useParams } from 'react-router-dom';
import { money } from '../../lib/api';
import { useResource, type CatalogItem, type Room } from './catalog';
import { PhotoGallery } from './Photo';
import CatalogDescription from './CatalogDescription';
import './account-details.css';

export default function RoomDetailPage() {
  const { id = '', roomId = '' } = useParams();
  const room = useResource<Room>(`/loaiphong/${roomId}`);
  const hotel = useResource<CatalogItem>(`/khachsan/${id}`);
  const loading = room.loading || hotel.loading;
  const error = room.error || hotel.error;
  const matches = room.data?.maKhachSan === Number(id);
  return <main className="user-page"><div className="user-container">
    <Link className="user-text-link" to="/account?tab=hotels">Trở lại phòng đã đặt</Link>
    {loading && <p role="status" className="user-empty">Đang tải thông tin phòng…</p>}
    {error && <div role="alert" className="user-empty"><p>{error}</p><button className="user-button" onClick={() => { room.reload(); hotel.reload(); }}>Thử lại</button></div>}
    {!loading && !error && !matches && <p role="alert" className="user-empty">Phòng không thuộc khách sạn này. Vui lòng kiểm tra lại liên kết.</p>}
    {!loading && !error && matches && room.data && hotel.data && <>
      <div className="detail-heading"><h1>{room.data.tenLoaiPhong}</h1><p><Link to={`/hotels/${id}`}>{hotel.data.tenKhachSan}</Link></p><p>{hotel.data.diaChi || 'Địa chỉ đang được cập nhật.'}</p></div>
      {room.data.hinhAnh?.length ? <PhotoGallery key={roomId} images={room.data.hinhAnh} /> : <p>Loại phòng này chưa có ảnh riêng. Bạn có thể xem bộ ảnh khách sạn tại trang khách sạn.</p>}
      <div className="detail-layout"><section className="user-panel"><h2>Thông tin phòng</h2><CatalogDescription text={room.data.moTa} /><dl className="room-facts"><div><dt>Sức chứa</dt><dd>Tối đa {room.data.sucChua} khách / phòng</dd></div><div><dt>Giá hiện tại / đêm</dt><dd>{money(room.data.giaMoiDem)}</dd></div></dl><p className="subtle">Đây là thông tin phòng hiện tại. Ngày lưu trú, số phòng và tổng tiền của đơn đã đặt được giữ tại mục Phòng đã đặt.</p></section>
      <aside className="user-panel detail-aside"><h2>Khách sạn</h2><p>{hotel.data.tenKhachSan}</p>{hotel.data.soDienThoai && <p>Liên hệ: {hotel.data.soDienThoai}</p>}<Link className="user-text-link" to={`/hotels/${id}`}>Xem khách sạn và đánh giá</Link>{room.data.trangThai && hotel.data.trangThai && room.data.soLuongPhong > 0 ? <><p>Ngày lưu trú và khả năng nhận đặt sẽ được kiểm tra khi đặt phòng.</p><Link className="user-button" to={`/hotels/${id}/book?room=${roomId}`}>Đặt phòng này</Link></> : <p role="status">Phòng hiện ngừng nhận đặt mới. Thông tin vẫn được giữ để bạn xem lại.</p>}</aside></div>
    </>}
  </div></main>;
}
