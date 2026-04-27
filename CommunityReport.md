Chấp nhận ý kiến: Chỉ MODERATOR/ADMIN xem dashboard, Không tự động ẩn, làm thủ công trước
1) Ai được phép report?
User_free: Được report
USER_PREMIUM →  Được report  
ARTIST →  Được report (report bài của artist khác)
MODERATOR    →  Được report
ADMIN →  Không cần, ADMIN tự xử lý
2) Report cái gì?
Hiện tại:   Report → Song ✅
Nên thêm:   Report → Playlist (nội dung không phù hợp)
            Report → User (tài khoản spam, giả mạo)
3) Lý do report (reason) nên có enum thay vì free text:(Để Tiếng Việt nhé)
INAPPROPRIATE_CONTENT   // Nội dung không phù hợp
COPYRIGHT_VIOLATION     // Vi phạm bản quyền  
SPAM                    // Spam
FAKE_ACCOUNT            // Tài khoản giả mạo (cho report user)
HATE_SPEECH             // Ngôn từ thù địch
OTHER                   // Khác (kèm ghi chú)
4) Anti-abuse: Ngăn report spam
Mỗi user chỉ report 1 lần / 1 nội dung  →  @@unique([reportedBy, songId])
Rate limit: Tối đa 10 reports / ngày / user
User bị ban → reports của họ tự động bị dismiss
5 — Workflow xử lý report (thủ công như bạn đề xuất):
User report bài hát
      ↓
Report tạo ra với status = PENDING
      ↓
MODERATOR/ADMIN vào dashboard → xem xét
      ↓
        ├── RESOLVED → Thực hiện hành động (warn / ban song / strike artist)
        └── DISMISSED → Bỏ qua (report không hợp lệ)