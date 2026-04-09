# GHN SHIPPING INTEGRATION PLAN (PRODUCTION-READY)

## 1. Overview

### Goal

Integrate GHN (Giao Hàng Nhanh) shipping into system to support:

* Shipping fee calculation
* Order creation
* Order tracking
* Address synchronization
* Webhook-based status update

---

## 2. Scope

### Included

* Address API (province, district, ward)
* Shipping fee calculation
* Create shipping order
* Webhook handling
* Tracking API
* Retry + Queue
* Idempotency

### Excluded

* Multi-provider (GHTK, Viettel Post)
* AI optimization

---

## 3. GHN APIs Used

### 3.1 Address APIs

* GET /master-data/province
* GET /master-data/district
* GET /master-data/ward

---

### 3.2 Shipping APIs

* POST /shipping-order/preview (estimate fee + ETA)
* POST /shipping-order/create (create order)
* POST /shipping-order/detail-by-client-code (tracking)

---

## 4. System Architecture

Frontend → Backend (NestJS) → Shipping Module → GHN API

Modules:

* Address Service
* Fee Service
* Shipping Service
* Webhook Service
* Tracking Service

---

## 5. Database Design (Prisma)

### 5.1 Address

model Address {
id          String   @id @default(cuid())
userId      String

provinceId  Int
districtId  Int
wardCode    String

detail      String

createdAt   DateTime @default(now())
}

---

### 5.2 ShippingOrder

model ShippingOrder {
id              String   @id @default(cuid())
orderId         String   @unique

ghnOrderCode    String?  @unique
clientOrderCode String   @unique

status          String
subStatus       String?

fee             Int?
eta             DateTime?

rawData         Json?

createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
}

---

### 5.3 Idempotency

model IdempotencyKey {
id        String   @id @default(cuid())
key       String   @unique
createdAt DateTime @default(now())
}

---

## 6. API Design (Internal)

### 6.1 Address APIs

GET /shipping/provinces
GET /shipping/districts?provinceId=
GET /shipping/wards?districtId=

---

### 6.2 Fee Calculation

POST /shipping/fee

Request:
{
"districtId": number,
"wardCode": string,
"weight": number,
"value": number
}

Response:
{
"fee": number,
"eta": string
}

---

### 6.3 Create Shipping

POST /shipping/create

---

### 6.4 Tracking

GET /shipping/:orderId

---

## 7. Core Flows

---

### 7.1 Checkout Flow

User selects address
→ FE sends provinceId, districtId, wardCode
→ Backend calls GHN preview API
→ return fee + ETA

---

### 7.2 Create Shipping Flow

Order created
→ enqueue job `create_shipping`
→ call GHN create order API
→ save ghnOrderCode

---

### 7.3 Tracking Flow

Webhook → update DB
OR
Cron job → sync GHN

---

## 8. GHN Payload Mapping

### Request (Create Order)

{
"payment_type_id": 2,
"required_note": "KHONGCHOXEMHANG",
"to_district_id": number,
"to_ward_code": string,
"weight": number,
"items": [...]
}

---

### Response

{
"order_code": string,
"total_fee": number,
"expected_delivery_time": string
}

---

## 9. Idempotency Strategy

Key format:
create_shipping_{orderId}

Rules:

* Check before create GHN order
* Prevent duplicate shipping

---

## 10. Queue & Retry (Bull/Redis)

Jobs:

* create_shipping
* sync_shipping

Retry:

* max 3 times
* exponential backoff

DLQ:

* log failed jobs

---

## 11. Webhook Handling

Endpoint:
POST /webhook/ghn

Flow:

* Find shipping by ghnOrderCode
* Update shipping status
* Update order status

---

## 12. Status Mapping

| GHN Status    | System Status |
| ------------- | ------------- |
| ready_to_pick | CONFIRMED     |
| picking       | PROCESSING    |
| delivering    | SHIPPING      |
| delivered     | DELIVERED     |
| cancel        | CANCELLED     |

---

## 13. Cron Sync (Backup)

Schedule: every 10 minutes

Steps:

* call GHN detail API
* update status

---

## 14. Caching Strategy

Use Redis:

* provinces: TTL 24h
* districts: TTL 24h
* wards: TTL 24h

Fallback:

* DB cache if GHN unavailable

---

## 15. Error Handling

* GHN timeout → retry queue
* Invalid address → validation
* Duplicate order → idempotency
* Webhook fail → cron sync

---

## 16. Security

* Store GHN token in ENV
* Validate webhook (IP/signature)
* Rate limit shipping APIs

---

## 17. Admin Features

* View shipping orders
* Retry shipping
* Manual sync status
* Cancel shipping

---

## 18. Testing Plan

### Unit Test

* ghn.service
* mapping logic

### Integration Test

* create order → create shipping

### E2E Test

* checkout → tracking

---

## 19. Development Timeline

Phase 1 (2-3 days)

* Address API + cache
* Fee API

Phase 2 (3-4 days)

* Create shipping
* Idempotency

Phase 3 (2-3 days)

* Webhook + tracking

Phase 4 (2 days)

* Queue + retry + cron

Phase 5 (1-2 days)

* Admin features

---

## 20. Final Checklist

* [ ] Address sync
* [ ] Fee calculation
* [ ] Create shipping
* [ ] Save ghnOrderCode
* [ ] Webhook update
* [ ] Tracking API
* [ ] Retry queue
* [ ] Cron sync
* [ ] Admin tools

---

## 21. Notes

* Always use GHN IDs (districtId, wardCode)
* Never call GHN directly from frontend
* Use webhook instead of polling
* Always store order_code from GHN
* Use preview API before create order

---
