export interface MockOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface MockOrder {
  orderId: string;
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
    return {
      orderId,
      restaurantName: 'Phở Hà Nội',
      restaurantRating: 4.8,
      items: [{ name: 'Phở Bò Tái', qty: 1, price: 65000 }],
      deliveryFee: 15000,
      total: 80000,
      address: '123 Lê Lợi, Q.1, TP.HCM',
      paymentMethod: 'GrabPay ••••',
      etaMin: 25,
      etaMax: 35,
      partnerLabel: 'Grab',
    };
  }
};
