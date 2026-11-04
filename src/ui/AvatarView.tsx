import { useEffect, useRef } from 'react';
import { FRAME_H, FRAME_W, NPC_LOOKS, drawAvatar, outlineFrame, outlineT, type AvatarLook, type Dir } from '../art/avatar';

/** vùng cắt khuôn mặt (đơn vị logic) cho ảnh đại diện */
const HEAD: [number, number, number, number] = [4, 6, 16, 16];

/**
 * Vẽ nhân vật chibi ghép lớp lên canvas (dùng cho màn tạo nhân vật, phòng thử đồ, HUD).
 * Vẽ vector thẳng ở độ phân giải hiển thị nên luôn sắc nét.
 * walk: tự đi bộ; spin: xoay vòng 4 hướng; head: chỉ cắt phần đầu (ảnh đại diện).
 */
export function AvatarView({
  look, scale = 4, dir = 'down', walk = false, spin = false, head = false, className,
}: { look?: AvatarLook; scale?: number; dir?: Dir | 'left'; walk?: boolean; spin?: boolean; head?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const safeLook = look ?? NPC_LOOKS.npc_armorer;
  const key = JSON.stringify(safeLook);
  const [w, h] = head ? [HEAD[2], HEAD[3]] : [FRAME_W, FRAME_H];
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);

  useEffect(() => {
    const out = ref.current!.getContext('2d')!;
    const tmp = document.createElement('canvas');
    tmp.width = Math.round(FRAME_W * scale);
    tmp.height = Math.round(FRAME_H * scale);
    const c = tmp.getContext('2d')!;
    const order: (Dir | 'left')[] = ['down', 'side', 'up', 'left'];
    let tick = 0;
    const draw = () => {
      const d = spin ? order[Math.floor(tick / 8) % 4] : dir;
      const f = walk ? [1, 0, 2, 0][tick % 4] : 0;
      c.clearRect(0, 0, tmp.width, tmp.height);
      drawAvatar(c, 0, 0, safeLook, d === 'left' ? 'side' : d, f, scale);
      outlineFrame(c, 0, 0, tmp.width, tmp.height, outlineT(scale));
      const [sx, sy] = head ? [HEAD[0] * scale, HEAD[1] * scale] : [0, 0];
      out.imageSmoothingEnabled = true;
      out.clearRect(0, 0, cw, ch);
      out.save();
      if (d === 'left') {
        out.translate(cw, 0);
        out.scale(-1, 1);
      }
      out.drawImage(tmp, sx, sy, cw, ch, 0, 0, cw, ch);
      out.restore();
      tick++;
    };
    draw();
    if (!walk && !spin) return;
    const id = setInterval(draw, 140);
    return () => clearInterval(id);
  }, [key, scale, dir, walk, spin, head, cw, ch]);

  return <canvas ref={ref} width={cw} height={ch} className={`avatar-canvas ${className ?? ''}`} />;
}
