import { fitsGender } from '../config/shops';
import { WORN_SLOTS } from './shop';
import { applyFoodBuff, buffValue, itemBuffs } from './buffs';
import { DEATH_GOLD_LOSS, DEATH_GOLD_LOSS_CAP, GEAR, HEAL_ITEMS, MONSTERS, NIGHT_REWARD } from '../config/combat';
import { ALCHEMY_RECIPES, EQUIPMENT, EQUIP_BY_ID, POTION_BY_ID, SHOP_POTIONS, WEAPON_BOXES, WEAPON_DUP_GOLD, isRareWeapon } from '../config/equipment';
import type { RodRarity } from '../config/shops';
import { ITEMS } from '../config/farm';
import { addMineEnergy, energyNow, maxEnergy } from './mine';
import { bountyTrack } from './bounty';
import { rollBossLoot, type BossLoot } from './boss';
import { addToHotbar } from './hotbar';
import { applyItemDuration, cosmeticBonus, durationLabel, isPermanent, rollItemDuration, type DurationRoll, type DurationStatus } from './shop';
import type { EquipDef, GameState, GearSlot, Reward } from '../types';
import { fail, fmt, randInt } from '../utils';
import { addItem, giveReward, itemCount, removeItem, spendGems, spendGold, track } from './core';
import { houseCombatStats, houseHp, houseXpBonus } from './life';
import { storyTrack } from './story';

export function equipped(g: GameState): EquipDef[] {
  return Object.values(g.player.equip)
    .filter((id): id is string => !!id && !!EQUIP_BY_ID[id])
    .map((id) => EQUIP_BY_ID[id]);
}

export function playerStats(g: GameState) {
  const p = g.player;
  const eq = equipped(g);
  const sum = (k: 'atk' | 'def' | 'hp' | 'speed' | 'crit' | 'regen' | 'light') => eq.reduce((s, e) => s + (e[k] ?? 0), 0);
  const weapon = p.equip.weapon ? EQUIP_BY_ID[p.equip.weapon] : null;
  const cos = cosmeticBonus(g);
  const hStat = houseCombatStats(g);
  return {
    maxHp: 60 + 14 * (p.level - 1) + 20 * p.gear.armor + sum('hp') + houseHp(g),
    atk: Math.round((8 + 4 * (p.level - 1) + 6 * p.gear.sword + sum('atk') + hStat.atk) * (1 + buffValue(g, 'atk'))),
    def: Math.round((2 * p.gear.armor + sum('def') + cos.def + hStat.def) * (1 + buffValue(g, 'def'))),
    speed: 1 + sum('speed') + cos.speed + buffValue(g, 'speed'),
    crit: 0.1 + sum('crit'),
    regen: sum('regen'),
    light: 46 + sum('light'),
    // tay không: đấm nhanh, tầm ngắn
    cooldown: weapon?.cooldown ?? 380,
    range: weapon?.range ?? 10,
    color: weapon?.color ?? 0xffe0c0,
  };
}

export const xpToNext = (level: number) => Math.round(20 * level ** 1.35);

/** Cộng XP, trả về số cấp vừa lên */
export function gainXp(g: GameState, xp: number): number {
  if (typeof xp !== 'number' || isNaN(xp) || xp <= 0) return 0;
  const p = g.player;
  if (p.level >= 100) return 0;
  const safeXp = Math.min(Math.floor(xp), 500_000);
  p.xp += safeXp;
  let ups = 0;
  while (p.xp >= xpToNext(p.level) && p.level < 100) {
    p.xp -= xpToNext(p.level);
    p.level++;
    ups++;
  }
  if (p.level >= 100) {
    p.level = 100;
    p.xp = 0;
  }
  if (ups) p.hp = playerStats(g).maxHp;
  return ups;
}

export interface KillResult {
  reward: Reward;
  xp: number;
  levelUps: number;
  /** rương boss (trang bị, bạo kích vàng...) — null với quái thường */
  loot: BossLoot | null;
}

