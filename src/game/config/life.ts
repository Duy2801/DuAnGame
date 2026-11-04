// Hoạt động đời sống: nhà, nội thất & dụng cụ gia đình, chăn nuôi, câu cá, thả diều
import type { BuffId } from './buffs';
import { ALL_FISH_SPECIES } from './fishingZones';

export interface HouseDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  levelReq: number;
  perks: string[];
  xp: number;
  goldPerMin: number;
  hp?: number;
  privatePond?: boolean;
  /** căn hộ trong tòa chung cư (id trong TOWERS) — không có = nhà riêng ở Phố Nhà Vườn */
  tower?: string;
  floor?: number;
  /** chiếm trọn cả tầng (penthouse) */
  wholeFloor?: boolean;
  /** diện tích, hướng nhìn — chỉ để hiển thị */
  area: string;
  view: string;
}

export interface TowerDef {
  id: string;
  name: string;
  emoji: string;
  slogan: string;
  /** số tầng (tầng 1 là sảnh) */
  floors: number;
  /** số căn mỗi tầng — căn không bán thì đã có chủ (dân làng) */
  perFloor: number;
}

export const TOWERS: TowerDef[] = [
  { id: 'saomai', name: 'Chung cư Sao Mai', emoji: '🏢', slogan: 'Sống xanh giữa lòng thị trấn — giá mềm, mua ngay không cần cấp độ', floors: 6, perFloor: 3 },
  { id: 'sky', name: 'Sky Tower Hoàng Kim', emoji: '🏙️', slogan: 'Đỉnh cao thượng lưu — view toàn thị trấn, sân bay trực thăng trên mái', floors: 9, perFloor: 2 },
];
export const TOWER_BY_ID = Object.fromEntries(TOWERS.map((t) => [t.id, t]));

/** Nhà gỗ nông trại mặc định lúc khởi đầu (trước khi mua BĐS) */
export const STARTER_HOME: HouseDef = {
  id: 'starter_home',
  name: 'Nhà Gỗ Nông Trại Khởi Nguyên',
  emoji: '🛖',
  price: 0,
  levelReq: 1,
  xp: 0,
  goldPerMin: 0,
  area: '24 m² · Mộc mạc',
  view: 'Sân ruộng nông trại',
  perks: ['Giường ngủ cơ bản hồi HP', 'Có thể sắm sửa dụng cụ & nội thất trong nhà'],
};

