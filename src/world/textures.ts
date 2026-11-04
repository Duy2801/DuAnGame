import Phaser from 'phaser';
import { CROPS } from '../game/config/farm';
import { mulberry32 } from '../game/utils';
import { AVATAR_KEYS, AVATAR_RES, FRAME_H, FRAME_W, NPC_LOOKS, avatarFrames, drawAvatarSheet, type AvatarLook } from '../art/avatar';
import { ANIM2_KEYS, drawWorld2, drawZoneTiles } from './textures2';
import { drawRealty } from './textures3';
import { drawMall } from './textures4';
import { drawLake } from './lakeArt';
import { drawWildTiles, drawWilds } from './wildArt';

// Toàn bộ pixel art được vẽ bằng code (không cần file ảnh).
// Khi có bộ asset thật chỉ cần load ảnh trùng key là thay được.

export type Ctx = CanvasRenderingContext2D;
export const T = 16;

const OUTLINE = '#24180f';

export function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void, frames?: { name: string; x: number; y: number; w: number; h: number }[]) {
  // đã có ảnh thật nạp từ public/assets → dùng ảnh đó, không vẽ
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  draw(c);
  frames?.forEach((f) => tex.add(f.name, 0, f.x, f.y, f.w, f.h));
  tex.refresh();
}

export const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};

export function ellipse(c: Ctx, cx: number, cy: number, rx: number, ry: number, col: string) {
  c.fillStyle = col;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) c.fillRect(x, y, 1, 1);
    }
  }
}

/** Viền đậm 1px quanh mọi pixel đặc — tạo nét pixel art "xịn" */
export function outline(c: Ctx, w: number, h: number, col = OUTLINE) {
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 40) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
    }
  }
  c.putImageData(new ImageData(out, w, h), 0, 0);
}

export function speckle(c: Ctx, ox: number, oy: number, w: number, h: number, cols: string[], n: number, rnd: () => number, size: [number, number] = [1, 1]) {
  for (let i = 0; i < n; i++) {
    R(c, ox + Math.floor(rnd() * (w - size[0] + 1)), oy + Math.floor(rnd() * (h - size[1] + 1)), size[0], size[1], cols[Math.floor(rnd() * cols.length)]);
  }
}

// ---------------------------------------------------------------- Tiles

export const TILE = {
  GRASS: 0, GRASS2: 1, FLOWERS: 2, PATH: 3, DARK: 4, DARK2: 5, STONE: 6, STONE2: 7, WATER: 8, WATER2: 9,
  CAVE: 10, CAVE2: 11, BASALT: 12, BASALT2: 13, LAVA: 14, LAVA2: 15, HILL: 16, SAND: 17, DOCK: 18,
  MOSS: 19, MOSS2: 20, SWAMP: 21, SWAMP2: 22, DIRT: 23, DIRT2: 24, GRAVE: 25, GRAVE2: 26, DESERT: 27, DESERT2: 28,
  SNOW: 29, SNOW2: 30, ICE: 31, ICE2: 32, TOXIC: 33, TOXIC2: 34, ROCK: 35, ROCK2: 36, BRICK: 37, BRICK2: 38,
  VOID: 39, VOID2: 40, GOLD: 41, GOLD2: 42, PLAZA: 43, CAMP: 44, PETALS: 45, ARENA: 46, ARENA2: 47,
} as const;
export const TILE_COUNT = 48;

function drawTiles(scene: Phaser.Scene) {
  const rnd = mulberry32(7);
  canvas(scene, 'tiles', T * TILE_COUNT, T, (c) => {
    drawZoneTiles(c, rnd);
    drawWildTiles(c, rnd);
    // hang pha lê
    for (const i of [10, 11]) {
      const ox = i * T;
      R(c, ox, 0, T, T, '#3a3548');
      speckle(c, ox, 0, T, T, ['#2c2838'], 14, rnd);
      speckle(c, ox, 0, T, T, ['#4a4560'], 8, rnd, [2, 1]);
      if (i === 11) speckle(c, ox, 0, T, T, ['#7fe8ff'], 3, rnd);
    }
    // núi lửa
    for (const i of [12, 13]) {
      const ox = i * T;
      R(c, ox, 0, T, T, '#3a2e2a');
      speckle(c, ox, 0, T, T, ['#2a201c'], 14, rnd, [2, 1]);
      speckle(c, ox, 0, T, T, ['#4a3a34'], 8, rnd);
      if (i === 13) speckle(c, ox, 0, T, T, ['#e8701a', '#c8502a'], 4, rnd);
    }
    for (const [i, s] of [[14, 0], [15, 5]] as const) {
      const ox = i * T;
      R(c, ox, 0, T, T, '#e8501a');
      for (const [bx, by] of [[2, 3], [9, 1], [5, 9], [12, 11], [0, 13]]) R(c, ox + ((bx + s) % 14), (by + s) % 14, 3, 2, '#ffb020');
      for (const [bx, by] of [[7, 5], [1, 7], [11, 6]]) R(c, ox + ((bx + s) % 14), by, 2, 2, '#a8300a');
    }
    // đồi cỏ
    R(c, 16 * T, 0, T, T, '#7cbf4f');
    speckle(c, 16 * T, 0, T, T, ['#62a843'], 8, rnd);
    speckle(c, 16 * T, 0, T, T, ['#9ad66f'], 8, rnd, [1, 2]);
    // cát bờ hồ
    R(c, 17 * T, 0, T, T, '#e8d29a');
    speckle(c, 17 * T, 0, T, T, ['#d8bf82', '#f4e4b8'], 16, rnd);
    // cầu tàu gỗ
    R(c, 18 * T, 0, T, T, '#a8784a');
    for (const y of [3, 7, 11, 15]) R(c, 18 * T, y, T, 1, '#7a5230');
    for (const [x, y] of [[2, 1], [13, 1], [2, 9], [13, 9]]) R(c, 18 * T + x, y, 1, 1, '#4a3a2a');
    R(c, 18 * T, 0, 1, T, '#7a5230');
    R(c, 18 * T + 15, 0, 1, T, '#7a5230');
    const grass = (i: number, base: string, dark: string, light: string, blades: number) => {
      const ox = i * T;
      R(c, ox, 0, T, T, base);
      speckle(c, ox, 0, T, T, [dark], 10, rnd);
      speckle(c, ox, 0, T, T, [light], blades, rnd, [1, 2]);
    };
    grass(0, '#5fa340', '#4e8c35', '#7cc157', 6);
    grass(1, '#62a843', '#4e8c35', '#86c95e', 10);
    grass(2, '#5fa340', '#4e8c35', '#7cc157', 4);
    for (const [fx, fy, col] of [[3, 4, '#f4f0e8'], [10, 9, '#f6d34a'], [6, 12, '#f08aa8']] as const) {
      R(c, 2 * T + fx, fy, 1, 1, '#f6d34a');
      R(c, 2 * T + fx - 1, fy, 1, 1, col);
      R(c, 2 * T + fx + 1, fy, 1, 1, col);
      R(c, 2 * T + fx, fy - 1, 1, 1, col);
      R(c, 2 * T + fx, fy + 1, 1, 1, col);
    }
    // đường đất
    R(c, 3 * T, 0, T, T, '#c9a36b');
    speckle(c, 3 * T, 0, T, T, ['#b48d58', '#d8b77f'], 14, rnd);
    speckle(c, 3 * T, 0, T, T, ['#9c7748'], 3, rnd, [2, 1]);
    grass(4, '#3f7a3a', '#33662f', '#4f9146', 6);
    grass(5, '#42803c', '#33662f', '#559a4b', 9);
    // đá lát phế tích
    for (const i of [6, 7]) {
      const ox = i * T;
      R(c, ox, 0, T, T, '#8d8b83');
      R(c, ox, 7, T, 1, '#6f6d66');
      R(c, ox, 15, T, 1, '#6f6d66');
      R(c, ox + 5, 0, 1, 7, '#6f6d66');
      R(c, ox + 11, 8, 1, 7, '#6f6d66');
      R(c, ox + 1, 1, 3, 1, '#a3a199');
      R(c, ox + 7, 9, 3, 1, '#a3a199');
    }
    R(c, 7 * T + 2, 3, 4, 1, '#55534d');
    R(c, 7 * T + 5, 4, 1, 3, '#55534d');
    speckle(c, 7 * T, 0, T, T, ['#5f8a3e', '#6f9a48'], 7, rnd);
    // nước 2 frame
    for (const [i, shift] of [[8, 0], [9, 3]] as const) {
      const ox = i * T;
      R(c, ox, 0, T, T, '#3b8bd4');
      R(c, ox, 0, T, 2, '#4f9de0');
      for (const [wx, wy] of [[2, 4], [9, 7], [4, 11], [11, 13]]) R(c, ox + ((wx + shift) % 13), wy, 3, 1, '#8cc8f2');
    }
  });
}

// ---------------------------------------------------------------- Nhân vật (ghép lớp — xem src/art/avatar.ts)

/**
 * Sprite nhân vật vẽ ở AVATAR_RES (×4) cho nét mịn, nhưng khung được "thu" về kích thước logic FRAME_W×FRAME_H
 * để vị trí, origin, va chạm trong thế giới giữ nguyên. WebGL: cắt khung logic nhưng giữ UV của vùng hi-res.
 * Canvas: giữ vùng cắt hi-res và đặt resolution của nguồn ảnh.
 */
function shrinkFrame(fr: Phaser.Textures.Frame, res: number, canvasMode: boolean) {
  const f = fr as unknown as Record<string, number> & { data: any; source: { resolution: number } };
  const w = fr.cutWidth / res;
  const h = fr.cutHeight / res;
  if (canvasMode) f.source.resolution = res;
  else {
    f.cutWidth = w;
    f.cutHeight = h;
  }
  f.width = w;
  f.height = h;
  f.halfWidth = w / 2;
  f.halfHeight = h / 2;
  f.centerX = Math.floor(w / 2);
  f.centerY = Math.floor(h / 2);
  const d = f.data;
  d.sourceSize.w = w;
  d.sourceSize.h = h;
  d.spriteSourceSize.w = w;
  d.spriteSourceSize.h = h;
  d.spriteSourceSize.r = w;
  d.spriteSourceSize.b = h;
  d.radius = 0.5 * Math.sqrt(w * w + h * h);
}

function avatarTexture(scene: Phaser.Scene, key: string, look: AvatarLook) {
  // đã có ảnh thật nạp từ public/assets → dùng ảnh đó
  if (scene.textures.exists(key)) return;
  const res = AVATAR_RES;
  const tex = scene.textures.createCanvas(key, FRAME_W * 9 * res, FRAME_H * res)!;
  drawAvatarSheet(tex.getContext(), look, res);
  const canvasMode = scene.sys.renderer.type === Phaser.CANVAS;
  for (const f of avatarFrames(res)) {
    const fr = tex.add(f.name, 0, f.x, f.y, f.w, f.h);
    if (fr) shrinkFrame(fr, res, canvasMode);
  }
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  tex.refresh();
}

