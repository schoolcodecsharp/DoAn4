import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.user-page, .booking-home').forEach(el => el.scrollTo(0, 0));
  }, [location.pathname]);
  // Administrative work should not be covered by the public-site curtain.
  if (location.pathname.startsWith('/admin')) return <>{children}</>;
  // Query-string filters update the current page in place; only a new page
  // restarts the curtain and resets scroll position.
  return <><div key={location.pathname} className="route-curtain" aria-hidden="true">
    <div className="route-curtain-brand">
      <div className="route-curtain-wordmark">
        <span className="route-curtain-logo">{'NVT'.split('').map(letter => <span className="route-curtain-letter" key={letter}><span>{letter}</span></span>)}</span>
        <small className="route-curtain-badge">DU LỊCH</small>
      </div>
      <p className="route-curtain-motto">Mỗi hành trình, một câu chuyện.</p>
    </div>
  </div><div className="route-content">{children}</div></>;
}
