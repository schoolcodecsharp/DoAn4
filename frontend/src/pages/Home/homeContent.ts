// Editorial selections, not live booking inventory. Source metadata lives in
// backend/Data/photo-sources; public attribution is available at /image-credits.
export const homePlaces = [
  {
    id: 1, name: 'Hạ Long', location: 'Vịnh Hạ Long', tag: 'Biển & vịnh',
    image: '/media/library/ha-long-83214199.jpg', position: '50% 64%',
    author: 'Taewangkorea', license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Ha_Long_Bay_from_Titov_Island.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    title: ['Đi xa một chút,', 'gần nhau hơn.'],
    copy: 'Chọn tour, khách sạn và hành trình phù hợp cho chuyến đi đáng nhớ tiếp theo của bạn.',
  },
  {
    id: 4, name: 'Hội An', location: 'Phố cổ Hội An', tag: 'Phố cổ & di sản',
    image: '/media/vietnam/hoi-an.jpg', position: '48% 65%',
    author: 'John Lian', license: 'CC BY-SA 4.0',
    source: "https://commons.wikimedia.org/wiki/File:Hoi'an_by_the_river.jpg",
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    title: ['Chạm vào nhịp sống', 'rất Việt Nam.'],
    copy: 'Từ phố cổ rực đèn đến những bãi biển bình yên — mọi kỷ niệm đều có một nơi để bắt đầu.',
  },
  {
    id: 3, name: 'Đà Nẵng', location: 'Cầu Vàng, Đà Nẵng', tag: 'Biển & thành phố',
    image: '/media/vietnam/cau-vang.jpg', position: '50% 58%',
    author: 'Supanut Arunoprayote', license: 'CC BY 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Golden_Bridge,_Da_Nang_(I).jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    title: ['Thức dậy ở nơi', 'bạn muốn đến.'],
    copy: 'Khám phá những chuyến đi đầy nắng, những căn phòng ấm áp và trải nghiệm dành riêng cho bạn.',
  },
  {
    id: 30, name: 'Tràng An', location: 'Tràng An, Ninh Bình', tag: 'Non nước & di sản',
    image: '/media/library/ninh-binh-145501694.jpg', position: '65% 55%',
    author: 'Jakub Hałun', license: 'CC BY 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1433_5283.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    title: ['Giữa miền non nước,', 'cứ thong thả thôi.'],
    copy: 'Dành thời gian cho một chuyến thuyền, một khoảng xanh và những điều bình dị dọc đường.',
  },
  {
    id: 127, name: 'Mù Cang Chải', location: 'Ruộng bậc thang Chế Cu Nha, Mù Cang Chải', tag: 'Những mùa trên núi',
    image: '/media/coverage-20261002/destination-127-61895716.jpg', position: '50% 55%',
    author: 'Doan Tuan danny_pham93', license: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Terraces_in_Che_Cu_Nha_commune,_Mu_Cang_Chai_(Unsplash).jpg',
    licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en',
    title: ['Lên miền cao,', 'đón một mùa khác.'],
    copy: 'Theo những con đường vùng cao, tìm một góc nhìn mới giữa các thửa ruộng bậc thang.',
  },
  {
    id: 124, name: 'Eo Gió', location: 'Eo Gió, Nhơn Lý', tag: 'Biển & đường ven núi',
    image: '/media/coverage-20261002/destination-124-128670721.jpg', position: '70% 50%',
    author: 'Hưng Hồ Bá', license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Eo_Gi%C3%B3_-_Nh%C6%A1n_L%C3%BD.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    title: ['Theo đường biển,', 'tìm một góc riêng.'],
    copy: 'Một buổi đi dạo bên biển, một bữa ăn địa phương. Chọn hành trình theo nhịp của bạn.',
  },
];

// Same verified public destinations, selected for a more varied editorial spread.
// These are discovery links, never promises about tickets or room availability.
export const homeDiscoveries = [
  homePlaces[0], homePlaces[1],
  {
    id: 112, name: 'Ninh Bình', location: 'Hang Múa, Ninh Bình', tag: 'Núi đá & dòng sông',
    image: '/media/coverage-20261002/destination-112-121361148.jpg', position: '50% 50%',
  },
  homePlaces[2],
  {
    id: 127, name: 'Mù Cang Chải', location: 'Ruộng bậc thang Chế Cu Nha, Mù Cang Chải', tag: 'Những mùa trên núi',
    image: '/media/coverage-20261002/destination-127-61895716.jpg', position: '50% 55%',
  },
];

export const homeServices = [
  {
    key: 'tours', route: '/tours', title: 'Tour du lịch',
    copy: 'Chọn hành trình vừa với thời gian của bạn. Lịch trình và ngày khởi hành đều ở đây.',
    action: 'Xem tour', photo: homePlaces[0], caption: 'Vịnh Hạ Long · Ảnh giới thiệu điểm đến',
  },
  {
    key: 'hotels', route: '/hotels', title: 'Khách sạn & phòng',
    copy: 'Một nơi nghỉ vừa ý, để chuyến đi thoải mái hơn.', action: 'Tìm phòng',
    photo: { image: '/media/catalog-20261001/continental-182311159.jpg', location: 'Mặt tiền Hotel Continental Saigon', position: '50% 55%' },
    caption: 'Hotel Continental Saigon · Ảnh mặt tiền',
  },
  {
    key: 'restaurants', route: '/restaurants', title: 'Nhà hàng',
    copy: 'Dành một bữa cho hương vị địa phương. Tìm địa chỉ ăn uống dọc hành trình.', action: 'Xem nhà hàng',
    photo: { image: '/media/home-editorial-20261008/bun-cha-hanoi.jpg', location: 'Bún chả Hà Nội với bún, rau và món ăn kèm', position: '50% 50%' },
    caption: 'Bún chả Hà Nội · Ảnh minh họa ẩm thực',
  },
  {
    key: 'planner', route: '/planner', title: 'Lịch trình riêng',
    copy: 'Chọn điểm dừng, xếp từng ngày và xem dự toán. Đăng nhập để lưu chuyến đi của bạn.', action: 'Lên kế hoạch chuyến đi',
    photo: homeDiscoveries[2], caption: 'Cảnh nhìn từ Hang Múa · Ninh Bình',
  },
];

export const homeClosingPhoto = {
  image: '/media/library/ninh-binh-145501694.jpg',
  location: 'Thuyền trên sông giữa núi đá ở Tràng An, Ninh Bình', position: '50% 55%',
};

// This editorial photograph is not attached to a named restaurant in SQL.
// Match the local source sidecar; preserve explicit provenance on the credits page.
export const homeEditorialImages = [{
  maHinhAnh: -1, loaiDoiTuong: 'Editorial', maDoiTuong: 0, thuTu: 0, duongDan: '/media/home-editorial-20261008/bun-cha-hanoi.jpg',
  moTa: 'Bún chả Hà Nội — ảnh minh họa ẩm thực, không gắn với một nhà hàng cụ thể.',
  tacGia: 'Weetjesman', nguon: 'https://commons.wikimedia.org/wiki/File:Bun_cha_Hanoi.jpg',
  giayPhep: 'CC BY-SA 4.0', urlGiayPhep: 'https://creativecommons.org/licenses/by-sa/4.0/',
}];
