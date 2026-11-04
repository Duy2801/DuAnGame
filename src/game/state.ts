import { START_PLOTS } from './config/farm';
import type { GameState } from './types';
import { dayKey, weekKey } from './utils';

/** Tăng khi đổi cấu trúc save không tương thích */
export const SAVE_VERSION = 4;

export function createInitialState(now: number): GameState {
  return {
    version: SAVE_VERSION,
    // x/y = -1: đặt ở điểm hồi sinh của bản đồ
    player: {
      level: 1, xp: 0, hp: 60, gear: { sword: 0, armor: 0 },
      equip: { weapon: 'wood_sword', armor: null, accessory: null }, owned: ['wood_sword'],
      map: 'town', x: -1, y: -1,
    },
    houses: [],
    activeHouse: null,
    furniture: [],
    chest: { items: {}, gear: [] },
    animals: [],
    story: { step: 0, accepted: false, progress: 0 },
    kiteBuffUntil: 0,
    kiteBuffMult: 1,
    cosmetics: { owned: [], wings: null, hat: null, pet: null, top: null, bottom: null, shoes: null, neck: null, ear: null, face: null },
    fishingGear: { rods: ['rod_bamboo'], rod: 'rod_bamboo' },
    fishing: { best: {}, biggest: null, week: { key: weekKey(now), points: 0, lastResult: null }, fishBag: [] },
    kites: { owned: [], equipped: null },
    waypoints: [],
    bounties: { dayKey: '', list: [] },
    maxZone: 0,
    redeemed: [],
    profile: { name: '', gender: 'm', hair: 0, hairStyle: 'short', skin: 1, eyes: 0, cloth: 0, created: false },
    hotbar: { slots: ['wood_sword', 'rod_bamboo', null, null, null, null, null, null, null, null], sel: 0 },
    titles: { owned: [], active: null },
    gold: 100,
    gems: 10,
    inventory: { seed_wheat: 12, seed_strawberry: 4, seed_watermelon: 2, fert_basic: 10, pesticide: 3, vet_vaccine: 3, bait_worm: 10 },
    plots: Array.from({ length: START_PLOTS }, (_, id) => ({ id, cropId: null, plantedAt: 0, readyAt: 0 })),
    buildings: { windmill: 0, well: 0, barn: 0, kitchen: 0, tavern: 0 },
    heroes: [
      { id: 1, name: 'Lâm', cls: 'warrior', rarity: 'N', level: 1 },
      { id: 2, name: 'Mai', cls: 'farmer', rarity: 'N', level: 1 },
    ],
    missions: [],
    guildXp: 0,
    daily: { dayKey: '', quests: [], points: 0, chests: [] },
    login: { index: -1, claimedDayKey: '' },
    week: { key: weekKey(now), gold: 0, lastResult: null },
    stats: { harvested: 0, goldEarned: 0, missionsDone: 0, kills: 0, fish: 0, kites: 0, cooked: 0, orders: 0, onlineGifts: 0, ores: 0 },
    mine: { energy: 60, energyAt: now, deepest: 0, pick: 0, run: null },
    orders: [],
    achievements: {},
    online: { dayKey: dayKey(now), ms: 0, claimed: [] },
    wheel: { dayKey: '', spins: 0 },
    buffs: {},
    itemExpiry: {},
    bossKills: {},
    weekStats: { key: weekKey(now), harvest: 0, kills: 0, kites: 0, kiteBest: 0, mineBest: 0, last: {} },
    kiteBest: 0,
    seq: 10,
    lastTick: now,
  };
}