/** Vẽ lại nhân vật người chơi khi đổi đồ (giữ nguyên key + khung để animation vẫn chạy) */
export function renderHero(scene: Phaser.Scene, look: AvatarLook) {
  if (!scene.textures.exists('hero')) {
    avatarTexture(scene, 'hero', look);
    return;
  }
  const tex = scene.textures.get('hero') as Phaser.Textures.CanvasTexture;
  drawAvatarSheet(tex.getContext(), look);
  tex.refresh();
}

// ---------------------------------------------------------------- Quái vật

function drawMonsters(scene: Phaser.Scene) {
  const blob = (c: Ctx, ox: number, oy: number, cx: number, cy: number, rx: number, ry: number, main: string, dark: string, light: string, eyeY: number) => {
    ellipse(c, ox + cx, oy + cy, rx, ry, main);
    ellipse(c, ox + cx, oy + cy + ry * 0.45, rx * 0.85, ry * 0.45, dark);
    ellipse(c, ox + cx, oy + cy - ry * 0.05, rx * 0.88, ry * 0.7, main);
    R(c, ox + Math.round(cx - rx * 0.55), oy + Math.round(cy - ry * 0.55), Math.max(1, Math.round(rx * 0.3)), 1, light);
    R(c, ox + Math.round(cx - rx * 0.65), oy + Math.round(cy - ry * 0.3), 1, 1, light);
    const ex = Math.max(2, Math.round(rx * 0.35));
    const es = rx > 10 ? 2 : 1;
    R(c, ox + Math.round(cx - ex) - (es - 1), oy + eyeY, es, 2 * es, '#1e1a1a');
    R(c, ox + Math.round(cx + ex) - 1, oy + eyeY, es, 2 * es, '#1e1a1a');
  };

  canvas(scene, 'slime', 32, 16, (c) => {
    blob(c, 0, 0, 8, 10.5, 6.5, 5, '#63c74d', '#3e8948', '#c4f0a8', 9);
    blob(c, 16, 0, 8, 11.5, 7.5, 4, '#63c74d', '#3e8948', '#c4f0a8', 10);
    outline(c, 32, 16);
  }, [{ name: '0', x: 0, y: 0, w: 16, h: 16 }, { name: '1', x: 16, y: 0, w: 16, h: 16 }]);

  canvas(scene, 'slime_king', 64, 32, (c) => {
    for (const [i, cy, ry, rx] of [[0, 20, 10.5, 13], [1, 22, 8.5, 14.5]] as const) {
      const ox = i * 32;
      blob(c, ox, 0, 16, cy, rx, ry, '#a05ad8', '#6b3a9e', '#e0c0ff', Math.round(cy - 2));
      const top = Math.round(cy - ry) - 5;
      R(c, ox + 10, top + 2, 12, 4, '#f2c230');
      R(c, ox + 10, top, 2, 2, '#f2c230');
      R(c, ox + 15, top - 1, 2, 3, '#f2c230');
      R(c, ox + 20, top, 2, 2, '#f2c230');
      R(c, ox + 15, top + 3, 2, 2, '#e8302a');
      R(c, ox + 11, top + 3, 1, 1, '#ffffff');
      // lông mày giận dữ
      R(c, ox + 9, Math.round(cy - 4), 4, 1, '#3a1a4a');
      R(c, ox + 19, Math.round(cy - 4), 4, 1, '#3a1a4a');
    }
    outline(c, 64, 32);
  }, [{ name: '0', x: 0, y: 0, w: 32, h: 32 }, { name: '1', x: 32, y: 0, w: 32, h: 32 }]);

  canvas(scene, 'wolf', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const body = '#6d7480';
      const light = '#a9b0ba';
      R(c, o + 3, 7, 9, 4, body);
      R(c, o + 4, 10, 7, 1, light);
      R(c, o + 10, 4, 4, 5, body);
      R(c, o + 13, 6, 3, 2, body);
      R(c, o + 15, 6, 1, 1, '#1e1a1a');
      R(c, o + 10, 2, 1, 2, body);
      R(c, o + 13, 2, 1, 2, body);
      R(c, o + 12, 5, 1, 1, '#f0d040');
      R(c, o + 1, 6 + f, 2, 2, body);
      R(c, o + 0, 5 + f, 1, 1, body);
      const legs = f === 0 ? [4, 6, 9, 11] : [3, 7, 8, 12];
      legs.forEach((x, i) => R(c, o + x, 11, 1, i % 2 === f ? 3 : 2, '#4f5560'));
    }
    outline(c, 32, 16);
  }, [{ name: '0', x: 0, y: 0, w: 16, h: 16 }, { name: '1', x: 16, y: 0, w: 16, h: 16 }]);
}

// ---------------------------------------------------------------- Thiên nhiên

function drawNature(scene: Phaser.Scene) {
  canvas(scene, 'tree', 32, 40, (c) => {
    // 1. Bóng râm dưới gốc cây (Ground Cast Shadow)
    ellipse(c, 16, 38, 12, 2.5, '#1b3816');

    // 2. Thân cây & Rễ bạnh gồ ghề (Textured Trunk & Roots)
    // Rễ cây cắm sâu và choãi ra mặt đất
    R(c, 10, 36, 3, 2, '#503218');
    R(c, 11, 35, 2, 2, '#6b4221');
    R(c, 19, 35, 3, 3, '#3d2410');
    R(c, 21, 36, 2, 2, '#2d180a');
    // Thân chính hình trụ với rãnh vỏ cây 3D
    for (let y = 20; y <= 37; y++) {
      const taper = y > 34 ? (y - 34) * 0.8 : 0;
      const x0 = Math.round(13 - taper);
      const x1 = Math.round(18 + taper);
      const rowW = x1 - x0 + 1;
      // Vỏ cây: sáng bên trái, tối bên phải
      R(c, x0, y, rowW, 1, '#5a3518');
      R(c, x0, y, 2, 1, '#8e592f'); // vệt sáng vỏ cây
      R(c, x0 + 2, y, 1, 1, '#734622');
      R(c, x1 - 1, y, 2, 1, '#341d0c'); // bóng tối vỏ cây
    }
    // Rãnh vỏ cây gồ ghề tự nhiên
    R(c, 14, 27, 1, 6, '#3a200e');
    R(c, 16, 25, 1, 8, '#3a200e');
    R(c, 15, 32, 1, 4, '#84522a');
    // Rêu ẩm xanh bám chân gốc
    R(c, 11, 36, 2, 1, '#4c8528');
    R(c, 13, 35, 2, 1, '#5d9c34');
    R(c, 18, 35, 2, 1, '#3a6b20');

    // Cành cây lớn vươn vào tán lá
    R(c, 11, 23, 3, 2, '#5a3518');
    R(c, 10, 21, 3, 2, '#482a13');
    R(c, 18, 22, 3, 2, '#482a13');
    R(c, 20, 20, 3, 2, '#351e0d');

    // 3. Tán lá cây bồng bềnh 3D (Lush Volumetric Leaf Clusters)
    // Tầng 1: Bóng tối sâu bên dưới và phía sau
    ellipse(c, 16, 17, 14, 11, '#1b4018');
    ellipse(c, 21, 19, 8, 6.5, '#163614');
    ellipse(c, 11, 20, 7.5, 6, '#1e441a');

    // Tầng 2: Các búi lá thân cây phía dưới
    ellipse(c, 21, 17, 7.5, 6.5, '#285822');
    ellipse(c, 20, 16, 6, 5, '#356e2c');
    ellipse(c, 16, 20, 6.5, 5, '#2d6226');
    ellipse(c, 16, 19, 5, 4, '#3d7e32');
    ellipse(c, 11, 18, 6.5, 5.5, '#35702d');
    ellipse(c, 11, 17, 5, 4, '#468c3a');

    // Tầng 3: Các búi lá thân cây tầm trung
    ellipse(c, 22, 13, 7.5, 6.5, '#336d2a');
    ellipse(c, 21, 12, 6, 5, '#448835');
    ellipse(c, 20, 11, 4, 3.5, '#56a242');
    ellipse(c, 9, 13, 7.5, 6.5, '#428834');
    ellipse(c, 9, 12, 6, 5, '#55a43f');
    ellipse(c, 9, 11, 4, 3.5, '#6cbd4c');
    ellipse(c, 16, 12, 9, 8, '#428834');
    ellipse(c, 15, 11, 7.5, 6.5, '#58a842');
    ellipse(c, 15, 10, 5.5, 4.5, '#70c44f');

    // Tầng 4: Các búi lá đón nắng đỉnh cây
    ellipse(c, 20, 7, 5.5, 4.5, '#4d9a3b');
    ellipse(c, 19, 6, 4, 3.5, '#68ba4e');
    ellipse(c, 16, 6, 6, 5, '#5ea840');
    ellipse(c, 15, 5, 4.5, 4, '#7ec850');
    ellipse(c, 14, 4, 3, 2.5, '#a0e864');
    ellipse(c, 11, 7, 6.5, 5.5, '#68ba4e');
    ellipse(c, 10, 6, 5, 4, '#8ada5a');
    ellipse(c, 9, 5, 3.5, 2.5, '#aef06e');
    // Đốm nắng phản chiếu rực rỡ
    R(c, 8, 4, 2, 2, '#cbf886');
    R(c, 13, 3, 2, 1, '#cbf886');
    R(c, 14, 7, 2, 1, '#aef06e');

    // 4. Tỉa lá vụn quanh mép ngoài (phá vỡ hình khối bầu dục phẳng)
    R(c, 5, 11, 2, 3, '#35702d');
    R(c, 4, 13, 2, 2, '#428834');
    R(c, 26, 11, 2, 2, '#285822');
    R(c, 27, 13, 2, 2, '#285822');
    R(c, 8, 19, 3, 2, '#2d6226');
    R(c, 22, 19, 3, 2, '#1e441a');
    R(c, 15, 1, 3, 2, '#7ec850');
    R(c, 11, 2, 2, 2, '#8ada5a');

    outline(c, 32, 40);
  });
  canvas(scene, 'pine', 24, 40, (c) => {
    // Bóng dưới gốc thông
    ellipse(c, 12, 38, 8, 2, '#142812');
    // Thân thông vỏ sần sùi
    R(c, 9, 36, 2, 2, '#482a15');
    R(c, 13, 36, 2, 2, '#28160a');
    for (let y = 28; y <= 37; y++) {
      R(c, 10, y, 4, 1, '#5a361c');
      R(c, 10, y, 1, 1, '#7e4e2a');
      R(c, 13, y, 1, 1, '#341d0e');
    }
    // 4 tầng tán kim thông nhọn (Evergreen Tier Boughs)
    // Tầng 4 (dưới cùng, rộng nhất)
    for (let i = 0; i < 9; i++) {
      const hw = Math.round(3 + (i * 8) / 8);
      R(c, 12 - hw, 23 + i, hw * 2, 1, i >= 6 ? '#1b4020' : '#26542c');
      R(c, 12 - Math.round(hw * 0.6), 23 + i, 2, 1, '#38783e');
    }
    for (let x = 3; x <= 21; x += 3) R(c, x, 32, 2, 1, '#16361a');

    // Tầng 3
    for (let i = 0; i < 8; i++) {
      const hw = Math.round(2 + (i * 7) / 7);
      R(c, 12 - hw, 16 + i, hw * 2, 1, i >= 5 ? '#204a25' : '#2f6836');
      R(c, 12 - Math.round(hw * 0.6), 16 + i, 2, 1, '#488c4f');
    }
    for (let x = 4; x <= 20; x += 3) R(c, x, 24, 2, 1, '#1b4020');

    // Tầng 2
    for (let i = 0; i < 7; i++) {
      const hw = Math.round(2 + (i * 5) / 6);
      R(c, 12 - hw, 10 + i, hw * 2, 1, i >= 5 ? '#26582c' : '#387a41');
      R(c, 12 - Math.round(hw * 0.6), 10 + i, 2, 1, '#56a65e');
    }
    for (let x = 6; x <= 18; x += 3) R(c, x, 17, 2, 1, '#204a25');

    // Tầng 1 (đỉnh nhọn)
    for (let i = 0; i < 7; i++) {
      const hw = Math.round(1 + (i * 3.5) / 6);
      R(c, 12 - hw, 4 + i, hw * 2, 1, i >= 5 ? '#2f6c37' : '#458e4e');
      R(c, 12 - Math.round(hw * 0.5), 4 + i, 1, 1, '#6ec678');
    }
    R(c, 11, 2, 2, 2, '#509e5a');
    R(c, 11, 1, 2, 1, '#6ec678'); // ngọn thông nhọn

    outline(c, 24, 40);
  });
  canvas(scene, 'bush', 16, 16, (c) => {
    // Bóng dưới bụi cây
    ellipse(c, 8, 14, 7, 2, '#183816');
    // Khối tán bụi tròn 3D
    ellipse(c, 8, 9, 7, 5.5, '#22501c');
    ellipse(c, 11, 8, 4.5, 4, '#2e6826');
    ellipse(c, 6, 8, 5, 4.5, '#3e8832');
    ellipse(c, 6, 7, 4, 3.5, '#56a842');
    ellipse(c, 5, 6, 2.5, 2, '#76cc5a');
    // Chùm quả mọng đỏ ruby
    R(c, 4, 8, 2, 2, '#e11d48'); R(c, 4, 8, 1, 1, '#ffffff');
    R(c, 10, 10, 2, 2, '#e11d48'); R(c, 10, 10, 1, 1, '#ffffff');
    R(c, 7, 11, 2, 2, '#e11d48'); R(c, 7, 11, 1, 1, '#ffffff');
    // Tỉa lá viền ngoài
    R(c, 2, 9, 2, 2, '#35722b');
    R(c, 13, 8, 2, 2, '#255820');
    outline(c, 16, 16);
  });
  canvas(scene, 'rock', 16, 16, (c) => {
    ellipse(c, 8, 11, 6.5, 4.5, '#7d7b76');
    ellipse(c, 7, 10, 5, 3.5, '#9a9892');
    R(c, 5, 8, 3, 1, '#c0beb8');
    outline(c, 16, 16);
  });
  canvas(scene, 'pillar', 16, 32, (c) => {
    R(c, 3, 8, 10, 22, '#9a978e');
    R(c, 3, 8, 3, 22, '#b3b0a6');
    R(c, 10, 8, 3, 22, '#7d7a72');
    R(c, 2, 28, 12, 4, '#8a877e');
    R(c, 3, 6, 4, 2, '#9a978e');
    R(c, 9, 4, 4, 4, '#9a978e');
    R(c, 5, 14, 3, 1, '#6a675f');
    R(c, 6, 15, 1, 3, '#6a675f');
    R(c, 4, 22, 3, 2, '#5f8a3e');
    outline(c, 16, 32);
  });
}

