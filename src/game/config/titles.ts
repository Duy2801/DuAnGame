import { ACHIEVEMENTS } from './achievements';
import { FISH } from './life';

// Danh hiệu — mở khóa bằng thành tích hoặc thứ hạng, chọn 1 cái để hiện trên đầu nhân vật

export type TitleTier = 'common' | 'rare' | 'epic' | 'legend' | 'mythic';

export const TIER_COLOR: Record<TitleTier, string> = { common: '#d8d4c8', rare: '#5aa8ff', epic: '#c080ff', legend: '#ffd23a', mythic: '#ff5a7a' };
export const TIER_NAME: Record<TitleTier, string> = { common: 'Thường', rare: 'Hiếm', epic: 'Sử thi', legend: 'Huyền thoại', mythic: 'Thần thoại' };
export const TIER_ORDER: TitleTier[] = ['common', 'rare', 'epic', 'legend', 'mythic'];

// ---------- Bảng xếp hạng: Top 1–5 mỗi bảng có 1 danh hiệu riêng, Top 1 ngầu nhất ----------

export type BoardId = 'gold' | 'farm' | 'kite' | 'fish' | 'hunt' | 'level';

export interface BoardDef {
  id: BoardId;
  name: string;
  icon: string;
  unit: string;
  desc: string;
  /** true: tính theo tuần, chốt bảng cuối tuần */
  weekly: boolean;
  /** danh hiệu Top 1 → Top 5 */
  titles: [string, string, string, string, string];
}

export const BOARDS: BoardDef[] = [
  { id: 'gold', name: 'Đại Gia', icon: '🪙', unit: 'vàng', desc: 'Vàng kiếm được trong tuần', weekly: true,
    titles: ['Đệ Nhất Phú Hộ', 'Đại Phú Hào', 'Triệu Phú Thị Trấn', 'Thương Gia Giàu Có', 'Người Có Của Ăn Của Để'] },
  { id: 'farm', name: 'Nông Dân Chăm Chỉ', icon: '🌾', unit: 'ô', desc: 'Số ô ruộng thu hoạch trong tuần', weekly: true,
    titles: ['Thần Nông', 'Lão Nông Tri Điền', 'Nông Dân Kiểu Mẫu', 'Bàn Tay Vàng Nhà Nông', 'Nông Dân Chăm Chỉ'] },
  { id: 'hunt', name: 'Thợ Săn Quái', icon: '⚔️', unit: 'quái', desc: 'Số quái vật hạ gục trong tuần', weekly: true,
    titles: ['Diệt Thế Ma Thần', 'Đồ Tể Quái Vật', 'Thợ Săn Huyền Thoại', 'Kiếm Khách Lừng Danh', 'Thợ Săn Quái'] },
  { id: 'fish', name: 'Câu Cá', icon: '🎣', unit: 'điểm', desc: 'Điểm câu cá trong tuần', weekly: true,
    titles: ['Long Vương Biển Cả', 'Vua Câu Cá', 'Cần Thủ Huyền Thoại', 'Ngư Phủ Lão Luyện', 'Cao Thủ Câu Cá'] },
  { id: 'kite', name: 'Thả Diều', icon: '🪁', unit: 'm', desc: 'Độ cao thả diều kỷ lục trong tuần', weekly: true,
    titles: ['Chúa Tể Bầu Trời', 'Kẻ Cưỡi Gió', 'Vua Thả Diều', 'Cánh Diều Tuổi Thơ', 'Người Yêu Gió'] },
  { id: 'level', name: 'Cao Thủ', icon: '⭐', unit: 'cấp', desc: 'Cấp độ nhân vật (toàn thời gian)', weekly: false,
    titles: ['Thiên Hạ Đệ Nhất', 'Võ Lâm Chí Tôn', 'Cao Thủ Tuyệt Đỉnh', 'Đại Hiệp', 'Hiệp Khách'] },
];
export const BOARD_BY_ID = Object.fromEntries(BOARDS.map((b) => [b.id, b])) as Record<BoardId, BoardDef>;
export const TOP_TITLE_COUNT = 5;
/** Top 1 thần thoại, Top 2 huyền thoại … Top 5 thường */
export const TOP_TIERS: TitleTier[] = ['mythic', 'legend', 'epic', 'rare', 'common'];
export const topTitleId = (board: BoardId, rank: number) => `top_${board}_${rank}`;

/** số cá đã câu */
export const COUNT_TITLES = [
  { n: 10, id: 'fish_10', name: 'Tập Sự Câu Cá', tier: 'common' as TitleTier },
  { n: 100, id: 'fish_100', name: 'Cần Thủ', tier: 'rare' as TitleTier },
  { n: 500, id: 'fish_500', name: 'Bậc Thầy Câu Cá', tier: 'epic' as TitleTier },
  { n: 2000, id: 'fish_2000', name: 'Thần Câu', tier: 'legend' as TitleTier },
];

