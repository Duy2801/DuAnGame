# Nhật ký thay đổi

## Đợt "Vùng quái hoang dã & 20 Boss" (2026-10-30)
- **Bỏ trại an toàn**: vùng quái không còn chỗ nào an toàn, quái đi khắp nơi; chỉ còn 🔮 đá dịch chuyển ở cửa vào (đi ngang là kích hoạt, giữ id `camp_*` nên save cũ không mất đá đã mở).
- **Bản đồ vùng rộng hơn** (34×26 → **52×36**, 24 quái/vùng) và đa dạng hơn: nền loang theo mảng, đường mòn uốn lượn tây → đông,
  rừng/bãi đá mọc thành cụm xen đồng trống, hồ nước/dung nham có cầu đất xuyên qua, cỏ hoa trang trí.
  Vùng 1 thành **Đồng Cỏ Anh Đào** (cây anh đào, thảm cánh hoa, hoa rơi), đầm lầy có cầu gỗ, bãi biển có sao biển, nghĩa địa có đèn hồn, hang có nấm phát sáng.
- **Mỗi vùng 1 Boss riêng** (20 boss, 16 boss mới) trong **đấu trường phù văn** có đuốc: hào quang, banner cảnh báo, **thanh máu boss** trên HUD.
  Chiêu: dậm đất, phun đạn hình quạt, lao tới (có vạch cảnh báo), vòng đạn tỏa tròn, triệu hồi quái. Dưới 50% HP **nổi giận**: nhanh hơn, ra chiêu dồn dập, bắn nhiều đạn hơn.
- **Rương báu boss**: vàng ×50, kim cương (lần đầu ×2), bình máu, quặng, đá quý (vùng 12+), 40% rơi đồ tiệm hợp cấp chưa có, 12% **bạo kích vàng ×3**,
  và **20 trang bị độc quyền** (1 món/boss: Vương Miện Slime, Nanh Fenrir, Đại Kiếm Cổ Thần, Thương Góa Phụ, Thần Long Kiếm…) — lần đầu hạ chắc chắn rơi, sau 25%; trùng thì đổi vàng.
  Bảng phần thưởng hiện ngay khi hạ boss.
- Code: `src/world/zoneGen.ts` (dựng vùng), `src/world/zoneThemes.ts`, `src/world/wildArt.ts` (hình mới), `src/game/logic/boss.ts`, `src/game/config/bossGear.ts`, `src/ui/BossHud.tsx`.
- Save: thêm `bossKills`; save cũ tự lấy mặc định.

## Đợt "Bản online: tài khoản & đua top cùng bạn bè" (2026-10-30)
- **Đăng nhập / tạo tài khoản** bằng tên + mật khẩu ngay trên màn hình tiêu đề. Phiên đăng nhập được giữ lại, lần sau vào thẳng game.
- **Lưu tiến trình trên máy chủ** (30 giây/lần + khi ẩn tab), đổi máy chỉ cần đăng nhập lại. Save offline cũ được gán cho tài khoản đầu tiên đăng nhập trên máy đó.
- **Bảng xếp hạng người thật** thay cho bot: Đại Gia, Nông Dân, Thợ Săn, Câu Cá, Thả Diều (theo tuần), Cao Thủ (cấp). Danh hiệu Top 1–5 và 💎 cuối tuần
  tính theo hạng thật. Dưới bảng có chấm xanh "Người chơi thật", giờ cập nhật và nút 🔄 làm mới. Cài đặt có dòng tài khoản + Đăng xuất.
- Máy chủ dùng Supabase (miễn phí): `supabase/schema.sql` tạo bảng + quyền, hướng dẫn dựng & host ở **ONLINE.md**.
  Chưa cấu hình `.env.local` thì game vẫn chạy offline với bot như cũ.
- Code: `src/services/online.ts`, `src/services/config.ts`, `src/game/logic/remote.ts`, `src/ui/AuthPanel.tsx`; `store.loadGame()` nạp save từ máy chủ.

