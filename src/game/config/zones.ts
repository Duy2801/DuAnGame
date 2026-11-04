// 20 vùng quái — phần gameplay (tên, quái, cấp khuyên dùng). Phần hình ảnh nằm ở world/zoneThemes.ts

export interface ZoneDef {
  id: number;
  name: string;
  desc: string;
  monster: string;
  /** mỗi vùng có 1 boss riêng canh đấu trường */
  boss: string;
}

export const ZONE_DEFS: ZoneDef[] = [
  { id: 1, name: 'Đồng Cỏ Anh Đào', desc: 'Slime tung tăng dưới mưa hoa', monster: 'slime', boss: 'king_slime' },
  { id: 2, name: 'Rừng Nấm Mộng', desc: 'Bào tử phát sáng lơ lửng', monster: 'mushroom', boss: 'mushroom_lord' },
  { id: 3, name: 'Đầm Lầy Ếch', desc: 'Cầu gỗ xuyên đầm sương mù', monster: 'frog', boss: 'frog_titan' },
  { id: 4, name: 'Rừng Sói Đen', desc: 'Bầy sói săn mồi theo đàn', monster: 'wolf', boss: 'wolf_alpha' },
  { id: 5, name: 'Bãi Biển Cua', desc: 'Cát trắng, nắng vàng và càng cua', monster: 'crab', boss: 'crab_king' },
  { id: 6, name: 'Trại Goblin', desc: 'Doanh trại của lũ goblin', monster: 'goblin', boss: 'goblin_warlord' },
  { id: 7, name: 'Nghĩa Địa Bóng Đêm', desc: 'Đèn hồn leo lét giữa mộ', monster: 'skeleton', boss: 'lich' },
  { id: 8, name: 'Hang Dơi', desc: 'Tối om — nên mang đèn', monster: 'bat', boss: 'vampire_bat' },
  { id: 9, name: 'Sa Mạc Bọ Cạp', desc: 'Nắng cháy và nọc độc', monster: 'scorpion', boss: 'scorpion_emperor' },
  { id: 10, name: 'Phế Tích Cổ Đại', desc: 'Đường lát đá của nền văn minh cũ', monster: 'stone_golem', boss: 'ancient_golem' },
  { id: 11, name: 'Rừng Tuyết', desc: 'Sói tuyết hung hãn', monster: 'snow_wolf', boss: 'frost_wolf' },
  { id: 12, name: 'Hồ Băng Giá', desc: 'Mặt hồ đóng băng lấp lánh', monster: 'snowman', boss: 'yeti_king' },
  { id: 13, name: 'Hang Pha Lê', desc: 'Pha lê phát sáng khắp vách', monster: 'crystal_golem', boss: 'crystal_titan' },
  { id: 14, name: 'Rừng Ma Ám', desc: 'Hồn ma xuyên tường', monster: 'ghost', boss: 'banshee' },
  { id: 15, name: 'Đầm Độc', desc: 'Sương độc tím ngắt', monster: 'spider', boss: 'spider_queen' },
  { id: 16, name: 'Núi Đá Ogre', desc: 'Orc to khỏe, đánh rất đau', monster: 'orc', boss: 'ogre_king' },
  { id: 17, name: 'Thành Quỷ', desc: 'Quỷ lửa canh giữ thành', monster: 'imp', boss: 'demon_lord' },
  { id: 18, name: 'Núi Lửa', desc: 'Sông dung nham sôi sục', monster: 'lava_golem', boss: 'magma_colossus' },
  { id: 19, name: 'Vực Hắc Ám', desc: 'Kỵ sĩ bóng tối không biết sợ', monster: 'dark_knight', boss: 'abyss_knight' },
  { id: 20, name: 'Thiên Long Cốc', desc: 'Hang ổ của Rồng Lửa', monster: 'dragon_whelp', boss: 'fire_dragon' },
];

export const ZONE_COUNT = ZONE_DEFS.length;

/** Cấp khuyên dùng — mỗi vùng khó hơn khoảng 3 cấp */
export const zoneLevel = (zone: number) => 1 + 3 * (zone - 1);
