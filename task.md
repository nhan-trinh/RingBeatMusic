# Spotify Clone - Project Roadmap & Task Tracker

Dưới đây là tiến độ tổng quan của toàn bộ dự án dựa trên tài liệu kiến trúc.

## ✅ Các Phase Đã Hoàn Tất
- [x] **Phase 1: Foundation & Authentication**
  - Setup Monorepo, Database Schema.
  - Đăng ký/Đăng nhập JWT, xác thực OAuth Google.
  - Quản lý User Profile cơ bản.
- [x] **Phase 2: Home Feed & Discovery**
  - UI Trang chủ (Mixes, Top Hits, Newly Added).
  - Khám phá theo Thể loại (Genres) & Nghệ sĩ.
- [x] **Phase 3: Music Player & Streaming Core**
  - Thanh Player toàn cục với Howler.js (Play/Pause, Seek, Volume).
  - Mini Queue & Up next logic.
  - Shuffle & Repeat mode.
- [x] **Phase 4: Library & User Collections**
  - Chức năng Like Song (Bài hát yêu thích).
  - Tự tạo Custom Playlist (Follow/Unfollow).
  - State Management đồng bộ thư viện mượt mà.
- [x] **Phase 5: Artist Dashboard Core**
  - UI Khởi tạo hồ sơ Nghệ sĩ (Setup Profile).
  - Tổng quan Dashboard (Overview).
- [x] **Phase 6: Artist Content Management**
  - Tải bài hát lên bằng Audio File (Supabase Storage).
  - CRUD (Sửa/Xoá) bài hát và Albums.
  - Analytics đếm số lượt Follower và Play Count.

---

## 🚀 Các Phase Tiếp Theo (Roadmap 5/10 -> 10/10 Spotify)

- [x] **Phase 7: Quản Trị Viên & Kiểm duyệt Nội Dung (Admin & Moderator Panel)**
  - [x] Moderator duyệt bài hát do Artist upload (Pending → Approved / Rejected).
  - [x] Admin Dashboard cơ bản quản lý File, User, Nghệ sĩ và các Role.
  - [x] Khóa tài khoản/Cảnh cáo user vi phạm nội dung (Strike system).

- [x] **Phase 8: Hệ Thống Thông Báo & Cảnh Báo Real-time (Notification Center)**
  - [x] Xây dựng giao diện "Chuông thông báo" trên Topbar.
  - [x] Push thông báo thời gian thực bằng Socket.io.
  - [x] Quản lý trạng thái Đã đọc / Chưa đọc.
  - [x] Tính năng Xóa thông báo & Điều hướng thông minh (Deep Linking).
  - [x] **Bonus**: Hoàn thiện trang chi tiết bài hát `/track/:id` (TrackPage).

- [ ] **Phase 9: User Profile & Account Settings (Hồ sơ người dùng)**
  - Màn hình Mini Profile cho Free User / Premium User.
  - Cài đặt tài khoản (Đổi mật khẩu, Xoá tài khoản GDPR).
  - Lịch sử nghe nhạc gần đây (Recently played) & Cập nhật trạng thái "Now Playing" lên Profile.

- [ ] **Phase 10: Audio Processing Worker (FFmpeg & BullMQ)**
  - Xây dựng Worker xử lý tệp MP3 ở Backend (Convert sang `128kbps` tiêu chuẩn và `320kbps` cho Premium).
  - Hỗ trợ Crossfade & Equalizer ở phía frontend Player.

- [ ] **Phase 11: Tối Ưu Tìm Kiếm (Meilisearch Integration)**
  - Tích hợp Engine `Meilisearch` để tìm kiếm siêu tốc bài hát/artist/album/playlist có dấu hoặc không dấu.
  - Bảng xếp hạng Top Charts / Trending dựa trên dữ liệu realtime.

- [ ] **Phase 12: Giao diện "Đang phát" & Spotify Canvas (Now Playing View)**
  - Sidebar bên phải hiển thị chi tiết bài hát, ảnh nghệ sĩ và mục "About Artist".
  - Hỗ trợ Spotify Canvas: Hiển thị video loop ngắn (<10s) hoặc ảnh thay cho bìa đĩa (Art).
  - Tích hợp hiệu ứng giao diện mượt mà (Glassmorphism).

- [ ] **Phase 13: Lời bài hát đồng bộ (Synced Lyrics)**
  - Hiển thị Lyrics tĩnh hoặc Lyrics đồng bộ chạy theo nhạc (Chỉ dành cho tài khoản Premium).

- [ ] **Phase 14: Thuật toán Gợi ý Nhạc (Discover Weekly)**
  - Phân tích `PlayHistory` của người dùng (bằng MongoDB) để sinh ra Playlist "Khám phá hàng tuần".
  - Đề xuất tự động (Auto-play) bài hát cùng thể loại khi User nghe hết Queue hiện tại.

- [ ] **Phase 15: Gói Đăng Ký Premium (VNPAY)**
  - Quản lý các gói Free, Individual, Duo, Family, Student.
  - Chức năng Auto-renew và xem Invoice mua hàng.
  - Bật / Khóa chất lượng âm thanh 320kbps và tính năng tải Offline theo hạng thành viên.

- [ ] **Phase 16: Tính Năng Xã Hội (Theo dõi Bạn Bè & Collaborative Playlist)**
  - WebSockets (Socket.io) xem trực tiếp bạn bè đang nghe bài hát gì (Friend Activity).
  - Collaborative Playlists: Nhiều User cùng đóng góp thêm bài hát vào một Playlist chung.
  - Báo cáo và Share Link bài hát.

- [ ] **Phase 17: Podcasts & Audiobooks**
  - Quản lý Role `Podcast Host` tạo Audio Shows.
  - Nhớ tiến độ (timestamp) nghe dở Podcast.
  - Listener có thể Q&A / Comment chéo với Host.

- [ ] **Phase 18: Admin Analytics & Cấu Hình Hệ Thống (Admin 2.0)**
  - Thống kê biểu đồ doanh thu, tỷ lệ Retention, Tăng trưởng.
  - System Audit Logs (Ghi lại thao tác của Admin/Mod vào MongoDB).
  - Bật/Tắt Feature Flags hoặc chế độ bảo trì (Maintenance Mode).
