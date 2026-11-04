import { BOSS_GEAR_OF } from '../config/bossGear';
import { EQUIPMENT, EQUIP_BY_ID } from '../config/equipment';
import { zoneLevel } from '../config/zones';
import type { GameState, MonsterDef, Reward } from '../types';
import { addToHotbar } from './hotbar';

// Rương boss: cộng thêm vào phần thưởng thường của killMonster (vàng, kim cương, nguyên liệu)
// - lần đầu hạ boss: chắc chắn rơi trang bị độc quyền; các lần sau 25%
// - 40% rơi thêm 1 món đồ tiệm hợp cấp mà người chơi chưa có (miễn phí)
// - đồ đã có thì đổi ra vàng; 12% "bạo kích vàng" ×3

export const BOSS_GEAR_CHANCE = 0.25;
export const BOSS_SHOP_GEAR_CHANCE = 0.4;
export const BOSS_JACKPOT_CHANCE = 0.12;

export interface BossLoot {
  /** trang bị mới nhận (id) */
  gear: string[];
  /** món đã có, đổi ra vàng */
  dupes: string[];
  first: boolean;
  jackpot: boolean;
}

const potionOf = (zone: number) => (zone <= 4 ? 'potion_s' : zone <= 9 ? 'potion_m' : zone <= 15 ? 'potion_l' : 'potion_xl');
const oreOf = (zone: number) => (zone <= 5 ? 'ore_copper' : zone <= 10 ? 'ore_iron' : zone <= 15 ? 'ore_silver' : 'ore_gold');
/** giá quy đổi khi trùng đồ boss */
const dupeGold = (zone: number) => Math.round(400 * 1.28 ** zone);

function giveGear(g: GameState, id: string, loot: BossLoot, reward: Reward, zone: number) {
  const e = EQUIP_BY_ID[id];
  if (g.player.owned.includes(id)) {
    loot.dupes.push(id);
    reward.gold = (reward.gold ?? 0) + (e.price ? Math.round(e.price * 0.3) : dupeGold(zone));
    return;
  }
  g.player.owned.push(id);
  loot.gear.push(id);
  // vũ khí vào thanh 10 ô nếu còn chỗ trống; giáp/phụ kiện tự mặc nếu ô đang trống
  if (e.slot === 'weapon') addToHotbar(g, id, false);
  else if (!g.player.equip[e.slot]) g.player.equip[e.slot] = id;
}

/** Thêm rương boss vào reward (chưa cộng vào state — killMonster gọi giveReward sau) */
export function rollBossLoot(g: GameState, m: MonsterDef, reward: Reward): BossLoot {
  const kills = g.bossKills[m.id] ?? 0;
  g.bossKills[m.id] = kills + 1;
  const loot: BossLoot = { gear: [], dupes: [], first: kills === 0, jackpot: false };
  const items = (reward.items ??= {});
  const add = (id: string, n: number) => (items[id] = (items[id] ?? 0) + n);

  const sig = BOSS_GEAR_OF[m.id];
  if (sig && (loot.first || Math.random() < BOSS_GEAR_CHANCE)) giveGear(g, sig.id, loot, reward, m.zone);

  if (Math.random() < BOSS_SHOP_GEAR_CHANCE) {
    const pool = EQUIPMENT.filter((e) => e.price > 0 && e.levelReq <= zoneLevel(m.zone) + 4 && !g.player.owned.includes(e.id));
    if (pool.length) giveGear(g, pool[Math.floor(Math.random() * pool.length)].id, loot, reward, m.zone);
  }

  add(potionOf(m.zone), 2 + Math.floor(Math.random() * 3));
  add(oreOf(m.zone), 3 + Math.floor(Math.random() * 4));
  if (m.zone >= 12 && Math.random() < 0.3) add(m.zone >= 17 ? 'gem_diamond' : 'gem_ruby', 1);

  if (Math.random() < BOSS_JACKPOT_CHANCE) {
    loot.jackpot = true;
    reward.gold = (reward.gold ?? 0) * 3;
  }
  // hạ lần đầu: thưởng gấp đôi kim cương
  if (loot.first && reward.gems) reward.gems *= 2;
  return loot;
}
