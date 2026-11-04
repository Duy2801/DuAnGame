import Phaser from 'phaser';
import { COSMETICS, KITES, RODS } from '../game/config/shops';
import { drawRod, drawWeapon } from '../art/rodArt';
import { ALL_EQUIPMENT } from '../game/config/equipment';
import { R, canvas, drawHouse, ellipse, outline, speckle, type Ctx } from './textures';

// Hình vẽ cho bản đồ khu vực + 20 vùng quái + đồ mua sắm

const S = 16;

/** quái 2 khung chuyển động — cần animation `${key}_move` */
export const ANIM2_KEYS = ['mushroom', 'frog', 'crab', 'scorpion', 'snowman', 'ghost', 'spider', 'campfire', 'fountain', 'fountain_guild', ...COSMETICS.filter((c) => c.kind === 'pet').map((c) => c.id)];

/** tối màu đi một chút (chân thú cưng) */
const shade2 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, v - 50);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

const two = (w: number, h: number) => [
  { name: '0', x: 0, y: 0, w, h },
  { name: '1', x: w, y: 0, w, h },
];

// ---------------------------------------------------------------- nền 20 vùng

export function drawZoneTiles(c: Ctx, rnd: () => number) {
  const tile = (i: number, base: string, specks: string[], n: number, size: [number, number] = [1, 1]) => {
    R(c, i * S, 0, S, S, base);
    speckle(c, i * S, 0, S, S, specks, n, rnd, size);
  };
  tile(19, '#4f7a3a', ['#3f6a2e', '#6a9a48'], 14);
  tile(20, '#4a7436', ['#3f6a2e', '#c8e0a0'], 10);
  tile(21, '#4a5a32', ['#3a4a26', '#5a6a3a'], 14, [2, 1]);
  tile(22, '#465630', ['#2f4a40', '#5a6a3a'], 12, [2, 1]);
  tile(23, '#8a6a42', ['#7a5a36', '#9a7a50'], 16);
  tile(24, '#86663e', ['#6a5030', '#a8885a'], 10, [2, 1]);
  tile(25, '#3e3a4a', ['#2e2a3a', '#4e4a5a'], 14);
  tile(26, '#3a364a', ['#2a2638', '#5a4a6a'], 10, [2, 1]);
  tile(27, '#e0b870', ['#d0a860', '#f0d090'], 16);
  tile(28, '#dcb46a', ['#c89850', '#f0d090'], 10, [2, 1]);
  tile(29, '#eef4fa', ['#d8e4f0', '#ffffff'], 14);
  tile(30, '#e8f0f8', ['#c8d8e8'], 10, [2, 1]);
  // băng: vết nứt sáng
  for (const i of [31, 32]) {
    R(c, i * S, 0, S, S, '#a8d8f0');
    R(c, i * S + 2, 3, 6, 1, '#d8f4ff');
    R(c, i * S + 8, 4, 1, 5, '#d8f4ff');
    R(c, i * S + (i === 31 ? 3 : 10), 11, 5, 1, '#88c0e0');
  }
  tile(33, '#5a4a6a', ['#4a3a5a', '#7aaa3a'], 14);
  tile(34, '#544466', ['#9ad040', '#3a2a4a'], 10, [2, 1]);
  tile(35, '#7a7670', ['#6a6660', '#8a8680'], 16, [2, 1]);
  tile(36, '#76726c', ['#5a5650', '#9a968e'], 10, [2, 2]);
  // gạch thành quỷ
  for (const i of [37, 38]) {
    R(c, i * S, 0, S, S, '#5a2a26');
    for (const y of [0, 8]) R(c, i * S, y + 7, S, 1, '#3a1a16');
    R(c, i * S + 7, 0, 1, 7, '#3a1a16');
    R(c, i * S + 3, 8, 1, 7, '#3a1a16');
    R(c, i * S + 11, 8, 1, 7, '#3a1a16');
    if (i === 38) R(c, i * S + 5, 3, 3, 1, '#e8501a');
  }
  // hư không
  for (const i of [39, 40]) {
    R(c, i * S, 0, S, S, '#14101e');
    speckle(c, i * S, 0, S, S, ['#2a1a3e'], 10, rnd, [2, 1]);
    if (i === 40) {
      R(c, i * S + 3, 5, 4, 1, '#8a3ad8');
      R(c, i * S + 7, 6, 1, 4, '#8a3ad8');
    }
  }
  tile(41, '#c8963a', ['#b07e2a', '#e8b850'], 14);
  tile(42, '#c08c34', ['#a86a1a', '#f0c860'], 8, [2, 1]);
  // gạch lát thị trấn
  R(c, 43 * S, 0, S, S, '#b8ae9c');
  for (const [x, y, w] of [[0, 0, 7], [8, 0, 8], [0, 5, 4], [5, 5, 6], [12, 5, 4], [0, 10, 8], [9, 10, 7]]) R(c, 43 * S + x, y, w, 4, '#c8bfae');
  speckle(c, 43 * S, 0, S, S, ['#a89e8c'], 6, rnd);
  // nền trại (gỗ)
  R(c, 44 * S, 0, S, S, '#9a7048');
  for (const y of [3, 7, 11, 15]) R(c, 44 * S, y, S, 1, '#7a5230');
  speckle(c, 44 * S, 0, S, S, ['#b08058'], 6, rnd);
}

// ---------------------------------------------------------------- quái mới

