import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000';

interface HotelDetail {
  MaKhachSan: number;
  TenKhachSan: string;
  LoaiLuuTru: string;
  TinhThanh: string;
  MoTa: string;
  DiaChi: string;
  DiemDanhGia: number;
  AnhDaiDien: string;
}

interface RoomType {
  MaLoaiPhong: number;
  MaKhachSan: number;
  TenLoaiPhong: string;
  DienTich: number;
  SoNguoiToiDa: number;
  GiaDem: number;
  MoTa: string;
  HinhAnh: string;
}

const HotelDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchHotelData(id);
    }
  }, [id]);

  const fetchHotelData = async (hotelId: string) => {
    setLoading(true);
    try {
      const [hotelRes, roomsRes] = await Promise.all([
        axios.get(`${API}/api/khachsan/${hotelId}`),
        axios.get(`${API}/api/loaiphong/bykhachsan/${hotelId}`)
      ]);
      setHotel(hotelRes.data);
      setRoomTypes(roomsRes.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải thông tin khách sạn.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!hotel) return <div style={{ padding: '20px' }}>Không tìm thấy khách sạn.</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/hotels')}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}
      >
        ← Quay lại
      </button>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <img 
          src={hotel.AnhDaiDien || '/images/default-hotel.jpg'} 
          alt={hotel.TenKhachSan} 
          style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: '8px', objectFit: 'cover' }} 
        />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ color: '#73272c', margin: 0 }}>{hotel.TenKhachSan}</h2>
            <span style={{ backgroundColor: '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {hotel.LoaiLuuTru}
            </span>
          </div>
          <p style={{ color: '#666', marginTop: '10px' }}>📍 {hotel.DiaChi}, {hotel.TinhThanh}</p>
          <p><strong>Đánh giá:</strong> ⭐ {hotel.DiemDanhGia || 'Chưa có đánh giá'}</p>
          <div style={{ marginTop: '20px' }}>
            <h3>Giới thiệu</h3>
            <p style={{ lineHeight: '1.6' }}>{hotel.MoTa || 'Đang cập nhật mô tả.'}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#73272c', borderBottom: '2px solid #73272c', paddingBottom: '10px' }}>Các loại phòng hiện có</h3>
        {roomTypes.length === 0 ? (
          <p>Hiện chưa có thông tin phòng cho khách sạn này.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {roomTypes.map(room => (
              <div key={room.MaLoaiPhong} style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', flexWrap: 'wrap' }}>
                <img 
                  src={room.HinhAnh || '/images/default-room.jpg'} 
                  alt={room.TenLoaiPhong} 
                  style={{ width: '300px', height: '200px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '20px', flex: 1 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{room.TenLoaiPhong}</h4>
                  <p style={{ margin: '5px 0' }}><strong>Diện tích:</strong> {room.DienTich} m²</p>
                  <p style={{ margin: '5px 0' }}><strong>Sức chứa:</strong> Tối đa {room.SoNguoiToiDa} người</p>
                  <p style={{ margin: '10px 0', color: '#555' }}>{room.MoTa}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                    <p style={{ margin: 0, color: '#73272c', fontSize: '20px', fontWeight: 'bold' }}>
                      {room.GiaDem?.toLocaleString()} VND <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>/ đêm</span>
                    </p>
                    <button style={{ padding: '10px 20px', backgroundColor: '#73272c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Đặt phòng
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailPage;
