import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

interface Destination {
  MaDiaDiem: number;
  TenDiaDiem: string;
  LoaiDiaDiem: string;
  TinhThanh: string;
  DiemDanhGia: number;
  GiaVe: number;
  AnhDaiDien: string;
}

interface LoaiDiaDiem {
  Id: number;
  TenLoai: string;
}

const DestinationsPage = () => {
  const [dsDiaDiem, setDsDiaDiem] = useState<Destination[]>([]);
  const [loaiList, setLoaiList] = useState<LoaiDiaDiem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({ tinh: '', loai: '', keyword: '' });

  useEffect(() => {
    fetchLoaiDiaDiem();
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [filters]);

  const fetchLoaiDiaDiem = async () => {
    try {
      const res = await axios.get(`${API}/api/loaidiadiem`);
      setLoaiList(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách loại địa điểm', err);
    }
  };

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/diadiem`, {
        params: filters
      });
      setDsDiaDiem(response.data);
      setError('');
    } catch (err: any) {
      setError('Lỗi khi tải danh sách địa điểm.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#73272c', marginBottom: '20px' }}>Khám phá Địa điểm du lịch</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          name="keyword" 
          placeholder="Tìm địa điểm..." 
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
          <option value="Quảng Ninh">Quảng Ninh</option>
          <option value="Kiên Giang">Kiên Giang</option>
        </select>
        <select 
          name="loai" 
          value={filters.loai} 
          onChange={handleFilterChange}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
        >
          <option value="">Tất cả loại hình</option>
          {loaiList.map(loai => (
            <option key={loai.Id} value={loai.TenLoai}>{loai.TenLoai}</option>
          ))}
          {/* Fallback nếu API loaidiadiem chưa có data */}
          {loaiList.length === 0 && (
            <>
              <option value="Biển">Biển</option>
              <option value="Núi">Núi</option>
              <option value="Văn hóa">Văn hóa</option>
              <option value="Giải trí">Giải trí</option>
              <option value="Ẩm thực">Ẩm thực</option>
            </>
          )}
        </select>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : dsDiaDiem.length === 0 ? (
        <p>Không tìm thấy địa điểm nào phù hợp.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {dsDiaDiem.map(diadiem => (
            <div key={diadiem.MaDiaDiem} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <img src={diadiem.AnhDaiDien || '/images/default-destination.jpg'} alt={diadiem.TenDiaDiem} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{diadiem.TenDiaDiem}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>📍 {diadiem.TinhThanh}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Loại hình:</strong> {diadiem.LoaiDiaDiem}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Đánh giá:</strong> ⭐ {diadiem.DiemDanhGia || 'Chưa có'}</p>
                <div style={{ flex: 1 }}></div>
                <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#73272c', fontWeight: 'bold' }}>
                  {diadiem.GiaVe === 0 ? 'Miễn phí' : `Giá vé: ${diadiem.GiaVe?.toLocaleString()} VND`}
                </p>
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#fff', color: '#73272c', border: '1px solid #73272c', borderRadius: '4px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationsPage;
