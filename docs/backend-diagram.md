# Backend Architecture Diagrams

> **⚠️ Lưu ý về dữ liệu đối tác**
>
> Tất cả bảng mang tên đối tác (`GrabRestaurant`, `BeRestaurant`, `ShopeeRestaurant`, `XanhSmRideOption`, v.v.) **đều là dữ liệu giả lập (mock/fixture) do team tự tạo**, không phải dữ liệu thật từ hệ thống của Grab / Be / Shopee / Xanh SM.
>
> Project **không tích hợp API thật** của bất kỳ đối tác nào. Các adapter (`grab.adapter.ts`, `be.adapter.ts`, `xanh-sm.adapter.ts`) chỉ đọc từ PostgreSQL nội bộ — dùng để mô phỏng luồng so sánh giá đa nền tảng cho mục đích hackathon demo.

## 1. Database Schema (ERD)

```mermaid
erDiagram
    User {
        String id PK
        String name
        String phone
        String savedAddress
        DateTime createdAt
    }
    Order {
        String id PK
        String userId FK
        String type "RIDE|FOOD"
        String origin
        String destination
        String deliveryAddress
        String partnerRestaurantId
        String restaurant
        Json items
        String status "QUOTED|CONFIRMED|DRIVER_ASSIGNED|IN_TRANSIT|DELIVERED|CANCELLED"
        String partner "GRAB|BE|XANH_SM|SHOPEE"
        String partnerDriverId
        String driverName
        Int subtotalVnd
        Int deliveryFeeVnd
        Int discountVnd
        Int totalVnd
        Int etaMinutes
        Boolean accessibilityFlag
        DateTime createdAt
    }
    OrderEvent {
        String id PK
        String orderId FK
        String step "STT|NLU|ENRICHMENT|PARTNER_QUOTE|CONFIRM|..."
        Json payload
        DateTime createdAt
    }
    OrderReview {
        String id PK
        String orderId FK
        Int restaurantRating
        Int driverRating
        String voiceText
        DateTime createdAt
    }
    ConversationSession {
        String id PK
        String userId FK
        String state "COLLECTING|CONFIRMING|ORDERING|TRACKING|DONE"
        Json intent
        String[] missingFields
        String orderId
        DateTime updatedAt
    }
    Place {
        String id PK
        String name
        String address
        Int openHour
        Int closeHour
        String[] keywords
        Boolean rainOverride
    }

    %% GRAB
    GrabRestaurant {
        String id PK
        String name
        String address
        Float lat
        Float lng
        Int openHour
        Int closeHour
        String cuisineType
        Float rating
        String[] keywords
        Int deliveryFeeVnd
        Boolean available
    }
    GrabMenuItem {
        String id PK
        String grabRestaurantId FK
        String categoryName
        String name
        Int priceVnd
        Boolean available
    }
    GrabRideOption {
        String id PK
        String serviceType "GrabCar|GrabBike"
        Int basePriceVnd
        Int etaMinutes
        Boolean available
    }
    GrabDriver {
        String id PK
        String name
        String vehicleType
        String vehiclePlate
        Float rating
        Boolean available
        Float currentLat
        Float currentLng
    }
    GrabPromotion {
        String id PK
        String grabRestaurantId FK
        String discountType "PERCENT|FIXED|FREE_DELIVERY"
        Int discountValue
        Boolean active
    }

    %% BE
    BeRestaurant {
        String id PK
        String name
        String address
        Float lat
        Float lng
        Int openHour
        Int closeHour
        String[] keywords
        Int deliveryFeeVnd
        Boolean available
    }
    BeMenuItem {
        String id PK
        String beRestaurantId FK
        String name
        Int priceVnd
        Boolean available
    }
    BeRideOption {
        String id PK
        String serviceType "beCar|beBike"
        Int basePriceVnd
        Int etaMinutes
        Boolean available
    }
    BeDriver {
        String id PK
        String name
        String vehicleType
        Boolean available
        Float currentLat
        Float currentLng
    }
    BePromotion {
        String id PK
        String beRestaurantId FK
        String discountType
        Int discountValue
        Boolean active
    }

    %% XANH SM (ride only)
    XanhSmRideOption {
        String id PK
        String serviceType "XanhSM Car"
        Int basePriceVnd
        Int etaMinutes
        Boolean available
    }
    XanhSmDriver {
        String id PK
        String name
        String vehicleType "XanhSM Car (VinFast)"
        Boolean available
        Float currentLat
        Float currentLng
    }

    %% SHOPEE (food only)
    ShopeeRestaurant {
        String id PK
        String name
        String address
        Int openHour
        Int closeHour
        String[] keywords
        Int deliveryFeeVnd
        Boolean available
    }
    ShopeeMenuItem {
        String id PK
        String shopeeRestaurantId FK
        String name
        Int priceVnd
        Boolean available
    }
    ShopeeDriver {
        String id PK
        String name
        String vehicleType "Shopee Bike"
        Boolean available
        Float currentLat
        Float currentLng
    }
    ShopeePromotion {
        String id PK
        String shopeeRestaurantId FK
        String discountType
        Int discountValue
        Boolean active
    }

    User ||--o{ Order : "places"
    User ||--o{ ConversationSession : "has"
    Order ||--o{ OrderEvent : "logs"
    Order ||--o| OrderReview : "reviewed_by"
    GrabRestaurant ||--o{ GrabMenuItem : "has"
    GrabRestaurant ||--o{ GrabPromotion : "has"
    BeRestaurant ||--o{ BeMenuItem : "has"
    BeRestaurant ||--o{ BePromotion : "has"
    ShopeeRestaurant ||--o{ ShopeeMenuItem : "has"
    ShopeeRestaurant ||--o{ ShopeePromotion : "has"
```

