import { buffValue } from './buffs';
import { ITEMS } from '../config/farm';
import { FISHING_ZONES, ZONE_BY_ID, SUPER_RARE_CHANCE } from '../config/fishingZones';
import { getCurrentSeason, type SeasonId } from '../config/seasons';
import {
  ANIMALS, BITE_MAX_SEC, BITE_MIN_SEC, EMPTY_BITE, FISH, FISH_BY_ID, FURNITURE_BY_ID, HOUSE_BY_ID, LINE_SNAP, MAX_ANIMALS, SIZE_TIERS, STARTER_HOME, fishKg, houseLuxuryInfo, sizeTierOf, type FishDef, type HouseDef,
} from '../config/life';
import { BAIT_BOX, BAIT_BY_ID, BAIT_SHOP, KITE_BOXES, KITE_BY_ID, KITE_DUP_GOLD, KITES, ROD_BOXES, ROD_BY_ID, ROD_DUP_GOLD, RODS, type KiteDef, type RodDef, type RodRarity } from '../config/shops';
import type { GameState, Reward, CaughtFish } from '../types';
import { KITE_ALT_GOLD, KITE_BUFF_ALT, KITE_COIN_GOLD, KITE_CRASH_KEEP, KITE_GIFTS, KITE_MAX, kitePlay } from '../config/kitegame';
import { fail, fmtTime, weekKey } from '../utils';
import { addItem, earnGold, giveReward, itemCount, removeItem, spendGems, spendGold, track } from './core';
import { addToHotbar } from './hotbar';
import { addMineEnergy } from './mine';
import { applyItemDuration, durationLabel, isPermanent, rarityRank, rollItemDuration, type DurationRoll, type DurationStatus } from './shop';
import { storyTrack } from './story';
import { checkFishTitles } from './titles';
import { TOP_TITLE_COUNT, TITLE_BY_ID, topTitleId } from '../config/titles';
import { playerRank, syncTopTitles } from './ranks';
import { remote } from './remote';

export interface FishOvertakeInfo {
  oldRank: number;
  newRank: number;
  title: (typeof TITLE_BY_ID)[string];
}

// ---------------- Nhà & Nội thất gia đình

export function buyHouse(g: GameState, id: string): string {
  const h = HOUSE_BY_ID[id];
  if (!h || id === 'starter_home') fail('Không có căn nhà này');
  if (g.houses.includes(id)) fail('Bạn đã sở hữu căn nhà này');
  spendGold(g, h.price);
  g.houses.push(id);
  const curPrice = g.activeHouse && HOUSE_BY_ID[g.activeHouse] ? HOUSE_BY_ID[g.activeHouse].price : 0;
  if (!g.activeHouse || h.price >= curPrice) {
    g.activeHouse = id;
  }
  track(g, 'upgrade');
  return `🔑 Chúc mừng! Bạn đã mua và dọn vào ${h.emoji} ${h.name}!`;
}

/** Căn nhà chính đang ở để hiển thị không gian nội thất */
export function currentHouse(g: GameState): HouseDef {
  if (g.activeHouse && (g.activeHouse === 'starter_home' || g.houses.includes(g.activeHouse)) && HOUSE_BY_ID[g.activeHouse]) {
    return HOUSE_BY_ID[g.activeHouse];
  }
  if (g.houses.length > 0) {
    const sorted = [...g.houses].map((id) => HOUSE_BY_ID[id]).filter(Boolean).sort((a, b) => b.price - a.price);
    if (sorted[0]) return sorted[0];
  }
  return STARTER_HOME;
}

/** Chọn căn nhà đang sở hữu để dọn vào ở chính */
export function selectActiveHouse(g: GameState, id: string): string {
  if (id !== 'starter_home' && !g.houses.includes(id)) fail('Bạn chưa sở hữu căn nhà này');
  const h = HOUSE_BY_ID[id] ?? STARTER_HOME;
  g.activeHouse = id;
  return `🏠 Đã chuyển tổ ấm chính sang ${h.emoji} ${h.name}!`;
}

/** Hệ số nhân hiệu suất nội thất cao nhất từ căn nhà đắt nhất đang sở hữu */
export function bestHouseLuxuryMult(g: GameState): number {
  let best = 0;
  for (const id of g.houses) {
    const h = HOUSE_BY_ID[id];
    if (h) best = Math.max(best, houseLuxuryInfo(h).mult);
  }
  return best;
}

export function buyFurniture(g: GameState, id: string): string {
  const f = FURNITURE_BY_ID[id];
  if (!f) fail('Không tìm thấy món nội thất này');
  const list = (g.furniture ??= []);
  if (list.includes(id)) fail('Nhà bạn đã sắm món dụng cụ này rồi');
  spendGold(g, f.price);
  list.push(id);
  track(g, 'upgrade');
  return `🛋️ Đã sắm ${f.emoji} ${f.name} vào tổ ấm của bạn!`;
}

/** Tương tác sử dụng dụng cụ / nội thất trong nhà (giường, máy pha cà phê, ghế massage, giàn gym, bồn tắm...) */
export function useHomeAppliance(g: GameState, id: string, maxHp: number, now = Date.now()): string {
  const f = FURNITURE_BY_ID[id];
  if (!f || !(g.furniture ?? []).includes(id)) fail('Bạn chưa sắm dụng cụ này trong nhà');
  const act = f.action;
  if (!act) fail('Món nội thất này đang tự động phát huy tác dụng thụ động');
  if (act.healPct) {
    const addHp = Math.round(maxHp * act.healPct);
    g.player.hp = Math.min(maxHp, g.player.hp + addHp);
  }
  if (act.energy) {
    addMineEnergy(g, act.energy, now);
  }
  if (act.buff) {
    const cur = g.buffs[act.buff.id];
    const left = cur && cur.until > now ? cur.until - now : 0;
    g.buffs[act.buff.id] = {
      value: Math.max(act.buff.value, cur && left ? cur.value : 0),
      until: now + Math.min(30 * 60_000, left + act.buff.min * 60_000),
    };
  }
  return act.toast;
}

