import type { BuffId } from './buffs';
import type { EquipDef } from '../types';
import { BOSS_GEAR } from './bossGear';
import type { RodRarity } from './shops';

export interface WeaponBox {
  id: string;
  name: string;
  emoji: string;
  cost: { gold?: number; gems?: number };
  odds: Record<RodRarity, number>;
  desc: string;
  badge?: string;
}

/** Kiểm tra kiếm có phải Kiếm Hiếm (SR / SSR / UR) không — Kiếm hiếm nổ ra là Vĩnh Viễn, không có kiếm ngày! */
export const isRareWeapon = (rar?: RodRarity): boolean => rar === 'SR' || rar === 'SSR' || rar === 'UR';

export const EQUIPMENT: EquipDef[] = [
  // ---- Nhóm 1: Kiếm Thường (N & R) — Có Kiếm Ngày (3 Ngày / 7 Ngày) hoặc 1% Vĩnh Viễn khi quay Random
  { id: 'wood_sword', name: 'Kiếm Gỗ Tân Binh', emoji: '🪵', slot: 'weapon', rarity: 'N', price: 0, levelReq: 1, atk: 2, cooldown: 340, range: 13, color: 0xffffff, desc: 'Kiếm gỗ luyện tập cơ bản của tân binh' },
  { id: 'bamboo_sword', name: 'Trúc Kiếm Đạo Võ', emoji: '🎋', slot: 'weapon', rarity: 'N', price: 200, levelReq: 2, atk: 5, cooldown: 280, range: 13, crit: 0.03, color: 0xa8f090, desc: 'Thanh kiếm tre dẻo dai, vung kiếm nhẹ nhàng linh hoạt' },
  { id: 'dagger', name: 'Đoản Kiếm Bạc', emoji: '🔪', slot: 'weapon', rarity: 'N', price: 350, levelReq: 3, atk: 8, cooldown: 220, range: 11, crit: 0.05, color: 0xd8f0ff, desc: 'Đoản kiếm chém cực nhanh ở cự ly gần' },
  { id: 'bronze_sword', name: 'Thanh Đồng Cổ Kiếm', emoji: '🗡️', slot: 'weapon', rarity: 'N', price: 700, levelReq: 5, atk: 13, cooldown: 320, range: 14, color: 0xf0c078, desc: 'Kiếm đồng đúc cổ xưa, lưỡi dày và bền bỉ' },
  { id: 'iron_sword', name: 'Trường Kiếm Thép Rèn', emoji: '⚔️', slot: 'weapon', rarity: 'N', price: 1200, levelReq: 7, atk: 18, cooldown: 330, range: 14, color: 0xe8e8ff, desc: 'Trường kiếm thép tiêu chuẩn của mạo hiểm giả' },
  { id: 'steel_broadsword', name: 'Trọng Kiếm Hắc Thiết', emoji: '🗡️', slot: 'weapon', rarity: 'N', price: 1800, levelReq: 9, atk: 24, cooldown: 370, range: 15, crit: 0.04, color: 0xc0c8d8, desc: 'Đại kiếm thép đen nặng tay, chém văng quái nhỏ' },
  { id: 'katana_wind', name: 'Phong Ảnh Thái Đao', emoji: '🌪️', slot: 'weapon', rarity: 'R', price: 2500, levelReq: 10, atk: 28, cooldown: 240, range: 17, crit: 0.06, speed: 0.04, color: 0x8ef5c8, desc: 'Lưỡi thái đao xé gió, xuất kiếm liên hoàn' },
  { id: 'silver_rapier', name: 'Bạch Ngân Thứ Kiếm', emoji: '🤺', slot: 'weapon', rarity: 'R', price: 3200, levelReq: 11, atk: 32, cooldown: 230, range: 16, crit: 0.08, color: 0xf0f8ff, desc: 'Kiếm mũi nhọn bạc ròng, chuyên đâm chí mạng' },
  { id: 'spear', name: 'Trường Thương Kỵ Sĩ', emoji: '🔱', slot: 'weapon', rarity: 'R', price: 3800, levelReq: 12, atk: 35, cooldown: 400, range: 22, color: 0xfff2b0, desc: 'Tầm đâm xa vượt trội, giữ khoảng cách an toàn' },
  { id: 'flame_scimitar', name: 'Xích Viêm Loan Đao', emoji: '🔥', slot: 'weapon', rarity: 'R', price: 4800, levelReq: 14, atk: 42, cooldown: 290, range: 16, crit: 0.06, color: 0xff8040, desc: 'Loan đao rực lửa nung đỏ từ nham thạch' },
  { id: 'shadow_katana', name: 'Hắc Ảnh Dạ Hành Kiếm', emoji: '🌑', slot: 'weapon', rarity: 'R', price: 5600, levelReq: 15, atk: 48, cooldown: 250, range: 17, crit: 0.08, speed: 0.05, color: 0xa080ff, desc: 'Kiếm bóng đêm thoắt ẩn thoắt hiện không tiếng động' },
  { id: 'battle_axe', name: 'Chiến Phủ Phá Giáp', emoji: '🪓', slot: 'weapon', rarity: 'R', price: 6500, levelReq: 17, atk: 55, cooldown: 520, range: 15, crit: 0.05, color: 0xffb070, desc: 'Mỗi nhát bổ ngàn cân nghiền nát khiên chắn' },

  // ---- Nhóm 2: Kiếm Hiếm Siêu Cấp (SR) — Nổ Random Nhận ♾️ VĨNH VIỄN (Không Có Kiếm Ngày)
  { id: 'emerald_spear', name: 'Lục Bảo Long Thương', emoji: '❇️', slot: 'weapon', rarity: 'SR', price: 12000, levelReq: 20, atk: 62, cooldown: 340, range: 23, crit: 0.07, color: 0x42f59b, desc: 'Thương ngọc lục bảo xuyên thủng mọi lớp giáp dày' },
  { id: 'crystal_sword', name: 'Hàn Tinh Pha Lê Kiếm', emoji: '💠', slot: 'weapon', rarity: 'SR', price: 15000, levelReq: 22, atk: 68, cooldown: 300, range: 16, crit: 0.08, color: 0x7fe8ff, desc: 'Bảo kiếm kết tinh từ lõi pha lê băng ngàn năm' },
  { id: 'sakura_katana', name: 'Anh Hoa Huyết Vũ Kiếm', emoji: '🌸', slot: 'weapon', rarity: 'SR', price: 18500, levelReq: 24, atk: 75, cooldown: 250, range: 18, crit: 0.1, speed: 0.05, color: 0xff9ec8, desc: 'Mỗi đường kiếm vung lên tựa mưa cánh hoa anh đào sắc lẹm' },
  { id: 'thunder_blade', name: 'Lôi Đình Vạn Quân Kiếm', emoji: '⚡', slot: 'weapon', rarity: 'SR', price: 22000, levelReq: 27, atk: 84, cooldown: 270, range: 18, crit: 0.1, speed: 0.05, color: 0xffe84a, desc: 'Sấm sét cửu thiên giáng xuống theo từng nhát chém' },
  { id: 'frost_blade', name: 'Băng Phách Tuyết Hoàng Kiếm', emoji: '❄️', slot: 'weapon', rarity: 'SR', price: 28000, levelReq: 30, atk: 94, cooldown: 330, range: 18, crit: 0.09, color: 0xbfe8ff, desc: 'Hàn khí vĩnh cửu đóng băng huyết mạch kẻ địch' },
  { id: 'jade_dragon_sword', name: 'Thanh Ngọc Chân Long Kiếm', emoji: '🐉', slot: 'weapon', rarity: 'SR', price: 34000, levelReq: 32, atk: 104, cooldown: 280, range: 18, crit: 0.1, regen: 3, color: 0x50ffb0, desc: 'Long hồn ngọc bích hộ thể, vừa chém vừa hồi phục sinh khí' },
  { id: 'starlight_claymore', name: 'Tinh Quang Đại Kiếm', emoji: '🌟', slot: 'weapon', rarity: 'SR', price: 40000, levelReq: 34, atk: 112, cooldown: 310, range: 19, crit: 0.11, hp: 70, color: 0xffe080, desc: 'Đại kiếm hấp thu ánh sáng vì sao trên bầu trời đêm' },
  { id: 'golden_paladin_sword', name: 'Hoàng Kim Thánh Kỵ Kiếm', emoji: '⚜️', slot: 'weapon', rarity: 'SR', price: 46000, levelReq: 36, atk: 120, cooldown: 290, range: 19, crit: 0.11, hp: 100, color: 0xffd700, desc: 'Bảo kiếm hoàng gia khắc ấn hộ mệnh của Thánh Kỵ Sĩ Đoàn' },

  // ---- Nhóm 3: Thần Kiếm Cực Hiếm (SSR) — Nổ Random Nhận ♾️ VĨNH VIỄN (Không Có Kiếm Ngày)
  { id: 'void_sword', name: 'Hư Không Đoạn Giới Kiếm', emoji: '🌌', slot: 'weapon', rarity: 'SSR', price: 65000, levelReq: 38, atk: 135, cooldown: 290, range: 18, crit: 0.11, color: 0xb070ff, desc: 'Lưỡi kiếm cắt rách cả chiều không gian và bóng tối' },
  { id: 'demon_muramasa', name: 'Yêu Đao Muramasa Tà Huyết', emoji: '👹', slot: 'weapon', rarity: 'SSR', price: 78000, levelReq: 40, atk: 148, cooldown: 235, range: 18, crit: 0.16, speed: 0.06, color: 0xff3050, desc: 'Yêu đao khát máu chém nhanh như điện xẹt, bạo kích kinh hoàng' },
  { id: 'blood_scythe', name: 'Huyết Nguyệt Tử Thần Liêm', emoji: '🩸', slot: 'weapon', rarity: 'SSR', price: 90000, levelReq: 42, atk: 158, cooldown: 310, range: 20, crit: 0.14, regen: 5, color: 0xff2e55, desc: 'Lưỡi hái trăng máu đoạt sinh lực vạn vật nuôi chủ nhân' },
  { id: 'abyssal_greatsword', name: 'Thâm Uyên Ma Hoàng Kiếm', emoji: '👿', slot: 'weapon', rarity: 'SSR', price: 105000, levelReq: 44, atk: 170, cooldown: 300, range: 20, crit: 0.13, hp: 120, color: 0x9b4dff, desc: 'Trọng kiếm hắc ám rèn từ hắc tinh nơi đáy vực thẳm' },
  { id: 'dragon_blade', name: 'Viêm Long Phần Thiên Kiếm', emoji: '🐲', slot: 'weapon', rarity: 'SSR', price: 120000, levelReq: 46, atk: 182, cooldown: 280, range: 19, crit: 0.13, color: 0xff6a3a, desc: 'Thần kiếm rồng lửa thiêu rụi chiến trường trong chớp mắt' },
  { id: 'celestial_lotus_sword', name: 'Thiên Liên Tịnh Thế Kiếm', emoji: '🪷', slot: 'weapon', rarity: 'SSR', price: 138000, levelReq: 48, atk: 194, cooldown: 270, range: 19, crit: 0.14, regen: 7, color: 0xff85e0, desc: 'Kiếm sen hồng tiên giới thanh tẩy tà ma, hồi sinh lực dồi dào' },
  { id: 'phoenix_glaive', name: 'Chu Tước Niết Bàn Kiếm Thương', emoji: '🦅', slot: 'weapon', rarity: 'SSR', price: 155000, levelReq: 50, atk: 208, cooldown: 290, range: 24, crit: 0.15, hp: 150, color: 0xff942e, desc: 'Ngọn lửa bất diệt của thần điểu Chu Tước tái sinh vạn kiếp' },

  // ---- Nhóm 4: Kiếm Hiếm Chí Tôn Huyền Thoại (UR · Tỷ Lệ Rớt 0.01%) — Nổ Random Nhận ♾️ VĨNH VIỄN!
  { id: 'holy_sword', name: 'Thánh Kiếm Excalibur Ánh Sáng', emoji: '✨', slot: 'weapon', rarity: 'UR', price: 220000, levelReq: 54, atk: 240, cooldown: 265, range: 20, crit: 0.16, regen: 8, color: 0xfff6a0, desc: 'Kiếm Hiếm 0.01% · Thánh kiếm tối thượng phán quyết bóng tối' },
  { id: 'eternal_frost_emperor', name: 'Băng Đế Vĩnh Hằng Thần Kiếm', emoji: '🧊', slot: 'weapon', rarity: 'UR', price: 260000, levelReq: 56, atk: 265, cooldown: 255, range: 21, crit: 0.17, speed: 0.07, hp: 180, color: 0x80f8ff, desc: 'Kiếm Hiếm 0.01% · Tuyệt thế thần kiếm đóng băng cả thời gian' },
  { id: 'sun_god_saber', name: 'Thái Dương Thần Hoàng Kiếm', emoji: '☀️', slot: 'weapon', rarity: 'UR', price: 300000, levelReq: 58, atk: 290, cooldown: 250, range: 21, crit: 0.18, regen: 10, hp: 220, color: 0xffb830, desc: 'Kiếm Hiếm 0.01% · Mang sức nóng của mặt trời thiêu đốt chư thần' },
  { id: 'galaxy_emperor', name: 'Thiên Đế Ngân Hà Kiếm', emoji: '👑', slot: 'weapon', rarity: 'UR', price: 350000, levelReq: 60, atk: 320, cooldown: 240, range: 22, crit: 0.2, speed: 0.08, regen: 10, color: 0x70f8ff, desc: 'Kiếm Hiếm 0.01% · Tuyệt thế thần binh hội tụ tinh tú ngân hà' },
  { id: 'chaos_origin_blade', name: 'Hỗn Độn Khai Thiên Thần Kiếm', emoji: '🌀', slot: 'weapon', rarity: 'UR', price: 420000, levelReq: 62, atk: 355, cooldown: 235, range: 22, crit: 0.21, speed: 0.09, regen: 12, hp: 260, color: 0xe066ff, desc: 'Kiếm Hiếm 0.01% · Khởi nguyên vũ trụ, một kiếm phân định trời đất' },
  { id: 'cosmic_void_reaper', name: 'Vạn Giới Hư Vô Chí Tôn Kiếm', emoji: '🪐', slot: 'weapon', rarity: 'UR', price: 500000, levelReq: 65, atk: 390, cooldown: 225, range: 23, crit: 0.23, speed: 0.1, regen: 14, hp: 320, color: 0xff4da6, desc: 'Kiếm Hiếm 0.01% · Thần kiếm chúa tể thống lĩnh vạn giới tinh hà' },
  { id: 'immortal_sovereign_sword', name: 'Vạn Cổ Độc Tôn Thần Kiếm', emoji: '🔱', slot: 'weapon', rarity: 'UR', price: 650000, levelReq: 70, atk: 440, cooldown: 215, range: 24, crit: 0.25, speed: 0.12, regen: 18, hp: 400, color: 0xffe64d, desc: 'Kiếm Hiếm 0.01% · Đỉnh phong kiếm đạo độc tôn vô thượng' },
  // ---- chiến giáp huyền thoại (bán ở Tiệm Giáp)
  { id: 'cloth', name: 'Chiến Bào Tân Binh', emoji: '🧥', slot: 'armor', rarity: 'N', price: 0, levelReq: 1, def: 2, hp: 20, desc: 'Chiến bào thêu huy hiệu mạo hiểm giả kèm giáp vai nhẹ' },
  { id: 'leather', name: 'Giáp Chiến Lang', emoji: '🐺', slot: 'armor', rarity: 'N', price: 400, levelReq: 3, def: 6, hp: 55, speed: 0.04, desc: 'Giáp da sói hoang đính đinh tán đồng và cầu vai nanh thú' },
  { id: 'chain', name: 'Giáp Kỵ Sĩ Bạc', emoji: '⛓️', slot: 'armor', rarity: 'R', price: 2200, levelReq: 10, def: 13, hp: 135, desc: 'Giáp xích thép tinh luyện kèm áo choàng xanh kỵ sĩ đoàn' },
  { id: 'shadow_armor', name: 'Giáp Hắc Ám Sát Thần', emoji: '🦇', slot: 'armor', rarity: 'R', price: 5200, levelReq: 15, def: 19, hp: 190, crit: 0.08, speed: 0.08, desc: 'Chiến giáp bóng đêm tỏa sát khí tím và gai vai hắc tinh' },
  { id: 'steel', name: 'Giáp Thép Hoàng Gia', emoji: '🛡️', slot: 'armor', rarity: 'SR', price: 9000, levelReq: 20, def: 26, hp: 280, regen: 2, desc: 'Đại giáp bạch kim viền vàng ròng cùng áo choàng đỏ đế vương' },
  { id: 'mithril', name: 'Giáp Tinh Vân Mithril', emoji: '💠', slot: 'armor', rarity: 'SR', price: 30000, levelReq: 32, def: 40, hp: 460, speed: 0.08, regen: 4, desc: 'Giáp bạc thần thoại phát sáng hào quang băng tinh bất diệt' },
  { id: 'valkyrie_armor', name: 'Giáp Thánh Dực Valkyrie', emoji: '👼', slot: 'armor', rarity: 'SSR', price: 58000, levelReq: 39, def: 52, hp: 620, crit: 0.1, speed: 0.1, regen: 6, desc: 'Thánh giáp bạch kim đính đôi cánh thiên thần rực sáng' },
  { id: 'dragon_armor', name: 'Long Hoàng Chiến Giáp', emoji: '🐲', slot: 'armor', rarity: 'SSR', price: 90000, levelReq: 45, def: 68, hp: 850, crit: 0.12, regen: 10, desc: 'Chiến giáp rèn từ vảy Hỏa Long Vương với cặp sừng rồng rực lửa' },
  { id: 'celestial_armor', name: 'Thần Giáp Tinh Tú Tối Thượng', emoji: '🌌', slot: 'armor', rarity: 'UR', price: 185000, levelReq: 54, def: 95, hp: 1250, crit: 0.16, speed: 0.12, regen: 18, desc: 'Thần giáp vũ trụ hội tụ hào quang ngân hà và thánh dực tối thượng' },
  // ---- phụ kiện thần vật (Tiệm Giáp)
  { id: 'lantern', name: 'Đèn Lồng Tinh Hỏa', emoji: '🏮', slot: 'accessory', rarity: 'N', price: 500, levelReq: 1, def: 2, hp: 25, light: 45, desc: 'Lửa linh hồn soi sáng bóng tối sâu thẳm trong hang mỏ' },
  { id: 'boots', name: 'Chiến Hài Truy Phong', emoji: '👢', slot: 'accessory', rarity: 'R', price: 1500, levelReq: 5, def: 3, speed: 0.2, desc: 'Chiến hài khắc phù văn gió giúp lướt nhanh như chớp (+20% tốc chạy)' },
  { id: 'ring_life', name: 'Nhẫn Sinh Mệnh Cổ Đại', emoji: '💍', slot: 'accessory', rarity: 'R', price: 4000, levelReq: 12, hp: 160, regen: 6, desc: 'Bảo giới ngọc lục bảo tự hồi phục 6 HP mỗi giây' },
  { id: 'amulet', name: 'Hộ Phù Cuồng Chiến', emoji: '🧿', slot: 'accessory', rarity: 'SR', price: 9000, levelReq: 20, crit: 0.15, atk: 18, hp: 80, desc: 'Cổ ngữ chiến thần tăng +15% chí mạng và +18 tấn công' },
  { id: 'phoenix', name: 'Thánh Vũ Phượng Hoàng Lửa', emoji: '🪶', slot: 'accessory', rarity: 'UR', price: 40000, levelReq: 35, atk: 25, def: 12, hp: 400, regen: 16, speed: 0.12, desc: 'Lông vũ bất tử của thần điểu Chu Tước tái sinh sinh lực mãnh liệt' },
];

