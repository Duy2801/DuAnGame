import { MONSTERS } from '../game/config/combat';
import { ZONE_DEFS } from '../game/config/zones';
import { TILE } from './textures';
import type { Canvas, Rect, Spawner } from './map';
import type { ZoneTheme } from './zoneThemes';

// Dựng bản đồ 1 vùng quái: nền loang theo nhiễu, đường mòn uốn lượn tây → đông, đấu trường boss
// có vòng phù văn + đuốc, hồ (cầu đất xuyên qua), rừng mọc thành cụm, cỏ hoa trang trí.
// Không còn trại an toàn — chỉ có đá dịch chuyển ở cửa vào.

/** quái thường mỗi vùng */
export const ZONE_MOBS = 24;
/** bán kính đấu trường boss (tile) */
const ARENA_R = 5.5;
/** vật trang trí đi xuyên qua được */
const SOFT = new Set(['shell', 'bones', 'reeds', 'tuft', 'flower_patch', 'glow_shroom', 'lily', 'starfish']);

/** nhiễu giá trị mượt 0..1 — cây mọc thành rừng, nền loang thành mảng */
function valueNoise(w: number, h: number, cell: number, rnd: () => number) {
  const gw = Math.ceil(w / cell) + 2;
  const grid = Array.from({ length: gw * (Math.ceil(h / cell) + 2) }, () => rnd());
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = x / cell;
    const gy = y / cell;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const fx = sm(gx - ix);
    const fy = sm(gy - iy);
    const v = (i: number, j: number) => grid[(iy + j) * gw + ix + i];
    return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy;
  };
}