export const HOUSES: HouseDef[] = [
  // ---- Chung cư Sao Mai (giá mềm, ấm cúng)
  { id: 'sm_studio', tower: 'saomai', floor: 2, name: 'Căn Studio Sao Mai', emoji: '🛋️', price: 1500, levelReq: 1, xp: 0.02, goldPerMin: 3, area: '32 m²', view: 'Hướng phố nhộn nhịp', perks: ['+2% XP khi đánh quái', '+3 vàng/phút (cả khi offline)', 'Phòng khách ấm cúng · +10% hiệu suất nội thất'] },
  { id: 'sm_1br', tower: 'saomai', floor: 3, name: 'Căn 1 Phòng Ngủ Hiện Đại', emoji: '🛏️', price: 4000, levelReq: 1, xp: 0.03, goldPerMin: 7, hp: 20, area: '48 m²', view: 'Hướng quảng trường', perks: ['+3% XP', '+7 vàng/phút', '+20 HP tối đa · +15% hiệu suất nội thất'] },
  { id: 'sm_2br', tower: 'saomai', floor: 4, name: 'Căn 2PN View Công Viên', emoji: '🌳', price: 9000, levelReq: 1, xp: 0.04, goldPerMin: 14, hp: 45, area: '70 m²', view: 'View Công Viên Hoa Hồng', perks: ['+4% XP', '+14 vàng/phút', '+45 HP tối đa · +25% hiệu suất nội thất'] },
  { id: 'sm_corner', tower: 'saomai', floor: 6, name: 'Căn Góc Tầng Thượng Panorama', emoji: '🌇', price: 18000, levelReq: 1, xp: 0.05, goldPerMin: 24, hp: 70, area: '92 m²', view: 'Ban công 2 mặt ngắm hoàng hôn', perks: ['+5% XP', '+24 vàng/phút', '+70 HP tối đa · +35% hiệu suất nội thất'] },
  // ---- Sky Tower Hoàng Kim (cao cấp, sang trọng)
  { id: 'sky_lux', tower: 'sky', floor: 4, name: 'Căn Hộ Hạng Sang Sky', emoji: '💎', price: 40000, levelReq: 1, xp: 0.07, goldPerMin: 45, hp: 110, area: '120 m²', view: 'Kính kịch trần, view hồ lấp lánh', perks: ['+7% XP', '+45 vàng/phút', '+110 HP tối đa · Sàn cẩm thạch (+50% hiệu suất nội thất)'] },
  { id: 'sky_duplex', tower: 'sky', floor: 6, name: 'Duplex Thông Tầng Hồ Bơi', emoji: '🪩', price: 90000, levelReq: 1, xp: 0.1, goldPerMin: 80, hp: 200, area: '210 m² · 2 tầng', view: 'Hồ bơi vô cực trong nhà', perks: ['+10% XP', '+80 vàng/phút', '+200 HP tối đa · Hồ bơi riêng (+75% hiệu suất nội thất)'] },
  { id: 'sky_penthouse', tower: 'sky', floor: 9, wholeFloor: true, name: 'Penthouse Đế Vương Hoàng Kim', emoji: '👑', price: 300000, levelReq: 1, xp: 0.2, goldPerMin: 200, hp: 500, area: '380 m² · trọn tầng mái', view: 'View 360° · sân trực thăng VIP', perks: ['+20% XP', '+200 vàng/phút', '+500 HP tối đa', 'Nội thất dát vàng 24K · Nhân ĐÔI (+100%) thu nhập & HP nội thất!'] },
  // ---- Phố Nhà Vườn (nhà riêng & biệt phủ)
  { id: 'cabin', name: 'Nhà Gỗ Sân Vườn', emoji: '🏡', price: 3000, levelReq: 1, xp: 0.03, goldPerMin: 5, hp: 15, area: '60 m² · sân vườn', view: 'Phố Nhà Vườn xanh mát', perks: ['+3% XP khi đánh quái', '+5 vàng/phút', '+15 HP tối đa · +12% hiệu suất nội thất'] },
  { id: 'cottage', name: 'Biệt Thự Hoa Hồng', emoji: '🌹', price: 7000, levelReq: 1, xp: 0.05, goldPerMin: 10, hp: 35, area: '75 m² · vườn hồng cổ', view: 'Vườn Hồng Thơm Ngát', perks: ['+5% XP', '+10 vàng/phút', '+35 HP tối đa · +20% hiệu suất nội thất'] },
  { id: 'townhouse', name: 'Nhà Phố Kiến Trúc Pháp', emoji: '🏘️', price: 15000, levelReq: 1, xp: 0.06, goldPerMin: 20, hp: 65, area: '110 m² · 2 tầng mái vòm', view: 'Đại lộ Phố Nhà Vườn', perks: ['+6% XP', '+20 vàng/phút', '+65 HP tối đa · +30% hiệu suất nội thất'] },
  { id: 'lakehouse', name: 'Biệt Thự Nghỉ Dưỡng Ven Hồ', emoji: '🛶', price: 25000, levelReq: 1, xp: 0.06, goldPerMin: 30, hp: 85, privatePond: true, area: '130 m² · bến du thuyền', view: 'Hồ Cá Koi Riêng Biệt', perks: ['Hồ cá riêng — tỉ lệ cá hiếm gấp ×3', '+30 vàng/phút', '+85 HP · +40% hiệu suất nội thất'] },
  { id: 'manor', name: 'Dinh Thự Quý Tộc Rêu Xanh', emoji: '🏯', price: 60000, levelReq: 1, xp: 0.1, goldPerMin: 60, hp: 160, area: '260 m² · tháp đôi cổ kính', view: 'Rừng Thông & Phố Nhà Vườn', perks: ['+10% XP', '+60 vàng/phút', '+160 HP tối đa · Đại sảnh quý tộc (+60% hiệu suất nội thất)'] },
  { id: 'villa', name: 'Cung Điện Biệt Phủ Hoàng Kim', emoji: '🏰', price: 150000, levelReq: 1, xp: 0.15, goldPerMin: 120, hp: 320, area: '450 m² · cột đá La Mã', view: 'Cạnh Công Viên Hoa Hồng', perks: ['+15% XP', '+120 vàng/phút', '+320 HP tối đa', 'Kiến trúc Cung Điện Hoàng Gia (+85% hiệu suất nội thất)'] },
];

