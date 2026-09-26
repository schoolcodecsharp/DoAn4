import { useId, useState } from 'react';
import { normalize } from './catalog';

export type PlannerPlace = {
  maDiaDiem: number; tenDiaDiem: string; tinhThanh?: string; quanHuyen?: string;
  trangThai: boolean; thoiGianThamQuan?: number;
};

export function LocationSuggestions({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (value: string) => void;
}) {
  const id = useId();
  const query = normalize(value.trim());
  const choices = options.filter(option => !query || normalize(option).includes(query)).slice(0, 6);
  return <div className="planner-location">
    <label htmlFor={id}>{label}</label>
    <input id={id} required maxLength={200} value={value} onChange={e => onChange(e.target.value)}
      placeholder="Nhập tên hoặc chọn gợi ý bên dưới" autoComplete="off" aria-describedby={`${id}-hint`} />
    <small id={`${id}-hint`}>Gõ có dấu hoặc không dấu; bạn cũng có thể nhập địa điểm khác.</small>
    <div className="planner-location-options" role="group" aria-label={`Gợi ý ${label.toLowerCase()}`}>
      {choices.map(option => <button type="button" key={option} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}
    </div>
  </div>;
}

export function DaySuggestions({ places, day, onAdd }: {
  places: PlannerPlace[]; day: { tieuDe: string; ghiChu: string }; onAdd: (place: PlannerPlace) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <div className="planner-recommendations">
    <p className="planner-recommendation-title">Gợi ý địa điểm cho ngày này</p>
    <div className="planner-recommendation-grid">{places.slice(0, expanded ? places.length : 4).map(place => {
      const line = `• Tham quan ${place.tenDiaDiem}`;
      const added = day.ghiChu.split('\n').includes(line);
      const full = day.ghiChu.length + (day.ghiChu ? 1 : 0) + line.length > 4000;
      return <article className="planner-recommendation" key={place.maDiaDiem}>
        <strong>{place.tenDiaDiem}</strong><small>{place.tinhThanh}{place.thoiGianThamQuan ? ` · Khoảng ${place.thoiGianThamQuan} phút` : ''}</small>
        <button type="button" className="user-button secondary" disabled={added || full} onClick={() => onAdd(place)}
          aria-label={`${added ? 'Đã thêm' : 'Thêm'} ${place.tenDiaDiem}`}>{added ? 'Đã thêm' : full ? 'Ghi chú đã đầy' : '+ Thêm vào ngày này'}</button>
      </article>;
    })}</div>
    {places.length > 4 && <button type="button" className="user-text-link" onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn gợi ý' : `Xem tất cả ${places.length} địa điểm`}</button>}
  </div>;
}
