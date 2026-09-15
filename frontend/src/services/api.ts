import axios from 'axios';
import type { AuthUser } from '../types';

const API_BASE = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('authUser');
  if (userStr) {
    const user: AuthUser = JSON.parse(userStr);
    if (user.token && config.headers) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export const authApi = {
  login: (data: any) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  getProfile: (id: number) => apiClient.get(`/nguoidung/${id}`),
};

export const diaDiemApi = {
  getAll: (params?: any) => apiClient.get('/diadiem', { params }),
  getById: (id: number) => apiClient.get(`/diadiem/${id}`),
  search: (tinh?: string, loai?: number, keyword?: string) => 
    apiClient.get('/diadiem/search', { params: { tinh, loai, keyword } }),
};

export const nhaHangApi = {
  getAll: () => apiClient.get('/nhahang'),
  getById: (id: number) => apiClient.get(`/nhahang/${id}`),
  search: (tinh?: string, keyword?: string) => apiClient.get('/nhahang/search', { params: { tinh, keyword } }),
};

export const khachSanApi = {
  getAll: () => apiClient.get('/khachsan'),
  getById: (id: number) => apiClient.get(`/khachsan/${id}`),
  getLoaiPhong: (id: number) => apiClient.get(`/khachsan/${id}/loaiphong`),
  search: (tinh?: string, loai?: number, keyword?: string) => apiClient.get('/khachsan/search', { params: { tinh, loai, keyword } }),
};

export const tourApi = {
  getAll: () => apiClient.get('/tour'),
  getById: (id: number) => apiClient.get(`/tour/${id}`),
  getKhoiHanh: (id: number) => apiClient.get(`/tour/${id}/khoihanh`),
  search: (keyword?: string, trangthai?: string) => apiClient.get('/tour/search', { params: { keyword, trangthai } }),
};

export const datTourApi = {
  getAll: () => apiClient.get('/dattour'),
  getById: (id: number) => apiClient.get(`/dattour/${id}`),
  getByNguoiDung: (id: number) => apiClient.get(`/dattour/nguoidung/${id}`),
  create: (data: any) => apiClient.post('/dattour', data),
  update: (id: number, data: any) => apiClient.put(`/dattour/${id}`, data),
  delete: (id: number) => apiClient.delete(`/dattour/${id}`),
};

export const datPhongApi = {
  getAll: () => apiClient.get('/datphong'),
  getById: (id: number) => apiClient.get(`/datphong/${id}`),
  getByNguoiDung: (id: number) => apiClient.get(`/datphong/nguoidung/${id}`),
  create: (data: any) => apiClient.post('/datphong', data),
  update: (id: number, data: any) => apiClient.put(`/datphong/${id}`, data),
};

export const chuyenDiApi = {
  getAll: () => apiClient.get('/chuyendi'),
  getById: (id: number) => apiClient.get(`/chuyendi/${id}`),
  getByNguoiDung: (id: number) => apiClient.get(`/chuyendi/nguoidung/${id}`),
  create: (data: any) => apiClient.post('/chuyendi', data),
  update: (id: number, data: any) => apiClient.put(`/chuyendi/${id}`, data),
  delete: (id: number) => apiClient.delete(`/chuyendi/${id}`),
};

export const lichTrinhApi = {
  getByChuyenDi: (id: number) => apiClient.get(`/lichtrinh/chuyendi/${id}`),
  create: (data: any) => apiClient.post('/lichtrinh', data),
  update: (id: number, data: any) => apiClient.put(`/lichtrinh/${id}`, data),
  delete: (id: number) => apiClient.delete(`/lichtrinh/${id}`),
};

export const lichTrinhChiTietApi = {
  getByLichTrinh: (id: number) => apiClient.get(`/lichtrinhchitiet/lichtrinh/${id}`),
  create: (data: any) => apiClient.post('/lichtrinhchitiet', data),
  update: (id: number, data: any) => apiClient.put(`/lichtrinhchitiet/${id}`, data),
  delete: (id: number) => apiClient.delete(`/lichtrinhchitiet/${id}`),
};

export const danhGiaApi = {
  getByTour: (id: number) => apiClient.get(`/danhgia/tour/${id}`),
  getByDiaDiem: (id: number) => apiClient.get(`/danhgia/diadiem/${id}`),
  create: (data: any) => apiClient.post('/danhgia', data),
};

export const yeuthichApi = {
  getByNguoiDung: (id: number) => apiClient.get(`/yeuthich/nguoidung/${id}`),
  create: (data: any) => apiClient.post('/yeuthich', data),
  deleteByTour: (maNguoiDung: number, maTour: number) => apiClient.delete(`/yeuthich/nguoidung/${maNguoiDung}/tour/${maTour}`),
};

export const maGiamGiaApi = {
  validate: (code: string, tongTien: number) => apiClient.get('/magiamgia/validate', { params: { code, tongTien } }),
};

export const chiPhiApi = {
  getByChuyenDi: (id: number) => apiClient.get(`/chiphi/chuyendi/${id}`),
  create: (data: any) => apiClient.post('/chiphi', data),
  update: (id: number, data: any) => apiClient.put(`/chiphi/${id}`, data),
  delete: (id: number) => apiClient.delete(`/chiphi/${id}`),
};

export default apiClient;
