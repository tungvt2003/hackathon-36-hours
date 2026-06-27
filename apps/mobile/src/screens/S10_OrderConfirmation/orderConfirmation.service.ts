import { PartnerCode } from '../../types';

export interface MockOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface MockOrder {
  orderId: string;
  partner: PartnerCode;
  restaurantName: string;
  restaurantRating: number;
  items: MockOrderItem[];
  deliveryFee: number;
  total: number;
  address: string;
  paymentMethod: string;
  etaMin: number;
  etaMax: number;
  partnerLabel: string;
}

export const orderConfirmationService = {
  getMockOrder: (orderId: string): MockOrder => {
    if (orderId.includes('ride')) {
      const destination = orderId.includes('place-tsn')
        ? 'Sân bay Tân Sơn Nhất'
        : orderId.includes('place-ben-thanh')
          ? 'Chợ Bến Thành'
          : orderId.includes('place-bitexco')
            ? 'Bitexco Financial Tower'
            : orderId.includes('place-ben-xe-md')
              ? 'Bến xe Miền Đông'
              : orderId.includes('place-quan-1')
                ? 'Quận 1'
                : 'Điểm đến của bạn';
      return {
        orderId,
        partner: PartnerCode.GRAB,
        restaurantName: destination,
        restaurantRating: 4.9,
        items: [{ name: `GrabCar đến ${destination}`, qty: 1, price: 120000 }],
        deliveryFee: 0,
        total: 120000,
        address: '123 Lê Lợi, Quận 1, Thành phố Hồ Chí Minh',
        paymentMethod: 'GrabPay',
        etaMin: 6,
        etaMax: 10,
        partnerLabel: 'Grab',
      };
    }
    return {
      orderId,
      partner: PartnerCode.GRAB,
      restaurantName: 'Phở Hà Nội',
      restaurantRating: 4.8,
      items: [{ name: 'Phở Bò Tái', qty: 1, price: 65000 }],
      deliveryFee: 15000,
      total: 80000,
      address: '123 Lê Lợi, Quận 1, Thành phố Hồ Chí Minh',
      paymentMethod: 'GrabPay',
      etaMin: 25,
      etaMax: 35,
      partnerLabel: 'Grab',
    };
  },
};