export function paintZone(cv: Canvas, id: number, th: ZoneTheme, wall: () => void) {
  const { info, rnd, ground, solid, reserved, fill, reserve, placeL, blob } = cv;
  const W = info.w;
  const H = info.h;
  const MY = Math.floor(H / 2);
  const inside = (x: number, y: number) => x > 0 && y > 0 && x < W - 1 && y < H - 1;

  // ---- nền loang + mảng điểm xuyết
  const nGround = valueNoise(W, H, 5, rnd);
  const nAccent = valueNoise(W, H, 4, rnd);
  const nWood = valueNoise(W, H, 7, rnd);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      ground[y][x] = nGround(x, y) < 0.5 ? th.tiles[0] : th.tiles[1];
      if (th.accent !== undefined && nAccent(x, y) > 0.7) ground[y][x] = th.accent;
    }
  }

  // ---- đường mòn: thẳng ở 2 cửa, uốn lượn ở giữa
  const per = 6 + rnd() * 4;
  const ph = rnd() * Math.PI * 2;
  const roadY = (x: number) => Math.round(MY + Math.sin(x / per + ph) * 3.5 * Math.max(0, Math.min(1, x / 8, (W - 1 - x) / 8)));
  const roadCells: [number, number][] = [];
  let prev = MY;
  for (let x = 0; x < W; x++) {
    const yc = roadY(x);
    for (let y = Math.min(prev, yc) - 1; y <= Math.max(prev, yc) + 1; y++) roadCells.push([x, y]);
    prev = yc;
  }
  const paintRoad = () => roadCells.forEach(([x, y]) => (ground[y][x] = th.road));
  paintRoad();
  for (const [x, y] of roadCells) reserve(x - 1, y - 1, x + 1, y + 1);

  // ---- cửa vào: khoảng trống + đá dịch chuyển (khớp WAYPOINTS camp_*)
  reserve(0, MY - 4, 7, MY + 4);
  placeL('waystone', 5, MY + 3);

  // ---- đấu trường boss ở nửa bắc hoặc nam, lệch về phía đông
  const north = rnd() < 0.5;
  const ax = Math.round(W * 0.58 + rnd() * W * 0.22);
  const ay = north ? 7 : H - 8;
  blob(ax + 0.5, ay + 0.5, ARENA_R, ARENA_R, (x, y, d) => {
    if (d > 1) return;
    const r = Math.sqrt(d);
    ground[y][x] = Math.abs(r - 0.78) < 0.1 || r < 0.2 ? TILE.ARENA2 : TILE.ARENA;
  });
  const arena: Rect = { x0: Math.floor(ax - ARENA_R), y0: Math.floor(ay - ARENA_R), x1: Math.ceil(ax + ARENA_R), y1: Math.ceil(ay + ARENA_R) };
  reserve(arena.x0 - 1, arena.y0 - 1, arena.x1 + 1, arena.y1 + 1);
  // lối rẽ từ đường mòn vào đấu trường (cửa quay về phía đường)
  const gate = north ? ay + Math.ceil(ARENA_R) : ay - Math.ceil(ARENA_R);
  const ry = roadY(ax);
  fill(ax, Math.min(gate, ry), ax + 1, Math.max(gate, ry), th.road);
  reserve(ax - 1, Math.min(gate, ry), ax + 2, Math.max(gate, ry));
  // đuốc vòng quanh, chừa cửa
  const gateAngle = north ? Math.PI / 2 : -Math.PI / 2;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - gateAngle), Math.cos(a - gateAngle))) < 0.5) continue;
    const tx = Math.round(ax + 0.5 + Math.cos(a) * (ARENA_R + 0.4) - 0.5);
    const ty = Math.round(ay + 0.5 + Math.sin(a) * (ARENA_R + 0.4) - 0.5);
    if (inside(tx, ty)) placeL(th.torch, tx, ty);
  }

  // ---- hồ nước / dung nham: đường mòn đi xuyên qua thành cầu đất
  if (th.pool) {
    let made = 0;
    for (let tries = 0; tries < 40 && made < 3; tries++) {
      const rx = 2.5 + rnd() * 3.5;
      const ryy = 2 + rnd() * 2.5;
      const cx = 10 + rnd() * (W - 20);
      const cy = 4 + rnd() * (H - 8);
      if (Math.hypot(cx - ax, cy - ay) < rx + ARENA_R + 3 || cx < 12) continue;
      cv.addPool(cx, cy, rx, ryy, th.pool, th.shore ?? null);
      made++;
    }
    paintRoad();
  }

  // biển báo ở lối rẽ vào đấu trường
  const signY = north ? ry - 2.4 : ry + 3.4;
  reserve(ax + 2, Math.floor(signY) - 1, ax + 3, Math.floor(signY));

  wall();

  // ---- vật chắn mọc dày ở nơi nhiễu cao (rừng, bãi đá), thưa ở đồng trống
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (reserved[y][x] || solid[y][x]) continue;
      const mult = 0.15 + 2.6 * Math.max(0, nWood(x, y) - 0.35) / 0.65;
      let r = rnd();
      for (const [tex, p] of th.props) {
        if (r < p * mult) {
          placeL(tex, x, y, !SOFT.has(tex));
          break;
        }
        r -= p * mult;
      }
    }
  }
  // ---- cỏ hoa trang trí (cả ven đường, trừ trên đường và đấu trường)
  const onRoad = new Set(roadCells.map(([x, y]) => y * W + x));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (solid[y][x] || onRoad.has(y * W + x) || (x >= arena.x0 && x <= arena.x1 && y >= arena.y0 && y <= arena.y1)) continue;
      if (ground[y][x] === TILE.WATER || ground[y][x] === TILE.LAVA) continue;
      let r = rnd();
      for (const [tex, p] of th.deco) {
        if (r < p) {
          placeL(tex, x, y, !SOFT.has(tex));
          break;
        }
        r -= p;
      }
    }
  }

  // ---- quái
  const z = ZONE_DEFS[id - 1];
  const pad = (r: Rect, n: number): Rect => ({ x0: r.x0 - n, y0: r.y0 - n, x1: r.x1 + n, y1: r.y1 + n });
  const spawners: Spawner[] = [
    { monster: z.monster, count: ZONE_MOBS, area: { x0: 2, y0: 2, x1: W - 3, y1: H - 3 }, avoid: [{ x0: 0, y0: MY - 6, x1: 10, y1: MY + 6 }, pad(arena, 2)] },
    { monster: z.boss, count: 1, area: { x0: ax - 2, y0: ay - 2, x1: ax + 2, y1: ay + 2 }, avoid: [] },
  ];
  const signs = [{ x: ax + 2.5, y: signY, text: `🪧 ⚠️ Đấu trường Boss: 👑 ${MONSTERS[z.boss].name}. Hạ boss nhận rương vàng, kim cương và trang bị độc quyền!` }];
  return { spawners, signs };
}
