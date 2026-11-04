import type Phaser from 'phaser';
import { R, canvas, ellipse, outline, type Ctx } from './textures';

// Hồ Câu & Sông Quê: thuyền chèo, thuyền buồm, thuyền neo, vịt, lá súng, hoa sen, cá nhảy, chòi lá, giàn phơi lưới

/** thân thuyền gỗ, mũi nhọn quay sang phải */
function hull(c: Ctx, x0: number, y0: number, w: number, h: number, wood: string, dark: string) {
  for (let i = 0; i < h; i++) {
    const l = x0 + Math.round(i * 0.6);
    const r = x0 + w - Math.round(i * 1.6);
    R(c, l, y0 + i, r - l, 1, i === 0 ? '#c8945a' : i === h - 1 ? dark : wood);
  }
  R(c, x0 + 2, y0 + 2, w - 8, 1, dark);
}

function rowBoat(c: Ctx) {
  // ông câu ngồi giữa thuyền, đội nón lá, cần câu chĩa ra mũi
  R(c, 10, 5, 5, 5, '#3a7ab8');
  R(c, 11, 2, 4, 3, '#f2c49b');
  R(c, 9, 1, 8, 1, '#e8c860'); R(c, 11, 0, 4, 1, '#e8c860');
  R(c, 14, 6, 6, 1, '#f2c49b');
  for (let i = 0; i < 9; i++) R(c, 19 + i, 6 - Math.floor(i / 2), 1, 1, '#8a5a2e');
  hull(c, 1, 10, 26, 5, '#9a6b3c', '#6a4520');
  R(c, 3, 9, 2, 6, '#5a3a1e');
  outline(c, 28, 16);
}

function sailBoat(c: Ctx) {
  R(c, 13, 3, 1, 28, '#6a4520');
  R(c, 14, 3, 5, 3, '#e8402a');
  for (let y = 7; y < 28; y++) {
    const w = Math.round((y - 6) * 0.55);
    R(c, 14, y, w, 1, y % 7 === 0 ? '#e8805a' : '#f4f0e8');
  }
  for (let y = 12; y < 28; y++) R(c, 12 - Math.round((y - 12) * 0.45), y, Math.round((y - 12) * 0.45), 1, '#d8e8f4');
  hull(c, 1, 29, 27, 6, '#3d6fa0', '#24466a');
  R(c, 3, 30, 20, 1, '#f4f0e8');
  outline(c, 28, 36);
}

function mooredBoat(c: Ctx) {
  hull(c, 1, 3, 24, 6, '#a8784a', '#6a4520');
  R(c, 8, 4, 2, 4, '#c8945a'); R(c, 15, 4, 2, 4, '#c8945a');
  R(c, 0, 1, 3, 1, '#e8d8b0'); R(c, 0, 2, 1, 3, '#e8d8b0');
  outline(c, 26, 10);
}

/** Thuyền câu cá chuyên dụng của người chơi khi chèo ra hồ/biển */
function playerBoat(c: Ctx) {
  // Thân thuyền gỗ sồi thon gọn lướt sóng
  hull(c, 2, 8, 28, 6, '#9a602a', '#542d0c');
  // Lòng thuyền & băng ghế gỗ
  R(c, 4, 9, 24, 2, '#784218');
  R(c, 8, 9, 3, 4, '#c89255');
  R(c, 21, 9, 3, 4, '#c89255');
  // Thùng đồ câu & hộp mồi ở đuôi
  R(c, 4, 8, 4, 3, '#1e40af');
  R(c, 5, 9, 2, 1, '#f59e0b');
  // Đèn bão đồng treo ở mũi thuyền
  R(c, 28, 6, 2, 3, '#eab308');
  R(c, 28, 5, 2, 1, '#78350f');
  R(c, 29, 7, 1, 1, '#fef08a');
  // Mái chèo gác 2 bên mạn thuyền
  R(c, 12, 5, 1, 9, '#d97706');
  R(c, 11, 4, 3, 2, '#b45309');
  R(c, 17, 5, 1, 9, '#d97706');
  R(c, 16, 4, 3, 2, '#b45309');
  outline(c, 32, 16);
}

