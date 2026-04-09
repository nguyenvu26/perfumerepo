## PerfumeGPT Backend – Kiến trúc & Kế hoạch Phát triển

### 1. Mục tiêu backend

- **Cung cấp API thống nhất** cho web (Next.js) và mobile (Flutter) phục vụ:
  - Đăng ký/đăng nhập (email + OAuth Google/Facebook).
  - Tư vấn nước hoa bằng AI (chatbot + quiz + semantic search).
  - Mua sắm omnichannel (online store + in-store POS).
  - Quản lý kho, đơn hàng, thanh toán, vận chuyển, CRM, loyalty, promotion.
- **Đảm bảo**: bảo mật (JWT + RBAC), mở rộng dễ dàng, logging/monitoring, dễ deploy.

---

### 2. Tech stack & kiến trúc tổng thể

- **Backend**: NestJS (Node.js, REST API, modular architecture).
- **Database**: PostgreSQL (quan hệ, hỗ trợ pgvector cho semantic search).
- **ORM**: Prisma (đã định nghĩa schema tại `prisma/schema.prisma`).
- **Cache & Queue**: Redis (session cache, rate limiting, background jobs).
- **AI integration**: xAI API (chatbot, quiz, semantic search, review summarization).
- **Auth**:
  - JWT access + refresh token.
  - OAuth2 (Google/Facebook) cho khách hàng và nhân viên.
  - Role-based access control (RBAC) cho Customer / Staff / Admin.
- **API style**:
  - RESTful, versioning theo `/api/v1/...`.
  - OpenAPI/Swagger cho tài liệu API.

**Kiến trúc NestJS đề xuất (thư mục `src/`):**

- `modules/`
  - `auth/` – đăng ký, đăng nhập, OAuth, refresh token.
  - `users/` – profile, preference, loyalty, CRM.
  - `products/` – sản phẩm, brand, category, scent notes, review, AI metadata.
  - `inventory/` – kho, nhập hàng, cảnh báo tồn.
  - `cart/` – giỏ hàng, áp mã giảm giá.
  - `orders/` – đơn hàng, trạng thái, lịch sử.
  - `payments/` – PAYOS, COD, webhook.
  - `shipping/` – GHN, GHTK, phí ship, tracking.
  - `pos/` – in-store POS (scan barcode, hóa đơn).
  - `ai/` – chatbot, quiz, semantic search, review summarization.
  - `promotions/` – campaign, promotion code, combo, free sample.
  - `notifications/` – email/SMS/in-app.
  - `analytics/` – dashboard, báo cáo.
  - `admin/` – quản lý user, role, cấu hình hệ thống.
- `common/`
  - `guards/` (AuthGuard, RolesGuard).
  - `interceptors/` (logging, transform).
  - `filters/` (global exception filter).
  - `decorators/` (CurrentUser, Roles, Public, ...).
  - `dto/`, `pipes/`, `utils/`.
- `config/` – cấu hình env, db, cache, external services.

---

### 3. Thiết kế database (Prisma + PostgreSQL)

**File**: `backend/prisma/schema.prisma`

- **Core user & auth**:
  - `User`, `Role`, `UserRole` – tài khoản, vai trò (Customer/Staff/Admin).
  - `OAuthAccount` – liên kết với Google/Facebook.
  - `Session` – quản lý refresh token, device, IP, thời hạn.
  - `UserProfile` – thông tin cá nhân, avatar, địa chỉ, khoảng budget.
- **Preference & quiz**:
  - `ScentFamily`, `ScentNote`, `ProductScentNote` – mô hình mùi hương (top/middle/base).
  - `UserScentPreference` – sở thích mùi của user.
  - `QuizResult` – kết quả quiz (giới tính, occasion, budget, longevity, recommendation).
- **Product & catalog**:
  - `Brand`, `Category`, `Product` – dữ liệu sản phẩm.
  - `ProductEmbedding` – vector (pgvector) cho semantic search & AI matching.
- **Inventory & store & POS**:
  - `Store` – cửa hàng.
  - `Inventory` – tồn kho theo store.
  - `StockMovement` – nhập/xuất/điều chỉnh/bán/đổi trả.
