# Nông Trại Mạo Hiểm (bản offline)

Game nhập vai 2D pixel art trên web/webview: điều khiển nhân vật đi lại trong làng, tự tay cày ruộng,
ra rừng chém quái, đánh boss, rèn đồ, đầu tư nông trại và đua top. Mặc định chạy offline (lưu trên thiết bị, BXH đấu với bot);
có **bản online** (đăng nhập, lưu trên mây, BXH người thật) — cách dựng xem [ONLINE.md](ONLINE.md).

## Chạy

```bash
npm install
npm run dev      # mở http://localhost:5173 (điện thoại cùng wifi mở bằng IP máy)
npm run build    # ra thư mục dist/ — nhúng vào webview được (base './')
```

## Điều khiển

| | Máy tính | Điện thoại |
|---|---|---|
| Di chuyển | WASD / mũi tên | Joystick trái |
| Chém (tự ngắm quái gần nhất) | Space / J / click chuột | Nút ⚔️ (giữ để chém liên tục) |
| Tương tác (ruộng, nhà, NPC) | E | Nút vàng hiện khi đứng gần |
| Ăn đồ hồi máu | Q | Nút 🍖 |
| Đóng cửa sổ | Esc | ✕ |

Kỹ năng: **Shift/L** lướt · **1/U** chém xoáy (Lv 3) · **2/I** sóng kiếm (Lv 6) · **3/O** hồi phục (Lv 10).

## Bản đồ

Thế giới chia thành **24 bản đồ riêng**, mỗi lúc chỉ dựng bản đồ đang đứng (`src/world/map.ts`).
Đi tới **cổng ở mép bản đồ** (có bảng tên nơi sẽ tới) để sang khu kế bên, hoặc mở 🗺️ (phím M) để **chọn nơi muốn tới**.

```
              Khu Mạo Hiểm Giả ──cổng đông──▶ Vùng 1 ▶ Vùng 2 ▶ … ▶ Vùng 20
                     │
 Khu Nông Trại ◀── Thị Trấn Khởi Nguyên
                     │
              Hồ Câu Cá & Đồi Gió
```

- **Thị Trấn Khởi Nguyên** (bản đồ trung tâm): Quảng trường (Tượng Vinh Danh, bảng nhiệm vụ hằng ngày), Phố Chung Cư (Chung cư Sao Mai, Sky Tower Hoàng Kim — mua căn hộ theo tầng; Sàn Bất Động Sản), Phố Nhà Vườn (6 căn nhà riêng, Nhà ven hồ có hồ cá riêng),
  Công Viên Hoa Hồng, Khu Mua Sắm (Tiệm Cánh / Thú Cưng / Thời Trang — mở hộp quà ngẫu nhiên).
- **Khu Nông Trại**: 24 ô đất (mua dần), Tiệm Hạt Giống, Chợ, Nhà bạn (Bếp), Xưởng, chuồng gà/cừu/bò.
- **Khu Mạo Hiểm Giả** (56×42): Sảnh Hội (Hội + Quầy Săn Quái + đài phun nước lớn), Phố Trang Bị (Vũ Khí / Giáp / Thuốc), Thao Trường,
  Lò Rèn & Hang Mỏ (mỏ đá), Hồ Gương (cầu gỗ, câu cá ven hồ), Cổng Mạo Hiểm (đá dịch chuyển, trại tập kết) ra vùng quái.
- **Hồ Câu Cá & Đồi Gió**: hồ lớn câu mọi lúc, Tiệm Câu Cá + Quầy Thu Mua Cá, Tiệm Diều + Đồi Gió.

