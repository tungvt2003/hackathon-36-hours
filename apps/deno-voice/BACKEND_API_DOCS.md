# Voice Assistant — Backend API Documentation

> Tài liệu chi tiết cho backend team: mô tả từng endpoint, payload request/response,
> state machine của dialog, và **format chính xác** mà backend cần trả về khi mobile gọi API.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [API Endpoints](#2-api-endpoints)
3. [State Machine — Dialog States](#3-state-machine--dialog-states)
4. [Backend Mock APIs cần thay bằng real API](#4-backend-mock-apis-cần-thay-bằng-real-api)
5. [Intent Taxonomy](#5-intent-taxonomy)
6. [Data Types Reference](#6-data-types-reference)
7. [Error Handling](#7-error-handling)
8. [Flow diagrams](#8-flow-diagrams)

---

## 1. Tổng quan kiến trúc

```
Mobile App
   │
   ├── POST /session          → Tạo session, nhận greeting
   ├── POST /turn             → Gửi text/audio, nhận response
   ├── POST /conversation     → Convenience: auto tạo session + turn
   ├── GET  /session/:id      → Xem state hiện tại
   └── GET  /sessions         → List tất cả sessions
```

**Pipeline xử lý 1 turn:**
```
Audio (base64) ──→ STT (Google/VNPT) ──→ transcript
                                              │
Text (transcript) ────────────────────────────┘
                                              │
                                        NLU (LLM gpt-5.5)
                                              │
                                     { intent, slots }
                                              │
                                      Dialog Manager
                                              │
                                   { next_state, nlg_request }
                                              │
                                         NLG Render
                                              │
                                   { plain_text, ssml }
                                              │
                                    TTS (VNPT SmartVoice)
                                              │
                                   { audio_base64/url }
```

---

## 2. API Endpoints

### 2.1 `GET /health`

Health check.

**Response:**
```json
{
  "ok": true,
  "service": "voice-assistant",
  "version": "0.2"
}
```

---

### 2.2 `POST /session` — Tạo session mới

Tạo session mới, trả về greeting text + audio.

**Request body** (optional):
```json
{
  "user_id": "u_abc123"       // optional, tự generate nếu không có
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "greeting": "Xin chào! Mình là trợ lý giọng nói. Mình có thể giúp bạn đặt xe hoặc đặt đồ ăn. Bạn muốn làm gì? 1, đặt xe, gọi xe tới nơi bạn muốn; 2, đặt đồ ăn, tìm quán và gọi món.",
    "ssml": "<speak>Xin chào! ...</speak>",
    "audio_url": "data:audio/wav;base64,UklGR...",   // null nếu ENABLE_TTS=false
    "expects_input": true,
    "expected_intents": ["GLOBAL_REPEAT", "GLOBAL_HELP", "GLOBAL_CANCEL", "NAVIGATE", "ORDER_FOOD", "REQUEST_SUGGESTIONS"]
  }
}
```

**Backend cần handle:**
- Lưu `session_id` cho các lượt gọi tiếp theo
- Phát `audio_url` (WAV base64) nếu có, hoặc dùng `greeting` text cho local TTS
- `expects_input: true` → mở mic chờ user nói
- `expected_intents` → gợi ý cho UI hiển thị nút tương ứng

---

### 2.3 `POST /turn` — Xử lý 1 lượt hội thoại (MAIN ENDPOINT)

Đây là endpoint chính, nhận text hoặc audio, trả về kết quả đầy đủ.

**Request body:**
```json
{
  "session_id": "550e8400-...",                // BẮT BUỘC
  "transcript": "dẫn mình tới nhà sách",      // TEXT mode: gửi text trực tiếp
  "audio_base64": "UklGRi4...",                // AUDIO mode: WAV base64 (LINEAR16)
  "sample_rate": 16000,                        // default 16000 nếu không gửi
  "user_id": "u_abc123"                        // optional
}
```

> **Lưu ý:** Gửi `transcript` HOẶC `audio_base64`, không cần cả hai. Nếu gửi `audio_base64`, server tự STT ra transcript.

**Response thành công:**
```json
{
  "ok": true,
  "data": {
    "session_id": "550e8400-...",
    "turn_index": 1,

    // ── ASR (Speech-to-Text) ──
    "asr_transcript": "Đặt xe tới nhà sách.",        // raw STT output (null nếu gửi text)
    "asr_confidence": 0.95,                          // 0.0-1.0 (null nếu gửi text)

    // ── NLU (hiểu ý định) ──
    "transcript": "Đặt xe tới nhà sách",            // transcript đã clean (bỏ dấu câu cuối)
    "intent": "NAVIGATE",                            // intent đã phân tích
    "intent_confidence": 0.95,                       // 0.0-1.0
    "slots": {                                       // thông tin trích xuất
      "destination_query": "nhà sách"
    },

    // ── NLG (câu trả lời) ──
    "response_text": "Có 2 nơi phù hợp. 1, Nhà sách Fahasa Nguyễn Huệ, 40 Nguyễn Huệ, 0.3 km; 2, Nhà sách Fahasa Lý Tự Trọng, 387 Lý Tự Trọng, 1.2 km. hoặc nói tên cụ thể hơn.",
    "ssml": "<speak>...</speak>",
    "expects_input": true,                           // true = mở mic chờ user
    "expected_intents": ["SELECT_OPTION", "GLOBAL_MORE_OPTIONS", ...],

    // ── TTS (audio response) ──
    "audio_url": "data:audio/wav;base64,...",        // null nếu TTS tắt

    // ── Session State ──
    "state": {
      "current_flow": "NAV",                         // "NAV" | "FOOD" | null
      "current_state": "DISAMBIGUATE",               // state hiện tại (xem bảng bên dưới)
      "active_cart": null,                            // giỏ hàng (FOOD flow)
      "active_booking": null,                          // chuyến xe đang đặt (NAV flow)
      "pending_confirmation": null                    // đang chờ xác nhận gì
    }
  }
}
```

**Backend cần handle theo `state.current_state`:**

| `current_state` | Mobile cần làm gì |
|---|---|
| `GREETING` / `IDLE` | Hiện greeting, chờ user chọn flow |
| `DISAMBIGUATE` | Hiện danh sách lựa chọn, chờ user chọn số |
| `CONFIRM_DESTINATION` | Hiện câu xác nhận, chờ "đúng"/"không" |
| `SELECT_VEHICLE` | Hiện danh sách loại xe + giá, chờ chọn |
| `CONFIRM_BOOKING` | Hiện tóm tắt chuyến xe, chờ xác nhận |
| `BOOKING_PLACED` | **Đặt xe thành công** — hiện thông tin tài xế, biển số, ETA |
| `SELECT_RESTAURANT` | Hiện danh sách quán, chờ chọn |
| `BROWSE_MENU` | Hiện menu, chờ chọn món |
| `SET_QUANTITY` | Chờ user nói số lượng |
| `REVIEW_CART` | Hiện giỏ hàng, chờ "thêm món"/"thanh toán" |
| `VOUCHER_OFFER` | Hiện voucher khả dụng, chờ chọn hoặc "bỏ qua" |
| `APPLY_VOUCHER_CONFIRM` | Xác nhận áp voucher |
| `SELECT_PAYMENT` | Chờ chọn "ví"/"tiền mặt" |
| `CONFIRM_ORDER` | Hiện tóm tắt đơn, chờ xác nhận đặt |
| `ORDER_PLACED` | Đơn đã đặt xong, hiện thông tin đơn |

---

### 2.4 `POST /conversation` — Convenience endpoint

Tự động tạo session nếu chưa có, rồi xử lý turn. Tiện cho prototype/demo.

**Request body:**
```json
{
  "session_id": "...",                    // optional — tự tạo nếu không có
  "transcript": "đặt cho mình phở",      // text
  "audio_base64": "...",                  // hoặc audio
  "sample_rate": 16000,
  "user_id": "u_abc"
}
```

**Response (khi chưa có session_id, chưa có transcript):**
```json
{
  "ok": true,
  "data": {
    "session_id": "...",
    "greeting": "Xin chào! ...",
    "audio_url": "data:audio/wav;base64,...",
    "response_text": "Xin chào! ..."
  }
}
```

**Response (khi có session_id + transcript):**
```json
{
  "ok": true,
  "data": {
    "session_id": "...",
    "turn_index": 1,
    "you_said": "đặt cho mình phở",          // transcript đã clean
    "intent": "ORDER_FOOD",
    "slots": { "food_query": "phở" },
    "response": "Quán có \"phở\". 1, Phở Hòa Pasteur, 4.5 sao, giao 30 phút; ...",
    "audio_url": "data:audio/wav;base64,...",
    "state": "SELECT_RESTAURANT",             // string, không phải object
    "flow": "FOOD"
  }
}
```

---

### 2.5 `GET /session/:id` — Xem session state

**Response:**
```json
{
  "ok": true,
  "data": {
    "session_id": "...",
    "current_flow": "FOOD",
    "current_state": "BROWSE_MENU",
    "turn_index": 3,
    "active_cart": {
      "cart_id": "...",
      "restaurant_id": "r_pho_hoa",
      "restaurant_name": "Phở Hòa Pasteur",
      "items": [
        {
          "item_id": "i_pho_tai",
          "name": "Phở tái",
          "unit_price": 55000,
          "qty": 2,
          "line_total": 110000
        }
      ],
      "subtotal": 110000,
      "voucher": null,
      "shipping_fee": 15000,
      "total": 125000,
      "currency": "VND"
    },
    "active_booking": null,
    "pending_confirmation": null,
    "slots_filled": {
      "restaurant_id": "r_pho_hoa",
      "restaurant_name": "Phở Hòa Pasteur"
    },
    "last_offered_options": [
      { "index": 1, "ref_type": "ITEM", "ref_id": "i_pho_tai", "label": "Phở tái" },
      { "index": 2, "ref_type": "ITEM", "ref_id": "i_pho_tai_nam", "label": "Phở tái nạm" },
      { "index": 3, "ref_type": "ITEM", "ref_id": "i_pho_bo_vien", "label": "Phở bò viên" }
    ]
  }
}
```

---

### 2.6 `GET /sessions` — List sessions

**Response:**
```json
{
  "ok": true,
  "data": {
    "sessions": ["session-id-1", "session-id-2"]
  }
}
```

---

## 3. State Machine — Dialog States

### 3.1 NAV Flow (Đặt xe — kiểu Grab)

> App dành cho **người mù**, mọi response đều đọc đầy đủ chi tiết (loại xe, giá, tên tài xế, biển số).

```
GREETING/IDLE
   │ user: "đặt xe tới nhà sách" (NAVIGATE)
   ▼
CAPTURE_DESTINATION ─── nếu 1 kết quả ──→ CONFIRM_DESTINATION
   │ nếu nhiều kết quả                          │
   ▼                                             │
DISAMBIGUATE                                     │
   │ user: "số 1" (SELECT_OPTION)                │
   ▼                                             │
CONFIRM_DESTINATION ◄────────────────────────────┘
   │ user: "đúng rồi" (CONFIRM_YES)     user: "sai rồi" (CONFIRM_NO)
   ▼                                         ▼
SELECT_VEHICLE                        CAPTURE_DESTINATION (loop)
   │ user: "số 1" (SELECT_OPTION) — chọn loại xe
   ▼
CONFIRM_BOOKING
   │ user: "đúng rồi" (CONFIRM_YES)     user: "không" (CONFIRM_NO) → IDLE
   ▼
BOOKING_PLACED → IDLE
```

**Chi tiết từng state:**

#### `CAPTURE_DESTINATION`
- **Chờ:** user nói tên địa điểm
- **Backend gọi:** `PlaceSearch(query, lat, lng)` → danh sách candidates
- **Nếu 0 kết quả:** retry, nudge "Không tìm thấy, nói lại"
- **Nếu 1 kết quả:** tự động chuyển → `CONFIRM_DESTINATION`
- **Nếu >1 kết quả:** chuyển → `DISAMBIGUATE` với danh sách options

#### `DISAMBIGUATE`
- **Chờ:** user chọn số (SELECT_OPTION) hoặc nói tên mới (NAVIGATE)
- **Response format:**
```json
{
  "response_text": "Có 2 nơi phù hợp. 1, Nhà sách Fahasa Nguyễn Huệ, 40 Nguyễn Huệ, 0.3 km; 2, Nhà sách Fahasa Nguyễn Văn Cừ, 60-62 Nguyễn Văn Cừ, 2.1 km. hoặc nói tên cụ thể hơn.",
  "state": { "current_state": "DISAMBIGUATE" }
}
```

#### `CONFIRM_DESTINATION`
- **Chờ:** CONFIRM_YES hoặc CONFIRM_NO
- **Response format:**
```json
{
  "response_text": "Nhà sách Fahasa Nguyễn Huệ, 40 Nguyễn Huệ, Quận 1, cách 0.3 km. Đúng nơi bạn muốn tới chứ?",
  "state": {
    "current_state": "CONFIRM_DESTINATION",
    "pending_confirmation": {
      "kind": "BOOK_RIDE",
      "payload_ref": "p_fahasa_nh",
      "prompt_said": "Nhà sách Fahasa Nguyễn Huệ... Đúng nơi bạn muốn tới chứ?"
    }
  }
}
```

#### `SELECT_VEHICLE`
- **Backend gọi:** `FareEstimate(place_id, lat, lng)` → danh sách loại xe + giá
- **Chờ:** SELECT_OPTION (chọn loại xe)
- **Response format (đọc đầy đủ cho người mù):**
```json
{
  "response_text": "Đặt xe tới Nhà sách Fahasa Nguyễn Huệ. Chọn loại xe: 1, Xe máy, 15 nghìn, tài xế đến trong 4 phút; 2, Xe 4 chỗ, 29 nghìn, tài xế đến trong 6 phút; 3, Xe 7 chỗ, 39 nghìn, tài xế đến trong 8 phút.",
  "state": { "current_state": "SELECT_VEHICLE" }
}
```

#### `CONFIRM_BOOKING`
- **Chờ:** CONFIRM_YES / CONFIRM_NO
- **Response format (đọc đầy đủ tóm tắt chuyến):**
```json
{
  "response_text": "Đặt Xe máy tới Nhà sách Fahasa Nguyễn Huệ, giá 15 nghìn, tài xế đến trong 4 phút. Xác nhận đặt xe chứ?",
  "state": {
    "current_state": "CONFIRM_BOOKING",
    "pending_confirmation": {
      "kind": "BOOK_RIDE",
      "payload_ref": "p_fahasa_nh",
      "prompt_said": "Đặt Xe máy tới Nhà sách... Xác nhận đặt xe chứ?"
    }
  }
}
```

#### `BOOKING_PLACED`
- **Backend gọi:** `BookRide(place_id, vehicle_type, lat, lng, idempotency_key)` → thông tin chuyến
- **active_booking khác null** — chứa toàn bộ thông tin chuyến
- **Response format (đọc đầy đủ: mã chuyến, giá, tài xế, biển số, ETA):**
```json
{
  "response_text": "Đặt xe thành công! Mã chuyến BK101. Xe máy, giá 15 nghìn. Tài xế Nguyễn Văn An, biển số 59A1-12345, đến trong 3 phút. Cần gì nữa không?",
  "state": {
    "current_state": "BOOKING_PLACED",
    "active_booking": {
      "booking_id": "BK101",
      "place_id": "p_fahasa_nh",
      "place_name": "Nhà sách Fahasa Nguyễn Huệ",
      "address": "40 Nguyễn Huệ, Quận 1",
      "vehicle_type": "BIKE",
      "vehicle_label": "Xe máy",
      "price": 15000,
      "driver_name": "Nguyễn Văn An",
      "driver_phone": "0901234567",
      "license_plate": "59A1-12345",
      "eta_min": 3,
      "status": "confirmed"
    }
  }
}
```

---

### 3.2 FOOD Flow (Đặt đồ ăn)

```
GREETING/IDLE
   │ user: "đặt cho mình phở" (ORDER_FOOD)
   ▼
CHOOSE_ENTRY ──→ (nếu có food_query) ──→ search restaurants
   │
   ▼
SELECT_RESTAURANT
   │ user: "số 1" (SELECT_OPTION)
   ▼
BROWSE_MENU
   │ user: "phở tái" (SELECT_OPTION/SELECT_ITEM)
   ▼
SET_QUANTITY
   │ user: "hai phần" (SET_QUANTITY, slot quantity=2)
   ▼
REVIEW_CART ◄─── user: "thêm món" (ADD_MORE_ITEM) ──→ BROWSE_MENU (loop)
   │ user: "thanh toán" (CHECKOUT)
   ▼
VOUCHER_OFFER
   │ user: "số 1" (SELECT_OPTION)      user: "bỏ qua" (SKIP_VOUCHER)
   ▼                                         │
APPLY_VOUCHER_CONFIRM                        │
   │ user: "đúng" (CONFIRM_YES)              │
   ▼                                         │
SELECT_PAYMENT ◄─────────────────────────────┘
   │ user: "tiền mặt" (SELECT_PAYMENT, slot payment_method="CASH")
   ▼
CONFIRM_ORDER
   │ user: "xác nhận" (CONFIRM_YES)     user: "không" (CONFIRM_NO) → IDLE
   ▼
ORDER_PLACED → IDLE
```

**Chi tiết từng state:**

#### `SELECT_RESTAURANT`
- **Backend gọi:** `RestaurantSearch(dish_query, restaurant_query)` → danh sách quán
- **Response format:**
```json
{
  "response_text": "Quán có \"phở\". 1, Phở Hòa Pasteur, 4.5 sao, giao 30 phút; 2, Phở Lệ, 4.2 sao, giao 25 phút; 3, Phở 2000, 4 sao, giao 35 phút. hoặc nói tên quán bạn muốn.",
  "state": {
    "current_state": "SELECT_RESTAURANT",
    "current_flow": "FOOD"
  }
}
```

#### `BROWSE_MENU`
- **Backend gọi:** `MenuFetch(restaurant_id)` → danh sách món
- **Response format:**
```json
{
  "response_text": "Phở Hòa Pasteur. 1, Phở tái, 55 nghìn; 2, Phở tái nạm, 60 nghìn; 3, Phở bò viên, 55 nghìn. hoặc nói tên món bạn muốn.",
  "state": { "current_state": "BROWSE_MENU" }
}
```
- **User chọn món** → chuyển SET_QUANTITY (nếu không kèm số lượng)
- **User nói kèm số lượng** (vd: "2 phở tái") → tự thêm vào cart, chuyển REVIEW_CART

#### `SET_QUANTITY`
- **Chờ:** số lượng (SET_QUANTITY intent, slot `quantity`)
- **Response:**
```json
{
  "response_text": "Phở tái. Bạn muốn mấy phần?",
  "state": { "current_state": "SET_QUANTITY" }
}
```

#### `REVIEW_CART`
- **Chờ:** ADD_MORE_ITEM, CHECKOUT, hoặc CONFIRM_NO
- **Response format:**
```json
{
  "response_text": "Phở Hòa Pasteur. Đã thêm 2 Phở tái. Giỏ hàng: 2 Phở tái. Tạm tính 125 nghìn. Thêm món nữa hoặc nói \"thanh toán\".",
  "state": {
    "current_state": "REVIEW_CART",
    "active_cart": {
      "cart_id": "...",
      "restaurant_id": "r_pho_hoa",
      "restaurant_name": "Phở Hòa Pasteur",
      "items": [
        { "item_id": "i_pho_tai", "name": "Phở tái", "unit_price": 55000, "qty": 2, "line_total": 110000 }
      ],
      "subtotal": 110000,
      "voucher": null,
      "shipping_fee": 15000,
      "total": 125000,
      "currency": "VND"
    }
  }
}
```

#### `VOUCHER_OFFER`
- **Backend gọi:** `VoucherList(restaurant_id, subtotal)` → danh sách voucher
- **Nếu 0 voucher:** skip, chuyển thẳng SELECT_PAYMENT
- **Response format:**
```json
{
  "response_text": "Voucher khả dụng. Tạm tính 110 nghìn. 1, giảm 20 nghìn cho đơn từ 80 nghìn, giảm 20 nghìn; 2, giảm 15% tối đa 30 nghìn, giảm 17 nghìn; 3, miễn phí giao hàng, giảm 15 nghìn. hoặc nói \"bỏ qua\" để không dùng voucher.",
  "state": { "current_state": "VOUCHER_OFFER" }
}
```

#### `APPLY_VOUCHER_CONFIRM`
- **Chờ:** CONFIRM_YES / CONFIRM_NO
- **Backend gọi khi YES:** `VoucherValidate(code, restaurant_id, subtotal)` → kiểm tra + áp dụng
- **Response format:**
```json
{
  "response_text": "giảm 20 nghìn cho đơn từ 80 nghìn, giảm 20 nghìn. Áp voucher chứ? Áp vào chứ?",
  "state": {
    "current_state": "APPLY_VOUCHER_CONFIRM",
    "pending_confirmation": {
      "kind": "APPLY_VOUCHER",
      "payload_ref": "SALE20",
      "prompt_said": "giảm 20 nghìn..., giảm 20 nghìn. Áp vào chứ?"
    }
  }
}
```

#### `SELECT_PAYMENT`
- **Chờ:** SELECT_PAYMENT (slot `payment_method`: `"WALLET"` hoặc `"CASH"`)
- **Response format:**
```json
{
  "response_text": "Thanh toán. Tổng 105 nghìn. Chọn cách thanh toán: 1, ví điện tử; 2, tiền mặt.",
  "state": { "current_state": "SELECT_PAYMENT" }
}
```

#### `CONFIRM_ORDER`
- **Chờ:** CONFIRM_YES → đặt đơn / CONFIRM_NO → hủy về IDLE
- **Response format (order summary):**
```json
{
  "response_text": "Đặt từ Phở Hòa Pasteur: 2 Phở tái, voucher giảm 20 nghìn. Tổng 105 nghìn, thanh toán tiền mặt. Giao tới 12 Nguyễn Huệ, Quận 1. Xác nhận đặt chứ? Xác nhận đặt chứ?",
  "state": {
    "current_state": "CONFIRM_ORDER",
    "pending_confirmation": {
      "kind": "PLACE_ORDER",
      "payload_ref": "<cart_id>",
      "prompt_said": "Đặt từ Phở Hòa Pasteur: ..."
    }
  }
}
```

#### `ORDER_PLACED`
- **Backend gọi:** `PlaceOrder(restaurant_id, items, voucher, payment_method, idempotency_key)`
- **Response format:**
```json
{
  "response_text": "Đặt đơn thành công! Đơn số 4801 đã xác nhận. Tổng 105 nghìn, giao trong khoảng 25 phút. Cần gì nữa không?",
  "state": {
    "current_state": "ORDER_PLACED",
    "active_cart": null
  }
}
```

---

## 4. Backend Mock APIs cần thay bằng real API

Hiện tại tất cả đều mock trong `api/mock_api.ts`. Backend cần implement real API cho từng function:

### 4.1 `PlaceSearch` — Tìm địa điểm

**Input:**
```typescript
{
  query: string,           // "nhà sách", "sân bay"
  user_lat: number,        // 10.7769
  user_lng: number,        // 106.7009
  max_results?: number     // default 5
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "candidates": [
      {
        "place_id": "p_fahasa_nh",
        "name": "Nhà sách Fahasa Nguyễn Huệ",
        "address": "40 Nguyễn Huệ, Quận 1",
        "distance_m": 312,
        "eta_min": 5
      }
    ]
  },
  "error": null
}
```

### 4.2 `FareEstimate` — Tính giá xe

**Input:**
```typescript
{
  place_id: string,       // "p_fahasa_nh"
  user_lat: number,       // 10.7769
  user_lng: number        // 106.7009
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "place_id": "p_fahasa_nh",
    "distance_m": 312,
    "estimates": [
      { "vehicle_type": "BIKE", "label": "Xe máy", "price": 15000, "eta_min": 4 },
      { "vehicle_type": "CAR_4", "label": "Xe 4 chỗ", "price": 29000, "eta_min": 6 },
      { "vehicle_type": "CAR_7", "label": "Xe 7 chỗ", "price": 39000, "eta_min": 8 }
    ]
  },
  "error": null
}
```

**Lưu ý cho người mù:** Response sẽ đọc đầy đủ từng loại xe kèm giá + ETA.

**Công thức giá mock:** `price = base + (km × per_km)`, làm tròn đến nghìn.

| Loại | Base | Per km | ETA base |
|---|---|---|---|
| BIKE | 12,000 | 4,500 | 3 phút |
| CAR_4 | 25,000 | 8,500 | 5 phút |
| CAR_7 | 35,000 | 11,000 | 7 phút |

### 4.3 `BookRide` — Đặt chuyến xe

**Input:**
```typescript
{
  place_id: string,
  vehicle_type: "BIKE" | "CAR_4" | "CAR_7",
  user_lat: number,
  user_lng: number,
  idempotency_key: string    // UUID, tránh đặt trùng
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "booking_id": "BK101",
    "vehicle_type": "BIKE",
    "vehicle_label": "Xe máy",
    "price": 15000,
    "driver_name": "Nguyễn Văn An",
    "driver_phone": "0901234567",
    "license_plate": "59A1-12345",
    "eta_min": 3,
    "status": "confirmed"         // "confirmed" | "pending" | "failed"
  },
  "error": null
}
```

**Lưu ý cho người mù:** Response đọc đầy đủ: mã chuyến, loại xe, giá, tên tài xế, biển số xe, thời gian đến.

### 4.4 `RestaurantSearch` — Tìm quán ăn

**Input:**
```typescript
{
  dish_query: string | null,        // "phở" — tìm theo tên món
  restaurant_query: string | null,  // "Phở Hòa" — tìm theo tên quán
  max_results?: number              // default 5
}
```

> Gửi 1 trong 2 hoặc cả 2. Gửi cả 2 null = gợi ý quán phổ biến gần đây.

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "restaurants": [
      {
        "restaurant_id": "r_pho_hoa",
        "name": "Phở Hòa Pasteur",
        "rating": 4.5,
        "eta_min": 30,
        "min_order": 30000
      }
    ]
  },
  "error": null
}
```

### 4.5 `MenuFetch` — Lấy menu quán

**Input:**
```typescript
{ restaurant_id: string }     // "r_pho_hoa"
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "restaurant_id": "r_pho_hoa",
    "categories": [
      {
        "name": "Phở",
        "items": [
          { "item_id": "i_pho_tai", "name": "Phở tái", "price": 55000, "popular": true },
          { "item_id": "i_pho_tai_nam", "name": "Phở tái nạm", "price": 60000, "popular": true },
          { "item_id": "i_pho_bo_vien", "name": "Phở bò viên", "price": 55000 }
        ]
      },
      {
        "name": "Nước uống",
        "items": [
          { "item_id": "i_tra_da", "name": "Trà đá", "price": 5000 }
        ]
      }
    ]
  },
  "error": null
}
```

> **Lưu ý:** `popular: true` → hiện ưu tiên trong danh sách đọc cho user (tối đa 3 món mỗi lần).

### 4.6 `PriceQuote` — Tính giá đơn hàng

**Input:**
```typescript
{
  restaurant_id: string,
  items: [{ item_id: string, qty: number }],
  voucher_code: string | null
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "subtotal": 110000,
    "shipping_fee": 15000,
    "discount": 20000,          // 0 nếu không voucher
    "total": 105000,
    "currency": "VND"
  },
  "error": null
}
```

### 4.7 `VoucherList` — Danh sách voucher khả dụng

**Input:**
```typescript
{
  restaurant_id: string,
  subtotal: number              // tổng trước giảm giá
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "vouchers": [
      {
        "code": "SALE20",
        "label": "giảm 20 nghìn cho đơn từ 80 nghìn",
        "type": "fixed",
        "value": 20000,
        "cap": null,
        "discount_applied": 20000       // số tiền giảm thực tế cho đơn này
      },
      {
        "code": "SALE15",
        "label": "giảm 15% tối đa 30 nghìn",
        "type": "percent",
        "value": 15,
        "cap": 30000,
        "discount_applied": 16500
      }
    ]
  },
  "error": null
}
```

### 4.8 `VoucherValidate` — Kiểm tra voucher có áp dụng được không

**Input:**
```typescript
{
  code: string,
  restaurant_id: string,
  subtotal: number
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "eligible": true,
    "discount": 20000,
    "reason": null              // hoặc "Đơn tối thiểu 80 nghìn" nếu eligible=false
  },
  "error": null
}
```

### 4.9 `PlaceOrder` — Đặt đơn

**Input:**
```typescript
{
  restaurant_id: string,
  items: [{ item_id: string, qty: number }],
  voucher_code: string | null,
  payment_method: "WALLET" | "CASH",
  idempotency_key: string          // UUID, tránh đặt trùng
}
```

**Output cần trả về:**
```json
{
  "ok": true,
  "data": {
    "order_id": "4801",
    "total_charged": 105000,
    "eta_min": 25,
    "status": "confirmed"
  },
  "error": null
}
```

---

## 5. Intent Taxonomy

### 5.1 Global Intents (hoạt động ở mọi state)

| Intent | Ý nghĩa | Ví dụ user nói |
|---|---|---|
| `GLOBAL_CANCEL` | Hủy flow hiện tại | "hủy", "mình muốn hủy" |
| `GLOBAL_BACK` | Quay lại bước trước | "quay lại" |
| `GLOBAL_REPEAT` | Lặp lại câu vừa nói | "lặp lại", "nói lại" |
| `GLOBAL_REPEAT_OPTIONS` | Đọc lại danh sách lựa chọn | "đọc lại lựa chọn" |
| `GLOBAL_MORE_OPTIONS` | Xem thêm lựa chọn (pagination) | "nghe thêm", "còn gì nữa" |
| `GLOBAL_HELP` | Hướng dẫn sử dụng | "trợ giúp", "hướng dẫn" |
| `GLOBAL_READ_ORDER` | Đọc lại giỏ hàng | "đọc lại đơn", "giỏ hàng có gì" |
| `GLOBAL_PAUSE` | Tạm dừng | "tạm dừng" |
| `GLOBAL_RESUME` | Tiếp tục / bước kế (trong NAV) | "tiếp tục", "tiếp" |
| `GLOBAL_STOP` | Hủy đặt xe | "dừng lại", "stop" |
| `CONFIRM_YES` | Xác nhận đồng ý | "đúng rồi", "ừ", "ok", "xác nhận" |
| `CONFIRM_NO` | Từ chối | "không", "sai rồi", "không phải" |

### 5.2 NAV Intents

| Intent | Slots | Ví dụ |
|---|---|---|
| `NAVIGATE` | `destination_query: string` | "đặt xe tới nhà sách", "dẫn mình tới sân bay" |
| `SELECT_OPTION` | `option_index: number` hoặc `option_name: string` | "số 1", "Fahasa" |
| `REQUEST_SUGGESTIONS` | — | "gợi ý" |

### 5.3 FOOD Intents

| Intent | Slots | Ví dụ |
|---|---|---|
| `ORDER_FOOD` | `food_query?: string`, `quantity?: number` | "đặt cho mình phở" |
| `CHOOSE_BY_DISH` | `food_query: string` | "muốn ăn cơm tấm" |
| `CHOOSE_BY_RESTAURANT` | `restaurant_query: string` | "quán Ba Ghiền" |
| `SELECT_OPTION` | `option_index: number` / `option_name: string` | "số 1" |
| `SELECT_ITEM` | `item_query: string` / `item_id: string` | "phở tái nạm" |
| `SET_QUANTITY` | `quantity: number` | "hai phần", "3" |
| `ADD_MORE_ITEM` | — | "thêm món nữa" |
| `CHECKOUT` | — | "thanh toán" |
| `APPLY_VOUCHER` | `voucher_index?: number` | "số 1" |
| `SKIP_VOUCHER` | — | "bỏ qua" |
| `SELECT_PAYMENT` | `payment_method: "WALLET" \| "CASH"` | "tiền mặt", "ví điện tử" |

### 5.4 Fallback Intents

| Intent | Ý nghĩa |
|---|---|
| `UNKNOWN` | Không nhận dạng được (STT fail hoặc user nói không rõ) |
| `OUT_OF_SCOPE` | Nhận dạng được nhưng không liên quan ("hôm nay trời đẹp") |

---

## 6. Data Types Reference

### 6.1 `OptionEntry` — Lựa chọn hiện tại

```typescript
{
  index: number,              // 1, 2, 3...
  ref_type: "PLACE" | "RESTAURANT" | "ITEM" | "VOUCHER" | "PAYMENT" | "GENERIC",
  ref_id: string,             // ID tham chiếu (place_id, restaurant_id, item_id, voucher code)
  label: string               // Tên hiển thị
}
```

### 6.2 `ActiveCart` — Giỏ hàng

```typescript
{
  cart_id: string,
  restaurant_id: string,
  restaurant_name: string,
  items: [
    {
      item_id: string,
      name: string,
      unit_price: number,       // VND
      qty: number,
      line_total: number        // unit_price * qty
    }
  ],
  subtotal: number,             // tổng trước shipping + voucher
  voucher: {
    code: string,
    discount: number
  } | null,
  shipping_fee: number,
  total: number,                // subtotal + shipping_fee - discount
  currency: "VND"
}
```

### 6.3 `ActiveBooking` — Chuyến xe đang đặt

```typescript
{
  booking_id: string,            // "BK101"
  place_id: string,              // "p_fahasa_nh"
  place_name: string,            // "Nhà sách Fahasa Nguyễn Huệ"
  address: string,               // "40 Nguyễn Huệ, Quận 1"
  vehicle_type: string,          // "BIKE" | "CAR_4" | "CAR_7"
  vehicle_label: string,         // "Xe máy" | "Xe 4 chỗ" | "Xe 7 chỗ"
  price: number,                 // VND
  driver_name: string,           // "Nguyễn Văn An"
  driver_phone: string,          // "0901234567"
  license_plate: string,         // "59A1-12345"
  eta_min: number,               // phút tài xế đến
  status: string                 // "confirmed" | "pending" | "completed" | "cancelled"
}
```

### 6.4 `PendingConfirmation` — Đang chờ xác nhận

```typescript
{
  kind: "APPLY_VOUCHER" | "PLACE_ORDER" | "START_NAV" | "CANCEL_CONFIRM",
  payload_ref: string,          // ID liên quan (place_id, cart_id, voucher_code)
  prompt_said: string           // câu đã hỏi user
}
```

### 6.5 `NLGResponse` — Response từ NLG

```typescript
{
  ssml: string,                 // SSML cho TTS
  plain_text: string,           // text thuần, cho hiển thị
  earcon_pre: string | null,    // âm thanh trước response
  earcon_post: string | null,   // "turn_cue" (beep mở mic) hoặc "success"
  expects_input: boolean,       // true = mở mic chờ user nói
  expected_intents: string[]    // danh sách intent mong đợi
}
```

---

## 7. Error Handling

### 7.1 Error response format

```json
{
  "ok": false,
  "error": "Session xxx not found"
}
```

HTTP status codes:
- `400` — Bad request (thiếu params)
- `404` — Session not found
- `500` — Internal error (pipeline fail)

### 7.2 Dialog retry logic

- Mỗi state cho phép tối đa **3 lần retry** (`MAX_RETRY = 3`)
- Nếu vượt retry → tự reset về IDLE với message "Mình chưa hiểu. Quay lại đầu nhé."
- STT retry: tối đa **2 lần** nếu confidence < 40%

### 7.3 UNKNOWN/OUT_OF_SCOPE handling

Khi LLM NLU trả về UNKNOWN hoặc OUT_OF_SCOPE:
- **IDLE/GREETING:** "Mình chưa nghe rõ. Bạn có thể nói chi tiết hơn không? Mình có thể giúp bạn đặt xe hoặc đặt đồ ăn."
- **Trong flow (NAV/FOOD):** nudge lại context hiện tại, ví dụ "Mình đang chờ bạn chọn quán. 1: Phở Hòa, 2: Phở Lệ. Nói số quán hoặc tên khác."

---

## 8. Flow Diagrams

### 8.1 Complete turn lifecycle

```
Client                          Server
  │                               │
  ├── POST /turn ──────────────→  │
  │   { session_id, audio }       │
  │                               ├─ 1. Lookup session
  │                               ├─ 2. STT: audio → transcript (Google/VNPT)
  │                               │      retry nếu confidence < 40%
  │                               ├─ 3. NLU: transcript → { intent, slots }
  │                               │      LLM (gpt-5.5) + full conversation history
  │                               │      fallback to keyword NLU nếu LLM fail
  │                               ├─ 4. Dialog Manager: (intent, slots, state) → next_state + nlg_request
  │                               │      gọi backend API nếu cần (search, menu, order...)
  │                               ├─ 5. NLG: nlg_request → plain_text + ssml
  │                               ├─ 6. TTS: plain_text → audio WAV base64
  │                               ├─ 7. Save session + conversation history
  │                               │
  │  ◄── { ok, data: { ... } } ──┤
  │                               │
  ├─ Phát audio_url               │
  ├─ Hiển thị response_text       │
  ├─ Cập nhật UI theo state       │
  └─ Mở mic nếu expects_input    │