export function killMonster(g: GameState, monsterId: string, now: number, night: boolean): KillResult {
  const m = MONSTERS[monsterId];
  const cos = cosmeticBonus(g);
  const goldMult = (night ? NIGHT_REWARD : 1) * (now < g.kiteBuffUntil ? g.kiteBuffMult : 1) * (1 + cos.gold + buffValue(g, 'gold', now));
  const reward: Reward = { gold: Math.round(randInt(m.gold[0], m.gold[1]) * goldMult), items: {} };
  for (const d of m.drops) if (Math.random() < d.chance * (night ? 1.2 : 1)) reward.items![d.item] = (reward.items![d.item] ?? 0) + d.qty;
  if (m.gems) reward.gems = m.gems;
  const loot = m.boss ? rollBossLoot(g, m, reward) : null;
  giveReward(g, reward);
  g.stats.kills++;
  g.weekStats.kills++;
  track(g, 'kill');
  storyTrack(g, 'kill', monsterId);
  bountyTrack(g, monsterId);
  const xp = Math.round(m.xp * (night ? NIGHT_REWARD : 1) * (1 + houseXpBonus(g) + cos.xp + buffValue(g, 'xp', now)));
  return { reward, xp, levelUps: gainXp(g, xp), loot };
}

/** Ghi nhận vùng xa nhất / mở khóa đá dịch chuyển */
export function reachZone(g: GameState, zone: number) {
  if (zone > g.maxZone) g.maxZone = zone;
}

export function unlockWaypoint(g: GameState, id: string): string | void {
  if (g.waypoints.includes(id)) return;
  g.waypoints.push(id);
  return '🔮 Đã kích hoạt đá dịch chuyển — mở Bản đồ 🗺️ để dịch chuyển nhanh';
}

/** Tạo nhân vật lúc vào game */
export function createProfile(g: GameState, p: Omit<GameState['profile'], 'created'>): string {
  const n = p.name.trim().replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 16) fail('Tên nhân vật dài 2–16 ký tự');
  g.profile = { ...p, name: n, created: true };
  // Khởi tạo nhân vật mới với trang phục tự chọn, không ép giáp cũ
  if (g.player.equip.armor === 'cloth') g.player.equip.armor = null;
  g.player.owned = g.player.owned.filter((id) => id !== 'cloth');
  // đổi giới tính → tháo những món chỉ dành cho giới kia (vẫn giữ trong tủ đồ)
  for (const k of WORN_SLOTS) if (g.cosmetics[k] && !fitsGender(g.cosmetics[k], p.gender)) g.cosmetics[k] = null;
  return `🎉 Chào mừng ${n} tới Thị Trấn Khởi Nguyên!`;
}

export function playerDie(g: GameState): string {
  const lost = Math.min(DEATH_GOLD_LOSS_CAP, Math.floor(g.gold * DEATH_GOLD_LOSS));
  g.gold -= lost;
  g.player.hp = playerStats(g).maxHp;
  return `💀 Bạn đã gục ngã… mất 🪙${fmt(lost)}. Hồi sinh tại làng.`;
}