// ---------------------------------------------------------------- Công trình

interface HouseOpt {
  wall: string;
  wallDark: string;
  roof: string;
  roofDark: string;
  trim: string;
  door: string;
  stone?: boolean;
}

export function drawHouse(c: Ctx, w: number, h: number, o: HouseOpt, doorW = 10) {
  const roofH = Math.round(h * 0.52);

  // 1. Chân móng đá tảng (Heavy Stone Plinth Foundation)
  const foundY = h - 6;
  R(c, 2, foundY, w - 4, 5, '#5c5a54'); // base dark stone
  R(c, 2, foundY, w - 4, 1, '#9e9c94'); // top highlight ridge
  R(c, 2, foundY + 1, w - 4, 3, '#787670'); // mid stone body
  // Khối đá so le chân móng
  for (let x = 6; x < w - 6; x += 8) {
    R(c, x, foundY + 1, 1, 4, '#44423e');
  }
  for (let x = 10; x < w - 6; x += 8) {
    R(c, x, foundY + 3, 1, 2, '#44423e');
  }
  R(c, 1, h - 1, w - 2, 1, '#24180f'); // ground contact line
  // Rêu phong chân móng
  R(c, 2, foundY + 3, 2, 2, '#4a7d2c');
  R(c, w - 4, foundY + 3, 2, 2, '#4a7d2c');

  // 2. Thân tường (Wall Body)
  const wallTop = roofH;
  const wallH = foundY - wallTop;
  R(c, 3, wallTop, w - 6, wallH, o.wall);

  if (o.stone) {
    // Tường đá hoa cương / gạch phiến tỉ mỉ
    for (let y = wallTop; y < foundY; y += 4) {
      const row = Math.floor((y - wallTop) / 4);
      const offset = (row % 2) * 5;
      // Đường vữa ngang
      R(c, 3, y + 3, w - 6, 1, o.wallDark);
      // Các khối đá dọc
      for (let x = 4 + offset; x < w - 5; x += 10) {
        R(c, x, y, 1, 4, o.wallDark);
        // Highlight cạnh trên của viên đá
        R(c, x + 1, y, Math.min(8, w - 6 - x), 1, '#ffffff20');
      }
    }
  } else {
    // Tường ván gỗ ngang hoặc tường thạch cao có gờ nổi
    for (let y = wallTop; y < foundY; y += 4) {
      R(c, 3, y + 3, w - 6, 1, o.wallDark);
      R(c, 3, y, w - 6, 1, '#ffffff15');
    }
  }

  // 3. Khung cột gỗ chịu lực góc tường (Timber Corner Posts & Beams)
  // Cột góc trái
  R(c, 3, wallTop, 4, wallH, o.trim);
  R(c, 3, wallTop, 1, wallH, '#ffffff25');
  R(c, 6, wallTop, 1, wallH, '#00000030');
  // Cột góc phải
  R(c, w - 7, wallTop, 4, wallH, o.trim);
  R(c, w - 7, wallTop, 1, wallH, '#ffffff25');
  R(c, w - 4, wallTop, 1, wallH, '#00000030');

  // Xà ngang giữa tầng (nếu tường đủ cao)
  if (wallH >= 20) {
    const beamY = wallTop + Math.round(wallH * 0.42);
    R(c, 3, beamY, w - 6, 3, o.trim);
    R(c, 3, beamY, w - 6, 1, '#ffffff25');
    R(c, 3, beamY + 2, w - 6, 1, '#00000035');
  }

  // 4. Bóng đổ mái hiên lên tường (Roof Eaves Ambient Shadow)
  R(c, 3, wallTop, w - 6, 1, 'rgba(20, 10, 5, 0.45)');
  R(c, 3, wallTop + 1, w - 6, 1, 'rgba(20, 10, 5, 0.30)');
  R(c, 3, wallTop + 2, w - 6, 1, 'rgba(20, 10, 5, 0.15)');

  // 5. Mái nhà 3D (Detailed 3D Roof)
  // Ống khói gạch đá ấm cúng (Chimney)
  const chimX = w - 16;
  const chimTop = 2;
  const chimH = roofH - 8;
  if (w >= 70 && chimX > 40) {
    R(c, chimX - 1, chimTop, 8, chimH, '#7a3e30'); // thân ống khói gạch
    R(c, chimX - 1, chimTop, 8, 1, '#9e5242'); // gờ gạch sáng
    for (let cy = chimTop + 2; cy < chimTop + chimH; cy += 3) {
      R(c, chimX - 1, cy, 8, 1, '#52261c');
    }
    // Mũ ống khói đá
    R(c, chimX - 2, chimTop - 1, 10, 2, '#9a9488');
    R(c, chimX - 2, chimTop - 1, 10, 1, '#c0baa8');
    // Lỗ thoát khói
    R(c, chimX, chimTop - 1, 6, 1, '#2b1c18');
  }

  // Thân mái nhà dốc xuống từng lớp
  for (let y = 1; y < roofH; y++) {
    const inset = Math.round((roofH - y) * 0.22);
    const startX = Math.max(1, inset - 1);
    const rowW = w - startX * 2;
    const isShingleLip = (y % 3 === 2);
    const isShingleHighlight = (y % 3 === 0);
    const col = isShingleLip ? o.roofDark : o.roof;
    R(c, startX, y, rowW, 1, col);
    if (isShingleHighlight) {
      // Viền sáng trên đỉnh mỗi hàng ngói
      R(c, startX, y, rowW, 1, '#ffffff20');
    }
  }

  // Gờ nối ngói so le (Vertical Tile Grooves)
  for (let y = 2; y < roofH - 1; y += 3) {
    const inset = Math.round((roofH - y) * 0.22);
    const offset = (Math.floor(y / 3) % 2) * 4;
    for (let x = inset + 3 + offset; x < w - inset - 3; x += 8) {
      R(c, x, y, 1, 2, o.roofDark);
    }
  }

  // Đỉnh nóc nhà (Roof Ridge Beam)
  const peakInset = Math.round((roofH - 1) * 0.22);
  R(c, peakInset + 1, 1, w - (peakInset + 1) * 2, 2, o.trim);
  R(c, peakInset + 1, 1, w - (peakInset + 1) * 2, 1, '#ffffff35');
  // Chóp nóc nhô ra hai đầu
  R(c, peakInset, 0, 2, 3, o.trim);
  R(c, w - peakInset - 2, 0, 2, 3, o.trim);

  // Mái hiên nhô ra ngoài (Overhang Fascia Board)
  R(c, 0, roofH - 2, w, 2, o.roofDark);
  R(c, 0, roofH - 1, w, 1, o.trim);
  // Răng cưa ngói rìa mái hiên (Scalloped Tile Eaves)
  for (let x = 1; x < w - 1; x += 3) {
    R(c, x, roofH, 2, 1, o.roofDark);
  }

  // Ô thoáng gác mái tròn xinh xắn (Round Attic Window)
  if (roofH >= 28 && w >= 64) {
    const cx = Math.round(w / 2);
    const cy = Math.round(roofH * 0.42);
    ellipse(c, cx, cy, 4.5, 4.5, o.trim);
    ellipse(c, cx, cy, 3, 3, '#1c2e42');
    R(c, cx - 3, cy, 7, 1, o.trim);
    R(c, cx, cy - 3, 1, 7, o.trim);
    R(c, cx - 1, cy - 2, 1, 1, '#c0e4ff');
  }

  // 6. Cửa chính (Front Door & Porch)
  const dx = Math.round(w / 2 - doorW / 2);
  const doorH = 16;
  const doorY = foundY - doorH + 1;

  // Bậc thềm đá trước cửa
  R(c, dx - 2, foundY, doorW + 4, 3, '#8c8a82');
  R(c, dx - 2, foundY, doorW + 4, 1, '#b5b3ab');
  R(c, dx - 1, foundY + 2, doorW + 2, 1, '#5a5852');

  // Khung cửa vòm / rầm cửa
  R(c, dx - 1, doorY - 1, doorW + 2, doorH, o.trim);
  R(c, dx - 1, doorY - 1, doorW + 2, 1, '#ffffff30');

  // Cánh cửa gỗ
  R(c, dx, doorY, doorW, doorH - 1, o.door);
  if (doorW >= 10) {
    const midD = Math.round(dx + doorW / 2);
    R(c, midD, doorY + 1, 1, doorH - 2, '#00000030');
  }

  // Ô kính lấy sáng vòm trên cửa
  if (doorW >= 8) {
    const winW = doorW - 4;
    R(c, dx + 2, doorY + 2, winW, 3, '#fef08a');
    R(c, dx + 2, doorY + 2, winW, 1, '#ffffff');
    R(c, dx + Math.round(doorW / 2), doorY + 2, 1, 3, o.trim);
  }

  // Bản lề sắt rèn (Iron Strap Hinges)
  R(c, dx, doorY + 6, 3, 1, '#2d2830');
  R(c, dx, doorY + 11, 3, 1, '#2d2830');

  // Tay nắm cửa bằng đồng vàng (Brass Doorknob)
  R(c, dx + doorW - 3, doorY + 9, 2, 2, '#f59e0b');
  R(c, dx + doorW - 3, doorY + 9, 1, 1, '#fef08a');

  // 7. Cửa sổ với khung kính phản quang & bồn hoa (Windows with Flower Boxes)
  const win = (wx: number) => {
    const wy = roofH + 5;
    const ww = 10;
    const wh = 8;
    // Khung gỗ ngoài
    R(c, wx - 1, wy - 1, ww + 2, wh + 2, o.trim);
    R(c, wx - 1, wy - 1, ww + 2, 1, '#ffffff35');
    // Kính màu xanh sâu thẳm
    R(c, wx, wy, ww, wh, '#1d3b5e');
    // Rèm cửa hai bên ấm cúng
    R(c, wx, wy, 2, wh, '#fbf8ee');
    R(c, wx + ww - 2, wy, 2, wh, '#fbf8ee');
    // Thanh nan cửa sổ chữ thập
    const mx = wx + Math.round(ww / 2);
    const my = wy + Math.round(wh / 2);
    R(c, wx, my, ww, 1, o.trim);
    R(c, mx, wy, 1, wh, o.trim);
    // Vết chói bóng sáng chéo trên mặt kính
    R(c, wx + 2, wy + 1, 2, 1, '#9fd8ff');
    R(c, wx + 3, wy + 2, 2, 1, '#9fd8ff');
    R(c, wx + 5, wy + 4, 2, 1, '#ffffff90');

    // Bồn hoa xinh xắn dưới cửa sổ (Window Flower Box)
    const boxY = wy + wh;
    R(c, wx - 1, boxY, ww + 2, 3, o.trim);
    R(c, wx - 1, boxY + 2, ww + 2, 1, '#00000030');
    // Tán lá xanh tràn ra ngoài bồn
    R(c, wx - 1, boxY - 1, ww + 2, 2, '#387c26');
    // Những bông hoa rực rỡ (đỏ, vàng, hồng, trắng)
    R(c, wx, boxY - 1, 2, 2, '#f43f5e');
    R(c, wx + 3, boxY - 1, 2, 2, '#fbbf24');
    R(c, wx + 6, boxY - 1, 2, 2, '#f472b6');
    R(c, wx + 8, boxY - 1, 2, 2, '#ffffff');
  };

  const leftWinX = Math.round(w * 0.16);
  const rightWinX = Math.round(w * 0.84 - 10);
  if (leftWinX + 11 < dx) win(leftWinX);
  if (rightWinX > dx + doorW + 1) win(rightWinX);

  return roofH;
}