```

### 8.2 Khi nào `expects_input = true`?

- Hầu hết các state trả `expects_input: true` (mở mic)
- Exception: khi response kết thúc bằng "!" (thông báo xong, chờ tự nhiên)
- Mobile nên tự mở mic khi `expects_input: true` để tiếp tục hội thoại liền mạch

### 8.3 Conversation history

LLM NLU nhận **full conversation history** (tối đa 10 turn gần nhất = 20 messages) để hiểu context. Ví dụ khi user đang ở SET_QUANTITY và nói "hai", LLM biết đó là số lượng chứ không phải SELECT_OPTION nhờ context trước đó.

---

## Appendix: Quick Start cho Mobile

```bash
# 1. Tạo session
curl -X POST http://localhost:8000/session \
  -H "Content-Type: application/json" \
  -d '{"user_id": "mobile_user_1"}'

# 2. Gửi text turn
curl -X POST http://localhost:8000/turn \
  -H "Content-Type: application/json" \
  -d '{"session_id": "SESSION_ID_TỪ_BƯỚC_1", "transcript": "dẫn mình tới nhà sách"}'

# 3. Gửi audio turn
curl -X POST http://localhost:8000/turn \
  -H "Content-Type: application/json" \
  -d '{"session_id": "SESSION_ID", "audio_base64": "UklGR...", "sample_rate": 16000}'

# 4. Xem session state
curl http://localhost:8000/session/SESSION_ID
```

**Audio format yêu cầu:** WAV, LINEAR16, mono, 16000 Hz (hoặc gửi `sample_rate` nếu khác).