function drawMonsters2(scene: Phaser.Scene) {
  canvas(scene, 'mushroom', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const sq = f ? 1 : 0;
      R(c, o + 6, 9 + sq, 4, 5 - sq, '#f0e6d0');
      R(c, o + 6, 14, 2, 2, '#8a5a2e'); R(c, o + 9, 14, 2, 2, '#8a5a2e');
      ellipse(c, o + 8, 7 + sq, 6.5, 4 - sq * 0.5, '#c83a3a');
      for (const [x, y] of [[4, 5], [9, 4], [11, 7], [6, 8]]) R(c, o + x, y + sq, 2, 1, '#f4f0e8');
      R(c, o + 6, 10 + sq, 1, 1, '#1e1a1a'); R(c, o + 9, 10 + sq, 1, 1, '#1e1a1a');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'frog', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const up = f ? -2 : 0;
      ellipse(c, o + 8, 10 + up, 6, 4, '#5aa83a');
      ellipse(c, o + 8, 12 + up, 4.5, 2, '#c8e07a');
      R(c, o + 3, 5 + up, 3, 3, '#5aa83a'); R(c, o + 10, 5 + up, 3, 3, '#5aa83a');
      R(c, o + 4, 6 + up, 1, 1, '#1e1a1a'); R(c, o + 11, 6 + up, 1, 1, '#1e1a1a');
      R(c, o + 1, 13, 3, 2, '#4a8a2e'); R(c, o + 12, 13, 3, 2, '#4a8a2e');
      R(c, o + 6, 10 + up, 4, 1, '#3a6a24');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'crab', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      const cl = f ? 1 : 0;
      ellipse(c, o + 8, 10, 5.5, 3.5, '#e0502a');
      R(c, o + 5, 8, 6, 1, '#f08a5a');
      R(c, o + 1, 5 - cl, 3, 3, '#e0502a'); R(c, o + 12, 5 - cl, 3, 3, '#e0502a');
      R(c, o + 2, 8, 1, 2, '#c03a1a'); R(c, o + 13, 8, 1, 2, '#c03a1a');
      R(c, o + 6, 5, 1, 3, '#c03a1a'); R(c, o + 9, 5, 1, 3, '#c03a1a');
      R(c, o + 6, 4, 1, 1, '#1e1a1a'); R(c, o + 9, 4, 1, 1, '#1e1a1a');
      for (const x of [3, 5, 10, 12]) R(c, o + x + (f ? 1 : 0), 13, 1, 2, '#c03a1a');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'scorpion', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      ellipse(c, o + 7, 11, 4.5, 2.5, '#2a2018');
      R(c, o + 10, 10, 2, 2, '#3a2e24'); R(c, o + 11, 7, 2, 3, '#3a2e24'); R(c, o + 12, 4, 2, 3, '#3a2e24');
      R(c, o + 11, 3, 2, 1, '#e8a020');
      R(c, o + 1, 9 - f, 2, 2, '#3a2e24'); R(c, o + 1, 12 + f, 2, 2, '#3a2e24');
      for (const x of [4, 6, 8]) R(c, o + x + f, 13, 1, 2, '#2a2018');
      R(c, o + 4, 10, 1, 1, '#ff3a3a');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'snowman', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      ellipse(c, o + 8, 11, 5, 4, '#f4f8ff');
      ellipse(c, o + 8, 5, 3.5, 3, '#f4f8ff');
      R(c, o + 6, 4, 1, 1, '#1e1a1a'); R(c, o + 9, 4, 1, 1, '#1e1a1a');
      R(c, o + 8, 6, 3, 1, '#f08a2a');
      R(c, o + 5, 2, 6, 1, '#c8302a');
      R(c, o + 1, 7 + f, 3, 1, '#7a5230'); R(c, o + 12, 8 - f, 3, 1, '#7a5230');
      R(c, o + 8, 10, 1, 1, '#2a2a38'); R(c, o + 8, 12, 1, 1, '#2a2a38');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'ghost', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      ellipse(c, o + 8, 7, 5, 5, 'rgba(220,230,255,0.85)');
      R(c, o + 3, 7, 10, 5, 'rgba(220,230,255,0.85)');
      for (let x = 3; x < 13; x += 2) R(c, o + x, 12 + ((x / 2 + f) % 2), 2, 1, 'rgba(220,230,255,0.85)');
      R(c, o + 5, 5, 2, 3, '#1e1a3a'); R(c, o + 9, 5, 2, 3, '#1e1a3a');
      R(c, o + 7, 9, 2, 2, '#1e1a3a');
    }
    outline(c, 32, 16, '#3a3a6a');
  }, two(16, 16));
  canvas(scene, 'spider', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      for (let k = 0; k < 4; k++) {
        const y = 6 + k * 2;
        const a = (k + f) % 2;
        R(c, o + 1, y + a, 4, 1, '#2a1a2a'); R(c, o + 11, y + 1 - a, 4, 1, '#2a1a2a');
      }
      ellipse(c, o + 8, 9, 4, 3.5, '#4a2a4a');
      ellipse(c, o + 8, 5.5, 2.5, 2, '#5a3a5a');
      R(c, o + 7, 8, 2, 3, '#c83a3a');
      R(c, o + 6, 5, 1, 1, '#ff4a4a'); R(c, o + 9, 5, 1, 1, '#ff4a4a');
    }
    outline(c, 32, 16);
  }, two(16, 16));
}

// ---------------------------------------------------------------- cảnh vật 20 vùng

