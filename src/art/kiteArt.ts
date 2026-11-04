import { KITE_BY_ID, type KiteDef } from '../game/config/shops';

// Vẽ diều bằng canvas 2D — dùng chung cho mini-game Thả Diều, sân thử diều và ảnh thẻ trong tiệm.
// Gốc toạ độ (0,0) là tâm thân diều; thân rộng ~±24px, cao từ -22 đến +16, đuôi thả xuống dưới.

type Ctx = CanvasRenderingContext2D;
const INK = '#1a1208';

export interface KitePose {
  /** thời gian (giây) để đuôi / cánh chuyển động */
  t: number;
  /** vận tốc ngang — đuôi bị gió kéo lệch */
  vx?: number;
  /** góc nghiêng thân (radian) */
  tilt?: number;
}

function poly(c: Ctx, pts: [number, number][], fill: string, stroke = true) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) c.stroke();
}

function blob(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0, stroke = true) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) c.stroke();
}

function starPts(n: number, ro: number, ri: number, cy = 0): [number, number][] {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? ri : ro;
    return [Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
  });
}

/** điểm trên đuôi: lắc theo thời gian, lệch ngược hướng bay */
const tailX = (p: KitePose, i: number, amp = 5) => Math.sin(p.t * 6 - i * 0.9) * amp - (p.vx ?? 0) * 0.02 * i;

// ---------------------------------------------------------------- đuôi

function drawTail(c: Ctx, k: KiteDef, p: KitePose, y0: number) {
  const [a, b, d] = k.colors;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (k.tail === 'bows') {
    c.strokeStyle = INK;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, y0);
    for (let i = 1; i <= 8; i++) c.lineTo(tailX(p, i), y0 + i * 7);
    c.stroke();
    for (let i = 2; i <= 8; i += 2) {
      const x = tailX(p, i);
      const y = y0 + i * 7;
      c.lineWidth = 1;
      poly(c, [[x, y], [x - 6, y - 4], [x - 6, y + 4]], i % 4 ? b : a);
      poly(c, [[x, y], [x + 6, y - 4], [x + 6, y + 4]], i % 4 ? b : a);
    }
  } else if (k.tail === 'ribbon' || k.tail === 'sparkle') {
    const cols = k.tail === 'sparkle' ? [a, b, d ?? a] : [b, d ?? a];
    cols.forEach((col, j) => {
      const off = (j - (cols.length - 1) / 2) * 5;
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(off * 0.4, y0);
      for (let i = 1; i <= 9; i++) c.lineTo(off + tailX(p, i + j * 0.7, 6), y0 + i * 6.5);
      c.stroke();
    });
    if (k.tail === 'sparkle') {
      for (let i = 2; i <= 9; i += 2) {
        const x = tailX(p, i, 6) + Math.sin(p.t * 9 + i) * 3;
        const y = y0 + i * 6.5;
        c.globalAlpha = 0.6 + 0.4 * Math.sin(p.t * 8 + i * 2);
        c.lineWidth = 0.8;
        poly(c, starPts(4, 4, 1.4).map(([sx, sy]) => [x + sx, y + sy]), `hsl(${(p.t * 120 + i * 40) % 360} 100% 75%)`, false);
        c.globalAlpha = 1;
      }
    }
  } else if (k.tail === 'flame') {
    // ba lông đuôi lửa bập bùng
    for (let j = -1; j <= 1; j++) {
      const len = 46 - Math.abs(j) * 10 + Math.sin(p.t * 10 + j) * 4;
      const g = c.createLinearGradient(0, y0, 0, y0 + len);
      g.addColorStop(0, b);
      g.addColorStop(0.5, a);
      g.addColorStop(1, 'rgba(232,64,42,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(j * 4 - 3, y0);
      const tx = j * 12 + tailX(p, 6, 6);
      c.quadraticCurveTo(j * 10 + tailX(p, 3, 4) - 5, y0 + len * 0.5, tx, y0 + len);
      c.quadraticCurveTo(j * 10 + tailX(p, 3, 4) + 5, y0 + len * 0.5, j * 4 + 3, y0);
      c.fill();
    }
  }
}

// ---------------------------------------------------------------- thân diều theo hình dáng

