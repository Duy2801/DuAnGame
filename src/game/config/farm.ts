import type { BuildingDef, BuildingId, CropDef, FertilizerKind, ItemDef, RecipeDef } from '../types';
import { SHOP_POTIONS } from './equipment';
import { FISH } from './life';
import { ORE_ITEMS } from './mine';

export interface FarmSupplyDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  desc: string;
  fert?: FertilizerKind;
  speedCut?: number;
  bumperBonus?: number;
}

export const FARM_SUPPLIES: FarmSupplyDef[] = [
  { id: 'fert_basic', name: 'Phân hữu cơ', emoji: '🌿', price: 4, fert: 'basic', speedCut: 0.1, bumperBonus: 0.05, desc: 'Dinh dưỡng thiết yếu để cây đơm hoa kết trái · +10% tốc lớn' },
  { id: 'fert_super', name: 'Phân NPK Siêu Tốc', emoji: '⚡', price: 18, fert: 'super', speedCut: 0.35, bumperBonus: 0.15, desc: 'Rút ngắn 35% thời gian lớn · +15% tỉ lệ bội thu' },
  { id: 'fert_gold', name: 'Phân Hoàng Kim', emoji: '🌟', price: 55, fert: 'gold', speedCut: 0.5, bumperBonus: 0.4, desc: 'Giảm 50% thời gian lớn · +40% tỉ lệ bội thu ×3 sản lượng!' },
  { id: 'pesticide', name: 'Thuốc thảo mộc trừ sâu', emoji: '🧴', price: 8, desc: 'Diệt sạch sâu rầy, làm sạch cỏ dại & bảo vệ cây trồng' },
];

export const RANCH_SUPPLIES: { id: string; name: string; emoji: string; price: number; desc: string }[] = [
  { id: 'vet_vaccine', name: 'Vắc-xin thú y', emoji: '💉', price: 15, desc: 'Chích ngừa phòng dịch bắt buộc mỗi lứa, giúp vật nuôi khỏe mạnh' },
  { id: 'vet_medicine', name: 'Thuốc đặc trị thú y', emoji: '💊', price: 25, desc: 'Chữa khỏi ngay vật nuôi đang bị ốm sốt, phục hồi sức sản xuất' },
  { id: 'animal_feed', name: 'Cám dinh dưỡng tổng hợp', emoji: '🌾', price: 12, desc: 'Thức ăn đa năng có thể thay thế nông sản cho mọi vật nuôi' },
];