/** Cấp bếp hiện có (tính cả Bếp xây ở xưởng lẫn Bếp Điện Từ / Đảo Bếp 5 Sao mua trong nhà) */
export function effectiveKitchenLevel(g: GameState): number {
  const furnLvl = (g.furniture ?? []).reduce((m, id) => Math.max(m, FURNITURE_BY_ID[id]?.kitchenTier ?? 0), 0);
  return Math.max(g.buildings.kitchen, furnLvl);
}

export const houseXpBonus = (g: GameState) =>
  g.houses.reduce((s, id) => s + (HOUSE_BY_ID[id]?.xp ?? 0), 0) +
  (g.furniture ?? []).reduce((s, id) => s + (FURNITURE_BY_ID[id]?.xp ?? 0), 0);

export const houseGoldPerMin = (g: GameState) => {
  const baseHouses = g.houses.reduce((s, id) => s + (HOUSE_BY_ID[id]?.goldPerMin ?? 0), 0);
  const furnBase = (g.furniture ?? []).reduce((s, id) => s + (FURNITURE_BY_ID[id]?.goldPerMin ?? 0), 0);
  return baseHouses + Math.round(furnBase * (1 + bestHouseLuxuryMult(g)));
};

export const houseHp = (g: GameState) => {
  const baseHouses = g.houses.reduce((s, id) => s + (HOUSE_BY_ID[id]?.hp ?? 0), 0);
  const furnBase = (g.furniture ?? []).reduce((s, id) => s + (FURNITURE_BY_ID[id]?.hp ?? 0), 0);
  return baseHouses + Math.round(furnBase * (1 + bestHouseLuxuryMult(g)));
};

export const houseCombatStats = (g: GameState) => ({
  atk: (g.furniture ?? []).reduce((s, id) => s + (FURNITURE_BY_ID[id]?.atk ?? 0), 0),
  def: (g.furniture ?? []).reduce((s, id) => s + (FURNITURE_BY_ID[id]?.def ?? 0), 0),
});

// ---------------- Chăn nuôi & Thú y

export function buyAnimal(g: GameState, kind: string): string {
  const a = ANIMALS[kind];
  if (!a) fail('Không có loại vật nuôi này');
  if (g.animals.length >= MAX_ANIMALS) fail(`Trang trại đã đầy (${MAX_ANIMALS} con)`);
  spendGold(g, a.price);
  g.animals.push({
    uid: ++g.seq,
    kind,
    fed: false,
    watered: false,
    vaccinated: false,
    clean: true,
    sick: false,
    readyAt: 0,
  });
  return `${a.emoji} Đã mua ${a.name} — hãy chích ngừa 💉 và cho ăn 🍽️ để bắt đầu nhé!`;
}

export type AnimalStatus = 'sick' | 'vaccine' | 'hungry' | 'dirty' | 'growing' | 'ready';

export function animalStatus(g: GameState, uid: number, now: number): AnimalStatus {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) return 'hungry';
  if (a.sick) return 'sick';
  if (a.vaccinated === false) return 'vaccine';
  if (!a.fed) return 'hungry';
  if (a.clean === false) return 'dirty';
  return now >= a.readyAt ? 'ready' : 'growing';
}

/** 💊 Chữa bệnh cho vật nuôi bị ốm sốt */
export function cureAnimal(g: GameState, uid: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const def = ANIMALS[a.kind];
  if (!a.sick) fail(`${def.name} đang khỏe mạnh, không cần thuốc trị bệnh`);
  if (itemCount(g, 'vet_medicine') > 0) removeItem(g, 'vet_medicine', 1);
  else spendGold(g, 25);
  a.sick = false;
  a.vaccinated = true;
  return `💊 Đã tiêm thuốc đặc trị — ${def.emoji} ${def.name} đã khỏi bệnh hoàn toàn!`;
}

/** 💉 Chích ngừa vắc-xin phòng dịch cho vật nuôi */
export function vaccinateAnimal(g: GameState, uid: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const def = ANIMALS[a.kind];
  if (a.sick) fail(`${def.name} đang bị ốm — hãy tiêm Thuốc đặc trị 💊 trước!`);
  if (a.vaccinated !== false) fail(`${def.name} đã được chích ngừa trong lứa này rồi`);
  if (itemCount(g, 'vet_vaccine') > 0) removeItem(g, 'vet_vaccine', 1);
  else spendGold(g, 15);
  a.vaccinated = true;
  return `💉 Đã chích ngừa vắc-xin phòng bệnh cho ${def.emoji} ${def.name}!`;
}

/** 🍽️ Cho vật nuôi ăn (dùng nông sản đúng khẩu phần hoặc Cám tổng hợp) */
export function feedAnimal(g: GameState, uid: number, now: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const def = ANIMALS[a.kind];
  if (a.sick) fail(`${def.name} đang bị ốm 🤒 — hãy chữa bệnh trước khi cho ăn`);
  if (a.vaccinated === false) fail(`Cần chích ngừa vắc-xin 💉 cho ${def.name} trước khi vỗ béo!`);
  if (a.fed) fail(`${def.name} đã no bụng rồi`);
  const hasCrops = Object.entries(def.feed).every(([id, n]) => itemCount(g, id) >= n);
  if (hasCrops) {
    for (const [id, n] of Object.entries(def.feed)) removeItem(g, id, n);
  } else if (itemCount(g, 'animal_feed') > 0) {
    removeItem(g, 'animal_feed', 1);
  } else {
    const reqText = Object.entries(def.feed).map(([id, n]) => `${ITEMS[id].emoji}${ITEMS[id].name} ×${n}`).join(', ');
    fail(`Cần ${reqText} (hoặc 🌾 Cám dinh dưỡng) để cho ${def.name} ăn`);
  }
  a.fed = true;
  a.watered = true;
  a.readyAt = now + def.cycleSec * 1000;
  return `🍽️ Đã cho ${def.emoji} ${def.name} ăn no & uống nước — ${fmtTime(def.cycleSec * 1000)} nữa thu hoạch!`;
}

