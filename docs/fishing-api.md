# Hợp đồng API Câu cá · Thả diều · Rương đồ (server-authoritative)

Mọi phép quay ngẫu nhiên (cá cắn câu, kích thước cá, mở hộp cần/diều, hạn sử dụng) chạy **trên Postgres** (Supabase RPC,
`security definer`, dùng `auth.uid()`). Client chỉ hiển thị + chơi minigame, không tự quyết kết quả.
File SQL: `supabase/fishing.sql` (chạy sau `schema.sql` bằng `npm run db:apply`).

## Quy tắc
- **Rương đồ**: mỗi nhân vật đúng **1 rương, 30 ô** (slot 0..29).
  - Vật phẩm thường (cá, mồi, nguyên liệu) **gộp chung 1 ô** theo `item_id`, cộng dồn `qty` (tối đa 9999/ô).
  - **Cần câu & diều** mỗi cái **1 ô riêng** (`qty = 1`), có hạn `expires_at`; hết hạn → server tự xoá (purge khi đọc/ghi rương).
  - Rương đầy → RPC từ chối **trước khi** trừ tiền (`raise exception 'Rương đầy'`).
  - Vứt bỏ được bất kỳ ô nào (`discard_item`).
- **Hạn sử dụng** khi mở hộp cần/diều: `1d` 60% · `3d` 30% · `7d` ~10% · **`perm` (vĩnh viễn) 0.0001% = 1e-6**.
- **Mỗi cần câu có bảng tỷ lệ cá riêng** (`rod_fish_rates`). Cá top (mythic) cực hiếm, kể cả cần xịn nhất ~0.01% mỗi lần câu.
- **Ví (wallet)**: `wallets(gold, gems)` trên server là nguồn sự thật cho tiền tiêu ở Hồ Câu Cá.
  `sync_wallet(p_gold, p_gems)`: giảm thì nhận luôn; tăng thì bị chặn trần theo thời gian (chống sửa tiền).
- Điểm & BXH câu cá tính từ `catch_log` trên server (không tin điểm client gửi).

## Bảng (authenticated được SELECT các bảng catalog)
| Bảng | Cột chính |
|---|---|
| `fish_species` | `id, name, emoji, rarity ('common'|'uncommon'|'rare'|'epic'|'legendary'|'mythic'), price, cm_min, cm_max, difficulty (0..1), night bool, rain bool, sort` |
| `rod_defs` | `id, name, emoji, rarity ('N'|'R'|'SR'|'SSR'|'UR'), zone, size, slow, bite, miss, descr, sort` |
| `rod_fish_rates` | `rod_id, fish_id, weight` (trọng số tương đối) |
| `kite_defs` | `id, name, emoji, rarity, mult, minutes, descr, sort` |
| `box_defs` | `id, kind ('rod'|'kite'), name, emoji, price_gold, price_gems, odds jsonb {"N":0.8,...}` |
| `shop_items` | `id (vd bait_worm), name, emoji, price_gold, qty` — mồi bán ở tiệm |
| `inventory_slots` | `id uuid, user_id, slot 0..29, item_id, kind ('stack'|'rod'|'kite'), qty, expires_at null=vĩnh viễn, equipped bool, acquired_at` — client chỉ SELECT của mình, mọi ghi qua RPC |
| `wallets` | `user_id, gold bigint, gems int, synced_at` |
| `fishing_casts` | lượt câu đang chờ (server giữ kết quả bí mật) |
| `catch_log` | `user_id, fish_id, cm, kg, points, rod_id, week_key, caught_at` |

## RPC (gọi `db.rpc(name, args)`; lỗi → `error.message` tiếng Việt)
| Hàm | Tham số | Trả về (jsonb) |
|---|---|---|
| `get_chest()` | – | `{ slots: InventorySlot[], wallet: {gold, gems} }` (đã purge hết hạn) |
| `sync_wallet(p_gold bigint, p_gems int)` | số dư client | `{ gold, gems }` số dư được chấp nhận → client gán lại `g.gold/g.gems` |
| `buy_item(p_item_id text, p_qty int)` | mua mồi | `{ slot, wallet }` |
| `open_box(p_box_id text, p_count int)` | `p_count` 1 hoặc 10 | `{ results: [{item_id, kind, rarity, duration ('1d'|'3d'|'7d'|'perm'), expires_at, slot}], wallet }` |
| `equip(p_slot int)` | ô chứa cần/diều | `{ ok: true }` (bỏ trang bị cái cùng loại trước đó) |
| `discard_item(p_slot int, p_qty int)` | `p_qty` null = cả ô | `{ ok: true }` |
| `sell_item(p_slot int, p_qty int)` | bán cá | `{ gold_gained, wallet }` |
| `fish_start(p_bait_id text)` | mồi trong rương (null = không mồi) | `{ cast_id uuid, wait_ms int, difficulty numeric, zone numeric, slow numeric }` — dùng cần đang `equipped` (chưa hết hạn), không có thì dùng cần tre mặc định |
| `fish_finish(p_cast_id uuid, p_success bool)` | sau minigame | thành công: `{ caught: true, fish_id, name, emoji, rarity, cm, kg, points, record bool, slot }`; trượt/đứt dây: `{ caught: false, reason }` |
| `fishing_top(p_week text)` | `week_key` dạng YYYY-MM-DD (thứ Hai) | `[{ user_id, name, points, biggest_cm, biggest_fish }]` top 50 |