// Thời gian để ngắn cho dễ test. Khi ra bản thật chỉ cần sửa số ở đây.
export const CROPS: CropDef[] = [
  // ---- Rau củ & Lương thực
  { id: 'wheat', name: 'Lúa mì', emoji: '🌾', growSec: 20, yield: 2, sellPrice: 6, seedCost: 5, rankReq: 0, category: 'veg', desc: 'Lương thực cơ bản để làm bánh và chăn nuôi' },
  { id: 'carrot', name: 'Cà rốt', emoji: '🥕', growSec: 50, yield: 2, sellPrice: 15, seedCost: 12, rankReq: 0, category: 'veg', desc: 'Củ giòn ngọt, thức ăn ưa thích của cừu' },
  { id: 'tomato', name: 'Cà chua đỏ', emoji: '🍅', growSec: 140, yield: 3, sellPrice: 30, seedCost: 35, rankReq: 1, category: 'veg', desc: 'Quả mọng đỏ tươi, nấu canh hay hầm đều ngon' },
  { id: 'corn', name: 'Ngô ngọt', emoji: '🌽', growSec: 280, yield: 3, sellPrice: 60, seedCost: 70, rankReq: 2, category: 'veg', desc: 'Bắp ngô vàng óng, hạt chắc mẩy' },
  { id: 'pumpkin', name: 'Bí ngô', emoji: '🎃', growSec: 650, yield: 2, sellPrice: 220, seedCost: 140, rankReq: 3, category: 'veg', desc: 'Quả bí khổng lồ bán rất được giá ở chợ' },
  { id: 'mushroom', name: 'Nấm phát sáng', emoji: '🍄', growSec: 500, yield: 2, sellPrice: 320, seedCost: null, rankReq: 0, category: 'veg', desc: 'Giống nấm quý hiếm rơi ra từ nhiệm vụ Hội' },
  // ---- Hoa Quả Thật (Vườn Cây Ăn Trái)
  { id: 'strawberry', name: 'Dâu tây Đà Lạt', emoji: '🍓', growSec: 75, yield: 3, sellPrice: 26, seedCost: 24, rankReq: 0, category: 'fruit', desc: 'Dâu tây chín đỏ mọng, thơm lừng vị ngọt thanh' },
  { id: 'watermelon', name: 'Dưa hấu đỏ', emoji: '🍉', growSec: 120, yield: 2, sellPrice: 52, seedCost: 45, rankReq: 0, category: 'fruit', desc: 'Dưa hấu vỏ xanh sọc đậm, ruột đỏ mọng nước giải nhiệt' },
  { id: 'banana', name: 'Chuối tiêu chín', emoji: '🍌', growSec: 170, yield: 3, sellPrice: 46, seedCost: 52, rankReq: 0, category: 'fruit', desc: 'Buồng chuối chín vàng ươm, giàu năng lượng' },
  { id: 'orange', name: 'Cam sành mọng nước', emoji: '🍊', growSec: 210, yield: 3, sellPrice: 62, seedCost: 68, rankReq: 1, category: 'fruit', desc: 'Cam vàng tươi giàu vitamin, tép cam mọng nước' },
  { id: 'apple', name: 'Táo đỏ mật', emoji: '🍎', growSec: 260, yield: 3, sellPrice: 82, seedCost: 88, rankReq: 1, category: 'fruit', desc: 'Táo đỏ giòn tan, căng bóng trĩu cành' },
  { id: 'grape', name: 'Nho tím Ninh Thuận', emoji: '🍇', growSec: 340, yield: 3, sellPrice: 110, seedCost: 118, rankReq: 1, category: 'fruit', desc: 'Chùm nho tím sai trĩu quả trên giàn gỗ' },
  { id: 'pineapple', name: 'Dứa mật vàng', emoji: '🍍', growSec: 400, yield: 2, sellPrice: 175, seedCost: 135, rankReq: 2, category: 'fruit', desc: 'Quả dứa mắt vàng thơm phức đặc trưng vùng nhiệt đới' },
  { id: 'mango', name: 'Xoài cát Hòa Lộc', emoji: '🥭', growSec: 480, yield: 3, sellPrice: 155, seedCost: 160, rankReq: 2, category: 'fruit', desc: 'Xoài chín vàng ươm, thịt dày ngọt lịm' },
  { id: 'peach', name: 'Đào hồng tiên', emoji: '🍑', growSec: 560, yield: 3, sellPrice: 205, seedCost: 200, rankReq: 2, category: 'fruit', desc: 'Đào má hồng phớt mịn màng, hương thơm dịu ngọt' },
  { id: 'cherry', name: 'Anh đào Cherry đỏ', emoji: '🍒', growSec: 680, yield: 3, sellPrice: 260, seedCost: 245, rankReq: 3, category: 'fruit', desc: 'Chùm cherry đỏ thẫm cao cấp được thương nhân săn đón' },
  { id: 'fairyberry', name: 'Dâu rừng hoàng kim', emoji: '🍓', growSec: 900, yield: 2, sellPrice: 650, seedCost: null, rankReq: 0, category: 'fruit', desc: 'Giống dâu quý hiếm chỉ rơi từ quái và nhiệm vụ Hội' },
];