- **Cart & order & payment & shipping**:
  - `Cart`, `CartItem` – giỏ hàng theo user.
  - `Order`, `OrderItem` – đơn hàng, item.
  - `OrderStatusHistory` – lịch sử trạng thái đơn.
  - `Payment`, `PaymentEvent` – thanh toán PAYOS/COD, log event/webhook.
  - `Shipment`, `ShipmentHistory` – GHN/GHTK, theo dõi trạng thái giao hàng.
- **CRM, loyalty & promotion**:
  - `LoyaltyProgram`, `UserLoyaltyAccount`, `LoyaltyTransaction` – điểm, chương trình tích điểm.
  - `PromotionCampaign`, `PromotionRule`, `PromotionCode`, `PromotionProduct`, `AppliedPromotion` – campaign & áp dụng giảm giá/khuyến mãi.
- **Review & AI summarization**:
  - `Review`, `ReviewSummary` – đánh giá sản phẩm và tóm tắt AI.
- **Notifications & logs**:
  - `Notification` – email/SMS/in-app, status đã đọc.
  - `AiRequestLog` – log các request đến AI (chat, quiz, recommendation).
  - `AuditLog` – log hành động quan trọng của người dùng/admin.

Prisma sẽ được dùng để:

- Generate migration schema DB và client typesafe.
- Seed data ban đầu (role, admin, scent family mẫu, brand mẫu,...).

---

### 4. Nhóm API chính & contract tổng quát

**Base path**: `/api/v1`

- **Auth & User**:
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
  - `POST /auth/oauth/:provider` (Google/Facebook).
  - `GET /users/me`, `PUT /users/me`, `GET /users/me/loyalty`, `GET /users/me/orders`.
- **Product & discovery**:
  - `GET /products`, `GET /products/:id`, `GET /products/search`, `GET /products/:id/reviews`.
  - `GET /brands`, `GET /categories`, `GET /scent-families`, `GET /promotions/public`.
- **AI consultation & quiz**:
  - `POST /ai/chat` – chatbot tư vấn.
  - `POST /ai/quiz/start`, `POST /ai/quiz/answer`, `POST /ai/quiz/complete`.
  - `GET /ai/recommendations`, `GET /ai/recommendations/:id/explanation`.
- **Cart & order & payment & shipping**:
  - `GET/POST/PATCH/DELETE /cart/items`.
  - `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /orders/:id/tracking`.
  - `POST /payments/create`, `POST /payments/confirm`, `POST /payments/webhook/:provider`.
  - `POST /shipping/fee`, `GET /shipping/:id/status`.
- **POS & inventory (staff)**:
  - `POST /pos/orders`, `POST /pos/scan-barcode`, `GET /pos/daily-summary`.
  - `GET /inventory`, `POST /inventory/import`, `PATCH /inventory/:id`, `GET /inventory/alerts`.
- **Admin & analytics**:
  - `/admin/users`, `/admin/roles`, `/admin/products`, `/admin/stores`, `/admin/promotions`.
  - `/admin/analytics/revenue`, `/admin/analytics/top-products`, `/admin/analytics/ai-acceptance`.

Chi tiết DTO, status code, error format sẽ được mô tả thông qua Swagger trong code NestJS.

---

### 5. Kế hoạch phát triển backend theo giai đoạn

#### Giai đoạn 1 – Nền tảng & database (1–2 tuần)

- **Mục tiêu**:
  - Thiết lập NestJS (project structure, module core).
  - Kết nối PostgreSQL thông qua Prisma.
  - Tạo migration đầu tiên từ `schema.prisma`.
- **Công việc**:
  - Cấu hình `ConfigModule` (đọc `.env`, `DATABASE_URL`, `REDIS_URL`, ...).
  - Tạo `PrismaModule` + `PrismaService`.
  - Chạy `prisma migrate dev` và seed data (roles, admin, brand/scent mẫu).
  - Thêm Swagger (`/api/docs`) và endpoint `GET /health`.

#### Giai đoạn 2 – Auth, User, Profile, Preference (1–2 tuần)

- **Mục tiêu**:
  - Triển khai luồng đăng ký/đăng nhập, quản lý session & refresh token.
  - Cho phép người dùng cập nhật profile, preferences, xem loyalty cơ bản.
