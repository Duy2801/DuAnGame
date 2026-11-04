import type Phaser from 'phaser';
import { R, canvas, ellipse, outline, type Ctx } from './textures';

// Phố Chung Cư: 2 tòa chung cư, Sàn Bất Động Sản, biển quảng cáo + đồ trang trí Phố Nhà Vườn

/** bố cục mặt tiền mỗi tòa — WorldScene dùng để thắp đèn đúng ô cửa sổ của căn đã mua */
export const TOWER_ART: Record<string, { w: number; h: number; floorY: (f: number) => number; slotX: (s: number) => number; winW: number; winH: number }> = {
  saomai: { w: 96, h: 96, floorY: (f) => 18 + (6 - f) * 12, slotX: (s) => 12 + s * 25, winW: 22, winH: 7 },
  sky: { w: 112, h: 112, floorY: (f) => 20 + (9 - f) * 9, slotX: (s) => 14 + s * 44, winW: 40, winH: 7 },
};

/** ô kính của 1 căn (toạ độ trong ảnh, tính từ góc trên-trái) */
export const towerWindow = (tower: string, floor: number, slot: number) => {
  const a = TOWER_ART[tower];
  return { x: a.slotX(slot) + 1, y: a.floorY(floor) + 2, w: a.winW - 2, h: a.winH - 2 };
};

function star(c: Ctx, cx: number, cy: number, col: string) {
  R(c, cx, cy - 3, 1, 7, col);
  R(c, cx - 3, cy, 7, 1, col);
  R(c, cx - 1, cy - 1, 3, 3, col);
  R(c, cx - 2, cy + 2, 1, 1, col);
  R(c, cx + 2, cy + 2, 1, 1, col);
}

function saoMai(c: Ctx) {
  const a = TOWER_ART.saomai;
  // vườn trên mái + bể nước + biển tên
  for (const x of [11, 22, 62]) {
    ellipse(c, x, 9, 5, 4, '#3f8a2f');
    ellipse(c, x - 1, 8, 3, 2, '#6fbf4f');
  }
  R(c, 70, 1, 13, 9, '#9aa4ac'); R(c, 70, 1, 13, 2, '#c8d0d6'); R(c, 72, 4, 1, 6, '#7d8a92'); R(c, 80, 4, 1, 6, '#7d8a92');
  R(c, 31, 0, 34, 12, '#d9a830'); R(c, 32, 1, 32, 10, '#1f2a3a');
  star(c, 37, 6, '#ffd23a');
  for (const [x, w] of [[43, 3], [47, 3], [51, 3], [56, 2], [59, 3]]) R(c, x, 4, w, 4, '#fff3c4');
  // thân tòa
  R(c, 6, 16, 84, 76, '#ece4d0');
  for (let y = 18; y < 78; y += 3) R(c, 10, y, 76, 1, '#e2d8c0');
  R(c, 4, 14, 6, 78, '#2f8f8a'); R(c, 4, 14, 2, 78, '#46b0a9');
  R(c, 86, 14, 6, 78, '#2f8f8a'); R(c, 90, 14, 2, 78, '#1f6a66');
  R(c, 2, 10, 92, 6, '#2f8f8a'); R(c, 2, 10, 92, 2, '#5cc4bc'); R(c, 2, 15, 92, 1, '#1f6a66');
  // 5 tầng căn hộ, mỗi tầng 3 căn có ban công
  for (let f = 2; f <= 6; f++) {
    const y = a.floorY(f);
    R(c, 10, y + 11, 76, 1, '#cfc4aa');
    for (let s = 0; s < 3; s++) {
      const x = a.slotX(s);
      R(c, x, y + 1, a.winW, a.winH, '#1f6a66');
      R(c, x + 1, y + 2, a.winW - 2, a.winH - 2, '#9fd3f0');
      R(c, x + 11, y + 2, 1, a.winH - 2, '#1f6a66');
      R(c, x + 2, y + 2, 5, 1, '#e6f6ff');
      R(c, x - 1, y + 8, a.winW + 2, 1, '#5a6a72');
      for (let k = 0; k <= a.winW; k += 3) R(c, x - 1 + k, y + 8, 1, 3, '#5a6a72');
      R(c, x - 1, y + 10, a.winW + 2, 1, '#7d8a92');
      if ((f + s) % 3 === 0) {
        R(c, x + 17, y + 6, 3, 2, '#a0522d');
        ellipse(c, x + 18.5, y + 5, 2.5, 2, '#5fb043');
      }
    }
  }
  // sảnh tầng trệt
  R(c, 6, 76, 84, 2, '#2f8f8a');
  R(c, 12, 79, 72, 11, '#24364e');
  for (const x of [14, 26, 60, 72]) {
    R(c, x, 80, 10, 9, '#7fb8d8');
    R(c, x + 1, 81, 3, 1, '#d8f0ff');
  }
  R(c, 34, 74, 28, 3, '#f2c230'); R(c, 34, 76, 28, 1, '#b98112');
  R(c, 40, 78, 16, 14, '#2f8f8a'); R(c, 42, 80, 12, 12, '#bfe6f5'); R(c, 47, 80, 2, 12, '#2f8f8a');
  R(c, 2, 92, 92, 4, '#7d7b76'); R(c, 2, 92, 92, 1, '#9a9892');
  outline(c, a.w, a.h);
}

