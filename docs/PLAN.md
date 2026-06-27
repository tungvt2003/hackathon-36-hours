# Suara — Implementation Plan

> Source of truth. Tick `[x]` khi xong. Không làm gì ngoài danh sách này.
> Luôn đọc `docs/Application_Context.md` nếu cần clarify scope.

---

## Trạng thái tổng quan

```
FLOW: Voice → STT → NLU → [confirm missing] → Partner ERP → Quote → Confirm → Voice back
```

---

## ✅ Đã có (không làm lại)

- [x] NestJS project scaffold (api + mobile monorepo)
- [x] Prisma: `User`, `Order`, `OrderEvent`, `Place`, `ConversationSession`
- [x] Migration init + food_erp applied
- [x] STT module (mock + Whisper, toggle `PROVIDER_STT`)
- [x] NLU module (mock rule-based + non-diacritic fallback)
- [x] Places module (mock + DB provider)
- [x] Weather module (mock)
- [x] `OrdersService.processVoice` — branch FOOD vs RIDE
- [x] `OrdersService.confirmOrder`, `getOrderStatus`
- [x] `RestaurantsService` — findByKeyword, resolveItems, quoteAllPartners
- [x] Controller: `/orders/voice`, `/orders/confirm`, `/orders/:id/status`, `/restaurants`, `/restaurants/:id/menu`
- [x] `types.ts`: FoodQuote, OrderedItem, OrderStatus mở rộng, PartnerCode + SHOPEE
- [x] RIDE flow end-to-end hoạt động
- [x] FOOD flow end-to-end hoạt động (tested)

---

## ⚠️ Phase 1.5 — Refactor: Per-Partner Tables (PHẢI LÀM TRƯỚC KHI TIẾP)

> **Lý do:** Hiện tại `Restaurant`, `MenuItem`, `PartnerRestaurant` shared 1 bảng — sai về kiến trúc.
> Thực tế: Grab có DB riêng, Be có DB riêng. Gửi quote → gửi 3 payload độc lập cho 3 bên.
> Mỗi adapter chỉ được biết bảng của mình. Đổi sang real API sau → chỉ sửa adapter đó.

### 1.5.1 Xoá bảng shared (sai kiến trúc)

- [x] Drop khỏi schema: `Restaurant`, `MenuCategory`, `MenuItem`, `PartnerRestaurant`, `Promotion`, `Driver`, `PartnerRate`
- [x] Apply via `prisma db push --accept-data-loss`

### 1.5.2 Thêm bảng per-partner vào Prisma schema

**Grab** (food + ride):
- [x] `GrabRestaurant`
- [x] `GrabMenuItem`
- [x] `GrabRideOption`
- [x] `GrabDriver`
- [x] `GrabPromotion`

**Be** (food + ride):
- [x] `BeRestaurant`
- [x] `BeMenuItem`
- [x] `BeRideOption`
- [x] `BeDriver`
- [x] `BePromotion`

**Xanh SM** (ride only):
- [x] `XanhSmRideOption`
- [x] `XanhSmDriver`

**Shopee** (food only):
- [x] `ShopeeRestaurant`
- [x] `ShopeeMenuItem`
- [x] `ShopeeDriver`
- [x] `ShopeePromotion`

**Suara own** (thêm mới):
- [x] `OrderReview` — id, orderId (unique), restaurantRating (1-5), driverRating (1-5), voiceText?, createdAt

### 1.5.3 Migration

- [x] Schema updated + `prisma db push` applied
- [x] `prisma generate` — client regenerated

---

## Phase 2 — Seed Data (Per-Partner) ✅

> Mỗi partner seed data riêng, không share. File: `prisma/seed.ts`

### 2.1 Grab seed

- [x] `GrabRestaurant`: Phở Hà Nội (4.7), Cơm Tấm Thuận Kiều (4.6), KFC Bến Thành (4.3)
- [x] `GrabMenuItem`: 17 items, giá riêng cho Grab
- [x] `GrabRideOption`: GrabCar 85k, GrabBike 35k
- [x] `GrabDriver`: 5 tài xế (3 Car + 2 Bike), location Q1
- [x] `GrabPromotion`: PERCENT 20% (min 50k, cap 30k), FREE_DELIVERY (min 80k)

### 2.2 Be seed

- [x] `BeRestaurant`: Bún Bò Huế Bà Mỹ (4.8), Cơm Tấm Thuận Kiều (4.5)
- [x] `BeMenuItem`: 9 items (ít hơn Grab, giá rẻ hơn ~5k)
- [x] `BeRideOption`: beCar 72k, beBike 30k
- [x] `BeDriver`: 4 tài xế (2 Car + 2 Bike), location Q1
- [x] `BePromotion`: FREE_DELIVERY (min 50k), FIXED 10k (min 30k)

### 2.3 Xanh SM seed

