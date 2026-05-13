BƯỚC 1 — Kiến trúc Session mới
TRƯỚC (hiện tại):
Redis: { "refresh_token:userId": "token_abc" }  ← ghi đè mỗi lần login

SAU (multi-session):
PostgreSQL: bảng UserSession
┌─────────────────────────────────────────────────────┐
│ id          String   @id                            │
│ userId      String                                  │
│ tokenHash   String   @unique  ← hash của RT, không │
│                                 lưu token gốc       │
│ deviceName  String   ← "Chrome on Windows"         │
│ deviceType  String   ← "desktop" | "mobile"        │
│ os          String   ← "Windows 11"                │
│ browser     String   ← "Chrome 124"                │
│ ipAddress   String                                  │
│ location    String?  ← "Hà Nội, VN" (optional)     │
│ lastActiveAt DateTime                               │
│ createdAt   DateTime                                │
│ expiresAt   DateTime                                │
│ isRevoked   Boolean  @default(false)                │
└─────────────────────────────────────────────────────┘

Tại sao lưu tokenHash thay vì token gốc?
Refresh Token gốc = sensitive data
Nếu DB bị leak → attacker có toàn bộ token → chiếm tài khoản hàng loạt
tokenHash = SHA-256(refreshToken) → leak cũng vô dụng

BƯỚC 2 — Flow Login tạo Session mới
User đăng nhập
      ↓
1. Tạo Access Token  (JWT, TTL 15 phút)
2. Tạo Refresh Token (random uuid v4, TTL 30 ngày)
3. Parse User-Agent bằng ua-parser-js
      ↓
4. INSERT vào UserSession:
   {
     userId,
     tokenHash: SHA256(refreshToken),
     deviceName: "Chrome on Windows",
     os: "Windows 11",
     browser: "Chrome 124",
     ipAddress: req.ip,
     expiresAt: now + 30days
   }
      ↓
5. Trả về { accessToken, refreshToken } cho client
   (refreshToken lưu vào HttpOnly Cookie)

BƯỚC 3 — Flow Refresh Token
Client gửi Refresh Token (hết hạn Access Token)
      ↓
1. Hash RT nhận được: hash = SHA256(receivedToken)
2. Query DB: SELECT * FROM UserSession WHERE tokenHash = hash
3. Kiểm tra:
   ├── Không tìm thấy    → throw INVALID_TOKEN
   ├── isRevoked = true  → throw SESSION_REVOKED (đã logout từ xa)
   ├── expiresAt < now   → throw TOKEN_EXPIRED
   └── Hợp lệ           → tiếp tục
      ↓
4. Cấp Access Token mới
5. UPDATE lastActiveAt = now()
6. (Optional) Rotate Refresh Token — tạo RT mới, cập nhật tokenHash

BƯỚC 4 — Flow Đăng xuất từ xa (Remote Logout)
User mở trang "Thiết bị đang đăng nhập"
      ↓
Hiển thị danh sách sessions từ DB
      ↓
User bấm "Đăng xuất" trên thiết bị X
      ↓
PATCH /sessions/:sessionId/revoke
      ↓
UPDATE UserSession SET isRevoked = true WHERE id = sessionId AND userId = currentUserId
      ↓
Lần tiếp theo thiết bị X dùng Refresh Token
→ Query DB → isRevoked = true → trả về 401
→ Client tự redirect về trang Login

BƯỚC 5 — Giới hạn số Session (quan trọng)
Cần quyết định tối đa bao nhiêu session cùng lúc:

BƯỚC 6 — Hiển thị UI "Thiết bị đang đăng nhập"
GET /sessions  →  Trả về danh sách sessions của currentUser

Response:
[
  {
    id: "sess_abc",
    deviceName: "Chrome on Windows",
    os: "Windows 11",
    browser: "Chrome 124",
    ipAddress: "113.x.x.x",
    location: "Hà Nội, VN",
    lastActiveAt: "2 phút trước",
    isCurrent: true   ← session đang dùng để gọi API này
  },
  {
    id: "sess_xyz",
    deviceName: "Safari on iPhone",
    os: "iOS 17",
    browser: "Safari",
    lastActiveAt: "3 ngày trước",
    isCurrent: false
  }
]

