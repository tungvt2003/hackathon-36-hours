// Fixture mô phỏng hình dạng raw response của Grab API
// Team tích hợp Grab: điền đúng cấu trúc response thật vào đây
// Sau đó chỉ cần sửa GrabAdapter.mapToQuote() để parse đúng fields

export interface GrabRawQuote {
  estimatedFare: {
    currency: string;
    value: number; // VND, vd: 85000
    displayAmount: string; // vd: "85.000đ"
  };
  eta: {
    pickUpEta: number; // giây
    dropOffEta: number; // giây
  };
  driver: {
    name: string;
    rating: number;
    vehicleType: string;
  } | null;
  serviceType: string; // vd: "GrabCar", "GrabBike"
  available: boolean;
}

export interface GrabRawConfirm {
  bookingCode: string;
  status: string;
  driverName: string;
  vehiclePlate: string;
  otp: string;
}

// Dữ liệu mẫu - team thay bằng gọi API thật
export const GRAB_MOCK_QUOTE: GrabRawQuote = {
  estimatedFare: { currency: 'VND', value: 85000, displayAmount: '85.000đ' },
  eta: { pickUpEta: 180, dropOffEta: 900 },
  driver: { name: 'Nguyễn Tài', rating: 4.8, vehicleType: 'GrabCar' },
  serviceType: 'GrabCar',
  available: true,
};

export const GRAB_MOCK_CONFIRM: GrabRawConfirm = {
  bookingCode: 'GRB-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  status: 'DRIVER_ACCEPTED',
  driverName: 'Nguyễn Tài',
  vehiclePlate: '51A-12345',
  otp: '5678',
};
