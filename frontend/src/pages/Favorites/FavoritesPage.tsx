import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface Favorite {
  MaYeuThich: number;
  MaNguoiDung: number;
  LoaiYeuThich: string;
  MaDoiTuong: number;
  NgayThem: string;
  // Các field thêm từ API khi join bảng
  TenDoiTuong?: string;
  AnhDaiDien?: string;
  MoTaNgan?: string;
}

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const authDataStr = localStorage.getItem('tripmate_auth');
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        if (authData && authData.user && authData.user.MaNguoiDung) {
          setIsLoggedIn(true);
          setUserId(authData.user.MaNguoiDung);
          fetchFavorites(authData.user.MaNguoiDung);
          return;
        }
      } catch (err) {
        console.error('Lỗi parse auth data', err);
      }
    }
    
    setIsLoggedIn(false);
    setLoading(false);
  };

  const fetchFavorites = async (uId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/yeuthich/bynguoidung/${uId}`);
      setFavorites(response.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (maYeuThich: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khỏi danh sách yêu thích?')) return;
    
    try {
      await axios.delete(`${API}/api/yeuthich/${maYeuThich}`);
      setFavorites(favorites.filter(fav => fav.MaYeuThich !== maYeuThich));
    } catch (err) {
      alert('Lỗi khi xóa yêu thích.');
    }
  };

  const handleNavigate = (fav: Favorite) => {
    if (fav.LoaiYeuThich === 'Tour') {
      navigate(`/tours/${fav.MaDoiTuong}`);
    } else if (fav.LoaiYeuThich === 'DiaDiem') {
      // Navigate to destination detail if it exists, for now just destinations page
      navigate(`/destinations`);
    } else if (fav.LoaiYeuThich === 'KhachSan') {
      navigate(`/hotels/${fav.MaDoiTuong}`);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#73272c' }}>Danh sách yêu thích</h2>
        <p style={{ margin: '20px 0', fontSize: '16px', color: '#666' }}>
          Vui lòng đăng nhập để xem danh sách yêu thích của bạn.
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '10px 30px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#73272c', marginBottom: '20px' }}>Danh sách yêu thích của tôi</h2>
      
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : favorites.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '16px' }}>Bạn chưa có mục yêu thích nào.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => navigate('/tours')} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #73272c', color: '#73272c', borderRadius: '4px', cursor: 'pointer' }}>Tìm Tour</button>
            <button onClick={() => navigate('/hotels')} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #73272c', color: '#73272c', borderRadius: '4px', cursor: 'pointer' }}>Tìm Khách sạn</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {favorites.map(fav => (
            <div key={fav.MaYeuThich} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <img 
                src={fav.AnhDaiDien || '/images/default-image.jpg'} 
                alt={fav.TenDoiTuong || 'Item'} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', cursor: 'pointer' }} 
                onClick={() => handleNavigate(fav)}
              />
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 
                    style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333', cursor: 'pointer' }}
                    onClick={() => handleNavigate(fav)}
                  >
                    {fav.TenDoiTuong || `Mục yêu thích #${fav.MaDoiTuong}`}
                  </h3>
                  <span style={{ backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {fav.LoaiYeuThich}
                  </span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{fav.MoTaNgan || 'Không có mô tả'}</p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                  Đã thêm: {new Date(fav.NgayThem).toLocaleDateString('vi-VN')}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => handleNavigate(fav)}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Xem chi tiết
                  </button>
                  <button 
                    onClick={() => removeFavorite(fav.MaYeuThich)}
                    style={{ padding: '8px 15px', backgroundColor: '#fff', color: 'red', border: '1px solid red', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
