// Fixture mô phỏng hình dạng raw response của Xanh SM API
// Team tích hợp Xanh SM: điền đúng cấu trúc response thật vào đây
// Sau đó chỉ cần sửa XanhSmAdapter.mapToQuote() để parse đúng fields

export interface XanhSmRawQuote {
  quote: {
    amount: number; // VND
    formatted: string; // vd: "68,000 VND"
    currency: 'VND';
    distance_km: number;
    eta_minutes: number;
  };
  driver: {
    name: string;
    score: number;
    car: string; // vd: "VinFast VF e34"
  } | null;
  available: boolean;
  car_type: string; // vd: "XanhSM Car"
}

export interface XanhSmRawConfirm {
  order_id: string;
  status: 'MATCHED';
  driver_name: string;
  car_number: string;
  pickup_code: string;
}

// Dữ liệu mẫu — team thay bằng gọi API thật
export const XANH_SM_MOCK_QUOTE: XanhSmRawQuote = {
  quote: {
    amount: 68000,
    formatted: '68,000 VND',
    currency: 'VND',
    distance_km: 12.5,
    eta_minutes: 5,
  },
  driver: {
    name: 'Lê Hùng',
    score: 4.7,
    car: 'VinFast VF e34',
  },
  available: true,
  car_type: 'XanhSM Car',
};

export const XANH_SM_MOCK_CONFIRM: XanhSmRawConfirm = {
  order_id: 'XSM-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  status: 'MATCHED',
  driver_name: 'Lê Hùng',
  car_number: '51C-11223',
  pickup_code: '9012',
};
