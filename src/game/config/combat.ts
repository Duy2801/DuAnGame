import type { BossSkill, GearSlot, MonsterAi, MonsterDef } from '../types';
import { SHOP_POTIONS } from './equipment';
import { zoneLevel } from './zones';

// ---- Chỉ số quái theo vùng: mạnh dần đều từ vùng 1 → 20

const base = (zone: number) => ({
  hp: 3.5 * (8 + 21 * (zone - 1)),
  atk: 6 + 9 * (zone - 1),
  xp: Math.max(8, 1.3 * zoneLevel(zone) ** 1.35),
  gold: 5 * 1.22 ** (zone - 1),
});

/** nguyên liệu rơi theo tầng vùng — dùng để cường hóa ở Lò rèn */
function tierDrop(zone: number) {
  if (zone <= 3) return { item: 'slime_gel', chance: 0.35, qty: 1 };
  if (zone <= 6) return { item: 'wolf_fang', chance: 0.35, qty: 1 };
  if (zone <= 9) return { item: 'goblin_relic', chance: 0.22, qty: 1 };
  if (zone <= 13) return { item: 'crystal', chance: 0.28, qty: 1 };
  if (zone <= 17) return { item: 'fire_core', chance: 0.25, qty: 1 };
  return { item: 'dragon_scale', chance: 0.16, qty: 1 };
}

interface Flavor {
  id: string;
  name: string;
  zone: number;
  tex?: string;
  ai?: MonsterAi;
  speed: number;
  aggro?: number;
  radius?: number;
  hp?: number;
  atk?: number;
  tint?: number;
  scale?: number;
  char?: boolean;
  extra?: MonsterDef['drops'];
}

function mob(f: Flavor): MonsterDef {
  const b = base(f.zone);
  const k = f.hp ?? 1;
  return {
    id: f.id, name: f.name, zone: f.zone, tex: f.tex ?? f.id, ai: f.ai ?? 'run',
    hp: Math.round(b.hp * k), atk: Math.round(b.atk * (f.atk ?? 1)), speed: f.speed, aggro: f.aggro ?? 95, radius: f.radius ?? 6,
    xp: Math.round(b.xp * k), gold: [Math.round(b.gold * 0.8), Math.round(b.gold * 1.25)],
    drops: [tierDrop(f.zone), ...(f.extra ?? [])], respawnMs: 9000,
    tint: f.tint, scale: f.scale, char: f.char,
  };
}

interface BossFlavor extends Flavor {
  skills: BossSkill[];
  /** màu hào quang dưới chân */
  aura: number;
  /** màu đạn (chiêu fire / nova) */
  shot?: number;
  /** quái được triệu hồi — mặc định là quái thường của vùng */
  minion?: string;
}

/** Boss canh đấu trường mỗi vùng: trâu, đau, nhiều chiêu; rơi vàng, kim cương, trang bị (xem logic/boss.ts) */
function boss(f: BossFlavor, gems: number): MonsterDef {
  const m = mob(f);
  const d = tierDrop(f.zone);
  return {
    ...m, boss: true, ai: f.ai ?? 'run', hp: m.hp * 18, atk: Math.round(m.atk * 1.6), xp: m.xp * 20,
    gold: [m.gold[0] * 50 + 150, m.gold[1] * 50 + 250], gems, respawnMs: 150_000, aggro: f.aggro ?? 140,
    drops: [{ ...d, chance: 1, qty: 4 }, ...(f.extra ?? [])],
    skills: f.skills, aura: f.aura, shot: f.shot, minion: f.minion,
  };
}

