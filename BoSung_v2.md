# 🎵 RingBeatMusic — Tính Năng Bổ Sung & Cải Thiện (v2)

> Tài liệu này tổng hợp toàn bộ đề xuất cải thiện và tính năng mới cho RingBeatMusic.
> Các mục được đánh dấu `[MỚI]` là đề xuất bổ sung ngoài bản gốc.

---

## 1. CẢI THIỆN HOMEPAGE

### 1.1 Gần đây (Recently Visited)
- Hiển thị những gì user đã tương tác gần nhất — không chỉ nghe mà cả xem profile
- Hành động được ghi lại:
  - Xem profile Artist → `{ type: ARTIST, targetId }`
  - Nghe bài hát → `{ type: SONG, targetId }`
  - Mở Playlist → `{ type: PLAYLIST, targetId }`
  - Mở Album → `{ type: ALBUM, targetId }`
- Hiển thị tối đa 8–12 item gần nhất
- Ẩn nếu nội dung đã bị BANNED/ARCHIVED
- Chỉ hiện khi đã đăng nhập
- Không duplicate (chỉ được hiện 1 lần nếu user nghe hay tương tác nhiều lần thì chỉ cần soft lên đầu)

### 1.2 Nghe lại (Listen Again)
- Khác "Gần đây" — chỉ tính nội dung đã thực sự **phát nhạc**
- `"Gần đây"` = Mọi tương tác | `"Nghe lại"` = Chỉ những gì đã PHÁT
- Nghe >= 30 giây → tính là đã nghe (chuẩn Spotify)
- Nghe < 30 giây → không tính (skip nhanh)
- Ưu tiên hiển thị bài nghe nhiều lần gần nhất

### 1.3 Được đề xuất cho hôm nay (Daily Mix)
- Khác "Dành cho bạn" — refresh **mỗi ngày**, mix giữa quen + mới
- Công thức gợi ý:
  - 40% — Genre nghe nhiều nhất tuần này
  - 30% — Artist đã follow có bài mới
  - 20% — Trending trong genre yêu thích
  - 10% — Khám phá ngẫu nhiên (chống filter bubble)
- Guest (chưa đăng nhập) → 100% Trending toàn hệ thống

### 1.4 Album có bài bạn thích `[MỚI]`
- Dựa vào danh sách bài đã **Like** của user
- Nếu bài hát đó thuộc 1 album → hiện album đó trên Homepage
- Gợi ý: "Bạn thích [Tên bài] — Album [Tên album] có thể bạn sẽ thích"

### 1.5 Artist bạn có thể thích `[MỚI]`
- Dựa vào các Artist user đã follow → gợi ý Artist cùng genre chưa follow
- Hiển thị dạng card ngang, tối đa 6 Artist

### 1.6 Playlist thịnh hành hôm nay `[MỚI]`
- Hiển thị Playlist công khai được follow/nghe nhiều nhất trong 24h
- Làm nổi bật playlist từ cộng đồng (không chỉ hệ thống)

---

## 2. CẢI THIỆN TRANG NHẠC

### 2.1 Tách Synced Lyrics ra LyricsPage riêng
- Tạo `/lyrics/:trackId` — trang chuyên biệt cho lời bài hát
- Cải thiện UI/UX TrackPage sau khi tách (gọn hơn, tập trung vào thông tin bài)
- LyricsPage có chế độ **fullscreen karaoke** với nền blur từ cover bài hát `[MỚI]`

### 2.2 PlaylistPage / AlbumPage
- Shuffle toàn bộ Playlist/Album
- Repeat toàn bộ Playlist/Album
- Xem dưới dạng:
  - **Danh sách** — đầy đủ thông tin (title, artist, duration, added by)
  - **Rút gọn** — chỉ hiện cover + tên

---

## 3. QUEUE (DANH SÁCH CHỜ)

### 3.1 Tính năng Queue đầy đủ
- Playlist/Album queue — tự load toàn bộ bài khi bấm Play
- Auto tạo queue khi User play 1 single song (gợi ý bài tiếp theo)
- Thêm bài hát vào danh sách chờ qua submenu (chuột phải hoặc `...`)
- Manual Queue ưu tiên phát trước Auto Queue

### 3.2 Queue Page `[MỚI]`
- Trang xem toàn bộ queue hiện tại
- Cho phép kéo thả (drag & drop) để sắp xếp lại thứ tự
- Xóa bài khỏi queue
- Phân biệt rõ **Manual Queue** vs **Auto Queue** bằng visual

---

## 4. TRẢI NGHIỆM NGHE NHẠC

### 4.1 Toàn màn hình (Fullscreen Mode)
- User nhấn icon toàn màn hình ở Playbar → vào chế độ fullscreen
- Hiển thị: Cover lớn, Canvas (nếu có), Lyrics đồng bộ, nút điều khiển
- Phím tắt `F` hoặc `Escape` để thoát `[MỚI]`

### 4.2 Resizer Layout
- Kéo thả để resize **LeftBar** (thư viện)
- Kéo thả để resize **NowPlayingRightBar**
- Kéo thả để resize **FriendActivity sidebar**
- Nhớ kích thước sau khi refresh (lưu vào localStorage) `[MỚI]`