/** Tàu Buồm Viễn Dương Cổ Điển Đại Hải Trình (Galleon 3 cột buồm) */
function shipGalleon(c: Ctx) {
  // Thân tàu gỗ sồi đồ sộ uốn lượn (dài 58, cao 18)
  for (let y = 38; y < 56; y++) {
    const inset = Math.round((56 - y) * 0.45);
    const bowInset = Math.round((y - 38) * 0.6);
    const left = 3 + inset;
    const right = 58 - bowInset;
    if (right > left) {
      const color = y === 38 ? '#c28747' : y === 43 ? '#f59e0b' : y >= 53 ? '#2a1608' : (y % 2 ? '#6c3b17' : '#854b20');
      R(c, left, y, right - left, 1, color);
    }
  }

  // Cabin chỉ huy & boong đuôi tàu cao vút (Sterncastle x: 4..18, y: 26..38)
  for (let y = 26; y < 38; y++) {
    const left = 4 + Math.round((y - 26) * 0.3);
    R(c, left, y, 16 - (left - 4), 1, y % 3 === 0 ? '#4a250c' : '#783d16');
  }
  // Lan can boong & cửa sổ kính màu cabin có ánh đèn
  R(c, 3, 25, 16, 2, '#c28747');
  R(c, 6, 29, 3, 3, '#38bdf8'); R(c, 7, 30, 1, 1, '#fef08a');
  R(c, 11, 29, 3, 3, '#38bdf8'); R(c, 12, 30, 1, 1, '#fef08a');
  R(c, 16, 29, 3, 3, '#38bdf8'); R(c, 17, 30, 1, 1, '#fef08a');
  // Đèn lồng đuôi thuyền tỏa sáng
  R(c, 2, 24, 2, 4, '#f59e0b');
  R(c, 2, 25, 2, 2, '#fef08a');

  // Lỗ châu mai & nòng pháo mạn thuyền
  for (const px of [22, 30, 38, 46]) {
    R(c, px, 45, 3, 3, '#1a0d05');
    R(c, px + 1, 46, 1, 1, '#f59e0b');
  }

  // Mũi tàu (Bowsprit vươn dài ra phía trước)
  R(c, 56, 36, 7, 2, '#6c3b17');
  R(c, 60, 35, 3, 1, '#c28747');
  // Mỏ neo sắt treo dây xích
  R(c, 52, 44, 1, 7, '#475569');
  R(c, 50, 50, 5, 2, '#334155');

  // Cột buồm chính (Main Mast x=34, cao từ y=4 đến y=38)
  R(c, 34, 4, 2, 35, '#4a250c');
  // Cột buồm mũi (Foremast x=47, y=10..38)
  R(c, 47, 10, 2, 29, '#4a250c');
  // Cột buồm đuôi (Mizzenmast x=18, y=14..28)
  R(c, 18, 14, 2, 24, '#4a250c');

  // Xà ngang đỡ buồm
  R(c, 25, 12, 20, 2, '#5e3012');
  R(c, 23, 24, 24, 2, '#5e3012');
  R(c, 40, 18, 16, 2, '#5e3012');
  R(c, 12, 19, 14, 2, '#5e3012');

  // Cánh buồm trắng no gió với dải sọc đỏ Hoàng Gia
  // Buồm chính trên (Main Topsail)
  for (let y = 14; y < 23; y++) {
    const w = 18 - Math.abs(y - 18);
    R(c, 26, y, w, 1, y >= 17 && y <= 19 ? '#dc2626' : '#f8fafc');
  }
  // Buồm chính dưới (Main Mainsail)
  for (let y = 26; y < 36; y++) {
    const w = 22 - Math.abs(y - 30);
    R(c, 24, y, w, 1, y >= 29 && y <= 32 ? '#dc2626' : '#f8fafc');
  }
  // Buồm mũi (Foresail)
  for (let y = 20; y < 33; y++) {
    const w = 15 - Math.abs(y - 26);
    R(c, 41, y, w, 1, '#f1f5f9');
  }
  // Buồm tam giác phụ ở mũi (Jib)
  for (let y = 25; y < 36; y++) {
    const w = Math.round((36 - y) * 0.9);
    R(c, 52, y, w, 1, '#e2e8f0');
  }

  // Dây chão chăng buồm (Rigging)
  for (let i = 0; i < 6; i++) {
    R(c, 28 + i * 2, 14 + i * 4, 1, 1, '#94a3b8');
    R(c, 41 - i * 2, 14 + i * 4, 1, 1, '#94a3b8');
  }

  // Chòi quan sát (Crow's Nest) trên ngọn cột chính
  R(c, 32, 9, 6, 3, '#c28747');
  // Cờ hiệu đuôi én bay phấp phới trên đỉnh cột
  R(c, 36, 2, 8, 3, '#e11d48');
  R(c, 40, 3, 5, 2, '#fbbf24');
  R(c, 49, 8, 6, 2, '#3b82f6');

  // Bọt sóng trắng ven lườn thuyền
  for (let x = 6; x < 54; x += 4) {
    R(c, x, 55, 3, 1, 'rgba(255,255,255,0.7)');
  }
  outline(c, 64, 60);
}

