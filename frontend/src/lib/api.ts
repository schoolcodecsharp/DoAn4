import axios from 'axios';

export const api = axios.create({ baseURL: '/api', timeout: 20000 });
export type User = { maNguoiDung: number; maVaiTro: number; hoTen: string; email: string; soDienThoai?: string };
export type Session = { token: string; user: User };
export function readSession(): Session | null {
  try {
    const value = JSON.parse(localStorage.getItem('tripmate_auth') || 'null');
    return value?.token && value?.user?.maNguoiDung ? value : null;
  } catch { return null; }
}
api.interceptors.request.use(config => {
  const token = readSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
    localStorage.removeItem('tripmate_auth');
    window.dispatchEvent(new Event('session-expired'));
  }
  return Promise.reject(error);
});
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (error.response?.status === 400) return 'Dữ liệu chưa hợp lệ. Kiểm tra các trường bắt buộc, ngày, số lượng và định dạng đã nhập.';
    if (error.response?.status === 409) return 'Dữ liệu đã thay đổi hoặc trùng bản ghi. Vui lòng tải lại thông tin và thử lại.';
    if (error.response?.status === 429) return 'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.';
    if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.response?.status === 404) return 'Thông tin này không còn tồn tại.';
    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  }
  return 'Chưa kết nối được dịch vụ. Vui lòng thử lại sau.';
}
export const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
export const dateLabel = (value: string) => new Date(value).toLocaleDateString('vi-VN');
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function safeReturnTo(value: string | null) {
  return value && /^\/(?:admin|account|my-trips|planner|(?:tours|hotels)\/\d+(?:\/book)?|destinations\/\d+)(?:[/?#]|$)/.test(value) && !value.includes('\\') ? value : '/account';
}
