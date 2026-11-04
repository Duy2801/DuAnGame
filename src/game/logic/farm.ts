import { BUILDING_BY_ID, BUMPER_CHANCE, BUMPER_MULT, CROP_BY_ID, FARM_SUPPLIES, ITEMS, MAX_PLOTS, RANCH_SUPPLIES, RECIPE_BY_ID, plotCost } from '../config/farm';
import { RANKS, rankIndex } from '../config/guild';
import type { BuildingId, CropDef, FertilizerKind, GameState, Plot } from '../types';
import { fail, fmt } from '../utils';
import { addItem, itemCount, removeItem, spendGold, track } from './core';
import { effectiveKitchenLevel, houseGoldPerMin } from './life';
import { storyTrack } from './story';

export const growMs = (g: GameState, crop: CropDef) => crop.growSec * 1000 * (1 - 0.08 * g.buildings.well);

/** vàng mỗi giây từ Cối xay gió + nhà sở hữu */
export const passiveRate = (g: GameState) => (g.buildings.windmill * 5 + houseGoldPerMin(g)) / 60;

export const offlineCapMs = (g: GameState) => (2 + g.buildings.barn * 2) * 3_600_000;

export type PlotCareStep = 'empty' | 'water' | 'fertilize' | 'weed' | 'ready' | 'growing';

/**
 * Kiểm tra trạng thái chăm sóc của ô đất:
 * Cây muốn lớn và kết trái bắt buộc phải: Tưới nước (watered) + Bón phân (fertilized) + Làm cỏ/Bắt sâu (weeded & !pest).
 */
export function plotCareStep(p: Plot | undefined, now: number): PlotCareStep {
  if (!p || !p.cropId) return 'empty';
  if (p.watered === false) return 'water';
  if (p.fertilized === false) return 'fertilize';
  if (p.weeded === false || p.pest) return 'weed';
  return now >= p.readyAt ? 'ready' : 'growing';
}

export const isReady = (p: Plot, now: number) =>
  p.cropId !== null && p.watered !== false && p.fertilized !== false && p.weeded !== false && !p.pest && now >= p.readyAt;

function plantOne(g: GameState, plot: Plot, crop: CropDef, now: number, autoFert?: FertilizerKind) {
  if (rankIndex(g.guildXp) < crop.rankReq) fail(`Cần Hội rank ${RANKS[crop.rankReq].name} để trồng ${crop.name}`);
  // có hạt trong túi thì dùng, hết hạt thường thì tự mua tại chỗ
  if (itemCount(g, `seed_${crop.id}`) > 0 || crop.seedCost === null) removeItem(g, `seed_${crop.id}`, 1);
  else spendGold(g, crop.seedCost);
  plot.cropId = crop.id;
  plot.plantedAt = now;
  plot.readyAt = now + growMs(g, crop);
  plot.watered = false;
  plot.fertilized = false;
  plot.fertilizer = undefined;
  plot.weeded = false;
  plot.pest = Math.random() < 0.45;
  if (autoFert) {
    const sup = FARM_SUPPLIES.find((s) => s.fert === autoFert)!;
    if (itemCount(g, sup.id) > 0) {
      removeItem(g, sup.id, 1);
      plot.fertilized = true;
      plot.fertilizer = autoFert;
      plot.readyAt = now + Math.max(3000, Math.round((plot.readyAt - now) * (1 - (sup.speedCut ?? 0.1))));
    }
  }
  track(g, 'plant');
}

export function plant(g: GameState, plotId: number, cropId: string, now: number, autoFert?: FertilizerKind) {
  const plot = g.plots.find((p) => p.id === plotId);
  if (!plot || plot.cropId) fail('Ô đất này không trống');
  plantOne(g, plot, CROP_BY_ID[cropId], now, autoFert);
}

export function plantAll(g: GameState, cropId: string, now: number, autoFert?: FertilizerKind): string {
  const crop = CROP_BY_ID[cropId];
  let n = 0;
  for (const plot of g.plots) {
    if (plot.cropId) continue;
    try {
      plantOne(g, plot, crop, now, autoFert);
      n++;
    } catch (e) {
      if (n === 0) throw e;
      break;
    }
  }
  return `🌱 Đã gieo ${crop.emoji} ${crop.name} vào ${n} ô — nhớ tưới nước & bón phân nhé!`;
}

/** 💧 Tưới nước cho ô đất */
export function waterPlot(g: GameState, plotId: number, now: number): string {
  const plot = g.plots.find((p) => p.id === plotId);
  if (!plot || !plot.cropId) fail('Ô đất chưa gieo hạt');
  if (plot.watered !== false) fail('Ô đất này đã đủ độ ẩm rồi');
  plot.watered = true;
  const rem = Math.max(0, plot.readyAt - now);
  plot.readyAt = now + Math.round(rem * 0.85);
  const crop = CROP_BY_ID[plot.cropId];
  return `💧 Đã tưới nước mát cho ${crop.emoji} ${crop.name}!`;
}