/** Thuyền Buôn Gỗ Cổ Kính Đông Hải (Oriental Trading Junk) */
function shipJunk(c: Ctx) {
  // Thân thuyền rồng dáng cong vút truyền thống (y: 32..48)
  for (let y = 32; y < 48; y++) {
    const left = 3 + Math.round((48 - y) * 0.5);
    const right = 53 - Math.round((y - 32) * 0.6);
    if (right > left) {
      const color = y === 32 ? '#d97706' : y >= 45 ? '#381a08' : (y % 2 ? '#7c3a0d' : '#9a4812');
      R(c, left, y, right - left, 1, color);
    }
  }

  // Mũi rồng vểnh cao về phía trước & đầu rồng chạm khắc
  R(c, 50, 27, 4, 6, '#b45309');
  R(c, 52, 25, 3, 3, '#f59e0b');
  R(c, 53, 26, 1, 1, '#ef4444');

  // Gian buồng lái mái ngói gỗ cổ ở đuôi thuyền (y: 22..33, x: 5..18)
  for (let y = 22; y < 32; y++) {
    R(c, 6, y, 12, 1, y % 2 ? '#592c0d' : '#854215');
  }
  // Mái cong ngói lưu ly đỏ gạch
  R(c, 4, 21, 16, 2, '#b91c1c');
  R(c, 3, 20, 3, 1, '#dc2626'); R(c, 18, 20, 3, 1, '#dc2626');
  // Lồng đèn đỏ treo trước mái
  R(c, 19, 23, 3, 4, '#ef4444');
  R(c, 20, 24, 1, 2, '#fef08a');

  // Thùng hàng, bao tải hương liệu trên boong
  R(c, 22, 31, 4, 4, '#78350f');
  R(c, 27, 30, 4, 5, '#a16207');
  R(c, 33, 31, 3, 4, '#78350f');

  // 2 Cột buồm gỗ kiên cố
  R(c, 25, 4, 2, 30, '#592c0d');
  R(c, 40, 10, 2, 24, '#592c0d');

  // Cánh buồm nan tre xòe hình quạt (Battened Sails màu cam gạch / nâu đất)
  // Cột buồm lớn chính (Main Junk Sail)
  for (let y = 6; y < 29; y++) {
    const w = 16 - Math.abs(y - 17) * 0.45;
    const isRib = y % 5 === 0;
    R(c, 16, y, w, 1, isRib ? '#fef08a' : '#c2410c');
  }
  // Cột buồm trước (Fore Junk Sail)
  for (let y = 12; y < 28; y++) {
    const w = 12 - Math.abs(y - 20) * 0.45;
    const isRib = y % 4 === 0;
    R(c, 34, y, w, 1, isRib ? '#fef08a' : '#ea580c');
  }

  // Cờ đuôi phụng bay trên đỉnh
  R(c, 27, 2, 7, 3, '#f59e0b');
  R(c, 42, 8, 5, 2, '#ef4444');

  outline(c, 56, 50);
}