function sky(c: Ctx) {
  const a = TOWER_ART.sky;
  // vương miện + sân trực thăng + ăng-ten đèn đỏ
  R(c, 84, 0, 1, 10, '#9aa4ac'); R(c, 83, 0, 3, 2, '#ff3a2a');
  R(c, 30, 4, 52, 5, '#3a3a42'); R(c, 30, 4, 52, 1, '#5a5a62');
  R(c, 51, 5, 1, 3, '#ffd23a'); R(c, 60, 5, 1, 3, '#ffd23a'); R(c, 51, 6, 10, 1, '#ffd23a');
  R(c, 22, 9, 68, 5, '#c9971f'); R(c, 22, 9, 68, 1, '#f2c230');
  R(c, 12, 14, 88, 6, '#d9a830'); R(c, 12, 14, 88, 1, '#ffe27a'); R(c, 12, 19, 88, 1, '#fff3b0');
  for (let x = 16; x < 98; x += 8) R(c, x, 15, 3, 3, '#8a6410');
  // thân kính
  R(c, 10, 20, 92, 72, '#1b2f4d');
  R(c, 8, 18, 5, 90, '#d9a830'); R(c, 8, 18, 1, 90, '#ffe27a');
  R(c, 99, 18, 5, 90, '#d9a830'); R(c, 103, 18, 1, 90, '#8a6410');
  R(c, 54, 20, 4, 72, '#d9a830');
  for (let f = 2; f <= 9; f++) {
    const y = a.floorY(f);
    R(c, 10, y + 8, 92, 1, '#3a4e6e');
    for (let s = 0; s < 2; s++) {
      const x = a.slotX(s);
      R(c, x, y + 1, a.winW, a.winH, '#2c5a8a');
      R(c, x, y + 1, a.winW, 2, '#4a86c0');
      for (let k = 8; k < a.winW; k += 8) R(c, x + k, y + 1, 1, a.winH, '#162640');
    }
  }
  // vệt phản chiếu chéo trên kính
  for (let y = 21; y < 92; y++) {
    const x = 18 + Math.round((92 - y) * 0.45);
    R(c, x, y, 3, 1, 'rgba(255,255,255,0.22)');
    R(c, x + 44, y, 2, 1, 'rgba(255,255,255,0.14)');
  }
  // sảnh
  R(c, 10, 92, 92, 16, '#141e30');
  for (const x of [14, 30, 66, 82]) {
    R(c, x, 95, 14, 10, '#3a5a7a');
    R(c, x + 2, 97, 2, 2, '#ffd98a'); R(c, x + 9, 97, 2, 2, '#ffd98a');
  }
  R(c, 34, 88, 44, 4, '#d9a830'); R(c, 34, 91, 44, 1, '#8a6410');
  R(c, 48, 93, 16, 15, '#d9a830'); R(c, 50, 95, 12, 13, '#bfe6f5'); R(c, 55, 95, 2, 13, '#d9a830');
  R(c, 4, 108, 104, 4, '#7d7b76'); R(c, 4, 108, 104, 1, '#9a9892');
  outline(c, a.w, a.h);
}

