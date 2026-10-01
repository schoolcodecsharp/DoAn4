import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dateLabel, money } from '../../lib/api';
import type { Booking } from './AccountPage';
import { useResource, type Room } from './catalog';
import { LibraryPhoto } from './Photo';
import TourSchedule from './TourSchedule';

function RoomInformation({ id }: { id: number }) {
  const room = useResource<Room>(`/loaiphong/${id}`);
  if (room.loading) return <p role="status">Đang tải thông tin loại phòng…</p>;
  if (room.error) return <p role="alert">{room.error} <button type="button" onClick={room.reload}>Thử lại</button></p>;
  if (!room.data) return null;
  return <section><h4>Thông tin loại phòng hiện tại</h4>{room.data.hinhAnh?.[0] && <LibraryPhoto photo={room.data.hinhAnh[0]} className="room-photo" />}<p>{room.data.moTa || 'Khách sạn chưa cập nhật mô tả loại phòng.'}</p><p>Sức chứa hiện tại: {room.data.sucChua} khách / phòng.</p><p className="cost-disclaimer">Mô tả và hình ảnh hiện tại của khách sạn; đơn giá của đơn đã đặt được giữ riêng ở trên.</p></section>;
}

export default function BookingInformation({ booking: b, kind }: { booking: Booking; kind: 'tours' | 'hotels' }) {
  const [open, setOpen] = useState(false);
  return <details className="booking-information" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>Thông tin đặt chỗ · đơn #{b.id}</summary>
    <dl className="booking-facts">
      <div><dt>Ngày đặt</dt><dd>{b.bookedAt ? dateLabel(b.bookedAt) : 'Chưa cập nhật'}</dd></div>
      <div><dt>{kind === 'hotels' ? 'Loại phòng đã đặt' : 'Hành trình'}</dt><dd>{kind === 'hotels' ? b.roomName : `${b.origin || ''} – ${b.destination || ''}`}</dd></div>
      <div><dt>{kind === 'hotels' ? 'Nhận phòng' : 'Khởi hành'}</dt><dd>{dateLabel(b.startDate)}</dd></div>
      <div><dt>{kind === 'hotels' ? 'Trả phòng' : 'Ngày cuối chuyến đi'}</dt><dd>{b.endDate ? dateLabel(b.endDate) : 'Chưa cập nhật'}</dd></div>
      <div><dt>Số lượng</dt><dd>{b.people} khách{kind === 'hotels' ? ` · ${b.rooms} phòng · ${b.nights} đêm` : ` · ${b.duration} ngày`}</dd></div>
      <div><dt>Đơn giá lúc đặt</dt><dd>{b.unitPrice == null ? 'Chưa cập nhật' : `${money(b.unitPrice)} / ${kind === 'hotels' ? 'phòng/đêm' : 'người'}`}</dd></div>
      {b.address && <div><dt>Địa chỉ khách sạn hiện tại</dt><dd>{b.address}</dd></div>}
      {b.phone && <div><dt>Liên hệ khách sạn</dt><dd><a href={`tel:${b.phone}`}>{b.phone}</a></dd></div>}
      <div><dt>Tổng tiền đơn</dt><dd>{money(b.total)}</dd></div>
      <div><dt>Thanh toán đã ghi nhận</dt><dd>{b.paid <= 0 ? 'Chưa ghi nhận thanh toán' : b.paid >= b.total ? 'Đã thu đủ' : 'Đã thu một phần'} · {money(b.paid)}</dd></div>
    </dl>
    <p className="preserve-lines">Ghi chú lúc đặt: {b.note || 'Không có ghi chú.'}</p>
    <p className="cost-disclaimer">Trạng thái đặt chỗ và thanh toán là hai thông tin riêng. Đơn hủy không tự động được hoàn tiền.</p>
    {open && kind === 'hotels' && b.roomId && <RoomInformation id={b.roomId} />}
    {open && kind === 'tours' && b.tourId && <><p className="cost-disclaimer">Lịch trình tour đang lưu trên hệ thống:</p><TourSchedule id={String(b.tourId)} days={b.duration || 1} /></>}
    <Link className="user-text-link" to={kind === 'tours' ? `/tours/${b.tourId}` : `/hotels/${b.hotelId}`}>Xem đầy đủ dịch vụ, bình luận và đánh giá</Link>
  </details>;
}