function drawBuildings(scene: Phaser.Scene) {
  canvas(scene, 'b_guild', 112, 96, (c) => {
    const roofH = drawHouse(c, 112, 96, { wall: '#e8d2a6', wallDark: '#d2b986', roof: '#b8452f', roofDark: '#8a2f1f', trim: '#7a5230', door: '#5a3a1e' }, 18);
    // khiên + kiếm chéo
    R(c, 49, roofH - 22, 14, 16, '#3d6fd1');
    R(c, 51, roofH - 8, 10, 3, '#3d6fd1');
    R(c, 54, roofH - 5, 4, 2, '#3d6fd1');
    for (let i = 0; i < 12; i++) {
      R(c, 50 + i, roofH - 21 + i, 1, 1, '#e8e8e8');
      R(c, 61 - i, roofH - 21 + i, 1, 1, '#e8e8e8');
    }
    R(c, 55, roofH - 16, 2, 2, '#f2c230');
    // cờ
    for (const x of [6, 104]) {
      R(c, x, 2, 1, 22, '#5a3a1e');
      R(c, x + 1, 3, 7, 5, '#f2c230');
      R(c, x + 1, 5, 7, 1, '#c8402f');
    }
    // biển hiệu
    R(c, 40, 96 - 26, 32, 6, '#7a5230');
    R(c, 41, 96 - 25, 30, 4, '#c9a36b');
    outline(c, 112, 96);
  });
  canvas(scene, 'b_home', 80, 64, (c) => {
    const roofH = drawHouse(c, 80, 64, { wall: '#f0dcb0', wallDark: '#dcc392', roof: '#3f6fb5', roofDark: '#2c5290', trim: '#7a5230', door: '#8a5a2e' });
    R(c, 58, 0, 8, roofH - 8, '#9a5a3a');
    R(c, 57, 0, 10, 3, '#7a4a2a');
    for (const x of [7, 63]) {
      R(c, x, roofH + 12, 10, 3, '#7a5230');
      R(c, x + 1, roofH + 10, 2, 2, '#f06090');
      R(c, x + 5, roofH + 10, 2, 2, '#f6d34a');
    }
    outline(c, 80, 64);
  });
  canvas(scene, 'b_workshop', 80, 64, (c) => {
    drawHouse(c, 80, 64, { wall: '#b98a55', wallDark: '#9a7040', roof: '#4f8f3a', roofDark: '#3a6e2a', trim: '#5a3a1e', door: '#5a3a1e' }, 14);
    R(c, 30, 64 - 30, 20, 5, '#e8d2a6');
    R(c, 33, 64 - 29, 14, 1, '#7a5230');
    outline(c, 80, 64);
  });
  canvas(scene, 'b_smith', 80, 64, (c) => {
    const roofH = drawHouse(c, 80, 64, { wall: '#9a9a94', wallDark: '#7d7d77', roof: '#555a66', roofDark: '#3c404a', trim: '#4a3a2a', door: '#2a2420', stone: true }, 14);
    R(c, 8, 0, 10, roofH - 6, '#6a6a64');
    R(c, 7, 0, 12, 3, '#4a4a44');
    R(c, 33, 64 - 15, 14, 11, '#f08a2a');
    R(c, 35, 64 - 12, 10, 6, '#f6d34a');
    outline(c, 80, 64);
  });
  canvas(scene, 'b_barn', 80, 64, (c) => {
    drawHouse(c, 80, 64, { wall: '#b03a2e', wallDark: '#952e24', roof: '#6b2a20', roofDark: '#4e1e17', trim: '#f0e6d0', door: '#8a2a20' }, 22);
    for (let i = 0; i < 13; i++) {
      R(c, Math.round(29 + i * 1.7), 64 - 16 + i, 2, 1, '#f0e6d0');
      R(c, Math.round(49 - i * 1.7), 64 - 16 + i, 2, 1, '#f0e6d0');
    }
    outline(c, 80, 64);
  });
  canvas(scene, 'b_market', 64, 48, (c) => {
    R(c, 4, 6, 3, 22, '#7a5230');
    R(c, 57, 6, 3, 22, '#7a5230');
    for (let x = 0; x < 64; x += 8) R(c, x, 2, 8, 12, (x / 8) % 2 ? '#f4ecd8' : '#d0402e');
    for (let x = 0; x < 64; x += 4) R(c, x + 1, 14, 2, 2, (Math.floor(x / 8) % 2) ? '#f4ecd8' : '#d0402e');
    R(c, 0, 1, 64, 2, '#8a2f1f');
    R(c, 4, 28, 56, 16, '#9a6b3c');
    for (let y = 31; y < 44; y += 4) R(c, 4, y, 56, 1, '#7a5230');
    R(c, 2, 26, 60, 3, '#c08a50');
    const fruit: [number, string][] = [[8, '#e0402a'], [16, '#ee7a22'], [24, '#f2cf3a'], [36, '#e8862a'], [46, '#63c74d'], [53, '#e0402a']];
    for (const [x, col] of fruit) {
      R(c, x, 22, 4, 4, col);
      R(c, x + 1, 22, 1, 1, '#ffffff');
    }
    outline(c, 64, 48);
  });
  canvas(scene, 'b_board', 32, 32, (c) => {
    // 2 cột gỗ cắm đất với vân gỗ 3D
    R(c, 5, 8, 3, 23, '#4a2c14'); R(c, 5, 8, 1, 23, '#784620');
    R(c, 24, 8, 3, 23, '#381f0d'); R(c, 24, 8, 1, 23, '#5c3518');
    // Mái che nhỏ trên bảng tin (Wooden Roof Hood)
    R(c, 1, 1, 30, 2, '#381d0c');
    R(c, 0, 3, 32, 2, '#5c3216');
    R(c, 0, 3, 32, 1, '#844a22');
    // Bảng bần ghim giấy (Cork Board with Frame)
    R(c, 2, 5, 28, 17, '#482810'); // khung gỗ ngoài
    R(c, 3, 6, 26, 15, '#be8f56'); // viền bảng bần
    R(c, 4, 7, 24, 13, '#ad7d45'); // mặt bảng bần ấm cúng
    // Các tờ thông báo ghim bằng đinh nhiều màu
    R(c, 5, 8, 7, 9, '#fefdf6'); // thông báo 1
    R(c, 14, 8, 6, 8, '#fff9e6'); // thông báo 2
    R(c, 21, 9, 6, 10, '#fef0d2'); // thông báo 3
    R(c, 13, 14, 6, 5, '#f4ece1'); // thông báo 4
    // Đinh ghim
    R(c, 8, 8, 1, 1, '#e11d48');
    R(c, 16, 8, 1, 1, '#eab308');
    R(c, 24, 9, 1, 1, '#3b82f6');
    R(c, 15, 14, 1, 1, '#e11d48');
    // Dòng chữ giả lập
    for (let y = 10; y < 15; y += 2) R(c, 6, y, 5, 1, '#94806a');
    for (let y = 10; y < 14; y += 2) R(c, 15, y, 4, 1, '#94806a');
    for (let y = 11; y < 17; y += 2) R(c, 22, y, 4, 1, '#94806a');
    outline(c, 32, 32);
  });
  canvas(scene, 'b_statue', 32, 40, (c) => {
    R(c, 6, 26, 20, 13, '#9a978e');
    R(c, 6, 26, 4, 13, '#b3b0a6');
    R(c, 4, 24, 24, 3, '#b3b0a6');
    R(c, 10, 30, 12, 4, '#7d7a72');
    R(c, 10, 6, 12, 9, '#e8b830');
    R(c, 11, 14, 10, 2, '#e8b830');
    R(c, 6, 7, 4, 2, '#e8b830');
    R(c, 6, 7, 2, 5, '#e8b830');
    R(c, 22, 7, 4, 2, '#e8b830');
    R(c, 24, 7, 2, 5, '#e8b830');
    R(c, 14, 16, 4, 4, '#c9971f');
    R(c, 11, 20, 10, 4, '#e8b830');
    R(c, 12, 7, 2, 6, '#fff2b0');
    R(c, 15, 9, 2, 2, '#c8402f');
    outline(c, 32, 40);
  });
  canvas(scene, 'b_windmill', 48, 64, (c) => {
    for (let y = 14; y < 62; y++) {
      const inset = Math.round(15 - ((y - 14) / 48) * 9);
      R(c, inset, y, 48 - inset * 2, 1, (y >> 2) % 2 ? '#d9c7a0' : '#cdb98e');
    }
    for (let y = 4; y < 16; y++) {
      const hw = Math.round(((y - 4) / 12) * 11) + 2;
      R(c, 24 - hw, y, hw * 2, 1, y % 3 ? '#8a4a2a' : '#6e3a20');
    }
    R(c, 19, 50, 10, 12, '#5a3a1e');
    R(c, 21, 30, 6, 6, '#9fd3f0');
    R(c, 6, 61, 36, 3, '#7d7b76');
    outline(c, 48, 64);
  });
  canvas(scene, 'b_blades', 48, 48, (c) => {
    for (let k = 0; k < 4; k++) {
      c.save();
      c.translate(24, 24);
      c.rotate((k * Math.PI) / 2);
      R(c, -1, -23, 3, 23, '#6b4423');
      R(c, 2, -22, 7, 17, '#f0e6d0');
      for (let y = -20; y < -5; y += 4) R(c, 2, y, 7, 1, '#bfae8a');
      R(c, 5, -22, 1, 17, '#bfae8a');
      c.restore();
    }
    R(c, 21, 21, 6, 6, '#5a3a1e');
    outline(c, 48, 48);
  });
  canvas(scene, 'b_well', 32, 32, (c) => {
    R(c, 5, 6, 3, 14, '#6b4423');
    R(c, 24, 6, 3, 14, '#6b4423');
    for (let y = 0; y < 6; y++) R(c, 2 + Math.round(y / 2), y + 1, 28 - Math.round(y / 2) * 2, 1, y % 2 ? '#8a4a2a' : '#6e3a20');
    R(c, 8, 8, 16, 1, '#6b4423');
    R(c, 15, 9, 1, 5, '#c9a36b');
    R(c, 13, 14, 5, 4, '#7a5230');
    R(c, 3, 18, 26, 12, '#8d8b83');
    R(c, 6, 18, 20, 4, '#1f3a5a');
    for (let x = 3; x < 29; x += 5) R(c, x, 22, 1, 8, '#6f6d66');
    R(c, 3, 25, 26, 1, '#6f6d66');
    outline(c, 32, 32);
  });
  canvas(scene, 'b_lot', 32, 32, (c) => {
    ellipse(c, 16, 22, 14, 8, '#a8814f');
    ellipse(c, 16, 22, 11, 6, '#b8915c');
    R(c, 4, 15, 2, 9, '#7a5230');
    R(c, 26, 15, 2, 9, '#7a5230');
    R(c, 4, 17, 24, 1, '#e8d2a6');
    R(c, 12, 4, 2, 14, '#7a5230');
    R(c, 8, 3, 14, 8, '#f2c230');
    for (let x = 8; x < 22; x += 4) R(c, x, 3, 2, 8, '#2a2420');
    outline(c, 32, 32);
  });
  canvas(scene, 'anvil', 16, 16, (c) => {
    R(c, 2, 5, 12, 3, '#5a5a62');
    R(c, 0, 5, 3, 2, '#5a5a62');
    R(c, 5, 8, 6, 3, '#45454c');
    R(c, 3, 11, 10, 3, '#5a5a62');
    R(c, 3, 5, 10, 1, '#8a8a92');
    outline(c, 16, 16);
  });
  canvas(scene, 'signpost', 16, 24, (c) => {
    R(c, 7, 8, 2, 16, '#7a5230');
    R(c, 1, 2, 14, 8, '#b8854c');
    R(c, 1, 2, 14, 1, '#d8a868');
    R(c, 7, 3, 2, 4, '#c8302a');
    R(c, 7, 8, 2, 1, '#c8302a');
    outline(c, 16, 24);
  });
  canvas(scene, 'fence', 16, 16, (c) => {
    R(c, 0, 6, 16, 2, '#b8854c');
    R(c, 0, 10, 16, 2, '#b8854c');
    R(c, 0, 8, 16, 1, '#7a5230');
    R(c, 0, 12, 16, 1, '#7a5230');
    R(c, 6, 3, 4, 11, '#c9955a');
    R(c, 9, 3, 1, 11, '#8a5a2e');
    outline(c, 16, 16);
  });
  canvas(scene, 'fence_v', 16, 16, (c) => {
    R(c, 6, 0, 4, 16, '#b8854c');
    R(c, 9, 0, 1, 16, '#8a5a2e');
    R(c, 6, 0, 4, 1, '#d8a868');
    outline(c, 16, 16);
  });
}

