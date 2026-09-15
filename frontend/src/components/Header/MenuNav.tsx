import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MenuNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuNav: React.FC<MenuNavProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const go = (path: string) => { navigate(path); onClose(); };

  const links = [
    { path: '/', label: 'Trang chủ', num: '01' },
    { path: '/destinations', label: 'Khám phá địa điểm', num: '02' },
    { path: '/tours', label: 'Đặt tour du lịch', num: '03' },
    { path: '/hotels', label: 'Đặt phòng khách sạn', num: '04' },
    { path: '/planner', label: 'Lập kế hoạch', num: '05' },
  ];

  const quickActions = [
    { icon: '🗺️', label: 'Địa điểm nổi bật', path: '/destinations' },
    { icon: '🚌', label: 'Tour du lịch', path: '/tours' },
    { icon: '🏨', label: 'Khách sạn & Phòng', path: '/hotels' },
    { icon: '📋', label: 'Lập kế hoạch chuyến đi', path: '/planner' },
    { icon: '📅', label: 'Chuyến đi của tôi', path: '/my-trips' },
    { icon: '⭐', label: 'Đánh giá & Yêu thích', path: '/favorites' },
  ];

  return (
    <nav
      id="journey-menu"
      className={`journey-menu immersive-menu`}
      style={{ display: isOpen ? undefined : 'none' }}
      aria-label="Menu NVT Du Lịch"
    >
      <div className="menu-top">
        <div className="menu-brand">
          NVT<span style={{ fontSize: '0.6em', verticalAlign: 'super', marginLeft: '2px' }}>Du Lịch</span>
          <p>Hành trình hoàn hảo bắt đầu từ đây.</p>
        </div>

        <div className="menu-links">
          <span className="menu-eyebrow">HÀNH TRÌNH CỦA BẠN</span>
          {links.map((l) => (
            <button key={l.path} onClick={() => go(l.path)}>
              <small>{l.num}</small>{l.label}<span>↗</span>
            </button>
          ))}
        </div>

        <button className="menu-dismiss" aria-label="Đóng menu" onClick={onClose}>×</button>
      </div>

      {/* Thay gallery ảnh bằng quick actions + auth */}
      <div className="menu-gallery" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="menu-gallery-heading">
          <span>CHỨC NĂNG NHANH</span>
          <span>QUICK ACCESS →</span>
        </div>

        {/* Grid chức năng thay cho film ảnh */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          padding: '1.5rem',
          flex: 1,
        }}>
          {quickActions.map((a) => (
            <button
              key={a.path}
              onClick={() => go(a.path)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '1rem',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{a.icon}</div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>{a.label}</div>
            </button>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '0.75rem',
        }}>
          <button
            onClick={() => go('/login')}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', color: 'inherit',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.9rem',
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => go('/register')}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '8px', color: '#1a1a1a',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            Đăng ký
          </button>
        </div>
      </div>

      <div className="menu-foot">NVT Du Lịch — Lập kế hoạch du lịch thông minh.</div>
    </nav>
  );
};

export default MenuNav;