/** Tàu Thám Hiểm Sắt & Gỗ Cực Địa (Polar Steamer / Icebreaker) */
function shipSteamer(c: Ctx) {
  // Thân tàu phá băng bọc thép xanh đen & dải trắng Bắc Cực (y: 28..44)
  for (let y = 28; y < 44; y++) {
    const left = 3 + Math.round((44 - y) * 0.45);
    const right = 55 - Math.round((y - 28) * 0.5);
    if (right > left) {
      const color = y === 33 ? '#f8fafc' : y >= 40 ? '#0f172a' : (y % 2 ? '#1e293b' : '#334155');
      R(c, left, y, right - left, 1, color);
    }
  }

  // Boong gỗ tàu chịu rét
  R(c, 6, 27, 44, 2, '#92400e');

  // Phòng điều khiển / Cabin chỉ huy bọc thép trắng (x: 18..34, y: 16..27)
  for (let y = 16; y < 27; y++) {
    R(c, 18, y, 16, 1, y >= 25 ? '#334155' : '#e2e8f0');
  }
  // Các ô cửa sổ đài chỉ huy (kính xanh biển phản chiếu)
  for (const wx of [20, 24, 28]) {
    R(c, wx, 19, 3, 3, '#0284c7');
    R(c, wx + 1, 20, 1, 1, '#bae6fd');
  }

  // Ống khói tàu thủy hơi nước (Steam Funnel đỏ rực với vành đen)
  R(c, 12, 10, 5, 17, '#b91c1c');
  R(c, 11, 9, 7, 2, '#0f172a');
  // Làn khói trắng bốc lên từ ống khói
  R(c, 13, 6, 4, 3, 'rgba(255,255,255,0.7)');
  R(c, 15, 3, 5, 3, 'rgba(255,255,255,0.5)');
  R(c, 18, 1, 6, 2, 'rgba(255,255,255,0.3)');

  // Cột đèn pha thám hiểm ở mũi (Searchlight)
  R(c, 42, 14, 2, 13, '#475569');
  R(c, 41, 13, 4, 3, '#f59e0b');
  R(c, 43, 14, 2, 2, '#fef08a');

  // Xuồng cứu sinh treo bên hông
  R(c, 21, 23, 10, 3, '#f8fafc');
  R(c, 23, 24, 6, 1, '#0284c7');

  outline(c, 58, 46);
}

function duck(c: Ctx) {
  ellipse(c, 5, 6, 4.5, 2.6, '#f4f0e8');
  R(c, 1, 4, 2, 1, '#f4f0e8');
  ellipse(c, 8.5, 3, 2, 2, '#3a8a4a');
  R(c, 10, 3, 2, 1, '#f2a020');
  R(c, 9, 2, 1, 1, '#1a1208');
  R(c, 3, 6, 4, 1, '#c8c0b0');
  outline(c, 12, 10);
}

function duckling(c: Ctx) {
  ellipse(c, 3, 4, 2.6, 1.6, '#f6d34a');
  ellipse(c, 5, 2, 1.4, 1.4, '#f6d34a');
  R(c, 6, 2, 1, 1, '#f2a020');
  outline(c, 8, 7);
}

function lilyPad(c: Ctx, flower: boolean) {
  ellipse(c, 8, 9, 6.5, 3.5, '#3f9a3f');
  ellipse(c, 8, 9, 4.5, 2.2, '#5fb84f');
  for (let i = 0; i < 4; i++) R(c, 8 + i, 9 - Math.floor(i / 2), 1, 1, 'rgba(0,0,0,0)'), c.clearRect(8 + i, 9 - Math.floor(i / 2) - 1, 1, 2);
  if (flower) {
    for (const [x, y] of [[5, 5], [10, 5], [7, 3], [6, 6], [9, 6]]) R(c, x, y, 2, 2, '#f48ab0');
    R(c, 7, 5, 2, 2, '#ffe680');
    R(c, 7, 2, 2, 2, '#ffc0d8');
  }
  outline(c, 16, 14, '#1f4a22');
}

function jumpFish(c: Ctx) {
  ellipse(c, 4, 3, 3.5, 1.8, '#f08a40');
  R(c, 7, 1, 2, 4, '#f08a40'); R(c, 8, 0, 1, 6, '#e8702a');
  R(c, 2, 2, 1, 1, '#1a1208');
  R(c, 3, 4, 3, 1, '#f8d0a0');
  outline(c, 10, 6);
}

function pavilion(c: Ctx) {
  // chòi lá trên đảo: sàn gỗ, 4 cột, mái lá nhọn
  R(c, 3, 30, 26, 4, '#8a5a2e'); R(c, 3, 30, 26, 1, '#a8784a');
  for (const x of [5, 13, 18, 26]) R(c, x, 15, 2, 15, '#6a4520');
  for (let y = 2; y < 17; y++) {
    const w = Math.round(2 + (y - 2) * 1.9);
    R(c, 16 - w / 2, y, w, 1, y % 3 ? '#c8a050' : '#a8803a');
  }
  R(c, 15, 0, 2, 3, '#a8803a');
  R(c, 10, 22, 12, 2, '#a8784a');
  R(c, 14, 26, 4, 4, '#e8402a');
  outline(c, 32, 36);
}

