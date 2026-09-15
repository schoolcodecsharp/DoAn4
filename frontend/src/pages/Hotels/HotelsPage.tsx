import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface Hotel {
  MaKhachSan: number;
  TenKhachSan: string;
  LoaiLuuTru: string;
  TinhThanh: string;
  GiaPhongMin: number;
  GiaPhongMax: number;
  DiemDanhGia: number;
  AnhDaiDien: string;
}

const HotelsPage = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({ tinh: '', loai: '', keyword: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchHotels();
  }, [filters]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/khachsan`, {
        params: filters
      });
      setHotels(response.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải danh sách khách sạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#73272c', marginBottom: '20px' }}>Danh sách Khách sạn & Nơi lưu trú</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          name="keyword" 
          placeholder="Tìm kiếm khách sạn..." 
          value={filters.keyword} 
          onChange={handleFilterChange}
          style={{ padding: '10px', flex: 1, minWidth: '200px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select 
          name="tinh" 
          value={filters.tinh} 
          onChange={handleFilterChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
        >
          <option value="">Tất cả tỉnh thành</option>
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
          <option value="Khánh Hòa">Khánh Hòa</option>
          <option value="Lâm Đồng">Lâm Đồng</option>
        </select>
        <select 
          name="loai" 
          value={filters.loai} 
          onChange={handleFilterChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
        >
          <option value="">Tất cả loại lưu trú</option>
          <option value="Hotel">Hotel</option>
          <option value="Homestay">Homestay</option>
          <option value="Resort">Resort</option>
          <option value="Hostel">Hostel</option>
          <option value="Villa">Villa</option>
        </select>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : hotels.length === 0 ? (
        <p>Không tìm thấy nơi lưu trú nào phù hợp.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {hotels.map(hotel => (
            <div key={hotel.MaKhachSan} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <img src={hotel.AnhDaiDien || '/images/default-hotel.jpg'} alt={hotel.TenKhachSan} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{hotel.TenKhachSan}</h3>
                  <span style={{ backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{hotel.LoaiLuuTru}</span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>📍 {hotel.TinhThanh}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Khoảng giá:</strong> {hotel.GiaPhongMin?.toLocaleString()} - {hotel.GiaPhongMax?.toLocaleString()} VND
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Đánh giá:</strong> ⭐ {hotel.DiemDanhGia || 'Chưa có'}</p>
                <button 
                  onClick={() => navigate(`/hotels/${hotel.MaKhachSan}`)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Xem phòng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelsPage;
