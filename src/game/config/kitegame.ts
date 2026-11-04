import type { Reward } from '../types';

// Mini-game Thả Diều: lái diều lên cao, né chim / mây giông / sét, nhặt xu & túi quà.
// Càng cao càng nhiều chướng ngại. Thu diều thì giữ hết, diều rơi thì mất một nửa số xu.

export interface KitePlay {
  /** số lần va chạm chịu được */
  hp: number;
  /** hệ số tốc độ bay lên */
  climb: number;
  /** hệ số độ nhạy khi lái */
  steer: number;
  /** 🧲 hút xu & quà trong bán kính (px) */
  magnet?: number;
  /** 🛡️ số lần đỡ va chạm miễn phí đầu lượt */
  shield?: number;
  /** 🎁 nhân tỉ lệ túi quà xuất hiện */
  luck?: number;
  /** 🪙 nhân giá trị mỗi xu */
  coin?: number;
  /** 💨 nhân thời gian gió đẩy */
  wind?: number;
  /** ⚡ sét đánh không trúng */
  boltProof?: boolean;
  /** 🐦 chim không làm hại diều */
  birdSafe?: boolean;
}

/** độ bền, tốc độ bay & kỹ năng theo từng loại diều */
export const KITE_PLAY: Record<string, KitePlay> = {
  kite_paper: { hp: 3, climb: 1, steer: 1 },
  kite_fish: { hp: 3, climb: 1.05, steer: 1.05, magnet: 40 },
  kite_star: { hp: 3, climb: 1, steer: 1.1, luck: 1.6 },
  kite_butterfly: { hp: 3, climb: 1.12, steer: 1.15, wind: 1.4, magnet: 30 },
  kite_owl: { hp: 4, climb: 1.08, steer: 1.05, shield: 1 },
  kite_box: { hp: 4, climb: 1.1, steer: 1, coin: 1.2 },
  kite_eagle: { hp: 4, climb: 1.25, steer: 1.2, birdSafe: true },
  kite_flute: { hp: 4, climb: 1.2, steer: 1.2, wind: 1.8, magnet: 40 },
  kite_cloud: { hp: 4, climb: 1.18, steer: 1.25, boltProof: true },
  kite_phoenix: { hp: 5, climb: 1.32, steer: 1.25, shield: 2, coin: 1.25 },
  kite_rainbow: { hp: 4, climb: 1.3, steer: 1.35, luck: 2, magnet: 60 },
  kite_dragon: { hp: 5, climb: 1.4, steer: 1.3, boltProof: true, shield: 1, magnet: 70 },
  kite_galaxy: { hp: 5, climb: 1.45, steer: 1.4, luck: 2.2, coin: 1.3, wind: 1.5, magnet: 80, birdSafe: true },
};

export const kitePlay = (id: string | null | undefined) => KITE_PLAY[id ?? ''] ?? KITE_PLAY.kite_paper;

/** danh sách kỹ năng để hiện lên thẻ / sân thử diều */
export function kiteSkills(p: KitePlay): { icon: string; name: string; desc: string }[] {
  const s: { icon: string; name: string; desc: string }[] = [];
  if (p.shield) s.push({ icon: '🛡️', name: `Khiên ×${p.shield}`, desc: `Đỡ miễn phí ${p.shield} cú va chạm đầu tiên` });
  if (p.boltProof) s.push({ icon: '⚡', name: 'Miễn sét', desc: 'Cột sét đánh xuyên qua không mất máu' });
  if (p.birdSafe) s.push({ icon: '🐦', name: 'Dọa chim', desc: 'Chim bay vào sẽ bị dọa chạy, không mất máu' });
  if (p.magnet) s.push({ icon: '🧲', name: `Hút xu ${p.magnet}`, desc: `Tự hút xu & quà trong bán kính ${p.magnet}px` });
  if (p.luck) s.push({ icon: '🎁', name: `Quà ×${p.luck}`, desc: `Túi quà xuất hiện nhiều gấp ${p.luck} lần` });
  if (p.coin) s.push({ icon: '🪙', name: `Xu ×${p.coin}`, desc: `Mỗi xu đổi được nhiều vàng gấp ${p.coin} lần` });
  if (p.wind) s.push({ icon: '💨', name: `Gió ×${p.wind}`, desc: `Gió đẩy kéo dài gấp ${p.wind} lần` });
  return s;
}

/** mức trần để vẽ thanh chỉ số */
export const KITE_STAT_MAX = { hp: 5, climb: 1.45, steer: 1.4 };

/** mét bay lên mỗi giây (trước hệ số diều), tăng nhẹ theo độ cao */
export const KITE_CLIMB = 6;
/** gió mạnh (💨) cộng thêm tốc độ trong vài giây */
export const KITE_BOOST = { mult: 2.2, sec: 2.5 };
/** mỗi xu = KITE_COIN_GOLD × (1 + 0.08 × cấp) vàng */
export const KITE_COIN_GOLD = 6;
/** thưởng độ cao: vàng mỗi mét */
export const KITE_ALT_GOLD = 0.6;
/** diều rơi thì giữ lại tỉ lệ xu này */
export const KITE_CRASH_KEEP = 0.5;
/** bay đủ cao thì nhận Gió lành (buff vàng từ quái của diều) */
export const KITE_BUFF_ALT = 60;
/** túi quà trên trời */
export const KITE_GIFTS: { weight: number; reward: Reward }[] = [
  { weight: 30, reward: { items: { bait_shrimp: 3 } } },
  { weight: 25, reward: { items: { seed_carrot: 4 } } },
  { weight: 15, reward: { items: { potion_m: 1 } } },
  { weight: 12, reward: { gems: 2 } },
  { weight: 10, reward: { items: { bait_gold: 2 } } },
  { weight: 6, reward: { items: { seed_mushroom: 1 } } },
  { weight: 2, reward: { gems: 10 } },
];
/** giới hạn hợp lý cho 1 lượt (chống số liệu bất thường) */
export const KITE_MAX = { alt: 5000, coins: 400, gifts: 40 };