// ---------------------------------------------------------------- Ruộng & cây trồng

function drawPlant(c: Ctx, cx: number, by: number, crop: string, stage: number) {
  const G = '#3f8f2f';
  const L = '#5fb043';
  if (stage === 0) {
    R(c, cx, by - 3, 1, 3, G);
    R(c, cx - 2, by - 4, 2, 1, L);
    R(c, cx + 1, by - 5, 2, 1, L);
    return;
  }
  if (stage === 1) {
    R(c, cx, by - 7, 1, 7, G);
    R(c, cx - 3, by - 4, 3, 2, L);
    R(c, cx + 1, by - 6, 3, 2, L);
    R(c, cx - 2, by - 8, 2, 1, L);
    return;
  }
  switch (crop) {
    case 'wheat':
      for (const dx of [-3, 0, 3]) {
        R(c, cx + dx, by - 8, 1, 8, '#b8922a');
        R(c, cx + dx - 1, by - 12, 3, 5, '#e8c547');
        R(c, cx + dx, by - 11, 1, 1, '#b8922a');
        R(c, cx + dx, by - 9, 1, 1, '#b8922a');
      }
      break;
    case 'carrot':
      R(c, cx - 3, by - 9, 2, 6, L);
      R(c, cx, by - 10, 1, 7, G);
      R(c, cx + 2, by - 9, 2, 6, L);
      R(c, cx - 2, by - 3, 5, 3, '#ee7a22');
      R(c, cx - 1, by - 3, 1, 1, '#ffb070');
      break;
    case 'tomato':
      R(c, cx, by - 11, 1, 11, G);
      R(c, cx - 3, by - 7, 3, 1, L);
      R(c, cx + 1, by - 9, 3, 1, L);
      for (const [x, y] of [[-4, -9], [1, -6], [-3, -4]]) {
        R(c, cx + x, by + y, 3, 3, '#e0402a');
        R(c, cx + x, by + y, 1, 1, '#ff9a8a');
      }
      break;
    case 'corn':
      R(c, cx - 1, by - 13, 2, 13, '#4f9a35');
      R(c, cx - 5, by - 7, 4, 1, L);
      R(c, cx + 1, by - 10, 4, 1, L);
      R(c, cx + 1, by - 9, 3, 6, '#f2cf3a');
      R(c, cx + 1, by - 9, 1, 6, '#d8b020');
      R(c, cx + 1, by - 4, 3, 1, L);
      break;
    case 'pumpkin':
      R(c, cx - 5, by - 3, 3, 2, L);
      ellipse(c, cx + 0.5, by - 4, 5, 3.8, '#e8862a');
      R(c, cx - 2, by - 7, 1, 6, '#c06a1a');
      R(c, cx + 2, by - 7, 1, 6, '#c06a1a');
      R(c, cx, by - 10, 1, 3, '#5a7a2a');
      R(c, cx - 3, by - 6, 1, 1, '#ffc080');
      break;
    case 'mushroom':
      R(c, cx - 2, by - 5, 1, 5, '#e8f4f0');
      ellipse(c, cx - 1.5, by - 6, 3.5, 2.2, '#4fd8e8');
      R(c, cx + 3, by - 3, 1, 3, '#e8f4f0');
      ellipse(c, cx + 3.5, by - 3.5, 2.2, 1.6, '#4fd8e8');
      R(c, cx - 3, by - 7, 1, 1, '#d8ffff');
      R(c, cx + 3, by - 4, 1, 1, '#d8ffff');
      break;
    case 'fairyberry':
      ellipse(c, cx + 0.5, by - 4.5, 5, 4, '#3f9a4a');
      for (const [x, y] of [[-3, -6], [1, -7], [2, -3], [-2, -3]]) {
        R(c, cx + x, by + y, 2, 2, '#ff5fa0');
        R(c, cx + x, by + y, 1, 1, '#ffd0e4');
      }
      break;
    case 'strawberry':
      ellipse(c, cx, by - 4.5, 5, 3.5, '#3b943e');
      for (const [dx, dy] of [[-2, -4], [2, -3], [0, -6]]) {
        R(c, cx + dx, by + dy, 3, 3, '#e8293f');
        R(c, cx + dx + 1, by + dy + 2, 1, 2, '#c81c30');
        R(c, cx + dx, by + dy - 1, 3, 1, '#4eb946');
        R(c, cx + dx + 1, by + dy + 1, 1, 1, '#ffe596');
      }
      break;
    case 'watermelon':
      R(c, cx - 5, by - 3, 10, 2, '#3d8f38');
      ellipse(c, cx, by - 4.5, 5, 4, '#247332');
      for (const dx of [-3, 0, 3]) R(c, cx + dx, by - 7, 1, 5, '#52bf58');
      R(c, cx - 2, by - 7, 2, 1, '#9be89e');
      R(c, cx, by - 9, 2, 1, '#6a4b2c');
      break;
    case 'banana':
      R(c, cx - 1, by - 8, 2, 8, '#7a5230');
      ellipse(c, cx - 3, by - 9, 4, 2, '#4ea83b');
      ellipse(c, cx + 3, by - 9, 4, 2, '#4ea83b');
      for (const [dx, dy] of [[-3, -6], [-1, -5], [1, -6]]) {
        R(c, cx + dx, by + dy, 2, 4, '#ffd829');
        R(c, cx + dx, by + dy, 1, 3, '#fff394');
      }
      break;
    case 'orange':
      R(c, cx - 1, by - 5, 2, 5, '#6e4726');
      ellipse(c, cx, by - 7, 5, 4, '#2e7d32');
      for (const [dx, dy] of [[-3, -7], [1, -8], [0, -5]]) {
        R(c, cx + dx, by + dy, 3, 3, '#ff8c1a');
        R(c, cx + dx, by + dy, 1, 1, '#ffd180');
      }
      break;
    case 'apple':
      R(c, cx - 1, by - 5, 2, 5, '#6e4726');
      ellipse(c, cx, by - 7, 5, 4, '#388e3c');
      for (const [dx, dy] of [[-3, -7], [1, -8], [0, -5]]) {
        R(c, cx + dx, by + dy, 3, 3, '#e53935');
        R(c, cx + dx, by + dy, 1, 1, '#ff9e99');
      }
      break;
    case 'grape':
      R(c, cx - 4, by - 9, 1, 9, '#6e4726');
      R(c, cx + 3, by - 9, 1, 9, '#6e4726');
      R(c, cx - 4, by - 9, 8, 1, '#6e4726');
      ellipse(c, cx, by - 8, 4.5, 2.5, '#3b943e');
      for (const [dx, dy] of [[-2, -6], [0, -6], [2, -6], [-1, -4], [1, -4], [0, -2]]) {
        R(c, cx + dx, by + dy, 2, 2, '#7b2cbf');
        R(c, cx + dx, by + dy, 1, 1, '#c77dff');
      }
      break;
    case 'pineapple':
      for (const dx of [-3, -1, 1, 3]) R(c, cx + dx, by - 10, 1, 4, '#2e8540');
      ellipse(c, cx, by - 4.5, 3.8, 4.2, '#f59f00');
      for (const [dx, dy] of [[-2, -6], [1, -6], [0, -4], [-2, -3], [1, -3]]) {
        R(c, cx + dx, by + dy, 1, 1, '#b45309');
      }
      R(c, cx - 1, by - 7, 2, 1, '#ffe066');
      break;
    case 'mango':
      R(c, cx - 1, by - 5, 2, 5, '#6e4726');
      ellipse(c, cx, by - 7, 5, 4, '#2b8a3e');
      for (const [dx, dy] of [[-3, -7], [1, -8], [0, -4]]) {
        R(c, cx + dx, by + dy, 2, 3, '#fab005');
        R(c, cx + dx, by + dy, 1, 2, '#fff3bf');
      }
      break;
    case 'peach':
      R(c, cx - 1, by - 5, 2, 5, '#6e4726');
      ellipse(c, cx, by - 7, 5, 4, '#379c47');
      for (const [dx, dy] of [[-3, -7], [1, -8], [0, -5]]) {
        R(c, cx + dx, by + dy, 3, 3, '#ff758f');
        R(c, cx + dx, by + dy, 2, 1, '#ffccd5');
      }
      break;
    case 'cherry':
      R(c, cx - 1, by - 5, 2, 5, '#6e4726');
      ellipse(c, cx, by - 7, 5, 4, '#2f9e44');
      for (const [dx, dy] of [[-3, -6], [-1, -5], [1, -7], [3, -6]]) {
        R(c, cx + dx, by + dy - 2, 1, 2, '#52b788');
        R(c, cx + dx, by + dy, 2, 2, '#c9184a');
        R(c, cx + dx, by + dy, 1, 1, '#ff8fa3');
      }
      break;
  }
}

