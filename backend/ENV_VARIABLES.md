# Biến môi trường cần thiết

## Database
```env
DATABASE_URL="postgresql://user:password@localhost:5432/perfume_gpt?schema=public"
```

## JWT Authentication
```env
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800
```

## Server
```env
PORT=3000
NODE_ENV=development
```

## Cloudinary (Cho Product Images)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Cách lấy Cloudinary credentials:

1. Đăng ký/Đăng nhập tại https://cloudinary.com/
2. Vào Dashboard → Settings → Upload
3. Copy các giá trị:
   - **Cloud Name**: Tên cloud của bạn
   - **API Key**: Key để upload
   - **API Secret**: Secret key (giữ bí mật)

## Ví dụ file .env hoàn chỉnh:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/perfume_gpt?schema=public"

# JWT
JWT_ACCESS_SECRET=super_secret_access_key_change_in_production
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800

# Server
PORT=3000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=perfume-gpt
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```
