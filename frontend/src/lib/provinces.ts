import { normalize, useResource } from '../pages/User/catalog';

export type Province = { code: number; name: string; divisionType: string; aliases: string[]; verifiedOn: string };
export const provinceKey = (value: string) => normalize(value.trim())
  .replace(/^(tinh|thanh pho|tp\.?)[\s.]+/, '').replace(/[^a-z0-9]/g, '');
export function resolveProvince(value: string, provinces: Province[]) {
  const key = provinceKey(value);
  return provinces.find(p => [p.name, ...p.aliases].some(name => provinceKey(name) === key))?.name;
}
export const useProvinces = () => useResource<Province[]>('/provinces');
export type ProvinceState = ReturnType<typeof useProvinces>;

export function provinceNames(value: string, provinces: Province[]) {
  return value.split(',').map(name => resolveProvince(name, provinces) || name.trim()).filter(Boolean);
}

// Alias matches intentionally target the entire merged province, not an inferred district.
export function provinceSearchText(value: string, provinces: Province[]) {
  return provinceNames(value, provinces).flatMap(name => {
    const province = provinces.find(p => p.name === name);
    return province ? [province.name, ...province.aliases] : [name];
  }).join(' ');
}