export const HOUSE_BY_ID: Record<string, HouseDef> = {
  starter_home: STARTER_HOME,
  ...Object.fromEntries(HOUSES.map((h) => [h.id, h])),
};

/** Thông tin độ sang trọng & giao diện bên trong nhà theo giá tiền (nhà càng đắt càng đẹp & nhân thưởng nội thất càng cao) */
export function houseLuxuryInfo(h: HouseDef) {
  if (h.price >= 150000) {
    return {
      stars: 6,
      rankName: '👑 Đế Vương Hoàng Kim',
      mult: h.price >= 300000 ? 1.0 : 0.85,
      roomCls: 'room-imperial',
      wallDesc: 'Tường Cẩm Thạch Dát Vàng 24K · Trần Sao Pha Lê',
      floorDesc: 'Thảm Nhung Đế Vương & Sàn Ngọc Bích',
      ambiEmojis: ['👑', '✨', '🏛️', '⛲', '🚁'],
    };
  }
  if (h.price >= 40000) {
    return {
      stars: 5,
      rankName: '💎 Thượng Lưu Xa Hoa',
      mult: h.price >= 90000 ? 0.75 : h.price >= 60000 ? 0.6 : 0.5,
      roomCls: 'room-luxury',
      wallDesc: 'Kính Panorama Kịch Trần · Đèn Hắt Hoàng Kim',
      floorDesc: 'Sàn Đá Cẩm Thạch Ý Vân Mây',
      ambiEmojis: ['💎', '🪩', '🏊', '🍾', '🌃'],
    };
  }
  if (h.price >= 15000) {
    return {
      stars: 4,
      rankName: '🌟 Biệt Thự Cao Cấp',
      mult: h.price >= 25000 ? 0.4 : h.price >= 18000 ? 0.35 : 0.3,
      roomCls: 'room-grand',
      wallDesc: 'Kiến Trúc Mái Vòm · Cửa Sổ Đón Nắng Toàn Cảnh',
      floorDesc: 'Sàn Gỗ Hương Đỏ Đánh Bóng',
      ambiEmojis: ['🌇', '🛶', '🍷', '🪴', '🖼️'],
    };
  }
  if (h.price >= 4000) {
    return {
      stars: 3,
      rankName: '🏡 Tiện Nghi Hiện Đại',
      mult: h.price >= 9000 ? 0.25 : h.price >= 7000 ? 0.2 : 0.15,
      roomCls: 'room-modern',
      wallDesc: 'Tường Kem Tinh Tế · Ban Công Hoa Tươi',
      floorDesc: 'Sàn Gỗ Sồi Sáng Màu',
      ambiEmojis: ['🌹', '🌳', '🪟', '🪴'],
    };
  }
  if (h.price > 0) {
    return {
      stars: 2,
      rankName: '🛋️ Tổ Ấm Xinh Xắn',
      mult: h.price >= 3000 ? 0.12 : 0.1,
      roomCls: 'room-cozy',
      wallDesc: 'Tường Gỗ Thông Ấm Áp · Đèn Vàng Dịu Nhẹ',
      floorDesc: 'Sàn Gỗ Mộc & Thảm Dệt Tay',
      ambiEmojis: ['🏡', '🕯️', '🪴'],
    };
  }
  return {
    stars: 1,
    rankName: '🛖 Nhà Gỗ Khởi Nguyên',
    mult: 0,
    roomCls: 'room-starter',
    wallDesc: 'Vách Gỗ Nông Trại Mộc Mạc',
    floorDesc: 'Sàn Ván Gỗ Đơn Sơ',
    ambiEmojis: ['🌾', '🕯️'],
  };
}

