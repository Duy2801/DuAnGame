import type { ItemKind } from '../types';

// Bảng Đơn Hàng: dân làng đặt mua combo nông sản / cá / đồ ăn / chiến lợi phẩm, trả giá cao hơn bán chợ.
// Mọi số cân bằng của đơn hàng nằm ở đây.

export interface OrderNpc {
  id: string;
  name: string;
  emoji: string;
  /** loại hàng hay đặt — lấy trước từ các loại này, thiếu thì lấy bất kỳ */
  likes: ItemKind[];
  lines: string[];
}

export const ORDER_NPCS: OrderNpc[] = [
  { id: 'ba_tu', name: 'Bà Tư', emoji: '👵', likes: ['crop', 'food'], lines: ['Bà muốn nấu nồi canh cho cả xóm, cháu giúp bà nhé!', 'Ngày xưa ruộng làng mình xanh mướt lắm...'] },
  { id: 'chu_nam', name: 'Chú Năm Câu', emoji: '🎣', likes: ['fish', 'food'], lines: ['Chú cần cá làm mồi nhậu... à không, làm giỗ!', 'Con cá to nhất đời chú dài cả sải tay đó nha!'] },
  { id: 'be_na', name: 'Bé Na', emoji: '👧', likes: ['crop', 'animal'], lines: ['Na muốn làm bánh tặng mẹ, anh chị giúp Na với!', 'Mai Na đi thả diều, cần đồ ăn vặt nè!'] },
  { id: 'bep_phu', name: 'Đầu bếp Phú', emoji: '👨‍🍳', likes: ['animal', 'crop', 'fish'], lines: ['Nhà hàng tôi sắp có tiệc lớn, cần nguyên liệu tươi gấp!', 'Nguyên liệu ngon thì món mới ngon!'] },
  { id: 'tho_ren', name: 'Thợ rèn Hùng', emoji: '🧔', likes: ['material', 'ore'], lines: ['Lò rèn hết nguyên liệu rồi! Mang về đây, ta trả hậu.', 'Hừ, đồ quái rớt đó tốt đấy, đưa ta!'] },
  { id: 'thi_truong', name: 'Ông Thị Trưởng', emoji: '🎩', likes: ['food', 'material', 'crop'], lines: ['Làng sắp mở hội, ta cần chuẩn bị nhiều thứ lắm!', 'Giúp làng là giúp chính cháu đó!'] },
];
export const ORDER_NPC_BY_ID = Object.fromEntries(ORDER_NPCS.map((n) => [n.id, n]));

export const ORDER_SLOTS = 4;
/** giao xong thì sau bấy nhiêu ms có đơn mới */
export const ORDER_REFILL_MS = 2 * 60_000;
/** bỏ qua đơn thì chờ lâu hơn */
export const ORDER_SKIP_MS = 10 * 60_000;
/** giá trị hàng (theo giá gốc) của 1 đơn: base + perLevel × cấp nhân vật */
export const ORDER_VALUE = { base: 80, perLevel: 35 };
/** thưởng vàng = giá trị hàng × hệ số ngẫu nhiên trong khoảng này (bán chợ chỉ ×0.7–1.5) */
export const ORDER_GOLD_MULT: [number, number] = [1.6, 2.1];
/** XP = tỉ lệ này × XP cần để lên cấp hiện tại */
export const ORDER_XP_SHARE = 0.12;
export const ORDER_GEM_CHANCE = 0.15;
export const ORDER_GEMS: [number, number] = [2, 6];
/** số lượng tối đa mỗi món theo loại (cá câu ngẫu nhiên nên đặt ít) */
export const ORDER_MAX_QTY: Partial<Record<ItemKind, number>> = { fish: 4, material: 8, food: 5, animal: 10, crop: 30, ore: 8 };