/** 🧹 Vệ sinh chuồng trại & tắm rửa cho vật nuôi */
export function cleanAnimal(g: GameState, uid: number, now: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const def = ANIMALS[a.kind];
  if (a.clean !== false) fail(`Chuồng của ${def.name} đã sạch sẽ rồi`);
  a.clean = true;
  a.watered = true;
  if (a.fed && a.readyAt > now) {
    a.readyAt = now + Math.round((a.readyAt - now) * 0.85);
  }
  return `🧹 Đã dọn chuồng & tắm sạch cho ${def.emoji} ${def.name} (tăng tốc +15%)!`;
}

/** Đi tới con vật và bấm: tự động thực hiện bước chăm sóc đang cần hoặc thu sản phẩm */
export function tendAnimal(g: GameState, uid: number, now: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const st = animalStatus(g, uid, now);
  if (st === 'sick') return cureAnimal(g, uid);
  if (st === 'vaccine') return vaccinateAnimal(g, uid);
  if (st === 'hungry') return feedAnimal(g, uid, now);
  if (st === 'dirty') return cleanAnimal(g, uid, now);
  const def = ANIMALS[a.kind];
  if (now < a.readyAt) fail(`${def.name} chưa có sản phẩm (${fmtTime(a.readyAt - now)})`);
  addItem(g, def.product, def.qty);
  a.fed = false;
  a.watered = false;
  a.vaccinated = false;
  a.clean = false;
  a.sick = Math.random() < 0.15;
  storyTrack(g, 'ranch');
  return `🧺 Thu hoạch +${def.qty} ${ITEMS[def.product].emoji} ${ITEMS[def.product].name} từ ${def.name}!`;
}

/** Chăm sóc & thu hoạch nhanh tất cả vật nuôi trong chuồng */
export function tendAllAnimals(g: GameState, now: number): string {
  if (!g.animals.length) fail('Chuồng chưa có vật nuôi nào');
  let actions = 0;
  for (const a of g.animals) {
    // mỗi con có thể cần nhiều bước liên tiếp (chữa bệnh -> chích ngừa -> cho ăn -> vệ sinh -> thu hoạch)
    for (let step = 0; step < 4; step++) {
      const st = animalStatus(g, a.uid, now);
      if (st === 'growing') break;
      try {
        tendAnimal(g, a.uid, now);
        actions++;
      } catch (e) {
        if (actions === 0 && step === 0) throw e;
        break;
      }
      if (st === 'ready') break;
    }
  }
  if (!actions) fail('Tất cả vật nuôi đang no khỏe và đang tạo sản phẩm');
  return `🐾 Đã thực hiện ${actions} lượt chăm sóc / thu hoạch chuồng trại!`;
}

export function sellAnimal(g: GameState, uid: number): string {
  const a = g.animals.find((x) => x.uid === uid);
  if (!a) fail('Không tìm thấy vật nuôi');
  const def = ANIMALS[a.kind];
  g.animals = g.animals.filter((x) => x.uid !== uid);
  const refund = Math.round(def.price * 0.5);
  earnGold(g, refund);
  return `Đã bán ${def.emoji} ${def.name} (+🪙${refund})`;
}

// ---------------- Câu cá

export interface FishingContext {
  night: boolean;
  rain: boolean;
  privatePond: boolean;
  /** tích hệ số cá hiếm của cần câu × mồi */
  rareMult: number;
  /** hệ số siêu hiếm cho cá Mythic 0.00001% -> đến 1% khi dùng cần + mồi VIP */
  superRareMult?: number;
  /** tổng hệ số đẩy kích thước của cần + mồi */
  sizeBonus: number;
  /** Vùng câu cá (1..6) */
  zoneId?: number;
  now?: number;
}

export interface FishRoll {
  fish: FishDef & { zoneId?: number; isSuperRare?: boolean; gemPrice?: number; season?: string; titleReward?: string };
  cm: number;
  /** 0..1 vị trí trong khoảng kích thước của loài */
  pct: number;
  tier: number;
  zoneId: number;
  season: SeasonId;
  isSuperRare?: boolean;
}

export function rollFish(ctx: FishingContext): FishRoll {
  const now = ctx.now ?? Date.now();
  const seasonInfo = getCurrentSeason(now);
  const zoneId = ctx.zoneId && ctx.zoneId >= 1 && ctx.zoneId <= 6 ? ctx.zoneId : 1;
  const zone = ZONE_BY_ID[zoneId] ?? FISHING_ZONES[0];

  // 1. Kiểm tra tỉ lệ cá Thần Thoại / Cực Hiếm:
  // Cho dù trang bị cần xịn nhất + mồi VIP, tỉ lệ cắn câu tối đa đúng chuẩn 1% (0.01)
  const superMult = ctx.superRareMult ?? (1 + ctx.rareMult * 5);
  const superRareRate = Math.min(0.01, SUPER_RARE_CHANCE * superMult * 10);
  if (Math.random() < superRareRate) {
    const superFish = FISH.find((f) => f.id === zone.superRareFishId) ?? FISH.find((f) => f.isSuperRare);
    if (superFish) {
      const pct = 0.85 + Math.random() * 0.15;
      const cm = Math.round((superFish.cm[0] + (superFish.cm[1] - superFish.cm[0]) * pct) * 10) / 10;
      return {
        fish: superFish,
        cm,
        pct,
        tier: sizeTierOf(pct),
        zoneId,
        season: seasonInfo.id,
        isSuperRare: true,
      };
    }
  }

  // 2. Lọc danh sách cá khả dụng:
  const candidateFish = FISH.filter((f) => {
    if (f.isSuperRare) return false;
    if (f.season && f.season !== seasonInfo.id) return false;
    if (f.zoneId && f.zoneId !== zoneId && f.zoneId !== 0) return false;
    return true;
  });

  const pool = candidateFish.length > 0 ? candidateFish : FISH.filter((f) => !f.isSuperRare);

  const weights = pool.map((f) => {
    let w = f.weight;
    if (f.night) w *= ctx.night ? 4 : 0.4;
    if (f.rain) w *= ctx.rain ? 5 : 0.4;
    if (f.rare) w *= ctx.rareMult * (ctx.privatePond ? 3 : 1);
    if (f.season === seasonInfo.id) w *= 2.5;
    return w;
  });

  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  let fish = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      fish = pool[i];
      break;
    }
  }

  // cần + mồi càng xịn, kích thước càng lệch về phía to
  const pct = Math.random() ** (1 / (1 + ctx.sizeBonus));
  const cm = Math.round((fish.cm[0] + (fish.cm[1] - fish.cm[0]) * pct) * 10) / 10;
  return {
    fish,
    cm,
    pct,
    tier: sizeTierOf(pct),
    zoneId,
    season: seasonInfo.id,
    isSuperRare: false,
  };
}