function drawFarm(scene: Phaser.Scene) {
  canvas(scene, 'soil', 32, 32, (c) => {
    R(c, 1, 1, 30, 30, '#7a4f2a');
    R(c, 0, 2, 32, 28, '#7a4f2a');
    for (const y of [5, 13, 21, 28]) {
      R(c, 2, y, 28, 2, '#5e3b1d');
      R(c, 2, y - 1, 28, 1, '#8d5f36');
    }
  });
  canvas(scene, 'soil_dry', 32, 32, (c) => {
    R(c, 1, 1, 30, 30, '#9c6b3e');
    R(c, 0, 2, 32, 28, '#9c6b3e');
    for (const y of [5, 13, 21, 28]) {
      R(c, 2, y, 28, 2, '#7d522b');
      R(c, 2, y - 1, 28, 1, '#b58352');
    }
  });
  canvas(scene, 'soil_wet', 32, 32, (c) => {
    R(c, 1, 1, 30, 30, '#4f3118');
    R(c, 0, 2, 32, 28, '#4f3118');
    for (const y of [5, 13, 21, 28]) {
      R(c, 2, y, 28, 2, '#38210f');
      R(c, 2, y - 1, 28, 1, '#664123');
    }
    for (const [x, y] of [[6, 8], [22, 10], [11, 24], [25, 25]]) R(c, x, y, 2, 1, '#6bb8e8');
  });
  canvas(scene, 'soil_fert', 32, 32, (c) => {
    R(c, 1, 1, 30, 30, '#472d16');
    R(c, 0, 2, 32, 28, '#472d16');
    for (const y of [5, 13, 21, 28]) {
      R(c, 2, y, 28, 2, '#331e0d');
      R(c, 2, y - 1, 28, 1, '#5e3b1d');
    }
    for (const [x, y] of [[5, 7], [15, 6], [25, 9], [8, 16], [19, 17], [12, 25], [24, 24]]) {
      R(c, x, y, 2, 1, '#8ce99a');
      R(c, x + 2, y + 1, 1, 1, '#ffd43b');
    }
  });
  canvas(scene, 'scarecrow', 20, 28, (c) => {
    R(c, 9, 8, 2, 19, '#7a5230');
    R(c, 2, 11, 16, 2, '#7a5230');
    R(c, 3, 12, 14, 1, '#e8c547');
    R(c, 6, 11, 8, 8, '#3d6fd1');
    R(c, 7, 12, 6, 6, '#5c8ce6');
    ellipse(c, 10, 7, 4, 3.5, '#e8c547');
    R(c, 4, 3, 12, 2, '#8a5a2e');
    R(c, 6, 1, 8, 3, '#a8723e');
    outline(c, 20, 28);
  });
  canvas(scene, 'compost_bin', 18, 20, (c) => {
    R(c, 2, 5, 14, 14, '#7a5230');
    for (const y of [7, 11, 15]) R(c, 3, y, 12, 2, '#5a3a1e');
    ellipse(c, 9, 5, 6, 2.5, '#4c9a38');
    for (const [x, y] of [[6, 4], [10, 5], [12, 4]]) R(c, x, y, 2, 1, '#ffd43b');
    outline(c, 18, 20);
  });
  const fruitTrees: [string, string, string][] = [
    ['fruit_tree_apple', '#e53935', '#ff9e99'],
    ['fruit_tree_orange', '#ff8c1a', '#ffd180'],
    ['fruit_tree_peach', '#ff758f', '#ffccd5'],
  ];
  for (const [key, col, hi] of fruitTrees) {
    canvas(scene, key, 28, 34, (c) => {
      // Bóng dưới gốc cây
      ellipse(c, 14, 32, 10, 2, '#1b3816');
      // Thân cây & rễ cây
      R(c, 9, 30, 2, 2, '#503218');
      R(c, 17, 30, 2, 2, '#2d180a');
      for (let y = 17; y <= 31; y++) {
        const taper = y > 28 ? (y - 28) * 0.6 : 0;
        const x0 = Math.round(11 - taper);
        const x1 = Math.round(16 + taper);
        R(c, x0, y, x1 - x0 + 1, 1, '#5a3518');
        R(c, x0, y, 2, 1, '#8e592f');
        R(c, x1 - 1, y, 2, 1, '#341d0c');
      }
      // Tán lá xum xuê 3D
      ellipse(c, 14, 14, 12, 9.5, '#1b4018');
      ellipse(c, 18, 14, 6.5, 5.5, '#285822');
      ellipse(c, 10, 15, 6, 5, '#35702d');
      ellipse(c, 19, 11, 6.5, 5.5, '#336d2a');
      ellipse(c, 9, 11, 6.5, 5.5, '#428834');
      ellipse(c, 14, 10, 7.5, 6.5, '#428834');
      ellipse(c, 13, 9, 6.5, 5.5, '#58a842');
      ellipse(c, 10, 6, 5, 4.5, '#68ba4e');
      ellipse(c, 9, 5, 4, 3, '#8ada5a');
      ellipse(c, 14, 5, 5, 4, '#5ea840');
      ellipse(c, 13, 4, 3.5, 3, '#7ec850');
      // Tỉa lá viền ngoài
      R(c, 4, 10, 2, 2, '#35702d');
      R(c, 23, 10, 2, 2, '#285822');
      R(c, 12, 1, 3, 1, '#7ec850');
      // Quả mọng trĩu cành (cuống + thân quả + đốm sáng)
      for (const [fx, fy] of [[7, 11], [13, 6], [19, 9], [9, 17], [17, 16], [14, 12], [21, 14]]) {
        R(c, fx, fy - 1, 1, 1, '#4a321a');
        R(c, fx - 1, fy, 3, 3, col);
        R(c, fx, fy, 1, 1, hi);
      }
      outline(c, 28, 34);
    });
  }
  canvas(scene, 'weeds', 32, 32, (c) => {
    const rnd = mulberry32(3);
    R(c, 1, 1, 30, 30, '#4e8c35');
    speckle(c, 1, 1, 30, 30, ['#3f7a2a', '#6aaa45', '#7cc157'], 50, rnd, [1, 3]);
    R(c, 13, 8, 2, 14, '#7a5230');
    R(c, 7, 6, 14, 8, '#c9a36b');
    R(c, 12, 8, 4, 4, '#f2c230');
    R(c, 13, 9, 2, 2, '#c9971f');
  });
  const spots = [[9, 14], [23, 14], [9, 29], [23, 29]];
  for (const crop of CROPS) {
    for (const stage of [0, 1, 2]) {
      canvas(scene, `crop_${crop.id}_${stage}`, 32, 32, (c) => {
        for (const [x, y] of spots) drawPlant(c, x, y, crop.id, stage);
        outline(c, 32, 32);
      });
    }
  }
}