- [x] `XanhSmRideOption`: XanhSM Car 68k (VinFast)
- [x] `XanhSmDriver`: 3 tài xế (Car only — VinFast), location Q1

### 2.4 Shopee seed

- [x] `ShopeeRestaurant`: Phở Hà Nội (4.6), Bún Bò Huế Bà Mỹ (4.9), KFC Bến Thành (4.2)
- [x] `ShopeeMenuItem`: 14 items, giá hơn Grab ~3k
- [x] `ShopeeDriver`: 4 shipper (Shopee Bike), location Q1
- [x] `ShopeePromotion`: FIXED 15k (min 40k), PERCENT 15% chỉ Phở Hà Nội (min 60k, cap 20k)

---

## Phase 3 — FOOD Order Flow (Backend) ✅

### 3.1 Adapter interface (inline trong RestaurantsService)

- [x] `searchRestaurants(query)` — fan-out Grab + Be + Shopee song song
- [x] `resolveItems(restaurantId, partner, items)` — query đúng bảng partner
- [x] `calcQuote(restaurant, items)` — subtotal + promo + driver per-partner
- [x] `DbPartnersService` (RIDE) → dùng GrabRideOption/BeRideOption/XanhSmRideOption

### 3.2 Multi-restaurant match ✅

- [x] Fan-out song song, aggregate, sort rating cao nhất trước
- [x] 2+ kết quả → TTS đọc list "1. Shopee 65k, 2. Grab 67k..."
- [x] 0 kết quả → hỏi lại user
- [x] NLU extended: parse "com ga", "pho bo", "bun bo hue" không dấu

### 3.3 Rating display logic ✅

- [x] `displayRating = SuaraAvgRating ?? partnerRating`
- [x] `enrichRating()` query AVG từ `OrderReview.restaurantRating` per restaurantId+partner
- [x] `searchRestaurants` + `listAll` sort theo `displayRating`
- [x] `PartnerRestaurant` interface có `displayRating` + `reviewCount`

### 3.4 Done

- [x] `buildFoodResponseText` — TTS đọc từng option
- [x] FOOD order save DB với cost breakdown
- [x] `GET /restaurants`, `GET /restaurants/:id/menu?partner=`, `GET /orders/:id/status`

---

## Phase 4 — Multi-turn ConversationSession ✅

### 4.1 ConversationService

- [x] `POST /conversation/start` → tạo `ConversationSession`, return `{ sessionId, promptText }`
- [x] `POST /conversation/input { sessionId, transcript }`:
  - Load session → NLU parse → merge intent
  - Detect missing: FOOD cần `food_query` (restaurant hoặc items), RIDE cần `destination`
  - Còn thiếu → `{ state: 'COLLECTING', missingField, promptText }`
  - Đủ → chạy `processVoice` → return quotes + `state: 'ORDERING'`
- [x] `POST /conversation/confirm { sessionId, partner }` → `confirmOrder` → `state: 'DONE'`
- [x] `ConversationModule` registered trong AppModule

### 4.2 Prompt text

- [x] `food_query` missing → *"Bạn muốn đặt ở quán nào? Hoặc cho tôi biết bạn muốn ăn món gì?"*
- [x] `destination` missing → *"Bạn muốn đến đâu?"*
- [x] NLU ride fix: parse `den/toi` (không dấu) sang destination

---

## Phase 5 — Order State Machine ✅

- [x] `runStateMachine(orderId, partner)` fire-and-forget sau `confirmOrder`
- [x] T+5s → `DRIVER_ASSIGNED` + gán driver từ per-partner pool + `driverName` cache
- [x] T+30s → `IN_TRANSIT`
- [x] T+120s → `DELIVERED` + TTS prompt đánh giá
- [x] Mỗi bước tạo `OrderEvent`
- [x] `GET /orders/:id/status` trả `partnerDriverId` + `driverName`

---

## Phase 6 — OrderReview (Voice Rating) ✅

- [x] `POST /orders/:id/review { restaurantRating, driverRating, voiceText }`
- [x] Upsert vào `OrderReview` table
- [x] TTS sau DELIVERED: *"Bạn thấy thế nào? Nói 'tốt', 'bình thường', hoặc 'kém'."*
- [x] Driver earn 50 AccessPoints khi `driverRating >= 4`
- [x] Rating feed vào `enrichRating()` → sort `searchRestaurants` (Phase 3.3)

---

## Phase 7 — Disability Toggle & Driver Notification ✅

- [x] `Order.accessibilityFlag` field
- [x] `confirmOrder` với `accessibilityFlag: true` → return `driverNotification { message, bonusPoints: 50 }`
- [x] `VoiceOrderDto.accessibilityFlag` DTO field

---

## Phase 8 — Mobile (React Native) ✅