`fish_finish` từ chối nếu gọi sớm hơn `wait_ms` (chống auto-câu) hoặc quá 90s sau khi cá cắn, mỗi `cast_id` dùng 1 lần.

## Làm rõ (server đã triển khai — `supabase/fishing.sql`)
Tên bảng/RPC/tham số giữ nguyên như trên; dưới đây chỉ là **chi tiết + trường bổ sung** (không bỏ trường nào).

- **Bảng bổ sung `bait_defs(id, name, emoji, rare, bite, size)`** — hệ số mồi (`bait_worm`, `bait_shrimp`, `bait_gold`), authenticated SELECT được.
  `bait_gold` không bán ở `shop_items` (chỉ có từ quà/hộp mồi phía client). Hộp mồi may mắn (`BAIT_BOX`) và mua diều thẳng bằng giá tiệm **chưa có RPC**.
- **Catalog**: 17 loài cá — common: `fish_goby, fish_crucian, fish_perch, fish_tilapia` · uncommon: `fish_carp, fish_snakehead, fish_catfish` ·
  rare: `fish_salmon, fish_gourami, fish_shark` · epic: `fish_koi, fish_stingray, fish_sturgeon` · legendary: `fish_dragon, fish_mekong` ·
  mythic: `fish_leviathan` (Thủy Quái Hồ Sâu), `fish_kimlong` (Kim Long Ngư Thần). Cá mới cần thêm vào `ITEMS` phía client nếu muốn hiện tên/giá bán offline.
- **`rod_fish_rates`**: đủ 12 cần × 17 cá. Tổng weight mỗi cần = 1 000 000 → `weight / 10000` = % mỗi lần cá cắn (ban ngày, mồi giun).
  Mythic: cần tre 0.0005% → Cần Thần Biển 0.01%; legendary 0.01% → 0.3% (bảng đầy đủ ở đầu phần rates trong fishing.sql).
  Mồi nhân trọng số mọi cá **không phải common** × `bait_defs.rare` (tôm ×1.6, vàng ×3). Ban đêm (19h–5h giờ VN) cá `night` ×2. Mưa bỏ qua.
- **`inventory_slots`**: thêm ràng buộc chỉ 1 ô `equipped` mỗi `kind`; vật phẩm `stack` luôn `expires_at = null`.
- **`wallets`**: thêm cột `gold_clock, gems_clock` (đồng hồ trần tăng). Ví tạo tự động ở RPC đầu tiên. Tài khoản có sẵn lúc áp file được lấy số dư
  từ `saves.data.gold/gems`; tài khoản tạo sau đó lấy từ save nhưng tối đa 20 000 vàng / 50 💎.
- **`sync_wallet`** trả thêm `capped: bool` (true = bị cắt bớt). Trần tăng là "xô token": 3000 vàng/phút & 20 💎/giờ, tích tối đa 24h,
  ví mới có sẵn ~5 phút vàng (15 000) và 1 giờ kim cương (20). Gửi `null` cho một tham số = giữ nguyên giá trị đó.
- **`buy_item(p_item_id, p_qty)`**: `p_qty` = **số gói** (1–100); mỗi gói = `shop_items.qty` con mồi, giá `price_gold`. Trả thêm `item_id, qty_added`.
- **`open_box`**: giá ×10 không giảm. `results[]` thêm `name, emoji`. Hộp cần không bao giờ ra `rod_bamboo`. Mở hộp trùng món → vẫn là 1 ô mới (không đổi vàng).
  Hạn: `perm` < 1e-6, `1d` 60%, `3d` 30%, `7d` phần còn lại. ×10 không có SR+ → món thứ 10 quay lại chỉ trong các bậc SR+ của hộp.
- **`equip`** trả thêm `item_id, kind`. **`discard_item`**: `p_qty` < 1 bị từ chối.
- **`sell_item`**: chỉ ô `stack` là cá; giá = `fish_species.price × số con` (không nhân cỡ cá).
- **`fish_start`** trả thêm `rod_id, bait_id, miss, empty_bite`. `empty_bite = true` → cá chỉ rỉa mồi: client có thể bỏ minigame,
  `fish_finish` của lượt đó luôn `{caught:false, reason:'Cá rỉa mồi rồi bỏ chạy'}`. Mồi trừ ngay khi thả. Thả nhanh hơn 3 giây → lỗi `P0429`.
  Thả lượt mới → lượt cũ chưa xong bị huỷ.
- **`fish_finish`**: gọi trước `started_at + wait_ms − 300ms` → **lỗi** "Cá chưa cắn câu — giật cần quá sớm" (lượt vẫn còn, gọi lại sau được);
  sau `+90s` → `{caught:false}`; lượt đã xong → lỗi "Lượt câu này đã kết thúc". Lý do trượt: hết giờ / rỉa mồi / `p_success=false` /
  đứt dây (`0.1 × miss × (0.4 + pct×1.6)`) / "Rương đầy, cá đã thả về hồ". Thành công trả thêm `pct` (0..1) và `tier` (0 Bé · 1 Vừa · 2 To · 3 Khổng lồ).
  Server **không** cộng vàng thưởng cá to; điểm `points = round(price × tierMult × (0.5 + pct))`. `week_key` = thứ Hai theo giờ VN.
- **`fishing_top(p_week)`**: `p_week = null` → tuần hiện tại. Mỗi dòng thêm `fish_count`; `biggest_fish` là `fish_id`.