export const RECIPES: RecipeDef[] = [
  { id: 'bread', name: 'Bánh mì', emoji: '🍞', inputs: { wheat: 3 }, kitchenLevel: 1, successBonus: 0.08, timeCut: 0, sellPrice: 25 },
  { id: 'carrot_soup', name: 'Súp cà rốt', emoji: '🥣', inputs: { carrot: 2, wheat: 1 }, kitchenLevel: 1, successBonus: 0.12, timeCut: 0.05, sellPrice: 45, buff: { id: 'speed', value: 0.1, min: 5 } },
  { id: 'watermelon_juice', name: 'Nước ép dưa hấu', emoji: '🍉', inputs: { watermelon: 2 }, kitchenLevel: 1, successBonus: 0.14, timeCut: 0.06, sellPrice: 130, buff: { id: 'speed', value: 0.15, min: 6 } },
  { id: 'berry_smoothie', name: 'Sinh tố dâu chuối', emoji: '🥤', inputs: { strawberry: 2, banana: 1, milk: 1 }, kitchenLevel: 1, successBonus: 0.16, timeCut: 0.08, sellPrice: 240, buff: { id: 'xp', value: 0.15, min: 6 } },
  { id: 'tomato_stew', name: 'Cà chua hầm', emoji: '🍲', inputs: { tomato: 2, carrot: 1 }, kitchenLevel: 2, successBonus: 0.18, timeCut: 0.1, sellPrice: 100, buff: { id: 'atk', value: 0.15, min: 5 } },
  { id: 'apple_pie', name: 'Bánh táo nướng mật', emoji: '🥧', inputs: { apple: 2, wheat: 2, egg: 1 }, kitchenLevel: 2, successBonus: 0.22, timeCut: 0.12, sellPrice: 260, buff: { id: 'def', value: 0.25, min: 7 } },
  { id: 'peach_tea', name: 'Trà đào cam sả', emoji: '🍹', inputs: { peach: 1, orange: 2 }, kitchenLevel: 2, successBonus: 0.24, timeCut: 0.12, sellPrice: 390, buff: { id: 'luck', value: 0.25, min: 8 } },
  { id: 'pumpkin_pie', name: 'Bánh bí ngô', emoji: '🥧', inputs: { pumpkin: 1, corn: 1, wheat: 2 }, kitchenLevel: 3, successBonus: 0.25, timeCut: 0.15, sellPrice: 400, buff: { id: 'gold', value: 0.25, min: 8 } },
  { id: 'fruit_platter', name: 'Mâm ngũ quả nhiệt đới', emoji: '🍍', inputs: { mango: 1, pineapple: 1, grape: 1, cherry: 1 }, kitchenLevel: 3, successBonus: 0.32, timeCut: 0.2, sellPrice: 820, buff: { id: 'gold', value: 0.3, min: 10 } },
  { id: 'fairy_tart', name: 'Tart tinh linh', emoji: '🧁', inputs: { fairyberry: 1, mushroom: 1, wheat: 2 }, kitchenLevel: 3, successBonus: 0.35, timeCut: 0.25, sellPrice: 1200, buff: { id: 'xp', value: 0.3, min: 10 } },
  { id: 'omelette', name: 'Trứng chiên', emoji: '🍳', inputs: { egg: 2, wheat: 1 }, kitchenLevel: 1, successBonus: 0.1, timeCut: 0, sellPrice: 70, buff: { id: 'def', value: 0.2, min: 5 } },
  { id: 'warm_milk', name: 'Sữa ấm', emoji: '☕', inputs: { milk: 1 }, kitchenLevel: 2, successBonus: 0.15, timeCut: 0.05, sellPrice: 160, buff: { id: 'def', value: 0.3, min: 6 } },
  // món từ cá & sữa: nối câu cá / chăn nuôi với đánh quái
  { id: 'grilled_fish', name: 'Cá nướng', emoji: '🍢', inputs: { fish_crucian: 2, wheat: 1 }, kitchenLevel: 1, successBonus: 0.1, timeCut: 0, sellPrice: 75, buff: { id: 'luck', value: 0.15, min: 6 } },
  { id: 'fish_soup', name: 'Canh chua cá', emoji: '🍜', inputs: { fish_perch: 1, tomato: 1 }, kitchenLevel: 2, successBonus: 0.16, timeCut: 0.08, sellPrice: 150, buff: { id: 'xp', value: 0.15, min: 6 } },
  { id: 'cheese', name: 'Phô mai', emoji: '🧀', inputs: { milk: 2 }, kitchenLevel: 2, successBonus: 0.15, timeCut: 0.05, sellPrice: 380, buff: { id: 'speed', value: 0.2, min: 6 } },
  { id: 'sushi', name: 'Sushi cá hồi', emoji: '🍣', inputs: { fish_salmon: 1, wheat: 2 }, kitchenLevel: 3, successBonus: 0.3, timeCut: 0.2, sellPrice: 520, buff: { id: 'luck', value: 0.35, min: 8 } },
  { id: 'hotpot', name: 'Lẩu cá trê', emoji: '🥘', inputs: { fish_catfish: 1, corn: 1, carrot: 2 }, kitchenLevel: 3, successBonus: 0.3, timeCut: 0.2, sellPrice: 480, buff: { id: 'atk', value: 0.3, min: 8 } },
  { id: 'sponge_cake', name: 'Bánh bông lan', emoji: '🍰', inputs: { egg: 2, milk: 1, wheat: 2 }, kitchenLevel: 3, successBonus: 0.25, timeCut: 0.15, sellPrice: 420, buff: { id: 'gold', value: 0.2, min: 8 } },
];

