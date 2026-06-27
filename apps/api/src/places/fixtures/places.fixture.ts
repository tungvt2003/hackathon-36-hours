// Fixture địa điểm mẫu — team điền thêm data thật vào đây
// Sau khi có Google Places API key: thay MockPlacesProvider bằng GooglePlacesProvider
// giữ nguyên interface, chỉ cần mapper từ Google response sang PlaceStatus

export interface PlaceFixture {
  name: string;
  address: string;
  /** Giờ mở cửa (0-23) */
  openHour: number;
  /** Giờ đóng cửa (0-23) */
  closeHour: number;
  keywords: string[]; // từ khoá để match với intent
}

export const PLACE_FIXTURES: PlaceFixture[] = [
  {
    name: 'Sân bay Tân Sơn Nhất',
    address: '60 Trường Sơn, Tân Bình, TP.HCM',
    openHour: 0,
    closeHour: 24,
    keywords: ['tân sơn nhất', 'sân bay', 'tsn', 'airport'],
  },
  {
    name: 'Bến xe Miền Đông',
    address: '292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM',
    openHour: 5,
    closeHour: 22,
    keywords: ['bến xe miền đông', 'miền đông', 'bến xe'],
  },
  {
    name: 'Quán Phở Hà Nội',
    address: '25 Nguyễn Trãi, Quận 1, TP.HCM',
    openHour: 6,
    closeHour: 22,
    keywords: ['phở hà nội', 'phở', 'quán phở'],
  },
  {
    name: 'Cơm Tấm Thuận Kiều',
    address: '12 Lê Thánh Tôn, Quận 1, TP.HCM',
    openHour: 7,
    closeHour: 21,
    keywords: ['thuận kiều', 'cơm tấm', 'cơm tấm thuận kiều'],
  },
  {
    name: 'Bún Bò Huế Bà Mỹ',
    address: '34 Bùi Viện, Quận 1, TP.HCM',
    openHour: 6,
    closeHour: 20,
    keywords: ['bà mỹ', 'bún bò', 'bún bò huế'],
  },
  // TODO: team thêm địa điểm thật vào đây
];
