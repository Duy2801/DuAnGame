# Bản online: đăng nhập + đua top cùng bạn bè

Mỗi người chơi thế giới riêng của mình (không thấy nhau trên bản đồ). Phần online gồm:

- **Tài khoản**: đăng nhập bằng tên + mật khẩu. Tiến trình lưu trên máy chủ, đổi máy chỉ cần đăng nhập lại.
- **Bảng xếp hạng thật**: Đại Gia, Nông Dân, Thợ Săn, Câu Cá, Thả Diều (theo tuần) và Cao Thủ (cấp độ). Bot được thay bằng người chơi thật.
  Danh hiệu Top 1–5 và 💎 thưởng cuối tuần tính theo hạng thật.

Máy chủ dùng **Supabase** (gói miễn phí, không phải tự thuê server). Web game là file tĩnh, host miễn phí ở Netlify/Vercel.
Nếu chưa điền cấu hình, game vẫn chạy **offline** như cũ (BXH đấu với bot).

## 1. Tạo máy chủ Supabase (~5 phút)

1. Vào <https://supabase.com> → đăng ký → **New project** (chọn vùng Singapore cho gần VN, đặt mật khẩu database tuỳ ý).
2. **SQL Editor** → **New query** → dán toàn bộ [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Authentication → Sign In / Providers → Email**: giữ Email **bật**, **tắt "Confirm email"** → Save.
   (Game đăng nhập bằng tên, không có email thật nên không xác nhận được.)
4. **Project Settings → API Keys** (hoặc trang *Connect*): chép **Project URL** và **anon key** (bản mới gọi là *publishable key*, `sb_publishable_…`).
   Không dùng `service_role` / *secret key*.

## 2. Gắn vào game

Chép `.env.example` thành `.env.local` ở thư mục gốc rồi điền:

```
VITE_SUPABASE_URL=https://abcdxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...   (hoặc sb_publishable_...)
```

`npm run dev` → màn hình tiêu đề hiện khung **Đăng nhập / Tạo tài khoản** là đã nối được.

## 3. Đưa lên mạng cho anh em chơi

Cách dễ nhất, không cần GitHub: **Netlify Drop**

1. `npm run build` (cấu hình trong `.env.local` được gói luôn vào bản build).
2. Mở <https://app.netlify.com/drop> → kéo thả thư mục `dist/` vào → nhận link dạng `https://ten-gi-do.netlify.app`.
3. Gửi link cho bạn bè: mỗi người tự tạo tài khoản rồi chơi. Cập nhật game: build lại rồi kéo thả `dist/` vào đúng site đó (tab *Deploys*).

Dùng Vercel/Cloudflare Pages nối với GitHub cũng được: build command `npm run build`, thư mục `dist`,
khai báo 2 biến `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` trong phần Environment Variables.

> anon key được phép nằm trong web (ai mở web cũng thấy). Dữ liệu được bảo vệ bằng quyền trong `schema.sql`:
> mỗi người chỉ đọc/sửa được save của mình, chỉ ghi được điểm của mình.

## Cách hoạt động

- Mở game: còn phiên đăng nhập cũ thì vào thẳng. Đăng nhập xong tải save trên máy chủ (save trong máy mới hơn thì giữ save trong máy).
  Save offline cũ trong máy được gán cho tài khoản **đầu tiên** đăng nhập trên máy đó.
- Cứ 30 giây (và khi ẩn tab): đẩy save + điểm lên, tải điểm mọi người về. BXH có nút 🔄 làm mới.
- Hết tuần: chốt hạng theo điểm người thật (Top 1–5 nhận danh hiệu giữ thêm 1 tuần, bảng Đại Gia & Câu Cá phát 💎).
- Bảng dữ liệu: `saves` (tiến trình), `players` (tên, cấp), `weekly_scores` (điểm từng tuần, dạng JSON nên thêm bảng mới không cần sửa database).
- Code: `src/services/online.ts` (đăng nhập, đồng bộ), `src/game/logic/remote.ts` (BXH đọc dữ liệu người thật), `src/ui/AuthPanel.tsx`.

## Giới hạn cần biết

- **Chống gian lận**: game chạy trên máy người chơi, ai rành kỹ thuật vẫn sửa được điểm. Hợp chơi với bạn bè tin nhau;
  muốn chặn hẳn phải chuyển logic tính điểm lên server.
- Cùng 1 tài khoản mở 2 máy một lúc: máy lưu sau cùng sẽ đè máy kia.
- Tuần tính theo giờ trên máy người chơi (thứ Hai 0h); cả nhóm cùng múi giờ VN thì không vấn đề.
- Supabase miễn phí tạm dừng project nếu **1 tuần không ai dùng** — vào Dashboard bấm *Restore* là chạy lại, dữ liệu còn nguyên.

## Chống spam / chống hack

`supabase/schema.sql` giờ tự chặn ở phía database (client có sửa code cũng không vượt qua được):

- **Đăng ký**: `raw_user_meta_data.username` bắt buộc, đúng `^[a-z0-9_]{3,16}$`, email phải đúng `<tên>@example.com`,
  cấm tên `admin, root, system, mod, moderator, support, gm`. Sau khi tạo không đổi được email/tên đăng nhập.
  Đăng ký xong server tự tạo dòng `players` → tên đăng nhập là duy nhất và không giả mạo được.
  (Vì vậy nút *Add user* trong Dashboard cũng phải điền metadata `{"username": "..."}` đúng như trên.)
- **players**: `username` luôn lấy từ tài khoản (không đổi được), tên hiển thị ≤ 24 ký tự, cấp 1–999,
  mỗi lần đẩy cấp không tăng quá +20 (riêng lần đẩy đầu tiên được mang cấp từ save offline cũ).
- **saves**: phải là JSON object, < 512 KB, ghi đè nhanh hơn 5 giây/lần bị từ chối.
- **weekly_scores**: `week_key` dạng `YYYY-MM-DD` và là thứ Hai, không ở tương lai, tuần cũ hơn 14 ngày bị bỏ qua;
  tối đa 20 bảng điểm, mỗi điểm là số 0 ≤ x < 10¹²; tên ≤ 24 ký tự; nhanh hơn 5 giây/lần bị từ chối.
- `updated_at` do server đặt (`now()`), client gửi gì cũng bị thay.
- Chưa đăng nhập (anon) không đọc/ghi được bảng nào; đã đăng nhập chỉ có select/insert/update, **không ai xoá được**.
- Chạy SQL bằng tay (SQL Editor / service_role) không bị giới hạn tốc độ & nhảy cấp, để chủ server sửa dữ liệu.

Áp schema lên database: điền `DIRECT_URL` (Project Settings → Database → Connection string, chế độ *Session*, cổng 5432)
vào `.env.local` rồi chạy

```bash
npm run db:apply
```

Script chạy cả file trong 1 transaction (lỗi thì không đổi gì), rồi in danh sách bảng/RLS/policy/trigger để kiểm tra.
Chạy lại bao nhiêu lần cũng được, không mất dữ liệu.

**Phải tự bật trong Supabase Dashboard** (database không làm thay được):

1. **Authentication → Rate Limits**: hạ số lần đăng ký / đăng nhập mỗi giờ cho mỗi IP (vd 10 đăng ký/giờ, 30 đăng nhập/5 phút).
2. **Authentication → Bot and Abuse Protection**: bật **CAPTCHA → Cloudflare Turnstile**, dán *Secret key* của Turnstile vào đó;
   *Site key* điền vào `.env.local` là `VITE_TURNSTILE_SITE_KEY=...` (game sẽ hiện ô xác minh khi đăng nhập/đăng ký).
3. **Authentication → Sign In / Providers → Email**: giữ **tắt "Confirm email"** (email là giả, không gửi thư được),
   **Minimum password length = 8**.

> ⚠️ **Đổi mật khẩu database**: mật khẩu DB từng bị lộ trong `.env.example`. Vào **Project Settings → Database →
> Reset database password**, rồi cập nhật mật khẩu mới vào `DIRECT_URL` / `DATABASE_URL` trong `.env.local`
> (file này không được commit). `.env.example` chỉ để chỗ trống/placeholder, không bao giờ để mật khẩu thật.