function drawProps2(scene: Phaser.Scene) {
  canvas(scene, 'mushroom_big', 16, 24, (c) => {
    R(c, 6, 12, 4, 11, '#f0e6d0');
    ellipse(c, 8, 9, 7.5, 5, '#9a4ad8');
    for (const [x, y] of [[4, 7], [9, 6], [12, 9]]) R(c, x, y, 2, 2, '#e8d0ff');
    outline(c, 16, 24);
  });
  canvas(scene, 'reeds', 16, 16, (c) => {
    for (const [x, h] of [[3, 12], [6, 15], [9, 11], [12, 14]]) {
      R(c, x, 16 - h, 1, h, '#6a8a3a');
      R(c, x - 1, 16 - h, 2, 3, '#8a5a2e');
    }
    outline(c, 16, 16);
  });
  canvas(scene, 'palm', 24, 40, (c) => {
    for (let y = 14; y < 39; y++) R(c, 11 + Math.round(Math.sin(y / 6) * 1.5), y, 3, 1, y % 3 ? '#a8784a' : '#8a5a2e');
    for (const [dx, dy] of [[-9, 2], [9, 2], [-7, -3], [7, -3], [0, -5]]) {
      for (let i = 0; i < 8; i++) R(c, 12 + Math.round((dx * i) / 8), 13 + Math.round((dy * i) / 8 + (i * i) / 16), 2, 2, '#3f9a3a');
    }
    R(c, 10, 13, 2, 2, '#8a5a2e'); R(c, 13, 14, 2, 2, '#8a5a2e');
    outline(c, 24, 40);
  });
  canvas(scene, 'shell', 16, 16, (c) => {
    ellipse(c, 8, 10, 4, 3, '#f8d0c0');
    for (const x of [6, 8, 10]) R(c, x, 8, 1, 4, '#e0a090');
    ellipse(c, 12, 13, 1.5, 1.5, '#fff0e0');
    outline(c, 16, 16);
  });
  canvas(scene, 'tent_goblin', 32, 32, (c) => {
    for (let y = 4; y < 30; y++) {
      const w = Math.round(((y - 4) / 26) * 14) + 1;
      R(c, 16 - w, y, w * 2, 1, y % 4 ? '#8a6a3a' : '#6a4a2a');
    }
    for (let y = 18; y < 30; y++) R(c, 14, y, 4, 1, '#2a1a10');
    R(c, 15, 0, 2, 5, '#5a3a1e'); R(c, 17, 1, 5, 3, '#c83a2a');
    outline(c, 32, 32);
  });
  canvas(scene, 'palisade', 16, 24, (c) => {
    for (const x of [1, 5, 9, 13]) {
      R(c, x, 4, 3, 20, '#8a5a2e');
      R(c, x + 1, 2, 1, 2, '#8a5a2e');
      R(c, x, 4, 1, 20, '#a87a48');
    }
    R(c, 0, 12, 16, 2, '#5a3a1e');
    outline(c, 16, 24);
  });
  canvas(scene, 'tombstone', 16, 16, (c) => {
    R(c, 4, 4, 8, 11, '#8a8a94'); ellipse(c, 8, 5, 4, 3, '#8a8a94');
    R(c, 7, 6, 2, 6, '#5a5a64'); R(c, 5, 8, 6, 2, '#5a5a64');
    R(c, 3, 14, 10, 2, '#4a6a3a');
    outline(c, 16, 16);
  });
  canvas(scene, 'bones', 16, 16, (c) => {
    R(c, 3, 11, 10, 2, '#e8e4d8'); R(c, 2, 10, 2, 4, '#e8e4d8'); R(c, 12, 10, 2, 4, '#e8e4d8');
    ellipse(c, 9, 7, 3, 2.5, '#e8e4d8'); R(c, 8, 7, 1, 1, '#2a2420'); R(c, 10, 7, 1, 1, '#2a2420');
    outline(c, 16, 16);
  });
  canvas(scene, 'stalagmite', 16, 24, (c) => {
    for (let y = 2; y < 23; y++) {
      const w = Math.round(((y - 2) / 21) * 6) + 1;
      R(c, 8 - w, y, w * 2, 1, y % 5 ? '#5a5470' : '#4a4460');
    }
    R(c, 6, 10, 1, 8, '#7a74a0');
    outline(c, 16, 24);
  });
  canvas(scene, 'cactus', 16, 24, (c) => {
    R(c, 6, 3, 5, 20, '#4a9a3a'); R(c, 7, 3, 1, 20, '#6aba4a');
    R(c, 1, 10, 3, 7, '#4a9a3a'); R(c, 2, 15, 4, 2, '#4a9a3a');
    R(c, 13, 7, 3, 7, '#4a9a3a'); R(c, 11, 12, 3, 2, '#4a9a3a');
    for (const [x, y] of [[5, 6], [11, 9], [5, 14], [11, 18]]) R(c, x, y, 1, 1, '#f4f0d0');
    R(c, 7, 1, 3, 2, '#f06090');
    outline(c, 16, 24);
  });
  canvas(scene, 'snow_pine', 24, 40, (c) => {
    R(c, 10, 30, 4, 9, '#5a3a1e');
    for (const [y, hw] of [[4, 4], [10, 7], [17, 9], [24, 11]] as const) {
      for (let i = 0; i < 8; i++) {
        const w = Math.round((hw * (i + 1)) / 8);
        R(c, 12 - w, y + i, w * 2, 1, i < 3 ? '#f4f8ff' : '#2a5a3a');
      }
    }
    outline(c, 24, 40);
  });
  canvas(scene, 'rock_snow', 16, 16, (c) => {
    ellipse(c, 8, 11, 6.5, 4.5, '#7d7b86');
    ellipse(c, 8, 8.5, 5.5, 2.5, '#f4f8ff');
    outline(c, 16, 16);
  });
  canvas(scene, 'ice_crystal', 16, 24, (c) => {
    R(c, 6, 3, 4, 19, '#a8e4ff'); R(c, 7, 3, 1, 17, '#ffffff');
    R(c, 2, 10, 3, 12, '#88c8f0'); R(c, 11, 8, 3, 14, '#88c8f0');
    R(c, 1, 21, 14, 3, '#d8f0ff');
    outline(c, 16, 24, '#2a4a6a');
  });
  canvas(scene, 'boulder', 24, 24, (c) => {
    ellipse(c, 12, 15, 10.5, 8, '#6a6660');
    ellipse(c, 10, 12, 7, 5, '#8a8680');
    R(c, 7, 9, 4, 1, '#aaa69e'); R(c, 14, 17, 5, 1, '#4a4640');
    outline(c, 24, 24);
  });
  canvas(scene, 'obelisk', 16, 32, (c) => {
    for (let y = 2; y < 30; y++) {
      const w = Math.round(2 + ((y - 2) / 28) * 4);
      R(c, 8 - w, y, w * 2, 1, '#3a1a1a');
    }
    R(c, 7, 8, 2, 14, '#e8401a'); R(c, 6, 12, 4, 1, '#e8401a');
    R(c, 2, 29, 12, 3, '#2a1010');
    outline(c, 16, 32);
  });
  canvas(scene, 'void_crystal', 16, 24, (c) => {
    R(c, 6, 3, 4, 19, '#6a2aa8'); R(c, 7, 3, 1, 17, '#c080ff');
    R(c, 2, 11, 3, 11, '#4a1a80'); R(c, 11, 9, 3, 13, '#4a1a80');
    R(c, 1, 21, 14, 3, '#1e1030');
    outline(c, 16, 24, '#0a0610');
  });
  canvas(scene, 'dragon_bone', 32, 24, (c) => {
    for (let i = 0; i < 6; i++) {
      const x = 4 + i * 4;
      for (let y = 4; y < 18; y++) R(c, x + Math.round(Math.sin(y / 3) * 1), y, 2, 1, '#e8e0c8');
    }
    R(c, 2, 18, 28, 3, '#e8e0c8');
    ellipse(c, 27, 12, 4, 3, '#e8e0c8'); R(c, 26, 11, 1, 1, '#2a2420');
    outline(c, 32, 24);
  });
}

// ---------------------------------------------------------------- trại an toàn & trang trí thị trấn

