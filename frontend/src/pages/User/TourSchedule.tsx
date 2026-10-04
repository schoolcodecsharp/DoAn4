import { Link } from 'react-router-dom';
import { useResource, type TravelImage } from './catalog';
import { PhotoGallery } from './Photo';

type Activity = {
  maTourChiTiet: number; ngayThu: number; thuTu: number;
  loaiDiaDiem: 'DiaDiem' | 'NhaHang' | 'KhachSan';
  maDiaDiem?: number; maKhachSan?: number; maNhaHang?: number;
  tenDiaDiem?: string; moTa?: string; diaChi?: string; ghiChu?: string;
  thoiGianBatDau?: string; thoiGianKetThuc?: string; hinhAnh?: TravelImage[];
};
const labels = { DiaDiem: 'Tham quan', NhaHang: 'Ăn uống', KhachSan: 'Nghỉ ngơi' };
const time = (value?: string) => value?.slice(0, 5);

export default function TourSchedule({ id, days }: { id: string; days: number }) {
  const { data, loading, error, reload } = useResource<Activity[]>(`/tourchitiet/bytour/${id}`);
  const activities = [...(data || [])].sort((a, b) => a.ngayThu - b.ngayThu || a.thuTu - b.thuTu || a.maTourChiTiet - b.maTourChiTiet);
  // Include recorded days outside SoNgay too, so inconsistent data is not hidden.
  const dayNumbers = [...new Set([...Array.from({ length: Math.max(1, days) }, (_, i) => i + 1), ...activities.map(a => a.ngayThu)])].sort((a, b) => a - b);
  return <section className="tour-schedule" aria-label="Lịch trình tour từng ngày">
    <div className="schedule-heading"><p className="user-kicker">TỪNG NGÀY, TỪNG TRẢI NGHIỆM</p><h2>Lịch trình chi tiết</h2><p>Các hoạt động, điểm dừng và hình ảnh trong hành trình của bạn.</p></div>
    {loading && <p role="status">Đang tải lịch trình từng ngày…</p>}
    {error && <div className="user-panel" role="alert"><p>{error}</p><button className="user-button" onClick={reload}>Thử lại</button></div>}
    {!loading && !error && dayNumbers.map(day => {
      const stops = activities.filter(a => a.ngayThu === day);
      return <details className="schedule-day" key={day} open={day === dayNumbers[0]}>
        <summary><span className="schedule-day-number">{String(day).padStart(2, '0')}</span><span><strong>Ngày {day}</strong><small>{stops.length ? stops.map(a => a.tenDiaDiem || labels[a.loaiDiaDiem]).join(' → ') : 'Lịch trình đang được cập nhật'}</small></span><span className="schedule-toggle" aria-hidden="true">⌄</span></summary>
        <div className="schedule-day-body">{!stops.length ? <p className="schedule-missing">Chưa có hoạt động được nhập cho ngày {day}. Vui lòng liên hệ để xác nhận lịch trình trước khi đặt tour.</p> : stops.map(activity => {
          const detailUrl = activity.loaiDiaDiem === 'DiaDiem' && activity.maDiaDiem ? `/destinations/${activity.maDiaDiem}` : activity.loaiDiaDiem === 'KhachSan' && activity.maKhachSan ? `/hotels/${activity.maKhachSan}` : activity.loaiDiaDiem === 'NhaHang' && activity.maNhaHang ? `/restaurants/${activity.maNhaHang}` : null;
          return <article className="schedule-activity" key={activity.maTourChiTiet}>
            <div className="schedule-time"><span>{time(activity.thoiGianBatDau) || 'Chưa chốt giờ'}</span>{activity.thoiGianKetThuc && <small>đến {time(activity.thoiGianKetThuc)}</small>}</div>
            <div className="schedule-activity-content"><p className="user-kicker">{labels[activity.loaiDiaDiem]}</p><h3>{activity.tenDiaDiem || 'Điểm dừng đang cập nhật'}</h3>{activity.diaChi && <p className="schedule-address">{activity.diaChi}</p>}
              {activity.ghiChu && <p className="schedule-description preserve-lines">{activity.ghiChu}</p>}
              {activity.moTa && activity.moTa !== activity.ghiChu && <p className="preserve-lines">{activity.moTa}</p>}
              {!activity.ghiChu && !activity.moTa && <p>Mô tả hoạt động đang được cập nhật.</p>}
              {activity.hinhAnh?.length ? <PhotoGallery images={activity.hinhAnh} /> : <p className="schedule-missing">Hình ảnh của điểm dừng này đang được cập nhật.</p>}
              {detailUrl && <Link className="editorial-link" to={detailUrl}>Khám phá điểm dừng này <span>↗</span></Link>}
            </div>
          </article>;
        })}</div>
      </details>;
    })}
  </section>;
}
