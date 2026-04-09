# Kế hoạch triển khai (Implementation Plan) - V2

Hệ thống: Giảm giá (Discounts) & Điểm thưởng (Loyalty Points)

---

## 1. Nhánh: `feat/product-variants-refactor` [DONE ✅]

---

## 2. Nhánh: `feat/discount-systems` [DONE ✅]
- [x] Backend: CẬP NHẬT schema (PromotionCode, AppliedPromotion)
- [x] Backend: Viết Service/Controller cho Promotions (Validate, List, Create, Delete)
- [x] Backend: Tích hợp logic giảm giá vào `OrdersService`
- [x] Frontend: Service tích hợp API `validate`
- [x] Frontend: Giao diện nhập Coupon trên trang Checkout (Aura Aesthetics)

---

## 3. Nhánh: `feat/loyalty-points` (TIẾP THEO 🚀)
**Mục tiêu:** Tích lũy điểm khi mua hàng và đổi điểm thành voucher/giảm giá.

### Bước 1: Database (Backend)
- [ ] **Prisma:** Thêm model `LoyaltyTransaction`:
    ```prisma
    model LoyaltyTransaction {
      id          String    @id @default(cuid())
      userId      String
      orderId     String?
      points      Int       // Số điểm (+ hoặc -)
      reason      String    // EARNED_FROM_ORDER, REDEEMED_FOR_DISCOUNT, etc.
      createdAt   DateTime  @default(now())
      user        User      @relation(fields: [userId], references: [id])
    }
    ```
- [ ] **User Model:** Thêm trường `loyaltyPoints Int @default(0)`

### Bước 2: Logic tích điểm (Backend)
- [ ] **OrdersService:** Khi đơn hàng hoàn thành (`status: COMPLETED`), cộng điểm dựa trên tỉ lệ (ví dụ: 10,000đ = 1 điểm).
- [ ] **LoyaltyService:** Hàm đổi điểm (ví dụ: 100 điểm = 50,000đ giảm giá).

### Bước 3: Giao diện (Frontend)
- [ ] **Profile/Dashboard:** Hiển thị số dư điểm và lịch sử giao dịch điểm.
- [ ] **Checkout:** Thêm checkbox "Dùng XXX điểm để giảm giá ZZZ VNĐ".

---

## 4. Nhánh: `feat/admin-dash-promo`
**Mục tiêu:** Quản lý mã giảm giá tập trung cho Admin.

- [ ] UI/UX nâng cao để tạo mã (chọn loại giảm giá, ngày hết hạn, v.v.)
- [ ] Thống kê hiệu quả của từng mã (đã dùng bao nhiêu lần).
