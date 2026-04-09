# Hướng dẫn cấu hình Cloudinary cho Product Images

## 📋 Tổng quan

Backend đã được cấu hình để sử dụng Cloudinary để lưu trữ hình ảnh sản phẩm. Mỗi product có thể có tối đa 10 ảnh.

## 🔧 Cấu hình biến môi trường

### 1. Tạo tài khoản Cloudinary

1. Truy cập https://cloudinary.com/
2. Đăng ký tài khoản miễn phí (hoặc đăng nhập nếu đã có)
3. Vào Dashboard → Settings → Upload
4. Copy các thông tin sau:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Thêm biến môi trường vào `.env`

Thêm các dòng sau vào file `.env` trong thư mục `backend/`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Ví dụ:**
```env
CLOUDINARY_CLOUD_NAME=perfume-gpt
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 3. Cập nhật `.env.example`

File `.env.example` đã được cập nhật với các biến môi trường Cloudinary.

## 📦 Cài đặt đã hoàn thành

- ✅ `cloudinary` package đã được cài đặt
- ✅ `@nestjs/platform-express` và `multer` đã được cài đặt
- ✅ CloudinaryModule và CloudinaryService đã được tạo
- ✅ ProductImage model đã được thêm vào schema
- ✅ Upload endpoints đã được tạo

## 🗄️ Database Migration

Sau khi cập nhật schema, bạn cần chạy migration:

```bash
cd backend
npx prisma migrate dev --name add_product_images
npx prisma generate
```

## 📡 API Endpoints

### Upload Images (Admin only)
```
POST /api/v1/admin/products/:id/images
Content-Type: multipart/form-data

Body:
- images: File[] (max 10 files)
- orders: number[] (optional) - Display order for each image (0-9)
```

**Example using curl:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/admin/products/{productId}/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "orders=[0,1]"
```

### Delete Image (Admin only)
```
DELETE /api/v1/admin/products/:id/images/:imageId
```

### Get Product with Images
```
GET /api/v1/products/:id
```

Response sẽ bao gồm mảng `images`:
```json
{
  "id": "...",
  "name": "Product Name",
  "images": [
    {
      "id": 1,
      "url": "https://res.cloudinary.com/.../image.jpg",
      "publicId": "perfume-gpt/products/.../image",
      "order": 0
    }
  ]
}
```

## 🔒 Bảo mật

- Chỉ Admin mới có thể upload/delete images
- JWT authentication required
- Images được lưu trong folder `perfume-gpt/products/{productId}/`
- Tự động xóa images từ Cloudinary khi xóa product

## 📝 Lưu ý

1. **Giới hạn**: Mỗi product tối đa 10 ảnh
2. **Format**: Cloudinary tự động optimize (quality: auto, format: auto)
3. **Order**: Ảnh đầu tiên (order: 0) được coi là ảnh chính
4. **Xóa**: Khi xóa product, tất cả images sẽ tự động bị xóa khỏi Cloudinary

## 🧪 Testing

Sau khi cấu hình, bạn có thể test bằng cách:

1. Tạo một product mới
2. Upload images cho product đó
3. Kiểm tra response có chứa images
4. Xóa một image và kiểm tra nó đã bị xóa khỏi Cloudinary