export interface CastInfo {
  rareMult: number;
  superRareMult?: number;
  sizeBonus: number;
  /** thời gian chờ cá cắn (ms) */
  waitMs: number;
  /** cá rỉa mồi rồi chạy */
  emptyBite: boolean;
  miss: number;
}

/** Thả câu: tốn 1 mồi, tính trước thời gian chờ & tỉ lệ hụt theo cần + mồi */
export function spendBait(g: GameState, baitId: string): CastInfo {
  const bait = BAIT_BY_ID[baitId];
  if (!bait) fail('Mồi không hợp lệ');
  if (itemCount(g, baitId) < 1) fail('Hết mồi rồi — mua ở Tiệm Câu Cá');
  removeItem(g, baitId, 1);
  const rod = ROD_BY_ID[g.fishingGear.rod] ?? ROD_BY_ID.rod_bamboo;
  const raw = BITE_MIN_SEC + Math.random() * (BITE_MAX_SEC - BITE_MIN_SEC);
  const waitMs = Math.min(BITE_MAX_SEC, Math.max(BITE_MIN_SEC, raw * rod.bite * bait.bite)) * 1000;
  const luck = buffValue(g, 'luck');
  const superMult = (bait.superRareMult ?? 1) * rod.rare * (1 + luck);
  return {
    rareMult: bait.rare * rod.rare * (1 + luck),
    superRareMult: superMult,
    sizeBonus: rod.size + bait.size + luck,
    waitMs,
    emptyBite: Math.random() < EMPTY_BITE * rod.miss,
    miss: rod.miss,
  };
}

/** cá to + cần yếu dễ đứt dây hơn */
export const lineSnapChance = (pct: number, miss: number) => LINE_SNAP * miss * (0.4 + pct * 1.6);

export interface CatchResult {
  msg: string;
  points: number;
  bonus: number;
  record: boolean;
  titles: string[];
  rankOvertake?: FishOvertakeInfo;
}

export interface ServerCatchResult {
  titles: string[];
  rankOvertake?: FishOvertakeInfo;
}

export function catchFish(
  g: GameState,
  roll: { id: string; cm: number; pct: number; zoneId?: number; season?: SeasonId; isSuperRare?: boolean },
  now: number = Date.now(),
): CatchResult {
  const prevRank = playerRank(g, now, 'fish');
  const f = FISH_BY_ID[roll.id] ?? FISH[0];
  const tier = SIZE_TIERS[sizeTierOf(roll.pct)];
  const zoneId = roll.zoneId ?? 1;
  const zone = ZONE_BY_ID[zoneId] ?? FISHING_ZONES[0];
  const season = roll.season ?? getCurrentSeason(now).id;
  const isSuper = !!roll.isSuperRare || !!f.isSuperRare;

  g.stats.fish++;
  track(g, 'fish');
  storyTrack(g, 'fish');

  // cá càng to càng nhiều vàng thưởng & điểm đua top
  const bonus = tier.mult > 1 ? Math.round(f.price * (tier.mult - 1)) : 0;
  if (bonus) earnGold(g, bonus);
  const points = Math.round(f.price * tier.mult * (0.5 + roll.pct) * (isSuper ? 10 : 1));
  g.fishing.week.points += points;
  const record = roll.cm > (g.fishing.best[f.id] ?? 0);
  if (record) g.fishing.best[f.id] = roll.cm;
  if (!g.fishing.biggest || roll.cm > g.fishing.biggest.cm) g.fishing.biggest = { id: f.id, cm: roll.cm };

  if (remote.enabled && remote.me && remote.weeks[g.fishing.week.key]) {
    const meRow = remote.weeks[g.fishing.week.key].find((r) => r.id === remote.me);
    if (meRow) {
      meRow.scores.fish = g.fishing.week.points;
      meRow.scores.fish_big = Math.max(meRow.scores.fish_big || 0, roll.cm);
    }
  }

  // Giá bán khi bán đổi ra Vàng hoặc Kim Cương
  const priceGold = Math.round(f.price * tier.mult * (0.8 + (roll.cm / f.cm[0]) * 0.2));
  let priceGems = f.gemPrice ? Math.round(f.gemPrice * tier.mult) : undefined;
  if (!priceGems && tier.name === 'Khổng lồ' && f.rare) {
    priceGems = 2;
  }

  // Thêm vào Kho Cá cá nhân (Fish Bag)
  if (!g.fishing.fishBag) g.fishing.fishBag = [];
  const caughtItem: CaughtFish = {
    uuid: 'fish_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36),
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    rarity: isSuper ? 'mythic' : (f.rare ? (f.price > 400 ? 'epic' : 'rare') : 'common'),
    zoneId,
    zoneName: zone.name,
    season,
    cm: roll.cm,
    kg: fishKg(roll.cm),
    tier: sizeTierOf(roll.pct),
    tierName: tier.name,
    caughtAt: now,
    isSuperRare: isSuper,
    priceGold,
    priceGems,
    locked: isSuper,
  };
  g.fishing.fishBag.unshift(caughtItem);

  if (g.fishing.fishBag.length > 200) {
    const unlockedIdx = g.fishing.fishBag.findIndex((c) => !c.locked && !c.isSuperRare);
    if (unlockedIdx !== -1) g.fishing.fishBag.splice(unlockedIdx, 1);
  }

  // Kiểm tra bứt phá thứ hạng Top 1-5 Bảng Câu Cá để nhận và chuyển giao danh hiệu
  const newRank = playerRank(g, now, 'fish');
  let rankOvertake: FishOvertakeInfo | undefined;
  if (newRank >= 1 && newRank <= TOP_TITLE_COUNT && (prevRank === 0 || newRank < prevRank)) {
    const tId = topTitleId('fish', newRank);
    rankOvertake = { oldRank: prevRank, newRank, title: TITLE_BY_ID[tId] };
    g.titles.active = tId;
  }
  syncTopTitles(g, now);

  const titles = checkFishTitles(g, { id: f.id, cm: roll.cm, tier: sizeTierOf(roll.pct), titleReward: f.titleReward });

  let msg = `🎣 ${tier.emoji} ${f.name} ${tier.name} ${roll.cm}cm (${fishKg(roll.cm)}kg) · +${points} điểm${bonus ? ` · +🪙${bonus} thưởng cá to` : ''}${record ? ' · 🏅 KỶ LỤC MỚI!' : ''}`;
  if (isSuper) {
    msg = `🌟 HUYỀN THOẠI CỰC PHẨM! Bạn vừa câu được ${f.emoji} ${f.name} ${roll.cm}cm tại ${zone.name}! (+💎50 Kim Cương)`;
    g.gems += 50;
  }

  return { msg, points, bonus, record, titles, rankOvertake };
}