/** 🌿 Bón phân cho ô đất (nếu hết trong túi sẽ tự mua Phân hữu cơ tại chỗ) */
export function fertilizePlot(g: GameState, plotId: number, kind: FertilizerKind = 'basic', now: number = Date.now()): string {
  const plot = g.plots.find((p) => p.id === plotId);
  if (!plot || !plot.cropId) fail('Ô đất chưa gieo hạt');
  if (plot.fertilized && plot.fertilizer === 'gold') fail('Ô đất đã bón Phân Hoàng Kim tối đa');
  const sup = FARM_SUPPLIES.find((s) => s.fert === kind) ?? FARM_SUPPLIES[0];
  if (itemCount(g, sup.id) > 0) {
    removeItem(g, sup.id, 1);
  } else {
    spendGold(g, sup.price);
  }
  plot.fertilized = true;
  plot.fertilizer = kind;
  const rem = Math.max(0, plot.readyAt - now);
  plot.readyAt = now + Math.round(rem * (1 - (sup.speedCut ?? 0.1)));
  const crop = CROP_BY_ID[plot.cropId];
  return `${sup.emoji} Đã bón ${sup.name} cho ${crop.emoji} ${crop.name}!`;
}

/** 🐛 Làm cỏ / Bắt sâu hoặc xịt thuốc thảo mộc */
export function weedPlot(g: GameState, plotId: number, now: number, useSpray = false): string {
  const plot = g.plots.find((p) => p.id === plotId);
  if (!plot || !plot.cropId) fail('Ô đất chưa gieo hạt');
  if (plot.weeded !== false && !plot.pest) fail('Ô đất đã sạch cỏ và không có sâu');
  const hadPest = !!plot.pest;
  let usedSpray = false;
  if ((useSpray || hadPest) && itemCount(g, 'pesticide') > 0) {
    removeItem(g, 'pesticide', 1);
    usedSpray = true;
  }
  plot.weeded = true;
  plot.pest = false;
  const rem = Math.max(0, plot.readyAt - now);
  plot.readyAt = now + Math.round(rem * (usedSpray ? 0.8 : 0.9));
  const crop = CROP_BY_ID[plot.cropId];
  return usedSpray
    ? `🧴 Đã xịt thuốc thảo mộc diệt sâu cho ${crop.emoji} ${crop.name}!`
    : `🐛 Đã bắt sâu & nhổ sạch cỏ cho ${crop.emoji} ${crop.name}!`;
}

/** Chăm sóc đồng loạt toàn bộ ruộng */
export function waterAllPlots(g: GameState, now: number): string {
  let n = 0;
  for (const p of g.plots) {
    if (p.cropId && p.watered === false) {
      waterPlot(g, p.id, now);
      n++;
    }
  }
  if (!n) fail('Tất cả các ô đang trồng đều đã được tưới nước');
  return `💧 Đã tưới nước cho ${n} ô ruộng!`;
}

export function fertilizeAllPlots(g: GameState, kind: FertilizerKind, now: number): string {
  let n = 0;
  for (const p of g.plots) {
    if (p.cropId && p.fertilized === false) {
      try {
        fertilizePlot(g, p.id, kind, now);
        n++;
      } catch (e) {
        if (n === 0) throw e;
        break;
      }
    }
  }
  if (!n) fail('Không có ô nào đang thiếu phân bón');
  const sup = FARM_SUPPLIES.find((s) => s.fert === kind) ?? FARM_SUPPLIES[0];
  return `${sup.emoji} Đã bón ${sup.name} cho ${n} ô ruộng!`;
}

export function weedAllPlots(g: GameState, now: number): string {
  let n = 0;
  for (const p of g.plots) {
    if (p.cropId && (p.weeded === false || p.pest)) {
      weedPlot(g, p.id, now, false);
      n++;
    }
  }
  if (!n) fail('Ruộng vườn đã sạch cỏ và sâu bệnh');
  return `🐛 Đã làm cỏ & bắt sâu cho ${n} ô ruộng!`;
}

/** Mua vật tư nông nghiệp / thú y */
export function buyFarmSupply(g: GameState, supplyId: string, qty: number): string {
  const s = [...FARM_SUPPLIES, ...RANCH_SUPPLIES].find((x) => x.id === supplyId);
  if (!s) fail('Vật tư không hợp lệ');
  const cost = Math.round(s.price * qty * (qty >= 10 ? 0.85 : 1));
  spendGold(g, cost);
  addItem(g, s.id, qty);
  return `${s.emoji} Đã mua ${s.name} ×${qty} (🪙${fmt(cost)})`;
}

