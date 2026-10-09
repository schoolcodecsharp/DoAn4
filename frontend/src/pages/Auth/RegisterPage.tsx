import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, safeReturnTo } from '../../lib/api';
import { useSession } from '../../context/AuthContext';
import './auth.css';
import AuthBackdrop from './AuthBackdrop';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError, type FieldErrors } from '../../components/form-validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const [form, setForm] = useState({ hoTen: '', email: '', matKhau: '', confirm: '', soDienThoai: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const change = (name: string, value: string) => { setForm(old => ({ ...old, [name]: value })); setError(''); };
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.hoTen.trim()) errors.hoTen = 'Vui lòng nhập họ và tên.';
    if (form.matKhau && (new TextEncoder().encode(form.matKhau).length > 72 || form.matKhau.length < 8)) errors.matKhau = 'Mật khẩu cần ít nhất 8 ký tự và không quá 72 byte.';
    if (form.confirm && form.matKhau !== form.confirm) errors.confirm = 'Nhập lại đúng mật khẩu ở ô bên cạnh.';
    if (form.soDienThoai.trim() && !/^(0|\+84)\d{9,10}$/.test(form.soDienThoai.replace(/\s/g, ''))) errors.soDienThoai = 'Nhập số điện thoại bắt đầu bằng 0 hoặc +84, ví dụ 0901 234 567.';
    return errors;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { hoTen: form.hoTen.trim(), email: form.email.trim(), matKhau: form.matKhau, soDienThoai: form.soDienThoai.replace(/\s/g, '') || null });
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true, state: { message: 'Tạo tài khoản thành công. Hãy đăng nhập để tiếp tục.' } });
    } catch (err) { setError(errorMessage(err)); reportFormError(formRef.current, err, { email: ['Email đã được sử dụng'], matKhau: ['Mật khẩu cần'], soDienThoai: ['Số điện thoại chưa hợp lệ'], hoTen: ['Họ tên là bắt buộc'] }); }
    finally { setLoading(false); }
  };
  if (user) return <Navigate to={returnTo} replace />;
  return <main className="auth-page"><AuthBackdrop /><section className="auth-panel auth-panel--register"><aside className="auth-panel__story"><h1>Việt Nam đẹp.<br /><em>Cùng bạn khám phá.</em></h1><p>Một tài khoản để quản lý đặt chỗ và lưu những hành trình bạn muốn đi.</p><div className="auth-panel__quote">Tour, khách sạn và lịch trình trong một nơi.<Link to="/image-credits">Nguồn ảnh</Link></div></aside>
    <div className="auth-form-wrap"><Link className="auth-home" to="/">Về trang chủ</Link><div className="auth-brand">NVT <span>DU LỊCH</span></div><h2>Tạo tài khoản</h2><p className="auth-lead">Bắt đầu hành trình của bạn tại đây.</p>
    <ValidatedForm className="auth-form" formRef={formRef} validate={validate} onSubmit={submit}>{error && <p className="auth-alert" role="alert">{error}</p>}<label>Họ và tên<input name="hoTen" required maxLength={100} value={form.hoTen} onChange={e => change('hoTen', e.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" autoFocus /></label><label>Email<input name="email" type="email" required maxLength={150} value={form.email} onChange={e => change('email', e.target.value)} placeholder="ban@email.com" autoComplete="email" /></label>
      <div className="auth-form__split"><label>Mật khẩu<input name="matKhau" type="password" required minLength={8} maxLength={72} value={form.matKhau} onChange={e => change('matKhau', e.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" /></label><label>Xác nhận mật khẩu<input name="confirm" type="password" required maxLength={72} value={form.confirm} onChange={e => change('confirm', e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" /></label></div><label>Số điện thoại (không bắt buộc)<input name="soDienThoai" type="tel" maxLength={20} value={form.soDienThoai} onChange={e => change('soDienThoai', e.target.value)} placeholder="0901 234 567" autoComplete="tel" /></label><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</button>
    </ValidatedForm><p className="auth-switch">Đã có tài khoản? <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Đăng nhập</Link></p></div></section></main>;
}
