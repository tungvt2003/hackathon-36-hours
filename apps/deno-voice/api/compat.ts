import { processGreeting, processTurn } from "../pipeline/orchestrator.ts";
import { getSession } from "../store/session.ts";
import type { SessionContext } from "../types.ts";

type ConversationState = "COLLECTING" | "ORDERING" | "DONE";
type PartnerCode = "GRAB" | "BE" | "XANH_SM" | "SHOPEE";
type OrderStatus =
  | "QUOTED"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

interface CompatOrder {
  orderId: string;
  partner: PartnerCode;
  createdAtMs: number;
  responseText: string;
  driverName?: string;
}

const orders = new Map<string, CompatOrder>();

export async function conversationStart(body: Record<string, unknown>) {
  const result = await processGreeting(
    undefined,
    readString(body.userId ?? body.user_id),
  );
  return {
    sessionId: result.session_id,
    promptText: result.nlg.plain_text,
  };
}

export async function conversationInput(body: Record<string, unknown>) {
  const sessionId = readString(body.sessionId ?? body.session_id);
  const transcript = readString(body.transcript);
  const audioBase64 = readString(body.audioBase64 ?? body.audio_base64);

  if (!sessionId) throw new Error("sessionId required");
  if (!transcript && !audioBase64) {
    throw new Error("transcript or audioBase64 required");
  }

  const result = await processTurn({
    session_id: sessionId,
    transcript,
    audio_base64: audioBase64,
    sample_rate: readNumber(body.sampleRate ?? body.sample_rate),
    user_id: readString(body.userId ?? body.user_id),
  });

  const session = getSession(result.session_id);
  if (!session) throw new Error(`Session ${result.session_id} not found`);

  return conversationResponse(session, result.nlg.plain_text);
}

export async function conversationConfirm(body: Record<string, unknown>) {
  const sessionId = readString(body.sessionId ?? body.session_id);
  const partner = readPartner(body.partner);
  if (!sessionId) throw new Error("sessionId required");

  const result = await processTurn({
    session_id: sessionId,
    transcript: "đúng",
  });

  const session = getSession(result.session_id);
  if (!session) throw new Error(`Session ${result.session_id} not found`);

  const order = rememberOrder(session, partner, result.nlg.plain_text);
  return {
    sessionId: result.session_id,
    state: "DONE",
    promptText: result.nlg.plain_text,
    orderId: order.orderId,
  };
}

export function orderStatus(orderId: string) {
  const order = orders.get(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  const status = currentStatus(order.createdAtMs);
  const etaMinutes = status === "DELIVERED"
    ? 0
    : Math.max(1, 25 - Math.floor((Date.now() - order.createdAtMs) / 60000));
  return {
    orderId,
    status,
    partner: order.partner,
    responseText: statusText(status, order),
    etaMinutes,
    driverName: order.driverName,
  };
}

export function reviewOrder(orderId: string, body: Record<string, unknown>) {
  if (!orders.has(orderId)) throw new Error(`Order ${orderId} not found`);

  const restaurantRating = clampRating(readNumber(body.restaurantRating) ?? 5);
  const driverRating = clampRating(readNumber(body.driverRating) ?? 5);
  const earnedPoints = driverRating >= 4 ? 50 : 0;

  return {
    reviewId: crypto.randomUUID(),
    responseText:
      `Cảm ơn bạn đã đánh giá nhà hàng ${restaurantRating} sao và tài xế ${driverRating} sao.`,
    earnedPoints,
  };
}

function conversationResponse(session: SessionContext, promptText: string) {
  const state = conversationState(session);
  const response: {
    sessionId: string;
    state: ConversationState;
    missingField?: string;
    promptText: string;
    quotes?: ReturnType<typeof rideQuotes>;
    foodQuotes?: ReturnType<typeof foodQuotes>;
    orderId?: string;
  } = {
    sessionId: session.session_id,
    state,
    promptText,
  };

  if (state === "COLLECTING") {
    response.missingField = missingField(session);
  }

  const rides = rideQuotes(session);
  if (rides.length > 0) {
    response.quotes = rides;
    response.orderId = readString(session.slots_filled.last_order_id) ||
      session.active_booking?.booking_id;
  }

  const foods = foodQuotes(session);
  if (foods.length > 0) {
    response.foodQuotes = foods;
    response.orderId = readString(session.slots_filled.last_order_id);
  }

  return response;
}

function conversationState(session: SessionContext): ConversationState {
  if (
    session.current_state === "CONFIRM_BOOKING" ||
    session.current_state === "CONFIRM_ORDER"
  ) {
    return "ORDERING";
  }

  if (
    session.current_state === "BOOKING_PLACED" ||
    session.current_state === "ORDER_PLACED"
  ) {
    return "DONE";
  }

  return "COLLECTING";
}

function missingField(session: SessionContext): string | undefined {
  if (session.current_flow === "NAV") return "destination";
  if (session.current_flow === "FOOD") return "food_query";
  return undefined;
}

function rideQuotes(session: SessionContext) {
  const booking = session.active_booking;
  const price = readNumber(session.slots_filled.price) ?? booking?.price;
  if (session.current_state !== "CONFIRM_BOOKING" && !booking) return [];
  if (!price) return [];

  return [{
    partner: "GRAB" as PartnerCode,
    price,
    etaMinutes: booking?.eta_min ?? 10,
    driverName: booking?.driver_name,
    available: true,
  }];
}

function foodQuotes(session: SessionContext) {
  const cart = session.active_cart;
  if (session.current_state !== "CONFIRM_ORDER" || !cart) return [];

  return [{
    partner: "GRAB" as PartnerCode,
    subtotalVnd: cart.subtotal,
    deliveryFeeVnd: cart.shipping_fee,
    discountVnd: cart.voucher?.discount ?? 0,
    totalVnd: cart.total,
    etaMinutes: 25,
    available: true,
  }];
}

function rememberOrder(
  session: SessionContext,
  partner: PartnerCode,
  responseText: string,
): CompatOrder {
  const booking = session.active_booking;
  const orderId = readString(session.slots_filled.last_order_id) ||
    booking?.booking_id ||
    crypto.randomUUID();

  const order: CompatOrder = {
    orderId,
    partner,
    createdAtMs: Date.now(),
    responseText,
    driverName: booking?.driver_name ??
      readString(session.slots_filled.last_driver_name),
  };
  orders.set(orderId, order);
  return order;
}

function currentStatus(createdAtMs: number): OrderStatus {
  const elapsedMs = Date.now() - createdAtMs;
  if (elapsedMs >= 120_000) return "DELIVERED";
  if (elapsedMs >= 30_000) return "IN_TRANSIT";
  if (elapsedMs >= 5_000) return "DRIVER_ASSIGNED";
  return "CONFIRMED";
}

function statusText(status: OrderStatus, order: CompatOrder): string {
  switch (status) {
    case "CONFIRMED":
      return order.responseText;
    case "DRIVER_ASSIGNED":
      return order.driverName
        ? `Tài xế ${order.driverName} đã nhận đơn.`
        : "Tài xế đã nhận đơn.";
    case "IN_TRANSIT":
      return "Đơn hàng đang trên đường đến bạn.";
    case "DELIVERED":
      return "Đơn hàng đã giao xong. Bạn thấy thế nào?";
    case "CANCELLED":
      return "Đơn hàng đã bị hủy.";
    default:
      return order.responseText;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function readPartner(value: unknown): PartnerCode {
  return value === "BE" || value === "XANH_SM" || value === "SHOPEE"
    ? value
    : "GRAB";
}

function clampRating(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}
