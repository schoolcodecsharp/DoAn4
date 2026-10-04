import { useId } from 'react';
import { useProvinces, resolveProvince, type ProvinceState } from '../lib/provinces';

type Props = { value: string; onChange: (value: string) => void; name?: string };

export function ProvinceFilter({ value, onChange, name, resource, emptyLabel = 'Tất cả tỉnh / thành phố' }: Props & { resource: ProvinceState; emptyLabel?: string }) {
  const id = useId();
  const { data, loading, error, reload } = resource;
  const names = (data || []).map(p => p.name).sort((a, b) => a.localeCompare(b, 'vi'));
  const selected = resolveProvince(value, data || []) || value;
  return <div className="province-filter">
    <label htmlFor={id}>Tỉnh / thành phố</label>
    <select id={id} name={name} value={selected} onChange={e => onChange(e.target.value)} disabled={!names.length} aria-describedby={id + '-status'}>
      <option value="">{emptyLabel}</option>
      {selected && !names.includes(selected) && <option value={selected}>{selected}</option>}
      {names.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
    <small id={id + '-status'} role="status">{loading ? 'Đang tải tỉnh/thành…' : error ? <>Chưa tải được danh mục tỉnh/thành. <button type="button" onClick={reload}>Thử lại</button></> : `${names.length} tỉnh/thành · tìm được cả tên tỉnh cũ`}</small>
  </div>;
}

export default function ProvinceSelect(props: Props) {
  const resource = useProvinces();
  return <ProvinceFilter {...props} resource={resource} emptyLabel="Chọn tỉnh / thành phố" />;
}