/** đồ tiệm + đồ độc quyền của boss */
export const ALL_EQUIPMENT: EquipDef[] = [...EQUIPMENT, ...BOSS_GEAR];
export const EQUIP_BY_ID = Object.fromEntries(ALL_EQUIPMENT.map((e) => [e.id, e]));

/** 3 Hộp Quà Random Thần Binh ở Tiệm Vũ Khí — Kiếm Hiếm UR tỉ lệ 0.01% · Kiếm Hiếm (SR/SSR/UR) luôn Vĩnh Viễn, chỉ Kiếm Thường (N/R) mới có hạn ngày! */
export const WEAPON_BOXES: WeaponBox[] = [
  {
    id: 'wbox_iron',
    name: 'Hộp Kiếm Chiến Trường',
    emoji: '🧰',
    cost: { gold: 900 },
    odds: { N: 0.80, R: 0.18, SR: 0.0189, SSR: 0.001, UR: 0.0001, MYTHIC: 0 },
    desc: 'Quay Random Kiếm · Kiếm Thường (N/R) có hạn 3–7 Ngày · Kiếm Hiếm (SR/SSR/UR) nhận ♾️ Vĩnh Viễn · Tỉ lệ UR 0.01%!',
    badge: 'KHỞI ĐẦU',
  },
  {
    id: 'wbox_mythic',
    name: 'Rương Danh Kiếm Huyền Thiết',
    emoji: '⚗️',
    cost: { gold: 6500 },
    odds: { N: 0.55, R: 0.38, SR: 0.0689, SSR: 0.001, UR: 0.0001, MYTHIC: 0 },
    desc: 'Tinh hoa lò rèn · Kiếm Thường có hạn ngày · Nổ Kiếm Hiếm (SR/SSR/UR) nhận ♾️ Vĩnh Viễn · Tỉ lệ UR 0.01%!',
    badge: '🔥 ĐÁNG MỞ',
  },
  {
    id: 'wbox_god',
    name: 'Hộp Thần Kiếm Chí Tôn VIP',
    emoji: '👑',
    cost: { gems: 55 },
    odds: { N: 0.25, R: 0.57, SR: 0.1789, SSR: 0.001, UR: 0.0001, MYTHIC: 0 },
    desc: 'Hộp VIP săn Thần Kiếm · Kiếm Hiếm (SR/SSR/UR) 100% ♾️ Vĩnh Viễn không có kiếm ngày · Tỉ lệ Chí Tôn UR 0.01%!',
    badge: '👑 SĂN UR 0.01%',
  },
];

