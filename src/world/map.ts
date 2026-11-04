import { ZONE_DEFS } from '../game/config/zones';
import type { BuildingId } from '../game/types';
import { mulberry32 } from '../game/utils';
import type { PanelId } from './bus';
import { T, TILE } from './textures';
import { paintZone } from './zoneGen';
import { ZONE_THEMES } from './zoneThemes';

// ============================================================ Thế giới nhiều bản đồ
// 4 khu thị trấn (Thị Trấn, Nông Trại, Khu Mạo Hiểm Giả, Hồ Câu & Đồi Gió) + 20 vùng quái, mỗi nơi là 1 bản đồ riêng.
// Đi tới cổng ở mép bản đồ để sang bản đồ kế bên, hoặc mở 🗺️ chọn nơi muốn tới. Mỗi lúc chỉ dựng 1 bản đồ,
// nên khu nào cũng mở rộng thoải mái được (đổi w/h + nội dung của khu đó, không ảnh hưởng khu khác).
//
// Toạ độ: các khu thị trấn được tách từ bản đồ chung cũ nên nội dung vẫn ghi theo hệ toạ độ cũ, mỗi khu có gốc (ox, oy)
// trừ đi khi dựng. Khu Mạo Hiểm Giả (vẽ lại) và vùng quái có hệ toạ độ riêng bắt đầu từ 0 (ox = oy = 0).
// Mọi thứ loadMap() trả ra đã là toạ độ trong bản đồ.

export type TownMapId = 'town' | 'farm' | 'adventure' | 'lake' | 'windhill' | 'deepsea' | 'glacier';
export type MapId = TownMapId | `zone${number}`;

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export const inRect = (r: Rect, tx: number, ty: number) => tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1;

/** cổng sang bản đồ khác: r = ô kích hoạt ở mép bản đồ, at = điểm tới (toạ độ của bản đồ đích) */
interface ExitDef {
  r: Rect;
  to: MapId;
  at: [number, number];
}
export interface Exit extends Rect {
  to: MapId;
  at: [number, number];
  label: string;
}

export interface MapInfo {
  id: MapId;
  name: string;
  sub: string;
  icon: string;
  /** 0 = thị trấn (an toàn), 1..20 = vùng quái */
  zone: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  /** điểm xuất hiện mặc định (toạ độ riêng của khu) */
  spawn: [number, number];
  exits: ExitDef[];
}

// ------------------------------------------------------------ vùng quái: kích thước 1 bản đồ
export const ZW = 52;
export const ZH = 36;
const ZMY = Math.floor(ZH / 2);

const TOWN_MAPS: MapInfo[] = [
  {
    id: 'town', name: 'Thị Trấn Khởi Nguyên', sub: 'Quảng trường · Khu nhà ở · Khu mua sắm', icon: '🏘️', zone: 0,
    ox: 0, oy: 26, w: 64, h: 32, spawn: [33, 37],
    exits: [
      { r: { x0: 32, y0: 26, x1: 33, y1: 26 }, to: 'adventure', at: [28, 39.4] },
      { r: { x0: 0, y0: 34, x1: 0, y1: 35 }, to: 'farm', at: [40, 23.6] },
      { r: { x0: 32, y0: 57, x1: 33, y1: 57 }, to: 'lake', at: [21, 3] },
    ],
  },
  {
    id: 'farm', name: 'Khu Nông Trại Trù Phú', sub: 'Ruộng & Vườn Cây · Phân Bón · Trang Trại & Thú Y · Chợ Nông Sản · Gia Trang', icon: '🌾', zone: 0,
    ox: 0, oy: 0, w: 44, h: 38, spawn: [38.5, 23.6],
    exits: [{ r: { x0: 43, y0: 22, x1: 43, y1: 25 }, to: 'town', at: [2.5, 35] }],
  },
  {
    id: 'adventure', name: 'Khu Mạo Hiểm Giả', sub: 'Hội · Săn quái · Vũ khí · Giáp · Thuốc · Lò rèn · Hang mỏ · Hồ Gương', icon: '⚔️', zone: 0,
    ox: 0, oy: 0, w: 56, h: 42, spawn: [28, 38.6],
    exits: [
      { r: { x0: 27, y0: 41, x1: 28, y1: 41 }, to: 'town', at: [33, 28.6] },
      { r: { x0: 55, y0: 20, x1: 55, y1: 22 }, to: 'zone1', at: [2.5, ZMY + 0.4] },
    ],
  },
  {
    id: 'lake', name: 'Hồ Sen & Sông Quê', sub: 'Đầm Sen Trăng Cổ Tích · Sông Thơ Mộng · Tiệm câu Ông Năm', icon: '🎣', zone: 0,
    ox: 0, oy: 0, w: 52, h: 42, spawn: [24, 6],
    exits: [
      { r: { x0: 22, y0: 0, x1: 26, y1: 0 }, to: 'town', at: [33, 55.4] },
      { r: { x0: 0, y0: 19, x1: 0, y1: 23 }, to: 'windhill', at: [46, 18] },
      { r: { x0: 6, y0: 40, x1: 10, y1: 41 }, to: 'deepsea', at: [9, 4] },
      { r: { x0: 42, y0: 40, x1: 46, y1: 41 }, to: 'glacier', at: [19, 4] },
    ],
  },
  {
    id: 'deepsea', name: 'Vịnh Biển San Hô', sub: 'Biển Sâu San Hô · Bãi Cát Vàng · Thủy Quái Leviathan Thần Thoại', icon: '🌊', zone: 0,
    ox: 0, oy: 0, w: 58, h: 36, spawn: [9, 4],
    exits: [
      { r: { x0: 7, y0: 0, x1: 11, y1: 0 }, to: 'lake', at: [8, 39] },
    ],
  },
  {
    id: 'glacier', name: 'Vực Băng Vĩnh Cửu', sub: 'Đầm Băng Bắc Cực · Băng Tuyết Ngàn Năm · Băng Long Thần Ngư Thần Thoại', icon: '❄️', zone: 0,
    ox: 0, oy: 0, w: 38, h: 54, spawn: [19, 4],
    exits: [
      { r: { x0: 17, y0: 0, x1: 21, y1: 0 }, to: 'lake', at: [44, 39] },
    ],
  },
  {
    id: 'windhill', name: 'Đồi Gió Thả Diều', sub: 'Đỉnh đồi thảo nguyên lộng gió · Thả diều · Tiệm Diều · Cối xay gió', icon: '🪁', zone: 0,
    ox: 0, oy: 0, w: 48, h: 36, spawn: [24, 18],
    exits: [
      { r: { x0: 47, y0: 16, x1: 47, y1: 20 }, to: 'lake', at: [2.5, 20] },
      { r: { x0: 23, y0: 0, x1: 25, y1: 0 }, to: 'town', at: [48, 55.4] },
    ],
  },
];

const ZONE_MAPS: MapInfo[] = ZONE_DEFS.map((z) => {
  const exits: ExitDef[] = [
    { r: { x0: 0, y0: ZMY - 1, x1: 0, y1: ZMY + 1 }, to: z.id === 1 ? 'adventure' : `zone${z.id - 1}`, at: z.id === 1 ? [53, 21.4] : [ZW - 2.5, ZMY + 0.4] },
  ];
  if (z.id < ZONE_DEFS.length) exits.push({ r: { x0: ZW - 1, y0: ZMY - 1, x1: ZW - 1, y1: ZMY + 1 }, to: `zone${z.id + 1}`, at: [2.5, ZMY + 0.4] });
  return {
    id: `zone${z.id}` as MapId, name: `${z.id}. ${z.name}`, sub: z.desc, icon: z.boss ? '👑' : '⚔️', zone: z.id,
    ox: 0, oy: 0, w: ZW, h: ZH, spawn: [3.5, ZMY + 0.4], exits,
  };
});

export const MAPS: Record<string, MapInfo> = Object.fromEntries([...TOWN_MAPS, ...ZONE_MAPS].map((m) => [m.id, m]));
export const TOWN_MAP_LIST = TOWN_MAPS;
export const isMapId = (id: unknown): id is MapId => typeof id === 'string' && !!MAPS[id];
export const zoneMapId = (zone: number): MapId => (zone > 0 ? `zone${zone}` : 'town');

export const OPEN_MAPS: MapId[] = ['town', 'farm', 'adventure', 'lake', 'windhill', 'deepsea', 'glacier'];
export const isMapOpen = (id: MapId): boolean => OPEN_MAPS.includes(id);
/** đổi toạ độ riêng của khu (thị trấn: hệ cũ) sang toạ độ trong bản đồ */
export const toLocal = (id: MapId, [x, y]: [number, number]): [number, number] => [x - MAPS[id].ox, y - MAPS[id].oy];
/** điểm hồi sinh khi gục ngã (toạ độ riêng của khu) */
export const RESPAWN: { map: MapId; at: [number, number] } = { map: 'town', at: [33, 37] };

// ============================================================ Nội dung các khu thị trấn (toạ độ cũ)

