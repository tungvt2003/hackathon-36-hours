import type {
  ActiveCart,
  DialogAction,
  DialogState,
  Flow,
  Intent,
  NLGRequest,
  NLUResult,
  OptionEntry,
  PendingConfirmation,
  SessionContext,
} from "../types.ts";
import * as api from "../api/mock_api.ts";

const MAX_OPTIONS_READ = 3;
const MAX_RETRY = 3;

export function processDialog(
  nlu: NLUResult,
  session: SessionContext,
): { action: DialogAction; session: SessionContext } {
  const s = structuredClone(session);
  s.turn_index++;
  s.updated_at = new Date().toISOString();

  // Handle global commands first
  if (nlu.is_global_command || isGlobal(nlu.intent)) {
    const result = handleGlobal(nlu, s);
    if (result) return result;
  }

  // Route to flow handler
  if (s.current_state === "IDLE" || s.current_state === "GREETING") {
    return handleGreetingOrIdle(nlu, s);
  }

  if (s.current_flow === "NAV") {
    return handleNav(nlu, s);
  }

  if (s.current_flow === "FOOD") {
    return handleFood(nlu, s);
  }

  return nudgeWithContext(s, s.current_state,
    "Mình không hiểu. Mình có thể giúp \"đặt xe\" hoặc \"đặt đồ ăn\". Bạn muốn làm gì?");
}

// ── Greeting / IDLE ─────────────────────────────────────────

function handleGreetingOrIdle(
  nlu: NLUResult,
  s: SessionContext,
): { action: DialogAction; session: SessionContext } {
  if (nlu.intent === "NAVIGATE") {
    s.current_flow = "NAV";
    s.current_state = "CAPTURE_DESTINATION";
    const dest = nlu.slots["destination_query"] as string | undefined;
    if (dest) {
      return captureDestination(dest, s);
    }
    return makeAction(s, "CAPTURE_DESTINATION", {
      template: "NUDGE",
      body: "Bạn muốn đi đâu? Nói tên nơi, ví dụ \"nhà sách\" hoặc \"sân bay\".",
      earcon_post: "turn_cue",
    });
  }

  if (nlu.intent === "ORDER_FOOD" || nlu.intent === "CHOOSE_BY_DISH" || nlu.intent === "CHOOSE_BY_RESTAURANT") {
    s.current_flow = "FOOD";
    s.current_state = "CHOOSE_ENTRY";
    return handleFoodEntry(nlu, s);
  }

  if (nlu.intent === "SELECT_OPTION") {
    const idx = nlu.slots["option_index"] as number | undefined;
    const opt = s.last_offered_options.find((o) => o.index === idx);
    if (opt?.ref_id === "nav") {
      s.current_flow = "NAV";
      s.current_state = "CAPTURE_DESTINATION";
      return makeAction(s, "CAPTURE_DESTINATION", {
        template: "NUDGE",
        body: "Bạn muốn đi đâu? Nói tên nơi, ví dụ \"nhà sách\" hoặc \"sân bay\".",
        earcon_post: "turn_cue",
      });
    }
    if (opt?.ref_id === "food") {
      s.current_flow = "FOOD";
      s.current_state = "CHOOSE_ENTRY";
      return handleFoodEntry(nlu, s);
    }
  }

  if (nlu.intent === "REQUEST_SUGGESTIONS") {
    // Ambiguous — ask which flow
    return makeAction(s, "GREETING", {
      template: "OFFER_OPTIONS",
      status_line: "Bạn muốn làm gì?",
      options: [
        { index: 1, label: "đặt đồ ăn", detail: "tìm quán và gọi món" },
        { index: 2, label: "đặt xe", detail: "đi bộ tới một nơi" },
      ],
      earcon_post: "turn_cue",
    }, [
      { index: 1, ref_type: "GENERIC", ref_id: "food", label: "đặt đồ ăn" },
      { index: 2, ref_type: "GENERIC", ref_id: "nav", label: "đặt xe" },
    ]);
  }

  return fallback(s, "Mình chưa nghe rõ. Bạn có thể nói chi tiết hơn không? Mình có thể giúp bạn đặt xe hoặc đặt đồ ăn.");
}

// ── NAV flow ────────────────────────────────────────────────