// ---------------- Nội Thất & Dụng Cụ Gia Đình (Mua sắm & Tương tác trong nhà)

export type FurnitureCategory = 'bedroom' | 'kitchen' | 'living' | 'luxury';

export interface FurnitureDef {
  id: string;
  name: string;
  emoji: string;
  category: FurnitureCategory;
  price: number;
  desc: string;
  goldPerMin?: number;
  hp?: number;
  atk?: number;
  def?: number;
  xp?: number;
  kitchenTier?: number;
  action?: {
    label: string;
    healPct?: number;
    energy?: number;
    buff?: { id: BuffId; value: number; min: number };
    toast: string;
  };
}

export const HOME_FURNITURE: FurnitureDef[] = [
  // ---- Phòng Ngủ & Nghỉ Dưỡng ('bedroom')
  {
    id: 'furn_bed_spring',
    name: 'Giường Nệm Lò Xo Êm Ái',
    emoji: '🛏️',
    category: 'bedroom',
    price: 500,
    hp: 30,
    goldPerMin: 2,
    desc: 'Nệm bông ép dày dặn giúp ngủ sâu giấc, hồi phục cả máu lẫn thể lực.',
    action: { label: '😴 Nằm nghỉ (+100% HP & +15 ⚡)', healPct: 1, energy: 15, toast: '🛏️ Đánh một giấc trên nệm lò xo êm ái — hồi đầy HP & +15 ⚡ thể lực!' },
  },
  {
    id: 'furn_purifier',
    name: 'Máy Lọc Khí & Xông Tinh Dầu',
    emoji: '🌿',
    category: 'bedroom',
    price: 1200,
    hp: 45,
    xp: 0.02,
    goldPerMin: 4,
    desc: 'Tỏa hương tinh dầu sả chanh thư thái khắp phòng, tăng tốc chạy và tinh thần.',
    action: { label: '🌬️ Thư giãn hương tinh dầu (+15% Tốc chạy)', energy: 10, buff: { id: 'speed', value: 0.15, min: 8 }, toast: '🌿 Hương tinh dầu thanh mát giúp bước chân nhẹ nhàng (+15% tốc chạy)!' },
  },
  {
    id: 'furn_massage',
    name: 'Ghế Massage Hồng Ngoại',
    emoji: '💺',
    category: 'bedroom',
    price: 3200,
    hp: 85,
    def: 3,
    goldPerMin: 8,
    desc: 'Con lăn hồng ngoại xoa bóp toàn thân, xóa tan đau mỏi sau giờ đào mỏ & săn quái.',
    action: { label: '💆 Ngồi Massage (+30 ⚡ & +20% Thủ)', healPct: 0.5, energy: 30, buff: { id: 'def', value: 0.2, min: 8 }, toast: '💺 Ghế massage bấm huyệt sảng khoái — +30 ⚡ thể lực & +20% Phòng thủ!' },
  },
  {
    id: 'furn_royal_bed',
    name: 'Giường Hoàng Gia Bọc Nhung Vàng',
    emoji: '👑',
    category: 'bedroom',
    price: 16000,
    hp: 220,
    xp: 0.05,
    goldPerMin: 28,
    desc: 'Tuyệt tác giường ngủ chạm khắc hoàng gia, mang lại giấc ngủ bậc đế vương.',
    action: { label: '👑 Giấc Ngủ Đế Vương (Đầy HP, +40 ⚡ & +25% XP)', healPct: 1, energy: 40, buff: { id: 'xp', value: 0.25, min: 10 }, toast: '👑 Thức dậy trên Giường Hoàng Gia: Hồi đầy HP, +40 ⚡ thể lực & +25% XP!' },
  },

  // ---- Phòng Bếp & Gia Dụng Hiện Đại ('kitchen')
  {
    id: 'furn_stove',
    name: 'Bếp Điện Từ Đôi Siêu Tốc',
    emoji: '🍲',
    category: 'kitchen',
    price: 900,
    goldPerMin: 3,
    kitchenTier: 2,
    desc: 'Mở khóa ngay tính năng nấu nướng Bếp Cấp 2 tại nhà mà không cần ra xưởng!',
  },
  {
    id: 'furn_coffee',
    name: 'Máy Pha Cà Phê Espresso Ý',
    emoji: '☕',
    category: 'kitchen',
    price: 2000,
    hp: 40,
    goldPerMin: 6,
    desc: 'Chiết xuất ly Espresso đậm đà mỗi sáng, nạp năng lượng tức thì để đi mỏ.',
    action: { label: '☕ Pha Espresso (+25 ⚡ & +20% Tốc chạy)', energy: 25, buff: { id: 'speed', value: 0.2, min: 8 }, toast: '☕ Thưởng thức ly Espresso thơm lừng — tỉnh táo +25 ⚡ thể lực & +20% Tốc chạy!' },
  },
  {
    id: 'furn_fridge',
    name: 'Tủ Lạnh Side-by-Side 4 Cánh',
    emoji: '🧊',
    category: 'kitchen',
    price: 4200,
    hp: 95,
    goldPerMin: 10,
    desc: 'Tủ lạnh thông minh lấy đá tự động, luôn có sẵn nước trái cây ướp lạnh giải nhiệt.',
    action: { label: '🥤 Uống nước mát lạnh (+40% HP & +15 ⚡)', healPct: 0.4, energy: 15, toast: '🧊 Một ly nước trái cây ướp lạnh mát rượi từ tủ lạnh Side-by-Side!' },
  },
  {
    id: 'furn_chef_island',
    name: 'Quầy Bar & Đảo Bếp 5 Sao',
    emoji: '👨‍🍳',
    category: 'kitchen',
    price: 12500,
    hp: 140,
    goldPerMin: 22,
    kitchenTier: 3,
    desc: 'Không gian bếp chuẩn nhà hàng Michelin — Mở khóa toàn bộ công thức Bếp Cấp 3!',
  },

  // ---- Phòng Khách & Giải Trí ('living')
  {
    id: 'furn_tv',
    name: 'Tivi Màn Hình Phẳng & Dàn Karaoke',
    emoji: '📺',
    category: 'living',
    price: 1600,
    xp: 0.03,
    goldPerMin: 5,
    desc: 'Dàn âm thanh vòm sống động cho những buổi tối giải trí tưng bừng.',
    action: { label: '🎤 Hát Karaoke (+20% Vàng đánh quái)', buff: { id: 'gold', value: 0.2, min: 8 }, toast: '🎤 Lên nhạc hát Karaoke cực sung — nhận hiệu ứng Phát Tài +20% Vàng!' },
  },
  {
    id: 'furn_aquarium',
    name: 'Bể Cá Thủy Sinh Phát Tài',
    emoji: '🐠',
    category: 'living',
    price: 4500,
    xp: 0.03,
    goldPerMin: 11,
    desc: 'Bể thủy sinh nuôi cá huyết long phong thủy, mang lại vận may câu cá.',
    action: { label: '🐠 Ngắm cá phong thủy (+30% May mắn câu cá)', buff: { id: 'luck', value: 0.3, min: 10 }, toast: '🐠 Ngắm đàn cá bơi lội thư thái — nhận +30% May mắn câu cá hiếm & cá to!' },
  },
  {
    id: 'furn_gym',
    name: 'Giàn Tập Gym Đa Năng Tại Gia',
    emoji: '🏋️',
    category: 'living',
    price: 6000,
    atk: 8,
    def: 4,
    hp: 90,
    goldPerMin: 9,
    desc: 'Bộ tạ và máy chạy bộ chuyên nghiệp tăng vĩnh viễn +8 Công, +4 Thủ, +90 HP.',
    action: { label: '💪 Tập Thể Hình (+25% Tấn công)', buff: { id: 'atk', value: 0.25, min: 10 }, toast: '🏋️ Đẩy tạ rèn luyện cơ bắp cuồn cuộn — kích hoạt +25% Tấn công trong 10 phút!' },
  },
  {
    id: 'furn_bookshelf',
    name: 'Tủ Sách Cổ Ngữ Tri Thức',
    emoji: '📚',
    category: 'living',
    price: 8500,
    atk: 5,
    xp: 0.06,
    goldPerMin: 14,
    desc: 'Lưu giữ bí tịch võ học và bách khoa toàn thư (+6% XP, +5 ATK vĩnh viễn).',
    action: { label: '📖 Nghiên cứu cổ tịch (+25% Kinh nghiệm)', buff: { id: 'xp', value: 0.25, min: 10 }, toast: '📚 Đọc sách mở mang trí tuệ — nhận +25% Kinh nghiệm chiến đấu trong 10 phút!' },
  },

  // ---- Tiện Nghi Đại Gia & Phong Thủy ('luxury')
  {
    id: 'furn_safe',
    name: 'Két Sắt Hoàng Kim Thông Minh',
    emoji: '🏦',
    category: 'luxury',
    price: 18000,
    def: 6,
    goldPerMin: 32,
    desc: 'Két sắt bọc thép mạ vàng tự động đầu tư sinh lời +32 vàng/phút.',
  },
  {
    id: 'furn_chandelier',
    name: 'Đèn Chùm Pha Lê Tiệp Khắc',
    emoji: '✨',
    category: 'luxury',
    price: 32000,
    hp: 180,
    xp: 0.08,
    goldPerMin: 50,
    desc: 'Hàng ngàn viên pha lê tán sắc cầu vồng rực rỡ giữa đại sảnh dinh thự.',
  },
  {
    id: 'furn_jacuzzi',
    name: 'Bồn Tắm Sục Jacuzzi Nước Khoáng',
    emoji: '🛁',
    category: 'luxury',
    price: 55000,
    hp: 300,
    def: 10,
    goldPerMin: 80,
    desc: 'Bồn sục massage thủy lực dẫn nguồn khoáng nóng tự nhiên ngay trong biệt thự.',
    action: { label: '🛁 Ngâm Khoáng Nóng (Đầy 100% HP, +60 ⚡ & +30% Vàng)', healPct: 1, energy: 60, buff: { id: 'gold', value: 0.3, min: 12 }, toast: '🛁 Ngâm mình trong Bồn Jacuzzi nước khoáng nóng: Hồi đầy HP, +60 ⚡ thể lực & +30% Vàng!' },
  },
  {
    id: 'furn_dragon_statue',
    name: 'Tượng Rồng Vàng Phong Thủy 24K',
    emoji: '🐉',
    category: 'luxury',
    price: 110000,
    atk: 20,
    def: 15,
    hp: 450,
    xp: 0.12,
    goldPerMin: 150,
    desc: 'Bảo vật trấn trạch đúc từ vàng ròng nguyên khối (+20 Công, +15 Thủ, +450 HP, +150 vàng/phút).',
    action: { label: '🐉 Kích Hoạt Long Mạch (+35% Công & Đầy HP)', healPct: 1, energy: 50, buff: { id: 'atk', value: 0.35, min: 15 }, toast: '🐉 Hào quang Tượng Rồng Vàng bừng sáng: Hồi đầy HP, +50 ⚡ & +35% Tấn công trong 15 phút!' },
  },
];

