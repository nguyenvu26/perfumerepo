# Stage 1: Cài đặt dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy các file cấu hình package máy local vào container
COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Build ứng dụng
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js thu thập dữ liệu ẩn danh, tắt đi để bảo mật
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Stage 3: Runner - Môi trường chạy Production nhẹ nhất
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permissions cho thư mục .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy output từ standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Chạy server.js được tạo ra bởi standalone mode
CMD ["node", "server.js"]
