import type { BuffId } from './config/buffs';
export type BuildingId = 'windmill' | 'well' | 'barn' | 'kitchen' | 'tavern';
export type Rarity = 'N' | 'R' | 'SR' | 'SSR';
export type HeroClass = 'warrior' | 'mage' | 'archer' | 'healer' | 'farmer';
export type ItemKind = 'crop' | 'seed' | 'food' | 'material' | 'fish' | 'animal' | 'potion' | 'bait' | 'ore';
export type QuestEvent = 'harvest' | 'plant' | 'sell' | 'cook' | 'mission' | 'recruit' | 'upgrade' | 'kill' | 'fish';
export type GearSlot = 'sword' | 'armor';
export interface CaughtFish {
  uuid: string;
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  zoneId: number;
  zoneName: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  cm: number;
  kg: number;
  tier: number; // 0..3 (Bé, Vừa, To, Khổng lồ)
  tierName: string;
  caughtAt: number;
  isSuperRare?: boolean;
  priceGold: number;
  priceGems?: number;
  locked?: boolean;
}

export type EquipSlot = 'weapon' | 'armor' | 'accessory';
export type MonsterAi = 'hop' | 'run' | 'fly' | 'slam' | 'dragon';
/** chiêu của boss, xoay vòng theo thứ tự; dưới 50% HP boss nổi giận ra chiêu nhanh hơn */
export type BossSkill = 'slam' | 'fire' | 'charge' | 'nova' | 'summon';

export interface EquipDef {
  id: string;
  name: string;
  emoji: string;
  slot: EquipSlot;
  rarity?: import('./config/shops').RodRarity;
  price: number;
  levelReq: number;
  desc: string;
  atk?: number;
  def?: number;
  hp?: number;
  /** % tốc chạy */
  speed?: number;
  crit?: number;
  /** HP hồi mỗi giây */
  regen?: number;
  /** bán kính ánh sáng thêm vào ban đêm */
  light?: number;
  /** trang bị độc quyền rơi từ boss (id boss) — không bán ở tiệm */
  boss?: string;
  /** vũ khí: thời gian hồi đòn (ms) và tầm chém (px) */
  cooldown?: number;
  range?: number;
  color?: number;
}

export interface AnimalState {
  uid: number;
  kind: string;
  fed: boolean;
  /** đã cho uống nước sạch */
  watered?: boolean;
  /** đã chích ngừa vắc-xin phòng dịch cho lứa này */
  vaccinated?: boolean;
  /** đã vệ sinh chuồng & tắm rửa */
  clean?: boolean;
  /** vật nuôi đang bị ốm cần tiêm thuốc thú y */
  sick?: boolean;
  readyAt: number;
}

// ---------- Dữ liệu tĩnh (config) ----------

export type FertilizerKind = 'basic' | 'super' | 'gold';

export interface CropDef {
  id: string;
  name: string;
  emoji: string;
  growSec: number;
  yield: number;
  sellPrice: number;
  /** null = hạt hiếm, không mua được, chỉ rơi ra từ nhiệm vụ Hội */
  seedCost: number | null;
  rankReq: number;
  /** phân loại: rau củ ('veg') hoặc hoa quả thật ('fruit') */
  category?: 'veg' | 'fruit';
  desc?: string;
}

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  kind: ItemKind;
  sellPrice: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  emoji: string;
  inputs: Record<string, number>;
  kitchenLevel: number;
  /** cộng thẳng vào tỉ lệ thành công khi mang theo đi nhiệm vụ */
  successBonus: number;
  /** giảm % thời gian nhiệm vụ */
  timeCut: number;
  sellPrice: number;
  /** ăn vào nhận hiệu ứng trong `min` phút */
  buff?: { id: BuffId; value: number; min: number };
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  maxLevel: number;
  /** giá để nâng từ cấp `level` lên `level + 1` */
  cost: (level: number) => number;
  effect: (level: number) => string;
}

