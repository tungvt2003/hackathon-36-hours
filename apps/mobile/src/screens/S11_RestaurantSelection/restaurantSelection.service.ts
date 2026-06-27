export interface MockRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  distanceKm: number;
  etaMin: number;
  priceMin: number;
  priceMax: number;
  badge?: string;
}

export const restaurantSelectionService = {
  getMockRestaurants: (): MockRestaurant[] => {
    return [
      { 
        id: 'r1', 
        name: 'Phở Hà Nội', 
        cuisine: 'Phở · Bún', 
        rating: 4.8, 
        distanceKm: 1.2, 
        etaMin: 25, 
        priceMin: 50, 
        priceMax: 80, 
        badge: 'Phổ biến' 
      },
      { 
        id: 'r2', 
        name: 'Phở Thìn Bờ Hồ', 
        cuisine: 'Phở truyền thống', 
        rating: 4.6, 
        distanceKm: 2.1, 
        etaMin: 35, 
        priceMin: 40, 
        priceMax: 70 
      },
      { 
        id: 'r3', 
        name: 'Quán Phở 24', 
        cuisine: 'Phở · Cơm', 
        rating: 4.4, 
        distanceKm: 0.8, 
        etaMin: 20, 
        priceMin: 45, 
        priceMax: 75, 
        badge: 'Nhanh nhất' 
      },
    ];
  }
};