function collect(g: GameState, plot: Plot): { crop: CropDef; qty: number; bumper: boolean } {
  const crop = CROP_BY_ID[plot.cropId!];
  const fertDef = FARM_SUPPLIES.find((s) => s.fert === plot.fertilizer);
  const bumperBonus = fertDef?.bumperBonus ?? 0;
  const bumper = Math.random() < BUMPER_CHANCE + 0.01 * g.buildings.well + bumperBonus;
  const qty = crop.yield * (bumper ? BUMPER_MULT : 1);
  addItem(g, crop.id, qty);
  g.stats.harvested++;
  g.weekStats.harvest++;
  track(g, 'harvest');
  storyTrack(g, 'harvest');
  plot.cropId = null;
  plot.watered = undefined;
  plot.fertilized = undefined;
  plot.fertilizer = undefined;
  plot.weeded = undefined;
  plot.pest = undefined;
  return { crop, qty, bumper };
}

export function harvest(g: GameState, plotId: number, now: number): string {
  const plot = g.plots.find((p) => p.id === plotId);
  if (!plot || !plot.cropId) fail('Ô đất đang trống');
  const step = plotCareStep(plot, now);
  if (step === 'water') fail('💧 Cây đang khát nước — hãy tưới nước trước!');
  if (step === 'fertilize') fail('🌿 Cây thiếu dinh dưỡng — hãy bón phân để cây kết trái!');
  if (step === 'weed') fail('🐛 Ô đất có sâu/cỏ dại — hãy bắt sâu & làm cỏ trước!');
  if (!isReady(plot, now)) fail('Cây chưa chín');
  const { crop, qty, bumper } = collect(g, plot);
  return `${bumper ? '🌟 BỘI THU! ' : ''}+${qty} ${crop.emoji} ${crop.name}`;
}

export function harvestAll(g: GameState, now: number): string {
  const got: Record<string, number> = {};
  let bumpers = 0;
  for (const plot of g.plots) {
    if (!isReady(plot, now)) continue;
    const { crop, qty, bumper } = collect(g, plot);
    got[crop.emoji] = (got[crop.emoji] ?? 0) + qty;
    if (bumper) bumpers++;
  }
  const parts = Object.entries(got).map(([e, n]) => `${e}×${n}`);
  if (!parts.length) fail('Chưa có ô nào chín');
  return `Thu hoạch: ${parts.join(' ')}${bumpers ? ` · 🌟 ${bumpers} ô bội thu!` : ''}`;
}

export function buyPlot(g: GameState): string {
  if (g.plots.length >= MAX_PLOTS) fail('Đã đạt số ô đất tối đa');
  spendGold(g, plotCost(g.plots.length));
  g.plots.push({ id: g.plots.length, cropId: null, plantedAt: 0, readyAt: 0 });
  track(g, 'upgrade');
  return `Mở rộng nông trại: ${g.plots.length} ô đất`;
}

export function upgradeBuilding(g: GameState, id: BuildingId): string {
  const def = BUILDING_BY_ID[id];
  const lvl = g.buildings[id];
  if (lvl >= def.maxLevel) fail('Công trình đã đạt cấp tối đa');
  spendGold(g, def.cost(lvl));
  g.buildings[id] = lvl + 1;
  track(g, 'upgrade');
  return `${def.emoji} ${def.name} lên cấp ${lvl + 1}`;
}

/** nấu nhiều phần một lúc (tới khi hết nguyên liệu hoặc đủ n) */
export function cookMany(g: GameState, recipeId: string, n: number): string {
  const r = RECIPE_BY_ID[recipeId];
  const can = Math.min(n, ...Object.entries(r.inputs).map(([id, q]) => Math.floor(itemCount(g, id) / q)));
  if (can < 1) return cook(g, recipeId);
  for (let i = 0; i < can; i++) cook(g, recipeId);
  return `Đã nấu ${r.emoji} ${r.name} ×${can}`;
}

export function cook(g: GameState, recipeId: string): string {
  const r = RECIPE_BY_ID[recipeId];
  if (effectiveKitchenLevel(g) < r.kitchenLevel) fail(`Cần Bếp cấp ${r.kitchenLevel}`);
  for (const [id, n] of Object.entries(r.inputs)) {
    if (itemCount(g, id) < n) fail(`Thiếu ${ITEMS[id].name} (cần ${n})`);
  }
  for (const [id, n] of Object.entries(r.inputs)) removeItem(g, id, n);
  addItem(g, r.id, 1);
  g.stats.cooked++;
  track(g, 'cook');
  return `Đã nấu ${r.emoji} ${r.name}`;
}