/** Mở hộp quà trúng vũ khí đã sở hữu → quy đổi thành Xu rèn */
export const WEAPON_DUP_GOLD: Record<RodRarity, number> = {
  N: 250,
  R: 850,
  SR: 3200,
  SSR: 12000,
  UR: 35000,
  MYTHIC: 100000,
};

export type PotionCategory = 'heal' | 'elixir' | 'tonic';

export interface PotionDef {
  id: string;
  name: string;
  emoji: string;
  category: PotionCategory;
  price: number;
  sellPrice: number;
  heal: number;
  /** Hồi thể lực đào mỏ (⚡) khi uống */
  energy?: number;
  /** Hiệu ứng buff tạm thời khi uống */
  buffs?: { id: BuffId; value: number; min: number }[];
  desc: string;
  tag?: string;
}

/** Danh mục thuốc, linh dược & thuốc bổ bán ở Tiệm Thuốc Dược sư Lan */
export const SHOP_POTIONS: PotionDef[] = [
  // ---- Nhóm 1: Thuốc Trị Thương & Hồi Phục HP ('heal')
  {
    id: 'potion_s',
    name: 'Bình máu nhỏ',
    emoji: '🧪',
    category: 'heal',
    price: 50,
    sellPrice: 20,
    heal: 80,
    tag: 'Sơ cấp',
    desc: 'Nước cốt thảo dược xanh dịu nhẹ, cầm máu nhanh cho tân binh.',
  },
  {
    id: 'potion_herb',
    name: 'Cao Thảo Dược',
    emoji: '🌿',
    category: 'heal',
    price: 110,
    sellPrice: 44,
    heal: 180,
    tag: 'Thảo mộc',
    desc: 'Cao cô đặc từ lá thuốc rừng già, thơm mát và lành vết thương.',
  },
  {
    id: 'potion_m',
    name: 'Bình máu vừa',
    emoji: '🍷',
    category: 'heal',
    price: 220,
    sellPrice: 80,
    heal: 300,
    tag: 'Thông dụng',
    desc: 'Rượu thuốc ủ từ quả mọng đỏ, hồi phục sinh lực tức thì.',
  },
  {
    id: 'potion_honey',
    name: 'Mật Ong Nhân Sâm',
    emoji: '🍯',
    category: 'heal',
    price: 380,
    sellPrice: 150,
    heal: 480,
    buffs: [{ id: 'def', value: 0.15, min: 4 }],
    tag: 'Bổ huyết',
    desc: 'Mật ong rừng ngâm sâm núi, vừa bổ huyết vừa tăng sức đề kháng.',
  },
  {
    id: 'potion_l',
    name: 'Bình máu lớn',
    emoji: '⚗️',
    category: 'heal',
    price: 600,
    sellPrice: 200,
    heal: 700,
    tag: 'Cao cấp',
    desc: 'Bình giả kim tinh luyện độ thuần khiết cao, cứu nguy giữa vòng vây quái.',
  },
  {
    id: 'potion_xl',
    name: 'Tiên dược',
    emoji: '💖',
    category: 'heal',
    price: 1500,
    sellPrice: 500,
    heal: 1500,
    tag: 'Thượng hạng',
    desc: 'Linh dịch ánh hồng quý giá, kéo mạo hiểm giả từ bờ vực tử thần.',
  },
  {
    id: 'potion_phoenix',
    name: 'Huyết Phượng Hoàng',
    emoji: '🐦‍🔥',
    category: 'heal',
    price: 3200,
    sellPrice: 1100,
    heal: 3000,
    buffs: [{ id: 'atk', value: 0.2, min: 6 }],
    tag: 'Cực phẩm',
    desc: 'Giọt máu lửa bất diệt tái tạo sinh lực cực đại và bùng nổ sức chiến đấu.',
  },
  {
    id: 'potion_divine',
    name: 'Thần Dược Cửu Chuyển',
    emoji: '🌟',
    category: 'heal',
    price: 6500,
    sellPrice: 2200,
    heal: 6000,
    energy: 40,
    tag: 'Thần thoại',
    desc: 'Tuyệt phẩm y thuật truyền thuyết, hồi phục toàn diện sinh lực và thể lực.',
  },

  // ---- Nhóm 2: Linh Dược Chiến Đấu & Khám Phá ('elixir')
  {
    id: 'elixir_atk',
    name: 'Cuồng Nộ Đan',
    emoji: '🔥',
    category: 'elixir',
    price: 450,
    sellPrice: 180,
    heal: 200,
    buffs: [{ id: 'atk', value: 0.25, min: 8 }],
    tag: 'Chiến đấu',
    desc: 'Kích phát huyết khí sục sôi, mỗi đòn chém đều mang uy lực sấm sét.',
  },
  {
    id: 'elixir_def',
    name: 'Kim Cang Hộ Thể',
    emoji: '🛡️',
    category: 'elixir',
    price: 420,
    sellPrice: 165,
    heal: 250,
    buffs: [{ id: 'def', value: 0.3, min: 8 }],
    tag: 'Phòng ngự',
    desc: 'Bao phủ cơ thể bằng lớp giáp khí vô hình, đứng vững trước đòn Boss.',
  },
  {
    id: 'elixir_speed',
    name: 'Phong Hành Đan',
    emoji: '🌪️',
    category: 'elixir',
    price: 350,
    sellPrice: 140,
    heal: 150,
    buffs: [{ id: 'speed', value: 0.25, min: 10 }],
    tag: 'Thần tốc',
    desc: 'Nhẹ bước như cưỡi gió, chạy bản đồ thần tốc và né kỹ năng Boss mượt mà.',
  },
  {
    id: 'elixir_luck',
    name: 'Linh Dược Cỏ Bốn Lá',
    emoji: '🍀',
    category: 'elixir',
    price: 480,
    sellPrice: 190,
    heal: 150,
    buffs: [{ id: 'luck', value: 0.35, min: 10 }],
    tag: 'Câu cá',
    desc: 'Tinh chất cỏ bốn lá hội tụ, ra hồ thả câu là cá quý cá khủng tự tìm tới.',
  },
  {
    id: 'elixir_gold',
    name: 'Kim Tài Linh Dược',
    emoji: '💰',
    category: 'elixir',
    price: 650,
    sellPrice: 260,
    heal: 200,
    buffs: [{ id: 'gold', value: 0.3, min: 10 }],
    tag: 'Tài lộc',
    desc: 'Hương kim tiền thu hút vận may, hạ quái rơi thêm hàng đống xu vàng.',
  },
  {
    id: 'elixir_xp',
    name: 'Minh Tâm Huệ Đan',
    emoji: '📘',
    category: 'elixir',
    price: 650,
    sellPrice: 260,
    heal: 200,
    buffs: [{ id: 'xp', value: 0.3, min: 10 }],
    tag: 'Tu luyện',
    desc: 'Khai thông trí tuệ và cảm ngộ chiến đấu, giúp thăng cấp nhanh vượt bậc.',
  },
  {
    id: 'elixir_war',
    name: 'Chiến Thần Đại Hoàn Đan',
    emoji: '⚡',
    category: 'elixir',
    price: 1800,
    sellPrice: 700,
    heal: 1200,
    buffs: [
      { id: 'atk', value: 0.35, min: 12 },
      { id: 'def', value: 0.35, min: 12 },
      { id: 'speed', value: 0.2, min: 12 },
    ],
    tag: 'Săn Boss',
    desc: 'Bí dược tối thượng kích hoạt cùng lúc 3 hiệu ứng: Cuồng lực, Da đồng & Lanh lẹ!',
  },

  // ---- Nhóm 3: Thuốc Bổ Thể Lực & Thanh Lọc ('tonic')
  {
    id: 'tonic_energy',
    name: 'Thuốc Tăng Lực Thợ Mỏ',
    emoji: '⚡',
    category: 'tonic',
    price: 260,
    sellPrice: 100,
    heal: 120,
    energy: 25,
    tag: 'Đào mỏ',
    desc: 'Nước sâm khoáng chất xua tan mệt mỏi, hồi ngay 25 ⚡ thể lực để đào quặng.',
  },
  {
    id: 'tonic_ginseng',
    name: 'Sâm Ngọc Linh Tinh Chế',
    emoji: '🫚',
    category: 'tonic',
    price: 620,
    sellPrice: 240,
    heal: 400,
    energy: 60,
    tag: 'Đại bổ',
    desc: 'Nhân sâm ngàn năm cô đặc, nạp 60 ⚡ thể lực để chinh phục tầng mỏ sâu.',
  },
  {
    id: 'tonic_cleanse',
    name: 'Thanh Tâm Giải Độc Lộ',
    emoji: '💧',
    category: 'tonic',
    price: 320,
    sellPrice: 125,
    heal: 450,
    energy: 15,
    buffs: [{ id: 'xp', value: 0.15, min: 6 }],
    tag: 'Thanh lọc',
    desc: 'Sương mai tinh khiết thanh lọc cơ thể, phục hồi cả sinh lực lẫn tinh thần.',
  },
];

