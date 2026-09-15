import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface TourDetail {
  MaTour: number;
  TenTour: string;
  MoTa: string;
  AnhDaiDien: string;
  DiemKhoiHanh: string;
  DiemDen: string;
  SoNgay: number;
  GiaTour: number;
  DiemDanhGia: number;
}

interface TourKhoiHanh {
  MaChuyen: number;
  MaTour: number;
  NgayKhoiHanh: string;
  NgayKetThuc: string;
  SoCho: number;
  SoChoDaDat: number;
  GiaThucTe: number;
}

const TourDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [lichKhoiHanh, setLichKhoiHanh] = useState<TourKhoiHanh[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchTourData(id);
    }
  }, [id]);

  const fetchTourData = async (tourId: string) => {
    setLoading(true);
    try {
      const [tourRes, khRes] = await Promise.all([
        axios.get(`${API}/api/tour/${tourId}`),
        axios.get(`${API}/api/tourkhoihanh/bytour/${tourId}`)
      ]);
      setTour(tourRes.data);
      setLichKhoiHanh(khRes.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải thông tin chi tiết tour.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!tour) return <div style={{ padding: '20px' }}>Không tìm thấy tour.</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/tours')}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}
      >
        ← Quay lại
      </button>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <img 
          src={tour.AnhDaiDien || '/images/default-tour.jpg'} 
          alt={tour.TenTour} 
          style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: '8px', objectFit: 'cover' }} 
        />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ color: '#73272c', marginTop: 0 }}>{tour.TenTour}</h2>
          <p><strong>Hành trình:</strong> {tour.DiemKhoiHanh} → {tour.DiemDen}</p>
          <p><strong>Thời gian:</strong> {tour.SoNgay} ngày</p>
          <p><strong>Đánh giá:</strong> ⭐ {tour.DiemDanhGia || 'Chưa có đánh giá'}</p>
          <p style={{ color: '#73272c', fontSize: '24px', fontWeight: 'bold' }}>
            {tour.GiaTour?.toLocaleString()} VND
          </p>
          <div style={{ marginTop: '20px' }}>
            <h3>Mô tả</h3>
            <p style={{ lineHeight: '1.6' }}>{tour.MoTa || 'Đang cập nhật mô tả cho tour này.'}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#73272c', borderBottom: '2px solid #73272c', paddingBottom: '10px' }}>Lịch khởi hành</h3>
        {lichKhoiHanh.length === 0 ? (
          <p>Hiện chưa có lịch khởi hành cho tour này.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9', textAlign: 'left' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Ngày khởi hành</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Ngày kết thúc</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Số chỗ</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Đã đặt</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Giá thực tế</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {lichKhoiHanh.map(kh => (
                <tr key={kh.MaChuyen}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{new Date(kh.NgayKhoiHanh).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{new Date(kh.NgayKetThuc).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{kh.SoCho}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{kh.SoChoDaDat}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{kh.GiaThucTe?.toLocaleString()} VND</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <button 
                      disabled={kh.SoChoDaDat >= kh.SoCho}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: kh.SoChoDaDat >= kh.SoCho ? '#ccc' : '#73272c', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: kh.SoChoDaDat >= kh.SoCho ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => alert('Chức năng đặt chỗ đang được phát triển!')}
                    >
                      {kh.SoChoDaDat >= kh.SoCho ? 'Hết chỗ' : 'Đặt chỗ'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TourDetailPage;
