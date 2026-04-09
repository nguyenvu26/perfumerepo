# Kế Hoạch Thiết Kế Hệ Thống Quản Lý Địa Chỉ & Tối Ưu Checkout (PerfumeGPT)

Tài liệu này trình bày chi tiết kế hoạch cải tiến luồng nhập địa chỉ khách hàng, tích hợp sâu với API Giao Hàng Nhanh (GHN) và xây dựng tính năng Sổ địa chỉ (Address Book).

---

## 1. Mục tiêu (Objectives)
*   **Chính xác:** Đảm bảo địa chỉ khách hàng chọn luôn tồn tại trong hệ thống GHN để tính phí ship và tạo đơn hàng không lỗi.
*   **UX Tối ưu:** Giảm thiểu việc gõ phím thủ công, thay thế bằng bộ chọn (Select/Combobox) thông minh.
*   **Tiện lợi:** Cho phép khách hàng lưu nhiều địa chỉ (Nhà riêng, Cơ quan...) và chọn nhanh khi Checkout.

---

## 2. Kiến trúc Dữ liệu (Database Schema)

### 2.1. Model `UserAddress` (Prisma)
Thêm model mới để quản lý nhiều địa chỉ cho mỗi người dùng.

```prisma
model UserAddress {
  id              String   @id @default(cuid())
  userId          String
  recipientName   String   // Tên người nhận
  phone           String   // Số điện thoại nhận hàng
  
  // Thông tin hành chính từ GHN
  provinceId      Int
  provinceName    String
  districtId      Int
  districtName    String
  wardCode        String
  wardName        String
  
  detailAddress   String   // Số nhà, tên đường
  isDefault       Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 2.2. Quan hệ (Relations)
*   **User:** Một `User` có nhiều `UserAddress`.
*   **Order:** Cập nhật bảng `Order` để lưu trữ thông tin địa chỉ đầy đủ (bao gồm cả các ID hành chính) để tra cứu trạng thái vận chuyển chính xác.

---

## 3. Lộ trình Thực hiện (Implementation Roadmap)

### Giai đoạn 1: Backend (Nền tảng)
1.  **Cập nhật Prisma Schema:** Chạy migration để thêm bảng `UserAddress`.
2.  **Phát triển `AddressesModule`:**
    *   `POST /addresses`: Thêm địa chỉ mới.
    *   `GET /addresses`: Lấy danh sách địa chỉ của user.
    *   `PATCH /addresses/:id`: Cập nhật địa chỉ.
    *   `DELETE /addresses/:id`: Xóa địa chỉ.
    *   `PATCH /addresses/:id/default`: Thiết lập địa chỉ mặc định.
3.  **Cập nhật `OrdersModule`:** Chấp nhận `addressId` từ frontend để tự động lấy thông tin giao hàng.

### Giai đoạn 2: Frontend Service & Logic
1.  **`address.service.ts`:** Xây dựng các hàm gọi API CRUD địa chỉ.
2.  **`ghn.service.ts`:** Đảm bảo các hàm lấy Province/District/Ward hoạt động mượt mà.

### Giai đoạn 3: UI/UX Components
1.  **`AddressPicker` Component:** 
    *   Bộ 3 Select liên kết (Tỉnh -> Huyện -> Xã).
    *   Sử dụng tìm kiếm (Searchable Select) để chọn nhanh.
2.  **`AddressCard` Component:** Hiển thị thông tin địa chỉ tóm tắt (Name, Phone, Address string).
3.  **`AddressForm` Component:** Dùng cho cả trang Profile (Thêm/Sửa) và trang Checkout (Nhập địa chỉ mới).

### Giai đoạn 4: Tích hợp Trang (Pages)
1.  **Trang Checkout (`/checkout`):**
    *   **Trạng thái 1 (Đã đăng nhập):** Hiển thị danh sách địa chỉ đã lưu. Có nút "Dùng địa chỉ khác".
    *   **Trạng thái 2 (Khách hoặc Địa chỉ mới):** Hiển thị `AddressPicker` + `Detail Input`. 
    *   Thêm checkbox "Lưu vào sổ địa chỉ" cho người dùng đã đăng nhập.
2.  **Trang Profile (`/dashboard/customer/addresses`):**
    *   Giao diện quản lý danh sách địa chỉ (CRUD).
    *   Đánh dấu địa chỉ mặc định.

---

## 4. Luồng hoạt động (User Flow)

### Tại Checkout:
1.  User vào trang Checkout.
2.  Hệ thống gọi `GET /addresses`.
3.  Nếu có địa chỉ mặc định -> Tự động chọn -> Gọi `GHN Calculate Fee` -> Hiển thị tổng tiền.
4.  Nếu User muốn đổi -> Click "Thay đổi" -> Hiển thị Modal/List các địa chỉ khác.
5.  Nếu User nhập mới -> Chọn Tỉnh/Huyện/Xã -> Phí ship cập nhật realtime khi chọn xong Phường/Xã.

---

## 5. Các lưu ý kỹ thuật
*   **Phí Ship:** Luôn tính lại phí ship mỗi khi thay đổi địa chỉ chọn hoặc nhập mới.
*   **Đồng bộ:** Khi xóa địa chỉ đang là "mặc định", cần tự động gán địa chỉ khác làm mặc định (nếu còn).
*   **Validation:** Tên người nhận và Số điện thoại là bắt buộc cho mỗi địa chỉ.
