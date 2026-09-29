import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './home.css';
import { useResource, type TravelImage } from '../User/catalog';
import { localImageUrl } from '../User/Photo';
import { useSession } from '../../context/AuthContext';

const destinationContent = [
  { name: 'Hạ Long', ownerId: 1, tag: 'Biển & vịnh' },
  { name: 'Hội An', ownerId: 4, tag: 'Phố cổ & di sản' },
  { name: 'Đà Nẵng', ownerId: 3, tag: 'Biển & thành phố' },
];

const slideContent = [
  { ownerId: 1, alt: 'Vịnh Hạ Long', title: <>Đi xa một chút,<br /><em>gần nhau hơn.</em></>, copy: 'Chọn tour, khách sạn và hành trình phù hợp cho chuyến đi đáng nhớ tiếp theo của bạn.' },
  { ownerId: 4, alt: 'Phố cổ Hội An', title: <>Chạm vào nhịp sống<br /><em>rất Việt Nam.</em></>, copy: 'Từ phố cổ rực đèn đến những bãi biển bình yên — mọi kỷ niệm đều có một nơi để bắt đầu.' },
  { ownerId: 3, alt: 'Cầu Vàng, Đà Nẵng', title: <>Thức dậy ở nơi<br /><em>bạn muốn đến.</em></>, copy: 'Khám phá những chuyến đi đầy nắng, những căn phòng ấm áp và trải nghiệm dành riêng cho bạn.' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: images } = useResource<TravelImage[]>('/hinhanh');
  const imageFor = (ownerId: number) => localImageUrl(images?.find(p => p.loaiDoiTuong === 'DiaDiem' && p.maDoiTuong === ownerId)?.duongDan) || ({ 1: '/images/Vinh-ha-long.jpg', 4: '/images/hoi-an.jpg', 3: '/images/cau-vang.jpg' }[ownerId]);
  const heroSlides = slideContent.map(slide => ({ ...slide, image: imageFor(slide.ownerId) }));
  const destinations = destinationContent.map(destination => ({ ...destination, image: imageFor(destination.ownerId) }));
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const holdTimer = useRef<number | undefined>(undefined);
  const [holding, setHolding] = useState(false);
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
    window.addEventListener('pointerup', cancel);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', cancel);
    document.addEventListener('scroll', cancel, true);
    return () => {
      window.clearTimeout(holdTimer.current);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', cancel);
      document.removeEventListener('scroll', cancel, true);
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
      setActiveSlide(current => (current + 1) % slideContent.length);
      setHolding(false);
      holdTimer.current = undefined;
    }, 850);
  };
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, heroSlides.length]);
  const hero = heroSlides[activeSlide];
  return <main className="booking-home">
    <section className={`booking-hero ${holding ? 'is-holding' : ''}`}
      onPointerDown={startHold}
      onPointerMove={event => {
        if (!isBannerSurface(event)) cancelHold();
      }}
      onPointerUp={cancelHold} onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}>
      {heroSlides.map((slide, i) => slide.image && <img className={`booking-hero__image ${i === activeSlide ? 'is-active' : ''}`} key={slide.ownerId} src={slide.image} alt={i === activeSlide ? slide.alt : ''} aria-hidden={i !== activeSlide} />)}
      <div className="booking-hero__shade" />
      <div className="booking-hero__content" key={activeSlide}>
        <h1>{hero.title}</h1>
        <p className="booking-hero__copy">{hero.copy}</p>
        <div className="booking-hero__actions"><button className="booking-button booking-button--light" onClick={() => navigate('/tours')}>Khám phá tour</button><button className="booking-button booking-button--ghost" onClick={() => navigate('/hotels')}>Tìm khách sạn</button></div>
      </div>
      <div className="booking-hero__note"><span>{String(activeSlide + 1).padStart(2, '0')} / 03</span>{hero.alt}<Link to="/image-credits">Nguồn ảnh</Link></div>
      <div className="booking-hero__controls" aria-label="Đổi ảnh banner">
        <button onClick={() => setPaused(value => !value)} aria-label={paused ? 'Tiếp tục chuyển ảnh' : 'Tạm dừng chuyển ảnh'}>{paused ? 'Tự chuyển ảnh' : 'Dừng ảnh'}</button>
        <button onClick={() => { setPaused(true); setActiveSlide(current => (current - 1 + heroSlides.length) % heroSlides.length); }} aria-label="Ảnh trước">Trước</button>
        <div>{heroSlides.map((slide, index) => <button key={slide.ownerId} onClick={() => { setPaused(true); setActiveSlide(index); }} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={index === activeSlide}>{String(index + 1).padStart(2, '0')}</button>)}</div>
        <button onClick={() => { setPaused(true); setActiveSlide(current => (current + 1) % heroSlides.length); }} aria-label="Ảnh tiếp theo">Tiếp</button>
      </div>
    </section>
    <section className="booking-search" aria-label="Khám phá dịch vụ du lịch">
      <div className="booking-search__title"><strong>Bạn muốn đi đâu?</strong></div>
      <button className="booking-search__field" onClick={() => navigate('/destinations')}><b>Tìm điểm đến</b><small>Biển, núi hay một phố nhỏ</small></button>
      <button className="booking-search__field" onClick={() => navigate('/hotels')}><b>Tìm khách sạn</b><small>Chọn nơi nghỉ cho chuyến đi</small></button>
      <button className="booking-search__go" onClick={() => navigate('/tours')}>Xem tour</button>
    </section>
    <section className="home-story" id="gioi-thieu"><h2>Đi để thấy.<br/>Ở lại để <em>cảm nhận.</em></h2><div><p className="story-lead">Một buổi sớm bên vịnh.<br/>Một chiều đi bộ trong phố cổ.</p><p>Không cần đi thật xa hay xếp kín mỗi ngày. Chọn một nơi bạn thích, tìm chỗ nghỉ vừa ý và để dành thời gian cho cả những điều chưa có trong kế hoạch.</p><p>Ở NVT, bạn có thể tìm tour, khách sạn và tự sắp xếp lịch trình theo từng ngày.</p><Link to="/destinations" className="editorial-link">Tìm điểm đến cho chuyến đi</Link></div></section>
    <section className="booking-section booking-services">
      <div className="booking-section__heading"><h2>Chuyến đi của bạn,<br /><em>theo cách bạn muốn.</em></h2><p className="booking-section__description">Đi theo tour hoặc tự lên kế hoạch.<br />Bắt đầu từ điều bạn cần.</p></div>
      <div className="home-service-links">
        <Link to="/tours"><h3>Tour du lịch</h3><p>Xem lịch trình, giá tour và ngày khởi hành.</p><span>Xem tour</span></Link>
        <Link to="/hotels"><h3>Khách sạn & phòng</h3><p>Tìm nơi nghỉ phù hợp với chuyến đi và ngân sách.</p><span>Tìm phòng</span></Link>
        <Link to="/restaurants"><h3>Nhà hàng</h3><p>Tìm địa chỉ ăn uống ở nơi bạn sắp đến.</p><span>Xem nhà hàng</span></Link>
        <Link to="/planner"><h3>Lịch trình riêng</h3><p>Đăng nhập để sắp xếp và lưu kế hoạch từng ngày.</p><span>Tạo lịch trình</span></Link>
      </div>
    </section>
    <section className="booking-featured">
      <div className="booking-featured__intro"><h2>Vài nơi để<br /><em>bắt đầu.</em></h2><button className="booking-text-button" onClick={() => navigate('/destinations')}>Xem tất cả địa điểm</button></div>
      <div className="booking-destinations">{destinations.map((d, index) => <Link className={`home-destination home-destination--${index + 1}`} key={d.name} to={`/destinations?keyword=${encodeURIComponent(d.name)}`}><div>{d.image && <img src={d.image} alt={d.name} loading="lazy" />}</div><h3>{d.name}</h3><p>{d.tag}</p></Link>)}</div>
    </section>
    <section className="booking-cta"><div><h2>Đã có nơi muốn đến?</h2><p className="booking-cta__copy">Xem lịch trình và chọn tour phù hợp với thời gian của bạn.</p></div><button className="booking-button booking-button--dark" onClick={() => navigate('/tours')}>Khám phá tour</button></section>
    <footer className="booking-footer"><b>NVT <span>DU LỊCH</span></b><p>Đi để nhìn thấy nhiều hơn.</p><Link to="/image-credits">Nguồn ảnh</Link><button onClick={() => navigate(user ? '/account' : '/login')}>{user ? 'Tài khoản của tôi' : 'Đăng nhập'}</button></footer>
  </main>;
};

export default HomePage;
