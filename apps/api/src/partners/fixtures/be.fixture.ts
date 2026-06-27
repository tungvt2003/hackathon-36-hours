// Fixture mô phỏng hình dạng raw response của Be API
// Team tích hợp Be: điền đúng cấu trúc response thật vào đây
// Sau đó chỉ cần sửa BeAdapter.mapToQuote() để parse đúng fields

export interface BeRawQuote {
  data: {
    price: number; // VND
    priceLabel: string; // vd: "72.000 đ"
    pickup_eta_sec: number; // giây đến điểm đón
    service_name: string; // vd: "beCar", "beBike"
    is_available: boolean;
  };
  driver_info: {
    full_name: string;
    star: number;
    plate_number: string;
  } | null;
}

export interface BeRawConfirm {
  trip_id: string;
  state: string;
  driver_name: string;
  plate: string;
}

// Dữ liệu mẫu — team thay bằng gọi API thật
export const BE_MOCK_QUOTE: BeRawQuote = {
  data: {
    price: 72000,
    priceLabel: '72.000 đ',
    pickup_eta_sec: 240,
    service_name: 'beCar',
    is_available: true,
  },
  driver_info: {
    full_name: 'Trần Minh',
    star: 4.9,
    plate_number: '51B-67890',
  },
};

export const BE_MOCK_CONFIRM: BeRawConfirm = {
  trip_id: 'BE-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  state: 'ACCEPTED',
  driver_name: 'Trần Minh',
  plate: '51B-67890',
};
