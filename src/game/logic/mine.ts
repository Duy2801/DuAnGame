import { HEAL_ITEMS } from '../config/combat';
import { POTION_BY_ID } from '../config/equipment';
import { ITEMS } from '../config/farm';
import {
  MINE_CHECKPOINT, MINE_CHEST, MINE_COLS, MINE_ENERGY, MINE_FOOD_DIV, MINE_HP_PER_FLOORS, MINE_ROWS, PICKAXES, ROCKS, ROCK_BY_ID,
} from '../config/mine';
import type { GameState, MineCell } from '../types';
import { fail, fmt, randInt } from '../utils';
import { addItem, earnGold, itemCount, removeItem, spendGold, track } from './core';

export const maxEnergy = (g: GameState) => MINE_ENERGY.base + MINE_ENERGY.perPick * g.mine.pick;

/** thể lực hiện tại (đã tính phần tự hồi) */
export function energyNow(g: GameState, now: number) {
  const m = g.mine;
  const regen = Math.floor(Math.max(0, now - m.energyAt) / MINE_ENERGY.regenMs);
  return Math.min(maxEnergy(g), m.energy + regen);
}

/** chốt thể lực vào state, giữ phần lẻ thời gian hồi */
function syncEnergy(g: GameState, now: number) {
  const m = g.mine;
  const max = maxEnergy(g);
  const regen = Math.floor(Math.max(0, now - m.energyAt) / MINE_ENERGY.regenMs);
  if (m.energy + regen >= max) {
    m.energy = Math.max(m.energy, max);
    m.energyAt = now;
  } else {
    m.energy += regen;
    m.energyAt += regen * MINE_ENERGY.regenMs;
  }
}

/** thời gian tới khi hồi thêm 1 thể lực */
export const nextEnergyMs = (g: GameState, now: number) =>
  energyNow(g, now) >= maxEnergy(g) ? 0 : MINE_ENERGY.regenMs - ((now - g.mine.energyAt) % MINE_ENERGY.regenMs);

function rollRock(floor: number): MineCell {
  const pool = ROCKS.filter((r) => r.from <= floor);
  // tầng sâu: quặng thường hiếm dần, quặng quý nhiều dần
  const weight = (r: (typeof ROCKS)[number]) => r.weight * (r.from > 1 ? 1 + Math.min(1.5, (floor - r.from) / 30) : 1);
  let x = Math.random() * pool.reduce((s, r) => s + weight(r), 0);
  const rock = pool.find((r) => (x -= weight(r)) < 0) ?? pool[0];
  const hp = rock.hp + Math.floor(floor / MINE_HP_PER_FLOORS);
  return { rock: rock.id, hp, max: hp, ladder: false };
}

function makeFloor(floor: number): MineCell[] {
  const cells = Array.from({ length: MINE_COLS * MINE_ROWS }, () => rollRock(floor));
  // thang giấu dưới 1 tảng đá thường bất kỳ
  const plain = cells.map((c, i) => [c, i] as const).filter(([c]) => c.rock === 'dirt' || c.rock === 'stone');
  const [, at] = plain.length ? plain[randInt(0, plain.length - 1)] : [cells[0], 0];
  cells[at].ladder = true;
  return cells;
}

/** các tầng xuất phát được: tầng 1 + các thang máy đã mở */
export const mineStarts = (g: GameState) => {
  const out = [1];
  for (let f = MINE_CHECKPOINT; f <= g.mine.deepest; f += MINE_CHECKPOINT) out.push(f);
  return out;
};

export function enterMine(g: GameState, floor: number): string {
  if (!mineStarts(g).includes(floor)) fail('Chưa mở thang máy tới tầng này');
  g.mine.run = { floor, cells: makeFloor(floor), ladder: false };
  reachFloor(g, floor);
  return `⛏️ Xuống tầng ${floor}`;
}

function reachFloor(g: GameState, floor: number) {
  g.mine.deepest = Math.max(g.mine.deepest, floor);
  g.weekStats.mineBest = Math.max(g.weekStats.mineBest ?? 0, floor);
}

export interface HitResult {
  broken: boolean;
  text: string;
  ladder: boolean;
}