// ---------------------------------------------------------------- Hiệu ứng & vật nhỏ

function drawFx(scene: Phaser.Scene) {
  canvas(scene, 'shadow', 14, 6, (c) => ellipse(c, 7, 3, 6.5, 2.5, 'rgba(0,0,0,0.28)'));
  canvas(scene, 'shadow_big', 30, 10, (c) => ellipse(c, 15, 5, 14, 4.5, 'rgba(0,0,0,0.3)'));
  canvas(scene, 'slash', 24, 24, (c) => {
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const dx = x + 0.5 - 6;
        const dy = y + 0.5 - 12;
        const d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        if (d > 8 && d < 12 && Math.abs(a) < 1.25) {
          const edge = 1 - Math.abs(a) / 1.25;
          c.fillStyle = d > 10.5 ? `rgba(255,255,255,${0.95 * edge + 0.05})` : `rgba(190,230,255,${0.8 * edge})`;
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  canvas(scene, 'coin', 8, 8, (c) => {
    ellipse(c, 4, 4, 3.5, 3.5, '#f2c230');
    R(c, 3, 2, 2, 4, '#c9971f');
    R(c, 2, 2, 1, 1, '#fff2b0');
    outline(c, 8, 8);
  });
  canvas(scene, 'spark', 7, 7, (c) => {
    R(c, 3, 0, 1, 7, '#fffbe0');
    R(c, 0, 3, 7, 1, '#fffbe0');
    R(c, 2, 2, 3, 3, '#ffffff');
  });
  canvas(scene, 'puff', 8, 8, (c) => ellipse(c, 4, 4, 3.6, 3.6, '#f4f0e8'));
  canvas(scene, 'chicken', 24, 12, (c) => {
    for (const f of [0, 1]) {
      const o = f * 12;
      ellipse(c, o + 6, 7, 4, 3, '#f8f4ec');
      R(c, o + 7, 2, 3, 4, '#f8f4ec');
      R(c, o + 8, 1, 2, 1, '#e8302a');
      R(c, o + 10, 3, 2, 1, '#f2a020');
      R(c, o + 8, 3, 1, 1, '#1e1a1a');
      R(c, o + 2, 5, 2, 2, '#e0dccc');
      R(c, o + 5, 10, 1, 2 - f, '#f2a020');
      R(c, o + 7, 10, 1, 1 + f, '#f2a020');
    }
    outline(c, 24, 12);
  }, [{ name: '0', x: 0, y: 0, w: 12, h: 12 }, { name: '1', x: 12, y: 0, w: 12, h: 12 }]);
}

// ---------------------------------------------------------------- Quái vùng mới, vật nuôi, công trình mới

const two = (w: number, h: number) => [
  { name: '0', x: 0, y: 0, w, h },
  { name: '1', x: w, y: 0, w, h },
];

function drawNewMonsters(scene: Phaser.Scene) {
  canvas(scene, 'bat', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const wing = '#4a2e5a';
      if (f === 0) {
        R(c, o + 1, 3, 2, 3, wing); R(c, o + 3, 4, 3, 3, wing); R(c, o + 13, 3, 2, 3, wing); R(c, o + 10, 4, 3, 3, wing);
      } else {
        R(c, o + 1, 9, 2, 3, wing); R(c, o + 3, 8, 3, 3, wing); R(c, o + 13, 9, 2, 3, wing); R(c, o + 10, 8, 3, 3, wing);
      }
      ellipse(c, o + 8, 8, 3.5, 3.5, '#6a4a7a');
      R(c, o + 5, 4, 1, 2, '#6a4a7a'); R(c, o + 10, 4, 1, 2, '#6a4a7a');
      R(c, o + 6, 7, 1, 1, '#ff4a4a'); R(c, o + 9, 7, 1, 1, '#ff4a4a');
      R(c, o + 7, 10, 1, 1, '#f4f0e8'); R(c, o + 9, 10, 1, 1, '#f4f0e8');
    }
    outline(c, 32, 16);
  }, two(16, 16));

  canvas(scene, 'golem', 48, 24, (c) => {
    for (const f of [0, 1]) {
      const o = f * 24;
      const a = f ? 1 : 0;
      R(c, o + 7, 18, 4, 5, '#4a5868'); R(c, o + 13, 18, 4, 5, '#4a5868');
      R(c, o + 6, 7, 12, 12, '#6a7a8a'); R(c, o + 6, 15, 12, 3, '#4a5868');
      R(c, o + 2, 8 + a, 4, 9, '#5a6a7a'); R(c, o + 18, 8 - a + 1, 4, 9, '#5a6a7a');
      R(c, o + 8, 1, 8, 7, '#7a8a9a');
      R(c, o + 10, 3, 1, 2, '#7fe8ff'); R(c, o + 13, 3, 1, 2, '#7fe8ff');
      R(c, o + 3, 5 + a, 2, 3, '#7fe8ff'); R(c, o + 19, 4, 2, 4, '#7fe8ff'); R(c, o + 10, 9, 3, 4, '#5ac8e8'); R(c, o + 11, 9, 1, 2, '#d8ffff');
    }
    outline(c, 48, 24);
  }, two(24, 24));

  canvas(scene, 'imp', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      R(c, o + (f ? 2 : 1), 7, 2, 3, '#8a1f1a'); R(c, o + (f ? 12 : 13), 7, 2, 3, '#8a1f1a');
      ellipse(c, o + 8, 10.5, 4, 3.8, '#d8402a');
      ellipse(c, o + 8, 6, 3.5, 3, '#e8503a');
      R(c, o + 5, 1, 1, 3, '#f2e0c0'); R(c, o + 10, 1, 1, 3, '#f2e0c0');
      R(c, o + 6, 5, 1, 2, '#ffe680'); R(c, o + 9, 5, 1, 2, '#ffe680');
      R(c, o + 12, 12 - f, 3, 1, '#d8402a'); R(c, o + 14, 11 - f, 1, 1, '#ffb020');
      R(c, o + 6, 14, 1, 2, '#8a1f1a'); R(c, o + 9, 14, 1, 2, '#8a1f1a');
    }
    outline(c, 32, 16);
  }, two(16, 16));

  canvas(scene, 'fire_dragon', 96, 40, (c) => {
    for (const f of [0, 1]) {
      const o = f * 48;
      // cánh
      for (let y = 0; y < 16; y++) {
        const wy = f === 0 ? 3 + y : 17 + y;
        const w = f === 0 ? Math.round(4 + y * 0.9) : Math.round(18 - y * 0.9);
        R(c, o + 10, wy, Math.max(2, w), 1, y % 4 === 0 ? '#7a1a14' : '#a8241c');
      }
      R(c, o + 2, 26, 10, 3, '#c8302a'); R(c, o + 0, 24, 3, 3, '#c8302a'); R(c, o + 0, 23, 1, 1, '#f2a020');
      ellipse(c, o + 22, 26, 13, 8, '#c8302a');
      ellipse(c, o + 22, 30, 10, 4, '#f2a040');
      for (let x = 12; x < 32; x += 4) R(c, o + x, 18, 2, 2, '#f2a020');
      R(c, o + 31, 13, 5, 11, '#c8302a');
      R(c, o + 32, 8, 11, 8, '#d8402a');
      R(c, o + 40, 11, 6, 5, '#d8402a');
      R(c, o + 44, 14, 2, 1, '#2a1a14');
      R(c, o + 33, 4, 2, 4, '#f2e0c0'); R(c, o + 37, 4, 2, 4, '#f2e0c0');
      R(c, o + 39, 10, 2, 2, '#ffe680');
      R(c, o + 14, 32, 4, 6, '#a8241c'); R(c, o + 26, 32, 4, 6, '#a8241c');
      R(c, o + 13, 37, 6, 2, '#5a1a14'); R(c, o + 25, 37, 6, 2, '#5a1a14');
    }
    outline(c, 96, 40);
  }, two(48, 40));
}

function drawAnimals(scene: Phaser.Scene) {
  canvas(scene, 'cow', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const legs = f ? [3, 6, 9, 12] : [4, 5, 10, 11];
      legs.forEach((x, i) => R(c, o + x, 12, 1, i % 2 === f ? 3 : 2, '#3a3030'));
      R(c, o + 2, 6, 11, 6, '#f4f0e8');
      R(c, o + 4, 7, 3, 2, '#2a2420'); R(c, o + 9, 8, 2, 3, '#2a2420');
      R(c, o + 11, 4, 4, 5, '#f4f0e8'); R(c, o + 13, 7, 3, 2, '#f0a0a0');
      R(c, o + 11, 3, 1, 1, '#d8c8a0'); R(c, o + 14, 3, 1, 1, '#d8c8a0');
      R(c, o + 13, 5, 1, 1, '#1e1a1a');
      R(c, o + 1, 6, 1, 4, '#f4f0e8'); R(c, o + 6, 12, 2, 1, '#f0a0a0');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'sheep', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const legs = f ? [4, 6, 9, 11] : [5, 5, 10, 10];
      legs.forEach((x) => R(c, o + x, 11, 1, 3, '#3a3030'));
      ellipse(c, o + 7.5, 8, 6, 4.5, '#f4f0e8');
      for (const [x, y] of [[3, 5], [7, 4], [10, 5], [4, 10], [9, 10]]) R(c, o + x, y, 2, 1, '#ffffff');
      R(c, o + 12, 5, 3, 4, '#3a3030');
      R(c, o + 13, 6, 1, 1, '#f4f0e8');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'pig', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const legs = f ? [4, 6, 9, 11] : [5, 5, 10, 10];
      legs.forEach((x) => R(c, o + x, 12, 1, 2, '#d6708a'));
      ellipse(c, o + 7.5, 9, 5.5, 3.8, '#ff9eb5');
      ellipse(c, o + 7.5, 8, 4.5, 2.5, '#ffb5c7');
      R(c, o + 11, 6, 4, 4, '#ff9eb5');
      R(c, o + 14, 7, 2, 2, '#f0658a');
      R(c, o + 12, 5, 2, 1, '#ff85a2');
      R(c, o + 13, 7, 1, 1, '#1e1a1a');
      R(c, o + 1, 7 + f, 2, 1, '#f0658a');
    }
    outline(c, 32, 16);
  }, two(16, 16));
}

