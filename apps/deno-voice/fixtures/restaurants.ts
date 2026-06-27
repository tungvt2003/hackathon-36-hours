import type { RestaurantCandidate, MenuData } from "../types.ts";

export interface RestaurantFixture {
  restaurant_id: string;
  name: string;
  keywords: string[];
  dish_keywords: string[];
  rating: number;
  eta_min: number;
  min_order: number;
  menu: MenuData;
}

export const RESTAURANTS: RestaurantFixture[] = [
  {
    restaurant_id: "r_991",
    name: "Cơm tấm Ba Ghiền",
    keywords: ["ba ghiền", "ba ghien"],
    dish_keywords: ["cơm tấm", "cơm", "com tam"],
    rating: 4.5,
    eta_min: 20,
    min_order: 50000,
    menu: {
      restaurant_id: "r_991",
      categories: [
        {
          name: "Cơm",
          items: [
            { item_id: "i_12", name: "cơm sườn", price: 45000, popular: true },
            { item_id: "i_13", name: "cơm sườn bì chả", price: 60000, popular: true },
            { item_id: "i_14", name: "cơm sườn ốp la", price: 55000 },
            { item_id: "i_15", name: "cơm bì chả", price: 40000 },
          ],
        },
        {
          name: "Nước",
          items: [
            { item_id: "i_55", name: "nước sâm", price: 12000 },
            { item_id: "i_56", name: "trà đá", price: 5000 },
          ],
        },
      ],
    },
  },
  {
    restaurant_id: "r_102",
    name: "Phở Hòa Pasteur",
    keywords: ["phở hòa", "pho hoa"],
    dish_keywords: ["phở", "pho"],
    rating: 4.3,
    eta_min: 25,
    min_order: 40000,
    menu: {
      restaurant_id: "r_102",
      categories: [
        {
          name: "Phở",
          items: [
            { item_id: "i_201", name: "phở tái", price: 55000, popular: true },
            { item_id: "i_202", name: "phở tái nạm", price: 60000, popular: true },
            { item_id: "i_203", name: "phở bò viên", price: 50000 },
          ],
        },
        {
          name: "Nước",
          items: [
            { item_id: "i_210", name: "nước ngọt", price: 15000 },
            { item_id: "i_211", name: "trà đá", price: 5000 },
          ],
        },
      ],
    },
  },
  {
    restaurant_id: "r_303",
    name: "Bún bò Huế Đông Ba",
    keywords: ["đông ba", "dong ba"],
    dish_keywords: ["bún bò", "bun bo", "bún bò huế"],
    rating: 4.1,
    eta_min: 30,
    min_order: 35000,
    menu: {
      restaurant_id: "r_303",
      categories: [
        {
          name: "Bún",
          items: [
            { item_id: "i_301", name: "bún bò đặc biệt", price: 55000, popular: true },
            { item_id: "i_302", name: "bún bò giò heo", price: 60000 },
            { item_id: "i_303", name: "bún bò thường", price: 40000 },
          ],
        },
        {
          name: "Thêm",
          items: [
            { item_id: "i_310", name: "chả cua", price: 15000 },
            { item_id: "i_311", name: "trứng cút", price: 10000 },
          ],
        },
      ],
    },
  },
  {
    restaurant_id: "r_404",
    name: "Trà sữa Phúc Long",
    keywords: ["phúc long", "phuc long"],
    dish_keywords: ["trà sữa", "tra sua", "trà", "coffee", "cà phê"],
    rating: 4.2,
    eta_min: 15,
    min_order: 20000,
    menu: {
      restaurant_id: "r_404",
      categories: [
        {
          name: "Trà sữa",
          items: [
            { item_id: "i_401", name: "trà sữa truyền thống", price: 45000, popular: true },
            { item_id: "i_402", name: "trà sữa matcha", price: 50000 },
            { item_id: "i_403", name: "trà đào cam sả", price: 55000, popular: true },
          ],
        },
        {
          name: "Cà phê",
          items: [
            { item_id: "i_410", name: "cà phê sữa đá", price: 35000 },
            { item_id: "i_411", name: "bạc xỉu", price: 35000 },
          ],
        },
      ],
    },
  },
];

export function searchRestaurants(
  dishQuery: string | null,
  restaurantQuery: string | null,
  maxResults = 5,
): RestaurantCandidate[] {
  let matched = RESTAURANTS;

  if (restaurantQuery) {
    const q = restaurantQuery.toLowerCase();
    matched = matched.filter(
      (r) =>
        r.keywords.some((k) => q.includes(k)) ||
        r.name.toLowerCase().includes(q),
    );
  }

  if (dishQuery) {
    const q = dishQuery.toLowerCase();
    matched = matched.filter(
      (r) =>
        r.dish_keywords.some((k) => q.includes(k)) ||
        r.menu.categories.some((c) =>
          c.items.some((i) => i.name.toLowerCase().includes(q))
        ),
    );
  }

  if (matched.length === 0 && (dishQuery || restaurantQuery)) {
    matched = RESTAURANTS;
  }

  return matched
    .map((r) => ({
      restaurant_id: r.restaurant_id,
      name: r.name,
      rating: r.rating,
      eta_min: r.eta_min,
      min_order: r.min_order,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, maxResults);
}

export function getMenu(restaurantId: string): MenuData | null {
  const r = RESTAURANTS.find((r) => r.restaurant_id === restaurantId);
  return r ? r.menu : null;
}

export function getRestaurantName(restaurantId: string): string {
  return RESTAURANTS.find((r) => r.restaurant_id === restaurantId)?.name ?? "Quán";
}