/** Bán 1 con cá trong kho đồ cá nhân lấy Vàng hoặc Kim Cương */
export function sellFish(g: GameState, uuid: string): { gold: number; gems: number; msg: string } {
  if (!g.fishing?.fishBag) fail('Kho cá trống');
  const idx = g.fishing.fishBag.findIndex((f) => f.uuid === uuid);
  if (idx === -1) fail('Không tìm thấy con cá này');
  const fish = g.fishing.fishBag[idx];
  if (fish.locked) fail('Cá đang bị khóa! Hãy mở khóa trước khi bán.');

  let gold = 0;
  let gems = 0;
  if (fish.priceGems && fish.priceGems > 0) {
    gems = fish.priceGems;
    g.gems += gems;
  } else {
    gold = fish.priceGold;
    earnGold(g, gold);
  }

  const fishId = fish.id;
  g.fishing.fishBag.splice(idx, 1);

  // Đồng bộ sạch sẽ nếu còn lưu dư thừa trong g.inventory hoặc g.chest
  if (g.inventory && g.inventory[fishId]) {
    g.inventory[fishId]--;
    if (g.inventory[fishId] <= 0) delete g.inventory[fishId];
  }
  if (g.chest?.items && g.chest.items[fishId]) {
    g.chest.items[fishId]--;
    if (g.chest.items[fishId] <= 0) delete g.chest.items[fishId];
  }

  const rewardStr = gems > 0 ? `+💎${gems} Kim Cương` : `+🪙${gold} Vàng`;
  return { gold, gems, msg: `Đã bán ${fish.emoji} ${fish.name} (${fish.cm}cm) được ${rewardStr}` };
}

/** Bán nhanh toàn bộ cá chưa khóa lấy Vàng / Kim Cương */
export function sellAllUnlockedFish(g: GameState, keepMythic: boolean = true): { soldCount: number; gold: number; gems: number; msg: string } {
  if (!g.fishing?.fishBag || g.fishing.fishBag.length === 0) fail('Không có cá để bán');

  let totalGold = 0;
  let totalGems = 0;
  let soldCount = 0;
  const remaining: CaughtFish[] = [];
  const soldFishIds: Record<string, number> = {};

  for (const f of g.fishing.fishBag) {
    if (f.locked || (keepMythic && (f.isSuperRare || f.rarity === 'mythic'))) {
      remaining.push(f);
      continue;
    }
    if (f.priceGems && f.priceGems > 0) {
      totalGems += f.priceGems;
    } else {
      totalGold += f.priceGold;
    }
    soldCount++;
    soldFishIds[f.id] = (soldFishIds[f.id] ?? 0) + 1;
  }

  if (soldCount === 0) fail('Không có con cá nào đủ điều kiện bán (các con quý đã bị khóa)');

  g.fishing.fishBag = remaining;
  if (totalGold > 0) earnGold(g, totalGold);
  if (totalGems > 0) g.gems += totalGems;

  // Dọn sạch dư thừa trong inventory và chest cho các con cá vừa bán
  for (const [id, count] of Object.entries(soldFishIds)) {
    if (g.inventory && g.inventory[id]) {
      g.inventory[id] = Math.max(0, (g.inventory[id] || 0) - count);
      if (g.inventory[id] <= 0) delete g.inventory[id];
    }
    if (g.chest?.items && g.chest.items[id]) {
      g.chest.items[id] = Math.max(0, (g.chest.items[id] || 0) - count);
      if (g.chest.items[id] <= 0) delete g.chest.items[id];
    }
  }

  let rewardStr = '';
  if (totalGold > 0) rewardStr += `+🪙${totalGold} Vàng`;
  if (totalGems > 0) rewardStr += `${rewardStr ? ' và ' : ''}+💎${totalGems} Kim Cương`;

  return { soldCount, gold: totalGold, gems: totalGems, msg: `Đã bán thành công ${soldCount} con cá, thu về ${rewardStr}!` };
}

/** Khóa / Mở khóa con cá trong kho */
export function toggleLockFish(g: GameState, uuid: string): boolean {
  if (!g.fishing.fishBag) return false;
  const fish = g.fishing.fishBag.find((f) => f.uuid === uuid);
  if (!fish) return false;
  fish.locked = !fish.locked;
  return fish.locked;
}

export function equipRod(g: GameState, id: string): string {
  if (!g.fishingGear.rods.includes(id)) fail('Bạn chưa có cần này');
  g.fishingGear.rod = id;
  addToHotbar(g, id, true);
  return `Đang dùng ${ROD_BY_ID[id].name}`;
}

export interface BoxResult {
  rod: RodDef;
  dup: boolean;
  gold: number;
  duration: DurationRoll;
  status: DurationStatus;
}