- [x] `expo-speech` installed, `speak()` helper gọi TTS tiếng Việt
- [x] Conversation flow: IDLE → COLLECTING → QUOTING → TRACKING → DELIVERED → REVIEWING
- [x] `POST /conversation/start|input|confirm` — multi-turn với session
- [x] Show foodQuotes + rideQuotes, sort theo giá
- [x] Poll `GET /orders/:id/status` mỗi 5s → TTS đọc khi state đổi
- [x] Star rating UI sau DELIVERED → `POST /orders/:id/review`
- [x] Disability toggle (Switch) → gửi `accessibilityFlag` khi confirm
- [x] `api.ts` refactored: `api.conversation.*`, `api.orders.*`
- [x] `types.ts` sync đầy đủ: FoodQuote, OrderStatus mở rộng, SHOPEE

---

---

## Phase 9 — Partner-Sim HTTP Fan-Out ✅

> **Lý do:** Không query DB trực tiếp trong Suara service. Mỗi partner có endpoint HTTP riêng.
> Mobile → Suara → Promise.all([grab, be, xanhsm/shopee]) → aggregate → trả về.

### 9.1 partner-sim module (giả lập API của từng đối tác)

- [x] `POST /partner-sim/grab/ride/quote` → query GrabRideOption + GrabDriver
- [x] `POST /partner-sim/be/ride/quote` → query BeRideOption + BeDriver
- [x] `POST /partner-sim/xanhsm/ride/quote` → query XanhSmRideOption + XanhSmDriver
- [x] `POST /partner-sim/grab/food/search` → keyword search GrabRestaurant
- [x] `POST /partner-sim/be/food/search` → keyword search BeRestaurant
- [x] `POST /partner-sim/shopee/food/search` → keyword search ShopeeRestaurant
- [x] `POST /partner-sim/grab/food/quote` → subtotal + GrabPromotion + GrabDriver
- [x] `POST /partner-sim/be/food/quote` → subtotal + BePromotion + BeDriver
- [x] `POST /partner-sim/shopee/food/quote` → subtotal + ShopeePromotion + ShopeeDriver
- [x] `POST /partner-sim/*/confirm` → partner ghi nhận đơn, sinh mã đơn nội bộ

### 9.2 Refactor Suara services dùng HTTP (không query DB trực tiếp)

- [x] `DbPartnersService` (RIDE): dùng `HttpService` fan-out 3 partner-sim ride endpoints song song
- [x] `RestaurantsService` (FOOD search): dùng `HttpService` fan-out 3 partner-sim food/search song song
- [x] `RestaurantsService` (FOOD quote): HTTP tới đúng partner-sim food/quote endpoint
- [x] `HttpModule` thêm vào `RestaurantsModule`, `PartnersModule`, `AppModule`
- [x] `PARTNER_SIM_URL` env var (default `http://localhost:3000` — cùng process)

---

## Phase 10 — Location-Aware Restaurant Search ✅

> **Lý do:** User ở Thủ Đức không thể đặt quán ở Quận 1 — cần filter theo GPS thật của user.

### 10.1 Schema (Prisma)

- [x] `GrabRestaurant`: thêm `lat Float?`, `lng Float?`
- [x] `BeRestaurant`: thêm `lat Float?`, `lng Float?`
- [x] `ShopeeRestaurant`: thêm `lat Float?`, `lng Float?`
- [ ] Deploy: `prisma db push --accept-data-loss` trên server (đã tích hợp trong entrypoint.sh)

### 10.2 Seed Data cập nhật

- [x] Gán tọa độ thật (HCM) cho các quán Q1 hiện có (Grab/Be/Shopee)
  - Phở Hà Nội: `10.7682, 106.6947`
  - Cơm Tấm Thuận Kiều: `10.7795, 106.7010`
  - KFC Bến Thành: `10.7736, 106.6955`
  - Bún Bò Bà Mỹ (Bùi Viện): `10.7679, 106.6907`
- [x] Thêm quán Thủ Đức (`~10.849, 106.756`) — mỗi partner 1 quán:
  - Grab: Phở Hà Nội (Thủ Đức) + Cơm Tấm Sài Gòn (Thủ Đức)
  - Be: Bún Bò Huế (Thủ Đức)
  - Shopee: Phở Hà Nội (Thủ Đức)
- [x] Mỗi quán mới có menu items đầy đủ để pass `resolveItems()`

### 10.3 Backend — Location Filter

