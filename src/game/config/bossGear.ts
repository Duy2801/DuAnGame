import type { EquipDef } from '../types';

// Trang bị độc quyền của 20 boss — không bán ở tiệm. Hạ boss lần đầu chắc chắn rơi, các lần sau 25% (logic/boss.ts).
// Chỉ số nhỉnh hơn đồ tiệm cùng cấp. Hình vũ khí: WEAPON_STYLE (art/rodArt.ts), hình giáp: ARMOR_LOOK (art/avatar.ts).

const g = (e: Omit<EquipDef, 'price'>): EquipDef => ({ ...e, price: 0 });

export const BOSS_GEAR: EquipDef[] = [
  g({ id: 'slime_crown', boss: 'king_slime', name: 'Vương Miện Slime', emoji: '👑', slot: 'accessory', rarity: 'R', levelReq: 1, hp: 40, def: 1, regen: 2, desc: 'Mềm mềm, dẻo dẻo, hồi máu dần' }),
  g({ id: 'dream_blade', boss: 'mushroom_lord', name: 'Kiếm Nấm Mộng', emoji: '🍄', slot: 'weapon', rarity: 'R', levelReq: 4, atk: 12, cooldown: 300, range: 14, crit: 0.05, color: 0xd8a0ff, desc: 'Lưỡi kiếm tỏa bào tử ánh tím' }),
  g({ id: 'frog_mail', boss: 'frog_titan', name: 'Giáp Da Ếch Chúa', emoji: '🐸', slot: 'armor', rarity: 'R', levelReq: 7, def: 7, hp: 90, speed: 0.05, desc: 'Trơn bóng, né đòn dễ hơn' }),
  g({ id: 'fenrir_fang', boss: 'wolf_alpha', name: 'Nanh Fenrir', emoji: '🐺', slot: 'weapon', rarity: 'R', levelReq: 10, atk: 26, cooldown: 210, range: 12, crit: 0.12, color: 0xa8a8ff, desc: 'Dao găm từ nanh sói đầu đàn' }),
  g({ id: 'crab_shell', boss: 'crab_king', name: 'Giáp Mai Cua Vương', emoji: '🦀', slot: 'armor', rarity: 'SR', levelReq: 13, def: 14, hp: 170, desc: 'Cứng như đá ngầm' }),
  g({ id: 'warlord_axe', boss: 'goblin_warlord', name: 'Rìu Thủ Lĩnh', emoji: '🪓', slot: 'weapon', rarity: 'SR', levelReq: 16, atk: 62, cooldown: 520, range: 16, crit: 0.06, color: 0x9ad040, desc: 'Mỗi nhát bổ rung cả trại goblin' }),
  g({ id: 'lich_amulet', boss: 'lich', name: 'Bùa Hồn Lich', emoji: '💀', slot: 'accessory', rarity: 'SR', levelReq: 19, atk: 14, crit: 0.08, regen: 4, desc: 'Linh hồn cổ xưa thì thầm sức mạnh' }),
  g({ id: 'blood_fang', boss: 'vampire_bat', name: 'Huyết Nha', emoji: '🩸', slot: 'weapon', rarity: 'SR', levelReq: 22, atk: 60, cooldown: 200, range: 12, crit: 0.15, color: 0xff4060, desc: 'Dao găm đỏ thẫm, nhanh như chớp' }),
  g({ id: 'sand_armor', boss: 'scorpion_emperor', name: 'Giáp Sa Hoàng', emoji: '🦂', slot: 'armor', rarity: 'SR', levelReq: 25, def: 24, hp: 320, speed: 0.05, desc: 'Vảy vàng của hoàng đế sa mạc' }),
  g({ id: 'titan_sword', boss: 'ancient_golem', name: 'Đại Kiếm Cổ Thần', emoji: '🗿', slot: 'weapon', rarity: 'SR', levelReq: 28, atk: 100, cooldown: 380, range: 19, color: 0xf2d070, desc: 'Khắc cổ ngữ của nền văn minh đã mất' }),
  g({ id: 'frost_heart', boss: 'frost_wolf', name: 'Tim Băng Lang', emoji: '❄️', slot: 'accessory', rarity: 'SSR', levelReq: 31, hp: 230, speed: 0.15, regen: 6, desc: 'Lạnh buốt mà đập mạnh mẽ' }),
  g({ id: 'yeti_fur', boss: 'yeti_king', name: 'Áo Lông Yeti Vương', emoji: '🧥', slot: 'armor', rarity: 'SSR', levelReq: 34, def: 32, hp: 440, desc: 'Ấm áp giữa bão tuyết' }),
  g({ id: 'prism_blade', boss: 'crystal_titan', name: 'Kiếm Lăng Kính', emoji: '🔷', slot: 'weapon', rarity: 'SSR', levelReq: 37, atk: 130, cooldown: 290, range: 17, crit: 0.1, color: 0x9ff0ff, desc: 'Bẻ ánh sáng thành bảy sắc cầu vồng' }),
  g({ id: 'banshee_veil', boss: 'banshee', name: 'Khăn Voan Nữ Vương', emoji: '👻', slot: 'accessory', rarity: 'SSR', levelReq: 40, atk: 25, crit: 0.18, speed: 0.1, desc: 'Lướt đi như hồn ma' }),
  g({ id: 'widow_spear', boss: 'spider_queen', name: 'Thương Góa Phụ', emoji: '🕷️', slot: 'weapon', rarity: 'SSR', levelReq: 43, atk: 152, cooldown: 400, range: 24, crit: 0.08, color: 0xd080ff, desc: 'Mũi thương tẩm độc nữ hoàng' }),
  g({ id: 'ogre_plate', boss: 'ogre_king', name: 'Giáp Chiến Vương Orc', emoji: '🛡️', slot: 'armor', rarity: 'SSR', levelReq: 46, def: 48, hp: 660, desc: 'Nặng trịch nhưng không gì xuyên thủng' }),
  g({ id: 'hellfire_blade', boss: 'demon_lord', name: 'Kiếm Hỏa Ngục', emoji: '🔥', slot: 'weapon', rarity: 'UR', levelReq: 49, atk: 192, cooldown: 300, range: 19, crit: 0.1, color: 0xff6a20, desc: 'Lửa địa ngục cháy mãi không tắt' }),
  g({ id: 'magma_core', boss: 'magma_colossus', name: 'Lõi Dung Nham', emoji: '🌋', slot: 'accessory', rarity: 'UR', levelReq: 52, atk: 40, hp: 420, regen: 15, desc: 'Trái tim nóng rực của cự thần' }),
  g({ id: 'abyss_armor', boss: 'abyss_knight', name: 'Giáp Vực Thẳm', emoji: '🌑', slot: 'armor', rarity: 'UR', levelReq: 55, def: 58, hp: 820, crit: 0.05, desc: 'Bóng tối nuốt trọn mọi đòn đánh' }),
  g({ id: 'dragon_god_blade', boss: 'fire_dragon', name: 'Thần Long Kiếm', emoji: '🐲', slot: 'weapon', rarity: 'UR', levelReq: 58, atk: 265, cooldown: 270, range: 21, crit: 0.15, color: 0xffa040, desc: 'Báu vật tối thượng từ Rồng Lửa' }),
];

export const BOSS_GEAR_OF: Record<string, EquipDef> = Object.fromEntries(BOSS_GEAR.map((e) => [e.boss!, e]));
