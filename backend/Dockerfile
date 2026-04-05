# Thư mục build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy các file cấu hình package
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt dependencies (bao gồm cả devDeps để build)
RUN npm install

# Copy toàn bộ source code
COPY . .

# Tạo Prisma Client
RUN npm run prisma:generate

# Build ứng dụng NestJS
RUN npm run build

# Thư mục chạy thực tế (Runtime)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy các file cần thiết từ stage builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Mở port 3000 (đây là port bên trong container)
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "run", "start:prod"]
