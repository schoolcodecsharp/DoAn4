import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, safeReturnTo, type Session } from '../../lib/api';
import { useSession } from '../../context/AuthContext';
import './auth.css';
import AuthBackdrop from './AuthBackdrop';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { user, login } = useSession();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const notice = (location.state as { message?: string } | null)?.message;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post<Session>('/auth/login', { email: email.trim(), matKhau: password });
      login(data); navigate(!params.get('returnTo') && data.user.maVaiTro === 1 ? '/admin' : returnTo, { replace: true });
    } catch (err) { setError(errorMessage(err)); reportFormError(formRef.current, err); }
    finally { setLoading(false); }
  };
  if (user) return <Navigate to={!params.get('returnTo') && user.maVaiTro === 1 ? '/admin' : returnTo} replace />;
  return <main className="auth-page"><AuthBackdrop /><section className="auth-panel">
    <aside className="auth-panel__story"><h1>Những chuyến đi<br /><em>đang chờ bạn.</em></h1><p>Đăng nhập để đặt tour, đặt phòng và lưu lịch trình của riêng mình. Bạn vẫn có thể khám phá mọi điểm đến mà không cần tài khoản.</p><div className="auth-panel__quote">Đi để nhìn thấy nhiều hơn.<Link to="/image-credits">Nguồn ảnh</Link></div></aside>
    <div className="auth-form-wrap"><Link className="auth-home" to="/">Về trang chủ</Link><div className="auth-brand">NVT <span>DU LỊCH</span></div><h2>Chào mừng trở lại</h2><p className="auth-lead">Đăng nhập để tiếp tục hành trình của bạn.</p>
      <ValidatedForm className="auth-form" formRef={formRef} onSubmit={submit}>{notice && <p className="auth-notice" role="status">{notice}</p>}{error && <p className="auth-alert" role="alert">{error}</p>}<label>Email<input name="email" type="email" required maxLength={150} value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="ban@email.com" autoComplete="email" autoFocus /></label>
        <label>Mật khẩu<span className="auth-password"><input name="matKhau" type={showPassword ? 'text' : 'password'} required maxLength={72} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Nhập mật khẩu" autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></span></label><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </ValidatedForm><p className="auth-switch">Chưa có tài khoản? <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Đăng ký miễn phí</Link></p>
    </div></section></main>;
}