function drawTown2(scene: Phaser.Scene) {
  canvas(scene, 'tent', 32, 24, (c) => {
    for (let y = 2; y < 22; y++) {
      const w = Math.round(((y - 2) / 20) * 14) + 1;
      R(c, 16 - w, y, w * 2, 1, y % 4 ? '#3d6fd1' : '#2c52a0');
    }
    for (let y = 12; y < 22; y++) R(c, 14, y, 4, 1, '#1a2a4a');
    R(c, 15, 0, 2, 3, '#5a3a1e');
    R(c, 1, 22, 30, 2, '#5a3a1e');
    outline(c, 32, 24);
  });
  canvas(scene, 'campfire', 32, 16, (c) => {
    for (const f of [0, 1]) {
      const o = f * 16;
      R(c, o + 2, 12, 12, 2, '#6b4423'); R(c, o + 4, 11, 8, 1, '#8a5a2e');
      ellipse(c, o + 8, 8 + f, 3.5, 4.5 - f, '#f08a2a');
      ellipse(c, o + 8, 9, 2, 2.5 + f * 0.5, '#ffd23a');
      R(c, o + 7 + f, 3, 1, 2, '#ffb020');
      for (const x of [2, 13]) R(c, o + x, 13, 1, 1, '#7d7b76');
    }
    outline(c, 32, 16);
  }, two(16, 16));
  canvas(scene, 'waystone', 16, 28, (c) => {
    R(c, 3, 24, 10, 4, '#6a6660');
    for (let y = 2; y < 24; y++) {
      const w = y < 5 ? y - 1 : 4;
      R(c, 8 - w, y, w * 2, 1, '#8a8a94');
    }
    R(c, 6, 8, 4, 12, '#7fe8ff'); R(c, 7, 9, 2, 10, '#d8ffff'); R(c, 5, 13, 6, 2, '#7fe8ff');
    outline(c, 16, 28);
  });
  canvas(scene, 'fountain', 96, 48, (c) => {
    for (const f of [0, 1]) {
      const o = f * 48;
      ellipse(c, o + 24, 36, 22, 10, '#9a978e');
      ellipse(c, o + 24, 35, 19, 8, '#3b8bd4');
      ellipse(c, o + 24, 34, 15, 5.5, f ? '#5aa7e6' : '#4f9de0');
      R(c, o + 21, 14, 6, 20, '#b3b0a6');
      ellipse(c, o + 24, 15, 9, 3.5, '#9a978e');
      ellipse(c, o + 24, 14, 7, 2.5, '#5aa7e6');
      for (let k = 0; k < 5; k++) R(c, o + 16 + k * 4, 6 + ((k + f) % 2) * 2, 1, 5, '#d8f0ff');
      R(c, o + 23, 2, 2, 10, '#d8f0ff');
    }
    outline(c, 96, 48);
  }, two(48, 48));
  // đài phun nước lớn ở sảnh Hội: hồ tròn 2 tầng, tượng kiếm sĩ giơ kiếm, nước phun 4 phía
  canvas(scene, 'fountain_guild', 160, 64, (c) => {
    for (const f of [0, 1]) {
      const o = f * 80;
      ellipse(c, o + 40, 50, 38, 13, '#8a8478');
      ellipse(c, o + 40, 49, 35, 11, '#a8a296');
      ellipse(c, o + 40, 49, 32, 9.5, '#2f7fc8');
      ellipse(c, o + 40, 48, 28, 7.5, f ? '#5aa7e6' : '#4f9de0');
      for (const [x, y] of [[22, 47], [52, 50], [34, 52], [58, 46]]) R(c, o + x + f * 2, y, 4, 1, '#bfe4ff');
      R(c, o + 34, 32, 12, 16, '#a8a296');
      R(c, o + 34, 32, 12, 2, '#c8c2b4');
      ellipse(c, o + 40, 32, 13, 4, '#8a8478');
      ellipse(c, o + 40, 31, 11, 3, '#5aa7e6');
      // tượng
      R(c, o + 37, 18, 6, 12, '#d8d4c8'); R(c, o + 38, 13, 4, 5, '#d8d4c8');
      R(c, o + 37, 18, 1, 12, '#b8b4a8');
      R(c, o + 43, 6, 2, 13, '#eef2f8'); R(c, o + 42, 18, 4, 1, '#f2c230'); R(c, o + 43, 19, 2, 2, '#8a6a42');
      R(c, o + 33, 20, 4, 8, '#3d6fd1'); R(c, o + 34, 21, 2, 6, '#f2c230');
      // tia nước
      for (const [sx, dir] of [[30, -1], [50, 1]]) {
        for (let k = 0; k < 7; k++) R(c, o + sx + dir * (k + f), 26 + k * 2 - (k < 3 ? 3 - k : 0), 2, 2, k % 2 ? '#d8f0ff' : '#9fd3ff');
      }
      for (let k = 0; k < 6; k++) R(c, o + 24 + k * 6, 38 + ((k + f) % 2) * 2, 1, 5, '#d8f0ff');
      R(c, o + 39, 26 + f, 2, 4, '#d8f0ff');
    }
    outline(c, 160, 64);
  }, two(80, 64));
  canvas(scene, 'dummy', 16, 28, (c) => {
    R(c, 7, 6, 2, 22, '#6b4423');
    R(c, 1, 10, 14, 3, '#8a5a2e');
    ellipse(c, 8, 16, 5, 6, '#d8b878'); R(c, 4, 15, 8, 1, '#a8884a'); R(c, 4, 18, 8, 1, '#a8884a');
    ellipse(c, 8, 5, 4, 4, '#d8b878'); R(c, 6, 4, 1, 1, '#3a2a1a'); R(c, 9, 4, 1, 1, '#3a2a1a');
    R(c, 5, 25, 6, 3, '#5a3a1e');
    outline(c, 16, 28);
  });
  canvas(scene, 'weapon_rack', 32, 24, (c) => {
    R(c, 1, 8, 30, 3, '#8a5a2e'); R(c, 1, 18, 30, 3, '#8a5a2e');
    R(c, 2, 6, 2, 18, '#5a3a1e'); R(c, 28, 6, 2, 18, '#5a3a1e');
    for (const [x, col] of [[7, '#d8dce4'], [12, '#c8a050'], [17, '#d8dce4'], [22, '#b8c0cc']] as const) {
      R(c, x, 1, 2, 18, col); R(c, x - 1, 12, 4, 1, '#5a3a1e'); R(c, x, 13, 2, 3, '#6b4423');
    }
    R(c, 12, 0, 2, 3, '#e8e8f0');
    outline(c, 32, 24);
  });
  canvas(scene, 'barrel', 16, 18, (c) => {
    R(c, 3, 2, 10, 16, '#9a6b3c'); R(c, 2, 4, 12, 12, '#9a6b3c');
    for (const y of [4, 9, 14]) R(c, 2, y, 12, 1, '#4a4a52');
    R(c, 4, 2, 8, 1, '#c08a50'); R(c, 5, 6, 1, 8, '#b8854c');
    outline(c, 16, 18);
  });
  canvas(scene, 'crate', 16, 16, (c) => {
    R(c, 1, 3, 14, 13, '#b8854c');
    R(c, 1, 3, 14, 1, '#d8a868'); R(c, 1, 9, 14, 1, '#8a5a2e');
    for (let i = 0; i < 11; i++) R(c, 2 + i, 4 + Math.floor(i / 2), 1, 1, '#8a5a2e');
    R(c, 1, 3, 1, 13, '#8a5a2e'); R(c, 14, 3, 1, 13, '#8a5a2e');
    outline(c, 16, 16);
  });
  canvas(scene, 'banner', 16, 40, (c) => {
    R(c, 7, 2, 2, 38, '#5a3a1e'); R(c, 6, 0, 4, 3, '#f2c230');
    R(c, 9, 4, 6, 16, '#b8452f'); R(c, 9, 20, 2, 3, '#b8452f'); R(c, 13, 20, 2, 3, '#b8452f');
    R(c, 9, 4, 6, 2, '#f2c230');
    R(c, 11, 9, 2, 7, '#e8e8f0'); R(c, 10, 13, 4, 1, '#f2c230');
    R(c, 4, 37, 8, 3, '#6a6660');
    outline(c, 16, 40);
  });
  canvas(scene, 'bench', 32, 16, (c) => {
    R(c, 2, 4, 28, 3, '#9a6b3c'); R(c, 2, 8, 28, 3, '#b8854c');
    R(c, 4, 11, 2, 5, '#3a3a42'); R(c, 26, 11, 2, 5, '#3a3a42');
    outline(c, 32, 16);
  });
  canvas(scene, 'flowerbed', 16, 16, (c) => {
    R(c, 1, 9, 14, 6, '#7a5230');
    R(c, 2, 8, 12, 2, '#4a8a3a');
    for (const [x, col] of [[3, '#f06090'], [6, '#f6d34a'], [9, '#ffffff'], [12, '#9a5ad8']] as const) {
      R(c, x, 5, 2, 2, col);
      R(c, x, 7, 1, 2, '#3f8f2f');
    }
    outline(c, 16, 16);
  });
}

