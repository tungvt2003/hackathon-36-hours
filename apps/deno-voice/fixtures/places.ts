import type { PlaceCandidate, PlaceStatusData } from "../types.ts";

export interface PlaceFixture {
  place_id: string;
  name: string;
  address: string;
  keywords: string[];
  lat: number;
  lng: number;
  open_hour: number;
  close_hour: number;
}

export const PLACES: PlaceFixture[] = [
  {
    place_id: "p_fahasa_nh",
    name: "Nhà sách Fahasa Nguyễn Huệ",
    address: "40 Nguyễn Huệ, Quận 1",
    keywords: ["fahasa", "nhà sách", "sách"],
    lat: 10.7737,
    lng: 106.7030,
    open_hour: 0,
    close_hour: 24,
  },
  {
    place_id: "p_fahasa_nvc",
    name: "Nhà sách Fahasa Nguyễn Văn Cừ",
    address: "60-62 Nguyễn Văn Cừ, Quận 5",
    keywords: ["fahasa", "nhà sách"],
    lat: 10.7590,
    lng: 106.6830,
    open_hour: 0,
    close_hour: 24,
  },
  {
    place_id: "p_vincom_dk",
    name: "Vincom Center Đồng Khởi",
    address: "72 Lê Thánh Tôn, Quận 1",
    keywords: ["vincom", "đồng khởi"],
    lat: 10.7780,
    lng: 106.7010,
    open_hour: 9,
    close_hour: 22,
  },
  {
    place_id: "p_bv_cho_ray",
    name: "Bệnh viện Chợ Rẫy",
    address: "201B Nguyễn Chí Thanh, Quận 5",
    keywords: ["chợ rẫy", "bệnh viện"],
    lat: 10.7550,
    lng: 106.6600,
    open_hour: 0,
    close_hour: 24,
  },
  {
    place_id: "p_tsn",
    name: "Sân bay Tân Sơn Nhất",
    address: "Trường Sơn, Tân Bình",
    keywords: ["sân bay", "tân sơn nhất", "tan son nhat"],
    lat: 10.8188,
    lng: 106.6520,
    open_hour: 0,
    close_hour: 24,
  },
  {
    place_id: "p_buu_dien",
    name: "Bưu điện Trung tâm Sài Gòn",
    address: "2 Công xã Paris, Quận 1",
    keywords: ["bưu điện", "buu dien"],
    lat: 10.7798,
    lng: 106.6990,
    open_hour: 7,
    close_hour: 19,
  },
];

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function searchPlaces(
  query: string,
  userLat: number,
  userLng: number,
  maxResults = 5,
): PlaceCandidate[] {
  const q = query.toLowerCase();
  const matched = PLACES.filter((p) =>
    p.keywords.some((k) => q.includes(k)) ||
    p.name.toLowerCase().includes(q)
  );

  return matched
    .map((p) => {
      const distKm = haversineKm(userLat, userLng, p.lat, p.lng);
      const distM = Math.round(distKm * 1000);
      const etaMin = Math.max(1, Math.round(distKm / 5 * 60)); // ~5 km/h walking
      return {
        place_id: p.place_id,
        name: p.name,
        address: p.address,
        distance_m: distM,
        eta_min: etaMin,
      };
    })
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, maxResults);
}

export function getPlaceDistance(placeId: string, userLat: number, userLng: number): number {
  const place = PLACES.find((p) => p.place_id === placeId);
  if (!place) return 1000;
  return Math.round(haversineKm(userLat, userLng, place.lat, place.lng) * 1000);
}

export function getPlaceStatus(placeId: string): PlaceStatusData | null {
  const place = PLACES.find((p) => p.place_id === placeId);
  if (!place) return null;

  const hour = new Date().getHours();
  const isOpen = hour >= place.open_hour && hour < place.close_hour;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(place.open_hour, 0, 0, 0);

  return {
    state: isOpen ? "available" : "closed",
    opening_hours: {
      open: `${String(place.open_hour).padStart(2, "0")}:00`,
      close: `${String(place.close_hour).padStart(2, "0")}:00`,
      is_open_now: isOpen,
    },
    next_open: tomorrow.toISOString(),
    weather: null, // mock: no weather warnings by default
  };
}
