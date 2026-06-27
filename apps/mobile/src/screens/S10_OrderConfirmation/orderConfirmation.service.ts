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
        ? 'Tan Son Nhat Airport'
        : orderId.includes('place-ben-thanh')
          ? 'Ben Thanh Market'
          : orderId.includes('place-bitexco')
            ? 'Bitexco Financial Tower'
            : orderId.includes('place-ben-xe-md')
              ? 'Mien Dong Bus Station'
              : orderId.includes('place-quan-1')
                ? 'District 1'
                : 'Your destination';
      return {
        orderId,
        partner: PartnerCode.GRAB,
        restaurantName: destination,
        restaurantRating: 4.9,
        items: [{ name: `GrabCar to ${destination}`, qty: 1, price: 120000 }],
        deliveryFee: 0,
        total: 120000,
        address: '123 Le Loi, District 1, Ho Chi Minh City',
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
      address: '123 Le Loi, District 1, Ho Chi Minh City',
      paymentMethod: 'GrabPay',
      etaMin: 25,
      etaMax: 35,
      partnerLabel: 'Grab',
    };
  },
};