/** Ăn món / uống thuốc chỉ định, hoặc món hồi ít nhất đang có */
export function eatFood(g: GameState, foodId?: string, now = Date.now()): string {
  const { maxHp } = playerStats(g);
  const fullHp = g.player.hp >= maxHp;
  const fullEnergy = energyNow(g, now) >= maxEnergy(g);
  const canUseWhenFull = (id: string) => itemBuffs(id).length > 0 || (!!POTION_BY_ID[id]?.energy && !fullEnergy);
  // máu đầy thì phím Q ưu tiên món có buff hoặc hồi thể lực
  const food = foodId ?? Object.keys(HEAL_ITEMS).find((id) => itemCount(g, id) > 0 && (!fullHp || canUseWhenFull(id)));
  if (fullHp && !(food && canUseWhenFull(food))) fail('HP (và thể lực) đã đầy');
  if (!food || !HEAL_ITEMS[food] || itemCount(g, food) < 1) fail('Không có đồ ăn/bình máu — nấu ở Bếp hoặc ghé Tiệm Thuốc');
  removeItem(g, food, 1);
  const heal = Math.min(HEAL_ITEMS[food], maxHp - g.player.hp);
  g.player.hp += heal;
  const energyGain = POTION_BY_ID[food]?.energy ? addMineEnergy(g, POTION_BY_ID[food].energy!, now) : 0;
  const buff = applyFoodBuff(g, food, now);
  const parts: string[] = [];
  if (heal > 0) parts.push(`+${fmt(heal)} HP`);
  if (energyGain > 0) parts.push(`+${energyGain} ⚡ thể lực`);
  if (buff) parts.push(buff);
  return `${ITEMS[food].emoji} ${ITEMS[food].name}: ${parts.length ? parts.join(' · ') : 'Đã dùng'}`;
}

export const foodCount = (g: GameState) => Object.keys(HEAL_ITEMS).reduce((s, id) => s + itemCount(g, id), 0);

export function restAtHome(g: GameState): string {
  const { maxHp } = playerStats(g);
  if (g.player.hp >= maxHp) fail('Bạn đang khỏe re, chưa cần ngủ');
  g.player.hp = maxHp;
  return '😴 Ngủ một giấc ngon lành — HP hồi đầy';
}

// ---------------- Cửa hàng trang bị

export function buyEquipment(g: GameState, id: string): string {
  const e = EQUIP_BY_ID[id];
  if (!e) fail('Không có món này');
  if (e.slot === 'weapon' && isRareWeapon(e.rarity)) {
    fail('🎲 Kiếm Hiếm không có kiếm ngày và không bán lẻ — hãy Quay Random ở Hộp Quà Thần Binh!');
  }
  const wasOwned = g.player.owned.includes(id);
  if (wasOwned && isPermanent(g, id)) fail('Bạn đã sở hữu Vĩnh Viễn món này rồi');
  if (g.player.level < e.levelReq) fail(`Cần đạt Lv ${e.levelReq}`);
  spendGold(g, e.price);
  // Kiếm thường (N/R) chỉ ra Kiếm Ngày (3 Ngày hoặc 7 Ngày); giáp/phụ kiện quay hạn chuẩn
  const dur: DurationRoll = e.slot === 'weapon' ? (Math.random() < 0.75 ? '3d' : '7d') : rollItemDuration();
  const status = applyItemDuration(g, id, dur, wasOwned);
  if (!wasOwned) g.player.owned.push(id);
  if (e.slot === 'weapon') addToHotbar(g, id, true);
  else g.player.equip[e.slot] = id;
  g.player.hp = Math.min(g.player.hp, playerStats(g).maxHp);
  storyTrack(g, 'buy_equip');
  return `🛍️ Đã nhận ${e.emoji} ${e.name} · [${durationLabel(dur, status)}]!`;
}

export function equipItem(g: GameState, id: string): string {
  const e = EQUIP_BY_ID[id];
  if (!e || !g.player.owned.includes(id)) fail('Bạn chưa có món này');
  if (e.slot === 'weapon') addToHotbar(g, id, true);
  else g.player.equip[e.slot] = id;
  g.player.hp = Math.min(g.player.hp, playerStats(g).maxHp);
  return `Đã trang bị ${e.emoji} ${e.name}`;
}

// ---------------- Hộp quà Random Thần Binh (Gacha Vũ Khí)

const WEAPON_RARITIES: RodRarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
const WEAPON_POOL = EQUIPMENT.filter((e) => e.slot === 'weapon');

