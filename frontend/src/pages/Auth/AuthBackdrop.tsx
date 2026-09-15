import { useResource, type TravelImage } from '../User/catalog';
import { localImageUrl } from '../User/Photo';

export default function AuthBackdrop() {
  const { data } = useResource<TravelImage[]>('/hinhanh/DiaDiem/4');
  const src = localImageUrl(data?.[0]?.duongDan);
  return <div className="auth-backdrop" style={src ? { backgroundImage: `linear-gradient(120deg,#173b35e6,#204d42be),url("${src}")` } : undefined} />;
}