export const FURNITURE_BY_ID: Record<string, FurnitureDef> = Object.fromEntries(HOME_FURNITURE.map((f) => [f.id, f]));

/** vị trí căn đang bán trên tầng của nó (ô cửa sổ thứ mấy tính từ trái); penthouse chiếm cả tầng */
export const unitSlots = (h: HouseDef): number[] => {
  const t = TOWER_BY_ID[h.tower ?? ''];
  if (!t || !h.floor) return [];
  if (h.wholeFloor) return Array.from({ length: t.perFloor }, (_, i) => i);
  return [(h.floor - 1) % t.perFloor];
};
export const towerUnits = (towerId: string) => HOUSES.filter((h) => h.tower === towerId);

export interface AnimalDef {
  name: string;
  emoji: string;
  price: number;
  product: string;
  qty: number;
  cycleSec: number;
  feed: Record<string, number>;
}

export const ANIMALS: Record<string, AnimalDef> = {
  chicken: { name: 'Gà mái', emoji: '🐔', price: 300, product: 'egg', qty: 2, cycleSec: 120, feed: { wheat: 1 } },
  sheep: { name: 'Cừu lông trắng', emoji: '🐑', price: 900, product: 'wool', qty: 1, cycleSec: 240, feed: { carrot: 2 } },
  cow: { name: 'Bò sữa Hà Lan', emoji: '🐄', price: 1500, product: 'milk', qty: 1, cycleSec: 300, feed: { wheat: 3 } },
  pig: { name: 'Heo hồng', emoji: '🐖', price: 2200, product: 'pork', qty: 2, cycleSec: 360, feed: { corn: 1, carrot: 1 } },
};