function rollWeapon(odds: Record<RodRarity, number>, forcePitySR?: boolean): EquipDef {
  let rar: RodRarity = 'N';
  if (forcePitySR) {
    // Bảo hiểm ×10: giữ nguyên tỉ lệ 0.01% của UR và 0.1% của SSR, còn lại ra SR
    const r = Math.random();
    if (r < odds.UR) rar = 'UR';
    else if (r < odds.UR + odds.SSR) rar = 'SSR';
    else rar = 'SR';
  } else {
    const entries = WEAPON_RARITIES.map((k) => [k, odds[k]] as const);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let pick = Math.random() * total;
    rar = entries[entries.length - 1][0];
    for (const [k, w] of entries) {
      pick -= w;
      if (pick <= 0) {
        rar = k;
        break;
      }
    }
  }
  const pool = WEAPON_POOL.filter((w) => (w.rarity ?? 'N') === rar);
  return pool[Math.floor(Math.random() * pool.length)] ?? WEAPON_POOL[0];
}

export interface WeaponPull {
  weapon: EquipDef;
  isNew: boolean;
  dupGold: number;
  duration: DurationRoll;
  status: DurationStatus;
}

/**
 * Mở 1 hoặc 10 Hộp Quà Random Thần Binh:
 * - Tỉ lệ Kiếm Hiếm Chí Tôn (UR): đúng 0.01% (0.0001).
 * - Kiếm Hiếm (SR, SSR, UR): KHÔNG có kiếm ngày — mở trúng là nhận ♾️ VĨNH VIỄN ('perm')!
 * - Kiếm Thường (N, R): Chỉ có kiếm ngày (random 3 Ngày / 7 Ngày)!
 */
export function openWeaponBox(g: GameState, boxId: string, n: 1 | 10): WeaponPull[] {
  const box = WEAPON_BOXES.find((b) => b.id === boxId);
  if (!box) fail('Không tìm thấy hộp quà vũ khí');
  if (box.cost.gold) spendGold(g, box.cost.gold * n);
  if (box.cost.gems) spendGems(g, box.cost.gems * n);

  const pulls: WeaponPull[] = [];
  const pityMin: RodRarity = 'SR';
  const minIdx = WEAPON_RARITIES.indexOf(pityMin);
  let bestNew: EquipDef | null = null;

  for (let i = 0; i < n; i++) {
    const forcePity =
      n === 10 &&
      i === 9 &&
      !pulls.some((p) => WEAPON_RARITIES.indexOf(p.weapon.rarity ?? 'N') >= minIdx);
    const weapon = rollWeapon(box.odds, forcePity);
    const rar = weapon.rarity ?? 'N';
    const wasOwned = g.player.owned.includes(weapon.id);
    // Kiếm hiếm (SR/SSR/UR) KHÔNG có kiếm ngày -> luôn Vĩnh Viễn ('perm'); chỉ kiếm thường (N/R) mới có kiếm ngày (3d/7d)!
    const duration: DurationRoll = isRareWeapon(rar) ? 'perm' : Math.random() < 0.75 ? '3d' : '7d';
    const status = applyItemDuration(g, weapon.id, duration, wasOwned);
    const isDupPerm = status === 'dup_perm';
    const dupGold = isDupPerm ? WEAPON_DUP_GOLD[rar] : 0;

    if (isDupPerm) {
      g.gold += dupGold;
    } else {
      if (!wasOwned) g.player.owned.push(weapon.id);
      if (
        !bestNew ||
        WEAPON_RARITIES.indexOf(rar) >= WEAPON_RARITIES.indexOf(bestNew.rarity ?? 'N')
      ) {
        bestNew = weapon;
      }
    }
    pulls.push({ weapon, isNew: !wasOwned, dupGold, duration, status });
  }
  if (bestNew) {
    addToHotbar(g, bestNew.id, true);
  }
  storyTrack(g, 'buy_equip');
  return pulls;
}