const LIST: MonsterDef[] = [
  mob({ id: 'slime', name: 'Slime', zone: 1, ai: 'hop', speed: 34, aggro: 70 }),
  boss({ id: 'king_slime', name: 'Vua Slime Hoàng Kim', zone: 1, tex: 'slime_king', ai: 'hop', speed: 30, scale: 1.6, radius: 14, skills: ['slam', 'summon'], aura: 0xffd23a }, 5),
  mob({ id: 'mushroom', name: 'Nấm độc', zone: 2, ai: 'hop', speed: 30, extra: [{ item: 'seed_mushroom', chance: 0.08, qty: 1 }] }),
  boss({ id: 'mushroom_lord', name: 'Chúa Tể Nấm Mộng', zone: 2, tex: 'mushroom', ai: 'hop', speed: 28, scale: 2.6, tint: 0xd090ff, radius: 14, skills: ['nova', 'summon', 'slam'], aura: 0xc080ff, shot: 0xd8a0ff }, 7),
  mob({ id: 'frog', name: 'Ếch đầm lầy', zone: 3, ai: 'hop', speed: 58, aggro: 85 }),
  boss({ id: 'frog_titan', name: 'Ếch Chúa Đầm Lầy', zone: 3, tex: 'frog', ai: 'hop', speed: 46, scale: 2.6, tint: 0x9aff7a, radius: 14, skills: ['charge', 'nova', 'slam'], aura: 0x7aff6a, shot: 0x9aff40 }, 9),
  mob({ id: 'wolf', name: 'Sói đen', zone: 4, speed: 66, aggro: 100, radius: 7 }),
  boss({ id: 'wolf_alpha', name: 'Sói Đầu Đàn Fenrir', zone: 4, tex: 'wolf', speed: 62, scale: 2.4, tint: 0x8a8aff, radius: 14, skills: ['charge', 'summon', 'charge', 'slam'], aura: 0x6a6aff }, 11),
  mob({ id: 'crab', name: 'Cua gai', zone: 5, speed: 40, hp: 1.3, atk: 0.9 }),
  boss({ id: 'crab_king', name: 'Vua Cua Khổng Lồ', zone: 5, tex: 'crab', speed: 34, scale: 2.6, tint: 0xff8a6a, radius: 14, skills: ['slam', 'nova', 'charge'], aura: 0xff7050, shot: 0x9fe0ff }, 20),
  mob({ id: 'goblin', name: 'Goblin', zone: 6, speed: 54, char: true }),
  boss({ id: 'goblin_warlord', name: 'Thủ Lĩnh Goblin', zone: 6, tex: 'goblin', char: true, speed: 50, scale: 2.1, radius: 12, skills: ['charge', 'summon', 'slam'], aura: 0x8ad040 }, 14),
  mob({ id: 'skeleton', name: 'Xương khô', zone: 7, speed: 46, char: true, hp: 1.1 }),
  boss({ id: 'lich', name: 'Vua Xương Lich', zone: 7, tex: 'skeleton', char: true, speed: 40, scale: 2.1, tint: 0xc8a8ff, radius: 12, skills: ['nova', 'summon', 'fire'], aura: 0x9a60ff, shot: 0xb080ff }, 16),
  mob({ id: 'bat', name: 'Dơi hang', zone: 8, ai: 'fly', speed: 82, aggro: 115, hp: 0.8 }),
  boss({ id: 'vampire_bat', name: 'Ma Cà Rồng Dơi', zone: 8, tex: 'bat', ai: 'fly', speed: 70, scale: 3, tint: 0xff4a6a, radius: 14, skills: ['charge', 'nova', 'summon'], aura: 0xff2040, shot: 0xff4060 }, 18),
  mob({ id: 'scorpion', name: 'Bọ cạp sa mạc', zone: 9, speed: 52, atk: 1.15, extra: [{ item: 'seed_fairyberry', chance: 0.03, qty: 1 }] }),
  boss({ id: 'scorpion_emperor', name: 'Hoàng Đế Bọ Cạp', zone: 9, tex: 'scorpion', speed: 48, scale: 2.6, tint: 0xffc84a, radius: 14, skills: ['fire', 'charge', 'slam'], aura: 0xffb020, shot: 0x9aff40 }, 20),
  mob({ id: 'stone_golem', name: 'Golem đá', zone: 10, tex: 'golem', speed: 28, radius: 10, hp: 1.5, tint: 0xb8a890 }),
  boss({ id: 'ancient_golem', name: 'Golem Cổ Đại', zone: 10, tex: 'golem', speed: 26, scale: 2.2, tint: 0xd8c070, radius: 18, skills: ['slam', 'nova', 'slam', 'charge'], aura: 0xf2c230, shot: 0xffe080 }, 35),
  mob({ id: 'snow_wolf', name: 'Sói tuyết', zone: 11, tex: 'wolf', speed: 72, aggro: 105, radius: 7, tint: 0xe0f0ff }),
  boss({ id: 'frost_wolf', name: 'Băng Lang Vương', zone: 11, tex: 'wolf', speed: 66, scale: 2.5, tint: 0xa8ecff, radius: 14, skills: ['charge', 'nova', 'summon'], aura: 0x7fe8ff, shot: 0xbfefff }, 24),
  mob({ id: 'snowman', name: 'Người tuyết', zone: 12, speed: 36, hp: 1.3, radius: 8 }),
  boss({ id: 'yeti_king', name: 'Vua Tuyết Yeti', zone: 12, tex: 'snowman', speed: 34, scale: 2.6, tint: 0xd8f4ff, radius: 14, skills: ['fire', 'slam', 'nova'], aura: 0xbfe8ff, shot: 0xffffff }, 26),
  mob({ id: 'crystal_golem', name: 'Golem pha lê', zone: 13, tex: 'golem', speed: 30, radius: 10, hp: 1.4 }),
  boss({ id: 'crystal_titan', name: 'Titan Pha Lê', zone: 13, tex: 'golem', speed: 28, scale: 2.3, tint: 0x80e8ff, radius: 18, skills: ['nova', 'slam', 'fire'], aura: 0x40c8ff, shot: 0x7fe8ff }, 28),
  mob({ id: 'ghost', name: 'Hồn ma', zone: 14, ai: 'fly', speed: 60, aggro: 120, hp: 0.9 }),
  boss({ id: 'banshee', name: 'Nữ Vương Hồn Ma', zone: 14, tex: 'ghost', ai: 'fly', speed: 56, scale: 2.6, tint: 0xb8a8ff, radius: 14, skills: ['nova', 'summon', 'charge', 'fire'], aura: 0x8a6aff, shot: 0xd0c0ff }, 30),
  mob({ id: 'spider', name: 'Nhện độc', zone: 15, speed: 70, aggro: 100 }),
  boss({ id: 'spider_queen', name: 'Nữ Hoàng Nhện', zone: 15, tex: 'spider', speed: 48, scale: 2.4, tint: 0xd080ff, radius: 14, skills: ['summon', 'fire', 'charge'], aura: 0xc040ff, shot: 0xe8e8e8 }, 50),
  mob({ id: 'orc', name: 'Orc chiến binh', zone: 16, speed: 46, char: true, scale: 1.35, hp: 1.4, atk: 1.15, radius: 8 }),
  boss({ id: 'ogre_king', name: 'Vua Orc Đại Chiến', zone: 16, tex: 'orc', char: true, speed: 44, scale: 2.3, radius: 14, skills: ['slam', 'charge', 'slam', 'summon'], aura: 0xe8402a }, 34),
  mob({ id: 'imp', name: 'Quỷ lửa', zone: 17, speed: 64 }),
  boss({ id: 'demon_lord', name: 'Quỷ Vương Hỏa Ngục', zone: 17, tex: 'imp', speed: 50, scale: 2.6, tint: 0xff5a3a, radius: 14, skills: ['fire', 'nova', 'summon', 'charge'], aura: 0xff3010, shot: 0xff8a30 }, 36),
  mob({ id: 'lava_golem', name: 'Golem dung nham', zone: 18, tex: 'golem', speed: 32, radius: 10, hp: 1.5, tint: 0xff7040 }),
  boss({ id: 'magma_colossus', name: 'Cự Thần Dung Nham', zone: 18, tex: 'golem', speed: 30, scale: 2.5, tint: 0xff5020, radius: 18, skills: ['slam', 'fire', 'nova'], aura: 0xff5020, shot: 0xff7a20 }, 38),
  mob({ id: 'dark_knight', name: 'Kỵ sĩ bóng tối', zone: 19, speed: 56, char: true, hp: 1.2, atk: 1.1 }),
  boss({ id: 'abyss_knight', name: 'Hắc Kỵ Sĩ Vực Thẳm', zone: 19, tex: 'dark_knight', char: true, speed: 56, scale: 2.2, radius: 13, skills: ['charge', 'nova', 'slam', 'summon'], aura: 0x8a3ad8, shot: 0xc060ff }, 40),
  mob({ id: 'dragon_whelp', name: 'Rồng con', zone: 20, tex: 'fire_dragon', speed: 48, scale: 0.5, tint: 0xffd060, radius: 8 }),
  boss({ id: 'fire_dragon', name: 'Rồng Lửa', zone: 20, ai: 'dragon', speed: 32, radius: 16, aggro: 170, skills: ['fire', 'slam', 'nova', 'fire', 'summon'], aura: 0xff6a20, shot: 0xff8a30 }, 80),
];

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(LIST.map((m) => [m.id, m]));