**20 vùng quái**, mỗi vùng là 1 bản đồ 52×36 nối tiếp nhau (cửa tây ↔ cửa đông): đường mòn uốn lượn, rừng mọc thành cụm, hồ/dung nham,
nền, cảnh vật, hiệu ứng và loài quái riêng, mạnh dần theo công thức (`src/game/config/combat.ts`). Cách dựng: `src/world/zoneGen.ts`.
**Không có chỗ an toàn** — chỉ có 🔮 đá dịch chuyển ở cửa vào (đi ngang là kích hoạt).
**Mỗi vùng có 1 Boss riêng** canh đấu trường phù văn: nhiều chiêu (dậm đất, phun đạn, lao tới, vòng đạn, triệu hồi), dưới 50% HP nổi giận.
Hạ boss mở rương: vàng, kim cương, bình máu, quặng, 40% đồ tiệm hợp cấp, và **trang bị độc quyền** (lần đầu chắc chắn rơi, sau đó 25%) —
xem `src/game/logic/boss.ts`, `src/game/config/bossGear.ts`.

Mở rộng một khu: sửa `w/h` + nội dung của khu đó trong `src/world/map.ts` (vùng quái: `ZW/ZH`, `zoneGen.ts`, `zoneThemes.ts`; thị trấn: `TOWN_MAPS`, `PAINT`),
không ảnh hưởng các khu khác.

- **Ngày/đêm** (1 ngày = 12 phút): đêm quái mạnh hơn 25% nhưng thưởng nhiều hơn 30%. **Mưa** ngẫu nhiên.
- **Cốt truyện**: 14 chương nhiệm vụ từ NPC (❗ = có nhiệm vụ, ❓ = trả nhiệm vụ), kết thúc bằng Rồng Lửa ở vùng 20.

## Gắn bộ hình pixel art chuyên nghiệp

Xem [public/assets/README.md](public/assets/README.md): bỏ PNG vào `public/assets/`, khai báo trong `manifest.json`
là game tự dùng thay hình vẽ bằng code (thay dần từng món được).

## Vòng lặp

Trồng cây → nấu đồ ăn (hồi máu + buff nhiệm vụ Hội) → chém quái lấy vàng, XP, nguyên liệu, hạt hiếm
→ rèn kiếm/giáp, xây công trình, tuyển & gửi đội Hội đi nhiệm vụ (idle) → mạnh hơn, đi vùng xa hơn.
Giữ chân: điểm danh 7 ngày, nhiệm vụ ngày + rương, BXH tuần, giá chợ đổi mỗi ngày, thu nhập offline.

## Cấu trúc

```
src/
├── game/              # LOGIC THUẦN — không phụ thuộc giao diện, sau này chuyển lên server
│   ├── config/        # số liệu: cây, công trình, 20 vùng & quái, trang bị, kỹ năng, cốt truyện, nhà/cá, đồ mua sắm
│   ├── logic/         # farm, market, guild, player, life (nhà/chăn nuôi/câu cá/diều), shop, bounty, story, meta
│   ├── clock.ts       # ngày/đêm, mưa
│   └── state.ts       # state khởi tạo + SAVE_VERSION
├── world/             # THẾ GIỚI GAME (Phaser)
│   ├── textures.ts    # toàn bộ pixel art vẽ bằng code — thay bằng ảnh thật chỉ cần load cùng key
│   ├── map.ts         # 24 bản đồ riêng (4 khu thị trấn + 20 vùng quái), cổng nối, đá dịch chuyển
│   ├── zoneThemes.ts  # nền/cảnh vật/hiệu ứng riêng từng vùng
│   ├── WorldScene.ts  # nhân vật, quái + AI, boss, ruộng, tương tác, hiệu ứng
│   ├── sfx.ts         # âm thanh tổng hợp WebAudio
│   └── bus.ts         # cầu nối Phaser ↔ React (mở cửa sổ, joystick)
├── ui/                # HUD, nút điều khiển, các cửa sổ (Hội, Chợ, Lò rèn...)
└── store.ts           # zustand: act()/apply() chạy logic trên bản sao state, lưu localStorage
```

Cân bằng game: sửa số trong `src/game/config/*`. Đổi cấu trúc save thì tăng `SAVE_VERSION`.