/** cởi giáp → quay về áo vải mặc thường */
export function unequipArmor(g: GameState): string {
  if (!g.player.equip.armor) fail('Chưa mặc giáp');
  const prev = g.player.equip.armor;
  g.player.equip.armor = null;
  g.player.hp = Math.min(g.player.hp, playerStats(g).maxHp);
  return `Đã tháo ${EQUIP_BY_ID[prev]?.name ?? 'giáp'}`;
}

export function unequipAccessory(g: GameState): string {
  g.player.equip.accessory = null;
  g.player.hp = Math.min(g.player.hp, playerStats(g).maxHp);
  return 'Đã tháo phụ kiện';
}

export const potionPrice = (id: string, qty: number) => {
  const p = POTION_BY_ID[id];
  if (!p) return 0;
  return Math.round(p.price * qty * (qty >= 10 ? 0.9 : 1));
};

export function buyPotion(g: GameState, id: string, qty: number): string {
  const p = SHOP_POTIONS.find((x) => x.id === id);
  if (!p) fail('Không bán món này');
  const cost = potionPrice(id, qty);
  spendGold(g, cost);
  addItem(g, id, qty);
  return `🧪 Đã mua ${ITEMS[id].emoji} ${ITEMS[id].name} ×${qty} (🪙${fmt(cost)})`;
}

/** Lò luyện đan ở Tiệm Thuốc: dùng thảo dược / nông sản / chiến lợi phẩm điều chế thuốc */
export function brewPotion(g: GameState, recipeId: string): string {
  const r = ALCHEMY_RECIPES.find((x) => x.id === recipeId);
  if (!r) fail('Không có công thức luyện đan này');
  for (const [id, n] of Object.entries(r.inputs)) {
    if (itemCount(g, id) < n) fail(`Thiếu ${ITEMS[id]?.name ?? id} (cần ${n})`);
  }
  spendGold(g, r.goldCost);
  for (const [id, n] of Object.entries(r.inputs)) removeItem(g, id, n);
  addItem(g, r.outputId, r.outputQty);
  track(g, 'cook');
  const out = ITEMS[r.outputId];
  return `⚗️ Luyện đan thành công: nhận ${out.emoji} ${out.name} ×${r.outputQty}!`;
}

/** Chẩn trị & châm cứu hồi phục tại chỗ ở Tiệm Thuốc Dược sư Lan */
export function clinicTreat(g: GameState, now = Date.now()): string {
  const { maxHp } = playerStats(g);
  const curE = energyNow(g, now);
  const maxE = maxEnergy(g);
  if (g.player.hp >= maxHp && curE >= maxE) fail('Bạn đang sung sức, máu và thể lực đều đã đầy!');
  const fee = g.player.level < 5 ? 0 : 35;
  if (fee > 0) spendGold(g, fee);
  const hpGain = maxHp - Math.floor(g.player.hp);
  g.player.hp = maxHp;
  const eGain = addMineEnergy(g, 20, now);
  return `🩺 Dược sư Lan châm cứu: hồi đầy ❤️ HP${hpGain > 0 ? ` (+${fmt(hpGain)})` : ''}${eGain > 0 ? ` & +${eGain} ⚡ thể lực` : ''}!`;
}

// ---------------- Lò rèn

export function upgradeGear(g: GameState, slot: GearSlot): string {
  const def = GEAR[slot];
  const lvl = g.player.gear[slot];
  if (lvl >= def.max) fail('Đã rèn tới cấp tối đa');
  const cost = def.cost(lvl);
  for (const [id, n] of Object.entries(cost.items)) {
    if (itemCount(g, id) < n) fail(`Thiếu ${ITEMS[id].name} (cần ${n})`);
  }
  spendGold(g, cost.gold);
  for (const [id, n] of Object.entries(cost.items)) removeItem(g, id, n);
  g.player.gear[slot] = lvl + 1;
  if (slot === 'armor') g.player.hp = Math.min(playerStats(g).maxHp, g.player.hp + 20);
  track(g, 'upgrade');
  return `🔨 ${def.emoji} ${def.name} +${lvl + 1}!`;
}