export const MAX_ANIMALS = 12;

export interface FishDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  weight: number;
  /** 0..1 — càng cao vùng xanh càng hẹp */
  difficulty: number;
  night?: boolean;
  rain?: boolean;
  rare?: boolean;
  /** kích thước nhỏ nhất / lớn nhất (cm) */
  cm: [number, number];
}

export const FISH: (FishDef & { zoneId?: number; isSuperRare?: boolean; gemPrice?: number; season?: string; titleReward?: string })[] = ALL_FISH_SPECIES.map((s) => ({
  id: s.id,
  name: s.name,
  emoji: s.emoji,
  price: s.basePrice,
  weight: s.isSuperRare ? 0.000001 : s.rarity === 'common' ? 30 : s.rarity === 'rare' ? 12 : s.rarity === 'epic' ? 3 : 0.5,
  difficulty: s.difficulty,
  cm: s.cm,
  rare: s.rarity !== 'common',
  night: s.nightOnly,
  rain: s.rainOnly,
  zoneId: s.zoneId,
  isSuperRare: s.isSuperRare,
  gemPrice: s.gemPrice,
  season: s.season,
  titleReward: s.titleReward,
}));

/** cỡ cá theo phần trăm kích thước trong khoảng [min, max] */
export const SIZE_TIERS = [
  { name: 'Bé', emoji: '🔹', min: 0, mult: 0.7 },
  { name: 'Vừa', emoji: '🔸', min: 0.35, mult: 1 },
  { name: 'To', emoji: '⭐', min: 0.7, mult: 1.5 },
  { name: 'Khổng lồ', emoji: '👑', min: 0.92, mult: 2.5 },
];
export const sizeTierOf = (pct: number) => {
  let t = 0;
  SIZE_TIERS.forEach((s, i) => {
    if (pct >= s.min) t = i;
  });
  return t;
};
/** cân nặng (kg) ước lượng theo chiều dài */
export const fishKg = (cm: number) => Math.max(0.05, Math.round(((cm / 100) ** 3) * 12 * 100) / 100);

/** thời gian chờ cá cắn: ngẫu nhiên, lâu nhất 60 giây */
export const BITE_MIN_SEC = 4;
export const BITE_MAX_SEC = 60;
/** tỉ lệ cá rỉa mồi rồi chạy / đứt dây trước khi nhân hệ số cần */
export const EMPTY_BITE = 0.12;
export const LINE_SNAP = 0.1;

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));