export interface MissionDef {
  id: string;
  name: string;
  emoji: string;
  rankReq: number;
  durationSec: number;
  reqPower: number;
  gold: [number, number];
  xp: number;
  drops: { item: string; chance: number; qty: number }[];
  gems?: { chance: number; qty: number };
}

export interface DailyQuestDef {
  id: string;
  text: string;
  event: QuestEvent;
  target: number;
  points: number;
}

export interface MineCell {
  rock: import('./config/mine').RockId;
  hp: number;
  max: number;
  ladder: boolean;
  /** đã đập vỡ: phần thưởng nhận được (để hiện lại) */
  got?: string;
}

export interface Order {
  npc: string;
  line: string;
  items: Record<string, number>;
  gold: number;
  xp: number;
  gems: number;
}

export interface Reward {
  gold?: number;
  gems?: number;
  items?: Record<string, number>;
  /** danh sách id danh hiệu mở khóa (tự đeo danh hiệu đầu tiên) */
  titles?: string[];
  /** nâng cấp nhân vật lên tối thiểu cấp này */
  level?: number;
}

// ---------- Trạng thái người chơi ----------

export interface Plot {
  id: number;
  cropId: string | null;
  plantedAt: number;
  readyAt: number;
  /** đã tưới nước cho vụ này chưa */
  watered?: boolean;
  /** đã bón phân chưa (bắt buộc để cây kết trái) */
  fertilized?: boolean;
  fertilizer?: FertilizerKind;
  /** đã xới đất / làm cỏ / bắt sâu chưa */
  weeded?: boolean;
  /** có sâu rầy phá hoại cần bắt sâu hoặc xịt thuốc thảo mộc */
  pest?: boolean;
}

export interface Hero {
  id: number;
  name: string;
  cls: HeroClass;
  rarity: Rarity;
  level: number;
}

export interface ActiveMission {
  uid: number;
  missionId: string;
  heroIds: number[];
  startAt: number;
  endAt: number;
  chance: number;
  goldMult: number;
  dropMult: number;
}

export interface DailyQuestState {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface MonsterDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  speed: number;
  aggro: number;
  radius: number;
  xp: number;
  gold: [number, number];
  drops: { item: string; chance: number; qty: number }[];
  gems?: number;
  respawnMs: number;
  boss?: boolean;
  ai: MonsterAi;
  /** texture dùng để vẽ, cho phép nhiều quái dùng chung hình khác màu/kích thước */
  tex: string;
  zone: number;
  tint?: number;
  scale?: number;
  /** dùng sprite người 4 hướng (goblin, xương, orc...) */
  char?: boolean;
  /** boss: chiêu thức, màu hào quang, màu đạn, quái được triệu hồi */
  skills?: BossSkill[];
  aura?: number;
  shot?: number;
  minion?: string;
}

export interface BountyState {
  zone: number;
  monster: string;
  n: number;
  progress: number;
  claimed: boolean;
}

/** Nhân vật người chơi điều khiển */
export interface PlayerState {
  level: number;
  xp: number;
  hp: number;
  /** bản đồ đang đứng (id trong world/map.ts); x/y là toạ độ trong bản đồ đó */
  map: string;
  /** cấp cường hóa ở Lò rèn */
  gear: Record<GearSlot, number>;
  equip: Record<EquipSlot, string | null>;
  owned: string[];
  x: number;
  y: number;
}

