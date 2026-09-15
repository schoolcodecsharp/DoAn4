import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './home.css';
import { useResource, type TravelImage } from '../User/catalog';
import { localImageUrl } from '../User/Photo';
import { useSession } from '../../context/AuthContext';

const destinationContent = [
  { name: 'Hạ Long', detail: '2 ngày 1 đêm', ownerId: 1, tag: 'Biển & vịnh' },
  { name: 'Hội An', detail: '3 ngày 2 đêm', ownerId: 4, tag: 'Di sản' },
  { name: 'Đà Nẵng', detail: '3 ngày 2 đêm', ownerId: 3, tag: 'Nghỉ dưỡng' },
];

const slideContent = [
  { ownerId: 1, alt: 'Vịnh Hạ Long', eyebrow: 'NVT DU LỊCH · KHÁM PHÁ VIỆT NAM', title: <>Đi xa một chút,<br /><em>gần nhau hơn.</em></>, copy: 'Chọn tour, khách sạn và hành trình phù hợp cho chuyến đi đáng nhớ tiếp theo của bạn.' },
  { ownerId: 4, alt: 'Phố cổ Hội An', eyebrow: 'NVT DU LỊCH · HÀNH TRÌNH DI SẢN', title: <>Chạm vào nhịp sống<br /><em>rất Việt Nam.</em></>, copy: 'Từ phố cổ rực đèn đến những bãi biển bình yên — mọi kỷ niệm đều có một nơi để bắt đầu.' },
  { ownerId: 3, alt: 'Cầu Vàng, Đà Nẵng', eyebrow: 'NVT DU LỊCH · KỲ NGHỈ TRONG MƠ', title: <>Thức dậy ở nơi<br /><em>bạn muốn đến.</em></>, copy: 'Khám phá những chuyến đi đầy nắng, những căn phòng ấm áp và trải nghiệm dành riêng cho bạn.' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: images } = useResource<TravelImage[]>('/hinhanh');
  const imageFor = (ownerId: number) => localImageUrl(images?.find(p => p.loaiDoiTuong === 'DiaDiem' && p.maDoiTuong === ownerId)?.duongDan);
  const heroSlides = slideContent.map(slide => ({ ...slide, image: imageFor(slide.ownerId) }));
  const destinations = destinationContent.map(destination => ({ ...destination, image: imageFor(destination.ownerId) }));
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const hero = heroSlides[activeSlide];
  return <main className="booking-home">
    <section className="booking-hero">
      {hero.image && <img className="booking-hero__image" key={hero.image} src={hero.image} alt={hero.alt} />}
      <div className="booking-hero__shade" />
      <div className="booking-hero__content">
        <p className="booking-eyebrow">{hero.eyebrow}</p>
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
      <div className="booking-search__title"><span>CHUYẾN ĐI TIẾP THEO</span><strong>Bạn muốn bắt đầu từ đâu?</strong></div>
      <button className="booking-search__field" onClick={() => navigate('/destinations')}><small>01 · KHÁM PHÁ</small><b>Tìm điểm đến</b></button>
      <button className="booking-search__field" onClick={() => navigate('/hotels')}><small>02 · NGHỈ NGƠI</small><b>Tìm khách sạn</b></button>
      <button className="booking-search__go" onClick={() => navigate('/tours')}>Xem tour</button>
    </section>
    <section className="booking-section booking-services">
      <div className="booking-section__heading"><div><p className="booking-eyebrow booking-eyebrow--dark">MỌI THỨ CHO CHUYẾN ĐI CỦA BẠN</p><h2>Một điểm dừng,<br /><em>vạn trải nghiệm.</em></h2></div><p className="booking-section__description">Từ một ý tưởng nhỏ đến một hành trình đáng nhớ.<br />Tìm mọi điều bạn cần, ở cùng một nơi.</p></div>
      <div className="booking-services__grid">
        <button onClick={() => navigate('/tours')}><span className="service-number">01</span><b>Tour du lịch</b><p>Lịch trình rõ ràng, mức giá minh bạch và nhiều lựa chọn hấp dẫn.</p><i>Khám phá</i></button>
        <button onClick={() => navigate('/hotels')}><span className="service-number">02</span><b>Khách sạn & phòng</b><p>Không gian nghỉ ngơi vừa vặn với sở thích và ngân sách của bạn.</p><i>Tìm phòng</i></button>
        <button onClick={() => navigate('/planner')}><span className="service-number">03</span><b>Lập lịch trình</b><p>Đăng nhập để tự sắp xếp điểm đến và lưu kế hoạch theo từng ngày.</p><i>Tạo lịch trình</i></button>
      </div>
    </section>
    <section className="booking-featured">
      <div className="booking-featured__intro"><p className="booking-eyebrow">ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH</p><h2>Mở bản đồ,<br />chạm vào <em>mùa vui.</em></h2><button className="booking-text-button" onClick={() => navigate('/destinations')}>Xem tất cả địa điểm</button></div>
      <div className="booking-destinations">{destinations.map((d, index) => <button className={`booking-card booking-card--${index + 1}`} key={d.name} onClick={() => navigate(`/destinations?keyword=${d.name}`)}>{d.image && <img src={d.image} alt={d.name} loading="lazy" />}<span>{d.tag}</span><b>{d.name}</b><small>Khám phá điểm đến</small></button>)}</div>
    </section>
    <section className="booking-cta"><div><p className="booking-eyebrow">SẴN SÀNG LÊN ĐƯỜNG?</p><h2>Một chuyến đi mới.<br /><em>Thêm một câu chuyện.</em></h2><p className="booking-cta__copy">Chọn hành trình phù hợp và bắt đầu lên kế hoạch hôm nay.</p></div><button className="booking-button booking-button--dark" onClick={() => navigate('/tours')}>Khám phá tour</button></section>
    <footer className="booking-footer"><b>NVT <span>DU LỊCH</span></b><p>Đi để nhìn thấy nhiều hơn.</p><Link to="/image-credits">Nguồn ảnh</Link><button onClick={() => navigate(user ? '/account' : '/login')}>{user ? 'Tài khoản của tôi' : 'Đăng nhập'}</button></footer>
  </main>;
};

export default HomePage;