function drawBody(c: Ctx, k: KiteDef, p: KitePose) {
  const [a, b, d] = k.colors;
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.lineJoin = 'round';
  switch (k.shape) {
    case 'diamond': {
      poly(c, [[0, -20], [16, 0], [0, 16], [-16, 0]], a);
      c.lineWidth = 0;
      poly(c, [[0, -20], [16, 0], [0, 0]], b, false);
      poly(c, [[0, 16], [-16, 0], [0, 0]], b, false);
      c.strokeStyle = 'rgba(26,18,8,0.6)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -20);
      c.lineTo(0, 16);
      c.moveTo(-16, 0);
      c.lineTo(16, 0);
      c.stroke();
      c.strokeStyle = INK;
      c.lineWidth = 2;
      poly(c, [[0, -20], [16, 0], [0, 16], [-16, 0]], 'transparent');
      break;
    }
    case 'delta': {
      const tri: [number, number][] = [[0, -22], [24, 12], [0, 6], [-24, 12]];
      c.save();
      c.beginPath();
      tri.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.clip();
      const cols = [a, b, d ?? a];
      for (let i = -4; i < 4; i++) {
        c.fillStyle = cols[(i + 12) % cols.length];
        c.fillRect(i * 7, -24, 7, 40);
      }
      c.restore();
      poly(c, tri, 'transparent');
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -22);
      c.lineTo(0, 12);
      c.stroke();
      blob(c, 0, -10, 2.5, 2.5, d ?? b);
      break;
    }
    case 'box': {
      // diều hộp: hai ô vải nối bằng nan tre, mặt bên tối hơn cho có khối
      for (const y of [-20, 2]) {
        poly(c, [[10, y], [16, y - 4], [16, y + 10], [10, y + 14]], shade(a, -0.25));
        poly(c, [[-10, y], [10, y], [10, y + 14], [-10, y + 14]], a);
        c.fillStyle = b;
        c.fillRect(-10, y + 5, 20, 4);
        c.strokeRect(-10, y, 20, 14);
      }
      c.lineWidth = 2.5;
      c.strokeStyle = '#8a5a2e';
      c.beginPath();
      c.moveTo(-10, -6);
      c.lineTo(-10, 2);
      c.moveTo(10, -6);
      c.lineTo(10, 2);
      c.moveTo(16, -10);
      c.lineTo(16, -2);
      c.stroke();
      break;
    }
    case 'star': {
      poly(c, starPts(5, 22, 10, -2), a);
      c.lineWidth = 1;
      poly(c, starPts(5, 12, 5.5, -2), b);
      if (d) {
        for (let i = 0; i < 7; i++) {
          const an = i * 2.4 + p.t * 0.8;
          c.globalAlpha = 0.5 + 0.5 * Math.sin(p.t * 5 + i);
          blob(c, Math.cos(an) * (6 + (i % 3) * 3), -2 + Math.sin(an) * (6 + (i % 3) * 3), 1.2, 1.2, d, 0, false);
        }
        c.globalAlpha = 1;
      }
      break;
    }
    case 'fish': {
      // cá chép: đầu hướng lên trời, đuôi phất phới
      const sw = Math.sin(p.t * 6) * 5;
      poly(c, [[0, 14], [-12 + sw, 30], [-2 + sw * 0.6, 22], [4 + sw, 32], [8 + sw * 0.6, 20]], a);
      blob(c, 0, -2, 11, 18, a);
      c.lineWidth = 1;
      blob(c, 0, 4, 7, 10, b, 0, false);
      c.strokeStyle = shade(a, -0.3);
      for (const y of [-2, 5, 12])
        for (const x of [-4, 4]) {
          c.beginPath();
          c.arc(x, y, 3.5, 0.2, Math.PI - 0.2);
          c.stroke();
        }
      c.strokeStyle = INK;
      blob(c, -5, -13, 2.6, 2.6, '#ffffff');
      blob(c, 5, -13, 2.6, 2.6, '#ffffff');
      blob(c, -5, -13, 1.2, 1.2, d ?? INK, 0, false);
      blob(c, 5, -13, 1.2, 1.2, d ?? INK, 0, false);
      c.lineWidth = 2;
      blob(c, 0, -19.5, 3, 1.6, shade(a, -0.35));
      break;
    }
    case 'butterfly': {
      const f = 0.82 + 0.18 * Math.sin(p.t * 7);
      c.save();
      c.scale(f, 1);
      blob(c, -11, -8, 13, 10, a, 0.5);
      blob(c, 11, -8, 13, 10, a, -0.5);
      blob(c, -8, 8, 9, 7, b, -0.4);
      blob(c, 8, 8, 9, 7, b, 0.4);
      c.lineWidth = 1;
      for (const s of [-1, 1]) {
        blob(c, s * 13, -9, 4.5, 3.5, b, -s * 0.5);
        blob(c, s * 9, 9, 2.5, 2.5, d ?? a);
      }
      c.restore();
      c.lineWidth = 2;
      blob(c, 0, 0, 3, 14, INK, 0, false);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-1, -13);
      c.quadraticCurveTo(-4, -20, -8, -21);
      c.moveTo(1, -13);
      c.quadraticCurveTo(4, -20, 8, -21);
      c.stroke();
      break;
    }
    case 'bird': {
      // chim sải cánh: cánh màu chính, ngực/đầu màu phụ, mỏ / mắt màu nhấn
      const flap = Math.sin(p.t * 4) * 3;
      const owl = k.id === 'kite_owl';
      for (const s of [-1, 1]) {
        poly(c, [[s * 4, -6], [s * 26, -8 + flap], [s * 24, -2 + flap], [s * 20, 2 + flap], [s * 16, 4 + flap * 0.7], [s * 11, 6], [s * 4, 6]], a);
        c.lineWidth = 1;
        poly(c, [[s * 4, -4], [s * 18, -5 + flap * 0.8], [s * 12, 2], [s * 4, 3]], b);
        c.lineWidth = 2;
      }
      poly(c, [[-5, 8], [0, 18], [5, 8]], owl ? a : b);
      blob(c, 0, 0, 7, 11, owl ? b : a);
      blob(c, 0, -13, 7, 7, owl ? a : b);
      c.lineWidth = 1;
      if (owl) {
        blob(c, 0, -12.5, 6, 4.8, b);
        for (const s of [-1, 1]) {
          blob(c, s * 3, -13, 2.6, 2.6, d ?? '#f2c230');
          blob(c, s * 3, -13, 1.1, 1.1, INK, 0, false);
          poly(c, [[s * 3, -19], [s * 7, -23], [s * 6, -17]], a);
        }
        poly(c, [[-1, -11], [1, -11], [0, -8]], '#e8a020');
      } else {
        poly(c, [[-2.5, -15], [2.5, -15], [0, -24]], d ?? '#f2c230');
        blob(c, -3, -13, 1.2, 1.2, INK, 0, false);
        blob(c, 3, -13, 1.2, 1.2, INK, 0, false);
      }
      break;
    }
    case 'dragon': {
      // đầu rồng; thân rồng vẽ thành chuỗi đốt uốn lượn làm đuôi
      for (let i = 12; i >= 1; i--) {
        const x = tailX(p, i * 0.7, 7 * Math.min(1, 0.4 + i / 10));
        const y = 6 + i * 5;
        const r = 7.5 - i * 0.4;
        c.lineWidth = 1.5;
        if (i % 2 === 0) poly(c, [[x - r - 3, y], [x - r + 1, y - 4], [x - r + 1, y + 3]], d ?? b);
        blob(c, x, y, r, r * 0.9, i % 2 ? a : b);
      }
      c.lineWidth = 2;
      for (const s of [-1, 1]) poly(c, [[s * 5, -12], [s * 12, -24], [s * 8, -11]], b);
      blob(c, 0, -3, 12, 11, a);
      blob(c, 0, 4, 7, 5, b);
      c.lineWidth = 1;
      for (const s of [-1, 1]) {
        blob(c, s * 5, -6, 3, 2.6, '#ffffff');
        blob(c, s * 5, -6, 1.3, 1.6, INK, 0, false);
        blob(c, s * 3, 3, 0.9, 0.9, INK, 0, false);
        c.strokeStyle = b;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(s * 7, 4);
        c.quadraticCurveTo(s * 16, 4 + Math.sin(p.t * 5) * 3, s * 20, 10 + Math.sin(p.t * 5 + 1) * 3);
        c.stroke();
        c.strokeStyle = INK;
        c.lineWidth = 1;
      }
      break;
    }
    case 'cloud': {
      c.lineWidth = 2;
      const puffs: [number, number, number][] = [[-12, 2, 9], [12, 2, 9], [-6, -8, 10], [7, -9, 11], [0, 4, 11]];
      for (const [x, y, r] of puffs) blob(c, x, y, r, r, a);
      for (const [x, y, r] of puffs) blob(c, x, y, r - 2, r - 2, a, 0, false);
      c.globalAlpha = 0.6;
      blob(c, 0, 9, 16, 4, b, 0, false);
      c.globalAlpha = 1;
      for (const s of [-1, 1]) blob(c, s * 5, -1, 1.6, 2.2, INK, 0, false);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 2, 3.2, 0.2, Math.PI - 0.2);
      c.stroke();
      c.globalAlpha = 0.7;
      for (const s of [-1, 1]) blob(c, s * 9, 3, 2.5, 1.5, '#ffa0b0', 0, false);
      c.globalAlpha = 1;
      break;
    }
  }
}