## Đợt "Khu Nhà Ở mới: Phố Chung Cư & Sàn Bất Động Sản" (2026-10-30)
- **Phố Chung Cư** (bắc đường lớn, cạnh quảng trường): 2 tòa chung cư mặt tiền nhìn ra đường + **Sàn Bất Động Sản** ở giữa,
  vỉa hè lát đá, biển quảng cáo "mở bán", đèn đường, hàng rào cây.
  - 🏢 **Chung cư Sao Mai** (6 tầng): 4 căn bán — Studio 1.500🪙 (Lv 2), 1PN, 2PN view công viên, căn góc tầng thượng.
  - 🏙️ **Sky Tower Hoàng Kim** (9 tầng, kính xanh viền vàng, sân trực thăng): Căn hạng sang, Duplex thông tầng, **Penthouse Hoàng Kim** 300.000🪙 (Lv 40).
  - Trên mặt tiền: ô kính căn đang bán **nhấp nháy vàng**, căn đã mua **sáng đèn vàng**; tối trời cả tòa lên đèn. Có Penthouse thì đèn mái sáng cả đêm.
  - Vào sảnh tòa → **mặt cắt tòa nhà theo tầng**: căn bán / căn của bạn / căn dân làng ở; bấm căn để xem diện tích, hướng view, đặc quyền, thời gian hoàn vốn và mua.
- **Sàn Bất Động Sản**: mọi căn đang rao (lọc Chung cư / Nhà riêng / Của tôi), thẻ theo hạng Bình dân → Hạng sang, tổng giá trị & thu nhập danh mục.
- **Phố Nhà Vườn**: 6 căn nhà riêng giờ **luôn dựng sẵn** (trước đây chỉ là bãi đất trống) — chưa mua thì có biển "ĐANG BÁN" + giá, mua rồi cắm cờ 🔑; thêm hòm thư, bồn hoa.
- Thành tựu Bất Động Sản: mốc 1 / 3 / 6 / 10 căn (13 căn tất cả).
- Code: `HOUSES` / `TOWERS` trong `src/game/config/life.ts` (căn hộ có `tower` + `floor`), hình vẽ `src/world/textures3.ts`, giao diện `src/ui/RealtyView.tsx`.
- Save cũ giữ nguyên nhà đã mua (căn hộ dùng chung danh sách `houses`).

## Đợt "Quy hoạch lại Khu Mạo Hiểm Giả" (2026-10-30)
- Bản đồ rộng hơn (32×28 → **56×42**), chia khu rõ ràng, hệ toạ độ riêng (gốc 0):
  - **Sảnh Hội** (bắc): Hội Mạo Hiểm Giả + Quầy Nhiệm Vụ Săn Quái quanh quảng trường lát đá, **đài phun nước lớn** có tượng kiếm sĩ, cờ, ghế đá, bồn hoa.
  - **Phố Trang Bị** (tây nam): Tiệm Vũ Khí, Tiệm Giáp & Phụ Kiện, Tiệm Thuốc cùng một dãy phố; vườn nghỉ có giếng phía nam.
  - **Thao Trường** (tây bắc): sân đất rào kín, hình nộm tập, giá vũ khí.
  - **Lò Rèn & Hang Mỏ** (đông bắc): hang mỏ nằm trong mỏ đá (đá tảng, pha lê phát sáng), lò rèn ngay bên dưới.
  - **Hồ Gương** (đông nam): hồ lớn có cầu gỗ ra giữa hồ, lau sậy, ghế ngắm hồ — câu cá được.
  - **Cổng Mạo Hiểm** (đông): đá dịch chuyển, trại tập kết (lều, lửa trại), cổng ra Vùng 1. **Cổng Nam** về Thị Trấn có biển chỉ đường.
- Hình mới: `fountain_guild` (động), `dummy`, `weapon_rack`, `barrel`, `crate`, `banner` (`src/world/textures2.ts`).
- Save cũ đứng ở Khu Mạo Hiểm Giả: nếu vị trí cũ rơi vào chỗ bị chắn sẽ tự về cổng nam.

## Đợt "Tách bản đồ & Hộp quà Khu Mua Sắm" (2026-10-30)

### Tách bản đồ
- Thế giới chia thành **24 bản đồ riêng**: Thị Trấn Khởi Nguyên (quảng trường + nhà ở + mua sắm), Khu Nông Trại, Khu Mạo Hiểm Giả,
  Hồ Câu Cá & Đồi Gió, và **mỗi vùng quái là 1 bản đồ** 34×26 (rộng hơn trước, 15 quái/vùng). Mỗi lúc chỉ dựng bản đồ đang đứng.
