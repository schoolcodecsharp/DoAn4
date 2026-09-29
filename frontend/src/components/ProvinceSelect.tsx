import { useEffect, useState } from 'react';

// Version 1 matches the pre-merger province names used in the project SQL.
const endpoint = 'https://provinces.open-api.vn/api/v1/p/';
type Province = { code: number; name: string };
let cached: Province[] | undefined;
export const provinceName = (name: string) => name.replace(/^(Tỉnh|Thành phố)\s+/i, '');

export default function ProvinceSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options?: string[] }) {
  const [provinces, setProvinces] = useState<Province[]>(cached || []);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (options || cached) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    let active = true;
    fetch(endpoint, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Province API unavailable'); return response.json(); })
      .then((data: unknown) => {
        if (!Array.isArray(data) || !data.length || !data.every(p => typeof p.code === 'number' && typeof p.name === 'string')) throw new Error('Invalid provinces');
        cached = (data as Province[]).sort((a, b) => provinceName(a.name).localeCompare(provinceName(b.name), 'vi'));
        if (active) { setProvinces(cached); setError(false); }
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => window.clearTimeout(timer));
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [attempt, options]);
  const names = [...new Set(options ?? provinces.map(p => provinceName(p.name)))].filter(Boolean).sort((a,b) => a.localeCompare(b, 'vi'));
  return <div className="province-filter">
    <label htmlFor="catalog-province">Tỉnh / thành phố</label>
    <select id="catalog-province" value={value} onChange={e => onChange(e.target.value)} disabled={!names.length} aria-describedby="province-status">
      <option value="">Tất cả tỉnh / thành phố</option>
      {value && !names.includes(value) && <option value={value}>{value}</option>}
      {names.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
    <small id="province-status" role="status">{options ? `${names.length} nhóm tỉnh/thành theo dữ liệu danh mục` : error ? <>Không tải được tỉnh thành. <button type="button" onClick={() => { setError(false); setAttempt(n => n + 1); }}>Thử lại</button></> : provinces.length ? `${provinces.length} tỉnh/thành · danh sách trước sáp nhập` : 'Đang tải tỉnh thành…'}</small>
  </div>;
}
