// Hệ thống 4 Mùa trong game: Xuân, Hạ, Thu, Đông
// Chu kỳ 2 giờ thực tế đổi 1 mùa -> 8 giờ hoàn thành 1 chu kỳ 4 mùa trọn vẹn

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonDef {
  id: SeasonId;
  name: string;
  emoji: string;
  color: string;
  desc: string;
  bonusDesc: string;
}

export const SEASONS: Record<SeasonId, SeasonDef> = {
  spring: {
    id: 'spring',
    name: 'Mùa Xuân',
    emoji: '🌸',
    color: '#ff85b3',
    desc: 'Trăm hoa đua nở, vạn vật hồi sinh. Dòng nước ấm áp đánh thức các loài cá cổ tích.',
    bonusDesc: 'Cá mùa Xuân xuất hiện · Tăng 20% tỉ lệ cắn câu ban ngày',
  },
  summer: {
    id: 'summer',
    name: 'Mùa Hạ',
    emoji: '☀️',
    color: '#f59e0b',
    desc: 'Ánh nắng rực rỡ, mặt hồ sôi động. Các loài cá nhiệt đới và cá săn mồi hoạt động mạnh.',
    bonusDesc: 'Cá mùa Hạ xuất hiện · Cá kéo khỏe hơn nhưng kích thước trung bình to hơn',
  },
  autumn: {
    id: 'autumn',
    name: 'Mùa Thu',
    emoji: '🍁',
    color: '#ea580c',
    desc: 'Lá vàng rơi rụng, tiết trời se lạnh. Mùa cá tích trữ năng lượng trước kỳ đông miên.',
    bonusDesc: 'Cá mùa Thu xuất hiện · Tăng 25% giá bán cá lấy Vàng',
  },
  winter: {
    id: 'winter',
    name: 'Mùa Đông',
    emoji: '❄️',
    color: '#38bdf8',
    desc: 'Băng giá phủ trắng mỏm đá, hồ nước kết tinh. Các loài cá huyền bí dưới lớp băng thức giấc.',
    bonusDesc: 'Cá mùa Đông xuất hiện · Cơ hội câu được cá Băng Tinh quý giá',
  },
};

export const SEASON_ORDER: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];

/** Độ dài 1 mùa: 2 giờ = 7,200,000 ms */
export const SEASON_DURATION_MS = 2 * 60 * 60 * 1000;
export const FULL_CYCLE_MS = SEASON_DURATION_MS * 4; // 8 giờ

/** Lấy thông tin mùa hiện tại và thời gian đếm ngược */
export function getCurrentSeason(now: number = Date.now()) {
  const cycleTime = now % FULL_CYCLE_MS;
  const seasonIndex = Math.floor(cycleTime / SEASON_DURATION_MS) % 4;
  const seasonId = SEASON_ORDER[seasonIndex];
  const season = SEASONS[seasonId];

  const timeElapsedInSeason = cycleTime % SEASON_DURATION_MS;
  const msLeft = SEASON_DURATION_MS - timeElapsedInSeason;

  const totalSec = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const timeLeftStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    ...season,
    index: seasonIndex,
    msLeft,
    timeLeftStr,
    nextSeason: SEASONS[SEASON_ORDER[(seasonIndex + 1) % 4]],
  };
}