// ---------------------------------------------------------------- cửa hàng

/** biểu tượng 8×8 vẽ trên biển hiệu, X = màu chính */
const ICONS: Record<string, { color: string; rows: string[] }> = {
  sword: { color: '#e8e8f0', rows: ['......XX', '.....XX.', '....XX..', 'X..XX...', '.XXX....', '..X.....', '.X.X....', 'X.......'] },
  shield: { color: '#3d6fd1', rows: ['XXXXXXXX', 'XX.XX.XX', 'X..XX..X', 'XXXXXXXX', 'X..XX..X', '.X.XX.X.', '..XXXX..', '...XX...'] },
  potion: { color: '#e8402a', rows: ['...XX...', '...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'] },
  seed: { color: '#5fb043', rows: ['.XX..XX.', 'XXXX.XXX', '.XXXXXX.', '...XX...', '...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX'] },
  fish: { color: '#5aa7e6', rows: ['........', '.XXXX..X', 'XXXXXXXX', 'XX.XXXX.', 'XXXXXXXX', '.XXXX..X', '........', '........'] },
  kite: { color: '#e8402a', rows: ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '....X.X.'] },
  wing: { color: '#f4f0e8', rows: ['X.......', 'XX......', 'XXX....X', 'XXXX..XX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...'] },
  paw: { color: '#8a5a2e', rows: ['.X....X.', 'XX.XX.XX', '...XX...', '........', '..XXXX..', '.XXXXXX.', '.XXXXXX.', '..XXXX..'] },
  hat: { color: '#9a5ad8', rows: ['....X...', '...XX...', '...XXX..', '..XXXX..', '..XXXXX.', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.'] },
  shirt: { color: '#f06090', rows: ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..'] },
  ring: { color: '#3d8fd6', rows: ['..X..X..', '...XX...', '..XXXX..', '.X....X.', 'X......X', 'X......X', '.X....X.', '..XXXX..'] },
  cake: { color: '#f06090', rows: ['...X....', '...X....', '.XXXXXX.', 'XXXXXXXX', 'X.X.X.XX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'] },
  scroll: { color: '#f4ecd0', rows: ['XXXXXXX.', 'X.....XX', 'X.XXX.X.', 'X.....X.', 'X.XXX.X.', 'X.....X.', 'XX.....X', '.XXXXXXX'] },
};

function icon(c: Ctx, x: number, y: number, name: string, scale = 2) {
  const ic = ICONS[name];
  ic.rows.forEach((row, ry) => [...row].forEach((ch, rx) => ch === 'X' && R(c, x + rx * scale, y + ry * scale, scale, scale, ic.color)));
}

interface ShopStyle {
  roof: string;
  roofDark: string;
  wall: string;
  wallDark: string;
  awnA: string;
  awnB: string;
  icon: string;
}

function shop(scene: Phaser.Scene, key: string, s: ShopStyle) {
  canvas(scene, key, 64, 64, (c) => {
    const roofH = drawHouse(c, 64, 64, { wall: s.wall, wallDark: s.wallDark, roof: s.roof, roofDark: s.roofDark, trim: '#5a3a1e', door: '#5a3a1e' }, 12);
    // mái hiên sọc
    for (let x = 4; x < 60; x += 6) R(c, x, roofH + 1, 6, 5, (x / 6) % 2 ? s.awnA : s.awnB);
    for (let x = 4; x < 60; x += 3) R(c, x + 1, roofH + 6, 2, 1, Math.floor(x / 6) % 2 ? s.awnA : s.awnB);
    // biển hiệu
    R(c, 22, roofH - 22, 20, 20, '#5a3a1e');
    R(c, 23, roofH - 21, 18, 18, '#f4ecd0');
    icon(c, 24, roofH - 20, s.icon);
    outline(c, 64, 64);
  });
}

function drawShops(scene: Phaser.Scene) {
  shop(scene, 'b_weapon', { roof: '#8a3a2a', roofDark: '#6a2a1a', wall: '#c8b89a', wallDark: '#a89878', awnA: '#c8402f', awnB: '#f4ecd8', icon: 'sword' });
  shop(scene, 'b_armor', { roof: '#3d5f9a', roofDark: '#2c3f6a', wall: '#c8c4bc', wallDark: '#a8a49c', awnA: '#3d6fd1', awnB: '#d8dce4', icon: 'shield' });
  shop(scene, 'b_potion', { roof: '#7b3fa0', roofDark: '#5a2d78', wall: '#e8dcc8', wallDark: '#cfc0a8', awnA: '#9a5ad8', awnB: '#f4ecd8', icon: 'potion' });
  shop(scene, 'b_seed', { roof: '#4f8f3a', roofDark: '#3a6e2a', wall: '#e8d2a6', wallDark: '#d2b986', awnA: '#5fb043', awnB: '#f4ecd8', icon: 'seed' });
  shop(scene, 'b_fish', { roof: '#2f8f8a', roofDark: '#1f6a66', wall: '#d8e4e8', wallDark: '#b8c8cc', awnA: '#3b8bd4', awnB: '#f4f8ff', icon: 'fish' });
  shop(scene, 'b_kite', { roof: '#e8a020', roofDark: '#b87a10', wall: '#f4ecd8', wallDark: '#dccfb0', awnA: '#e8402a', awnB: '#f2c230', icon: 'kite' });
  shop(scene, 'b_wings', { roof: '#d8e4f0', roofDark: '#a8b8c8', wall: '#f4f0e8', wallDark: '#dcd6c8', awnA: '#9fd3f0', awnB: '#ffffff', icon: 'wing' });
  shop(scene, 'b_pets', { roof: '#c87a3a', roofDark: '#9a5a2a', wall: '#f0dcb0', wallDark: '#dcc392', awnA: '#f2a040', awnB: '#f4ecd8', icon: 'paw' });
  shop(scene, 'b_fashion', { roof: '#d0508a', roofDark: '#a03a6a', wall: '#f8e8f0', wallDark: '#e0c8d4', awnA: '#f06090', awnB: '#ffffff', icon: 'shirt' });
  shop(scene, 'b_hats', { roof: '#3d6fa0', roofDark: '#2a4f78', wall: '#f0ecdc', wallDark: '#d8d2bc', awnA: '#9a5ad8', awnB: '#f4ecd8', icon: 'hat' });
  shop(scene, 'b_jewelry', { roof: '#2a2a58', roofDark: '#1a1a3a', wall: '#ece8f4', wallDark: '#d0cadc', awnA: '#f2c230', awnB: '#2a2a58', icon: 'ring' });
  shop(scene, 'b_bakery', { roof: '#b8603a', roofDark: '#8a4428', wall: '#fbeedc', wallDark: '#e6d2b8', awnA: '#e8805a', awnB: '#fff6e8', icon: 'cake' });
  // cửa hang mỏ: đồi đá, khung gỗ chống lò, đường ray, đèn lồng
  canvas(scene, 'b_mine', 48, 48, (c) => {
    for (let y = 4; y < 46; y++) {
      const half = Math.min(23, 8 + (y - 4) * 0.9);
      R(c, 24 - half, y, half * 2, 1, y < 14 ? '#8a8478' : '#77716a');
    }
    for (const [x, y, w] of [[10, 10, 5], [30, 8, 6], [5, 24, 6], [36, 20, 7], [18, 6, 4], [40, 32, 5], [3, 36, 5]]) {
      R(c, x, y, w, 3, '#9a948a');
      R(c, x, y + 3, w, 1, '#5a564e');
    }
    R(c, 6, 2, 6, 3, '#4f7a3a'); R(c, 32, 1, 8, 3, '#4f7a3a');
    R(c, 14, 20, 20, 26, '#1a1410');
    R(c, 16, 18, 16, 2, '#1a1410');
    R(c, 17, 24, 14, 22, '#0c0a08');
    R(c, 12, 18, 3, 28, '#8a5a2e'); R(c, 33, 18, 3, 28, '#8a5a2e');
    R(c, 10, 15, 28, 4, '#a06a36'); R(c, 10, 18, 28, 1, '#5a3a1e');
    R(c, 12, 18, 1, 28, '#5a3a1e'); R(c, 35, 18, 1, 28, '#5a3a1e');
    for (let y = 30; y < 48; y += 3) R(c, 18, y, 12, 1, '#6a4a2a');
    R(c, 19, 28, 1, 20, '#b8b8c0'); R(c, 28, 28, 1, 20, '#b8b8c0');
    R(c, 21, 40, 6, 4, '#6a6a72'); R(c, 20, 39, 8, 1, '#8a8a92'); R(c, 22, 38, 2, 1, '#f2c230'); R(c, 25, 38, 1, 1, '#7fd3ff');
    R(c, 40, 22, 1, 14, '#5a3a1e'); R(c, 38, 21, 5, 2, '#5a3a1e');
    R(c, 38, 23, 4, 4, '#f2c230'); R(c, 39, 24, 2, 2, '#fff3b0');
    R(c, 4, 30, 8, 6, '#a06a36'); R(c, 5, 31, 6, 4, '#c8945a'); R(c, 7, 36, 2, 6, '#5a3a1e');
    R(c, 6, 32, 1, 2, '#3a3a3a'); R(c, 8, 32, 2, 1, '#3a3a3a'); R(c, 9, 33, 1, 1, '#3a3a3a');
    outline(c, 48, 48);
  });
  canvas(scene, 'b_bounty', 64, 48, (c) => {
    R(c, 4, 6, 3, 22, '#5a3a1e'); R(c, 57, 6, 3, 22, '#5a3a1e');
    for (let x = 0; x < 64; x += 8) R(c, x, 2, 8, 12, (x / 8) % 2 ? '#f2c230' : '#8a2f1f');
    R(c, 0, 1, 64, 2, '#5a1a10');
    R(c, 10, 14, 44, 12, '#9a6b3c');
    for (const [x, y] of [[12, 15], [24, 16], [36, 15], [46, 16]]) {
      R(c, x, y, 8, 9, '#f4ecd0');
      R(c, x + 2, y + 2, 4, 1, '#c8302a');
      R(c, x + 1, y + 5, 6, 1, '#9a8a6a');
    }
    R(c, 4, 28, 56, 16, '#7a5230'); for (let y = 31; y < 44; y += 4) R(c, 4, y, 56, 1, '#5a3a1e');
    R(c, 2, 26, 60, 3, '#c08a50');
    icon(c, 28, 30, 'scroll', 1);
    outline(c, 64, 48);
  });
  canvas(scene, 'h_cottage', 80, 64, (c) => {
    drawHouse(c, 80, 64, { wall: '#f8e8e0', wallDark: '#e4d0c4', roof: '#d0508a', roofDark: '#a03a6a', trim: '#8a5a2e', door: '#a03a6a' });
    for (const x of [6, 64]) for (let k = 0; k < 4; k++) R(c, x + k * 3, 60, 2, 2, '#f06090');
    outline(c, 80, 64);
  });
  canvas(scene, 'h_town', 80, 64, (c) => {
    const roofH = drawHouse(c, 80, 64, { wall: '#c8c4bc', wallDark: '#a8a49c', roof: '#4a5a6a', roofDark: '#2e3a46', trim: '#3d5f9a', door: '#3d5f9a', stone: true });
    R(c, 30, roofH - 14, 20, 10, '#c8c4bc'); R(c, 32, roofH - 12, 7, 6, '#9fd3f0'); R(c, 41, roofH - 12, 7, 6, '#9fd3f0');
    outline(c, 80, 64);
  });
  canvas(scene, 'h_manor', 80, 64, (c) => {
    const roofH = drawHouse(c, 80, 64, { wall: '#d8d0b8', wallDark: '#b8b098', roof: '#3a7a4a', roofDark: '#285a34', trim: '#5a3a1e', door: '#5a3a1e', stone: true }, 14);
    R(c, 6, 0, 8, roofH - 6, '#7d7b76'); R(c, 66, 0, 8, roofH - 6, '#7d7b76');
    for (let y = 8; y < roofH; y += 6) R(c, 30, y, 20, 2, '#2a5a34');
    outline(c, 80, 64);
  });
}

// ---------------------------------------------------------------- đồ thời trang, thú cưng, diều

function drawCosmetics(scene: Phaser.Scene) {
  // cánh 28×18, 3 kiểu: lông vũ / màng (dơi, rồng, quỷ) / cánh tiên 2 thùy. a có thể là dải màu (cầu vồng)
  type WingShape = 'feather' | 'membrane' | 'fairy';
  const wing = (key: string, a: string | string[], b: string, edge: string, shape: WingShape = 'feather') =>
    canvas(scene, key, 28, 18, (c) => {
      const col = (i: number) => (Array.isArray(a) ? a[i % a.length] : a);
      for (const side of [-1, 1]) {
        if (shape === 'fairy') {
          ellipse(c, 14 + side * 7.5, 6.5, 6, 5, col(0));
          ellipse(c, 14 + side * 7.5, 6, 3.5, 2.6, b);
          ellipse(c, 14 + side * 5, 13, 4, 3.5, col(0));
          ellipse(c, 14 + side * 5, 13, 2, 1.6, b);
          R(c, side < 0 ? 8 : 19, 3, 1, 1, '#ffffff');
          continue;
        }
        for (let i = 0; i < 10; i++) {
          const x = 14 + side * (2 + i);
          const xx = side < 0 ? x - 1 : x;
          if (shape === 'membrane') {
            const top = 1 + Math.round(i * 0.35);
            const h = 12 - Math.round(i * 0.7) - (i % 3 === 2 ? 2 : 0);
            R(c, xx, top, 1, h, i % 3 === 0 ? b : col(i));
            R(c, xx, top, 1, 1, edge);
            R(c, xx, top + h, 1, 1, edge);
          } else {
            const top = 2 + Math.round(i * 0.4);
            const h = 13 - Math.round(i * 0.9);
            R(c, xx, top, 1, h, i % 3 === 0 ? b : col(i));
            R(c, xx, top + h, 1, 1, edge);
          }
        }
      }
      outline(c, 28, 18);
    });
  wing('wings_leaf', '#6fbf4a', '#a8e070', '#3f8f3a');
  wing('wings_butterfly', '#f06090', '#9fd3f0', '#9a5ad8');
  wing('wings_dragonfly', '#cfefff', '#ffffff', '#7fb8d8', 'fairy');
  wing('wings_angel', '#ffffff', '#e8eef8', '#c8d0e0');
  wing('wings_bat', '#4a2e5a', '#6a4a7a', '#2a1a3a', 'membrane');
  wing('wings_moth', '#5a5ad8', '#a080ff', '#2a2a6a', 'fairy');
  wing('wings_frost', '#bfe8ff', '#ffffff', '#5a9ad8');
  wing('wings_sakura', '#ffb0d0', '#fff0f6', '#d0608a', 'fairy');
  wing('wings_seraph', '#fff6d0', '#ffffff', '#f2c230');
  wing('wings_thunder', '#ffe040', '#4aa0ff', '#2a3a8a');
  wing('wings_phoenix', '#f2a020', '#e8402a', '#ffe680');
  wing('wings_dragon', '#c8302a', '#8a1f1a', '#f2c230', 'membrane');
  wing('wings_demon', '#8a1020', '#c8302a', '#1a0a0a', 'membrane');
  wing('wings_void', '#2a1048', '#b060ff', '#0a0418', 'fairy');
  wing('wings_rainbow', ['#e8402a', '#f2a020', '#f2e040', '#4fd06a', '#3d8fe0', '#8a4ad8'], '#ffffff', '#f2c230');

  const hat = (key: string, draw: (c: Ctx) => void) =>
    canvas(scene, key, 16, 10, (c) => {
      draw(c);
      outline(c, 16, 10);
    });
  hat('hat_straw', (c) => {
    R(c, 1, 7, 14, 2, '#e8c870'); R(c, 4, 3, 8, 4, '#e8c870'); R(c, 4, 6, 8, 1, '#c8402f');
  });
  hat('hat_nonla', (c) => {
    for (let y = 1; y < 9; y++) R(c, 8 - y, y, y * 2, 1, y % 3 ? '#f0e0b0' : '#d8c890');
  });
  hat('hat_wizard', (c) => {
    for (let y = 0; y < 8; y++) R(c, 8 - Math.ceil(y / 2) - 1, y, Math.ceil(y / 2) * 2 + 2, 1, '#6a3aa0');
    R(c, 1, 8, 14, 2, '#6a3aa0'); R(c, 7, 3, 2, 2, '#f2c230');
  });
  hat('hat_knight', (c) => {
    R(c, 3, 1, 10, 8, '#a9b0ba'); R(c, 3, 1, 10, 2, '#d8dce4'); R(c, 4, 6, 8, 1, '#2a2a38'); R(c, 7, 0, 2, 2, '#c8402f');
  });
  hat('hat_crown', (c) => {
    R(c, 3, 4, 10, 5, '#f2c230');
    for (const x of [3, 7, 11]) R(c, x, 1, 2, 3, '#f2c230');
    R(c, 7, 5, 2, 2, '#e8302a'); R(c, 4, 6, 1, 1, '#3d6fd1'); R(c, 11, 6, 1, 1, '#3d6fd1');
  });

  // thú cưng 12×12, 2 khung; mỗi khuôn nhận bảng màu nên thêm pet mới chỉ cần 1 dòng
  const pet = (key: string, draw: (c: Ctx, o: number, f: number) => void) =>
    canvas(scene, key, 24, 12, (c) => {
      for (const f of [0, 1]) draw(c, f * 12, f);
      outline(c, 24, 12);
    }, two(12, 12));
  const bird = (key: string, body: string, beak: string, belly?: string, crest?: string) =>
    pet(key, (c, o, f) => {
      ellipse(c, o + 6, 7 - f * 0.5, 4, 3.5, body);
      if (belly) ellipse(c, o + 6, 8 - f * 0.5, 2.2, 2.2, belly);
      if (crest) R(c, o + 5, 2 - f, 3, 2, crest), R(c, o + 2, 5, 2, 3, crest);
      R(c, o + 8, 5, 2, 1, beak); R(c, o + 7, 4, 1, 1, '#1e1a1a');
      R(c, o + 5, 11, 1, 1, beak); R(c, o + 7, 11, 1, 1, beak);
    });
  const cat = (key: string, body: string, stripe: string, eye = '#1e1a1a', paw?: string) =>
    pet(key, (c, o, f) => {
      R(c, o + 2, 5, 7, 5, body); R(c, o + 7, 2, 4, 4, body); R(c, o + 7, 1, 1, 1, body); R(c, o + 10, 1, 1, 1, body);
      R(c, o + 8, 3, 1, 1, eye); R(c, o + 0, 3 + f, 2, 4, body); R(c, o + 3, 6, 4, 1, stripe);
      R(c, o + 3, 10, 1, 2 - f, body); R(c, o + 7, 10, 1, 1 + f, body);
      if (paw) R(c, o + 10, 6 - f * 2, 2, 2, paw);
    });
  const dog = (key: string, body: string, ear: string, horn?: string) =>
    pet(key, (c, o, f) => {
      R(c, o + 2, 5, 7, 5, body); R(c, o + 7, 2, 4, 5, body); R(c, o + 7, 2, 1, 4, ear);
      R(c, o + 9, 3, 1, 1, '#1e1a1a'); R(c, o + 10, 5, 1, 1, '#1e1a1a'); R(c, o + 0, 4 - f, 2, 2, body);
      R(c, o + 3, 10, 1, 2 - f, ear); R(c, o + 7, 10, 1, 1 + f, ear);
      if (horn) R(c, o + 9, 0, 1, 2, horn), R(c, o + 3, 4, 4, 1, ear);
    });
  const bunny = (key: string, body: string, inner: string) =>
    pet(key, (c, o, f) => {
      ellipse(c, o + 5.5, 8 + f * 0.3, 4, 3.2, body); ellipse(c, o + 8, 5.5, 2.5, 2.3, body);
      R(c, o + 7, 0 + f, 1, 4, body); R(c, o + 9, 0 + f, 1, 4, body); R(c, o + 7, 1 + f, 1, 2, inner);
      R(c, o + 9, 5, 1, 1, '#1e1a1a'); R(c, o + 10, 6, 1, 1, inner); R(c, o + 1, 7, 2, 2, '#ffffff');
    });
  const slime = (key: string, body: string, hl: string) =>
    pet(key, (c, o, f) => {
      ellipse(c, o + 6, 8 + f * 0.5, 5 + f * 0.5, 3.5 - f * 0.5, body); R(c, o + 3, 6, 2, 1, hl);
      R(c, o + 4, 8, 1, 1, '#1e1a1a'); R(c, o + 7, 8, 1, 1, '#1e1a1a');
    });
  const fox = (key: string, body: string, tip: string, tails = 1) =>
    pet(key, (c, o, f) => {
      for (let t = 0; t < tails; t++) {
        const ty = 3 + f + (t - (tails - 1) / 2) * 2;
        R(c, o + 0, ty, 3, 3, body); R(c, o + 0, ty, 1, 1, tip);
      }
      R(c, o + 2, 5, 6, 4, body); R(c, o + 7, 2, 4, 4, body); R(c, o + 7, 0, 1, 2, body); R(c, o + 10, 0, 1, 2, body);
      R(c, o + 9, 4, 2, 1, tip); R(c, o + 8, 3, 1, 1, '#1e1a1a');
      R(c, o + 3, 9, 1, 2 - f, shade2(body)); R(c, o + 6, 9, 1, 1 + f, shade2(body));
    });
  const dragon = (key: string, body: string, wingC: string, eye: string, horn = '#f2e0c0') =>
    pet(key, (c, o, f) => {
      R(c, o + 2, 5, 6, 4, body); R(c, o + 7, 2, 4, 4, body); R(c, o + 8, 3, 1, 1, eye);
      R(c, o + 7, 0, 1, 2, horn); R(c, o + 3, 2 + f, 3, 3, wingC); R(c, o + 0, 6, 2, 2, body);
      R(c, o + 3, 9, 1, 2 - f, shade2(body)); R(c, o + 6, 9, 1, 1 + f, shade2(body));
    });
  bird('pet_chick', '#f6d34a', '#f2a020');
  bird('pet_duck', '#f4f4f0', '#f2a020');
  bird('pet_penguin', '#2a2a38', '#f2a020', '#f4f4f0');
  bird('pet_phoenix', '#e8402a', '#ffe680', '#f2a020', '#ffd23a');
  cat('pet_cat', '#f0a040', '#c87a2a');
  cat('pet_cat_black', '#2a2a32', '#1a1a20', '#ffd23a');
  cat('pet_cat_lucky', '#f4ecd8', '#f2c230', '#1e1a1a', '#f4ecd8');
  dog('pet_dog', '#c8955a', '#8a5a2e');
  dog('pet_husky', '#a9b0ba', '#4a4f5a');
  dog('pet_unicorn', '#f8f4ff', '#f0a0d0', '#f2c230');
  bunny('pet_bunny', '#f8f4f0', '#f0a0b8');
  slime('pet_slime', '#f080b0', '#ffd0e4');
  slime('pet_slime_green', '#6fd06a', '#c8ffc0');
  slime('pet_slime_crystal', '#7fe8ff', '#ffffff');
  fox('pet_fox', '#e8702a', '#f4f0e8');
  fox('pet_fox_snow', '#f4f4f8', '#9fd3f0');
  fox('pet_kitsune', '#f2c230', '#ffffff', 3);
  dragon('pet_dragon', '#9a5ad8', '#c080ff', '#ffe680');
  dragon('pet_dragon_dark', '#2a2030', '#c8302a', '#ff4040', '#c8302a');

  for (const k of KITES) {
    canvas(scene, k.id, 16, 24, (c) => {
      for (let y = 0; y < 12; y++) {
        const w = y < 6 ? y + 1 : 12 - y;
        R(c, 8 - w, y, w, 1, k.colors[0]);
        R(c, 8, y, w, 1, k.colors[1]);
      }
      R(c, 8, 0, 1, 12, '#5a3a1e'); R(c, 2, 5, 12, 1, '#5a3a1e');
      for (const [x, y] of [[8, 13], [7, 15], [8, 17], [9, 19], [8, 21]]) R(c, x, y, 2, 1, x % 2 ? k.colors[1] : k.colors[0]);
      outline(c, 16, 24);
    });
  }
}

function drawFishingGear(scene: Phaser.Scene) {
  // cần câu cầm trên tay (không vẽ dây — dây vẽ động trong thế giới)
  for (const r of RODS) canvas(scene, `rodtex_${r.id}`, 24, 24, (c) => drawRod(c, r.id, 24, false));
  for (const e of ALL_EQUIPMENT.filter((x) => x.slot === 'weapon')) canvas(scene, `weptex_${e.id}`, 20, 20, (c) => drawWeapon(c, e.id, 20));
  canvas(scene, 'bobber', 6, 8, (c) => {
    R(c, 1, 0, 4, 4, '#e8402a');
    R(c, 1, 4, 4, 3, '#f4f0e8');
    R(c, 2, 1, 1, 1, '#ff9a8a');
    R(c, 2, 7, 2, 1, '#8a8a94');
    outline(c, 6, 8);
  });
  canvas(scene, 'ripple', 16, 8, (c) => {
    c.strokeStyle = 'rgba(220,240,255,0.9)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2);
    c.stroke();
  });
}

export function drawWorld2(scene: Phaser.Scene) {
  drawFishingGear(scene);
  drawMonsters2(scene);
  drawProps2(scene);
  drawTown2(scene);
  drawShops(scene);
  drawCosmetics(scene);
}