- [x] `PartnerSimService.grabFoodSearch/beFoodSearch/shopeeFoodSearch`: nhận `userLat?, userLng?`
- [x] `filterByQuery()`: áp dụng **Haversine** radius ≤ 20km — không có fallback, trả empty nếu không có quán nào gần user
- [x] `PartnerSimController.PartnerFoodSearchRequest`: thêm `userLat?, userLng?`
- [x] `RestaurantsService.searchRestaurants(query, userLat?, userLng?)`: forward coords vào HTTP payload
- [x] `OrdersService.processFoodOrder()`: nhận `currentLat?, currentLng?`, truyền sang `searchRestaurants`
- [x] `OrdersService.processVoice()`: truyền `currentLat/currentLng` sang `processFoodOrder` (trước chỉ truyền cho RIDE)
- [x] `matches.length === 0` message context-aware: có GPS → *"Không có quán X nào gần bạn trong 20km"*, không có GPS → *"Không tìm thấy quán X"*
- [x] `ConversationService.input()`: nhận `userLat?, userLng?`, truyền sang `processVoice`
- [x] `ConversationController.InputDto`: thêm `userLat?, userLng?` optional fields

### 10.4 Mobile

- [x] `expo-location` installed (`npx expo install expo-location`)
- [x] `app.json` — iOS: `NSLocationWhenInUseUsageDescription`; Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`; plugin: `expo-location`
- [x] `api.ts`: `conversation.input(sid, text, userLat?, userLng?)` — gửi coords trong body
- [x] `VoiceAssistant/index.tsx`:
  - State `userLocation: { lat, lng } | null`
  - `useEffect` on mount: `requestForegroundPermissionsAsync()` → `getCurrentPositionAsync()` → lưu vào state
  - GPS lỗi → silently fall back (không block flow)
  - `submitTranscript` dùng `userLocation?.lat/lng` khi gọi `api.conversation.input`

### 10.5 Cần làm sau khi merge

- [ ] `docker compose down -v && docker compose up -d --build` trên server (để schema được push + seed chạy lại)
- [ ] Build APK mới: `eas build --platform android --profile preview`

---

## Phase 11 — LLM-based NLU (chờ OpenRouter key, chưa triển khai)

> **Lý do:** `MockNluProvider` rule-based brittle — regex fail khi STT chèn từ giữa câu, không hiểu ngữ cảnh.
> Thay bằng LLM qua OpenRouter, giữ contract `Intent` không đổi → không đụng `OrdersService`/`ConversationService`.
> **Block lại chờ:** API key OpenRouter + xác nhận tên model thật (`openai/gpt-5.5` hay tên khác).

### 11.1 Provider mới

- [ ] `apps/api/src/nlu/llm-nlu.provider.ts` — implement `NluProvider`
- [ ] Gọi `POST https://openrouter.ai/api/v1/chat/completions`
- [ ] `response_format: { type: 'json_schema', json_schema: <Intent schema> }` — ép model trả đúng shape `Intent` (`type`, `origin?`, `destination?`, `restaurant?`, `items?`, `note?`, `confidence`)
- [ ] System prompt tiếng Việt: trích xuất ý định đặt xe/đồ ăn, không tự bịa địa điểm/món không có trong câu nói
- [ ] Timeout ~2.5s (`AbortController`) cho call LLM

### 11.2 Fallback an toàn

- [ ] LLM fail/timeout/parse lỗi → tự fallback gọi `MockNluProvider.parse()` (rule-based cũ) — không chặn conversation lúc demo nếu key/API lỗi
- [ ] Giữ `MockNluProvider` y nguyên, không xoá

### 11.3 Wiring

- [ ] `nlu.module.ts` — thêm case `provider === 'openai'`, đọc `OPENROUTER_API_KEY`, `NLU_MODEL` từ `ConfigService`
- [ ] `.env.example` — thêm `OPENROUTER_API_KEY=`, `NLU_MODEL=openai/gpt-5.5`, `PROVIDER_NLU=mock` (default an toàn, đổi `openai` khi sẵn sàng)
- [ ] Không sửa `OrdersService`, `ConversationService`, partner-sim — contract `Intent` không đổi

### 11.4 Điều kiện bắt đầu code

- [ ] Có `OPENROUTER_API_KEY` thật
- [ ] Xác nhận tên model chính xác trên OpenRouter
- [ ] Test 1 request thủ công (curl) confirm `response_format json_schema` hoạt động với model đó trước khi viết provider

---

## Thứ tự làm (ưu tiên hackathon)

```
[NGAY BÂY GIỜ — bắt buộc trước khi tiếp]
Phase 1.5 (refactor per-partner tables) → Phase 2 (reseed) → Phase 3 (update adapters + multi-match)

[Tiếp theo]
Phase 4 (multi-turn) → Phase 5 (state machine)

[Cuối]
Phase 6 (review) → Phase 7 (disability) → Phase 8 (mobile) → Phase 9 (partner-sim HTTP fan-out)
```

---

## Quy tắc

1. Tick `[x]` ngay khi xong task
2. Không làm feature ngoài danh sách này
3. Mỗi Phase phải test được trước khi sang Phase tiếp
4. Nếu cần thay đổi scope → cập nhật file này trước, không tự ý code