- Đi tới **cổng ở mép bản đồ** (bảng tên nhấp nháy ▶ nơi sẽ tới) để sang khu kế bên; mờ dần → tới nơi.
- 🗺️ (phím M) thành màn **chọn nơi muốn tới**: bản đồ khu đang đứng + thẻ 4 khu thị trấn + lưới 20 vùng quái (đã kích hoạt trại thì dịch chuyển tới được).
- Gục ngã ở vùng quái → hồi sinh ở quảng trường Thị Trấn.
- Code: `src/world/map.ts` (`TOWN_MAPS` / `ZONE_MAPS`, `loadMap(id)`), `WorldScene` dựng lại scene mới khi sang bản đồ.

### Khu Mua Sắm: chỉ ra từ hộp quà
- **Tiệm Cánh / Thú Cưng / Thời Trang** không bán thẳng nữa: mỗi tiệm 3 loại hộp (thường 🪙 / bạc 🪙 / VIP 💎), tỉ lệ ghi rõ từng bậc N–UR,
  **mở ×10 chắc chắn có ít nhất 1 món SR+**, trùng món đã có đổi vàng. Món mới tự mặc nếu ô đang trống.
- Giao diện mới (cửa sổ rộng): biển hiệu theo tiệm, phòng thử đồ (mặc thử cả món chưa có), bộ sưu tập thẻ theo độ hiếm, hoạt cảnh mở hộp.
- Nhiều đồ hơn: **15 cánh** (3 kiểu dáng: lông vũ, màng dơi/rồng, cánh tiên), **19 thú cưng** (vịt, cánh cụt, husky, thỏ, kỳ lân,
  phượng hoàng con, hắc long, cửu vĩ hồ…), **49 món thời trang** (áo dài trắng, váy tiểu thư, long bào, thánh y, mũ len, lưỡi trai, mũ chóp, giày thủy tinh, dây chuyền kim cương…).
  Chỉ số theo độ hiếm. Số liệu: `COSMETICS`, `COS_BOXES` trong `src/game/config/shops.ts`.

### Save
- Thêm `player.map`. Save cũ (chưa có) tự về quảng trường Thị Trấn; tiến trình, đồ đã có, trại đã kích hoạt giữ nguyên.

## Đợt "Hành trang & Tiệm Câu Cá mới" (2026-10-30)

### Mới
- **🎒 Hành trang kiểu Minecraft** (phím **B**, nút 🎒 ở thanh 10 ô / HUD) — thay cửa sổ "Sắp xếp thanh 10 ô":
  nhân vật mặc đồ đang mặc + cầm món đang cầm (xoay ◀ ▶, thú cưng đứng cạnh), 12 ô trang bị quanh nhân vật
  (mũ, áo, quần, giày, giáp, phụ kiện, cánh, thú cưng, tay cầm, dây chuyền, bông tai, kính), lưới túi đồ theo tab,
  khung chi tiết (chỉ số, mô tả, nút Cầm / Mặc / Tháo / Dùng) và thanh 10 ô ở đáy.
  Đặt đồ vào thanh nhanh: kéo thả · chọn món rồi bấm ô · chọn món rồi nhấn phím 1–0. Kéo ô này sang ô kia để đổi chỗ, kéo ra túi để bỏ.
- **Thanh 10 ô chứa được đồ ăn / bình máu**: bấm phím số là ăn/uống ngay (vẫn cầm vũ khí cũ), ô hiện số lượng, hết thì mờ đi.
- **Thử đồ ở Tiệm Vũ Khí / Tiệm Giáp**: bấm 👁 để xem nhân vật cầm / mặc thử trước khi mua.
- **Tiệm Câu Cá Ông Năm** làm lại, cửa sổ rộng: biển hiệu, huy hiệu "Tỉ lệ công khai", tỉ lệ từng bậc ghi rõ dưới mỗi rương,
  tab Rương / Bộ sưu tập / Mồi câu, nút mở rương ghi rõ giá và số còn thiếu.
