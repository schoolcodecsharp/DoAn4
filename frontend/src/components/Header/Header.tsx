import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  if (['/login', '/register'].includes(location.pathname)) return null;
  const links = [['/', 'Trang chủ'], ['/destinations', 'Điểm đến'], ['/tours', 'Tour du lịch'], ['/hotels', 'Khách sạn'], ['/planner', 'Lập lịch trình']];
  return <header className="travel-header">
    <Link className="travel-wordmark" to="/" aria-label="NVT Du lịch - Trang chủ">NVT <span>DU LỊCH</span></Link>
    <nav className="travel-nav" aria-label="Điều hướng chính">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
    <div className="travel-header-actions">{loading ? <span>Đang tải...</span> : <Link className="travel-account" to={user ? '/account' : '/login'}>{user ? 'Tài khoản' : 'Đăng nhập'}</Link>}
      <button ref={toggle} className="travel-menu-button" type="button" aria-expanded={open} aria-controls="travel-menu" onClick={() => setOpen(!open)}>{open ? 'Đóng' : 'Menu'}</button>
    </div>
    {open && <nav id="travel-menu" className="travel-menu" aria-label="Menu tài khoản">
      {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
      {user ? <><Link to="/account">Tài khoản của tôi</Link><Link to="/my-trips">Đặt chỗ và lịch trình</Link><button onClick={() => { logout(); setOpen(false); navigate('/'); }}>Đăng xuất</button></> : <><Link to="/login">Đăng nhập</Link><Link to="/register">Tạo tài khoản</Link></>}
    </nav>}
  </header>;
}