---

## 2. Voice Flow — FOOD Order Pipeline

```mermaid
sequenceDiagram
    participant Mobile
    participant VoiceFlowController
    participant VoiceFlowService
    participant RestaurantsService
    participant PrismaDB
    participant SessionCache

    Mobile->>VoiceFlowController: POST /voice-flow {step: "search_restaurant", query: "cơm"}
    VoiceFlowController->>VoiceFlowService: handle(req)
    VoiceFlowService->>RestaurantsService: searchRestaurants("cơm")
    RestaurantsService->>PrismaDB: query GrabRestaurant + BeRestaurant + ShopeeRestaurant
    PrismaDB-->>RestaurantsService: matched restaurants
    RestaurantsService-->>VoiceFlowService: restaurant list
    VoiceFlowService->>SessionCache: set(session_id, {intent, last_restaurants})
    VoiceFlowService-->>Mobile: {status:"success", data:{restaurants:[...]}}

    Mobile->>VoiceFlowController: POST /voice-flow {step: "select_restaurant", restaurant_id}
    VoiceFlowController->>VoiceFlowService: handle(req)
    VoiceFlowService->>PrismaDB: findUnique restaurant + include items
    PrismaDB-->>VoiceFlowService: restaurant + menu items
    VoiceFlowService->>SessionCache: merge(session_id, {selected_restaurant_id})
    VoiceFlowService-->>Mobile: {status:"success", data:{restaurant, items:[...]}}

    Mobile->>VoiceFlowController: POST /voice-flow {step: "confirm_order", restaurant_id, items, delivery_address}
    VoiceFlowController->>VoiceFlowService: handle(req)
    VoiceFlowService->>PrismaDB: findUnique each MenuItem → calc subtotal
    VoiceFlowService->>PrismaDB: order.create(status=QUOTED, totalVnd)
    PrismaDB-->>VoiceFlowService: order.id
    VoiceFlowService->>SessionCache: merge(session_id, {order_id})
    VoiceFlowService-->>Mobile: {status:"success", data:{order_id, order_summary, requires_confirmation:true}}
```

---

## 3. Voice Flow — RIDE Order Pipeline

