# voice-mobility

App đặt xe / đồ ăn bằng giọng nói cho người khiếm thị.

## Kiến trúc

```text
voice-mobility/
  apps/api/           - NestJS 11 + Prisma 7 (node_modules riêng)
  apps/mobile/        - Expo SDK 56 (node_modules riêng)
```

**Pipeline:** Người dùng nói → STT → NLU → Enrichment (places + weather) → Partner quotes (Grab/Be/Xanh SM) → responseText → TTS đọc lại.

Giai đoạn này: tất cả provider dùng Mock/DB seed. Phần Voice (STT/TTS) để sẵn interface, team implement sau.

---

## Chạy local

### 1. Khởi động Postgres

```bash
cd apps/api
cp .env.example .env       # lần đầu - chỉnh credentials nếu cần
docker compose up -d
cd ../..
```

Postgres chạy tại `localhost:5432`. Credentials lấy từ `apps/api/.env`.

### 2. Cài và setup database

```bash
cd apps/api
npm install
# (Sửa DATABASE_URL trong .env nếu cần - đã tạo ở bước 1)
npm run prisma:setup
```

> `prisma:setup` = `prisma migrate deploy` (áp migration có sẵn) + seed Places/PartnerRates vào DB.
> Migration files đã commit sẵn trong `prisma/migrations/` - **không cần** `migrate dev`.

### 3. Chạy API

```bash
# Từ thư mục gốc:
npm run dev:api

# hoặc từ apps/api:
npm run start:dev
```

API chạy tại `http://localhost:3000`

- Verify: `curl http://localhost:3000/health` → `{"ok":true}`
- Swagger UI: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`

### 4. Chạy Mobile

```bash
cd apps/mobile
npm install
npm start
```

### 5. Codegen types cho Mobile

**Cách 1 - từ API đang chạy:**

```bash
cd apps/mobile
npm run gen:types        # gọi http://localhost:3000/api-json
```

**Cách 2 - từ file (khi không có API):** Chạy `gen:openapi` trong API trước để sinh file, rồi:

```bash
# Trong apps/api (API phải đang chạy):
npm run gen:openapi      # → tạo openapi.json

# Trong apps/mobile:
npm run gen:types:file   # đọc ../api/openapi.json
```

> Sinh ra `src/api-types.ts` - import types từ đây, không viết tay.

> **Test trên điện thoại thật:** Sửa `apps/mobile/app.json` → `extra.apiUrl` thành IP LAN của máy chạy API.
>
> ```json
> "extra": { "apiUrl": "http://192.168.1.X:3000" }
> ```
>
> KHÔNG dùng `localhost` khi test trên thiết bị thật.

---

## Test API nhanh

```bash
# Pipeline đầy đủ
curl -X POST http://localhost:3000/orders/voice \
  -H "Content-Type: application/json" \
  -d '{"transcript": "dat xe tu nha den san bay Tan Son Nhat"}'

# Xác nhận đối tác (thay <orderId> bằng id trả về ở trên)
curl -X POST http://localhost:3000/orders/confirm \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<orderId>", "partner": "GRAB"}'

# Test riêng từng bước
curl -X POST http://localhost:3000/nlu \
  -H "Content-Type: application/json" \
  -d '{"transcript": "dat com tam quan Thuan Kieu"}'

curl "http://localhost:3000/places/status?q=tan+son+nhat"
curl "http://localhost:3000/weather?location=TP.HCM"
```

---

## Deploy server

1. Set biến môi trường trên server:

   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
   PORT=3000
   PROVIDER_STT=mock
   PROVIDER_NLU=mock
   PROVIDER_PLACES=db
   PROVIDER_WEATHER=mock
   PROVIDER_PARTNER=db
   ```

2. Build và migrate:

   ```bash
   cd apps/api
   npm install
   npm run prisma:setup
   npm run build
   npm run start:prod
   ```

---

## Thêm provider thật (hướng dẫn team)

Mỗi provider có 1 interface + 1 Mock. Để thêm provider thật:

1. Tạo file `apps/api/src/<module>/real-<name>.provider.ts` implement interface tương ứng.
2. Thêm `case 'tên-provider'` vào `useFactory` trong `<module>.module.ts`.
3. Set env `PROVIDER_<MODULE>=tên-provider` trên server.

### Thêm Voice (STT + TTS) cho Mobile

```bash
cd apps/mobile
npx expo install expo-audio expo-speech expo-haptics
```

Xem TODO trong `src/HomeScreen.tsx` để biết chính xác chỗ gắn.

---

## Cấu trúc modules API

| Module | Mô tả |
| --- | --- |
| `stt` | Speech-to-Text - Mock trả text cố định |
| `nlu` | Natural Language Understanding - Mock rule-based tiếng Việt |
| `places` | Trạng thái mở/đóng địa điểm - đọc từ DB (bảng Place) |
| `weather` | Thời tiết - Mock xoay vòng theo giờ |
| `partners` | Grab/Be/Xanh SM - đọc từ DB (bảng PartnerRate) |
| `orders` | Orchestrator - nối pipeline + lưu Prisma |
| `prisma` | Database service - global, fail-safe khi DB chưa chạy |