export function hitRock(g: GameState, idx: number, now: number): HitResult {
  const run = g.mine.run;
  if (!run) fail('Chưa vào hang');
  const cell = run.cells[idx];
  if (!cell || cell.hp <= 0) fail('Ô này đã đào rồi');
  syncEnergy(g, now);
  if (g.mine.energy < 1) fail('Hết thể lực! Nghỉ một lát hoặc ăn đồ ăn để hồi');
  g.mine.energy--;
  cell.hp = Math.max(0, cell.hp - PICKAXES[g.mine.pick].power);
  if (cell.hp > 0) return { broken: false, text: '', ladder: false };

  const rock = ROCK_BY_ID[cell.rock];
  let text = '';
  if (rock.loot) {
    const n = randInt(rock.loot.qty[0], rock.loot.qty[1]);
    addItem(g, rock.loot.item, n);
    g.stats.ores += n;
    text = `${ITEMS[rock.loot.item].emoji}×${n}`;
  } else if (rock.id === 'chest') {
    const gold = Math.round(MINE_CHEST.goldPerFloor * run.floor * (0.7 + Math.random() * 0.6));
    earnGold(g, gold);
    text = `🪙${fmt(gold)}`;
    if (Math.random() < MINE_CHEST.gemChance) {
      const gems = randInt(MINE_CHEST.gems[0], MINE_CHEST.gems[1]);
      g.gems += gems;
      text += ` 💎${gems}`;
    }
  } else if (Math.random() < 0.08) {
    // đá thường thỉnh thoảng có vài xu
    const gold = randInt(2, 4) * run.floor;
    earnGold(g, gold);
    text = `🪙${gold}`;
  }
  if (cell.ladder) {
    run.ladder = true;
    text = text ? `🪜 ${text}` : '🪜';
  }
  cell.got = text;
  return { broken: true, text, ladder: cell.ladder };
}

export function descend(g: GameState): string {
  const run = g.mine.run;
  if (!run) fail('Chưa vào hang');
  if (!run.ladder) fail('Chưa tìm thấy thang 🪜 — đập đá để tìm');
  const floor = run.floor + 1;
  g.mine.run = { floor, cells: makeFloor(floor), ladder: false };
  reachFloor(g, floor);
  return floor % MINE_CHECKPOINT === 0 ? `🛗 Tầng ${floor}: mở thang máy! Lần sau xuống thẳng tầng này` : `⬇️ Tầng ${floor}`;
}

export function leaveMine(g: GameState): string {
  g.mine.run = null;
  return '☀️ Đã lên mặt đất';
}

/** cộng thêm thể lực đào mỏ (trả về lượng thể lực thực tế được hồi) */
export function addMineEnergy(g: GameState, amount: number, now = Date.now()): number {
  syncEnergy(g, now);
  const max = maxEnergy(g);
  const before = g.mine.energy;
  g.mine.energy = Math.min(max, g.mine.energy + amount);
  return Math.max(0, g.mine.energy - before);
}

/** uống thuốc tăng lực hoặc ăn 1 món đồ ăn để hồi thể lực đào mỏ */
export function eatForEnergy(g: GameState, now: number): string {
  syncEnergy(g, now);
  const max = maxEnergy(g);
  if (g.mine.energy >= max) fail('Thể lực đã đầy');
  const tonic = Object.keys(POTION_BY_ID).find((id) => POTION_BY_ID[id].energy && itemCount(g, id) > 0);
  const food = tonic ?? Object.keys(HEAL_ITEMS).find((id) => ITEMS[id]?.kind === 'food' && itemCount(g, id) > 0);
  if (!food) fail('Không có thuốc tăng lực hay đồ ăn — ghé Tiệm Thuốc hoặc nấu ở Bếp nhé');
  removeItem(g, food, 1);
  const add = POTION_BY_ID[food]?.energy ?? Math.max(5, Math.round(HEAL_ITEMS[food] / MINE_FOOD_DIV));
  const gained = addMineEnergy(g, add, now);
  return `${ITEMS[food].emoji} +${gained} ⚡ thể lực`;
}

export function upgradePick(g: GameState): string {
  const cur = PICKAXES[g.mine.pick];
  if (!cur.cost) fail('Cuốc đã tối đa');
  for (const [id, n] of Object.entries(cur.cost.items)) if (itemCount(g, id) < n) fail(`Thiếu ${ITEMS[id].name} (cần ${n})`);
  spendGold(g, cur.cost.gold);
  for (const [id, n] of Object.entries(cur.cost.items)) removeItem(g, id, n);
  syncEnergy(g, Date.now());
  g.mine.pick++;
  track(g, 'upgrade');
  return `⛏️ Nâng cấp thành ${PICKAXES[g.mine.pick].name}! Sức đập ${PICKAXES[g.mine.pick].power}, thể lực tối đa ${maxEnergy(g)}`;
}
