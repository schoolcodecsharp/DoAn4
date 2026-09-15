import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, safeReturnTo } from '../../lib/api';
import { useSession } from '../../context/AuthContext';
import './auth.css';
import AuthBackdrop from './AuthBackdrop';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const [form, setForm] = useState({ hoTen: '', email: '', matKhau: '', confirm: '', soDienThoai: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const change = (name: string, value: string) => setForm(old => ({ ...old, [name]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (loading) return;
    if (!form.hoTen.trim()) return setError('Vui lòng nhập họ tên.');
    if (new TextEncoder().encode(form.matKhau).length > 72 || form.matKhau.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự và không quá 72 byte.');
    if (form.matKhau !== form.confirm) return setError('Xác nhận mật khẩu chưa khớp.');
    if (form.soDienThoai && !/^(0|\+84)\d{9,10}$/.test(form.soDienThoai.replace(/\s/g, ''))) return setError('Số điện thoại chưa hợp lệ.');
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { hoTen: form.hoTen.trim(), email: form.email.trim(), matKhau: form.matKhau, soDienThoai: form.soDienThoai.replace(/\s/g, '') || null });
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true, state: { message: 'Tạo tài khoản thành công. Hãy đăng nhập để tiếp tục.' } });
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };
  if (user) return <Navigate to={returnTo} replace />;
  return <main className="auth-page"><AuthBackdrop /><section className="auth-panel auth-panel--register"><aside className="auth-panel__story"><p className="auth-kicker">NVT DU LỊCH</p><h1>Việt Nam đẹp.<br /><em>Cùng bạn khám phá.</em></h1><p>Một tài khoản để quản lý đặt chỗ và lưu những hành trình bạn muốn đi.</p><div className="auth-panel__quote">Tour, khách sạn và lịch trình trong một nơi.<Link to="/image-credits">Nguồn ảnh</Link></div></aside>
    <div className="auth-form-wrap"><Link className="auth-home" to="/">Về trang chủ</Link><div className="auth-brand">NVT <span>DU LỊCH</span></div><h2>Tạo tài khoản</h2><p className="auth-lead">Bắt đầu hành trình của bạn tại đây.</p>
    <form className="auth-form" onSubmit={submit}>{error && <p className="auth-alert" role="alert">{error}</p>}<label>Họ và tên<input required maxLength={100} value={form.hoTen} onChange={e => change('hoTen', e.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" autoFocus /></label><label>Email<input type="email" required maxLength={150} value={form.email} onChange={e => change('email', e.target.value)} placeholder="ban@email.com" autoComplete="email" /></label>
      <div className="auth-form__split"><label>Mật khẩu<input type="password" required minLength={8} maxLength={72} value={form.matKhau} onChange={e => change('matKhau', e.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" /></label><label>Xác nhận mật khẩu<input type="password" required maxLength={72} value={form.confirm} onChange={e => change('confirm', e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" /></label></div><label>Số điện thoại (không bắt buộc)<input type="tel" maxLength={20} value={form.soDienThoai} onChange={e => change('soDienThoai', e.target.value)} placeholder="0901 234 567" autoComplete="tel" /></label><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>
    </form><p className="auth-switch">Đã có tài khoản? <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Đăng nhập</Link></p></div></section></main>;
}
