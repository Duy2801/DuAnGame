import type Phaser from 'phaser';
import { R, canvas, ellipse, outline, type Ctx } from './textures';

// Khu Mua Sắm: quầy Vòng Quay May Mắn + đồ trang trí phố (xe bóng bay, xe kem, bàn cà phê có dù)

const WHEEL_COLORS = ['#f2c230', '#5aa7e6', '#e8805a', '#e8402a', '#b070ff', '#f06090', '#3fae4a', '#2a1a5a'];

/** quầy vòng quay 48×48: bánh xe lớn trên giá, quầy sọc bên dưới */
function wheelKiosk(c: Ctx) {
  // chân giá
  R(c, 10, 18, 3, 16, '#8a5a2e'); R(c, 35, 18, 3, 16, '#8a5a2e');
  // bánh xe
  const cx = 24, cy = 15, r = 13;
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r) continue;
      const a = (Math.atan2(x + 0.5 - cx, -(y + 0.5 - cy)) + Math.PI * 2) % (Math.PI * 2);
      R(c, x, y, 1, 1, d > r - 1.5 ? '#f2c230' : WHEEL_COLORS[Math.floor(a / (Math.PI / 4)) % 8]);
    }
  ellipse(c, cx, cy, 3, 3, '#fff3c4');
  R(c, cx - 1, cy - 1, 2, 2, '#e8402a');
  // kim chỉ
  R(c, cx - 2, 0, 5, 2, '#e8402a'); R(c, cx - 1, 2, 3, 1, '#e8402a');
  // bóng đèn quanh vành
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    R(c, Math.round(cx + Math.cos(a) * (r + 1)), Math.round(cy + Math.sin(a) * (r + 1)), 1, 1, i % 2 ? '#ffffff' : '#fff3b0');
  }
  // quầy
  R(c, 4, 32, 40, 14, '#f4ecd8'); R(c, 4, 32, 40, 2, '#dccfb0');
  for (let x = 4; x < 44; x += 5) R(c, x, 34, 3, 12, (x / 5) % 2 ? '#e8402a' : '#f2c230');
  R(c, 2, 29, 44, 4, '#5a3a1e'); R(c, 2, 29, 44, 1, '#8a5a2e');
  R(c, 16, 38, 16, 6, '#3a2a1a'); R(c, 18, 39, 12, 2, '#f2c230');
  outline(c, 48, 48);
}

function balloonCart(c: Ctx) {
  const balloons: [number, number, string][] = [[4, 5, '#e8402a'], [12, 4, '#3d8fd6'], [8, 1, '#f2c230'], [3, 11, '#3fae4a'], [13, 10, '#f06090']];
  for (const [x, y] of balloons) R(c, 8, Math.min(y + 4, 20), 1, 20 - Math.min(y + 4, 20), '#e8e8e8'), R(c, Math.min(x, 8), y + 4, Math.abs(8 - x) + 1, 1, '#e8e8e8');
  for (const [x, y, col] of balloons) {
    ellipse(c, x, y + 1, 3, 3.5, col);
    R(c, x - 1, y - 1, 1, 1, '#ffffff');
  }
  R(c, 2, 20, 12, 6, '#f4ecd8'); R(c, 2, 20, 12, 2, '#3d8fd6'); R(c, 2, 24, 12, 1, '#dccfb0');
  ellipse(c, 4, 28, 2, 2, '#3a3a42'); ellipse(c, 12, 28, 2, 2, '#3a3a42');
  outline(c, 16, 32);
}

function icecreamCart(c: Ctx) {
  // dù sọc
  for (let x = 1; x < 23; x++) R(c, x, 3 + Math.round(Math.abs(x - 12) / 3), 1, 6 - Math.round(Math.abs(x - 12) / 3), Math.floor(x / 4) % 2 ? '#f06090' : '#ffffff');
  R(c, 11, 0, 2, 3, '#f06090');
  R(c, 11, 9, 1, 10, '#9a9892');
  // thùng kem
  R(c, 2, 16, 20, 10, '#9fd3f0'); R(c, 2, 16, 20, 2, '#d8f0ff'); R(c, 2, 24, 20, 2, '#5a8ac8');
  for (const [x, col] of [[5, '#f06090'], [10, '#fff3c4'], [15, '#8a5a2e']] as const) {
    ellipse(c, x + 1, 19, 2, 2, col);
    R(c, x, 21, 3, 2, '#e8a050');
  }
  ellipse(c, 5, 28, 2.5, 2.5, '#3a3a42'); ellipse(c, 19, 28, 2.5, 2.5, '#3a3a42');
  outline(c, 24, 32);
}

function cafeTable(c: Ctx) {
  // dù
  for (let y = 0; y < 7; y++) R(c, 12 - (y + 2) * 1.5, 1 + y, (y + 2) * 3, 1, y % 2 ? '#e8805a' : '#f4ecd8');
  R(c, 1, 8, 22, 2, '#b8603a');
  R(c, 11, 10, 2, 12, '#9a9892');
  // mặt bàn + ly cà phê
  R(c, 4, 19, 16, 3, '#f4f0e8'); R(c, 4, 21, 16, 1, '#c8c0b0');
  R(c, 7, 16, 3, 3, '#ffffff'); R(c, 8, 16, 1, 1, '#6a3a1e');
  R(c, 14, 17, 3, 2, '#f06090');
  R(c, 6, 22, 1, 7, '#5a5f69'); R(c, 17, 22, 1, 7, '#5a5f69');
  // ghế hai bên
  R(c, 0, 23, 4, 2, '#8a5a2e'); R(c, 0, 25, 1, 4, '#5a3a1e'); R(c, 3, 25, 1, 4, '#5a3a1e'); R(c, 0, 18, 1, 5, '#5a3a1e');
  R(c, 20, 23, 4, 2, '#8a5a2e'); R(c, 20, 25, 1, 4, '#5a3a1e'); R(c, 23, 25, 1, 4, '#5a3a1e'); R(c, 23, 18, 1, 5, '#5a3a1e');
  outline(c, 24, 30);
}

export function drawMall(scene: Phaser.Scene) {
  canvas(scene, 'b_wheel', 48, 48, wheelKiosk);
  canvas(scene, 'balloon_cart', 16, 32, balloonCart);
  canvas(scene, 'icecream_cart', 24, 32, icecreamCart);
  canvas(scene, 'cafe_table', 24, 30, cafeTable);
}
