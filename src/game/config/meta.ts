import type { DailyQuestDef, Reward } from '../types';

export const DAILY_COUNT = 5;
export const QUEST_GOLD = 30;

// Mỗi ngày bốc DAILY_COUNT nhiệm vụ, không trùng loại sự kiện
export const DAILY_POOL: DailyQuestDef[] = [
  { id: 'harvest10', text: 'Thu hoạch 10 ô ruộng', event: 'harvest', target: 10, points: 20 },
  { id: 'harvest30', text: 'Thu hoạch 30 ô ruộng', event: 'harvest', target: 30, points: 20 },
  { id: 'plant12', text: 'Gieo hạt 12 lần', event: 'plant', target: 12, points: 20 },
  { id: 'sell300', text: 'Bán hàng được 300 vàng', event: 'sell', target: 300, points: 20 },
  { id: 'sell1500', text: 'Bán hàng được 1.500 vàng', event: 'sell', target: 1500, points: 20 },
  { id: 'cook2', text: 'Nấu 2 món ăn', event: 'cook', target: 2, points: 20 },
  { id: 'mission3', text: 'Hoàn thành 3 nhiệm vụ Hội', event: 'mission', target: 3, points: 20 },
  { id: 'mission6', text: 'Hoàn thành 6 nhiệm vụ Hội', event: 'mission', target: 6, points: 20 },
  { id: 'recruit1', text: 'Tuyển 1 mạo hiểm giả', event: 'recruit', target: 1, points: 20 },
  { id: 'fish3', text: 'Câu được 3 con cá', event: 'fish', target: 3, points: 20 },
  { id: 'kill15', text: 'Hạ gục 15 quái vật', event: 'kill', target: 15, points: 20 },
  { id: 'kill40', text: 'Hạ gục 40 quái vật', event: 'kill', target: 40, points: 20 },
  { id: 'upgrade2', text: 'Nâng cấp 2 lần (công trình, đất hoặc anh hùng)', event: 'upgrade', target: 2, points: 20 },
];

export const DAILY_BY_ID = Object.fromEntries(DAILY_POOL.map((q) => [q.id, q]));

/** Rương điểm hoạt động. Vàng được nhân theo rank Hội. */
export const CHESTS: { points: number; reward: Reward }[] = [
  { points: 20, reward: { gold: 100 } },
  { points: 40, reward: { gold: 250 } },
  { points: 60, reward: { gems: 5 } },
  { points: 80, reward: { gold: 600 } },
  { points: 100, reward: { gems: 15, items: { seed_mushroom: 1 } } },
];

export const LOGIN_REWARDS: Reward[] = [
  { gold: 150 },
  { gold: 300 },
  { gems: 5 },
  { items: { seed_mushroom: 2 } },
  { gold: 800 },
  { gems: 10 },
  { gems: 30, items: { seed_fairyberry: 2 } },
];

export const WEEK_REWARDS = [
  { top: 1, gems: 100 },
  { top: 3, gems: 50 },
  { top: 10, gems: 20 },
  { top: 30, gems: 5 },
];

// Bản offline: đối thủ BXH là bot. Bản online thay bằng người chơi thật.
export const BOT_NAMES = [
  'NôngDânVuiVẻ', 'KiếmSĩBóngĐêm', 'BàNămTrồngCải', 'RồngLửa99', 'MèoMàyMò', 'ThợSănSlime',
  'TiểuThưHoaCúc', 'ĐạiGiaBíNgô', 'LãoNôngTriĐiền', 'GióPhươngNam', 'HiệpSĩCàRốt', 'PhápSưLúaMì',
  'SóiCôĐộc', 'ChúBaChănBò', 'NữHoàngNgôNon', 'KhoaiLangThần', 'BéoMậpMạp', 'ThánhHáiNấm',
  'VuaChợPhiên', 'HeoMayMắn', 'ĐầuBếpGoblin', 'TrăngKhuyết', 'CungThủMùThu', 'ÔngTámThợRèn',
  'LongKỵSĩ', 'CáiCuốcVàng', 'NgườiGieoHạt', 'BáChủThungLũng', 'HuyềnThoạiNôngTrại',
];

// ---------- Quà online: chơi đủ số phút trong ngày ----------

/** vàng được nhân (1 + 0.1 × cấp nhân vật) để vẫn có giá trị khi lên cao */
export const ONLINE_GIFTS: { min: number; reward: Reward }[] = [
  { min: 5, reward: { gold: 150, items: { bait_worm: 10 } } },
  { min: 15, reward: { gold: 400, items: { bait_shrimp: 5 } } },
  { min: 30, reward: { gems: 10, items: { potion_m: 2 } } },
  { min: 60, reward: { gems: 20, items: { seed_fairyberry: 1, bait_gold: 3 } } },
];

// ---------- Vòng quay may mắn: 1 lượt miễn phí mỗi ngày ----------

export const WHEEL_COST_GEMS = 10;
export const WHEEL_MAX_SPINS = 6;
/** vàng của ô vàng = goldX × (100 + 30 × cấp) */
export const WHEEL: { label: string; color: string; weight: number; goldX?: number; reward?: Reward }[] = [
  { label: '🪙 Ít', color: '#f2c230', weight: 26, goldX: 1 },
  { label: '💎 5', color: '#5aa8ff', weight: 16, reward: { gems: 5 } },
  { label: '🪙 Vừa', color: '#e8a020', weight: 18, goldX: 3 },
  { label: '✨ Mồi vàng', color: '#c080ff', weight: 12, reward: { items: { bait_gold: 3 } } },
  { label: '🪙 Nhiều', color: '#ff8a3a', weight: 8, goldX: 8 },
  { label: '🍷 Bình máu', color: '#ff5a7a', weight: 12, reward: { items: { potion_m: 3 } } },
  { label: '💎 20', color: '#3ad0c0', weight: 4, reward: { gems: 20 } },
  { label: '🍄 Hạt nấm', color: '#7dd85a', weight: 4, reward: { items: { seed_mushroom: 2 } } },
];