### 4.3 Keyboard Shortcuts `[MỚI]`
| Phím | Hành động |
|---|---|
| `Space` | Play / Pause |
| `→` | Next track |
| `←` | Previous track |
| `S` | Toggle Shuffle |
| `R` | Toggle Repeat |
| `F` | Fullscreen |
| `L` | Like bài đang phát |
| `Ctrl + F` | Mở Search |

### 4.4 Miniplayer khi chuyển trang `[MỚI]`
- Khi navigate sang trang ngoài app (hoặc thu nhỏ cửa sổ) → hiện Miniplayer nhỏ góc màn hình
- Giữ trạng thái phát nhạc liên tục

---

## 5. TÌM KIẾM

### 5.1 Recent Search
- Searchbar xổ ra các tìm kiếm gần đây khi user nhấn vào
- Hiển thị tối đa 8 từ khóa gần nhất
- Nút xóa từng mục hoặc xóa tất cả lịch sử

### 5.2 Gợi ý tìm kiếm thông minh `[MỚI]`
- Gợi ý realtime khi đang gõ (autocomplete)
- Phân loại kết quả gợi ý: Bài hát / Artist / Album / Playlist
- Highlight từ khóa khớp trong kết quả

---

## 6. THƯ VIỆN & ĐIỀU HƯỚNG (LEFTBAR)

### 6.1 Context Menu chuột phải LeftBar
- Chuột phải vào khu vực Library → menu:
  - Tạo Playlist mới
  - Tạo Playlist từ bài đã Like `[MỚI]`
  - Sắp xếp (theo tên / ngày tạo / gần đây nhất) `[MỚI]`

### 6.2 Ghim Playlist/Album lên đầu `[MỚI]`
- User có thể ghim tối đa 5 mục lên đầu LeftBar
- Phân biệt bằng icon ghim

---

## 7. CÀI ĐẶT (SETTINGS)

### 7.1 Tài khoản
- Thay đổi Avatar / Username / Display Name
- Đổi mật khẩu
- Liên kết / Hủy liên kết tài khoản Google
- Xóa tài khoản (GDPR)

### 7.2 Ngôn ngữ
- Tiếng Việt 🇻🇳
- Tiếng Anh 🇺🇸
- Tiếng Nhật 🇯🇵
- Tiếng Trung 🇨🇳

### 7.3 Theme & Giao diện
- Dark / Light / System mode
- Màu nhấn (Accent color): Tím / Xanh / Đỏ / Cam / Hồng `[MỚI]`
- Chất lượng hiển thị ảnh: Tự động / Cao / Tiết kiệm data `[MỚI]`

### 7.4 Phát nhạc `[MỚI]`
- Chất lượng âm thanh: 128kbps / 320kbps (Premium)
- Crossfade giữa các bài (0–12 giây)
- Normalize âm lượng (tránh bài quá to/nhỏ đột ngột)
- Tự động phát bài tiếp theo

---

## 8. SỬA LỖI & CẢI THIỆN KỸ THUẬT

### 8.1 Hiển thị đúng số Followers
- ArtistPage và NowPlayingSidebar đang hiển thị cứng `125.000`
- Cần query thật từ DB: `COUNT(*) FROM FollowedArtist WHERE artistId = ?`

### 8.2 Cải thiện UI Admin & Artist Dashboard
- Thống nhất design system giữa các dashboard
- Thêm skeleton loading thay vì spinner
- Responsive cho màn hình nhỏ hơn `[MỚI]`

### 8.3 "Thêm vào Playlist" từ bất kỳ đâu `[MỚI]`
- Context menu toàn cục (chuột phải vào bất kỳ bài hát nào)
- Không bắt buộc phải vào TrackPage mới thêm được

---

## 9. TÍNH NĂNG XÃ HỘI

### 9.1 Friend Activity (hoàn thiện Phase 16)
- WebSocket realtime — xem bạn bè đang nghe gì
- Hiển thị ở sidebar phải
- Toggle bật/tắt trong Settings > Quyền riêng tư

### 9.2 Share nâng cao `[MỚI]`
- Share bài hát kèm **timestamp** (chia sẻ đúng đoạn hay)
- Generate ảnh card đẹp để share lên mạng xã hội (như Spotify Wrapped card)
- QR Code cho bài hát / playlist

---

## 10. ƯU TIÊN THỰC HIỆN (SUGGESTED ORDER)

```
🔴 Gấp (Bug / Đang dở):
├── Sửa số Followers hiển thị sai
├── Hoàn thiện Friend Activity (Phase 16 còn [ ])
└── Queue đầy đủ (Phase 3 mới có Mini Queue)

🟡 Quan trọng (UX lớn):
├── Gần đây + Nghe lại (HomePage)
├── Fullscreen Mode
├── LyricsPage tách riêng
└── Recent Search + Autocomplete

🟢 Mở rộng (Nice to have):
├── Keyboard Shortcuts
├── Resizer Layout
├── Theme Accent Color
├── Share với timestamp + QR Code
└── Miniplayer
```