function netRack(c: Ctx) {
  R(c, 2, 2, 2, 22, '#6a4520'); R(c, 20, 2, 2, 22, '#6a4520');
  R(c, 1, 2, 22, 2, '#8a5a2e');
  for (let y = 5; y < 18; y += 3) R(c, 4, y, 16, 1, '#c8c0a8');
  for (let x = 5; x < 20; x += 3) R(c, x, 4, 1, 14 + (x % 2), '#c8c0a8');
  for (const x of [6, 12, 18]) R(c, x, 18, 2, 2, '#e8402a');
  outline(c, 24, 24);
}

/** Cầu Đá Vòm Cổ Kính Bắc-Nam (3 ô ngang × 6 ô dọc = 48×96px) */
function bridgeStoneV(c: Ctx) {
  const W = 48;
  const H = 96;
  // 1. Nền mặt cầu đá xanh cẩm thạch & hiệu ứng vòm cong ở hai bên thành cầu
  for (let y = 0; y < H; y++) {
    const t = Math.sin((y / H) * Math.PI); // 0 ở 2 đầu, 1 ở đỉnh vòm giữa cầu
    const archInset = Math.round((1 - t) * 2);
    const left = 2 + archInset;
    const right = W - 2 - archInset;

    // Thành đá vòm bên ngoài
    R(c, left - 2, y, 3, 1, '#475569');
    R(c, right - 1, y, 3, 1, '#475569');

    // Mặt cầu đá lát
    const isCenter = y >= 24 && y < 72;
    const baseCol = isCenter ? '#cbd5e1' : '#94a3b8';
    R(c, left + 3, y, right - left - 6, 1, baseCol);

    // Đường viền chỉ đá dọc hai bên lối đi
    R(c, left + 4, y, 2, 1, '#e2e8f0');
    R(c, right - 6, y, 2, 1, '#e2e8f0');
  }

  // 2. Bậc thềm đá vòm hai đầu cầu (tạo cảm giác cầu vồng nhô cao ở giữa)
  for (const sy of [5, 11, 17, 23, 72, 78, 84, 90]) {
    R(c, 8, sy, W - 16, 2, '#64748b');
    R(c, 8, sy + 2, W - 16, 1, '#f1f5f9');
  }

  // 3. Vân gạch đá cổ & hoa văn Trống Đồng / Hoa Sen giữa đỉnh vòm (y = 48)
  for (let y = 26; y < 70; y += 8) {
    R(c, 9, y, W - 18, 1, '#94a3b8');
    const off = (y / 8) % 2 === 0 ? 16 : 24;
    R(c, off, y, 1, 8, '#94a3b8');
  }
  ellipse(c, 24, 48, 9, 9, '#94a3b8');
  ellipse(c, 24, 48, 7, 7, '#e2e8f0');
  ellipse(c, 24, 48, 4, 4, '#f59e0b');
  ellipse(c, 24, 48, 2, 2, '#fef08a');

  // 4. Lan can đá chạm khắc hai bên thành cầu
  for (let y = 2; y < H - 2; y++) {
    const t = Math.sin((y / H) * Math.PI);
    const archInset = Math.round((1 - t) * 2);
    const lx = 3 + archInset;
    const rx = W - 7 - archInset;
    R(c, lx, y, 4, 1, '#94a3b8');
    R(c, lx + 1, y, 2, 1, '#e2e8f0');
    R(c, rx, y, 4, 1, '#94a3b8');
    R(c, rx + 1, y, 2, 1, '#e2e8f0');
  }

  // 5. Trụ đá chạm búp sen vàng ở 2 đầu cầu và giữa đỉnh cầu
  for (const py of [2, 22, 45, 70, 90]) {
    const t = Math.sin((py / H) * Math.PI);
    const archInset = Math.round((1 - t) * 2);
    for (const px of [2 + archInset, W - 8 - archInset]) {
      R(c, px, py, 6, 6, '#64748b');
      R(c, px + 1, py + 1, 4, 4, '#f8fafc');
      // Đỉnh trụ đèn lồng / búp sen vàng
      R(c, px + 1, py, 4, 2, '#f59e0b');
      R(c, px + 2, py, 2, 1, '#fef08a');
    }
  }
  outline(c, W, H, '#1e293b');
}