export const DISTRICTS: (Rect & { m: TownMapId; name: string; level: string })[] = [
  { m: 'adventure', name: 'Sảnh Hội Mạo Hiểm Giả', level: 'Hội · Quầy nhiệm vụ săn quái · Đài phun nước', x0: 17, y0: 2, x1: 38, y1: 19 },
  { m: 'adventure', name: 'Thao Trường', level: 'Bãi tập của mạo hiểm giả', x0: 3, y0: 3, x1: 15, y1: 18 },
  { m: 'adventure', name: 'Lò Rèn & Hang Mỏ', level: 'Rèn trang bị · Đào quặng', x0: 39, y0: 1, x1: 54, y1: 16 },
  { m: 'adventure', name: 'Cổng Mạo Hiểm', level: 'Đá dịch chuyển · Lối ra 20 vùng quái', x0: 46, y0: 17, x1: 54, y1: 30 },
  { m: 'adventure', name: 'Phố Trang Bị', level: 'Vũ khí · Giáp & phụ kiện · Thuốc', x0: 1, y0: 23, x1: 25, y1: 31 },
  { m: 'adventure', name: 'Hồ Gương', level: 'Hồ nghỉ chân · Câu cá ven hồ', x0: 30, y0: 22, x1: 47, y1: 37 },
  { m: 'adventure', name: 'Cổng Nam', level: 'Đường về Thị Trấn Khởi Nguyên', x0: 22, y0: 36, x1: 33, y1: 40 },
  { m: 'farm', name: 'Cánh Đồng & Vườn Cây Ăn Quả', level: '24 ô canh tác · Tưới nước · Bón phân · Bắt sâu · Vườn hoa quả', x0: 2, y0: 2, x1: 24, y1: 22 },
  { m: 'farm', name: 'Gia Trang & Bếp Ấm', level: 'Nhà riêng · Sân vườn · Nấu nướng nông sản & trái cây', x0: 28, y0: 2, x1: 41, y1: 11 },
  { m: 'farm', name: 'Khu Xưởng & Chế Biến', level: 'Xưởng xây dựng · Kho thóc · Cối xay gió · Giếng nước', x0: 28, y0: 12, x1: 41, y1: 22 },
  { m: 'farm', name: 'Đồng Cỏ Chăn Nuôi & Trạm Thú Y', level: 'Bò · Cừu · Heo · Sân gà · Cho ăn · Chích ngừa · Vệ sinh', x0: 2, y0: 25, x1: 25, y1: 36 },
  { m: 'farm', name: 'Phố Chợ Nông Sản & Vật Tư', level: 'Hạt giống · Phân bón · Thuốc trừ sâu · Chợ nông sản', x0: 28, y0: 25, x1: 41, y1: 35 },
  { m: 'town', name: 'Quảng Trường Trung Tâm', level: 'Đá dịch chuyển · Tượng Vinh Danh · Bảng nhiệm vụ', x0: 26, y0: 28, x1: 40, y1: 41 },
  { m: 'town', name: 'Khu Mua Sắm', level: 'Cánh · Thú cưng · Thời trang · Mũ nón · Trang sức · Bánh & Cà phê · Vòng quay', x0: 42, y0: 36, x1: 62, y1: 56 },
  { m: 'town', name: 'Công Viên Hoa Hồng', level: 'Nghỉ chân thư giãn', x0: 11, y0: 45, x1: 21, y1: 55 },
  { m: 'town', name: 'Phố Chung Cư', level: 'Sao Mai · Sky Tower · Sàn Bất Động Sản — căn hộ đang mở bán', x0: 1, y0: 27, x1: 25, y1: 33 },
  { m: 'town', name: 'Khu Nhà Ở · Phố Nhà Vườn', level: 'Nhà riêng, dinh thự, biệt thự — mua nhà cho mạo hiểm giả', x0: 2, y0: 36, x1: 30, y1: 56 },
  { m: 'lake', name: 'Bến Thuyền & Tiệm Câu Ông Năm', level: 'Tiệm câu cá · Bảng xếp hạng · Bến đò', x0: 10, y0: 1, x1: 34, y1: 9 },
  { m: 'lake', name: 'Đầm Sen Trăng Cổ Tích', level: 'Vùng 2: Hương sen ngát ngào · Chòi nghỉ · Cầu gỗ ngắm hoa', x0: 2, y0: 10, x1: 18, y1: 32 },
  { m: 'lake', name: 'Lòng Hồ Nước Ngọt & Bến Cảng Nam', level: 'Vùng 1 & 3: Cầu chữ T vươn xa · Bến tàu Viễn Dương', x0: 19, y0: 10, x1: 40, y1: 54 },
  { m: 'deepsea', name: 'Bãi Cát Vàng & Vịnh San Hô', level: 'Vùng 4: Rạn san hô ngũ sắc rực rỡ · Ngọn hải đăng', x0: 2, y0: 2, x1: 40, y1: 26 },
  { m: 'deepsea', name: 'Vực Thẳm Hải Tặc & Biển Sâu', level: 'Vùng 5: Xác tàu đắm cổ kính · Thần Thoại Leviathan', x0: 2, y0: 27, x1: 40, y1: 54 },
  { m: 'glacier', name: 'Trạm Tiền Đồn & Rừng Thông Tuyết', level: 'Vùng 6: Rừng thông tuyết phủ · Đầm băng lấp lánh', x0: 2, y0: 2, x1: 40, y1: 26 },
  { m: 'glacier', name: 'Vực Băng Vĩnh Cửu & Động Thác', level: 'Vùng 6: Băng ngọc bích nứt nẻ · Băng Long Thần Ngư Thần Thoại', x0: 2, y0: 27, x1: 40, y1: 54 },
  { m: 'windhill', name: 'Đỉnh Đồi Gió Lộng', level: 'Thảo nguyên lộng gió · Thả diều tự do · Cối xay gió', x0: 2, y0: 2, x1: 46, y1: 34 },
];

export interface Structure {
  id: string;
  m: TownMapId;
  tex: string;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  solidRows: number;
  label: string;
  panel: PanelId;
  /** điểm đứng để tương tác (tile) */
  door: [number, number];
  /** công trình nông trại chỉ hiện khi đã xây */
  building?: BuildingId;
  /** tòa chung cư (id trong TOWERS) — vào cửa mở bảng chọn căn hộ theo tầng */
  tower?: string;
}

const st = (s: Structure) => s;