const mats = (m: object) => m as Record<string, number>;
/** quặng từ Hang Mỏ cần cho cường hóa: đồng → sắt → bạc → vàng */
const ore = (l: number, base: 'sword' | 'armor'): Record<string, number> => {
  if (l < 2) return {};
  const n = base === 'sword' ? 2 : 1;
  if (l <= 5) return { [base === 'sword' ? 'ore_copper' : 'ore_iron']: (l - 1) * n * 2 };
  if (l <= 9) return { ore_iron: (l - 4) * n * 2 };
  if (l <= 12) return { ore_silver: (l - 8) * n * 2 };
  return { ore_gold: (l - 11) * n * 2 };
};

/** Cường hóa ở Lò rèn — cộng thêm vào trang bị đang mặc */
export const GEAR: Record<GearSlot, { name: string; emoji: string; max: number; perLevel: string; cost: (l: number) => { gold: number; items: Record<string, number> } }> = {
  sword: {
    name: 'Cường hóa vũ khí', emoji: '🗡️', max: 15, perLevel: '+6 tấn công',
    cost: (l) => ({
      gold: Math.round(150 * 1.7 ** l),
      items: mats(
        { ...(l >= 12 ? { dragon_scale: l - 10 } : l >= 9 ? { fire_core: l - 7 } : l >= 6 ? { crystal: l - 4 } : l >= 3 ? { wolf_fang: l } : l >= 1 ? { slime_gel: l * 2 } : {}), ...ore(l, 'sword') },
      ),
    }),
  },
  armor: {
    name: 'Cường hóa giáp', emoji: '🛡️', max: 15, perLevel: '+20 HP, +2 phòng thủ',
    cost: (l) => ({
      gold: Math.round(130 * 1.7 ** l),
      items: mats(
        { ...(l >= 12 ? { dragon_scale: l - 10 } : l >= 9 ? { fire_core: l - 7 } : l >= 6 ? { goblin_relic: l - 4 } : l >= 3 ? { wolf_fang: l } : l >= 1 ? { slime_gel: l * 2 + 1 } : {}), ...ore(l, 'armor') },
      ),
    }),
  },
};

/** Đồ hồi máu theo thứ tự ưu tiên khi bấm nút ăn (món yếu nhất trước) */
export const HEAL_ITEMS: Record<string, number> = {
  bread: 35,
  carrot_soup: 60,
  potion_s: 80,
  omelette: 90,
  watermelon_juice: 105,
  tomato_stew: 110,
  berry_smoothie: 140,
  warm_milk: 150,
  apple_pie: 185,
  pumpkin_pie: 200,
  peach_tea: 240,
  potion_m: 300,
  fruit_platter: 360,
  fairy_tart: 400,
  potion_l: 700,
  potion_xl: 1500,
  grilled_fish: 100,
  cheese: 120,
  fish_soup: 160,
  sponge_cake: 220,
  sushi: 260,
  hotpot: 320,
  ...Object.fromEntries(SHOP_POTIONS.map((p) => [p.id, p.heal])),
};

export const NIGHT_ATK = 1.25;
export const NIGHT_REWARD = 1.3;
export const DEATH_GOLD_LOSS = 0.1;
export const DEATH_GOLD_LOSS_CAP = 2000;