/** đáy thân diều — chỗ buộc đuôi */
const TAIL_Y: Record<KiteDef['shape'], number> = { diamond: 14, delta: 8, box: 16, star: 12, fish: 26, butterfly: 12, bird: 16, dragon: 66, cloud: 12 };

/** Vẽ một chiếc diều tại gốc toạ độ hiện tại (đã translate tới tâm diều) */
export function drawKite(c: Ctx, k: KiteDef, p: KitePose) {
  c.save();
  c.rotate(p.tilt ?? 0);
  drawTail(c, k, p, TAIL_Y[k.shape]);
  drawBody(c, k, p);
  c.restore();
}

/** làm sáng / tối một màu #rrggbb (amt từ -1 đến 1) */
function shade(hex: string, amt: number) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = n.map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return `rgb(${m.join(',')})`;
}

const cache = new Map<string, string>();

/** ảnh thẻ diều (dataURL) — diều chưa có thì vẽ thành bóng đen */
export function kiteIconURL(id: string, locked = false) {
  const key = `${id}:${locked}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const k = KITE_BY_ID[id];
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 160;
  const c = cv.getContext('2d')!;
  c.translate(60, 42);
  c.scale(1.5, 1.5);
  drawKite(c, k, { t: 0.4, tilt: -0.12 });
  if (locked) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#6a5a48';
    c.fillRect(0, 0, cv.width, cv.height);
  }
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}
