import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../context/AuthContext';
import './site-footer.css';

function Arrow({ up = false }: { up?: boolean }) {
  return <svg className={`footer-arrow${up ? ' footer-arrow--up' : ''}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

export default function SiteFooter({ onBackToTop }: { onBackToTop?: () => void }) {
  const { user } = useSession();
  function backToTop(event: MouseEvent<HTMLButtonElement>) {
    if (onBackToTop) { onBackToTop(); return; }
    const main = event.currentTarget.closest('main');
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (main && main.scrollHeight > main.clientHeight) main.scrollTo({ top: 0, behavior });
    else window.scrollTo({ top: 0, behavior });
    const heading = (main || document.querySelector('.route-content'))?.querySelector<HTMLElement>('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  return <footer className="booking-footer" role="contentinfo" aria-label="Thông tin và điều hướng NVT">
    <div className="booking-footer__main">
      <div className="booking-footer__identity"><b>NVT<span>DU LỊCH</span></b><p>Đi để nhìn thấy nhiều hơn.</p><span>Mỗi hành trình, một câu chuyện.</span></div>
      <nav aria-label="Khám phá cùng NVT"><h2>Khám phá</h2><Link to="/destinations">Điểm đến</Link><Link to="/tours">Tour du lịch</Link><Link to="/hotels">Nơi lưu trú</Link><Link to="/restaurants">Nhà hàng</Link></nav>
      <nav aria-label="Hành trình của bạn"><h2>Hành trình của bạn</h2><Link to="/planner">Lập lịch trình <Arrow /></Link><Link to={user ? '/account' : '/login'}>{user ? 'Tài khoản của tôi' : 'Đăng nhập'} <Arrow /></Link></nav>
    </div>
    <div className="booking-footer__bottom"><span>NVT Du lịch</span><Link to="/image-credits">Nguồn ảnh & ghi công</Link><button type="button" onClick={backToTop}>Về đầu trang <Arrow up /></button></div>
  </footer>;
}