/** Mở hộp cần câu: ra ngẫu nhiên theo bậc hiếm + hạn sử dụng 1 / 3 / 7 Ngày / Vĩnh Viễn (0.0001%) */
export function openRodBox(g: GameState, boxId: string): BoxResult {
  const box = ROD_BOXES.find((b) => b.id === boxId);
  if (!box) fail('Không có hộp này');
  if (box.gems) spendGems(g, box.gems);
  else spendGold(g, box.price);
  let r = Math.random();
  let rarity = Object.keys(box.odds)[0] as RodRarity;
  for (const [k, p] of Object.entries(box.odds) as [RodRarity, number][]) {
    r -= p;
    if (r <= 0) {
      rarity = k;
      break;
    }
  }
  const pool = RODS.filter((x) => x.rarity === rarity && x.id !== 'rod_bamboo');
  const rod = (pool.length > 0 ? pool : RODS.filter((x) => x.id !== 'rod_bamboo'))[
    Math.floor(Math.random() * (pool.length > 0 ? pool.length : RODS.length))
  ];
  const wasOwned = g.fishingGear.rods.includes(rod.id);
  
  // Áp dụng tỉ lệ hạn dùng riêng của từng hộp: Hộp VIP có tỉ lệ cần VIP và vĩnh viễn cao hơn
  let duration: DurationRoll = '1d';
  if (box.durationOdds) {
    const dr = Math.random();
    if (dr < box.durationOdds.perm) duration = 'perm';
    else if (dr < box.durationOdds.perm + box.durationOdds['7d']) duration = '7d';
    else if (dr < box.durationOdds.perm + box.durationOdds['7d'] + box.durationOdds['3d']) duration = '3d';
    else duration = '1d';
  } else {
    duration = rollItemDuration();
  }

  const status = applyItemDuration(g, rod.id, duration, wasOwned);
  const dup = status === 'dup_perm';
  let gold = 0;
  if (dup) {
    gold = ROD_DUP_GOLD[rod.rarity];
    earnGold(g, gold);
  } else if (!wasOwned) {
    g.fishingGear.rods.push(rod.id);
    addToHotbar(g, rod.id, false);
  }
  return { rod, dup, gold, duration, status };
}

export function buyBait(g: GameState, id: string): string {
  const b = BAIT_SHOP.find((x) => x.id === id);
  if (!b) fail('Không bán mồi này');
  if (b.gems) spendGems(g, b.gems);
  else spendGold(g, b.price);
  addItem(g, id, b.qty);
  return `Đã mua ${ITEMS[id]?.emoji ?? '🪱'} ${ITEMS[id]?.name ?? b.name} ×${b.qty}`;
}

/** Hộp mồi may mắn — rẻ, ra ngẫu nhiên nhiều loại */
export function buyBaitBox(g: GameState): string {
  spendGold(g, BAIT_BOX.price);
  const n = BAIT_BOX.min + Math.floor(Math.random() * (BAIT_BOX.max - BAIT_BOX.min + 1));
  const got: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    let r = Math.random();
    for (const [id, p] of Object.entries(BAIT_BOX.odds)) {
      r -= p;
      if (r <= 0) {
        got[id] = (got[id] ?? 0) + 1;
        break;
      }
    }
  }
  for (const [id, q] of Object.entries(got)) addItem(g, id, q);
  return `🎁 Hộp mồi: ${Object.entries(got).map(([id, q]) => `${ITEMS[id].emoji}×${q}`).join(' ')}`;
}

// ---------------- Thả diều

export function buyKite(g: GameState, id: string): string {
  const k = KITE_BY_ID[id];
  if (!k) fail('Không có diều này');
  const wasOwned = g.kites.owned.includes(id);
  if (wasOwned && isPermanent(g, id)) fail('Bạn đã sở hữu Vĩnh Viễn diều này rồi');
  if (k.gems) spendGems(g, k.gems);
  else if (k.price) spendGold(g, k.price);
  else fail('Diều này chỉ có trong hộp diều');
  const dur = rollItemDuration();
  const status = applyItemDuration(g, id, dur, wasOwned);
  if (!wasOwned) g.kites.owned.push(id);
  g.kites.equipped = id;
  return `${k.emoji} Đã mua ${k.name} · [${durationLabel(dur, status)}] — lên Đồi Gió thả thôi!`;
}

export function equipKite(g: GameState, id: string): string {
  if (!g.kites.owned.includes(id)) fail('Bạn chưa có diều này');
  g.kites.equipped = id;
  return `Đã chọn ${KITE_BY_ID[id].name}`;
}

export interface KiteBoxResult {
  kite: KiteDef;
  dup: boolean;
  gold: number;
  duration: DurationRoll;
  status: DurationStatus;
}

