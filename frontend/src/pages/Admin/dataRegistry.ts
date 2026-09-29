export type DataSection = { title: string; endpoint: string; id: string; description: string; fields: [string,string][] };
const person: [string,string] = ['maNguoiDung','Người dùng'];
const trip: [string,string] = ['maChuyenDi','Chuyến đi'];
const status: [string,string] = ['trangThai','Trạng thái'];
const targets: [string,string][] = [['maTour','Tour'],['maDiaDiem','Điểm đến'],['maNhaHang','Nhà hàng'],['maKhachSan','Khách sạn']];
export const dataSections: Record<string,DataSection> = {
  roles: {title:'Vai trò hệ thống',endpoint:'vaitro',id:'maVaiTro',description:'Vai trò được ứng dụng dùng để phân quyền. Chỉ xem; phân vai trò cho tài khoản tại mục Tài khoản.',fields:[['tenVaiTro','Tên vai trò'],['moTa','Mô tả'],status]},
  trips: {title:'Chuyến đi cá nhân',endpoint:'chuyendi',id:'maChuyenDi',description:'Tra cứu kế hoạch của khách. Nội dung và lời mời được chủ chuyến đi quản lý trong tài khoản, không sửa thay quyền của khách.',fields:[['tenChuyenDi','Tên chuyến đi'],person,['diemKhoiHanh','Điểm khởi hành'],['diemDen','Điểm đến'],['ngayBatDau','Bắt đầu'],['ngayKetThuc','Kết thúc'],['soNguoi','Số người'],['nganSach','Ngân sách'],status,['moTa','Ghi chú']]},
  members: {title:'Thành viên chuyến đi',endpoint:'thanhvienchuyendi',id:'maThanhVien',description:'Tra cứu chủ chuyến đi, thành viên và trạng thái lời mời. Không chấp nhận lời mời thay người nhận.',fields:[trip,person,['vaiTro','Vai trò trong chuyến đi'],status,['ngayThamGia','Ngày tham gia']]},
  days: {title:'Ngày trong lịch trình',endpoint:'lichtrinh',id:'maLichTrinh',description:'Mỗi ngày thuộc một chuyến đi. Mở hoạt động để xem các điểm dừng và khung giờ.',fields:[trip,['ngayThu','Ngày thứ'],['ngay','Ngày thực tế'],['tieuDe','Tiêu đề'],['ghiChu','Ghi chú']]},
  events: {title:'Hoạt động cá nhân',endpoint:'lichtrinhchitiet',id:'maChiTiet',description:'Các điểm tham quan, nhà hàng và khách sạn đã được khách xếp vào từng ngày.',fields:[['maLichTrinh','Ngày lịch trình'],['thuTu','Thứ tự'],['loaiDiaDiem','Loại điểm dừng'],...targets.slice(1),['thoiGianBatDau','Giờ bắt đầu'],['thoiGianKetThuc','Giờ kết thúc'],['chiPhi','Chi phí dự kiến'],['ghiChu','Nội dung']]},
  reviews: {title:'Đánh giá của khách',endpoint:'danhgia',id:'maDanhGia',description:'Xem và ẩn/hiện đánh giá. Không sửa số sao hoặc viết nội dung thay khách.',fields:[person,...targets,['soSao','Số sao'],['noiDung','Nội dung'],['ngayDanhGia','Ngày đánh giá'],status]},
  favorites: {title:'Dịch vụ được yêu thích',endpoint:'yeuthich',id:'maYeuThich',description:'Chỉ tra cứu lựa chọn đã lưu của khách; không tạo hoặc xóa sở thích thay khách.',fields:[person,...targets,['ngayThem','Ngày lưu']]},
  images: {title:'Thư viện hình ảnh',endpoint:'hinhanh',id:'maHinhAnh',description:'Xem ảnh và nguồn ghi công. Mở bộ ảnh để tải thêm, đổi mô tả, sắp xếp hoặc gỡ ảnh của đúng dịch vụ.',fields:[['loaiDoiTuong','Loại dịch vụ'],['maDoiTuong','Mã dịch vụ'],['moTa','Mô tả'],['thuTu','Thứ tự'],['nguon','Nguồn'],['tacGia','Tác giả'],['giayPhep','Giấy phép'],['ngayTao','Ngày tạo']]},
};
export const tableCoverage = [
  ['VaiTro','roles','Xem vai trò; phân quyền tại tài khoản'],['NguoiDung','users','Tạo, sửa, khóa và phân vai trò'],
  ['LoaiDiaDiem','categories','Quản lý loại địa điểm'],['DiaDiem','destinations','Quản lý điểm đến và ảnh'],['NhaHang','restaurants','Quản lý nhà hàng và ảnh'],
  ['KhachSan','hotels','Quản lý nơi lưu trú'],['LoaiPhong','rooms','Quản lý loại phòng, giá, số lượng và ảnh'],['DatPhong','room-orders','Tra cứu và xử lý đơn phòng'],
  ['Tour','tours','Quản lý tour và ảnh'],['TourKhoiHanh','departures','Quản lý lịch khởi hành'],['TourChiTiet','activities','Quản lý hoạt động từng ngày'],['DatTour','tour-orders','Tra cứu và xử lý đơn tour'],
  ['ChuyenDi','trips','Tra cứu; khách tạo ở trang lập lịch trình'],['ThanhVienChuyenDi','members','Tra cứu; chủ chuyến đi quản lý lời mời'],['LichTrinh','days','Tra cứu kế hoạch từng ngày'],['LichTrinhChiTiet','events','Tra cứu điểm dừng và thời gian'],
  ['ThanhToan','payments','Ghi nhận, xác nhận hoặc đánh dấu thất bại'],['MaGiamGia','coupons','Quản lý cấu hình mã giảm giá'],['HinhAnh','images','Quản lý bộ ảnh theo dịch vụ'],['ChiPhi','expenses','Quản lý khoản chi theo chuyến đi'],
  ['DanhGia','reviews','Tra cứu và ẩn/hiện đánh giá'],['YeuThich','favorites','Tra cứu dịch vụ khách đã lưu'],['NhatKyAdmin','audit','Xem lịch sử; không sửa/xóa'],
] as const;