function drawNewProps(scene: Phaser.Scene) {
  canvas(scene, 'crystal', 16, 24, (c) => {
    R(c, 1, 20, 14, 4, '#4a4560');
    R(c, 6, 4, 4, 17, '#7fe8ff'); R(c, 7, 4, 1, 15, '#d8ffff'); R(c, 7, 2, 2, 2, '#7fe8ff');
    R(c, 2, 11, 3, 10, '#5ac8e8'); R(c, 3, 10, 1, 1, '#5ac8e8');
    R(c, 11, 9, 3, 12, '#5ac8e8'); R(c, 12, 8, 1, 1, '#5ac8e8'); R(c, 12, 10, 1, 8, '#a8f0ff');
    outline(c, 16, 24);
  });
  canvas(scene, 'lava_rock', 16, 16, (c) => {
    ellipse(c, 8, 10, 7, 5, '#2a201c');
    ellipse(c, 7, 9, 5, 3.5, '#3a2e2a');
    R(c, 5, 9, 3, 1, '#e8701a'); R(c, 8, 10, 1, 2, '#e8701a'); R(c, 10, 8, 2, 1, '#ffb020');
    outline(c, 16, 16);
  });
  canvas(scene, 'dead_tree', 24, 32, (c) => {
    R(c, 10, 12, 4, 20, '#5a4a3a'); R(c, 10, 12, 1, 20, '#6a5a4a');
    R(c, 4, 9, 7, 2, '#5a4a3a'); R(c, 3, 4, 2, 6, '#5a4a3a');
    R(c, 14, 7, 6, 2, '#5a4a3a'); R(c, 19, 2, 2, 6, '#5a4a3a');
    R(c, 11, 3, 2, 10, '#5a4a3a');
    outline(c, 24, 32);
  });
  canvas(scene, 'lamp', 16, 32, (c) => {
    R(c, 7, 11, 2, 20, '#3a3a42'); R(c, 5, 30, 6, 2, '#3a3a42');
    R(c, 4, 2, 8, 2, '#3a3a42'); R(c, 5, 4, 6, 7, '#3a3a42');
    R(c, 6, 5, 4, 5, '#ffe680'); R(c, 7, 5, 1, 2, '#ffffff');
    outline(c, 16, 32);
  });
  canvas(scene, 'hay', 16, 16, (c) => {
    R(c, 2, 5, 12, 10, '#e8c547');
    for (const y of [7, 10, 13]) R(c, 2, y, 12, 1, '#c9a227');
    R(c, 2, 5, 12, 1, '#f6dd7a');
    outline(c, 16, 16);
  });
  canvas(scene, 'trough', 32, 16, (c) => {
    R(c, 2, 6, 28, 8, '#8a5a2e'); R(c, 4, 7, 24, 3, '#5aa7e6'); R(c, 5, 7, 6, 1, '#a8d8ff');
    R(c, 3, 14, 2, 2, '#6b4423'); R(c, 27, 14, 2, 2, '#6b4423');
    outline(c, 32, 16);
  });
  canvas(scene, 'sale_sign', 16, 24, (c) => {
    R(c, 7, 10, 2, 14, '#7a5230');
    R(c, 1, 2, 14, 9, '#f4ecd8'); R(c, 1, 2, 14, 2, '#d0402e');
    R(c, 6, 5, 4, 5, '#f2c230'); R(c, 7, 6, 2, 3, '#c9971f');
    outline(c, 16, 24);
  });
  canvas(scene, 'kite', 16, 24, (c) => {
    for (let y = 0; y < 12; y++) {
      const w = y < 6 ? y + 1 : 12 - y;
      R(c, 8 - w, y, w, 1, '#e8402a');
      R(c, 8, y, w, 1, '#f2c230');
    }
    R(c, 8, 0, 1, 12, '#5a3a1e'); R(c, 2, 5, 12, 1, '#5a3a1e');
    for (const [x, y] of [[8, 13], [7, 15], [8, 17], [9, 19], [8, 21]]) R(c, x, y, 2, 1, x % 2 ? '#3d6fd1' : '#e8402a');
    outline(c, 16, 24);
  });
  canvas(scene, 'fireball', 12, 12, (c) => {
    ellipse(c, 6, 6, 5, 5, '#e8501a');
    ellipse(c, 6, 6, 3.4, 3.4, '#ffb020');
    ellipse(c, 5.5, 5.5, 1.8, 1.8, '#fff4c0');
  });
  canvas(scene, 'rain', 1, 6, (c) => R(c, 0, 0, 1, 6, 'rgba(190,220,255,0.75)'));
  canvas(scene, 'firefly', 3, 3, (c) => {
    R(c, 1, 0, 1, 3, '#fff6a0');
    R(c, 0, 1, 3, 1, '#fff6a0');
  });
  if (!scene.textures.exists('light')) {
    const tex = scene.textures.createCanvas('light', 64, 64)!;
    const c = tex.getContext();
    const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 64, 64);
    tex.refresh();
  }
}

function drawNewBuildings(scene: Phaser.Scene) {
  canvas(scene, 'b_armory', 48, 48, (c) => {
    R(c, 3, 8, 3, 38, '#5a3a1e'); R(c, 42, 8, 3, 38, '#5a3a1e');
    for (let x = 0; x < 48; x += 8) R(c, x, 2, 8, 10, (x / 8) % 2 ? '#d8dce4' : '#3d5f9a');
    R(c, 0, 1, 48, 2, '#2c3f6a');
    for (let x = 0; x < 48; x += 4) R(c, x + 1, 12, 2, 2, Math.floor(x / 8) % 2 ? '#d8dce4' : '#3d5f9a');
    R(c, 6, 18, 36, 3, '#7a5230'); R(c, 6, 30, 36, 3, '#7a5230');
    for (const x of [10, 16, 22]) {
      R(c, x, 14, 2, 14, '#c8ccd4'); R(c, x, 14, 1, 12, '#ffffff'); R(c, x - 1, 26, 4, 1, '#7a5230'); R(c, x, 27, 2, 3, '#5a3a1e');
    }
    ellipse(c, 33, 23, 6, 6, '#c8402f'); ellipse(c, 33, 23, 3.5, 3.5, '#f2c230'); R(c, 32, 22, 2, 2, '#c8402f');
    R(c, 4, 34, 40, 12, '#9a6b3c'); for (let y = 37; y < 46; y += 4) R(c, 4, y, 40, 1, '#7a5230');
    R(c, 2, 33, 44, 2, '#c08a50');
    outline(c, 48, 48);
  });
  canvas(scene, 'b_ranch', 32, 32, (c) => {
    R(c, 5, 10, 3, 22, '#7a5230'); R(c, 24, 10, 3, 22, '#7a5230');
    R(c, 2, 3, 28, 16, '#9a6b3c'); R(c, 3, 4, 26, 14, '#c8402f');
    R(c, 10, 6, 12, 10, '#f4f0e8'); R(c, 11, 7, 3, 3, '#2a2420'); R(c, 18, 10, 3, 3, '#2a2420'); R(c, 13, 13, 6, 3, '#f0a0a0');
    R(c, 9, 5, 2, 2, '#d8c8a0'); R(c, 21, 5, 2, 2, '#d8c8a0');
    outline(c, 32, 32);
  });
  canvas(scene, 'h_cabin', 80, 64, (c) => {
    drawHouse(c, 80, 64, { wall: '#c8955a', wallDark: '#a87a45', roof: '#7a4a2a', roofDark: '#5a341c', trim: '#5a3a1e', door: '#5a3a1e' });
    R(c, 56, 2, 8, 16, '#7d7b76');
    outline(c, 80, 64);
  });
  canvas(scene, 'h_lake', 96, 64, (c) => {
    const roofH = drawHouse(c, 96, 64, { wall: '#f4f0e8', wallDark: '#dcd6c8', roof: '#2f8f8a', roofDark: '#1f6a66', trim: '#3d6fd1', door: '#3d6fd1' }, 12);
    R(c, 40, roofH - 14, 16, 10, '#f4f0e8'); R(c, 42, roofH - 12, 12, 6, '#9fd3f0'); R(c, 47, roofH - 12, 1, 6, '#3d6fd1');
    for (let x = 4; x < 92; x += 6) R(c, x, 64 - 5, 2, 5, '#a8784a');
    outline(c, 96, 64);
  });
  canvas(scene, 'h_villa', 112, 96, (c) => {
    const roofH = drawHouse(c, 112, 96, { wall: '#f4ecd8', wallDark: '#e0d4b8', roof: '#6a3aa0', roofDark: '#4a2478', trim: '#d9a830', door: '#7a3a20', stone: true }, 18);
    for (const x of [20, 34, 74, 88]) {
      R(c, x, roofH, 5, 96 - roofH - 4, '#ffffff'); R(c, x + 4, roofH, 1, 96 - roofH - 4, '#d8d0c0'); R(c, x - 1, roofH, 7, 2, '#d9a830');
    }
    R(c, 48, 4, 16, 14, '#d9a830'); R(c, 50, 6, 12, 10, '#f2c230'); R(c, 55, 8, 2, 6, '#c9971f'); R(c, 52, 10, 8, 2, '#c9971f');
    outline(c, 112, 96);
  });
}

export function generateTextures(scene: Phaser.Scene, heroLook: AvatarLook) {
  renderHero(scene, heroLook);
  for (const [key, look] of Object.entries(NPC_LOOKS)) avatarTexture(scene, key, look);
  drawNewMonsters(scene);
  drawAnimals(scene);
  drawNewProps(scene);
  drawNewBuildings(scene);
  drawTiles(scene);
  drawMonsters(scene);
  drawNature(scene);
  drawBuildings(scene);
  drawFarm(scene);
  drawFx(scene);
  drawWorld2(scene);
  drawRealty(scene);
  drawMall(scene);
  drawLake(scene);
  drawWilds(scene);
}

export function createAnims(scene: Phaser.Scene) {
  const a = scene.anims;
  if (a.exists('hero_walk_down')) return;
  for (const key of AVATAR_KEYS) {
    for (const d of ['down', 'up', 'side']) {
      a.create({
        key: `${key}_walk_${d}`,
        frames: [1, 0, 2, 0].map((f) => ({ key, frame: `${d}_${f}` })),
        frameRate: 9,
        repeat: -1,
      });
    }
  }
  const rates: Record<string, number> = { wolf: 8, bat: 10, imp: 8, fire_dragon: 3, golem: 3 };
  for (const key of ['slime', 'slime_king', 'wolf', 'chicken', 'bat', 'golem', 'imp', 'fire_dragon', 'cow', 'sheep', 'pig', ...ANIM2_KEYS]) {
    a.create({ key: `${key}_move`, frames: [{ key, frame: '0' }, { key, frame: '1' }], frameRate: rates[key] ?? 4, repeat: -1 });
  }
}
