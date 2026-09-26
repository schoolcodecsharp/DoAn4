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
  return <><div key={location.pathname} className="route-curtain" aria-hidden="true"><span>NVT <small>DU LỊCH</small></span><i>Mỗi hành trình, một câu chuyện.</i></div><div className="route-content">{children}</div></>;
}
