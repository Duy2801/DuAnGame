import { useState } from 'react';
import { FRAME_H, FRAME_W, type AvatarLook, type Dir } from '../art/avatar';
import { rodIconURL, weaponIconURL } from '../art/rodArt';
import { COSMETIC_BY_ID } from '../game/config/shops';
import { kindOf } from '../game/logic/hotbar';
import { AvatarView } from './AvatarView';

type View = Dir | 'left';
const VIEWS: View[] = ['down', 'side', 'up', 'left'];
// vị trí bàn tay phải trong khung logic 24×36 của nhân vật chibi (xem drawArms trong art/avatar.ts)
const HAND: Record<View, [number, number]> = { down: [16.2, 27.1], side: [12.3, 27.1], up: [7.8, 27.1], left: [11.7, 27.1] };
/** cỡ món cầm tay so với icon 32px × scale (≈ tỉ lệ vũ khí/nhân vật ngoài thế giới) */
const ICON = 0.45;

/**
 * Nhân vật chibi trong hành trang / phòng thử đồ: mặc đồ đang mặc, cầm món đang cầm,
 * thú cưng đứng cạnh. Bấm ◀ ▶ để xoay.
 */
export function HeroDoll({ look, held, pet, wings, scale = 5 }: { look: AvatarLook; held?: string | null; pet?: string | null; wings?: string | null; scale?: number }) {
  const [vi, setVi] = useState(0);
  const view = VIEWS[vi];
  const k = kindOf(held ?? null);
  const showHeld = held && (k === 'weapon' || k === 'rod');
  const size = Math.round(32 * scale * ICON);
  const [hx, hy] = HAND[view];
  const mirror = view === 'left' || view === 'up';
  // chuôi của icon nằm ở (4, 28) trên lưới 32 → đặt chuôi vào bàn tay
  const grip = (4 / 32) * size;
  const left = mirror ? hx * scale - (size - grip) : hx * scale - grip;
  const top = hy * scale - (28 / 32) * size;
  const turn = (d: number) => setVi((vi + d + VIEWS.length) % VIEWS.length);

  return (
    <div className="doll">
      <button className="doll-turn l" onClick={() => turn(-1)} aria-label="Xoay trái">
        ◀
      </button>
      <div className="doll-stage" style={{ width: Math.round(FRAME_W * scale), height: Math.round(FRAME_H * scale) }}>
        {wings && <span className={`doll-wings ${view === 'up' ? 'front' : ''}`}>{COSMETIC_BY_ID[wings]?.emoji}</span>}
        {showHeld && (
          <img
            className={`doll-held ${view === 'up' ? 'behind' : ''}`}
            src={k === 'rod' ? rodIconURL(held!) : weaponIconURL(held!)}
            alt=""
            draggable={false}
            style={{ width: size, height: size, left, top, transform: mirror ? 'scaleX(-1)' : undefined }}
          />
        )}
        <AvatarView look={look} scale={scale} dir={view} />
        {pet && <span className="doll-pet">{COSMETIC_BY_ID[pet]?.emoji}</span>}
      </div>
      <button className="doll-turn r" onClick={() => turn(1)} aria-label="Xoay phải">
        ▶
      </button>
    </div>
  );
}