export const POTION_BY_ID: Record<string, PotionDef> = Object.fromEntries(SHOP_POTIONS.map((p) => [p.id, p]));

export interface AlchemyRecipeDef {
  id: string;
  outputId: string;
  outputQty: number;
  goldCost: number;
  inputs: Record<string, number>;
  note: string;
}

/** Công thức Lò Luyện Đan của Dược sư Lan: dùng thảo mộc / nông sản / chiến lợi phẩm để điều chế thuốc */
export const ALCHEMY_RECIPES: AlchemyRecipeDef[] = [
  {
    id: 'brew_herb',
    outputId: 'potion_herb',
    outputQty: 3,
    goldCost: 60,
    inputs: { wheat: 2, carrot: 1, slime_gel: 1 },
    note: 'Chưng cất 3 lọ Cao Thảo Dược với chi phí chỉ bằng 1/3 giá tiệm',
  },
  {
    id: 'brew_honey',
    outputId: 'potion_honey',
    outputQty: 2,
    goldCost: 120,
    inputs: { honey: 1, strawberry: 2 },
    note: 'Ngâm mật ong rừng cùng dâu tây tươi tạo ra 2 hũ thuốc bổ huyết',
  },
  {
    id: 'brew_potion_l',
    outputId: 'potion_l',
    outputQty: 2,
    goldCost: 220,
    inputs: { tomato: 2, apple: 1, wolf_fang: 1 },
    note: 'Cô đặc 2 Bình máu lớn từ trái cây đỏ và nanh sói nghiền mịn',
  },
  {
    id: 'brew_tonic_energy',
    outputId: 'tonic_energy',
    outputQty: 2,
    goldCost: 90,
    inputs: { banana: 2, milk: 1 },
    note: 'Ủ sữa tươi với chuối chín giàu năng lượng cho thợ mỏ',
  },
  {
    id: 'brew_elixir_atk',
    outputId: 'elixir_atk',
    outputQty: 2,
    goldCost: 180,
    inputs: { wolf_fang: 2, tomato: 1 },
    note: 'Luyện 2 viên Cuồng Nộ Đan kích phát +25% sức tấn công',
  },
  {
    id: 'brew_elixir_luck',
    outputId: 'elixir_luck',
    outputQty: 2,
    goldCost: 180,
    inputs: { peach: 1, orange: 1, slime_gel: 1 },
    note: 'Tinh chế 2 lọ Linh Dược Cỏ Bốn Lá giúp câu cá hiếm dễ dàng',
  },
  {
    id: 'brew_phoenix',
    outputId: 'potion_phoenix',
    outputQty: 1,
    goldCost: 500,
    inputs: { fire_core: 1, crystal: 1, cherry: 1 },
    note: 'Dung hợp Lõi lửa và Pha lê xanh tạo nên Huyết Phượng Hoàng',
  },
  {
    id: 'brew_war',
    outputId: 'elixir_war',
    outputQty: 1,
    goldCost: 400,
    inputs: { crystal: 1, honey: 1, wolf_fang: 2 },
    note: 'Luyện Chiến Thần Đại Hoàn Đan tăng toàn diện Công · Thủ · Tốc',
  },
];