const MATERIALS: ItemDef[] = [
  { id: 'slime_gel', name: 'Gel slime', emoji: '💧', kind: 'material', sellPrice: 40 },
  { id: 'wolf_fang', name: 'Nanh sói', emoji: '🦷', kind: 'material', sellPrice: 90 },
  { id: 'crystal', name: 'Pha lê xanh', emoji: '🔷', kind: 'material', sellPrice: 250 },
  { id: 'goblin_relic', name: 'Cổ vật goblin', emoji: '🏺', kind: 'material', sellPrice: 500 },
  { id: 'dragon_scale', name: 'Vảy rồng', emoji: '🐲', kind: 'material', sellPrice: 1200 },
  { id: 'fire_core', name: 'Lõi lửa', emoji: '🔥', kind: 'material', sellPrice: 400 },
  { id: 'egg', name: 'Trứng gà', emoji: '🥚', kind: 'animal', sellPrice: 25 },
  { id: 'wool', name: 'Len cừu', emoji: '🧶', kind: 'animal', sellPrice: 95 },
  { id: 'milk', name: 'Sữa bò', emoji: '🥛', kind: 'animal', sellPrice: 120 },
  { id: 'pork', name: 'Thịt heo tươi', emoji: '🥩', kind: 'animal', sellPrice: 165 },
  { id: 'honey', name: 'Mật ong rừng', emoji: '🍯', kind: 'animal', sellPrice: 140 },
  ...FARM_SUPPLIES.map((s): ItemDef => ({ id: s.id, name: s.name, emoji: s.emoji, kind: 'material', sellPrice: Math.max(1, Math.round(s.price * 0.4)) })),
  ...RANCH_SUPPLIES.map((s): ItemDef => ({ id: s.id, name: s.name, emoji: s.emoji, kind: 'material', sellPrice: Math.max(1, Math.round(s.price * 0.4)) })),
  ...SHOP_POTIONS.map((p): ItemDef => ({ id: p.id, name: p.name, emoji: p.emoji, kind: 'potion', sellPrice: p.sellPrice })),
  { id: 'bait_worm', name: 'Mồi Giun Đào Đất Đỏ', emoji: '🪱', kind: 'bait', sellPrice: 2 },
  { id: 'bait_dough', name: 'Mồi Cám Thơm Ngũ Cốc', emoji: '🌾', kind: 'bait', sellPrice: 4 },
  { id: 'bait_cricket', name: 'Mồi Dế Cơm Béo Ngậy', emoji: '🦗', kind: 'bait', sellPrice: 6 },
  { id: 'bait_shrimp', name: 'Mồi Tôm Bạc Tươi Sống', emoji: '🦐', kind: 'bait', sellPrice: 12 },
  { id: 'bait_squid', name: 'Mồi Mực Ống Cắt Khứa', emoji: '🦑', kind: 'bait', sellPrice: 22 },
  { id: 'bait_glow', name: 'Mồi Sứa Dạ Quang Vực Thẳm', emoji: '🪼', kind: 'bait', sellPrice: 35 },
  { id: 'bait_lure_silver', name: 'Mồi Cá Giả Bạc Cơ Khí', emoji: '🐟', kind: 'bait', sellPrice: 55 },
  { id: 'bait_gold', name: 'Mồi Kim Thiền Hoàng Kim', emoji: '🐝', kind: 'bait', sellPrice: 80 },
  { id: 'bait_dragon_blood', name: 'Mồi Huyết Tinh Hải Vương', emoji: '🩸', kind: 'bait', sellPrice: 150 },
  { id: 'bait_abyss', name: 'Mồi Long Châu Thần Thoại', emoji: '🔮', kind: 'bait', sellPrice: 260 },
  ...FISH.map((f): ItemDef => ({ id: f.id, name: f.name, emoji: f.emoji, kind: 'fish', sellPrice: f.price })),
  ...ORE_ITEMS.map((o): ItemDef => ({ id: o.id, name: o.name, emoji: o.emoji, kind: 'ore', sellPrice: o.price })),
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    ...CROPS.map((c): ItemDef => ({ id: c.id, name: c.name, emoji: c.emoji, kind: 'crop', sellPrice: c.sellPrice })),
    ...CROPS.map(
      (c): ItemDef => ({
        id: `seed_${c.id}`, name: `Hạt ${c.name.toLowerCase()}`, emoji: '🌰', kind: 'seed',
        sellPrice: c.seedCost === null ? Math.round(c.sellPrice * 0.3) : Math.max(1, Math.round(c.seedCost * 0.4)),
      }),
    ),
    ...RECIPES.map((r): ItemDef => ({ id: r.id, name: r.name, emoji: r.emoji, kind: 'food', sellPrice: r.sellPrice })),
    ...MATERIALS,
  ].map((i) => [i.id, i]),
);

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'windmill', name: 'Cối xay gió', emoji: '⚙️', maxLevel: 10,
    cost: (l) => Math.round(400 * 1.85 ** l),
    effect: (l) => (l === 0 ? 'Chưa xây' : `+${l * 5} vàng/phút, chạy cả khi offline`),
  },
  {
    id: 'well', name: 'Giếng nước', emoji: '⛲', maxLevel: 5,
    cost: (l) => Math.round(300 * 2.3 ** l),
    effect: (l) => (l === 0 ? 'Chưa xây' : `Cây lớn nhanh hơn ${l * 8}%`),
  },
  {
    id: 'barn', name: 'Kho thóc', emoji: '🛖', maxLevel: 5,
    cost: (l) => Math.round(350 * 2.2 ** l),
    effect: (l) => `Tích lũy offline tối đa ${2 + l * 2} giờ`,
  },
  {
    id: 'kitchen', name: 'Bếp', emoji: '🍳', maxLevel: 3,
    cost: (l) => [250, 1500, 6000][l],
    effect: (l) => (l === 0 ? 'Chưa xây — cần để nấu đồ ăn cho mạo hiểm giả' : `Mở công thức cấp ${l}`),
  },
  {
    id: 'tavern', name: 'Quán rượu', emoji: '🍺', maxLevel: 5,
    cost: (l) => Math.round(600 * 2.4 ** l),
    effect: (l) => `Chứa tối đa ${4 + l * 2} mạo hiểm giả`,
  },
];

/** Bội thu: tỉ lệ một ô cho sản lượng ×BUMPER_MULT (mỗi cấp Giếng +1%) */
export const BUMPER_CHANCE = 0.08;
export const BUMPER_MULT = 3;

export const START_PLOTS = 6;
export const MAX_PLOTS = 24;
export const plotCost = (owned: number) => Math.round(150 * 1.32 ** (owned - START_PLOTS));

export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, BuildingDef>;
