# Gắn bộ hình pixel art chuyên nghiệp

Game tự vẽ toàn bộ hình bằng code. Muốn thay bằng ảnh thật (vẽ tay / mua / CC0), chỉ cần:

1. Bỏ file PNG vào thư mục này (`public/assets/`).
2. Khai báo trong `manifest.json`.

Hình nào có trong manifest sẽ **thay thế** hình vẽ bằng code cùng `key`. Hình nào không khai báo vẫn dùng hình cũ —
nên có thể thay dần từng món.

## Ví dụ

```json
{
  "textures": [
    { "key": "tree", "file": "tree.png" },
    { "key": "slime", "file": "slime.png", "frames": { "0": [0, 0, 16, 16], "1": [16, 0, 16, 16] } },
    {
      "key": "hero", "file": "hero.png",
      "grid": { "w": 16, "h": 16, "names": ["down_0","down_1","down_2","up_0","up_1","up_2","side_0","side_1","side_2"] }
    }
  ]
}
```

- `frames`: cắt từng khung theo `[x, y, rộng, cao]`.
- `grid`: cắt đều theo ô, đặt tên theo thứ tự trái → phải, trên → dưới.

## Danh sách key và khung

| Key | Kích thước gợi ý | Khung cần có |
|---|---|---|
| `tiles` | 19 ô 16×16 nằm ngang | thứ tự: cỏ, cỏ 2, cỏ hoa, đường đất, cỏ tối, cỏ tối 2, đá lát, đá nứt, nước A, nước B, hang, hang 2, bazan, bazan 2, dung nham A, dung nham B, đồi, cát, cầu gỗ |
| `hero`, `hero_leather`, `hero_chain`, `hero_steel`, `hero_dragon` | 16×16 | `down_0..2`, `up_0..2`, `side_0..2` (side quay sang phải) |
| `npc_guild`, `npc_merchant`, `npc_smith`, `npc_armorer`, `npc_fisher`, `npc_rancher`, `npc_kid`, `goblin` | 16×16 | như hero |
| `slime`, `wolf`, `bat`, `imp`, `cow`, `sheep` | 16×16 | `0`, `1` (2 khung chuyển động, quay sang phải) |
| `chicken` | 12×12 | `0`, `1` |
| `golem` | 24×24 | `0`, `1` |
| `slime_king` | 32×32 | `0`, `1` |
| `fire_dragon` | 48×40 | `0`, `1` |
| `tree` 32×40, `pine` 24×40, `pillar` 16×32, `crystal` 16×24, `dead_tree` 24×32, `bush`, `rock`, `lava_rock`, `hay` 16×16 | | 1 ảnh |
| `b_guild` 112×96, `b_home` / `b_workshop` / `b_smith` / `b_barn` / `h_cabin` 80×64, `h_lake` 96×64, `h_villa` 112×96 | | 1 ảnh (gốc dưới-giữa) |
| `b_market` 64×48, `b_armory` 48×48, `b_board` / `b_ranch` / `b_well` / `b_lot` 32×32, `b_statue` 32×40, `b_windmill` 48×64, `b_blades` 48×48 | | 1 ảnh |
| `soil`, `weeds` 32×32; `crop_<cây>_<0|1|2>` 32×32 (wheat, carrot, tomato, corn, pumpkin, mushroom, fairyberry) | | 1 ảnh |

Gợi ý nguồn hình miễn phí bản quyền (CC0): Kenney.nl ("Tiny Town", "Tiny Dungeon"), bộ "Ninja Adventure" (itch.io).
Kiểm tra giấy phép của từng bộ trước khi dùng cho game thương mại.