function realty(c: Ctx) {
  // biển hiệu mái: ngôi nhà + chữ
  R(c, 18, 0, 44, 13, '#d9a830'); R(c, 20, 2, 40, 9, '#1f2a3a');
  for (let k = 0; k < 4; k++) R(c, 25 - k, 3 + k, 3 + k * 2, 1, '#ffd23a');
  R(c, 23, 7, 7, 3, '#ffd23a');
  for (const [x, w] of [[33, 4], [38, 3], [42, 4], [47, 3], [51, 6]]) R(c, x, 5, w, 3, '#fff3c4');
  // thân
  R(c, 2, 12, 76, 8, '#1f2a3a'); R(c, 2, 19, 76, 1, '#d9a830'); R(c, 2, 12, 76, 1, '#3a4e6e');
  R(c, 4, 20, 72, 40, '#f4f0e8');
  R(c, 8, 24, 64, 30, '#24364e');
  // tủ kính trưng bày mô hình: tòa chung cư bên trái, ngôi nhà bên phải
  const pane = (x: number) => {
    R(c, x, 26, 18, 18, '#7fb8d8');
    R(c, x + 1, 27, 4, 1, '#d8f0ff');
  };
  pane(10); pane(52);
  R(c, 13, 32, 5, 12, '#1b2f4d'); R(c, 19, 29, 5, 15, '#2f8f8a'); R(c, 14, 34, 1, 1, '#ffd98a'); R(c, 21, 31, 1, 1, '#ffd98a'); R(c, 21, 35, 1, 1, '#ffd98a');
  for (let k = 0; k < 4; k++) R(c, 60 - k, 31 + k, 2 + k * 2, 1, '#c8402f');
  R(c, 56, 35, 9, 7, '#f4ecd8'); R(c, 59, 38, 3, 4, '#7a3a20');
  R(c, 8, 44, 64, 2, '#d9a830');
  R(c, 32, 34, 16, 22, '#d9a830'); R(c, 34, 36, 12, 20, '#bfe6f5'); R(c, 39, 36, 2, 20, '#d9a830');
  // băng rôn đỏ hai bên
  for (const x of [0, 76]) {
    R(c, x, 20, 4, 24, '#c8302a');
    for (let y = 23; y < 42; y += 5) R(c, x + 1, y, 2, 2, '#ffd23a');
  }
  R(c, 0, 60, 80, 4, '#7d7b76'); R(c, 0, 60, 80, 1, '#9a9892');
  outline(c, 80, 64);
}

function billboard(c: Ctx) {
  R(c, 10, 26, 3, 14, '#5a5a62'); R(c, 35, 26, 3, 14, '#5a5a62');
  R(c, 0, 0, 48, 27, '#d9a830');
  R(c, 2, 2, 44, 18, '#3a5a9a');
  R(c, 2, 12, 44, 8, '#e8805a'); R(c, 2, 16, 44, 4, '#f2c230');
  ellipse(c, 36, 12, 4, 4, '#ffe27a');
  for (const [x, y, w] of [[4, 11, 6], [11, 7, 7], [19, 12, 5], [25, 4, 8], [34, 9, 6], [41, 13, 4]]) {
    R(c, x, y, w, 20 - y, '#141e30');
    for (let yy = y + 2; yy < 19; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) if ((xx + yy) % 3) R(c, xx, yy, 1, 1, '#ffd98a');
  }
  R(c, 28, 1, 2, 3, '#ff3a2a');
  R(c, 2, 20, 44, 5, '#1f2a3a');
  for (const [x, w] of [[5, 5], [11, 3], [15, 6], [22, 4], [27, 5], [33, 3], [37, 6]]) R(c, x, 21, w, 3, '#fff3c4');
  R(c, 36, 0, 12, 6, '#e8402a'); R(c, 38, 2, 8, 2, '#ffffff');
  outline(c, 48, 40);
}

export function drawRealty(scene: Phaser.Scene) {
  canvas(scene, 't_saomai', 96, 96, saoMai);
  canvas(scene, 't_sky', 112, 112, sky);
  canvas(scene, 'b_realty', 80, 64, realty);
  canvas(scene, 'billboard', 48, 40, billboard);
  canvas(scene, 'hedge', 16, 16, (c) => {
    R(c, 1, 5, 14, 10, '#3f8a2f'); R(c, 2, 3, 12, 3, '#5fb043');
    for (const [x, y] of [[3, 7], [8, 6], [11, 9], [5, 11], [12, 4]]) R(c, x, y, 2, 1, '#6fc04f');
    R(c, 1, 14, 14, 1, '#2f6a22');
    outline(c, 16, 16);
  });
  canvas(scene, 'mailbox', 16, 16, (c) => {
    R(c, 7, 8, 2, 8, '#5a3a1e');
    R(c, 3, 2, 10, 7, '#c8402f'); R(c, 3, 2, 10, 2, '#e85a40'); R(c, 4, 5, 6, 1, '#8a2a1e');
    R(c, 12, 0, 1, 5, '#f2c230'); R(c, 12, 0, 3, 2, '#f2c230');
    outline(c, 16, 16);
  });
  canvas(scene, 'own_flag', 14, 26, (c) => {
    R(c, 2, 0, 1, 26, '#9a9892');
    R(c, 3, 1, 10, 7, '#3fae4a'); R(c, 3, 7, 10, 1, '#2a7a32');
    R(c, 5, 3, 3, 3, '#f2c230'); R(c, 6, 4, 1, 1, '#3fae4a'); R(c, 8, 4, 4, 1, '#f2c230'); R(c, 10, 5, 1, 1, '#f2c230');
    outline(c, 14, 26);
  });
}
