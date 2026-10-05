import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../../components/SiteFooter';
import { homeDiscoveries, homePlaces } from './homeContent';
import './home.css';

function Arrow({ direction = 'right' }: { direction?: 'right' | 'left' | 'down' | 'up' }) {
  return <svg className={`home-arrow home-arrow--${direction}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function HomePhoto({ place }: { place: Pick<typeof homePlaces[number], 'image' | 'location' | 'position'> }) {
  const [failed, setFailed] = useState(false);
  return <div className="home-photo">{failed
    ? <p>Ảnh {place.location} đang được cập nhật.</p>
    : <img src={place.image} alt={place.location} style={{ objectPosition: place.position }} loading="lazy" decoding="async" onError={() => setFailed(true)} />}</div>;
}

const HomePage: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [focusWithin, setFocusWithin] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const [retry, setRetry] = useState(0);
  const holdTimer = useRef<number | undefined>(undefined);
  const [holding, setHolding] = useState(false);
  const discoveryRef = useRef<HTMLElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cancelHold = () => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = undefined;
    setHolding(false);
  };
  useEffect(() => {
    const cancel = () => {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = undefined;
      setHolding(false);
    };
    const visibility = () => { cancel(); setVisible(!document.hidden); };
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { if (preference.matches) setPaused(true); };
    window.addEventListener('pointerup', cancel);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('scroll', cancel, true);
    preference.addEventListener('change', motion);
    return () => {
      cancel();
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('scroll', cancel, true);
      preference.removeEventListener('change', motion);
    };
  }, []);
  const isBannerSurface = (event: React.PointerEvent<HTMLElement>) =>
    event.pointerType === 'mouse' && !(event.target as Element).closest('a, button, input, select, textarea');
  const startHold = (event: React.PointerEvent<HTMLElement>) => {
    if (!isBannerSurface(event) || event.button !== 0 || holdTimer.current !== undefined) return;
    event.preventDefault();
    setHolding(true);
    setPaused(true);
    holdTimer.current = window.setTimeout(() => {
      setActiveSlide(current => (current + 1) % homePlaces.length);
      setHolding(false);
      holdTimer.current = undefined;
    }, 850);
  };
  useEffect(() => {
    if (paused || focusWithin || !visible) return;
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % homePlaces.length), 8000);
    return () => window.clearInterval(timer);
  }, [paused, focusWithin, visible]);
  const selectSlide = (index: number) => {
    setPaused(true);
    setActiveSlide((index + homePlaces.length) % homePlaces.length);
  };
  const explore = () => {
    discoveryRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    discoveryRef.current?.focus({ preventScroll: true });
  };
  const hero = homePlaces[activeSlide];
  const backToTop = () => {
    homeRef.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  };

  return <main className="booking-home" ref={homeRef}>
    <section className={`booking-hero ${holding ? 'is-holding' : ''}`} aria-label="Cảm hứng cho chuyến đi"
      onPointerDown={startHold} onPointerMove={event => { if (!isBannerSurface(event)) cancelHold(); }}
      onPointerUp={cancelHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false); }}>
      {homePlaces.map((slide, i) => <img
        className={`booking-hero__image ${i === activeSlide ? 'is-active' : ''}`}
        key={`${slide.id}-${retry}`} src={`${slide.image}${retry ? `?retry=${retry}` : ''}`}
        alt={i === activeSlide ? slide.location : ''} aria-hidden={i !== activeSlide}
        style={{ objectPosition: slide.position, visibility: failedImages.includes(i) ? 'hidden' : undefined }}
        fetchPriority={i === 0 ? 'high' : 'low'} decoding="async"
        onError={() => setFailedImages(current => current.includes(i) ? current : [...current, i])} />)}
      <div className="booking-hero__shade" />
      {failedImages.includes(activeSlide) && <div className="booking-hero__error" role="status">
        Ảnh chưa tải được. <button onClick={() => { setFailedImages([]); setRetry(value => value + 1); }}>Thử lại</button>
      </div>}
      <div className="booking-hero__content" key={hero.id}>
        <h1 ref={headingRef} tabIndex={-1}><span>{hero.title[0]}</span><em>{hero.title[1]}</em></h1>
        <div className="booking-hero__aside">
          <p className="booking-hero__copy">{hero.copy}</p>
          <div className="booking-hero__actions">
            <Link className="booking-button booking-button--light" to="/tours">Khám phá tour <Arrow /></Link>
            <Link className="booking-button--ghost" to="/hotels">Tìm khách sạn</Link>
          </div>
        </div>
      </div>
      <div className="booking-hero__rail">
        <div className="booking-hero__note"><Link to={`/destinations/${hero.id}`}>{hero.location}<Arrow /></Link><Link to="/image-credits">Nguồn ảnh</Link></div>
        <button className="booking-hero__explore" onClick={explore}>Khám phá tiếp <Arrow direction="down" /></button>
        <div className="booking-hero__controls" aria-label="Đổi ảnh banner">
          <button onClick={() => selectSlide(activeSlide - 1)} aria-label="Ảnh trước"><Arrow direction="left" /></button>
          <div className="booking-hero__choices">{homePlaces.map((slide, index) => <button className="booking-hero__choice" key={slide.id} onClick={() => selectSlide(index)} aria-label={`Xem ảnh ${index + 1}: ${slide.name}`} aria-pressed={index === activeSlide}>
            {index + 1}
          </button>)}</div>
          <button onClick={() => selectSlide(activeSlide + 1)} aria-label="Ảnh tiếp theo"><Arrow /></button>
          <button className="booking-hero__pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Tiếp tục chuyển ảnh' : 'Tạm dừng chuyển ảnh'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>
          </button>
        </div>
      </div>
    </section>
    <section className="booking-search" aria-label="Khám phá dịch vụ du lịch" ref={discoveryRef} tabIndex={-1}>
      <h2>Bạn muốn đi đâu?</h2>
      <Link className="booking-search__field" to="/destinations"><div><b>Tìm điểm đến</b><small>Biển, núi hay một phố nhỏ</small></div><Arrow /></Link>
      <Link className="booking-search__field" to="/hotels"><div><b>Tìm khách sạn</b><small>Chọn nơi nghỉ cho chuyến đi</small></div><Arrow /></Link>
      <Link className="booking-search__go" to="/tours">Xem tour <Arrow /></Link>
    </section>
    <section className="home-story" id="gioi-thieu">
      <h2>Đi để thấy.<br />Ở lại để <em>cảm nhận.</em></h2>
      <div className="home-story__copy">
        <p className="story-lead">Một buổi sớm bên vịnh.<br />Một chiều đi bộ trong phố cổ.</p>
        <p>Không cần đi thật xa hay xếp kín mỗi ngày. Chọn một nơi bạn thích, tìm chỗ nghỉ vừa ý và để dành thời gian cho cả những điều chưa có trong kế hoạch.</p>
        <p>Ở NVT, bạn có thể tìm tour, khách sạn và tự sắp xếp lịch trình theo từng ngày.</p>
        <Link to="/destinations" className="editorial-link">Tìm điểm đến cho chuyến đi <Arrow /></Link>
      </div>
      <figure className="home-story__photo"><Link to="/destinations/4" aria-label="Khám phá Phố cổ Hội An"><HomePhoto place={homePlaces[1]} /></Link><figcaption><span>Phố cổ Hội An · Một chiều bên sông</span><Link to="/image-credits">Nguồn ảnh</Link></figcaption></figure>
    </section>
    <section className="booking-section booking-services">
      <div className="booking-section__heading"><h2>Chuyến đi<br /> của bạn,<br /><em>theo cách<br /> bạn muốn.</em></h2><p className="booking-section__description">Đi theo tour hoặc tự lên kế hoạch.<br />Bắt đầu từ điều bạn cần.</p><Link className="editorial-link" to="/planner">Lên kế hoạch chuyến đi <Arrow /></Link></div>
      <div className="home-service-links">
        <Link to="/tours"><h3>Tour du lịch</h3><p>Xem lịch trình, giá tour và ngày khởi hành.</p><span>Xem tour <Arrow /></span></Link>
        <Link to="/hotels"><h3>Khách sạn & phòng</h3><p>Tìm nơi nghỉ phù hợp với chuyến đi và ngân sách.</p><span>Tìm phòng <Arrow /></span></Link>
        <Link to="/restaurants"><h3>Nhà hàng</h3><p>Tìm địa chỉ ăn uống ở nơi bạn sắp đến.</p><span>Xem nhà hàng <Arrow /></span></Link>
        <Link to="/planner"><h3>Lịch trình riêng</h3><p>Đăng nhập để sắp xếp và lưu kế hoạch từng ngày.</p><span>Tạo lịch trình <Arrow /></span></Link>
      </div>
    </section>
    <section className="booking-featured">
      <div className="booking-featured__intro"><h2>Vài nơi để<br /><em>bắt đầu.</em></h2><Link className="editorial-link" to="/destinations">Xem tất cả địa điểm <Arrow /></Link></div>
      <div className="booking-destinations">{homeDiscoveries.map((place, index) =>
        <Link className={`home-destination home-destination--${index + 1}`} key={place.id} to={`/destinations?keyword=${encodeURIComponent(place.name)}`}>
          <HomePhoto place={place} /><div className="home-destination__caption"><div><h3>{place.name}</h3><p>{place.tag}</p></div><Arrow /></div>
        </Link>)}</div>
    </section>
    <section className="booking-cta"><div><h2>Đã có nơi muốn đến?</h2><p className="booking-cta__copy">Xem lịch trình và chọn tour phù hợp với thời gian của bạn.</p></div><Link className="booking-button booking-button--dark" to="/tours">Khám phá tour <Arrow /></Link></section>
    <SiteFooter onBackToTop={backToTop} />
  </main>;
};

export default HomePage;
