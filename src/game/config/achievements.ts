import type { GameState } from '../types';

// Thành tựu nhiều bậc: Đồng → Bạc → Vàng → Kim Cương. Mỗi bậc thưởng kim cương, bậc cuối tặng danh hiệu.

export const ACH_TIERS = [
  { name: 'Đồng', emoji: '🥉', gems: 5 },
  { name: 'Bạc', emoji: '🥈', gems: 15 },
  { name: 'Vàng', emoji: '🥇', gems: 30 },
  { name: 'Kim Cương', emoji: '💠', gems: 60 },
];

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  /** {n} được thay bằng mốc */
  desc: string;
  goals: [number, number, number, number];
  stat: (g: GameState) => number;
  /** danh hiệu nhận khi đạt bậc Kim Cương */
  title: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'harvest', name: 'Nhà Nông', emoji: '🌾', desc: 'Thu hoạch {n} ô ruộng', goals: [50, 500, 3000, 15000], stat: (g) => g.stats.harvested, title: 'Địa Chủ Ruộng Đồng' },
  { id: 'cook', name: 'Vào Bếp', emoji: '🍳', desc: 'Nấu {n} món ăn', goals: [10, 100, 500, 2000], stat: (g) => g.stats.cooked, title: 'Siêu Đầu Bếp' },
  { id: 'orders', name: 'Giao Hàng', emoji: '📦', desc: 'Hoàn thành {n} đơn hàng', goals: [10, 100, 500, 2000], stat: (g) => g.stats.orders, title: 'Thương Nhân Uy Tín' },
  { id: 'gold', name: 'Làm Giàu', emoji: '🪙', desc: 'Kiếm tổng cộng {n} vàng', goals: [10_000, 200_000, 3_000_000, 50_000_000], stat: (g) => g.stats.goldEarned, title: 'Phú Khả Địch Quốc' },
  { id: 'kills', name: 'Diệt Quái', emoji: '⚔️', desc: 'Hạ gục {n} quái vật', goals: [100, 1000, 8000, 40000], stat: (g) => g.stats.kills, title: 'Sát Thần Vạn Quái' },
  { id: 'zone', name: 'Thám Hiểm', emoji: '🧭', desc: 'Đặt chân tới khu quái thứ {n}', goals: [5, 10, 15, 20], stat: (g) => g.maxZone, title: 'Kẻ Chinh Phục Thế Giới' },
  { id: 'level', name: 'Trưởng Thành', emoji: '⭐', desc: 'Đạt cấp {n}', goals: [10, 25, 40, 55], stat: (g) => g.player.level, title: 'Bậc Thầy Võ Học' },
  { id: 'fish', name: 'Cần Thủ', emoji: '🎣', desc: 'Câu được {n} con cá', goals: [20, 200, 1000, 5000], stat: (g) => g.stats.fish, title: 'Ngư Ông Đắc Lợi' },
  { id: 'species', name: 'Sổ Cá', emoji: '📖', desc: 'Câu được {n} loài cá khác nhau', goals: [3, 5, 7, 9], stat: (g) => Object.keys(g.fishing.best).length, title: 'Bách Khoa Thủy Sinh' },
  { id: 'rods', name: 'Sưu Tầm Cần', emoji: '🎋', desc: 'Sở hữu {n} cần câu', goals: [2, 4, 7, 10], stat: (g) => g.fishingGear.rods.length, title: 'Nhà Sưu Tầm Cần Câu' },
  { id: 'kites', name: 'Theo Gió', emoji: '🪁', desc: 'Thả diều {n} lần', goals: [5, 50, 300, 1500], stat: (g) => g.stats.kites, title: 'Đứa Con Của Gió' },
  { id: 'fashion', name: 'Điệu Đà', emoji: '👗', desc: 'Sở hữu {n} món thời trang', goals: [3, 10, 20, 30], stat: (g) => g.cosmetics.owned.length, title: 'Biểu Tượng Thời Trang' },
  { id: 'houses', name: 'Bất Động Sản', emoji: '🏡', desc: 'Sở hữu {n} căn nhà / căn hộ', goals: [1, 3, 6, 10], stat: (g) => g.houses.length, title: 'Ông Trùm Bất Động Sản' },
  { id: 'animals', name: 'Chăn Nuôi', emoji: '🐄', desc: 'Nuôi {n} con vật', goals: [1, 3, 6, 10], stat: (g) => g.animals.length, title: 'Chúa Tể Trang Trại' },
  { id: 'login', name: 'Chăm Chỉ', emoji: '📅', desc: 'Nhận quà online {n} lần', goals: [5, 30, 120, 400], stat: (g) => g.stats.onlineGifts, title: 'Người Không Bỏ Cuộc' },
];
export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
