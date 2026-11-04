import { fitsGender } from '../game/config/shops';
import type { GameState } from '../game/types';
import { lookOf, type AvatarLook, type HairStyle } from './avatar';

/** Hình nhân vật người chơi hiện tại: hồ sơ + giáp đang mặc + đồ thời trang */
export function heroLook(g: GameState): AvatarLook {
  const p = g.profile;
  const c = g.cosmetics;
  const fit = (id: string | null) => (fitsGender(id, p.gender) ? id : null);
  const armor = g.player?.equip?.armor === 'cloth' ? null : (g.player?.equip?.armor ?? null);
  return lookOf({
    gender: p.gender,
    skin: p.skin,
    hair: p.hair,
    hairStyle: (p.hairStyle || 'short') as HairStyle,
    eyes: p.eyes,
    cloth: p.cloth,
    armor,
    cosmetics: { hat: fit(c.hat), top: fit(c.top), bottom: fit(c.bottom), shoes: fit(c.shoes), neck: fit(c.neck), ear: fit(c.ear), face: fit(c.face) },
  });
}