/** bốc 1 diều theo tỉ lệ hộp (chỉ tính các bậc từ minRank trở lên) */
function rollKite(odds: Partial<Record<RodRarity, number>>, minRank = 0): KiteDef {
  const list = (Object.entries(odds) as [RodRarity, number][]).filter(([r]) => rarityRank(r) >= minRank);
  let roll = Math.random() * list.reduce((s, [, p]) => s + p, 0);
  let rarity = list[list.length - 1][0];
  for (const [r, p] of list) {
    roll -= p;
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  const pool = KITES.filter((k) => k.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Mở n hộp diều (1 hoặc 10). Mở ×10 chắc chắn có ít nhất 1 diều SR trở lên + quay hạn sử dụng 1 / 3 / 7 Ngày / 0.0001% Vĩnh Viễn. */
export function openKiteBox(g: GameState, boxId: string, n: number): KiteBoxResult[] {
  const box = KITE_BOXES.find((b) => b.id === boxId);
  if (!box) fail('Không có hộp này');
  if (box.gems) spendGems(g, box.gems * n);
  else spendGold(g, box.price * n);
  const kites = Array.from({ length: n }, () => rollKite(box.odds));
  const sr = rarityRank('SR');
  if (n >= 10 && !kites.some((k) => rarityRank(k.rarity) >= sr)) kites[n - 1] = rollKite(box.odds, sr);
  return kites.map((kite) => {
    const wasOwned = g.kites.owned.includes(kite.id);
    const duration = rollItemDuration();
    const status = applyItemDuration(g, kite.id, duration, wasOwned);
    if (status === 'dup_perm') {
      const gold = KITE_DUP_GOLD[kite.rarity];
      earnGold(g, gold);
      return { kite, dup: true, gold, duration, status };
    }
    if (!wasOwned) g.kites.owned.push(kite.id);
    if (!g.kites.equipped) g.kites.equipped = kite.id;
    return { kite, dup: false, gold: 0, duration, status };
  });
}

export interface KiteRun {
  alt: number;
  coins: number;
  gifts: number;
  crashed: boolean;
}

export interface KiteResult {
  gold: number;
  coinsKept: number;
  gifts: Reward;
  record: boolean;
  buff: boolean;
}

/** kết thúc 1 lượt thả diều — tính thưởng ở đây (không tin số liệu UI quá giới hạn) */
export function finishKiteRun(g: GameState, run: KiteRun, now: number): KiteResult {
  const k = KITE_BY_ID[g.kites.equipped ?? ''];
  if (!k) fail('Bạn chưa có diều');
  const alt = Math.max(0, Math.min(KITE_MAX.alt, Math.floor(run.alt)));
  const coins = Math.max(0, Math.min(KITE_MAX.coins, Math.floor(run.coins)));
  const giftN = Math.max(0, Math.min(KITE_MAX.gifts, Math.floor(run.gifts)));
  const coinsKept = Math.floor(coins * (run.crashed ? KITE_CRASH_KEEP : 1));
  const gold = Math.round(coinsKept * KITE_COIN_GOLD * (kitePlay(k.id).coin ?? 1) * (1 + 0.08 * g.player.level) + alt * KITE_ALT_GOLD);
  if (gold > 0) earnGold(g, gold);
  const gifts: Reward = { items: {} };
  const total = KITE_GIFTS.reduce((s, x) => s + x.weight, 0);
  for (let i = 0; i < giftN; i++) {
    let r = Math.random() * total;
    const pickG = KITE_GIFTS.find((x) => (r -= x.weight) < 0) ?? KITE_GIFTS[0];
    if (pickG.reward.gems) gifts.gems = (gifts.gems ?? 0) + pickG.reward.gems;
    for (const [id, n] of Object.entries(pickG.reward.items ?? {})) gifts.items![id] = (gifts.items![id] ?? 0) + n;
  }
  giveReward(g, gifts);
  const buff = alt >= KITE_BUFF_ALT;
  if (buff) {
    g.kiteBuffUntil = now + k.minutes * 60_000;
    g.kiteBuffMult = k.mult;
  }
  const record = alt > g.kiteBest;
  g.kiteBest = Math.max(g.kiteBest, alt);
  g.weekStats.kiteBest = Math.max(g.weekStats.kiteBest ?? 0, alt);
  g.stats.kites++;
  g.weekStats.kites++;
  storyTrack(g, 'kite');
  return { gold, coinsKept, gifts, record, buff };
}

/** Mở nhiều hộp một lần (trả đủ tiền trước) */
export function openRodBoxMany(g: GameState, boxId: string, n: number): BoxResult[] {
  const box = ROD_BOXES.find((b) => b.id === boxId);
  if (!box) fail('Không có hộp này');
  if (box.gems ? g.gems < box.gems * n : g.gold < box.price * n) fail(`Không đủ ${box.gems ? 'kim cương' : 'vàng'} để mở ${n} hộp`);
  return Array.from({ length: n }, () => openRodBox(g, boxId));
}

/**
 * Tự động đồng bộ và nạp cá vào Kho Cá nếu người chơi từng câu được cá trước đó
 */
export function syncFishBag(g: GameState): CaughtFish[] {
  if (!g.fishing) {
    (g as any).fishing = { best: {}, biggest: null, week: { key: weekKey(Date.now()), points: 0, lastResult: null }, fishBag: [] };
  }
  if (!g.fishing.fishBag) g.fishing.fishBag = [];

  // 1. Chuyển đổi cá đang có trong g.inventory vào fishBag và dọn sạch g.inventory
  if (g.inventory) {
    for (const [id, count] of Object.entries(g.inventory)) {
      if (count > 0 && (id.startsWith('fish_') || FISH_BY_ID[id])) {
        const f = FISH_BY_ID[id];
        if (f) {
          for (let i = 0; i < count; i++) {
            const cm = g.fishing.best[id] ?? Math.round(f.cm[0] + (f.cm[1] - f.cm[0]) * 0.45);
            const pct = f.cm[1] > f.cm[0] ? (cm - f.cm[0]) / (f.cm[1] - f.cm[0]) : 0.5;
            const tier = sizeTierOf(pct);
            const tierName = SIZE_TIERS[tier].name;
            const isSuper = !!f.isSuperRare;
            const priceGold = Math.round(f.price * SIZE_TIERS[tier].mult * (0.8 + (cm / f.cm[0]) * 0.2));
            const priceGems = f.gemPrice ? Math.round(f.gemPrice * SIZE_TIERS[tier].mult) : undefined;
            const zoneId = f.zoneId ?? 1;
            const zone = ZONE_BY_ID[zoneId] ?? FISHING_ZONES[0];

            g.fishing.fishBag.push({
              uuid: 'fish_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36) + '_' + i,
              id: f.id,
              name: f.name,
              emoji: f.emoji,
              rarity: isSuper ? 'mythic' : (f.rare ? (f.price > 400 ? 'epic' : 'rare') : 'common'),
              zoneId,
              zoneName: zone.name,
              season: (f.season as any) ?? 'spring',
              cm,
              kg: fishKg(cm),
              tier,
              tierName,
              caughtAt: Date.now() - (i + 1) * 3600000,
              isSuperRare: isSuper,
              priceGold,
              priceGems,
              locked: isSuper,
            });
          }
        }
        delete g.inventory[id];
      }
    }
  }

  // 2. Chuyển đổi cá đang có trong g.chest.items (nếu người chơi từng nhét vào rương) vào fishBag và dọn sạch g.chest
  if (g.chest?.items) {
    for (const [id, count] of Object.entries(g.chest.items)) {
      if (count > 0 && (id.startsWith('fish_') || FISH_BY_ID[id])) {
        const f = FISH_BY_ID[id];
        if (f) {
          for (let i = 0; i < count; i++) {
            const cm = g.fishing.best[id] ?? Math.round(f.cm[0] + (f.cm[1] - f.cm[0]) * 0.45);
            const pct = f.cm[1] > f.cm[0] ? (cm - f.cm[0]) / (f.cm[1] - f.cm[0]) : 0.5;
            const tier = sizeTierOf(pct);
            const tierName = SIZE_TIERS[tier].name;
            const isSuper = !!f.isSuperRare;
            const priceGold = Math.round(f.price * SIZE_TIERS[tier].mult * (0.8 + (cm / f.cm[0]) * 0.2));
            const priceGems = f.gemPrice ? Math.round(f.gemPrice * SIZE_TIERS[tier].mult) : undefined;
            const zoneId = f.zoneId ?? 1;
            const zone = ZONE_BY_ID[zoneId] ?? FISHING_ZONES[0];

            g.fishing.fishBag.push({
              uuid: 'fish_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36) + '_' + i,
              id: f.id,
              name: f.name,
              emoji: f.emoji,
              rarity: isSuper ? 'mythic' : (f.rare ? (f.price > 400 ? 'epic' : 'rare') : 'common'),
              zoneId,
              zoneName: zone.name,
              season: (f.season as any) ?? 'spring',
              cm,
              kg: fishKg(cm),
              tier,
              tierName,
              caughtAt: Date.now() - (i + 1) * 3600000,
              isSuperRare: isSuper,
              priceGold,
              priceGems,
              locked: isSuper,
            });
          }
        }
        delete g.chest.items[id];
      }
    }
  }

  // Tuyệt đối không tự động sinh cá mẫu khi đã bán hết cá: bán hết là trống hoàn toàn
  return g.fishing.fishBag;
}

/**
 * Bản online: cá do server quyết định (fish_finish). Ghi lại kỷ lục trên máy và lưu vào Kho Cá
 */
export function recordServerCatch(
  g: GameState,
  fishId: string,
  cm: number,
  points?: number,
  now: number = Date.now(),
): ServerCatchResult {
  const prevRank = playerRank(g, now, 'fish');
  g.stats.fish++;
  track(g, 'fish');
  storyTrack(g, 'fish');
  const f = FISH_BY_ID[fishId];
  if (!f) return { titles: [] };
  if (cm > (g.fishing.best[fishId] ?? 0)) g.fishing.best[fishId] = cm;
  if (!g.fishing.biggest || cm > g.fishing.biggest.cm) g.fishing.biggest = { id: fishId, cm };
  const pctIn = f.cm[1] > f.cm[0] ? Math.max(0, Math.min(1, (cm - f.cm[0]) / (f.cm[1] - f.cm[0]))) : 0;
  const tier = sizeTierOf(pctIn);
  const tierDef = SIZE_TIERS[tier];

  const isSuper = !!f.isSuperRare;
  const pts = points ?? Math.round(f.price * tierDef.mult * (0.5 + pctIn) * (isSuper ? 10 : 1));
  g.fishing.week.points = (g.fishing.week.points || 0) + pts;

  // Cập nhật ngay bộ nhớ đệm remote.weeks của phiên hiện tại để BXH hiển thị điểm mới nhất tức thì
  if (remote.enabled && remote.me && remote.weeks[g.fishing.week.key]) {
    const meRow = remote.weeks[g.fishing.week.key].find((r) => r.id === remote.me);
    if (meRow) {
      meRow.scores.fish = g.fishing.week.points;
      meRow.scores.fish_big = Math.max(meRow.scores.fish_big || 0, cm);
    }
  }

  // Lưu ngay vào fishBag cá nhân!
  if (!g.fishing.fishBag) g.fishing.fishBag = [];
  const season = getCurrentSeason(now).id;
  const zoneId = f.zoneId ?? 1;
  const zone = ZONE_BY_ID[zoneId] ?? FISHING_ZONES[0];
  const priceGold = Math.round(f.price * tierDef.mult * (0.8 + (cm / f.cm[0]) * 0.2));
  let priceGems = f.gemPrice ? Math.round(f.gemPrice * tierDef.mult) : undefined;
  if (!priceGems && tierDef.name === 'Khổng lồ' && f.rare) {
    priceGems = 2;
  }

  const caughtItem: CaughtFish = {
    uuid: 'fish_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36),
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    rarity: isSuper ? 'mythic' : (f.rare ? (f.price > 400 ? 'epic' : 'rare') : 'common'),
    zoneId,
    zoneName: zone.name,
    season,
    cm,
    kg: fishKg(cm),
    tier,
    tierName: tierDef.name,
    caughtAt: now,
    isSuperRare: isSuper,
    priceGold,
    priceGems,
    locked: isSuper,
  };
  g.fishing.fishBag.unshift(caughtItem);

  if (g.fishing.fishBag.length > 200) {
    const unlockedIdx = g.fishing.fishBag.findIndex((c) => !c.locked && !c.isSuperRare);
    if (unlockedIdx !== -1) g.fishing.fishBag.splice(unlockedIdx, 1);
  }

  // Kiểm tra bứt phá thứ hạng Top 1-5 Bảng Câu Cá để nhận và chuyển giao danh hiệu
  const newRank = playerRank(g, now, 'fish');
  let rankOvertake: FishOvertakeInfo | undefined;
  if (newRank >= 1 && newRank <= TOP_TITLE_COUNT && (prevRank === 0 || newRank < prevRank)) {
    const tId = topTitleId('fish', newRank);
    rankOvertake = { oldRank: prevRank, newRank, title: TITLE_BY_ID[tId] };
    g.titles.active = tId;
  }
  syncTopTitles(g, now);

  const titles = checkFishTitles(g, { id: fishId, cm, tier, titleReward: f.titleReward });
  return { titles, rankOvertake };
}