export interface GameState {
  version: number;
  player: PlayerState;
  gold: number;
  gems: number;
  inventory: Record<string, number>;
  plots: Plot[];
  buildings: Record<BuildingId, number>;
  heroes: Hero[];
  missions: ActiveMission[];
  guildXp: number;
  daily: { dayKey: string; quests: DailyQuestState[]; points: number; chests: number[] };
  /** index = ngày (0..6) đã điểm danh gần nhất trong chuỗi, -1 nếu chưa từng */
  login: { index: number; claimedDayKey: string };
  week: { key: string; gold: number; lastResult: { rank: number; gems: number } | null };
  stats: {
    harvested: number; goldEarned: number; missionsDone: number; kills: number; fish: number; kites: number;
    cooked: number; orders: number; onlineGifts: number; ores: number;
  };
  /** đếm theo tuần cho các bảng Nông dân / Thợ săn / Thả diều; last = hạng chốt tuần trước */
  /** số lần hạ từng boss (lần đầu chắc chắn rơi trang bị độc quyền) */
  bossKills: Record<string, number>;
  weekStats: { key: string; harvest: number; kills: number; kites: number; kiteBest: number; mineBest: number; last: Partial<Record<'farm' | 'hunt' | 'kite' | 'mine', number>> };
  /** kỷ lục độ cao thả diều (m) */
  kiteBest: number;
  houses: string[];
  /** căn nhà đang ở / trưng bày nội thất chính */
  activeHouse?: string | null;
  /** danh sách dụng cụ & nội thất đã mua trong nhà */
  furniture?: string[];
  /** rương chứa đồ cá nhân (cất giữ vật phẩm & trang bị chưa dùng tới) */
  chest?: { items: Record<string, number>; gear: string[] };
  animals: AnimalState[];
  story: { step: number; accepted: boolean; progress: number };
  /** thời điểm hết buff Gió lành (thả diều) */
  kiteBuffUntil: number;
  kiteBuffMult: number;
  cosmetics: {
    owned: string[];
    wings: string | null;
    hat: string | null;
    pet: string | null;
    /** đồ mặc ngoài (ghi đè hình giáp) + trang sức */
    top: string | null;
    bottom: string | null;
    shoes: string | null;
    neck: string | null;
    ear: string | null;
    face: string | null;
  };
  fishingGear: { rods: string[]; rod: string };
  /** kỷ lục câu cá + điểm đua top câu cá theo tuần + kho cá cá nhân */
  fishing: {
    best: Record<string, number>;
    biggest: { id: string; cm: number } | null;
    week: { key: string; points: number; lastResult: { rank: number; gems: number } | null };
    fishBag?: CaughtFish[];
  };
  kites: { owned: string[]; equipped: string | null };
  waypoints: string[];
  bounties: { dayKey: string; list: BountyState[] };
  /** nhân vật người chơi tạo lúc vào game */
  profile: {
    name: string;
    gender: 'm' | 'f';
    /** chỉ số trong bảng màu/kiểu ở art/avatar.ts */
    hair: number;
    hairStyle: string;
    skin: number;
    eyes: number;
    cloth: number;
    created: boolean;
  };
  /** thanh 10 ô: id vũ khí / cần câu, sel = ô đang cầm */
  hotbar: { slots: (string | null)[]; sel: number };
  titles: { owned: string[]; active: string | null };
  /** code quà tặng đã dùng */
  redeemed: string[];
  /** Bảng Đơn Hàng: order = null nghĩa là đang chờ đơn mới tới lúc readyAt */
  orders: { order: Order | null; readyAt: number }[];
  /** số bậc thành tựu đã nhận theo id */
  achievements: Record<string, number>;
  /** thời gian chơi trong ngày (ms) cho Quà online */
  online: { dayKey: string; ms: number; claimed: number[] };
  wheel: { dayKey: string; spins: number };
  /** Hang mỏ: thể lực (tính tới energyAt), tầng sâu nhất, cấp cuốc, lượt đang đào */
  mine: {
    energy: number;
    energyAt: number;
    deepest: number;
    pick: number;
    run: { floor: number; cells: MineCell[]; ladder: boolean } | null;
  };
  /** hiệu ứng món ăn đang có: hết hạn lúc until */
  buffs: Partial<Record<BuffId, { value: number; until: number }>>;
  /** hạn sử dụng của vật phẩm/trang bị/thời trang/cần câu/diều (id -> timestamp hết hạn ms; không có = Vĩnh viễn) */
  itemExpiry?: Record<string, number>;
  /** vùng quái xa nhất đã tới */
  maxZone: number;
  seq: number;
  lastTick: number;
}
