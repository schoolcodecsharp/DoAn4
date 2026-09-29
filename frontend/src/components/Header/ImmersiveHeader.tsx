import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';

const links = [['/', 'Trang chủ'], ['/destinations', 'Khám phá điểm đến'], ['/tours', 'Tour du lịch'], ['/hotels', 'Nơi lưu trú'], ['/restaurants', 'Nhà hàng'], ['/planner', 'Tạo lịch trình'], ['/account', 'Hành trình của tôi']];
const places = [['Hạ Long', 'Vinh-ha-long.jpg'], ['Bản Giốc', 'ban-gioc.png'], ['Hội An', 'hoi-an.jpg'], ['Cầu Vàng', 'cau-vang.jpg']];
export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [previousRoute, setPreviousRoute] = useState(location.pathname);
  if (previousRoute !== location.pathname) {
    setPreviousRoute(location.pathname);
    setOpen(false);
    setScrolled(false);
  }
  useEffect(() => {
    if (location.pathname !== '/') return;
    // The homepage scrolls inside its own main, not the window. Ignore menu scrolls.
    const home = document.querySelector<HTMLElement>('.booking-home');
    const update = () => setScrolled((home?.scrollTop ?? window.scrollY) > 40);
    const surface = home ?? window;
    surface.addEventListener('scroll', update, { passive: true });
    update();
    return () => surface.removeEventListener('scroll', update);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }));
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (e.key === 'Tab') {
        const items = menu.current?.querySelectorAll<HTMLElement>('a,button');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (!menu.current?.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keys);
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = previous; document.removeEventListener('keydown', keys); };
  }, [open]);
  if (location.pathname.startsWith('/admin')) return null;
  return <><header className={`travel-header ${location.pathname === '/' ? (scrolled ? 'is-home-scrolled' : 'is-hero') : ''}`}>
    <Link className="travel-wordmark" to="/">NVT <span>DU LỊCH</span></Link>
    <span className="header-motto">Mỗi hành trình, một câu chuyện.</span>
    <div className="travel-header-actions"><Link className="travel-account" to={user ? '/account' : '/login'}>{user ? 'Tài khoản' : 'Đăng nhập'} ↗</Link><button ref={toggle} className="travel-menu-button" aria-label="Mở menu" aria-expanded={open} aria-controls="immersive-navigation" onClick={() => setOpen(true)}><span/><span/><span/></button></div>
  </header><div ref={menu} id="immersive-navigation" className={`immersive-navigation ${open ? 'is-open' : ''}`} role="dialog" aria-modal={open || undefined} aria-label="Menu điều hướng" inert={!open}>
    <button className="menu-close" aria-label="Đóng menu" onClick={() => { setOpen(false); toggle.current?.focus(); }}>×</button>
    <div className="immersive-top"><div className="immersive-brand"><Link to="/" onClick={() => setOpen(false)}>NVT <small>DU LỊCH</small></Link><p>Mỗi hành trình, một câu chuyện.</p><span>ĐI ĐÂU ĐÓ,<br/>ĐỂ THẤY NHIỀU HƠN.</span></div><nav>{links.map(([to, label], i) => <NavLink key={to} end={to === '/'} to={to} onClick={() => setOpen(false)}><small>0{i + 1}</small><span>{label}</span><b>↗</b></NavLink>)}</nav></div>
    <div className="menu-gallery-label"><span>MỘT CHÚT CẢM HỨNG CHO CHUYẾN ĐI</span><span>YOUR NEXT JOURNEY ↗</span></div>
    <div className="immersive-gallery">{places.map(([name, file]) => <Link key={name} to={`/destinations?keyword=${encodeURIComponent(name)}`} onClick={() => setOpen(false)}><img src={`/images/${file}`} alt={name}/><span><small>VIỆT NAM</small>{name}<b>↗</b></span></Link>)}</div>
    <div className="immersive-bottom"><span>NVT Du lịch — Đi theo cách của bạn.</span>{user?.maVaiTro === 1 && <Link to="/admin" onClick={() => setOpen(false)}>Quản trị hệ thống ↗</Link>}{user ? <button onClick={() => { logout(); setOpen(false); navigate('/'); }}>Đăng xuất ↗</button> : <Link to="/register" onClick={() => setOpen(false)}>Bắt đầu hành trình ↗</Link>}</div>
  </div></>;
}