function handleNav(
  nlu: NLUResult,
  s: SessionContext,
): { action: DialogAction; session: SessionContext } {
  switch (s.current_state as string) {
    case "CAPTURE_DESTINATION": {
      if (nlu.intent === "NAVIGATE" || nlu.intent === "SELECT_OPTION") {
        const dest = (nlu.slots["destination_query"] ?? nlu.slots["option_name"]) as string | undefined;
        if (dest) return captureDestination(dest, s);
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa nghe rõ. Quay lại đầu nhé.");
      return nudgeWithContext(s, "CAPTURE_DESTINATION",
        "Bạn đang ở bước chọn điểm đến. Nói tên nơi muốn tới, ví dụ \"nhà sách\" hoặc \"sân bay\". Hoặc nói \"gợi ý\".");
    }

    case "DISAMBIGUATE": {
      if (nlu.intent === "SELECT_OPTION" && nlu.slots["option_index"]) {
        const idx = nlu.slots["option_index"] as number;
        const opt = s.last_offered_options.find((o) => o.index === idx);
        if (opt) {
          return confirmDestinationSimple(s, opt.ref_id, opt.label);
        }
      }
      if (nlu.intent === "NAVIGATE") {
        const dest = nlu.slots["destination_query"] as string | undefined;
        if (dest) return captureDestination(dest, s);
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa hiểu bạn muốn gì. Quay lại đầu nhé. Bạn muốn đặt xe hay đặt đồ ăn?");
      const optLabels = s.last_offered_options.map((o) => `${o.index}: ${o.label}`).join(", ");
      return nudgeWithContext(s, "DISAMBIGUATE",
        `Mình đang chờ bạn chọn nơi. ${optLabels}. Nói số hoặc tên nơi khác.`);
    }

    case "CONFIRM_DESTINATION": {
      if (nlu.intent === "CONFIRM_YES") {
        return showVehicleOptions(s);
      }
      if (nlu.intent === "CONFIRM_NO") {
        s.slots_filled = {};
        return makeAction(s, "CAPTURE_DESTINATION", {
          template: "NUDGE",
          body: "Vậy bạn muốn đi đâu? Nói tên nơi khác nhé.",
          earcon_post: "turn_cue",
        });
      }
      return makeAction(s, "CONFIRM_DESTINATION", {
        template: "NUDGE",
        body: "Nói \"đúng\" để xác nhận hoặc \"không\" để chọn nơi khác.",
        earcon_post: "turn_cue",
      });
    }

    case "SELECT_VEHICLE": {
      if (nlu.intent === "SELECT_OPTION") {
        const idx = nlu.slots["option_index"] as number | undefined;
        const optName = (nlu.slots["option_name"] as string | undefined)?.replace(/[.,!?]+$/, "").toLowerCase();
        let opt = idx ? s.last_offered_options.find((o) => o.index === idx) : undefined;
        if (!opt && optName) {
          opt = s.last_offered_options.find((o) => o.label.toLowerCase().includes(optName));
        }
        if (opt) {
          s.slots_filled["vehicle_type"] = opt.ref_id;
          s.slots_filled["vehicle_label"] = opt.label;
          return confirmBooking(s);
        }
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa hiểu. Quay lại đầu nhé.");
      const optLabels = s.last_offered_options.map((o) => `${o.index}: ${o.label}`).join(", ");
      return nudgeWithContext(s, "SELECT_VEHICLE",
        `Chọn loại xe: ${optLabels}. Nói số hoặc tên loại xe.`);
    }

    case "CONFIRM_BOOKING": {
      if (nlu.intent === "CONFIRM_YES") {
        return placeBookingAction(s);
      }
      if (nlu.intent === "CONFIRM_NO") {
        return resetToIdle(s, "Đã hủy đặt xe. Bạn cần gì nữa không?");
      }
      return makeAction(s, "CONFIRM_BOOKING", {
        template: "NUDGE",
        body: "Nói \"đúng\" để xác nhận đặt xe hoặc \"không\" để hủy.",
        earcon_post: "turn_cue",
      });
    }

    case "BOOKING_PLACED": {
      return resetToIdle(s, "Chuyến xe đã đặt xong. Bạn cần gì nữa không?");
    }

    default:
      return fallback(s, "Mình chưa nghe rõ. Bạn có thể nói chi tiết hơn không?");
  }
}

// NAV helpers

function captureDestination(query: string, s: SessionContext) {
  const resp = api.placeSearch(query, s.user_location.lat, s.user_location.lng);
  if (!resp.ok || !resp.data) return fallback(s, "Lỗi tìm kiếm. Thử lại nhé.");

  const candidates = resp.data.candidates;
  if (candidates.length === 0) {
    s.retry_count++;
    return makeAction(s, "CAPTURE_DESTINATION", {
      template: "INFORM",
      body: `Không tìm thấy "${query}". Nói lại tên nơi hoặc nói "gợi ý" để xem nơi gần đây.`,
      earcon_post: "turn_cue",
    });
  }

  if (candidates.length === 1) {
    const c = candidates[0];
    return confirmDestination(s, c.place_id, c.name, c.address, c.distance_m);
  }

  // Multiple results → disambiguate
  const options: OptionEntry[] = candidates.slice(0, MAX_OPTIONS_READ).map((c, i) => ({
    index: i + 1,
    ref_type: "PLACE" as const,
    ref_id: c.place_id,
    label: c.name,
  }));

  const nlgOptions = candidates.slice(0, MAX_OPTIONS_READ).map((c, i) => ({
    index: i + 1,
    label: c.name,
    detail: `${c.address}, ${Math.round(c.distance_m / 100) / 10} km`,
  }));

  return makeAction(s, "DISAMBIGUATE", {
    template: "DISAMBIGUATE",
    status_line: `Có ${candidates.length} nơi phù hợp`,
    options: nlgOptions,
    has_more_options: candidates.length > MAX_OPTIONS_READ,
    escape_hint: "hoặc nói tên cụ thể hơn",
    earcon_post: "turn_cue",
  }, options);
}

function confirmDestination(
  s: SessionContext,
  placeId: string,
  name: string,
  address?: string,
  distanceM?: number,
) {
  s.slots_filled["place_id"] = placeId;
  s.slots_filled["place_name"] = name;
  if (address) s.slots_filled["place_address"] = address;
  if (distanceM) s.slots_filled["distance_m"] = distanceM;
  const addr = address ?? s.slots_filled["place_address"] ?? "";
  const dist = distanceM ? `, cách ${Math.round(distanceM / 100) / 10} km` : "";
  const body = `${name}${addr ? ", " + addr : ""}${dist}. Đúng nơi bạn muốn tới chứ?`;

  s.pending_confirmation = {
    kind: "BOOK_RIDE",
    payload_ref: placeId,
    prompt_said: body,
  };

  return makeAction(s, "CONFIRM_DESTINATION", {
    template: "CONFIRM_EXPLICIT",
    body,
    confirm_question: "Đúng nơi chứ?",
    earcon_post: "turn_cue",
  });
}

function confirmDestinationSimple(s: SessionContext, placeId: string, name: string) {
  s.slots_filled["place_id"] = placeId;
  s.slots_filled["place_name"] = name;
  const body = `${name}. Đúng nơi bạn muốn tới chứ?`;
  s.pending_confirmation = {
    kind: "BOOK_RIDE",
    payload_ref: placeId,
    prompt_said: body,
  };
  return makeAction(s, "CONFIRM_DESTINATION", {
    template: "CONFIRM_EXPLICIT",
    body,
    confirm_question: "Đúng nơi chứ?",
    earcon_post: "turn_cue",
  });
}

function showVehicleOptions(s: SessionContext) {
  const placeId = s.slots_filled["place_id"] as string;
  const name = s.slots_filled["place_name"] as string ?? "điểm đến";

  const fareResp = api.fareEstimate(placeId, s.user_location.lat, s.user_location.lng);
  if (!fareResp.ok || !fareResp.data) return fallback(s, "Lỗi tính giá. Thử lại nhé.");

  const estimates = fareResp.data.estimates;
  s.pending_confirmation = null;

  const options: OptionEntry[] = estimates.map((e, i) => ({
    index: i + 1,
    ref_type: "GENERIC" as const,
    ref_id: e.vehicle_type,
    label: e.label,
  }));

  const nlgOptions = estimates.map((e, i) => ({
    index: i + 1,
    label: e.label,
    detail: `${formatVND(e.price)}, tài xế đến trong ${e.eta_min} phút`,
  }));

  return makeAction(s, "SELECT_VEHICLE", {
    template: "OFFER_OPTIONS",
    status_line: `Đặt xe tới ${name}`,
    body: `Chọn loại xe:`,
    options: nlgOptions,
    earcon_post: "turn_cue",
  }, options);
}

function confirmBooking(s: SessionContext) {
  const placeId = s.slots_filled["place_id"] as string;
  const name = s.slots_filled["place_name"] as string ?? "điểm đến";
  const vehicleLabel = s.slots_filled["vehicle_label"] as string;
  const vehicleType = s.slots_filled["vehicle_type"] as string;

  const fareResp = api.fareEstimate(placeId, s.user_location.lat, s.user_location.lng);
  const estimate = fareResp.data?.estimates.find((e) => e.vehicle_type === vehicleType);
  const price = estimate?.price ?? 0;
  const eta = estimate?.eta_min ?? 3;
  s.slots_filled["price"] = price;

  const body = `Đặt ${vehicleLabel} tới ${name}, giá ${formatVND(price)}, tài xế đến trong ${eta} phút. Xác nhận đặt xe chứ?`;

  s.pending_confirmation = {
    kind: "BOOK_RIDE",
    payload_ref: placeId,
    prompt_said: body,
  };

  return makeAction(s, "CONFIRM_BOOKING", {
    template: "CONFIRM_EXPLICIT",
    body,
    confirm_question: "Xác nhận đặt xe chứ?",
    earcon_post: "turn_cue",
  });
}

function placeBookingAction(s: SessionContext) {
  const placeId = s.slots_filled["place_id"] as string;
  const name = s.slots_filled["place_name"] as string ?? "điểm đến";
  const vehicleType = s.slots_filled["vehicle_type"] as string;

  const resp = api.bookRide(
    placeId,
    vehicleType,
    s.user_location.lat,
    s.user_location.lng,
    crypto.randomUUID(),
  );

  if (!resp.ok || !resp.data) return fallback(s, "Lỗi đặt xe. Thử lại nhé.");

  const booking = resp.data;
  s.active_booking = {
    booking_id: booking.booking_id,
    place_id: placeId,
    place_name: name,
    address: (s.slots_filled["place_address"] as string) ?? "",
    vehicle_type: booking.vehicle_type,
    vehicle_label: booking.vehicle_label,
    price: booking.price,
    driver_name: booking.driver_name,
    driver_phone: booking.driver_phone,
    license_plate: booking.license_plate,
    eta_min: booking.eta_min,
    status: booking.status,
  };
  s.pending_confirmation = null;

  return makeAction(s, "BOOKING_PLACED", {
    template: "INFORM",
    status_line: "Đặt xe thành công!",
    body: `Mã chuyến ${booking.booking_id}. ${booking.vehicle_label}, giá ${formatVND(booking.price)}. Tài xế ${booking.driver_name}, biển số ${booking.license_plate}, đến trong ${booking.eta_min} phút. Cần gì nữa không?`,
    earcon_post: "success",
  });
}

// ── FOOD flow ───────────────────────────────────────────────

function handleFoodEntry(
  nlu: NLUResult,
  s: SessionContext,
): { action: DialogAction; session: SessionContext } {
  const dishQuery = (nlu.slots["food_query"] as string) ?? null;
  const restQuery = (nlu.slots["restaurant_query"] as string) ?? null;

  if (dishQuery || restQuery || nlu.intent === "REQUEST_SUGGESTIONS") {
    return searchAndOfferRestaurants(s, dishQuery, restQuery);
  }

  // No specifics — ask what they want
  return makeAction(s, "CHOOSE_ENTRY", {
    template: "OFFER_OPTIONS",
    status_line: "Đặt đồ ăn",
    body: "Bạn muốn ăn gì? Có thể nói tên món, tên quán, hoặc nói \"gợi ý\".",
    options: [
      { index: 1, label: "nói tên món", detail: "ví dụ: cơm tấm, phở" },
      { index: 2, label: "nói tên quán", detail: "ví dụ: quán Ba Ghiền" },
      { index: 3, label: "gợi ý quán", detail: "xem quán phổ biến" },
    ],
    earcon_post: "turn_cue",
  }, [
    { index: 1, ref_type: "GENERIC", ref_id: "by_dish", label: "nói tên món" },
    { index: 2, ref_type: "GENERIC", ref_id: "by_restaurant", label: "nói tên quán" },
    { index: 3, ref_type: "GENERIC", ref_id: "suggestions", label: "gợi ý quán" },
  ]);
}

function handleFood(
  nlu: NLUResult,
  s: SessionContext,
): { action: DialogAction; session: SessionContext } {
  switch (s.current_state as string) {
    case "CHOOSE_ENTRY": {
      if (nlu.intent === "SELECT_OPTION") {
        const idx = nlu.slots["option_index"] as number;
        if (idx === 3) {
          return searchAndOfferRestaurants(s, null, null);
        }
        // For 1 or 2, nudge them to say dish or restaurant name
        return makeAction(s, "CHOOSE_ENTRY", {
          template: "NUDGE",
          body: idx === 1 ? "Nói tên món bạn muốn ăn nhé." : "Nói tên quán bạn muốn đặt nhé.",
          earcon_post: "turn_cue",
        });
      }
      if (nlu.intent === "CHOOSE_BY_DISH" || nlu.intent === "ORDER_FOOD") {
        const dish = (nlu.slots["food_query"] as string) ?? null;
        return searchAndOfferRestaurants(s, dish, null);
      }
      if (nlu.intent === "CHOOSE_BY_RESTAURANT") {
        const rest = (nlu.slots["restaurant_query"] as string) ?? null;
        return searchAndOfferRestaurants(s, null, rest);
      }
      if (nlu.intent === "REQUEST_SUGGESTIONS") {
        return searchAndOfferRestaurants(s, null, null);
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa hiểu. Quay lại đầu nhé.");
      return makeAction(s, "CHOOSE_ENTRY", {
        template: "NUDGE",
        body: "Nói tên món, tên quán, hoặc \"gợi ý\" nhé.",
        earcon_post: "turn_cue",
      });
    }

    case "SELECT_RESTAURANT": {
      if (nlu.intent === "SELECT_OPTION") {
        const idx = nlu.slots["option_index"] as number | undefined;
        const optName = (nlu.slots["option_name"] as string | undefined)?.replace(/[.,!?]+$/, "").toLowerCase();
        let opt = idx ? s.last_offered_options.find((o) => o.index === idx) : undefined;
        if (!opt && optName) {
          opt = s.last_offered_options.find((o) => o.label.toLowerCase().includes(optName));
        }
        if (opt) {
          s.slots_filled["restaurant_id"] = opt.ref_id;
          s.slots_filled["restaurant_name"] = opt.label;
          return showMenu(s, opt.ref_id);
        }
      }
      if (nlu.intent === "CHOOSE_BY_DISH" || nlu.intent === "ORDER_FOOD") {
        const dish = (nlu.slots["food_query"] as string) ?? null;
        if (dish) return searchAndOfferRestaurants(s, dish, null);
      }
      if (nlu.intent === "CHOOSE_BY_RESTAURANT") {
        const rest = (nlu.slots["restaurant_query"] as string) ?? null;
        if (rest) return searchAndOfferRestaurants(s, null, rest);
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa hiểu. Quay lại đầu nhé. Bạn muốn đặt xe hay đặt đồ ăn?");
      const optLabels = s.last_offered_options.map((o) => `${o.index}: ${o.label}`).join(", ");
      return nudgeWithContext(s, "SELECT_RESTAURANT",
        `Mình đang chờ bạn chọn quán. ${optLabels}. Nói số quán hoặc tên món/quán khác.`);
    }

    case "BROWSE_MENU": {
      if (nlu.intent === "SELECT_OPTION" || nlu.intent === "SELECT_ITEM") {
        const idx = nlu.slots["option_index"] as number | undefined;
        const itemQuery = (nlu.slots["item_query"] ?? nlu.slots["option_name"]) as string | undefined;

        let itemOpt: OptionEntry | undefined;
        if (idx) {
          itemOpt = s.last_offered_options.find((o) => o.index === idx);
        }
        if (!itemOpt && itemQuery) {
          const clean = itemQuery.replace(/[.,!?]+$/, "").toLowerCase();
          itemOpt = s.last_offered_options.find((o) =>
            o.label.toLowerCase().includes(clean) || clean.includes(o.label.toLowerCase())
          );
        }

        if (itemOpt) {
          s.slots_filled["item_id"] = itemOpt.ref_id;
          s.slots_filled["item_name"] = itemOpt.label;
          // Check if quantity was provided with the intent
          const qty = nlu.slots["quantity"] as number | undefined;
          if (qty) {
            return addToCart(s, itemOpt.ref_id, itemOpt.label, qty);
          }
          return makeAction(s, "SET_QUANTITY", {
            template: "NUDGE",
            body: `${itemOpt.label}. Bạn muốn mấy phần?`,
            earcon_post: "turn_cue",
          });
        }
      }
      if (nlu.intent === "CHECKOUT") {
        if (s.active_cart && s.active_cart.items.length > 0) {
          return goToVoucherOffer(s);
        }
        return makeAction(s, "BROWSE_MENU", {
          template: "INFORM",
          body: "Giỏ hàng trống. Chọn món trước nhé.",
          earcon_post: "turn_cue",
        });
      }
      s.retry_count++;
      if (s.retry_count >= MAX_RETRY) return resetToIdle(s, "Mình chưa hiểu. Quay lại đầu nhé. Bạn muốn đặt xe hay đặt đồ ăn?");
      const menuLabels = s.last_offered_options.map((o) => `${o.index}: ${o.label}`).join(", ");
      return nudgeWithContext(s, "BROWSE_MENU",
        `Bạn đang xem menu. ${menuLabels}. Nói số món hoặc tên món.`);
    }

    case "SET_QUANTITY": {
      if (nlu.intent === "SET_QUANTITY" || nlu.intent === "SELECT_OPTION" || nlu.intent === "CONFIRM_YES") {
        let qty = (nlu.slots["quantity"] ?? nlu.slots["option_index"]) as number | undefined;
        if (!qty || qty < 1) qty = 1;
        const itemId = s.slots_filled["item_id"] as string;
        const itemName = s.slots_filled["item_name"] as string;
        return addToCart(s, itemId, itemName, qty);
      }
      const itemName = s.slots_filled["item_name"] as string ?? "món";
      s.retry_count++;
      return nudgeWithContext(s, "SET_QUANTITY",
        `Bạn muốn mấy phần ${itemName}? Nói số lượng, ví dụ "hai" hoặc "một".`);
    }

    case "REVIEW_CART": {
      if (nlu.intent === "ADD_MORE_ITEM" || nlu.intent === "ORDER_FOOD" || nlu.intent === "CHOOSE_BY_DISH") {
        return showMenu(s, s.slots_filled["restaurant_id"] as string);
      }
      if (nlu.intent === "CHECKOUT" || nlu.intent === "CONFIRM_YES") {
        return goToVoucherOffer(s);
      }
      if (nlu.intent === "CONFIRM_NO") {
        return showMenu(s, s.slots_filled["restaurant_id"] as string);
      }
      const cartItems = s.active_cart?.items.map((i) => `${i.qty} ${i.name}`).join(", ") ?? "";
      s.retry_count++;
      return nudgeWithContext(s, "REVIEW_CART",
        `Giỏ hàng hiện tại: ${cartItems}. Bạn muốn "thêm món" hay "thanh toán"?`);
    }

    case "VOUCHER_OFFER": {
      if (nlu.intent === "APPLY_VOUCHER" || nlu.intent === "SELECT_OPTION") {
        const idx = (nlu.slots["voucher_index"] ?? nlu.slots["option_index"]) as number | undefined;
        if (idx) {
          const opt = s.last_offered_options.find((o) => o.index === idx);
          if (opt) {
            return confirmVoucher(s, opt.ref_id, opt.label);
          }
        }
        return makeAction(s, "VOUCHER_OFFER", {
          template: "NUDGE",
          body: "Chọn số voucher hoặc nói \"bỏ qua\".",
          earcon_post: "turn_cue",
        });
      }
      if (nlu.intent === "SKIP_VOUCHER" || nlu.intent === "CONFIRM_NO") {
        return goToPaymentSelect(s);
      }
      s.retry_count++;
      return makeAction(s, "VOUCHER_OFFER", {
        template: "NUDGE",
        body: "Chọn số voucher hoặc nói \"bỏ qua\".",
        earcon_post: "turn_cue",
      });
    }

    case "APPLY_VOUCHER_CONFIRM": {
      if (nlu.intent === "CONFIRM_YES") {
        const code = s.pending_confirmation?.payload_ref;
        if (code && s.active_cart) {
          const resp = api.voucherValidate(code, s.active_cart.restaurant_id, s.active_cart.subtotal);
          if (resp.ok && resp.data?.eligible) {
            s.active_cart.voucher = { code, discount: resp.data.discount };
            s.active_cart.total = s.active_cart.subtotal + s.active_cart.shipping_fee - resp.data.discount;
            s.pending_confirmation = null;
            return goToPaymentSelect(s);
          }
          s.pending_confirmation = null;
          return makeAction(s, "VOUCHER_OFFER", {
            template: "INFORM",
            body: `Voucher không áp dụng được: ${resp.data?.reason ?? "lỗi"}. Chọn voucher khác hoặc nói "bỏ qua".`,
            earcon_post: "turn_cue",
          });
        }
        return goToPaymentSelect(s);
      }
      if (nlu.intent === "CONFIRM_NO") {
        s.pending_confirmation = null;
        return goToPaymentSelect(s);
      }
      return makeAction(s, "APPLY_VOUCHER_CONFIRM", {
        template: "NUDGE",
        body: "Nói \"đúng\" để áp voucher hoặc \"không\" để bỏ qua.",
        earcon_post: "turn_cue",
      });
    }

    case "SELECT_PAYMENT": {
      if (nlu.intent === "SELECT_PAYMENT" || nlu.intent === "SELECT_OPTION") {
        const method = nlu.slots["payment_method"] as string | undefined;
        const idx = nlu.slots["option_index"] as number | undefined;
        let pm = method;
        if (!pm && idx) {
          pm = idx === 1 ? "WALLET" : "CASH";
        }
        if (pm) {
          s.slots_filled["payment_method"] = pm;
          return confirmOrder(s);
        }
      }
      s.retry_count++;
      return makeAction(s, "SELECT_PAYMENT", {
        template: "NUDGE",
        body: "Chọn \"ví\" hoặc \"tiền mặt\".",
        earcon_post: "turn_cue",
      });
    }

    case "CONFIRM_ORDER": {
      if (nlu.intent === "CONFIRM_YES") {
        return placeOrderAction(s);
      }
      if (nlu.intent === "CONFIRM_NO") {
        s.pending_confirmation = null;
        return resetToIdle(s, "Đã hủy đơn. Bạn cần gì nữa không?");
      }
      return makeAction(s, "CONFIRM_ORDER", {
        template: "NUDGE",
        body: "Nói \"đúng\" để đặt đơn hoặc \"không\" để hủy.",
        earcon_post: "turn_cue",
      });
    }

    case "ORDER_PLACED": {
      return resetToIdle(s, "Đơn đã đặt xong. Bạn cần gì nữa không?");
    }

    default:
      return fallback(s, "Mình chưa nghe rõ. Bạn có thể nói chi tiết hơn không?");
  }
}

// FOOD helpers

function searchAndOfferRestaurants(
  s: SessionContext,
  dishQuery: string | null,
  restQuery: string | null,
) {
  const resp = api.restaurantSearch(dishQuery, restQuery);
  if (!resp.ok || !resp.data) return fallback(s, "Lỗi tìm quán. Thử lại nhé.");

  const restaurants = resp.data.restaurants;
  if (restaurants.length === 0) {
    return makeAction(s, "CHOOSE_ENTRY", {
      template: "INFORM",
      body: "Không tìm thấy quán phù hợp. Thử tên khác hoặc nói \"gợi ý\".",
      earcon_post: "turn_cue",
    });
  }

  const options: OptionEntry[] = restaurants.slice(0, MAX_OPTIONS_READ).map((r, i) => ({
    index: i + 1,
    ref_type: "RESTAURANT" as const,
    ref_id: r.restaurant_id,
    label: r.name,
  }));

  const nlgOptions = restaurants.slice(0, MAX_OPTIONS_READ).map((r, i) => ({
    index: i + 1,
    label: r.name,
    detail: `${r.rating} sao, giao ${r.eta_min} phút`,
  }));

  return makeAction(s, "SELECT_RESTAURANT", {
    template: "OFFER_OPTIONS",
    status_line: dishQuery ? `Quán có "${dishQuery}"` : "Quán phổ biến",
    options: nlgOptions,
    has_more_options: restaurants.length > MAX_OPTIONS_READ,
    escape_hint: "hoặc nói tên quán bạn muốn",
    earcon_post: "turn_cue",
  }, options);
}

function showMenu(
  s: SessionContext,
  restaurantId: string,
) {
  const resp = api.menuFetch(restaurantId);
  if (!resp.ok || !resp.data) return fallback(s, "Lỗi lấy menu. Thử lại nhé.");

  const menu = resp.data;
  const allItems = menu.categories.flatMap((c) => c.items);
  const popular = allItems.filter((i) => i.popular);
  const toShow = popular.length > 0 ? popular : allItems;

  const options: OptionEntry[] = toShow.slice(0, MAX_OPTIONS_READ).map((item, i) => ({
    index: i + 1,
    ref_type: "ITEM" as const,
    ref_id: item.item_id,
    label: item.name,
  }));

  const nlgOptions = toShow.slice(0, MAX_OPTIONS_READ).map((item, i) => ({
    index: i + 1,
    label: item.name,
    detail: formatVND(item.price),
  }));

  const restName = s.slots_filled["restaurant_name"] as string ?? "Quán";

  // Store all items for pagination
  const allOptions: OptionEntry[] = allItems.map((item, i) => ({
    index: i + 1,
    ref_type: "ITEM" as const,
    ref_id: item.item_id,
    label: item.name,
  }));
  s._all_options = allOptions;
  s._options_page = 0;

  return makeAction(s, "BROWSE_MENU", {
    template: "OFFER_OPTIONS",
    status_line: restName,
    options: nlgOptions,
    has_more_options: toShow.length > MAX_OPTIONS_READ,
    escape_hint: "hoặc nói tên món bạn muốn",
    earcon_post: "turn_cue",
  }, options);
}

function addToCart(
  s: SessionContext,
  itemId: string,
  itemName: string,
  qty: number,
) {
  const restaurantId = s.slots_filled["restaurant_id"] as string;
  const restName = s.slots_filled["restaurant_name"] as string ?? "Quán";

  if (!s.active_cart) {
    s.active_cart = {
      cart_id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      restaurant_name: restName,
      items: [],
      subtotal: 0,
      voucher: null,
      shipping_fee: 15000,
      total: 0,
      currency: "VND",
    };
  }

  // Get price from menu
  const menuResp = api.menuFetch(restaurantId);
  const menuItem = menuResp.data?.categories.flatMap((c) => c.items).find((i) => i.item_id === itemId);
  const price = menuItem?.price ?? 0;

  const existing = s.active_cart.items.find((i) => i.item_id === itemId);
  if (existing) {
    existing.qty += qty;
    existing.line_total = existing.unit_price * existing.qty;
  } else {
    s.active_cart.items.push({
      item_id: itemId,
      name: itemName,
      unit_price: price,
      qty,
      line_total: price * qty,
    });
  }

  // Recalculate totals via PriceQuote API
  const quoteResp = api.priceQuote(
    restaurantId,
    s.active_cart.items.map((i) => ({ item_id: i.item_id, qty: i.qty })),
    s.active_cart.voucher?.code ?? null,
  );
  if (quoteResp.ok && quoteResp.data) {
    s.active_cart.subtotal = quoteResp.data.subtotal;
    s.active_cart.shipping_fee = quoteResp.data.shipping_fee;
    s.active_cart.total = quoteResp.data.total;
  }

  const cartSummary = s.active_cart.items.map((i) => `${i.qty} ${i.name}`).join(", ");
  const body = `Đã thêm ${qty} ${itemName}. Giỏ hàng: ${cartSummary}. Tạm tính ${formatVND(s.active_cart.total)}. Thêm món nữa hoặc nói "thanh toán".`;

  return makeAction(s, "REVIEW_CART", {
    template: "INFORM",
    status_line: restName,
    body,
    earcon_post: "turn_cue",
  });
}

function goToVoucherOffer(s: SessionContext) {
  if (!s.active_cart) return fallback(s, "Giỏ hàng trống.");

  const resp = api.voucherList(s.active_cart.restaurant_id, s.active_cart.subtotal);
  const vouchers = resp.ok && resp.data ? resp.data.vouchers : [];

  if (vouchers.length === 0) {
    return goToPaymentSelect(s);
  }

  const options: OptionEntry[] = vouchers.slice(0, MAX_OPTIONS_READ).map((v, i) => ({
    index: i + 1,
    ref_type: "VOUCHER" as const,
    ref_id: v.code,
    label: v.label,
  }));

  const nlgOptions = vouchers.slice(0, MAX_OPTIONS_READ).map((v, i) => ({
    index: i + 1,
    label: v.label,
    detail: `giảm ${formatVND(v.discount_applied)}`,
  }));

  return makeAction(s, "VOUCHER_OFFER", {
    template: "OFFER_OPTIONS",
    status_line: "Voucher khả dụng",
    body: `Tạm tính ${formatVND(s.active_cart.subtotal)}.`,
    options: nlgOptions,
    has_more_options: false,
    escape_hint: "hoặc nói \"bỏ qua\" để không dùng voucher",
    earcon_post: "turn_cue",
  }, options);
}

function confirmVoucher(s: SessionContext, voucherCode: string, label: string) {
  if (!s.active_cart) return fallback(s, "Giỏ hàng trống.");

  const resp = api.voucherValidate(voucherCode, s.active_cart.restaurant_id, s.active_cart.subtotal);
  if (!resp.ok || !resp.data?.eligible) {
    return makeAction(s, "VOUCHER_OFFER", {
      template: "INFORM",
      body: `Voucher không dùng được: ${resp.data?.reason ?? "lỗi"}. Chọn voucher khác hoặc "bỏ qua".`,
      earcon_post: "turn_cue",
    });
  }

  s.pending_confirmation = {
    kind: "APPLY_VOUCHER",
    payload_ref: voucherCode,
    prompt_said: `${label}, giảm ${formatVND(resp.data.discount)}. Áp vào chứ?`,
  };

  return makeAction(s, "APPLY_VOUCHER_CONFIRM", {
    template: "CONFIRM_EXPLICIT",
    body: `${label}, giảm ${formatVND(resp.data.discount)}. Áp voucher chứ?`,
    confirm_question: "Áp vào chứ?",
    earcon_post: "turn_cue",
  });
}

function goToPaymentSelect(s: SessionContext) {
  const options: OptionEntry[] = [
    { index: 1, ref_type: "PAYMENT", ref_id: "WALLET", label: "ví điện tử" },
    { index: 2, ref_type: "PAYMENT", ref_id: "CASH", label: "tiền mặt" },
  ];

  return makeAction(s, "SELECT_PAYMENT", {
    template: "OFFER_OPTIONS",
    status_line: "Thanh toán",
    body: `Tổng ${formatVND(s.active_cart?.total ?? 0)}. Chọn cách thanh toán:`,
    options: [
      { index: 1, label: "ví điện tử" },
      { index: 2, label: "tiền mặt" },
    ],
    earcon_post: "turn_cue",
  }, options);
}

function confirmOrder(s: SessionContext) {
  if (!s.active_cart) return fallback(s, "Giỏ hàng trống.");

  const cart = s.active_cart;
  const pm = s.slots_filled["payment_method"] as string;
  const pmLabel = pm === "WALLET" ? "ví điện tử" : "tiền mặt";
  const items = cart.items.map((i) => `${i.qty} ${i.name}`).join(", ");
  const voucher = cart.voucher ? `, voucher giảm ${formatVND(cart.voucher.discount)}` : "";
  const body = `Đặt từ ${cart.restaurant_name}: ${items}${voucher}. Tổng ${formatVND(cart.total)}, thanh toán ${pmLabel}. Giao tới ${s.saved_address}. Xác nhận đặt chứ?`;

  s.pending_confirmation = {
    kind: "PLACE_ORDER",
    payload_ref: cart.cart_id,
    prompt_said: body,
  };

  return makeAction(s, "CONFIRM_ORDER", {
    template: "ORDER_SUMMARY",
    body,
    confirm_question: "Xác nhận đặt chứ?",
    earcon_post: "turn_cue",
  });
}

function placeOrderAction(s: SessionContext) {
  if (!s.active_cart) return fallback(s, "Giỏ hàng trống.");

  const cart = s.active_cart;
  const resp = api.placeOrder(
    cart.restaurant_id,
    cart.items.map((i) => ({ item_id: i.item_id, qty: i.qty })),
    cart.voucher?.code ?? null,
    s.slots_filled["payment_method"] as string ?? "CASH",
    crypto.randomUUID(),
  );

  if (!resp.ok || !resp.data) return fallback(s, "Lỗi đặt đơn. Thử lại nhé.");

  const order = resp.data;
  s.active_cart = null;
  s.pending_confirmation = null;

  return makeAction(s, "ORDER_PLACED", {
    template: "INFORM",
    status_line: "Đặt đơn thành công!",
    body: `Đơn số ${order.order_id} đã xác nhận. Tổng ${formatVND(order.total_charged)}, giao trong khoảng ${order.eta_min} phút. Cần gì nữa không?`,
    earcon_post: "success",
  });
}

// ── Global handlers ─────────────────────────────────────────

function isGlobal(intent: Intent): boolean {
  return intent.startsWith("GLOBAL_") || intent === "CONFIRM_YES" || intent === "CONFIRM_NO";
}

function handleGlobal(
  nlu: NLUResult,
  s: SessionContext,
): { action: DialogAction; session: SessionContext } | null {
  switch (nlu.intent) {
    case "GLOBAL_CANCEL": {
      if (s.current_flow) {
        if (s.pending_confirmation) {
          s.pending_confirmation = {
            kind: "CANCEL_CONFIRM",
            payload_ref: "",
            prompt_said: "Bạn muốn hủy? Nói \"đúng\" để xác nhận hủy.",
          };
          return makeAction(s, s.current_state, {
            template: "CONFIRM_EXPLICIT",
            body: "Bạn muốn hủy? Nói \"đúng\" để xác nhận hủy.",
            confirm_question: "Hủy chứ?",
            earcon_post: "turn_cue",
          });
        }
        return resetToIdle(s, "Đã hủy. Bạn cần gì nữa không?");
      }
      return null;
    }

    case "GLOBAL_BACK": {
      if (s.state_stack.length > 0) {
        const prev = s.state_stack.pop()!;
        s.current_state = prev.state;
        s.current_flow = prev.flow;
        return makeAction(s, prev.state, {
          template: "INFORM",
          body: "Đã quay lại. " + (s.last_nlg_request?.body ?? ""),
          earcon_post: "turn_cue",
        });
      }
      return resetToIdle(s, "Không có bước trước. Bạn muốn làm gì?");
    }

    case "GLOBAL_REPEAT": {
      return makeAction(s, s.current_state, s.last_nlg_request ?? {
        template: "INFORM",
        body: "Mình không có gì để lặp lại.",
        earcon_post: "turn_cue",
      });
    }

    case "GLOBAL_REPEAT_OPTIONS": {
      if (s.last_offered_options.length > 0 && s.last_nlg_request) {
        return makeAction(s, s.current_state, s.last_nlg_request);
      }
      return makeAction(s, s.current_state, {
        template: "INFORM",
        body: "Không có lựa chọn nào để đọc lại.",
        earcon_post: "turn_cue",
      });
    }

    case "GLOBAL_RESUME":
    case "GLOBAL_MORE_OPTIONS": {
      if (s._all_options.length > 0) {
        s._options_page++;
        const start = s._options_page * MAX_OPTIONS_READ;
        const page = s._all_options.slice(start, start + MAX_OPTIONS_READ);
        if (page.length === 0) {
          return makeAction(s, s.current_state, {
            template: "INFORM",
            body: "Hết rồi, không còn lựa chọn nào nữa.",
            earcon_post: "turn_cue",
          });
        }
        const nlgOptions = page.map((o, i) => ({
          index: start + i + 1,
          label: o.label,
        }));
        const newOptions = page.map((o, i) => ({
          ...o,
          index: start + i + 1,
        }));
        return makeAction(s, s.current_state, {
          template: "OFFER_OPTIONS",
          options: nlgOptions,
          has_more_options: start + MAX_OPTIONS_READ < s._all_options.length,
          earcon_post: "turn_cue",
        }, newOptions);
      }
      return makeAction(s, s.current_state, {
        template: "INFORM",
        body: "Không có thêm lựa chọn.",
        earcon_post: "turn_cue",
      });
    }

    case "GLOBAL_HELP": {
      const helpText = getHelpText(s.current_state, s.current_flow);
      return makeAction(s, s.current_state, {
        template: "INFORM",
        body: helpText,
        earcon_post: "turn_cue",
      });
    }

    case "GLOBAL_READ_ORDER": {
      if (s.active_cart && s.active_cart.items.length > 0) {
        const items = s.active_cart.items.map((i) => `${i.qty} ${i.name}, ${formatVND(i.line_total)}`).join(". ");
        return makeAction(s, s.current_state, {
          template: "INFORM",
          body: `Giỏ hàng từ ${s.active_cart.restaurant_name}: ${items}. Tổng tạm tính ${formatVND(s.active_cart.total)}.`,
          earcon_post: "turn_cue",
        });
      }
      return makeAction(s, s.current_state, {
        template: "INFORM",
        body: "Giỏ hàng trống.",
        earcon_post: "turn_cue",
      });
    }

    case "GLOBAL_STOP": {
      if (s.current_flow === "NAV") {
        s.active_booking = null;
        return resetToIdle(s, "Đã hủy đặt xe. Bạn cần gì nữa không?");
      }
      return null;
    }

    case "CONFIRM_YES":
    case "CONFIRM_NO": {
      if (s.pending_confirmation?.kind === "CANCEL_CONFIRM") {
        if (nlu.intent === "CONFIRM_YES") {
          return resetToIdle(s, "Đã hủy. Bạn cần gì nữa không?");
        }
        s.pending_confirmation = null;
        return makeAction(s, s.current_state, {
          template: "INFORM",
          body: "Tiếp tục. " + (s.last_nlg_request?.body ?? ""),
          earcon_post: "turn_cue",
        });
      }
      return null; // let flow handler deal with it
    }

    default:
      return null;
  }
}

function getHelpText(state: DialogState, flow: Flow | null): string {
  if (flow === "NAV") {
    return "Bạn đang đặt xe. Nói tên nơi muốn tới, chọn loại xe, rồi xác nhận. Nói \"hủy\" để quay lại.";
  }
  if (flow === "FOOD") {
    return "Bạn đang đặt đồ ăn. Chọn số món từ danh sách, nói \"thêm món\" hoặc \"thanh toán\". Nói \"đọc lại đơn\" để xem giỏ hàng.";
  }
  return "Mình giúp bạn đặt xe đi lại hoặc đặt đồ ăn giao tận nơi. Nói \"đặt xe\" hoặc \"đặt đồ ăn\" để bắt đầu.";
}

// ── Utilities ───────────────────────────────────────────────

function makeAction(
  s: SessionContext,
  nextState: DialogState,
  nlgRequest: NLGRequest,
  newOptions?: OptionEntry[],
): { action: DialogAction; session: SessionContext } {
  const stateChanged = s.current_state !== nextState;
  s.current_state = nextState;
  s.last_nlg_request = nlgRequest;
  if (newOptions) {
    s.last_offered_options = newOptions;
  }
  if (stateChanged) s.retry_count = 0;

  return {
    action: {
      session_id: s.session_id,
      next_state: nextState,
      api_call: null,
      nlg_request: nlgRequest,
      set_pending_confirmation: s.pending_confirmation,
      push_state_stack: false,
      pop_state_stack: false,
      reset_retry: true,
    },
    session: s,
  };
}

function fallback(
  s: SessionContext,
  message: string,
): { action: DialogAction; session: SessionContext } {
  return makeAction(s, s.current_state, {
    template: "ERROR",
    body: message,
    earcon_post: "turn_cue",
  });
}

function nudgeWithContext(
  s: SessionContext,
  state: DialogState,
  message: string,
): { action: DialogAction; session: SessionContext } {
  return makeAction(s, state, {
    template: "NUDGE",
    body: message,
    earcon_post: "turn_cue",
  });
}

function resetToIdle(
  s: SessionContext,
  message: string,
): { action: DialogAction; session: SessionContext } {
  s.current_flow = null;
  s.current_state = "IDLE";
  s.slots_filled = {};
  s.last_offered_options = [];
  s.pending_confirmation = null;
  s.state_stack = [];
  s._options_page = 0;
  s._all_options = [];

  return makeAction(s, "IDLE", {
    template: "INFORM",
    body: message,
    earcon_post: "turn_cue",
  });
}

function formatVND(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)} nghìn`;
  return `${n} đồng`;
}
