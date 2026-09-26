import { Link, useParams } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { dateLabel, money, today } from '../../lib/api';
import { catalogs, itemLocation, itemName, useResource, type CatalogItem, type Departure, type Kind, type Room } from './catalog';
import { LibraryPhoto, PhotoGallery } from './Photo';
import TourSchedule from './TourSchedule';

function Departures({ id }: { id: string }) {
  const { data, loading, error, reload } = useResource<Departure[]>(`/tourkhoihanh/bytour/${id}`);
  const departures = (data || []).filter(d => d.trangThai === 'OpenForBooking' && d.ngayKhoiHanh.slice(0, 10) >= today());
  return <section className="user-panel"><h2>Lịch khởi hành</h2>{loading && <p role="status">Đang tải lịch khởi hành...</p>}{error && <p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}{!loading && !error && !departures.length && <p>Chưa có lịch khởi hành đang mở. Vui lòng quay lại sau.</p>}{departures.map(d => <div className="option-row" key={d.maKhoiHanh}><div><h3>{dateLabel(d.ngayKhoiHanh)}</h3><p>Còn {Math.max(0, d.soChoToiDa - d.soChoDaDat)} chỗ</p></div><div><strong>{money(d.giaApDung)} / người</strong>{d.soChoToiDa > d.soChoDaDat ? <Link className="user-button" to={`/tours/${id}/book?departure=${d.maKhoiHanh}`}>Đặt tour</Link> : <span>Đã hết chỗ</span>}</div></div>)}</section>;
}
function Rooms({ id }: { id: string }) {
  const { data, loading, error, reload } = useResource<Room[]>(`/loaiphong/bykhachsan/${id}`);
  const rooms = (data || []).filter(r => r.trangThai);
  return <section className="user-panel"><h2>Loại phòng</h2>{loading && <p role="status">Đang tải phòng...</p>}{error && <p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}{!loading && !error && !rooms.length && <p>Khách sạn chưa cập nhật phòng có thể đặt.</p>}{rooms.map(r => <div className="option-row" key={r.maLoaiPhong}><div>{r.hinhAnh?.[0] && <LibraryPhoto photo={r.hinhAnh[0]} className="room-photo" />}<h3>{r.tenLoaiPhong}</h3><p>Tối đa {r.sucChua} khách / phòng</p><p>{r.moTa}</p></div><div><strong>{money(r.giaMoiDem)} / đêm</strong>{r.soLuongPhong > 0 ? <Link className="user-button" to={`/hotels/${id}/book?room=${r.maLoaiPhong}`}>Đặt phòng</Link> : <span>Chưa có phòng mở bán</span>}</div></div>)}</section>;
}
export default function DetailPage({ kind }: { kind: Kind }) {
  const { id = '' } = useParams();
  const { user } = useSession();
  const { data, loading, error, reload } = useResource<CatalogItem>(`/${catalogs[kind].endpoint}/${id}`);
  return <main className="user-page"><div className="user-container">
    <Link className="user-text-link" to={`/${kind}`}>Trở lại {catalogs[kind].title.toLowerCase()}</Link>
    {loading && <div className="user-empty" role="status">Đang tải thông tin...</div>}
    {error && <div className="user-empty" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {data && <><div className="detail-heading"><p className="user-kicker">{itemLocation(data)}</p><h1>{itemName(data)}</h1><p>{data.diaChi || (data.diemKhoiHanh ? `Khởi hành từ ${data.diemKhoiHanh}` : 'Khám phá Việt Nam cùng NVT Du lịch')}</p></div>
      <PhotoGallery key={`${kind}/${id}`} images={data.hinhAnh || []} />
      <div className="detail-layout"><div><section className="user-panel"><h2>Thông tin giới thiệu</h2><p className="preserve-lines">{data.moTa || 'Nội dung giới thiệu đang được cập nhật.'}</p>{kind === 'tours' && <p>Thời gian: {data.soNgay} ngày, {data.soDem} đêm.</p>}{data.soDienThoai && <p>Liên hệ: {data.soDienThoai}</p>}</section>
      {kind === 'tours' && <><TourSchedule key={id} id={id} days={data.soNgay || 1} />{data.trangThai==='Active' ? <Departures id={id} /> : <p role="status">Tour hiện ngừng nhận đặt chỗ. Lịch sử và thông tin vẫn được giữ lại.</p>}</>}{kind === 'hotels' && (data.trangThai ? <Rooms id={id} /> : <p role="status">Khách sạn hiện ngừng nhận đặt phòng.</p>)}</div>
      <aside className="user-panel detail-aside"><p className="user-kicker">CHUYẾN ĐI CỦA BẠN</p><h2>Chọn trước, đặt sau.</h2><p>{user ? 'Bạn đã đăng nhập. Chọn dịch vụ bên dưới để gửi yêu cầu đặt chỗ.' : 'Bạn đang xem với tư cách khách. Đăng nhập khi đặt tour, đặt phòng hoặc tạo lịch trình.'}</p>{kind === 'destinations' && <><p>{data.giaVe ? `Giá vé tham khảo: ${money(data.giaVe)}` : 'Giá vé: liên hệ điểm tham quan để xác nhận.'}</p><Link className="user-button" to={`/planner?destination=${encodeURIComponent(itemName(data))}`}>Lập lịch trình đến đây</Link></>}{kind === 'restaurants' && <><p>Chi phí tham khảo: {money(data.giaMin || 0)} – {money(data.giaMax || 0)}</p><p>Giờ mở cửa: {data.gioMoCua?.slice(0, 5) || 'Chưa cập nhật'} – {data.gioDongCua?.slice(0, 5) || 'Chưa cập nhật'}</p>{data.trangThai ? <Link className="user-button" to={`/planner?destination=${encodeURIComponent(data.tinhThanh || '')}&restaurant=${id}`}>Thêm vào lịch trình</Link> : <p>Nhà hàng hiện ngừng hoạt động trên hệ thống.</p>}<p>Thêm vào kế hoạch không phải đặt bàn. Liên hệ nhà hàng để xác nhận chỗ và giá.</p></>}<Link className="user-text-link" to="/account">Quản lý chuyến đi của tôi</Link></aside></div>
    </>}
  </div></main>;
}
