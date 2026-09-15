import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface Tour {
  MaTour: number;
  TenTour: string;
  AnhDaiDien: string;
  DiemKhoiHanh: string;
  DiemDen: string;
  SoNgay: number;
  GiaTour: number;
  DiemDanhGia: number;
}

const ToursPage = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({ keyword: '', trangthai: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTours();
  }, [filters]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/tour`, {
        params: filters
      });
      setTours(response.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải danh sách tour.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#73272c', marginBottom: '20px' }}>Danh sách Tour Du Lịch</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          name="keyword" 
          placeholder="Tìm kiếm tour..." 
          value={filters.keyword} 
          onChange={handleFilterChange}
          style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select 
          name="trangthai" 
          value={filters.trangthai} 
          onChange={handleFilterChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Đang mở">Đang mở</option>
          <option value="Đã đóng">Đã đóng</option>
        </select>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : tours.length === 0 ? (
        <p>Không tìm thấy tour nào phù hợp.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {tours.map(tour => (
            <div key={tour.MaTour} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <img src={tour.AnhDaiDien || '/images/default-tour.jpg'} alt={tour.TenTour} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{tour.TenTour}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Hành trình:</strong> {tour.DiemKhoiHanh} → {tour.DiemDen}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Thời gian:</strong> {tour.SoNgay} ngày</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#73272c', fontWeight: 'bold' }}><strong>Giá:</strong> {tour.GiaTour?.toLocaleString()} VND</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Đánh giá:</strong> ⭐ {tour.DiemDanhGia || 'Chưa có'}</p>
                <button 
                  onClick={() => navigate(`/tours/${tour.MaTour}`)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Đặt tour
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToursPage;