- **⚖️ Quầy Thu Mua Cá** cạnh tiệm: bán lẻ từng loại hoặc bán hết theo giá chợ hôm nay (▲▼ so với giá gốc, 🔥 HOT),
  bán hết tự chừa cá các đơn hàng đang cần (`sellAllFish` trong `src/game/logic/market.ts`), bảng giá cá hôm nay.

## Đợt "Giữ chân & Kinh tế liên kết" (2026-10-30)

### Mới
- **Bảng Đơn Hàng** (Chợ → tab 📋 Đơn hàng): 4 đơn từ dân làng (Bà Tư, Chú Năm Câu, Bé Na, Đầu bếp Phú, Thợ rèn Hùng, Ông Thị Trưởng).
  Chỉ đặt món người chơi kiếm được (nông sản, chăn nuôi, cá đã câu, đồ ăn nấu được, chiến lợi phẩm vùng đã tới).
  Trả ~1.6–2.1× giá gốc + XP + 15% có kim cương. Giao xong 2 phút có đơn mới, bỏ qua thì chờ 10 phút.
  HUD báo khi có đơn đủ hàng. Số liệu: `src/game/config/orders.ts`.
- **Mặt hàng hot hôm nay**: mỗi ngày 1 món giá ×2 (`HOT_MULT` trong `src/game/logic/market.ts`).
- **Thành tựu 4 bậc** Đồng/Bạc/Vàng/Kim Cương cho 15 mục (nông, bếp, đơn hàng, vàng, quái, khu vực, cấp, cá, loài cá, cần câu, diều, thời trang, nhà, vật nuôi, quà online).
  Mỗi bậc thưởng 💎 5/15/30/60, bậc Kim Cương tặng danh hiệu Sử thi. Số liệu: `src/game/config/achievements.ts`.
- **Quà online** 5/15/30/60 phút mỗi ngày (chỉ tính khi đang mở game).
- **Vòng quay may mắn**: 1 lượt miễn phí/ngày, thêm tối đa 5 lượt × 10💎, có hiệu ứng quay. Số liệu: `src/game/config/meta.ts`.
- **Danh hiệu Top 1–5** cho 6 bảng xếp hạng (Đại Gia, Nông Dân, Thợ Săn, Câu Cá, Thả Diều, Cao Thủ); Top 1 là bậc Thần thoại chữ cầu vồng + 👑.
- **Sao lưu save**: Cài đặt → Xuất mã / Nhập mã (chép tiến trình sang máy khác). Mã sai không ghi đè save đang có.
- **Phím tắt**: M bản đồ · B túi đồ · N nhiệm vụ / thành tựu / quà.
- **HUD**: số vàng/kim cương đếm tăng dần, bong bóng "+N" khi nhận tiền.

### Sửa
- Nhân vật nhỏ lại (khung 20×30), dáng vai–eo–hông, tay chân tách rời, không còn "một khúc".
- Bỏ lỗi 404 favicon.

### Save
- Save cũ tải bình thường: trường mới (`orders`, `achievements`, `online`, `wheel`, `weekStats`, `stats.cooked/orders/onlineGifts`) tự lấy giá trị mặc định.

## Kế hoạch các đợt sau
1. **Nấu ăn & buff**: món ăn tăng tốc / may mắn câu cá / sát thương trong X phút; công thức mới từ cá & sữa; NPC Đầu bếp dạy công thức.
2. **Thả diều thành minigame**: giữ diều trong luồng gió, né chim/sét, nhặt quà; kỷ lục độ cao → bảng Top.
3. **Chất lượng nông sản** Thường/Bạc/Vàng/Kim Cương + mùa vụ + phân bón.
4. **Bộ trang phục (set)** có hiệu ứng, nâng cấp cánh 5 cấp.
5. **Đào mỏ nhiều tầng**, bắt bọ, Sổ Sưu Tầm.
6. **Hầm ngục / Tháp Vô Tận**, boss thế giới theo giờ.
7. **Sự kiện & lễ hội** theo lịch (Tết, Trung Thu...), thời tiết gió/bão/tuyết.
8. Tách lớp `services/` (Save/Leaderboard) + `ONLINE_PLAN.md` chuẩn bị bản online.