/** hạng Bảng Top Câu Cá tuần (bản cũ — chỉ hiện nếu đã có, nay thay bằng danh hiệu Top 1–5) */
export const RANK_TITLES = [
  { top: 30, id: 'rank_30', name: 'Ngư Phủ Top 30', tier: 'common' as TitleTier },
  { top: 10, id: 'rank_10', name: 'Ngư Phủ Lão Luyện', tier: 'rare' as TitleTier },
  { top: 3, id: 'rank_3', name: 'Cần Thủ Huyền Thoại', tier: 'epic' as TitleTier },
  { top: 1, id: 'rank_1', name: 'Vua Câu Cá', tier: 'legend' as TitleTier },
];

/** câu được cá dài kỷ lục */
export const SIZE_TITLES = [
  { cm: 150, id: 'size_150', name: 'Người Khổng Lồ Của Biển', tier: 'epic' as TitleTier },
  { cm: 240, id: 'size_240', name: 'Huyền Thoại Đại Dương', tier: 'legend' as TitleTier },
];

// (Đã xoá toàn bộ danh hiệu Giftcode — danh hiệu chỉ đạt được bằng thành tích / thứ hạng thật, lưu trên DB: player_titles)

/** Danh hiệu Thần Thoại khi câu được 6 loài cá Cực Hiếm 0.00001% của 6 Vùng Câu */
export const SUPER_FISH_TITLES: TitleDef[] = [
  { id: 'title_carp_god', name: 'Ngư Tiên Kim Giáp', tier: 'mythic', desc: 'Câu được Kim Giáp Long Điệp Ngư Thần Thoại tại Bờ Hồ Bình Minh' },
  { id: 'title_lotus_spirit', name: 'Tịnh Tâm Ngư Sĩ', tier: 'mythic', desc: 'Câu được Hồng Liên Thần Ngư Thần Thoại tại Đầm Sen Cổ Thụ' },
  { id: 'title_leviathan_conqueror', name: 'Kẻ Thao Túng Thủy Quái', tier: 'mythic', desc: 'Câu được Thủy Quái Leviathan Thần Thoại tại Vực Thẳm Lòng Hồ' },
  { id: 'title_lunar_fish', name: 'Huyền Thoại Ánh Trăng', tier: 'mythic', desc: 'Câu được Nguyệt Tinh Cổ Ngư Thần Thoại tại Đầm Sương Đom Đóm' },
  { id: 'title_kirin_sea', name: 'Bá Chủ Hải Dương', tier: 'mythic', desc: 'Câu được Hải Hoàng Kỳ Lân Ngư Thần Thoại tại Vịnh San Hô' },
  { id: 'title_ice_dragon_fish', name: 'Hàn Băng Thần Ngư Tôn', tier: 'mythic', desc: 'Câu được Băng Long Thần Ngư Thần Thoại tại Thác Băng Cực Phong' },
];

const speciesTier = (i: number, giant: boolean): TitleTier => {
  const base = i < 3 ? 0 : i < 6 ? 1 : i < 8 ? 2 : 3;
  return TIER_ORDER[Math.min(3, base + (giant ? 1 : 0))];
};

export interface TitleDef {
  id: string;
  name: string;
  tier: TitleTier;
  desc: string;
  /** danh hiệu thứ hạng: chỉ giữ khi còn trong Top (hoặc Top tuần trước) */
  board?: BoardId;
  rank?: number;
  /** danh hiệu cũ đã ngừng phát: ẩn nếu chưa có */
  legacy?: boolean;
}

export const TITLES: TitleDef[] = [
  ...SUPER_FISH_TITLES,
  ...BOARDS.flatMap((b) =>
    b.titles.map((name, i) => ({
      id: topTitleId(b.id, i + 1), name, tier: TOP_TIERS[i], board: b.id, rank: i + 1,
      desc: `Top ${i + 1} bảng ${b.name}${b.weekly ? ' tuần này / tuần trước' : ''}`,
    })),
  ),
  ...COUNT_TITLES.map((t) => ({ id: t.id, name: t.name, tier: t.tier, desc: `Câu được ${t.n} con cá` })),
  ...RANK_TITLES.map((t) => ({ id: t.id, name: t.name, tier: t.tier, desc: `Lọt Top ${t.top} Bảng Câu Cá tuần (cũ)`, legacy: true })),
  ...ACHIEVEMENTS.map((a) => ({ id: `ach_${a.id}`, name: a.title, tier: 'epic' as TitleTier, desc: `Thành tựu ${a.name} bậc Kim Cương` })),
  ...SIZE_TITLES.map((t) => ({ id: t.id, name: t.name, tier: t.tier, desc: `Câu được cá dài từ ${t.cm} cm` })),
  // mỗi loài cá 2 danh hiệu: câu được con To / con Khổng lồ
  ...FISH.flatMap((f, i) => [
    { id: `big_${f.id}`, name: `Thợ Săn ${f.name}`, tier: speciesTier(i, false), desc: `Câu được ${f.name} cỡ To` },
    { id: `giant_${f.id}`, name: `Vua ${f.name}`, tier: speciesTier(i, true), desc: `Câu được ${f.name} cỡ Khổng lồ` },
  ]),
];

export const TITLE_BY_ID: Record<string, TitleDef> = Object.fromEntries(TITLES.map((t) => [t.id, t]));
