# ARCHITECTURE.md — Kiến trúc Hệ thống

---

## Tổng quan

```
                    ┌─────────────────────────────┐
                    │        React Web App         │
                    │  (Vite + TS + TailwindCSS)   │
                    └──────────────┬──────────────┘
                                   │ HTTPS / WS
                    ┌──────────────▼──────────────┐
                    │        Express API           │
                    │     (Node.js + TypeScript)   │
                    └──┬──────┬──────┬──────┬─────┘
                       │      │      │      │
            ┌──────────▼─┐ ┌──▼───┐ ┌▼────┐ ┌▼──────────┐
            │ PostgreSQL │ │Mongo │ │Redis│ │Meilisearch│
            │  (Prisma)  │ │  DB  │ │     │ │  (Search) │
            └────────────┘ └──────┘ └─────┘ └───────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │        BullMQ Workers        │
                    │  (Email / Audio / Notif)     │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         Supabase               │
                    │   (Audio files + Images)     │
                    └─────────────────────────────┘
```

---

## Luồng Request chuẩn

```
Client Request
    │
    ▼
Rate Limiter Middleware (Redis)
    │
    ▼
Auth Middleware (verify JWT)
    │
    ▼
Role Guard Middleware (kiểm tra permission)
    │
    ▼
Zod Validation (validate body/params/query)
    │
    ▼
Controller (nhận req, gọi service)
    │
    ▼
Service (business logic)
    │
    ├──► Prisma (PostgreSQL)
    ├──► Redis (cache)
    ├──► MongoDB (history/logs)
    └──► BullMQ (async jobs)
    │
    ▼
Response (chuẩn format JSON)
```

---

## Authentication Flow

```
[Đăng nhập]
    │
    ▼
Validate email + password (Zod)
    │
    ▼
Check rate limit (Redis: max 5 lần / 15 phút)
    │
    ▼
Verify password (bcrypt compare)
    │
    ▼
Tạo Access Token (JWT, 15 phút)
Tạo Refresh Token (JWT, 7 ngày) → lưu Redis
    │
    ▼
Trả về { accessToken, refreshToken }

─────────────────────────────────

[Refresh Token]
    │
    ▼
Verify Refresh Token (JWT)
    │
    ▼
Kiểm tra Redis — token có bị blacklist không?
    │
    ▼
Tạo Access Token mới
Rotate Refresh Token (xóa cũ, tạo mới)

─────────────────────────────────

[Logout]
    │
    ▼
Blacklist Refresh Token (thêm vào Redis set, TTL = thời gian còn lại)
```

---

## Audio Upload & Processing Flow

```
Artist upload file audio (FE)
    │
    ▼
FE gọi API → BE tạo signed upload URL (Supabase)
    │
    ▼
FE upload trực tiếp lên Supabase Storage (bypass BE)
    │
    ▼
FE báo BE "upload xong" (callback)
    │
    ▼
BE tạo bản ghi Song (status: PENDING)
BE đẩy job vào BullMQ queue: "process-audio"
    │
    ▼
Worker nhận job:
    ├── Download từ Supabase Storage
    ├── FFmpeg: convert → 128kbps (Free) + 320kbps (Premium)
    ├── Extract metadata (duration, format)
    └── Upload lại Supabase Storage (processed/)
    │
    ▼
Worker cập nhật Song record (đủ metadata)
Thông báo Moderator có bài mới cần duyệt
```

---

## Realtime (Socket.IO) — Các sự kiện

| Event                      | Chiều           | Mô tả                                       |
| -------------------------- | --------------- | ------------------------------------------- |
| `player:sync`              | server → client | Đồng bộ trạng thái player giữa các thiết bị |
| `player:queue_update`      | client → server | Cập nhật hàng đợi                           |
| `notification:new`         | server → client | Đẩy thông báo mới đến user                  |
| `moderation:song_approved` | server → artist | Bài hát được duyệt                          |
| `moderation:song_rejected` | server → artist | Bài hát bị từ chối                          |
| `collab:playlist_update`   | server → room   | Collaborative playlist có thay đổi          |

---

## Phân chia trách nhiệm Database

### PostgreSQL (nguồn sự thật chính)

- users, roles, permissions
- songs, albums, artists
- playlists, playlist_songs
- subscriptions, payments, invoices
- strikes, reports
- audit_logs

### MongoDB (dữ liệu thời gian thực, khối lượng lớn)

- listening_history (user_id, song_id, played_at, duration_played)
- notifications (user_id, type, payload, read, created_at)
- recently_played (user_id, items[], updated_at)

### Redis (tạm thời, tốc độ cao)

- refresh_token:{user_id} → token string (TTL 7 ngày)
- blacklist:{token_jti} → 1 (TTL = thời gian còn lại của token)
- login_attempts:{email} → count (TTL 15 phút)
- cache:top_charts → JSON (TTL 1 giờ)
- cache:discover_weekly:{user_id} → JSON (TTL 7 ngày)
- queue:{user_id} → JSON array (TTL 24 giờ)

---

## Subscription & Payment Flow

```
User chọn gói Premium
    │
    ▼
BE tạo payment order (VNPAY)
    │
    ▼
FE redirect đến VNPAY checkout
    │
    ▼
User thanh toán
    │
    ▼
VNPAY gọi webhook → BE
    │
    ▼
BE verify chữ ký VNPAY (idempotency check)
    │
    ▼
Cập nhật subscription status: active
Cập nhật user role: user_premium
Tạo Invoice record
    │
    ▼
BullMQ: gửi email xác nhận thanh toán
```

---

## BullMQ Queues

| Queue                 | Worker                 | Trigger                                                |
| --------------------- | ---------------------- | ------------------------------------------------------ |
| `email`               | email.worker.ts        | Gửi OTP, xác nhận đăng ký, thông báo thanh toán        |
| `audio-processing`    | audio.worker.ts        | Sau khi artist upload audio lên S3                     |
| `notification`        | notification.worker.ts | Tạo notification hàng loạt (artist ra bài mới)         |
| `discover-weekly`     | discover.worker.ts     | Cron job mỗi thứ Hai 00:00 — tạo playlist cá nhân hóa  |
| `subscription-expiry` | subscription.worker.ts | Cron job hàng ngày — kiểm tra subscription sắp hết hạn |