- **Công việc**:
  - `auth` module: JWT auth guard, strategy, login/register/refresh/logout.
  - Tích hợp OAuth2 provider (sau có thể mock hoặc dùng Google OAuth thật).
  - `users` module: CRUD profile, thiết lập scent preferences, get loyalty summary.
  - RBAC: `RolesGuard`, decorator `@Roles()`.

#### Giai đoạn 3 – Product, Search, AI nền (2–3 tuần)

- **Mục tiêu**:
  - Xây dựng catalog sản phẩm đầy đủ (brand, category, scent notes).
  - Hỗ trợ browse/search/filter + semantic search cơ bản.
  - Kết nối đến AI service cho tư vấn cơ bản.
- **Công việc**:
  - `products` module: CRUD admin, public API list/search/filter, chi tiết sản phẩm.
  - Seed dữ liệu scent notes (top/middle/base), scent family.
  - Thiết lập `ProductEmbedding` + job đồng bộ embedding (tạm thời vector lưu dạng string/JSON, về sau gắn pgvector).
  - `ai` module: service gọi xAI API, endpoint `POST /ai/chat`, log `AiRequestLog`.

#### Giai đoạn 4 – Cart, Order, Payment, Shipping (2–3 tuần)

- **Mục tiêu**:
  - Cho phép khách đặt hàng từ giỏ hàng, thanh toán online/offline, theo dõi vận chuyển.
- **Công việc**:
  - `cart` module: thêm/xoá/cập nhật item, apply promotion code.
  - `orders` module: tạo order từ cart, quản lý trạng thái, lịch sử.
  - `payments` module: tích hợp VNPay/Momo/COD (mức độ tối thiểu đủ demo: tạo URL thanh toán và webhook xác nhận).
  - `shipping` module: tích hợp GHN/GHTK (tối thiểu: tính phí ship + mock tracking hoặc tích hợp sandbox).

#### Giai đoạn 5 – POS, Inventory, CRM, Loyalty, Promotion (2–3 tuần)

- **Mục tiêu**:
  - Hỗ trợ bán hàng tại cửa hàng (POS), quản lý kho & chương trình khách hàng thân thiết.
- **Công việc**:
  - `pos` module: tạo đơn bán trực tiếp, quét barcode, xuất dữ liệu hóa đơn.
  - `inventory` module: nhập kho, điều chỉnh kho, theo dõi tồn & cảnh báo.
  - `loyalty` (trong `users`/`crm` module): cập nhật điểm tích luỹ khi mua hàng, API xem lịch sử điểm.
  - `promotions` module: định nghĩa campaign, rule áp mã giảm giá, combo, free sample.

#### Giai đoạn 6 – Notifications, Review + AI Summary, Analytics (2–3 tuần)

- **Mục tiêu**:
  - Hoàn thiện trải nghiệm: email/SMS/in-app, quản lý review, dashboard cho admin/staff.
- **Công việc**:
  - `notifications` module: abstraction gửi email/SMS (adapter cho SendGrid/SES/Twilio) + in-app notification.
  - `reviews` trong `products` module: tạo review, hiển thị, gọi AI để summarize.
  - `analytics` module: API số liệu revenue, top sản phẩm, tồn kho, hành vi user, acceptance rate của đề xuất AI.

#### Giai đoạn 7 – Hardening, Testing, CI/CD & Tài liệu (1–2 tuần)

- **Mục tiêu**:
  - Ổn định, an toàn, có test và pipeline triển khai.
- **Công việc**:
  - Bảo mật: CORS, Helmet, rate limiting, input validation đầy đủ (class-validator).
  - Logging & audit: interceptor log, `AuditLog` cho hành động quan trọng.
  - Test: unit test cho service chính, e2e test (auth, order, payment).
  - CI/CD: workflow chạy lint + test + build, deploy (tùy môi trường: Docker, VPS, cloud).

---

### 6. Next steps đề xuất cho bạn

- **Ngắn hạn**:
  - Cấu hình `DATABASE_URL`, cài Prisma client, chạy migration để tạo DB mới từ `schema.prisma`.
  - Tạo skeleton module NestJS như cấu trúc ở trên (auth, users, products, ...).
- **Trung hạn**:
  - Bắt đầu với Giai đoạn 2 (Auth + User) rồi kết nối dần với frontend web/mobile.
  - Dùng file này như tài liệu chính để báo cáo kiến trúc & roadmap backend trong đồ án.