```mermaid
sequenceDiagram
    participant Mobile
    participant VoiceFlowController
    participant VoiceFlowService
    participant PlacesProvider
    participant WeatherProvider
    participant PartnersService
    participant PrismaDB
    participant SessionCache

    Mobile->>VoiceFlowController: POST /voice-flow {step: "select_destination", destination: "Tân Sơn Nhất"}
    VoiceFlowController->>VoiceFlowService: handle(req)
    VoiceFlowService->>PlacesProvider: getStatus("Tân Sơn Nhất")
    PlacesProvider-->>VoiceFlowService: {name, address, lat, lng}
    VoiceFlowService->>WeatherProvider: getCurrent(destination, lat, lng)
    WeatherProvider-->>VoiceFlowService: {tempC, condition, willRain}
    Note over VoiceFlowService: Haversine distance if user GPS available
    VoiceFlowService->>SessionCache: set(session_id, {ride_destination, ride_distance_km, ride_will_rain})
    VoiceFlowService-->>Mobile: {status:"success", data:{destination, distance_km, weather}}

    Mobile->>VoiceFlowController: POST /voice-flow {step: "confirm_ride", destination}
    VoiceFlowController->>VoiceFlowService: handle(req)
    VoiceFlowService->>SessionCache: get(session_id) → distance_km, willRain
    VoiceFlowService->>PartnersService: quoteAll(intent)
    Note over PartnersService: Grab + Be + XanhSM adapters
    PartnersService-->>VoiceFlowService: rawQuotes[]
    Note over VoiceFlowService: price = base + distance×12k/km\n+20% surge nếu mưa
    VoiceFlowService->>PrismaDB: order.create(status=QUOTED, cheapest price)
    PrismaDB-->>VoiceFlowService: order.id
    VoiceFlowService->>SessionCache: merge(session_id, {order_id})
    VoiceFlowService-->>Mobile: {status:"success", data:{order_id, quotes[], surge_active}}
```

---

## 4. Order State Machine (Orders Legacy API)

```mermaid
stateDiagram-v2
    [*] --> QUOTED: voice processed\norder created

    QUOTED --> CONFIRMED: user confirms partner\nPOST /orders/:id/confirm

    CONFIRMED --> DRIVER_ASSIGNED: +5s auto-advance\npick available driver

    DRIVER_ASSIGNED --> IN_TRANSIT: +30s auto-advance

    IN_TRANSIT --> DELIVERED: +120s auto-advance

    DELIVERED --> [*]: POST /orders/:id/review\n(optional)

    QUOTED --> CANCELLED: cancel step\nor change_item/change_destination
    CONFIRMED --> CANCELLED: cancel step
    DRIVER_ASSIGNED --> CANCELLED: cancel step
    IN_TRANSIT --> CANCELLED: cancel step
```

---

## 5. Backend Module Architecture

```mermaid
graph TD
    subgraph API["NestJS API"]
        VC[VoiceFlowController\n/voice-flow]
        OC[OrdersController\n/orders]
        RC[RestaurantsController\n/restaurants]
        CC[ConversationController\n/conversation]
        PC[PartnerSimController\n/partner-sim]

        VFS[VoiceFlowService]
        OS[OrdersService]
        RS[RestaurantsService]
        CS[ConversationService]
        SC[SessionCacheService]

        STT[STT Provider\nWhisper / Mock]
        NLU[NLU Provider\nClaude / Mock]
        PLACES[Places Provider\nGoogle / SerpAPI / Mock]
        WEATHER[Weather Provider\nOpen-Meteo / Mock]
        PARTNERS[Partners Service\nGrab + Be + XanhSM adapters]

        DB[(PostgreSQL\nvia Prisma)]
    end

    VC --> VFS
    OC --> OS
    RC --> RS
    CC --> CS

    VFS --> RS
    VFS --> PLACES
    VFS --> WEATHER
    VFS --> PARTNERS
    VFS --> SC
    VFS --> DB

    OS --> STT
    OS --> NLU
    OS --> PLACES
    OS --> WEATHER
    OS --> PARTNERS
    OS --> RS
    OS --> DB

    RS --> DB
    CS --> DB
```

---

## 6. Partner Adapters

```mermaid
graph LR
    PS[PartnersService\nquoteAll / confirm]

    GA[GrabAdapter]
    BA[BeAdapter]
    XA[XanhSmAdapter]

    GDB[(GrabRideOption\nGrabRestaurant\nGrabDriver)]
    BDB[(BeRideOption\nBeRestaurant\nBeDriver)]
    XDB[(XanhSmRideOption\nXanhSmDriver)]

    PS --> GA --> GDB
    PS --> BA --> BDB
    PS --> XA --> XDB

    subgraph FoodPartners["Food Delivery"]
        GRAB_F[Grab Food]
        BE_F[Be Food]
        SHOPEE_F[Shopee Food]
    end

    subgraph RidePartners["Ride Hailing"]
        GRAB_R[Grab Ride]
        BE_R[Be Ride]
        XSM[Xanh SM Ride]
    end
```
