import type {
  APIResponse,
  BookRideData,
  FareEstimateData,
  MenuData,
  PlaceCandidate,
  PlaceOrderData,
  PlaceStatusData,
  PriceQuoteData,
  RestaurantCandidate,
  VoucherEntry,
} from "../types.ts";
import { searchPlaces, getPlaceStatus, getPlaceDistance } from "../fixtures/places.ts";
import { searchRestaurants, getMenu, getRestaurantName } from "../fixtures/restaurants.ts";
import { getEligibleVouchers, validateVoucher } from "../fixtures/vouchers.ts";

function ok<T>(data: T): APIResponse<T> {
  return { ok: true, data, error: null };
}

function err<T>(code: string, message: string): APIResponse<T> {
  return { ok: false, data: null, error: { code, message } };
}

// §7.1 PlaceSearch
export function placeSearch(
  query: string,
  userLat: number,
  userLng: number,
  maxResults = 5,
): APIResponse<{ candidates: PlaceCandidate[] }> {
  const candidates = searchPlaces(query, userLat, userLng, maxResults);
  return ok({ candidates });
}

// §7.2 StatusCheck
export function statusCheck(
  placeId: string,
): APIResponse<PlaceStatusData> {
  const status = getPlaceStatus(placeId);
  if (!status) return err("PLACE_NOT_FOUND", "Không tìm thấy địa điểm");
  return ok(status);
}

// §7.3 FareEstimate
const VEHICLE_TYPES = [
  { type: "BIKE", label: "Xe máy", base: 12000, per_km: 4500, eta_base: 3 },
  { type: "CAR_4", label: "Xe 4 chỗ", base: 25000, per_km: 8500, eta_base: 5 },
  { type: "CAR_7", label: "Xe 7 chỗ", base: 35000, per_km: 11000, eta_base: 7 },
];

export function fareEstimate(
  placeId: string,
  userLat: number,
  userLng: number,
): APIResponse<FareEstimateData> {
  const distanceM = getPlaceDistance(placeId, userLat, userLng);
  const km = Math.max(distanceM / 1000, 0.5);
  const estimates = VEHICLE_TYPES.map((v) => ({
    vehicle_type: v.type,
    label: v.label,
    price: Math.round((v.base + km * v.per_km) / 1000) * 1000,
    eta_min: v.eta_base + Math.round(km),
  }));
  return ok({ place_id: placeId, distance_m: distanceM, estimates });
}

// §7.10 BookRide
const MOCK_DRIVERS = [
  { name: "Nguyễn Văn An", phone: "0901234567", plate: "59A1-12345" },
  { name: "Trần Thị Bích", phone: "0912345678", plate: "51F-67890" },
  { name: "Lê Hoàng Nam", phone: "0923456789", plate: "59C2-34567" },
];
let bookingCounter = 100;

export function bookRide(
  placeId: string,
  vehicleType: string,
  userLat: number,
  userLng: number,
  _idempotencyKey: string,
): APIResponse<BookRideData> {
  const distanceM = getPlaceDistance(placeId, userLat, userLng);
  const km = Math.max(distanceM / 1000, 0.5);
  const vt = VEHICLE_TYPES.find((v) => v.type === vehicleType) ?? VEHICLE_TYPES[0];
  const price = Math.round((vt.base + km * vt.per_km) / 1000) * 1000;
  const driver = MOCK_DRIVERS[bookingCounter % MOCK_DRIVERS.length];
  const bookingId = `BK${++bookingCounter}`;
  return ok({
    booking_id: bookingId,
    vehicle_type: vt.type,
    vehicle_label: vt.label,
    price,
    driver_name: driver.name,
    driver_phone: driver.phone,
    license_plate: driver.plate,
    eta_min: vt.eta_base,
    status: "confirmed",
  });
}

// §7.4 RestaurantSearch
export function restaurantSearch(
  dishQuery: string | null,
  restaurantQuery: string | null,
  maxResults = 5,
): APIResponse<{ restaurants: RestaurantCandidate[] }> {
  const restaurants = searchRestaurants(dishQuery, restaurantQuery, maxResults);
  return ok({ restaurants });
}

// §7.5 MenuFetch
export function menuFetch(
  restaurantId: string,
): APIResponse<MenuData> {
  const menu = getMenu(restaurantId);
  if (!menu) return err("RESTAURANT_NOT_FOUND", "Không tìm thấy quán");
  return ok(menu);
}

// §7.6 PriceQuote
export function priceQuote(
  restaurantId: string,
  items: { item_id: string; qty: number }[],
  voucherCode: string | null,
): APIResponse<PriceQuoteData> {
  const menu = getMenu(restaurantId);
  if (!menu) return err("RESTAURANT_NOT_FOUND", "Không tìm thấy quán");

  let subtotal = 0;
  for (const ci of items) {
    const menuItem = menu.categories
      .flatMap((c) => c.items)
      .find((i) => i.item_id === ci.item_id);
    if (menuItem) subtotal += menuItem.price * ci.qty;
  }

  const shippingFee = 15000;
  let discount = 0;

  if (voucherCode) {
    const v = validateVoucher(voucherCode, restaurantId, subtotal);
    if (v.eligible) discount = v.discount;
  }

  return ok({
    subtotal,
    shipping_fee: shippingFee,
    discount,
    total: subtotal + shippingFee - discount,
    currency: "VND",
  });
}

// §7.7 VoucherList
export function voucherList(
  restaurantId: string,
  subtotal: number,
): APIResponse<{ vouchers: VoucherEntry[] }> {
  const vouchers = getEligibleVouchers(restaurantId, subtotal);
  return ok({ vouchers });
}

// §7.8 VoucherValidate
export function voucherValidate(
  code: string,
  restaurantId: string,
  subtotal: number,
): APIResponse<{ eligible: boolean; discount: number; reason: string | null }> {
  return ok(validateVoucher(code, restaurantId, subtotal));
}

// §7.9 PlaceOrder
let orderCounter = 4800;
export function placeOrder(
  restaurantId: string,
  items: { item_id: string; qty: number }[],
  voucherCode: string | null,
  _paymentMethod: string,
  idempotencyKey: string,
): APIResponse<PlaceOrderData> {
  const quote = priceQuote(restaurantId, items, voucherCode);
  if (!quote.ok || !quote.data) return err("QUOTE_FAILED", "Không tính được giá");

  const orderId = String(++orderCounter);
  const restName = getRestaurantName(restaurantId);
  return ok({
    order_id: orderId,
    total_charged: quote.data.total,
    eta_min: 25,
    status: "confirmed",
  });
}