const STRUCTURES: Structure[] = [
  // Khu Mạo Hiểm Giả — bắc: sảnh Hội; tây: Phố Trang Bị; đông bắc: Lò Rèn & Hang Mỏ (toạ độ riêng, gốc 0)
  st({ id: 'guild', m: 'adventure', tex: 'b_guild', tx: 24, ty: 3, tw: 7, th: 6, solidRows: 4, label: 'Hội Mạo Hiểm Giả', panel: 'guild', door: [27.5, 9.4] }),
  st({ id: 'bounty', m: 'adventure', tex: 'b_bounty', tx: 33, ty: 6, tw: 4, th: 3, solidRows: 2, label: 'Quầy Nhiệm Vụ Săn Quái', panel: 'bounty', door: [35, 9.5] }),
  st({ id: 'weapons', m: 'adventure', tex: 'b_weapon', tx: 5, ty: 24, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Vũ Khí', panel: 'weapons', door: [7, 28.4] }),
  st({ id: 'armor', m: 'adventure', tex: 'b_armor', tx: 11, ty: 24, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Giáp & Phụ Kiện', panel: 'armor', door: [13, 28.4] }),
  st({ id: 'potions', m: 'adventure', tex: 'b_potion', tx: 17, ty: 24, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Thuốc', panel: 'potions', door: [19, 28.4] }),
  st({ id: 'smith', m: 'adventure', tex: 'b_smith', tx: 41, ty: 10, tw: 5, th: 4, solidRows: 3, label: 'Lò Rèn', panel: 'smith', door: [43.5, 14.4] }),
  st({ id: 'mine', m: 'adventure', tex: 'b_mine', tx: 47, ty: 3, tw: 3, th: 3, solidRows: 2, label: 'Hang Mỏ Đá Ngầm', panel: 'mine', door: [48.5, 6.4] }),
  // Khu Nông Trại — bố cục 5 phân khu hợp lý: Gia Trang (ĐB), Khu Xưởng (Đ), Cánh Đồng & Vườn Cây (TB), Đồng Cỏ & Thú Y (TN), Phố Chợ (ĐN)
  st({ id: 'home', m: 'farm', tex: 'b_home', tx: 32, ty: 3, tw: 5, th: 4, solidRows: 3, label: 'Gia Trang · Nhà bạn & Bếp', panel: 'home', door: [34.5, 7.4] }),
  st({ id: 'workshop', m: 'farm', tex: 'b_workshop', tx: 29, ty: 14, tw: 5, th: 4, solidRows: 3, label: 'Xưởng Xây Dựng', panel: 'build', door: [31.5, 18.4] }),
  st({ id: 'barn', m: 'farm', tex: 'b_barn', tx: 35, ty: 14, tw: 5, th: 4, solidRows: 3, label: 'Kho Thóc Nông Trại', panel: 'build', door: [37.5, 18.4], building: 'barn' }),
  st({ id: 'windmill', m: 'farm', tex: 'b_windmill', tx: 29, ty: 19, tw: 3, th: 4, solidRows: 2, label: 'Cối Xay Gió', panel: 'build', door: [30.5, 23.4], building: 'windmill' }),
  st({ id: 'well', m: 'farm', tex: 'b_well', tx: 33, ty: 20, tw: 2, th: 2, solidRows: 1, label: 'Giếng Nước Tưới Tiêu', panel: 'build', door: [34, 22.5], building: 'well' }),
  st({ id: 'seeds', m: 'farm', tex: 'b_seed', tx: 29, ty: 27, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Hạt Giống & Phân Bón', panel: 'seeds', door: [31, 31.4] }),
  st({ id: 'market', m: 'farm', tex: 'b_market', tx: 35, ty: 28, tw: 4, th: 3, solidRows: 2, label: 'Chợ Nông Sản & Hoa Quả', panel: 'market', door: [37, 31.4] }),
  st({ id: 'ranch', m: 'farm', tex: 'b_ranch', tx: 21, ty: 26, tw: 2, th: 2, solidRows: 1, label: 'Trạm Thú Y & Chăn Nuôi Bác Tư', panel: 'ranch', door: [22, 28.4] }),
  // Quảng trường
  st({ id: 'statue', m: 'town', tex: 'b_statue', tx: 28, ty: 29.5, tw: 2, th: 2.5, solidRows: 1, label: 'Tượng Vinh Danh', panel: 'rank', door: [29, 32.4] }),
  st({ id: 'board', m: 'town', tex: 'b_board', tx: 37, ty: 30, tw: 2, th: 2, solidRows: 1, label: 'Bảng Nhiệm Vụ Hằng Ngày', panel: 'quests', door: [38, 32.3] }),
  // Phố Chung Cư (phía bắc đường lớn, mặt tiền nhìn ra đường)
  st({ id: 't_saomai', m: 'town', tex: 't_saomai', tx: 2, ty: 27, tw: 6, th: 6, solidRows: 3, label: 'Chung cư Sao Mai', panel: 'realty', door: [5, 33.4], tower: 'saomai' }),
  st({ id: 'realty', m: 'town', tex: 'b_realty', tx: 10, ty: 29, tw: 5, th: 4, solidRows: 3, label: 'Sàn Bất Động Sản', panel: 'realty', door: [12.5, 33.4] }),
  st({ id: 't_sky', m: 'town', tex: 't_sky', tx: 17, ty: 26, tw: 7, th: 7, solidRows: 3, label: 'Sky Tower Hoàng Kim', panel: 'realty', door: [20.5, 33.4], tower: 'sky' }),
  // Khu Mua Sắm — dãy bắc (đồ đeo/thú cưng) nhìn ra đường lớn, dãy giữa (mũ, trang sức, tiệm bánh), quầy vòng quay góc đông
  st({ id: 'wings', m: 'town', tex: 'b_wings', tx: 43, ty: 37, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Cánh', panel: 'wings', door: [45, 41.4] }),
  st({ id: 'pets', m: 'town', tex: 'b_pets', tx: 49, ty: 37, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Thú Cưng', panel: 'pets', door: [51, 41.4] }),
  st({ id: 'fashion', m: 'town', tex: 'b_fashion', tx: 55, ty: 37, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Thời Trang', panel: 'fashion', door: [57, 41.4] }),
  st({ id: 'wheel', m: 'town', tex: 'b_wheel', tx: 60, ty: 38, tw: 3, th: 3, solidRows: 2, label: 'Vòng Quay May Mắn', panel: 'wheel', door: [61.5, 41.4] }),
  st({ id: 'hats', m: 'town', tex: 'b_hats', tx: 43, ty: 46, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Mũ Nón', panel: 'hats', door: [45, 50.4] }),
  st({ id: 'jewelry', m: 'town', tex: 'b_jewelry', tx: 49, ty: 46, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Trang Sức', panel: 'jewelry', door: [51, 50.4] }),
  st({ id: 'bakery', m: 'town', tex: 'b_bakery', tx: 55, ty: 46, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Bánh & Cà Phê', panel: 'bakery', door: [57, 50.4] }),
  // Hồ Câu Cá
  st({ id: 'fishshop', m: 'lake', tex: 'b_fish', tx: 23, ty: 2, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Câu Cá Ông Năm', panel: 'fishing', door: [25, 6.4] }),
  st({ id: 'fishboard', m: 'lake', tex: 'b_board', tx: 29, ty: 3, tw: 2, th: 2, solidRows: 1, label: 'Bảng Top Câu Cá', panel: 'fishrank', door: [30, 5.5] }),
  // Đồi Gió Thả Diều
  st({ id: 'kiteshop', m: 'windhill', tex: 'b_kite', tx: 16, ty: 12, tw: 4, th: 4, solidRows: 3, label: 'Tiệm Diều Bay Lượn', panel: 'kites', door: [18, 16.4] }),
];

export interface HouseLot {
  house: string;
  tex: string;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  solidRows: number;
  door: [number, number];
}

/** Nhà bán ở Khu Nhà Ở (bản đồ Thị Trấn) — hiện biển "bán" khi chưa mua */
const HOUSE_LOTS: HouseLot[] = [
  { house: 'cabin', tex: 'h_cabin', tx: 3, ty: 37, tw: 5, th: 4, solidRows: 3, door: [5.5, 41.4] },
  { house: 'cottage', tex: 'h_cottage', tx: 9, ty: 37, tw: 5, th: 4, solidRows: 3, door: [11.5, 41.4] },
  { house: 'townhouse', tex: 'h_town', tx: 15, ty: 37, tw: 5, th: 4, solidRows: 3, door: [17.5, 41.4] },
  { house: 'manor', tex: 'h_manor', tx: 21, ty: 37, tw: 5, th: 4, solidRows: 3, door: [23.5, 41.4] },
  { house: 'villa', tex: 'h_villa', tx: 3, ty: 45, tw: 7, th: 6, solidRows: 4, door: [6.5, 51.4] },
  { house: 'lakehouse', tex: 'h_lake', tx: 23, ty: 46, tw: 6, th: 4, solidRows: 3, door: [26, 50.4] },
];

export interface NpcSpot {
  id: string;
  x: number;
  y: number;
  /** điểm đứng nói chuyện nếu khác chỗ NPC đứng */
  talk?: [number, number];
}

/** NPC: id khớp NPC_DEFS */
const NPCS: (NpcSpot & { m: TownMapId })[] = [
  { id: 'chief', m: 'adventure', x: 32.2, y: 10.4 },
  { id: 'clerk', m: 'adventure', x: 35, y: 7.3, talk: [36.9, 9.7] },
  { id: 'armorer', m: 'adventure', x: 9.9, y: 28.8 },
  { id: 'alchemist', m: 'adventure', x: 21.6, y: 28.6 },
  { id: 'smith', m: 'adventure', x: 47, y: 14.6 },
  { id: 'seeder', m: 'farm', x: 33.4, y: 31.2 },
  { id: 'merchant', m: 'farm', x: 39.4, y: 31.2 },
  { id: 'rancher', m: 'farm', x: 23.6, y: 28.4 },
  { id: 'winger', m: 'town', x: 42.3, y: 42.2 },
  { id: 'breeder', m: 'town', x: 47.9, y: 42.2 },
  { id: 'stylist', m: 'town', x: 53.9, y: 42.2 },
  { id: 'hatter', m: 'town', x: 42.3, y: 51.2 },
  { id: 'jeweler', m: 'town', x: 47.9, y: 51.2 },
  { id: 'baker', m: 'town', x: 59.7, y: 51.2 },
  { id: 'fisher', m: 'lake', x: 27, y: 7.2 },
  { id: 'boatman', m: 'lake', x: 15, y: 7.2 },
];

/** Ô ruộng 6×4 (Khu Nông Trại): chia thành 4 luống 3×2 ngăn nắp có lối đá ở giữa để đi tưới/bón phân */
const PLOT_TILES: [number, number][] = [];
for (let r = 0; r < 4; r++) {
  const py = (r < 2 ? 4 : 6) + r * 3;
  for (let c = 0; c < 6; c++) {
    const px = (c < 3 ? 4 : 6) + c * 3;
    PLOT_TILES.push([px, py]);
  }
}
const FARM = { x0: 2, y0: 2, x1: 24, y1: 20, gate: [12, 13, 14] };
const RANCH = { x0: 3, y0: 26, x1: 20, y1: 32, gate: [11, 12] };
const RANCH_PEN: Rect = { x0: 4.5, y0: 27.5, x1: 19.2, y1: 31.3 };
const CHICKEN_YARD: Rect = { x0: 4, y0: 33, x1: 18, y1: 35 };

// const KITE_SPOT = { x: 10, y: 71 };
/** hồ riêng của Nhà ven hồ */
const PRIVATE_POND: Rect = { x0: 22, y0: 51, x1: 30, y1: 56 };
/** đài phun nước (tâm đáy sprite); ô chắn của từng đài đặt trong PAINT */
const FOUNTAINS: Partial<Record<TownMapId, { x: number; y: number; tex: string }>> = {
  town: { x: 16.5, y: 51, tex: 'fountain' },
  adventure: { x: 27.5, y: 17, tex: 'fountain_guild' },
};
/** Khu Mạo Hiểm Giả: rào Thao Trường, Hồ Gương */
const TRAINING = { x0: 3, y0: 4, x1: 15, y1: 17, gate: [9, 10] };
const MIRROR_LAKE = { cx: 38.5, cy: 31, rx: 8, ry: 5.2 };

const LAMPS: Record<TownMapId, [number, number][]> = {
  adventure: [
    [17, 11], [38, 11], [17, 18], [38, 18], [26, 24], [29, 24], [26, 32], [29, 32], [22, 37], [33, 37],
    [8, 22], [20, 22], [10, 31], [22, 31], [40, 17], [46, 17], [54, 17], [46, 24], [54, 24], [37, 22], [40, 22],
  ],
  farm: [
    [11, 21], [15, 21], [25, 22], [28, 22], [28, 8], [28, 18], [28, 31], [40, 22], [40, 31], [20, 25],
  ],
  town: [[9, 33], [16, 33], [25, 33], [1, 36], [27, 29], [39, 29], [27, 40], [39, 40], [42, 36], [62, 36], [47, 45], [53, 45], [59, 45], [42, 55], [62, 55], [48, 55], [8, 44], [20, 44], [11, 54], [21, 54], [34, 50]],
  // Các khu mới: ít cột đèn, đặt ở mép sân/bến (không chắn lối đi, cầu gỗ hay cửa tiệm)
  // hai đầu sân làng chài · đầu cầu sang bờ Đông · hai bến cảng Nam
  lake: [[13, 5], [37, 5], [43, 10], [13, 39], [39, 39]],
  // ven lối mòn lên đồi · bên bục thả diều · ven lối sang Hồ Câu
  windhill: [[21, 6], [27, 12], [36, 16]],
  // đầu bến tàu · góc cầu cảng chính · giữa đảo hải tặc
  deepsea: [[12, 4], [7, 19], [30, 28]],
  // hai đầu sân trạm thám hiểm · trạm nghỉ giữa sông băng · đài câu giữa hồ băng
  glacier: [[11, 6], [27, 6], [16, 17], [21, 39]],
};

export interface Waypoint {
  id: string;
  m: MapId;
  name: string;
  /** toạ độ theo hệ của bản đồ chứa nó (thị trấn: hệ cũ) */
  x: number;
  y: number;
  town?: boolean;
}

export const WAYPOINTS: Waypoint[] = [
  { id: 'town_plaza', m: 'town', name: 'Quảng trường', x: 35.5, y: 32.6, town: true },
  { id: 'town_home', m: 'town', name: 'Khu Nhà Ở', x: 10.5, y: 45.6, town: true },
  { id: 'town_shop', m: 'town', name: 'Khu Mua Sắm', x: 52.5, y: 55.4, town: true },
  { id: 'town_adventure', m: 'adventure', name: 'Cổng Mạo Hiểm', x: 50.5, y: 19.6, town: true },
  { id: 'town_farm', m: 'farm', name: 'Khu Nông Trại', x: 37.5, y: 23.6, town: true },
  { id: 'town_lake', m: 'lake', name: 'Hồ Sen & Sông Quê', x: 24, y: 5, town: true },
  { id: 'town_deepsea', m: 'deepsea', name: 'Vịnh Biển San Hô', x: 9, y: 5, town: true },
  { id: 'town_glacier', m: 'glacier', name: 'Vực Băng Vĩnh Cửu', x: 19, y: 5, town: true },
  { id: 'town_windhill', m: 'windhill', name: 'Đồi Gió Thả Diều', x: 24, y: 19, town: true },
  // đá dịch chuyển ở cửa vào mỗi vùng (vị trí khớp paintZone trong zoneGen.ts; id giữ camp_* cho save cũ)
  ...ZONE_DEFS.map((z) => ({ id: `camp_${z.id}`, m: `zone${z.id}` as MapId, name: `Vùng ${z.id} · ${z.name}`, x: 5.5, y: ZMY + 4.6 })),
];
/** điểm tới của đá dịch chuyển, theo toạ độ trong bản đồ */
export const waypointAt = (w: Waypoint): [number, number] => [w.x - MAPS[w.m].ox, w.y - MAPS[w.m].oy];

/** biển báo đọc được */
const SIGNS: { m: MapId; x: number; y: number; text: string }[] = [
  {
    m: 'farm', x: 16.5, y: 21.2,
    text: '🪧 Quy trình canh tác: 🌱 Gieo hạt (Hoa quả / Rau củ) → 💧 Tưới nước → 🌿 Bón phân → 🐛 Bắt sâu / Làm cỏ → 🧺 Thu hoạch trái chín!',
  },
  {
    m: 'farm', x: 24.5, y: 27.2,
    text: '🪧 Khu Chăn Nuôi & Thú Y: 🍽️ Cho vật nuôi ăn no · 💉 Chích ngừa vắc-xin phòng dịch · 🧹 Dọn chuồng sạch sẽ · 💊 Chữa bệnh khi ốm.',
  },
  {
    m: 'town', x: 40.5, y: 51.2,
    text: '🪧 Khu Mua Sắm · Dãy trên: 🪽 Cánh · 🐾 Thú cưng · 👗 Thời trang · 🎡 Vòng quay — Dãy giữa: 🎩 Mũ nón · 💍 Trang sức · 🍰 Bánh & Cà phê.',
  },
  { m: 'adventure', x: 53.5, y: 19.2, text: '🪧 Phía đông: 20 vùng quái, mạnh dần. Không có chỗ an toàn — mỗi vùng có 1 👑 Boss canh rương báu.' },
  {
    m: 'adventure', x: 24.5, y: 39.2,
    text: '🪧 Bắc: Sảnh Hội & Quầy săn quái · Tây: Phố Trang Bị & Thao Trường · Đông bắc: Lò Rèn & Hang Mỏ · Đông: Cổng ra 20 vùng quái.',
  },
  { m: 'lake', x: 10, y: 12, text: '🪧 [Vùng 2: Đầm Sen Trăng Cổ Tích] Hương sen ngát ngào · Cá lóc, trê đầm, cá Koi · 🌸 Siêu hiếm: Linh Hồn Sen Vàng' },
  { m: 'lake', x: 22, y: 26, text: '🪧 [Vùng 3: Vực Thẳm Lòng Hồ] Qua Cầu Đá Vòm ra Đảo Ngọc Giữa Hồ hoặc xuống Bến Cảng Nam · Cá trê khổng lồ, cá tầm gai' },
  { m: 'lake', x: 25, y: 37, text: '🪧 Bến Thuyền Viễn Dương · Hướng Tây: Vịnh Biển San Hô (Deep Sea) · Hướng Đông: Vực Băng Vĩnh Cửu (Glacier)' },
  { m: 'deepsea', x: 12, y: 6, text: '🪧 [Vùng 4: Vịnh Biển San Hô] Bãi cát nhiệt đới & rạn san hô · Cá ngừ đại dương, cá chim, cá kiếm bạc' },
  { m: 'deepsea', x: 28, y: 25, text: '🪧 [Vùng 5: Vực Biển Hải Tặc] Xác tàu đắm cổ kính · 🌊 Siêu hiếm: Thủy Quái Leviathan Chúa Tể!' },
  { m: 'glacier', x: 19, y: 7, text: '🪧 [Vùng 6: Đầm Băng Cực Bắc] Rừng thông tuyết & đầm băng · Cá tuyết bắc cực, cá hồi tuyết' },
  { m: 'glacier', x: 19, y: 38, text: '🪧 [Vùng 6: Vực Băng Vĩnh Cửu] Băng ngọc bích nứt nẻ · ❄️ Siêu hiếm: Băng Long Thần Ngư Thượng Cổ!' },
  { m: 'windhill', x: 24.5, y: 15.2, text: '🪧 [Đồi Gió Thả Diều] Đỉnh đồi lộng gió quanh năm. Hãy ghé Tiệm Diều chuẩn bị diều xịn và tiến ra bục đón gió!' },
];

// ============================================================ Vùng quái (toạ độ riêng)

export interface Spawner {
  monster: string;
  count: number;
  area: Rect;
  avoid: Rect[];
}

// ============================================================ Dựng bản đồ

export interface Prop {
  tex: string;
  x: number;
  y: number;
}

export interface LakeLife {
  moored: { x: number; y: number; flip?: boolean }[];
  /** tex chạy theo đường cong qua pts (tile); trail: n con nhỏ bơi theo sau; loop = vòng kín, không thì đi rồi quay lại */
  routes: { tex: string; trail?: string; n?: number; pts: [number, number][]; loop: boolean; ms: number }[];
}

export interface MapData {
  info: MapInfo;
  ground: number[][];
  solid: boolean[][];
  props: Prop[];
  fences: Prop[];
  water: [number, number][];
  lava: [number, number][];
  glows: { x: number; y: number; color: number }[];
  // ---- mọi toạ độ dưới đây là tile trong bản đồ này
  structures: Structure[];
  houses: HouseLot[];
  npcs: NpcSpot[];
  plots: [number, number][];
  /** chuồng vật nuôi / sân gà (tile) — null nếu khu không có */
  ranchPen: Rect | null;
  chickens: Rect | null;
  kiteSpot: { x: number; y: number } | null;
  /** thuyền neo & thuyền/vịt di chuyển trên mặt nước (chỉ Hồ Câu) */
  lakeLife?: LakeLife;
  privatePond: Rect | null;
  fountain: { x: number; y: number; tex: string } | null;
  lamps: [number, number][];
  waypoints: Waypoint[];
  signs: { x: number; y: number; text: string }[];
  exits: Exit[];
  districts: (Rect & { name: string; level: string })[];
  spawners: Spawner[];
}

const GLOW_COLORS: Record<string, number> = {
  torch: 0xff9a40, torch_blue: 0x60c8ff, torch_purple: 0xc070ff, glow_shroom: 0x70ffd0, wisp_lantern: 0x9fc8ff,
  crystal: 0x40c8ff, ice_crystal: 0x9fe0ff, void_crystal: 0xb060ff, mushroom_big: 0xc080ff, obelisk: 0xff5020,
};

/** Bảng vẽ: mọi hàm nhận toạ độ theo hệ của khu (thị trấn: hệ cũ) rồi tự trừ gốc */
function makeCanvas(info: MapInfo, seed: number) {
  const { w, h, ox, oy } = info;
  const rnd = mulberry32(seed);
  const ground: number[][] = [];
  const solid: boolean[][] = [];
  const reserved: boolean[][] = [];
  for (let y = 0; y < h; y++) {
    ground.push(new Array(w).fill(TILE.GRASS));
    solid.push(new Array(w).fill(false));
    reserved.push(new Array(w).fill(false));
  }
  /** ô trong bản đồ (toạ độ cục bộ) */
  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const each = (x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) => {
    for (let y = Math.max(0, Math.floor(y0 - oy)); y <= Math.min(h - 1, Math.floor(y1 - oy)); y++)
      for (let x = Math.max(0, Math.floor(x0 - ox)); x <= Math.min(w - 1, Math.floor(x1 - ox)); x++) fn(x, y);
  };
  const reserve = (x0: number, y0: number, x1: number, y1: number) => each(x0, y0, x1, y1, (x, y) => (reserved[y][x] = true));
  const fill = (x0: number, y0: number, x1: number, y1: number, tile: number) =>
    each(x0, y0, x1, y1, (x, y) => {
      ground[y][x] = tile;
      if (tile !== TILE.WATER && tile !== TILE.WATER2 && tile !== TILE.LAVA && tile !== TILE.LAVA2) {
        solid[y][x] = false;
      }
    });
  const path = (x0: number, y0: number, x1: number, y1: number, tile: number = TILE.PATH) => {
    fill(x0, y0, x1, y1, tile);
    reserve(x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  };
  const blob = (cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, d: number) => void) => {
    each(cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2, (x, y) => fn(x, y, ((x + ox + 0.5 - cx) / rx) ** 2 + ((y + oy + 0.5 - cy) / ry) ** 2));
  };
  const props: Prop[] = [];
  const glows: MapData['glows'] = [];
  /** đặt vật theo toạ độ cục bộ */
  const placeL = (tex: string, xIn: number, yIn: number, isSolid = true) => {
    // toạ độ lẻ (vd lá súng 43.5) → làm tròn về ô lưới, không thì solid[y] là undefined và bản đồ không dựng được
    const x = Math.floor(xIn);
    const y = Math.floor(yIn);
    if (!ok(x, y)) return;
    props.push({ tex, x: x * T + 8, y: y * T + 16 });
    if (isSolid) solid[y][x] = true;
    reserved[y][x] = true;
    if (GLOW_COLORS[tex]) glows.push({ x: x * T + 8, y: y * T + 4, color: GLOW_COLORS[tex] });
  };
  const place = (tex: string, x: number, y: number, isSolid = true) => placeL(tex, x - ox, y - oy, isSolid);
  const water: [number, number][] = [];
  const lava: [number, number][] = [];
  const addPool = (cx: number, cy: number, rx: number, ry: number, kind: 'water' | 'lava', shore: number | null) => {
    blob(cx, cy, rx, ry, (x, y, d) => {
      if (reserved[y][x] && d <= 1) return;
      if (d <= 1) {
        ground[y][x] = kind === 'water' ? TILE.WATER : TILE.LAVA;
        solid[y][x] = true;
        (kind === 'water' ? water : lava).push([x, y]);
      } else if (shore !== null && d <= 1.45 && ground[y][x] !== TILE.PATH && ground[y][x] !== TILE.WATER) {
        ground[y][x] = shore;
      }
    });
  };
  return { info, rnd, ground, solid, reserved, ok, each, reserve, fill, path, blob, props, glows, place, placeL, water, lava, addPool };
}
export type Canvas = ReturnType<typeof makeCanvas>;

const exitLabel = (to: MapId) => MAPS[to]?.name ?? to;

function exitsOf(info: MapInfo): Exit[] {
  return info.exits.map((e) => ({
    x0: e.r.x0 - info.ox, y0: e.r.y0 - info.oy, x1: e.r.x1 - info.ox, y1: e.r.y1 - info.oy,
    to: e.to, at: [e.at[0] - MAPS[e.to].ox, e.at[1] - MAPS[e.to].oy], label: exitLabel(e.to),
  }));
}

/** tường/cây bao quanh, chừa cổng; cây không mọc chắn cổng */
function border(cv: Canvas, wallTex: (x: number, y: number) => string) {
  const { w, h, ox, oy } = cv.info;
  const gap = (x: number, y: number) => cv.info.exits.some((e) => inRect(e.r, x + ox, y + oy));
  for (const e of cv.info.exits) cv.reserve(e.r.x0 - 2, e.r.y0 - 2, e.r.x1 + 2, e.r.y1 + 2);
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (!gap(x, y)) cv.placeL(wallTex(x, y), x, y);
  for (let y = 1; y < h - 1; y++) for (const x of [0, w - 1]) if (!gap(x, y)) cv.placeL(wallTex(x, y), x, y);
}

function fenceRect(cv: Canvas, r: { x0: number; y0: number; x1: number; y1: number; gate?: number[] }, northGate = false) {
  const { place } = cv;
  for (let x = r.x0; x <= r.x1; x++) {
    for (const y of [r.y0, r.y1]) {
      if ((northGate ? y === r.y0 : y === r.y1) && r.gate && r.gate.includes(x)) continue;
      place('fence', x, y);
    }
  }
  for (let y = r.y0 + 1; y < r.y1; y++) {
    for (const x of [r.x0, r.x1]) {
      place('fence_v', x, y);
    }
  }
  cv.reserve(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1);
}

// ------------------------------------------------------------ từng khu thị trấn

const PAINT: Record<TownMapId, (cv: Canvas) => void> = {
  farm: (cv) => {
    const { path, fill, place, reserve, addPool } = cv;
    // Trục đường chính Đông - Tây (từ cổng Thị Trấn vào sâu đồng cỏ) & Đại lộ Bắc - Nam chia đôi Nông Trại
    path(3, 23, 43, 24);
    path(26, 3, 27, 35);

    // 1. Cánh Đồng & Vườn Cây Ăn Quả (Tây Bắc): lối đá chữ thập chia 4 luống ruộng 3×2 + hồ tưới tiêu + ủ phân
    fill(FARM.x0 + 1, FARM.y0 + 1, FARM.x1 - 1, FARM.y1 - 1, TILE.GRASS2);
    path(13, 3, 14, 22, TILE.PLAZA);
    path(3, 10, 23, 11, TILE.PLAZA);
    addPool(6.5, 19, 2.2, 1.1, 'water', TILE.SAND);
    fenceRect(cv, FARM, false);
    place('scarecrow', 13, 10);
    place('compost_bin', 21, 18);
    place('compost_bin', 22, 18);
    place('barrel', 20, 19);
    // Hàng cây ăn quả (Táo, Cam, Đào) ven cánh đồng và vườn
    for (const [x, y, tex] of [
      [3, 3, 'fruit_tree_apple'], [23, 3, 'fruit_tree_orange'], [3, 18, 'fruit_tree_peach'],
      [25, 5, 'fruit_tree_apple'], [25, 9, 'fruit_tree_orange'], [25, 13, 'fruit_tree_peach'], [25, 17, 'fruit_tree_apple'],
    ] as [number, number, string][]) {
      place(tex, x, y);
    }

    // 2. Gia Trang & Bếp Ấm (Đông Bắc): sân gạch ấm cúng, bồn hoa, ghế nghỉ, vườn cây trái sau nhà
    path(28, 7, 39, 9, TILE.PLAZA);
    place('mailbox', 31, 7, false);
    for (const [x, y] of [[30, 6], [38, 6], [30, 10], [38, 10]]) place('flowerbed', x, y);
    place('bench', 34, 10);
    for (const [x, y, tex] of [
      [29, 3, 'fruit_tree_peach'], [39, 3, 'fruit_tree_apple'], [40, 6, 'fruit_tree_orange'],
    ] as [number, number, string][]) {
      place(tex, x, y);
    }
    reserve(28, 2, 41, 11);

    // 3. Khu Xưởng, Kho Thóc, Cối Xay Gió & Giếng Nước (Đông Trung)
    path(28, 18, 40, 19, TILE.PLAZA);
    path(30, 20, 34, 22);
    for (const [x, y] of [[34, 15], [40, 15], [40, 17]]) place('crate', x, y);
    for (const [x, y] of [[34, 16], [36, 20]]) place('barrel', x, y);
    place('hay', 38, 20);
    reserve(28, 13, 41, 22);

    // 4. Đồng Cỏ Chăn Nuôi & Trạm Thú Y (Tây Nam): chuồng gia súc rộng rãi + sân gà + khu khám thú y
    fill(RANCH.x0 + 1, RANCH.y0 + 1, RANCH.x1 - 1, RANCH.y1 - 1, TILE.GRASS2);
    path(11, 25, 12, 26);
    path(21, 25, 24, 29, TILE.PLAZA);
    fenceRect(cv, RANCH, true);
    place('trough', 6, 28);
    place('trough', 15, 28);
    place('hay', 18, 27);
    place('hay', 18, 30);
    place('hay', 5, 31);
    place('barrel', 20, 28);
    place('crate', 23, 26);
    fill(CHICKEN_YARD.x0, CHICKEN_YARD.y0, CHICKEN_YARD.x1, CHICKEN_YARD.y1, TILE.DIRT);
    place('trough', 8, 34);
    place('hay', 15, 34);
    reserve(2, 25, 25, 36);

    // 5. Phố Chợ Nông Sản & Vật Tư (Đông Nam): quảng trường thương mại hạt giống, phân bón, nông sản
    path(28, 31, 40, 33, TILE.PLAZA);
    path(33, 25, 34, 31);
    for (const [x, y] of [[28, 28], [34, 28], [40, 28], [30, 34], [38, 34]]) place('flowerbed', x, y);
    for (const [x, y] of [[32, 34], [36, 34]]) place('bench', x, y);
    for (const [x, y] of [[41, 21], [41, 26]]) place('banner', x, y);
    place('crate', 33, 29);
    place('barrel', 39, 29);
    reserve(28, 25, 41, 35);
  },
  adventure: (cv) => {
    const { path, fill, reserve, place, placeL, addPool, blob, each, ground, solid, reserved, rnd, props } = cv;
    // trục chính cổng nam → sảnh Hội, phố ngang Thao Trường ↔ Cổng Mạo Hiểm (ra vùng quái)
    path(27, 18, 28, 41);
    path(3, 20, 55, 21);
    path(17, 10, 38, 19, TILE.PLAZA);
    path(23, 37, 32, 40, TILE.PLAZA);
    path(3, 29, 26, 30);
    path(9, 18, 10, 19);
    path(39, 15, 53, 16);
    path(48, 7, 49, 14);
    path(46, 17, 54, 24, TILE.PLAZA);

    // sảnh Hội: đài phun nước lớn, cờ hai bên cửa, ghế đá, bồn hoa
    for (let y = 15; y <= 16; y++) for (let x = 25; x <= 29; x++) solid[y][x] = true;
    for (const [x, y] of [[23, 9], [31, 9]]) place('banner', x, y);
    for (const [x, y] of [[20, 13], [20, 16], [34, 13], [34, 16]]) place('bench', x, y);
    for (const [x, y] of [[22, 15], [32, 15], [18, 10], [37, 10]]) place('flowerbed', x, y);

    // Thao Trường: sân đất rào kín, hình nộm, giá vũ khí
    fill(TRAINING.x0 + 1, TRAINING.y0 + 1, TRAINING.x1 - 1, TRAINING.y1 - 1, TILE.DIRT);
    fenceRect(cv, TRAINING, false);
    for (const x of [6, 9, 12]) place('dummy', x, 8);
    for (const x of [6, 12]) place('dummy', x, 12);
    for (const x of [5, 12]) place('weapon_rack', x, 15);
    place('barrel', 14, 5);
    place('crate', 4, 5);
    for (const x of [8, 11]) place('banner', x, 18);

    // mỏ đá quanh Hang Mỏ, thùng quặng cạnh Lò Rèn
    blob(48, 3.5, 8, 5, (x, y, d) => {
      if (d <= 1 && ground[y][x] !== TILE.PATH) ground[y][x] = rnd() < 0.7 ? TILE.ROCK : TILE.ROCK2;
    });
    for (const [x, y] of [[42, 3], [53, 6], [44, 6]]) place('boulder', x, y);
    for (const [x, y] of [[45, 2], [51, 2], [52, 8], [41, 7]]) place('rock', x, y);
    for (const [x, y] of [[53, 3], [46, 1]]) place('crystal', x, y);
    for (const [x, y] of [[51, 11], [52, 11]]) place('barrel', x, y);
    for (const [x, y] of [[51, 12], [53, 12]]) place('crate', x, y);
    place('weapon_rack', 39, 13);
    reserve(39, 0, 54, 13);

    // Hồ Gương: cầu gỗ từ phố ngang ra giữa hồ, lau sậy quanh bờ, ghế ngắm hồ
    const dock = () => fill(38, 22, 39, 29, TILE.DOCK);
    dock();
    reserve(38, 22, 39, 29);
    addPool(MIRROR_LAKE.cx, MIRROR_LAKE.cy, MIRROR_LAKE.rx, MIRROR_LAKE.ry, 'water', TILE.SAND);
    dock();
    each(29, 24, 48, 38, (x, y) => {
      if (ground[y][x] === TILE.SAND && !reserved[y][x] && rnd() < 0.14) placeL('reeds', x, y, false);
    });
    for (const [x, y] of [[33, 23], [43, 23]]) place('bench', x, y);
    reserve(29, 22, 48, 38);

    // Cổng Mạo Hiểm: trại tập kết trước khi ra vùng quái
    place('tent', 51, 27);
    solid[27][50] = solid[27][52] = true;
    props.push({ tex: 'campfire_spot', x: 51 * T + 8, y: 29 * T + 16 });
    solid[29][51] = true;
    for (const [x, y] of [[48, 26], [53, 26]]) place('crate', x, y);
    place('barrel', 53, 29);
    for (const [x, y] of [[48, 18], [53, 23]]) place('banner', x, y);
    reserve(47, 25, 54, 31);
    // rừng thông nhỏ góc đông nam
    each(44, 31, 54, 40, (x, y) => {
      if (!reserved[y][x] && !solid[y][x] && rnd() < 0.22) placeL(rnd() < 0.6 ? 'pine' : 'tree', x, y);
    });

    // Phố Trang Bị + vườn nghỉ phía nam
    place('weapon_rack', 2, 27);
    for (const [x, y] of [[23, 26], [24, 26]]) place('barrel', x, y);
    place('crate', 23, 27);
    place('b_well', 13, 35);
    for (const [x, y] of [[9, 35], [16, 35]]) place('bench', x, y);
    for (const [x, y] of [[11, 33], [15, 33], [11, 37], [15, 37]]) place('flowerbed', x, y);
    reserve(7, 32, 19, 38);
    // cờ đón ở cổng nam
    for (const [x, y] of [[25, 40], [30, 40]]) place('banner', x, y);
  },
  town: (cv) => {
    const { path, addPool, reserve, solid, place, fill, ox, oy } = { ...cv, ox: cv.info.ox, oy: cv.info.oy };
    path(32, 26, 33, 57);
    path(0, 34, 62, 35);
    path(27, 29, 39, 40, TILE.PLAZA);
    // Khu Mua Sắm: lát đá cả khu, lối nối từ đường dọc trung tâm sang quảng trường dưới
    path(42, 41, 62, 56, TILE.PLAZA);
    path(34, 52, 41, 53);
    path(3, 42, 31, 43);
    path(12, 46, 20, 53, TILE.PLAZA);
    path(6, 52, 7, 56);
    path(21, 50, 22, 56);
    addPool(26, 53.3, 2.6, 1.3, 'water', TILE.SAND);
    reserve(PRIVATE_POND.x0, PRIVATE_POND.y0, PRIVATE_POND.x1, PRIVATE_POND.y1);
    // đài phun nước
    for (let y = 49; y <= 50; y++) for (let x = 15; x <= 17; x++) solid[y - oy][x - ox] = true;
    reserve(11, 45, 21, 55);
    for (const [x, y] of [[13, 47], [19, 47], [13, 52], [19, 52], [36, 38], [30, 38]]) place('bench', x, y);
    for (const [x, y] of [[12, 50], [20, 50], [28, 32], [38, 37]]) place('flowerbed', x, y);
    // Khu Mua Sắm: phố đi bộ giữa hai dãy, quảng trường dưới có quán cà phê vỉa hè, xe kem, xe bóng bay
    for (const [x, y] of [[42, 45], [62, 45], [62, 52], [50, 56], [55, 56]]) place('flowerbed', x, y);
    for (const [x, y] of [[56, 53], [58, 54], [60, 53]]) place('cafe_table', x, y);
    place('icecream_cart', 47, 54);
    place('balloon_cart', 44, 54);
    for (const [x, y] of [[45, 56], [59, 56]]) place('bench', x, y);
    place('hedge', 62, 49);
    for (const hl of HOUSE_LOTS) reserve(hl.tx - 1, hl.ty - 1, hl.tx + hl.tw, hl.ty + hl.th + 1);
    // Phố Chung Cư: vỉa hè lát đá trước các tòa, bồn hoa, biển quảng cáo mở bán cạnh quảng trường
    fill(1, 33, 25, 33, TILE.PLAZA);
    reserve(1, 27, 25, 33);
    place('billboard', 25, 31);
    for (const x of [8, 15]) place('hedge', x, 31);
    for (const x of [1, 16]) place('flowerbed', x, 32);
    // Phố Nhà Vườn: bồn hoa + hòm thư trước mỗi căn
    for (const hl of HOUSE_LOTS.slice(0, 4)) {
      place('mailbox', hl.tx, hl.ty + hl.th, false);
      place('flowerbed', hl.tx + hl.tw - 1, hl.ty + hl.th);
    }
  },
  lake: (cv) => {
    const { path, reserve, fill, placeL, ground, solid, info } = cv;

    // 1. Cổng vào phía Bắc & Làng chài ven hồ Ông Năm
    path(22, 0, 26, 6, TILE.PATH);
    path(14, 5, 36, 7, TILE.PLAZA);
    reserve(12, 0, 38, 8);

    // Cây liễu rủ, hoa anh đào làng chài (cột đèn: xem LAMPS)
    placeL('sakura', 17, 3);
    placeL('tree', 33, 3);
    placeL('bench', 19, 6);
    placeL('bench', 29, 6);
    placeL('crate', 22, 6);
    placeL('barrel', 31, 6);

    // 2. Dòng sông quê uốn lượn (Vùng 1: Sông Thơ Mộng)
    // Suối bắt nguồn từ Đông Bắc chảy uốn lượn xuống lòng hồ
    for (let y = 8; y <= 22; y++) {
      const centerX = 35 + Math.sin(y * 0.35) * 4;
      const width = y < 14 ? 3.2 : 5.2;
      for (let x = 0; x < info.w; x++) {
        if (Math.abs(x - centerX) <= width) {
          ground[y][x] = TILE.WATER;
          solid[y][x] = true;
          cv.water.push([x, y]);
        }
      }
    }

    // 3. Vùng 2: Đầm Sen Trăng Cổ Tích (Bờ Tây x: 3..18, y: 12..32)
    // Đường bờ vịnh uốn lượn hình trăng khuyết mềm mại tự nhiên
    for (let y = 12; y <= 32; y++) {
      const cy = 22;
      const dy = (y - cy) / 9.5;
      const wave = Math.sin(y * 0.45) * 1.5;
      if (Math.abs(dy) <= 1.05) {
        const span = Math.sqrt(Math.max(0, 1 - dy * dy * 0.85));
        const minX = Math.max(3, Math.floor(11.5 - span * 7.5));
        const maxX = Math.min(18, Math.ceil(11.5 + span * 6.5 + wave));
        for (let x = minX; x <= maxX; x++) {
          ground[y][x] = TILE.WATER;
          solid[y][x] = true;
          cv.water.push([x, y]);
        }
      }
    }
    reserve(2, 11, 23, 33);

    // 4. Vùng 3: Lòng Hồ Nước Ngọt & Vực Thẳm (y: 20..36, x: 23..46)
    for (let y = 20; y <= 36; y++) {
      const centerX = 34 + Math.sin(y * 0.3) * 2.5;
      const radiusX = 10.5 + Math.sin(y * 0.25) * 2.2;
      for (let x = 0; x < info.w; x++) {
        if (Math.abs(x - centerX) <= radiusX) {
          ground[y][x] = y >= 28 ? TILE.WATER2 : TILE.WATER;
          solid[y][x] = true;
          cv.water.push([x, y]);
        }
      }
    }

    // Kênh nước nối Đầm Sen và Lòng Hồ phía Nam (y: 31..34, x: 16..24) để Cầu Đá Vòm Nam Hồ bắc qua
    for (let y = 31; y <= 34; y++) {
      for (let x = 16; x <= 24; x++) {
        ground[y][x] = TILE.WATER2;
        solid[y][x] = true;
        cv.water.push([x, y]);
      }
    }

    // Bán Đảo Trung Tâm nối từ Làng Chài xuống giữa hồ (x: 19..22, y: 8..30) & Bờ Nam (x: 14..23, y: 35..37)
    fill(19, 8, 22, 30, TILE.GRASS);
    path(20, 7, 21, 30, TILE.PATH);
    fill(14, 35, 23, 37, TILE.GRASS);
    path(19, 35, 21, 37, TILE.PATH);
    reserve(18, 8, 23, 37);

    // Đảo Ngọc Giữa Hồ (y: 26..30, x: 29..36)
    for (let y = 26; y <= 30; y++) {
      for (let x = 29; x <= 36; x++) {
        const dx = (x - 32.5) / 3.5;
        const dy = (y - 28) / 2.1;
        if (dx * dx + dy * dy <= 1.05) {
          ground[y][x] = TILE.GRASS;
          solid[y][x] = false;
        }
      }
    }
    fill(29, 27, 31, 29, TILE.GRASS); // Mở rộng mũi đảo phía Tây đón Cầu Đá Vòm
    placeL('tree', 32, 26);
    placeL('sakura', 34, 28);
    placeL('bench', 32, 29);
    placeL('boulder', 35, 27, true);

    // Bục câu cá vươn ra vực nước sâu phía nam Đảo Ngọc
    fill(31, 30, 34, 33, TILE.DOCK);
    placeL('net_rack', 31, 32);
    placeL('crate', 34, 31);
    placeL('jumpfish', 38, 29);

    // ==================== HỆ THỐNG 4 CẦU ĐÁ VÒM CỔ KÍNH ====================
    // (1) Cầu Đá Vòm Nam Hồ (x: 19..21, y: 30..35) — nối Bán Đảo Trung Tâm thẳng xuống Bến Cảng Nam
    path(19, 30, 21, 35, TILE.STONE);
    placeL('bridge_stone_v', 20, 35, false);

    // (2) Cầu Đá Vòm Đảo Ngọc (x: 22..28, y: 27..29) — nối Bán Đảo Trung Tâm sang Đảo Ngọc Giữa Hồ
    path(22, 27, 28, 29, TILE.STONE);
    placeL('bridge_stone_h', 25, 29, false);

    // (3) Cầu Đá Vòm Sông Quê (x: 32..38, y: 11..13) — bắc qua dòng sông quê nối liền bờ Đông
    path(21, 11, 31, 13, TILE.PATH);
    path(32, 11, 38, 13, TILE.STONE);
    path(39, 11, 48, 13, TILE.PATH);
    placeL('bridge_stone_h', 35, 13, false);
    reserve(21, 10, 49, 14);
    placeL('tree', 46, 8);
    placeL('flower_patch', 45, 14);

    // (4) Cầu Đá Vòm Đầm Sen (x: 11..13, y: 14..19) & Chòi Lá Ngắm Hoa (x: 9..15, y: 20..23)
    path(11, 7, 13, 13, TILE.PATH);
    path(11, 14, 13, 19, TILE.STONE);
    placeL('bridge_stone_v', 12, 19, false);
    fill(9, 20, 15, 23, TILE.DOCK); // Sàn gỗ chòi sen
    // Cầu nối Chòi Sen sang bờ Tây (Đồi Gió) & sang Bán Đảo Trung Tâm (Bờ Đông)
    path(0, 19, 4, 21, TILE.PATH);
    path(4, 20, 8, 21, TILE.DOCK);
    path(16, 20, 19, 21, TILE.DOCK);
    placeL('pavilion', 12, 21);
    placeL('bench', 10, 22);
    placeL('bench', 14, 22);

    // Thảm hoa sen & lá súng rực rỡ khắp đầm (tránh lối cầu)
    for (const [x, y, tex] of [
      [6, 15, 'lotus'], [9, 14, 'lilypad'], [15, 14, 'lotus'], [17, 16, 'lotus'],
      [5, 18, 'lotus'], [8, 18, 'lilypad'], [6, 26, 'lotus'], [10, 27, 'lilypad'],
      [14, 27, 'lotus'], [17, 28, 'lilypad'], [11, 30, 'lotus'], [8, 29, 'lilypad'], [16, 24, 'lotus'],
    ] as [number, number, string][]) {
      placeL(tex, x, y, false);
    }

    // Đàn vịt trời tung tăng bơi lội trong đầm sen
    placeL('duck', 8, 24);
    placeL('duckling', 9, 25);
    placeL('duck', 16, 17);

    // 5. Viền bãi cát sỏi thoai thoải quanh hồ & rặng lau sậy ven bờ
    for (let y = 0; y < info.h; y++) {
      for (let x = 0; x < info.w; x++) {
        const cur = ground[y][x];
        if (
          cur === TILE.WATER ||
          cur === TILE.WATER2 ||
          cur === TILE.DOCK ||
          cur === TILE.PATH ||
          cur === TILE.PLAZA ||
          cur === TILE.STONE
        )
          continue;
        const nearWater = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]].some(([dx, dy]) => {
          const g = ground[y + dy]?.[x + dx];
          return g === TILE.WATER || g === TILE.WATER2;
        });
        if (nearWater) {
          ground[y][x] = TILE.SAND;
          if (!cv.reserved[y][x]) {
            if ((x * 7 + y * 13) % 5 === 0) placeL('reeds', x, y, false);
            else if ((x * 11 + y * 5) % 7 === 0) placeL('tuft', x, y, false);
          }
        }
      }
    }

    // 6. Bến Cảng Nam Viễn Dương (y: 37..41)
    // Bờ kè đá bến cảng (y: 37..38) & Vùng nước cảng biển sâu (y: 39..41)
    path(4, 37, 48, 38, TILE.PLAZA);
    for (let y = 39; y <= 41; y++) {
      for (let x = 1; x < info.w - 1; x++) {
        ground[y][x] = TILE.WATER2;
        solid[y][x] = true;
        cv.water.push([x, y]);
      }
    }
    reserve(1, 37, 50, 41);

    // Cầu cảng gỗ Tây Nam vươn ra mặt nước (x: 7..9, y: 38..41) — Tàu Galleon neo dưới nước sát bên cầu cảng
    fill(7, 38, 9, 41, TILE.DOCK);
    placeL('ship_galleon', 13, 40, true);
    placeL('barrel', 6, 38);
    placeL('crate', 10, 38);

    // Cầu cảng gỗ Đông Nam vươn ra mặt nước (x: 43..45, y: 38..41) — Thuyền Buôn Đông Hải neo dưới nước sát bên cầu cảng
    fill(43, 38, 45, 41, TILE.DOCK);
    placeL('ship_junk', 39, 40, true);
    placeL('barrel', 42, 38);
    placeL('crate', 46, 38);

    // Tàu Buồm lớn viễn dương neo ngoài vực sâu giữa hồ
    placeL('ship_galleon', 40, 32);

    // Thuyền nan & cá nhảy dưới mặt nước hồ
    placeL('boat_row', 26, 21);
    placeL('jumpfish', 16, 27);
  },
  deepsea: (cv) => {
    const { path, reserve, fill, placeL, ground, solid, info } = cv;
    fill(0, 0, info.w - 1, info.h - 1, TILE.SAND);

    // 1. Cổng đón bến tàu từ Lake (Tây Bắc x: 6..12, y: 0..6)
    path(7, 0, 11, 6, TILE.DOCK);
    path(4, 5, 24, 6, TILE.DOCK);
    placeL('barrel', 5, 5);
    placeL('crate', 13, 5);
    reserve(3, 0, 25, 7);

    // 2. Bờ biển nhiệt đới cát vàng mịn (y: 0..12)
    // Hàng dừa rủ bóng mát, vỏ sò, sao biển, cua biển, lều dã ngoại, lửa trại
    for (const [x, y] of [
      [16, 3], [22, 2], [29, 3], [37, 2], [45, 3], [52, 4],
      [18, 8], [27, 7], [35, 8], [43, 7], [50, 9],
    ] as [number, number][]) {
      placeL('palm', x, y, true);
    }

    // Khu dã ngoại ven biển bãi cát
    placeL('tent', 31, 4);
    placeL('campfire', 34, 4);
    placeL('bench', 33, 2);
    placeL('bench', 39, 4);
    placeL('crate', 41, 3);
    placeL('barrel', 42, 4);

    // Chi tiết vỏ sò, sao biển, cua bò trên cát
    for (const [x, y, tex] of [
      [14, 8, 'shell'], [24, 9, 'starfish'], [33, 9, 'crab'], [42, 9, 'shell'],
      [48, 8, 'starfish'], [54, 7, 'crab'], [20, 10, 'shell'], [38, 10, 'starfish'],
    ] as [number, number, string][]) {
      placeL(tex, x, y, false);
    }

    // 3. Đường bờ biển uốn lượn tự nhiên & Vịnh San Hô (Vùng 4: y: 11..24)
    for (let y = 0; y < info.h; y++) {
      for (let x = 0; x < info.w; x++) {
        const shoreline = 10 + Math.sin(x * 0.16) * 2.2 + Math.cos(x * 0.08) * 1.5;
        const deepLine = 23 + Math.sin(x * 0.12) * 2.5;
        if (y >= shoreline && y < deepLine) {
          ground[y][x] = TILE.WATER;
          solid[y][x] = true;
          cv.water.push([x, y]);
        } else if (y >= deepLine) {
          ground[y][x] = TILE.WATER2;
          solid[y][x] = true;
          cv.water.push([x, y]);
        }
      }
    }

    // Cầu cảng gỗ vươn dài từ bờ cát ra giữa vịnh san hô
    path(9, 6, 9, 20, TILE.DOCK);
    fill(7, 19, 25, 21, TILE.DOCK); // Cầu cảng chính đâm ngang vịnh
    path(24, 12, 24, 21, TILE.DOCK);
    fill(22, 12, 26, 14, TILE.DOCK); // Bục câu cá phía đông
    placeL('net_rack', 8, 20);
    placeL('barrel', 14, 20);
    placeL('crate', 18, 20);
    placeL('bench', 12, 19);

    // Rạn san hô ngũ sắc, đá biển & thuyền câu dưới nước
    placeL('boulder', 16, 15, true);
    placeL('boulder', 30, 16, true);
    placeL('boulder', 44, 17, true);
    placeL('boat_row', 19, 15);
    placeL('ship_junk', 5, 18, true);
    placeL('jumpfish', 36, 15);
    placeL('jumpfish', 48, 18);

    // 4. Vùng 5: Vực Biển Sâu Thẳm & Quần Đảo Hải Tặc (y: 24..35)
    // Đảo đá ngầm bí ẩn nhô lên giữa sóng bạc
    for (let y = 25; y <= 29; y++) {
      for (let x = 25; x <= 35; x++) {
        const dx = (x - 30) / 4.5;
        const dy = (y - 27) / 1.8;
        if (dx * dx + dy * dy <= 1) {
          ground[y][x] = TILE.STONE;
          solid[y][x] = false;
          const idx = cv.water.findIndex(([wx, wy]) => wx === x && wy === y);
          if (idx >= 0) cv.water.splice(idx, 1);
        }
      }
    }

    // Cầu gỗ cọc nổi nối từ cầu cảng vịnh ra đảo đá hải tặc
    path(24, 21, 24, 26, TILE.DOCK);
    path(24, 26, 26, 26, TILE.DOCK);
    reserve(24, 24, 36, 30);

    // Tàu Buồm Hải Tặc Cổ Đại neo trên mặt biển sâu cạnh đảo & Mỏm đá câu thủy quái Leviathan
    placeL('ship_galleon', 19, 26, true);
    placeL('dragon_bone', 27, 28, true);
    placeL('boulder', 34, 28, true);
    placeL('crate', 28, 26);
    placeL('barrel', 33, 26);

    // Tàu Buồm lớn viễn dương ngoài khơi sâu
    placeL('ship_galleon', 48, 26, true);

    // Đá biển rải rác ngoài khơi sâu
    placeL('boulder', 12, 31, true);
    placeL('boulder', 46, 30, true);
    placeL('boulder', 53, 32, true);
    placeL('jumpfish', 20, 32);
    placeL('jumpfish', 40, 31);
  },
  glacier: (cv) => {
    const { path, reserve, fill, placeL, ground, solid, info } = cv;
    fill(0, 0, info.w - 1, info.h - 1, TILE.SNOW);

    // 1. Trạm thám hiểm Bắc Cực ở cửa vào phía Bắc (y: 0..8)
    path(17, 0, 21, 6, TILE.STONE);
    path(12, 5, 26, 7, TILE.STONE);
    placeL('tent', 14, 4);
    placeL('campfire', 19, 4);
    placeL('snowman', 24, 4);
    placeL('crate', 13, 6);
    placeL('barrel', 25, 6);
    reserve(10, 0, 28, 8);

    // 2. Rừng thông tuyết & Vách núi đá tuyết hai bên hẻm núi (x: 0..8 và x: 29..37)
    for (let y = 3; y < info.h; y += 4) {
      const xLeft = 2 + (y % 3);
      const xRight = info.w - 3 - ((y + 1) % 3);
      placeL('snow_pine', xLeft, y, true);
      placeL('snow_pine', xRight, y, true);
      if (y % 6 === 0) {
        placeL('rock_snow', xLeft + 2, y + 1, true);
        placeL('rock_snow', xRight - 2, y + 1, true);
      }
    }

    // 3. Vùng 6: Dòng Sông Băng Bắt Nguồn & Hẻm Núi Băng Tuyết (y: 8..38)
    // Dòng sông băng nứt nẻ uốn lượn mềm mại dọc hẻm núi
    for (let y = 8; y <= 38; y++) {
      const canyonCenter = 19 + Math.sin(y * 0.16) * 3;
      const iceRadius = 7.5 + Math.sin(y * 0.12) * 2;
      for (let x = 0; x < info.w; x++) {
        const dist = Math.abs(x - canyonCenter);
        if (dist <= iceRadius) {
          ground[y][x] = (x + y) % 2 === 0 ? TILE.ICE : TILE.ICE2;
          solid[y][x] = false;
        }
      }
    }

    // Cầu gỗ tuyết men dọc theo sông băng
    path(19, 7, 19, 24, TILE.DOCK);
    fill(16, 17, 22, 19, TILE.DOCK); // Trạm nghỉ chân giữa dòng sông băng
    placeL('ice_crystal', 13, 14, true);
    placeL('ice_crystal', 25, 15, true);
    placeL('rock_snow', 14, 22, true);
    placeL('rock_snow', 24, 23, true);
    placeL('snowman', 21, 18);

    // 4. Vực Băng Vĩnh Cửu & Đầm Nước Băng Cổ Xưa (y: 38..53)
    // Đầm nước băng thăm thẳm ngàn trượng không bao giờ đóng băng
    for (let y = 39; y <= 49; y++) {
      for (let x = 11; x <= 27; x++) {
        const dx = (x - 19) / 7.5;
        const dy = (y - 44) / 4.8;
        if (dx * dx + dy * dy <= 1) {
          ground[y][x] = TILE.WATER;
          solid[y][x] = true;
          cv.water.push([x, y]);
        }
      }
    }

    // Cầu gỗ kiên cố dẫn ra đài buông cần câu Băng Long Thần Ngư
    path(19, 24, 19, 39, TILE.DOCK);
    fill(17, 39, 21, 42, TILE.DOCK); // Bục câu cá giữa hồ băng
    placeL('ice_crystal', 9, 41, true);
    placeL('ice_crystal', 29, 41, true);
    placeL('ice_crystal', 11, 48, true);
    placeL('ice_crystal', 27, 48, true);
    placeL('ice_crystal', 19, 52, true);
    placeL('rock_snow', 14, 51, true);
    placeL('rock_snow', 24, 51, true);
    placeL('net_rack', 17, 41);
    placeL('crate', 21, 41);

    // Tàu thám hiểm phá băng bọc thép Bắc Cực neo giữa đầm nước băng
    placeL('ship_steamer', 23, 46, true);
  },
  windhill: (cv) => {
    const { path, reserve, place, placeL, ground } = cv;
    // 1. Toàn bộ đỉnh đồi cao ráo phủ TILE.HILL
    for (let y = 3; y <= 32; y++) {
      for (let x = 4; x <= 44; x++) {
        const dx = (x - 24) / 19;
        const dy = (y - 18) / 13;
        if (dx * dx + dy * dy <= 1) {
          ground[y][x] = TILE.HILL;
        }
      }
    }
    // Lối mòn lên đỉnh đồi: Đông nối Lake, Bắc nối Town
    path(22, 0, 26, 6, TILE.PATH);
    path(22, 6, 26, 18, TILE.PATH);
    path(26, 17, 47, 19, TILE.PATH);
    reserve(14, 10, 28, 20);

    // Tiệm Diều & Bục đón gió thả diều
    place('flowerbed', 15, 16);
    place('flowerbed', 21, 16);
    place('bench', 22, 19);
    place('bench', 26, 19);

    // Thảm hoa dại & cây cối rực rỡ khắp ngọn đồi
    for (const [x, y] of [
      [8, 8], [12, 10], [36, 9], [40, 12], [9, 24], [14, 27], [34, 26], [39, 23],
    ] as [number, number][]) {
      placeL('flower_patch', x, y, false);
      placeL('tuft', x + 1, y, false);
    }
    placeL('sakura', 10, 14);
    placeL('sakura', 38, 15);
    placeL('tree', 30, 8);
    placeL('tree', 18, 26);
    placeL('scarecrow', 32, 22);
  },
};

const LAKE_LIFE: Partial<Record<TownMapId, LakeLife>> = {
  lake: {
    moored: [
      { x: 30, y: 10 }, // Dưới nước sông sát Bến Làng Chài Ông Năm
      { x: 35.5, y: 32 }, // Dưới mặt hồ sát bục câu phía nam Đảo Ngọc
      { x: 16, y: 22.5 }, // Dưới mặt đầm sen sát Chòi Lá
    ],
    routes: [
      { tex: 'boat_row', pts: [[26, 20], [28, 24], [32, 23], [28, 19]], loop: true, ms: 30000 },
      { tex: 'boat_sail', pts: [[38, 22], [42, 28], [38, 34], [36, 26]], loop: true, ms: 42000 },
      { tex: 'duck', trail: 'duckling', n: 2, pts: [[25, 32], [28, 34], [25, 35], [23, 33]], loop: false, ms: 25000 },
    ],
  },
  deepsea: {
    moored: [
      { x: 11, y: 22.2 }, // Dưới nước sát Cầu cảng chính Vịnh San Hô
      { x: 27.5, y: 13.5 }, // Dưới nước sát Bục câu phía đông
    ],
    routes: [
      { tex: 'ship_junk', pts: [[14, 18], [28, 23], [44, 22], [26, 17]], loop: true, ms: 45000 },
    ],
  },
  glacier: {
    moored: [
      { x: 19, y: 43.2 }, // Dưới mặt nước đầm băng sát bục câu Băng Long
    ],
    routes: [],
  },
};

function buildTown(info: MapInfo): Omit<MapData, 'info'> {
  const id = info.id as TownMapId;
  const cv = Object.assign(makeCanvas(info, 2025 + info.ox * 7 + info.oy), { fences: [] as Prop[] });
  const { rnd, ground, solid, reserved, w, h, ox, oy } = { ...cv, w: info.w, h: info.h, ox: info.ox, oy: info.oy };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ground[y][x] = rnd() < 0.75 ? TILE.GRASS : rnd() < 0.85 ? TILE.GRASS2 : TILE.FLOWERS;
    }
  }
  PAINT[id](cv);
  // Loại bỏ các ô nước đã được lát cầu/đất lên trên để sóng nước không đè mất cầu sau 650ms
  cv.water.splice(
    0,
    cv.water.length,
    ...cv.water.filter(([x, y]) => ground[y]?.[x] === TILE.WATER || ground[y]?.[x] === TILE.WATER2),
  );
  const structs = STRUCTURES.filter((s) => s.m === id);
  for (const s of structs) {
    const b = Math.ceil(s.ty + s.th);
    for (let y = b - s.solidRows; y < b; y++) {
      for (let x = s.tx; x < s.tx + s.tw; x++) {
        solid[y - oy][x - ox] = true;
      }
    }
    cv.reserve(s.tx - 1, Math.floor(s.ty) - 1, s.tx + s.tw, b + 1);
  }
  const lamps = LAMPS[id] ?? [];
  for (const [x, y] of lamps) {
    cv.props.push({ tex: 'lamp', x: (x - ox) * T + 8, y: (y - oy) * T + 16 });
    cv.reserve(x, y, x, y);
  }
  const waypoints = WAYPOINTS.filter((s) => s.m === id);
  for (const wp of waypoints) {
    cv.place('waystone', Math.floor(wp.x), Math.floor(wp.y - 1.6));
  }
  border(cv, () => (id === 'glacier' ? 'snow_pine' : id === 'deepsea' ? 'boulder' : 'tree'));
  const waterSet = new Set(cv.water.map(([x, y]) => y * w + x));
  cv.props.splice(0, cv.props.length, ...cv.props.filter((s) => {
    const px = Math.floor(s.x / T);
    const py = Math.floor((s.y - 16) / T);
    return !((px === 0 || py === 0 || px === w - 1 || py === h - 1) && waterSet.has(py * w + px));
  }));
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (reserved[y][x] || solid[y][x]) continue;
      const r = rnd();
      if (id === 'glacier') {
        if (r < 0.03) cv.placeL('snow_pine', x, y);
        else if (r < 0.05) cv.placeL('rock_snow', x, y);
      } else if (id === 'deepsea') {
        if (r < 0.03) cv.placeL('palm', x, y);
        else if (r < 0.05) cv.placeL('boulder', x, y);
      } else {
        if (r < 0.035) cv.placeL('tree', x, y);
        else if (r < 0.045) cv.placeL('bush', x, y);
      }
    }
  }
  const l = (r: Rect): Rect => ({ x0: r.x0 - ox, y0: r.y0 - oy, x1: r.x1 - ox, y1: r.y1 - oy });
  const c = <O extends { x: number; y: number }>(p: O): O => ({ ...p, x: p.x - ox, y: p.y - oy });
  const f = FOUNTAINS[id];
  return {
    ground,
    solid,
    props: cv.props,
    fences: cv.fences,
    water: cv.water,
    lava: cv.lava,
    glows: cv.glows,
    structures: structs.map((s) => ({ ...s, tx: s.tx - ox, ty: s.ty - oy, door: [s.door[0] - ox, s.door[1] - oy] })),
    houses: id === 'town' ? HOUSE_LOTS.map((s) => ({ ...s, tx: s.tx - ox, ty: s.ty - oy, door: [s.door[0] - ox, s.door[1] - oy] })) : [],
    npcs: NPCS.filter((s) => s.m === id).map((s) => ({ ...c(s), talk: s.talk && [s.talk[0] - ox, s.talk[1] - oy] })),
    plots: id === 'farm' ? PLOT_TILES.map(([px, py]) => [px - ox, py - oy]) : [],
    ranchPen: id === 'farm' ? l(RANCH_PEN) : null,
    chickens: id === 'farm' ? l(CHICKEN_YARD) : null,
    kiteSpot: id === 'windhill' ? { x: 24, y: 16 } : null,
    lakeLife: LAKE_LIFE[id] ? { moored: LAKE_LIFE[id]!.moored.map(c), routes: LAKE_LIFE[id]!.routes.map((s) => ({ ...s, pts: s.pts.map(([px, py]) => [px - ox, py - oy]) })) } : undefined,
    privatePond: id === 'town' ? l(PRIVATE_POND) : null,
    fountain: f ? c(f) : null,
    lamps: lamps.map(([x, y]) => [x - ox, y - oy]),
    waypoints: waypoints.map(c),
    signs: SIGNS.filter((s) => s.m === id).map(c),
    exits: exitsOf(info),
    districts: DISTRICTS.filter((s) => s.m === id).map((s) => ({ ...l(s), name: s.name, level: s.level })),
    spawners: [],
  };
}

// ------------------------------------------------------------ vùng quái

function buildZone(info: MapInfo): Omit<MapData, 'info'> {
  const th = ZONE_THEMES[info.zone];
  const cv = makeCanvas(info, 7000 + info.zone * 131);
  const z = paintZone(cv, info.zone, th, () => border(cv, () => th.wall[Math.floor(cv.rnd() * th.wall.length)]));
  return {
    ground: cv.ground, solid: cv.solid, props: cv.props, fences: [], water: cv.water, lava: cv.lava, glows: cv.glows,
    structures: [], houses: [], npcs: [], plots: [], ranchPen: null, chickens: null, kiteSpot: null, privatePond: null, fountain: null, lamps: [],
    waypoints: WAYPOINTS.filter((wp) => wp.m === info.id),
    signs: z.signs,
    exits: exitsOf(info),
    districts: [],
    spawners: z.spawners,
  };
}

/** Dựng 1 bản đồ (chỉ bản đồ đang đứng được dựng) */
export function loadMap(id: MapId): MapData {
  const info = MAPS[id] ?? MAPS.town;
  return { info, ...(info.zone > 0 ? buildZone(info) : buildTown(info)) };
}
