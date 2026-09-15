import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface Trip {
  MaChuyenDi: number;
  TenChuyenDi: string;
  DiemKhoiHanh: string;
  DiemDen: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TrangThai: string;
}

const MyTripsPage = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
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
          fetchMyTrips(authData.user.MaNguoiDung);
          return;
        }
      } catch (err) {
        console.error('Lỗi parse auth data', err);
      }
    }
    
    // Fallback for testing if no auth token but want to see UI
    // In production, just keep isLoggedIn = false
    setIsLoggedIn(false);
    setLoading(false);
  };

  const fetchMyTrips = async (uId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/chuyendi/bynguoidung/${uId}`);
      setTrips(response.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải danh sách chuyến đi của bạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    
    const formData = new FormData(e.currentTarget);
    const newTrip = {
      MaNguoiDung: userId,
      TenChuyenDi: formData.get('tenChuyenDi'),
      DiemKhoiHanh: formData.get('diemKhoiHanh'),
      DiemDen: formData.get('diemDen'),
      NgayBatDau: formData.get('ngayBatDau'),
      NgayKetThuc: formData.get('ngayKetThuc'),
      TrangThai: 'Lên kế hoạch'
    };

    try {
      await axios.post(`${API}/api/chuyendi`, newTrip);
      alert('Tạo chuyến đi thành công!');
      fetchMyTrips(userId);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert('Lỗi khi tạo chuyến đi.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#73272c' }}>Chuyến đi của tôi</h2>
        <p style={{ margin: '20px 0', fontSize: '16px', color: '#666' }}>
          Vui lòng đăng nhập để xem và quản lý các chuyến đi của bạn.
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
      <h2 style={{ color: '#73272c', marginBottom: '20px' }}>Chuyến đi của tôi</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Tạo chuyến đi mới</h3>
          <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Tên chuyến đi</label>
              <input type="text" name="tenChuyenDi" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Điểm khởi hành</label>
              <input type="text" name="diemKhoiHanh" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Điểm đến</label>
              <input type="text" name="diemDen" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ngày bắt đầu</label>
              <input type="date" name="ngayBatDau" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ngày kết thúc</label>
              <input type="date" name="ngayKetThuc" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
              Tạo chuyến đi
            </button>
          </form>
        </div>

        <div style={{ flex: '2 1 600px' }}>
          {loading ? (
            <p>Đang tải...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : trips.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
              <p style={{ color: '#666' }}>Bạn chưa có chuyến đi nào. Hãy tạo chuyến đi đầu tiên của bạn!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {trips.map(trip => (
                <div key={trip.MaChuyenDi} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#73272c' }}>{trip.TenChuyenDi}</h3>
                    <p style={{ margin: '5px 0', fontSize: '15px' }}><strong>Hành trình:</strong> {trip.DiemKhoiHanh} → {trip.DiemDen}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>
                      <strong>Thời gian:</strong> {new Date(trip.NgayBatDau).toLocaleDateString('vi-VN')} - {new Date(trip.NgayKetThuc).toLocaleDateString('vi-VN')}
                    </p>
                    <span style={{ 
                      display: 'inline-block', 
                      marginTop: '5px',
                      padding: '3px 10px', 
                      backgroundColor: trip.TrangThai === 'Hoàn thành' ? '#d4edda' : trip.TrangThai === 'Đang đi' ? '#cce5ff' : '#fff3cd', 
                      color: trip.TrangThai === 'Hoàn thành' ? '#155724' : trip.TrangThai === 'Đang đi' ? '#004085' : '#856404', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      {trip.TrangThai}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate(`/planner?chuyenDiId=${trip.MaChuyenDi}`)}
                    style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#73272c', border: '1px solid #73272c', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Xem lịch trình
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTripsPage;