/** Cầu Đá Vòm Cổ Kính Đông-Tây (7 ô ngang × 3 ô dọc = 112×48px) với vòm cuốn bán nguyệt dưới gầm cầu */
function bridgeStoneH(c: Ctx) {
  const W = 112;
  const H = 48;

  // 1. Gầm cầu đá vòm bán nguyệt & bóng nước dưới vòm
  for (let x = 2; x < W - 2; x++) {
    const norm = (x - W / 2) / (W / 2); // -1 .. 1
    const archCurve = Math.round(Math.sin((x / W) * Math.PI) * 7); // Đỉnh vòm nhô cao 7px ở giữa
    const topY = 9 - archCurve;
    const botY = 39 - Math.round(archCurve * 0.65);

    // Vòm cuốn dưới gầm cầu (tạo lỗ vòm bán nguyệt cho nước chảy qua)
    const underArch = Math.max(0, Math.round((1 - norm * norm * 1.4) * 9));
    const archBottom = 45 - underArch;

    // Đổ bóng gầm vòm đá
    if (archBottom > botY) {
      R(c, x, botY, 1, archBottom - botY, '#334155');
      // Viền đá cuốn vòm bán nguyệt
      R(c, x, archBottom - 2, 1, 2, '#64748b');
      R(c, x, archBottom - 3, 1, 1, '#cbd5e1');
    }

    // Mặt cầu đá xanh & cẩm thạch sáng
    const isMid = x >= 32 && x < 80;
    R(c, x, topY + 4, 1, botY - topY - 6, isMid ? '#cbd5e1' : '#94a3b8');
    R(c, x, topY + 5, 1, 2, '#e2e8f0');
    R(c, x, botY - 4, 1, 2, '#e2e8f0');

    // Lan can đá phía Bắc (trên) & phía Nam (dưới) uốn cong theo vòm
    R(c, x, topY, 1, 4, '#64748b');
    R(c, x, topY + 1, 1, 2, '#f1f5f9');

    R(c, x, botY - 2, 1, 4, '#475569');
    R(c, x, botY - 2, 1, 2, '#e2e8f0');
  }

  // 2. Bậc đá vòm hai bên đầu cầu (Đông - Tây)
  for (const sx of [6, 13, 20, 27, 84, 91, 98, 105]) {
    const archCurve = Math.round(Math.sin((sx / W) * Math.PI) * 7);
    const topY = 9 - archCurve;
    const botY = 39 - Math.round(archCurve * 0.65);
    R(c, sx, topY + 5, 2, botY - topY - 8, '#64748b');
    R(c, sx + 2, topY + 5, 1, botY - topY - 8, '#f8fafc');
  }

  // 3. Hoa văn Trống Đồng / Ngọc Liên giữa đỉnh vòm cầu (x = 56)
  ellipse(c, 56, 20, 8, 6, '#94a3b8');
  ellipse(c, 56, 20, 6, 4, '#f8fafc');
  ellipse(c, 56, 20, 3, 2, '#f59e0b');

  // 4. Các trụ đá chạm búp sen dọc hai lan can vòm cầu
  for (const px of [2, 24, 53, 82, 104]) {
    const archCurve = Math.round(Math.sin(((px + 3) / W) * Math.PI) * 7);
    const topY = 7 - archCurve;
    const botY = 36 - Math.round(archCurve * 0.65);
    for (const py of [topY, botY]) {
      R(c, px, py, 6, 6, '#475569');
      R(c, px + 1, py + 1, 4, 4, '#f8fafc');
      R(c, px + 1, py, 4, 2, '#f59e0b');
      R(c, px + 2, py, 2, 1, '#fef08a');
    }
  }
  outline(c, W, H, '#1e293b');
}

export function drawLake(scene: Phaser.Scene) {
  canvas(scene, 'boat_row', 28, 16, rowBoat);
  canvas(scene, 'boat_sail', 28, 36, sailBoat);
  canvas(scene, 'boat_moored', 26, 10, mooredBoat);
  canvas(scene, 'boat_player', 32, 16, playerBoat);
  canvas(scene, 'ship_galleon', 64, 60, shipGalleon);
  canvas(scene, 'ship_junk', 56, 50, shipJunk);
  canvas(scene, 'ship_steamer', 58, 46, shipSteamer);
  canvas(scene, 'duck', 12, 10, duck);
  canvas(scene, 'duckling', 8, 7, duckling);
  canvas(scene, 'lilypad', 16, 14, (c) => lilyPad(c, false));
  canvas(scene, 'lotus', 16, 14, (c) => lilyPad(c, true));
  canvas(scene, 'jumpfish', 10, 6, jumpFish);
  canvas(scene, 'pavilion', 32, 36, pavilion);
  canvas(scene, 'net_rack', 24, 24, netRack);
  canvas(scene, 'bridge_stone_v', 48, 96, bridgeStoneV);
  canvas(scene, 'bridge_stone_h', 112, 48, bridgeStoneH);
}
