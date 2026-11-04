// Pixel art cần câu & rương quà — dùng chung cho giao diện React (ảnh dataURL) và Phaser (texture)

type Ctx = CanvasRenderingContext2D;

export type RodShape =
  // N:
  | 'bamboo'          // Tre có mắt đốt phình to, uốn lượn tự nhiên
  | 'reed'            // Cỏ sậy uốn mềm duyên dáng
  | 'wood'            // Cần gỗ mộc tròn có đai
  | 'branch'          // Cành thông tự nhiên có tán lá nhỏ
  | 'bronze_pole'     // Cần đồng đai kim loại dày
  | 'curved_willow'   // Cần liễu uốn cong rủ
  | 'clay_vase'       // Cần gốm tráng men bầu tròn
  | 'heavy_wood'      // Cần sồi đầm chắc bọc da
  // R:
  | 'iron_pipe'       // Khớp ống sắt công nghiệp
  | 'sport_light'     // Cần nhôm thể thao mảnh
  | 'flex_fiber'      // Cần sợi thủy tinh uốn dẻo
  | 'bone_spine'      // Đốt xương quái thú gai lởm chởm
  | 'copper_spiral'   // Lò xo xoắn ốc đồng đỏ
  | 'chrome_blade'    // Thép crôm bóng loáng lưỡi kiếm
  | 'coral_branch'    // Cành san hô phân nhánh đỏ
  | 'amber_gem'       // Hổ phách hóa thạch ngọc
  | 'silver_rapier'   // Kiếm liễu quý tộc bạc
  | 'abyss_rock'      // Đá trầm tích góc cạnh
  // SR:
  | 'pro_carbon'      // Vảy carbon đan chéo viền đỏ
  | 'silver_crescent' // Lưỡi liềm ánh trăng bạc
  | 'crystal_prism'   // Tinh thể pha lê gai nhọn 2 bên
  | 'aurora_wave'     // Lụa sóng cực quang chuyển sắc
  | 'royal_sceptre'   // Vương trượng bạch kim nẹp vàng
  | 'amethyst_cluster'// Chùm thạch anh tím lấp lánh
  | 'topaz_spike'     // Mũi giáo Topaz vàng sắc bén
  | 'obsidian_jagged' // Gai obsidian nham thạch nứt nẻ
  | 'emerald_vine'    // Dây leo ngọc bích xoắn ốc
  | 'pearl_sceptre'   // Chuỗi ngọc trai phát sáng
  // SSR:
  | 'golden_emperor'  // Rồng vàng hoàng gia uy phong
  | 'imperial_jade'   // Gậy như ý phỉ thúy vương giả
  | 'ruby_flame'      // Huyết ngọc ngọn lửa ma long
  | 'thunder_bolt'    // Sấm sét zig-zag gãy góc sắc bén
  | 'diamond_regal'   // Kim cương khối vát đa diện vĩnh cửu
  | 'sapphire_trident'// Kích lam ngọc hải uyên sóng trào
  | 'magma_fissure'   // Nham thạch rực lửa nứt nẻ dung nham
  | 'rainbow_ribbon'  // Dải lụa cầu vồng 7 sắc uốn lượn
  | 'sun_glory'       // Mặt trời 8 tia sáng chói lọi
  | 'moon_scythe'     // Lưỡi hái trăng tàn ma mị
  // UR:
  | 'dragon_divine'   // Thần Long uốn lượn ngậm ngọc châu
  | 'phoenix_blaze'   // Chu Tước dang cánh lửa bất tử
  | 'poseidon_trident'// Tam Xoa Kích Poseidon 3 mũi kích vĩ đại
  | 'leviathan_fang'  // Nanh băng bắc cực Leviathan khổng lồ
  | 'kraken_tentacle' // Xúc tu Kraken giác hút tím uốn lượn
  | 'valkyrie_wings'  // Cánh thiên thần Valkyrie & hào quang
  | 'divine_lotus'    // Đài sen cửu phẩm vàng rực 9 cánh
  // MYTHIC:
  | 'genesis_creation'// Trượng Khởi Nguyên ánh sáng tạo hóa sơ khai
  | 'galaxy_orbit'    // Thiên hà Ngân Hà 2 vành đai sao vũ trụ
  | 'chronos_timewheel'// Bánh răng thời gian Chronos & con lắc
  | 'yggdrasil_tree'  // Nhánh Cây Thế Giới Yggdrasil đâm chồi
  | 'singularity_void';// Lỗ Đen Vô Cực đĩa bồi tụ hút năng lượng

export interface RodStyle {
  shape: RodShape;
  shaft: [string, string];
  handle: string;
  handleAccent?: string;
  guardColor?: string;
  reel?: string;
  guide: string;
  nodes?: string;
  tip?: 'dragon' | 'trident' | 'star' | 'gem' | 'diamond' | 'crown' | 'lightning' | 'phoenix' | 'lotus' | 'galaxy' | 'singularity' | 'sun';
  tipColor?: string;
  line: string;
}

export const ROD_SHAPE_INFO: Record<string, { title: string; icon: string }> = {
  // N (8)
  rod_bamboo: { title: 'Đốt Tre Mộc Thôn Quê', icon: '🎋' },
  rod_reed: { title: 'Cỏ Sậy Mảnh Uốn Mềm', icon: '🌾' },
  rod_wood: { title: 'Gỗ Mộc Cổ Điển', icon: '🪵' },
  rod_pine: { title: 'Cành Thông Tự Nhiên', icon: '🌲' },
  rod_bronze_old: { title: 'Đồng Cổ Đai Dày', icon: '🥉' },
  rod_willow: { title: 'Liễu Rủ Cong Duyên Dáng', icon: '🌿' },
  rod_clay: { title: 'Gốm Tráng Men Hoa Văn', icon: '🏺' },
  rod_oak: { title: 'Gỗ Sồi Bọc Da Đầm Chắc', icon: '🪵' },

  // R (10)
  rod_iron: { title: 'Khớp Ống Sắt Cơ Khí', icon: '🔩' },
  rod_alu: { title: 'Nhôm Hàng Không Siêu Nhẹ', icon: '✈️' },
  rod_fiber: { title: 'Sợi Dẻo Uốn Cung Thể Thao', icon: '🏹' },
  rod_bone: { title: 'Gai Xương Sống Quái Thú', icon: '🦴' },
  rod_copper_refined: { title: 'Đồng Đỏ Xoắn Ốc', icon: '🌀' },
  rod_steel: { title: 'Thép Crôm Sáng Bóng', icon: '⚔️' },
  rod_coral: { title: 'San Hô Đỏ Phân Nhánh', icon: '🪸' },
  rod_amber: { title: 'Hổ Phách Hóa Thạch Cổ', icon: '🍯' },
  rod_silver_plain: { title: 'Kiếm Liễu Bạc Quý Tộc', icon: '🗡️' },
  rod_abyss_stone: { title: 'Đá Trầm Tích Sắc Cạnh', icon: '🪨' },

  // SR (10)
  rod_carbon: { title: 'Vảy Carbon Thể Thao Pro', icon: '🏁' },
  rod_silver: { title: 'Lưỡi Liềm Nguyệt Quang Bạc', icon: '🌙' },
  rod_crystal: { title: 'Gai Pha Lê Tinh Thể Lục Lăng', icon: '💠' },
  rod_aurora: { title: 'Dải Lụa Cực Quang Biến Ảo', icon: '🌌' },
  rod_platinum: { title: 'Vương Trượng Bạch Kim Nẹp Vàng', icon: '👑' },
  rod_amethyst: { title: 'Chùm Thạch Anh Tím Tỏa Gai', icon: '🔮' },
  rod_topaz: { title: 'Mũi Giáo Hoàng Ngọc Sắc Lẹm', icon: '🔱' },
  rod_obsidian: { title: 'Hắc Diện Thạch Gai Góc Nứt Lửa', icon: '🌋' },
  rod_emerald_mist: { title: 'Dây Leo Ngọc Bích Xoắn Thần Bí', icon: '🍃' },
  rod_pearl: { title: 'Chuỗi Dạ Minh Châu Phát Sáng', icon: '📿' },

  // SSR (10)
  rod_gold: { title: 'Hoàng Kim Long Phụng Dát Vàng', icon: '✨' },
  rod_jade: { title: 'Như Ý Bích Ngọc Hoàng Gia', icon: '🟢' },
  rod_ruby: { title: 'Huyết Ngọc Hỏa Long Rực Lửa', icon: '🩸' },
  rod_thunder: { title: 'Tia Chớp Sét Zig-Zag Điện Quang', icon: '⚡' },
  rod_diamond: { title: 'Kim Cương Đa Diện Vĩnh Cửu', icon: '💎' },
  rod_sapphire: { title: 'Tam Xoa Kích Lam Ngọc Đại Dương', icon: '🔱' },
  rod_magma: { title: 'Nham Thạch Nứt Nẻ Dung Nham', icon: '🔥' },
  rod_rainbow: { title: 'Dải Lụa Cầu Vồng 7 Sắc Huyền Ảo', icon: '🌈' },
  rod_sun_gold: { title: 'Vành Mặt Trời Thái Dương Tỏa Sáng', icon: '☀️' },
  rod_moon_shadow: { title: 'Lưỡi Hái Nguyệt Ảnh Ma Mị', icon: '🌘' },

  // UR (7)
  rod_dragon: { title: 'Thần Long Cuộn Ngậm Long Châu', icon: '🐉' },
  rod_phoenix: { title: 'Chu Tước Dang Cánh Lửa Bất Tử', icon: '🔥' },
  rod_poseidon: { title: 'Tam Xoa Kích Thần Biển Poseidon', icon: '🔱' },
  rod_leviathan: { title: 'Nanh Băng Bắc Cực Leviathan', icon: '❄️' },
  rod_kraken: { title: 'Xúc Tu Quái Biển Kraken Sống Động', icon: '🐙' },
  rod_valkyrie: { title: 'Cánh Thiên Thần Valkyrie Thánh Quang', icon: '🪽' },
  rod_lotus: { title: 'Đài Sen Cửu Phẩm Vàng Rực Rỡ', icon: '🪷' },

  // MYTHIC (5)
  rod_genesis: { title: 'Trượng Khởi Nguyên Ánh Sáng Tạo Hóa', icon: '✨' },
  rod_galaxy: { title: 'Thiên Hà 2 Vành Đai Sao Vũ Trụ', icon: '🪐' },
  rod_chronos: { title: 'Bánh Răng Thời Gian Chronos Cổ Đại', icon: '⏳' },
  rod_chaos: { title: 'Nhánh Cây Thế Giới Yggdrasil', icon: '🌳' },
  rod_singularity: { title: 'Lỗ Đen Vô Cực Hút Năng Lượng', icon: '🕳️' },
};

export const ROD_STYLE: Record<string, RodStyle> = {
  // N (8)
  rod_bamboo: { shape: 'bamboo', shaft: ['#9ac850', '#76a830'], nodes: '#487020', handle: '#c8a26b', handleAccent: '#8a5a2e', guide: '#e8e0c8', line: '#f4f0e8' },
  rod_reed: { shape: 'reed', shaft: ['#d8e080', '#b0b850'], nodes: '#7a8a30', handle: '#8a5a2e', guide: '#e8e0c8', line: '#f4f0e8' },
  rod_wood: { shape: 'wood', shaft: ['#a8784a', '#8a5a2e'], handle: '#4a2e18', handleAccent: '#d4a373', reel: '#8d8b83', guide: '#c8ccd4', line: '#f4f0e8' },
  rod_pine: { shape: 'branch', shaft: ['#2d6a4f', '#1b4332'], handle: '#402810', handleAccent: '#52b788', guide: '#d8f3dc', line: '#e8f5e9' },
  rod_bronze_old: { shape: 'bronze_pole', shaft: ['#a36a3e', '#7c4d29'], nodes: '#523118', handle: '#3e2413', handleAccent: '#cd7f32', reel: '#b87c48', guide: '#d69e6b', line: '#e0c8b0' },
  rod_willow: { shape: 'curved_willow', shaft: ['#78ab46', '#5b8532'], nodes: '#3f5e20', handle: '#593e22', guide: '#bde099', line: '#ebf7dc' },
  rod_clay: { shape: 'clay_vase', shaft: ['#c97b53', '#9c5432'], handle: '#4a2416', handleAccent: '#f5ebe0', reel: '#df9872', guide: '#f0c4ad', line: '#f7e2d7' },
  rod_oak: { shape: 'heavy_wood', shaft: ['#805633', '#5a3b20'], handle: '#362111', handleAccent: '#c08552', reel: '#9a704a', guide: '#d9be9e', line: '#f5eee6' },

  // R (10)
  rod_iron: { shape: 'iron_pipe', shaft: ['#a9b0ba', '#7d8590'], handle: '#2a2a38', handleAccent: '#94a3b8', reel: '#c8ccd4', guide: '#e8e8f0', line: '#d8f0ff' },
  rod_alu: { shape: 'sport_light', shaft: ['#e0e4ec', '#b0b8c8'], handle: '#1d4ed8', handleAccent: '#60a5fa', reel: '#3b82f6', guide: '#38bdf8', line: '#d8f0ff' },
  rod_fiber: { shape: 'flex_fiber', shaft: ['#7fe0c0', '#4fb8a0'], handle: '#1f4a3e', handleAccent: '#a7f3d0', reel: '#d8f0e8', guide: '#ffffff', line: '#d8fff0' },
  rod_bone: { shape: 'bone_spine', shaft: ['#f8f9fa', '#dee2e6'], handle: '#343a40', handleAccent: '#ced4da', reel: '#ced4da', guide: '#adb5bd', line: '#f1f3f5' },
  rod_copper_refined: { shape: 'copper_spiral', shaft: ['#d97746', '#b05228'], handle: '#3a1a10', handleAccent: '#fb923c', reel: '#e89468', guide: '#fcd3be', line: '#fde8dc', tip: 'star', tipColor: '#fcd3be' },
  rod_steel: { shape: 'chrome_blade', shaft: ['#cbd5e1', '#64748b'], handle: '#0f172a', handleAccent: '#38bdf8', reel: '#94a3b8', guide: '#38bdf8', line: '#e2e8f0' },
  rod_coral: { shape: 'coral_branch', shaft: ['#f87171', '#dc2626'], handle: '#450a0a', handleAccent: '#fca5a5', reel: '#fca5a5', guide: '#fef08a', line: '#fee2e2', tip: 'gem', tipColor: '#f87171' },
  rod_amber: { shape: 'amber_gem', shaft: ['#f59e0b', '#d97706'], handle: '#451a03', handleAccent: '#fef08a', reel: '#fde68a', guide: '#ffffff', line: '#fef3c7', tip: 'gem', tipColor: '#fbbf24' },
  rod_silver_plain: { shape: 'silver_rapier', shaft: ['#f1f5f9', '#cbd5e1'], handle: '#1e293b', handleAccent: '#e2e8f0', reel: '#ffffff', guide: '#94a3b8', line: '#f8fafc' },
  rod_abyss_stone: { shape: 'abyss_rock', shaft: ['#334155', '#1e293b'], handle: '#0f172a', handleAccent: '#475569', reel: '#475569', guide: '#64748b', line: '#cbd5e1', tip: 'gem', tipColor: '#64748b' },

  // SR (10)
  rod_carbon: { shape: 'pro_carbon', shaft: ['#27272a', '#09090b'], handle: '#dc2626', handleAccent: '#ffffff', reel: '#e8e8e8', guide: '#ef4444', line: '#ffe0d8', tip: 'gem', tipColor: '#ef4444' },
  rod_silver: { shape: 'silver_crescent', shaft: ['#f8fafc', '#cbd5e1'], handle: '#334155', handleAccent: '#93c5fd', reel: '#ffffff', guide: '#38bdf8', line: '#e8f8ff', tip: 'star', tipColor: '#ffffff' },
  rod_crystal: { shape: 'crystal_prism', shaft: ['#a5f3fc', '#38bdf8'], handle: '#0284c7', handleAccent: '#ffffff', reel: '#cffafe', guide: '#ffffff', line: '#e0f7fa', tip: 'gem', tipColor: '#67e8f9' },
  rod_aurora: { shape: 'aurora_wave', shaft: ['#c084fc', '#6366f1'], handle: '#3b0764', handleAccent: '#38bdf8', reel: '#e0aaff', guide: '#fbbf24', line: '#ffc6ff', tip: 'star', tipColor: '#fbbf24' },
  rod_platinum: { shape: 'royal_sceptre', shaft: ['#f8fafc', '#94a3b8'], handle: '#0f172a', handleAccent: '#fbbf24', reel: '#ffffff', guide: '#38bdf8', line: '#f8fafc', tip: 'crown', tipColor: '#fbbf24' },
  rod_amethyst: { shape: 'amethyst_cluster', shaft: ['#c084fc', '#7e22ce'], handle: '#3b0764', handleAccent: '#f3e8ff', reel: '#d8b4fe', guide: '#f3e8ff', line: '#fae8ff', tip: 'gem', tipColor: '#c084fc' },
  rod_topaz: { shape: 'topaz_spike', shaft: ['#fbbf24', '#d97706'], handle: '#78350f', handleAccent: '#fef08a', reel: '#fef08a', guide: '#ffffff', line: '#fffbeb', tip: 'gem', tipColor: '#fde047' },
  rod_obsidian: { shape: 'obsidian_jagged', shaft: ['#18181b', '#09090b'], handle: '#450a0a', handleAccent: '#ef4444', reel: '#dc2626', guide: '#f97316', line: '#fef2f2', tip: 'gem', tipColor: '#ef4444' },
  rod_emerald_mist: { shape: 'emerald_vine', shaft: ['#34d399', '#059669'], handle: '#064e3b', handleAccent: '#a7f3d0', reel: '#a7f3d0', guide: '#fef08a', line: '#ecfdf5', tip: 'gem', tipColor: '#6ee7b7' },
  rod_pearl: { shape: 'pearl_sceptre', shaft: ['#fef3c7', '#fde68a'], handle: '#78350f', handleAccent: '#ffffff', reel: '#ffffff', guide: '#93c5fd', line: '#eff6ff', tip: 'star', tipColor: '#ffffff' },

  // SSR (10)
  rod_gold: { shape: 'golden_emperor', shaft: ['#fde047', '#ca8a04'], handle: '#713f12', handleAccent: '#fef08a', guardColor: '#fef08a', reel: '#fff2b0', guide: '#ffffff', line: '#fff6c8', tip: 'crown', tipColor: '#fef08a' },
  rod_jade: { shape: 'imperial_jade', shaft: ['#4ade80', '#15803d'], handle: '#fef08a', handleAccent: '#166534', guardColor: '#ca8a04', reel: '#bbf7d0', guide: '#facc15', line: '#e0ffe8', tip: 'gem', tipColor: '#86efac' },
  rod_ruby: { shape: 'ruby_flame', shaft: ['#ef4444', '#991b1b'], handle: '#1c1917', handleAccent: '#f87171', guardColor: '#dc2626', reel: '#f87171', guide: '#facc15', line: '#ffccd5', tip: 'gem', tipColor: '#ef4444' },
  rod_thunder: { shape: 'thunder_bolt', shaft: ['#facc15', '#f97316'], handle: '#0f172a', handleAccent: '#38bdf8', guardColor: '#06b6d4', reel: '#fef08a', guide: '#22d3ee', line: '#fff3b0', tip: 'lightning', tipColor: '#fde047' },
  rod_diamond: { shape: 'diamond_regal', shaft: ['#e0f2fe', '#38bdf8'], handle: '#0369a1', handleAccent: '#ffffff', guardColor: '#bae6fd', reel: '#ffffff', guide: '#38bdf8', line: '#f0f9ff', tip: 'diamond', tipColor: '#38bdf8' },
  rod_sapphire: { shape: 'sapphire_trident', shaft: ['#3b82f6', '#1d4ed8'], handle: '#0f172a', handleAccent: '#93c5fd', guardColor: '#60a5fa', reel: '#93c5fd', guide: '#60a5fa', line: '#dbeafe', tip: 'trident', tipColor: '#60a5fa' },
  rod_magma: { shape: 'magma_fissure', shaft: ['#ea580c', '#7c2d12'], handle: '#1c1917', handleAccent: '#f97316', guardColor: '#dc2626', reel: '#f97316', guide: '#facc15', line: '#ffedd5', tip: 'gem', tipColor: '#f97316' },
  rod_rainbow: { shape: 'rainbow_ribbon', shaft: ['#ec4899', '#8b5cf6'], handle: '#3b0764', handleAccent: '#06b6d4', guardColor: '#facc15', reel: '#06b6d4', guide: '#facc15', line: '#fdf4ff', tip: 'star', tipColor: '#facc15' },
  rod_sun_gold: { shape: 'sun_glory', shaft: ['#facc15', '#b45309'], handle: '#713f12', handleAccent: '#fef08a', guardColor: '#fde047', reel: '#fef08a', guide: '#ffffff', line: '#fefce8', tip: 'sun', tipColor: '#fef08a' },
  rod_moon_shadow: { shape: 'moon_scythe', shaft: ['#6366f1', '#312e81'], handle: '#0f172a', handleAccent: '#c7d2fe', guardColor: '#818cf8', reel: '#c7d2fe', guide: '#e0e7ff', line: '#eef2ff', tip: 'star', tipColor: '#c7d2fe' },

  // UR (7)
  rod_dragon: { shape: 'dragon_divine', shaft: ['#dc2626', '#7f1d1d'], handle: '#1c1917', handleAccent: '#fde047', guardColor: '#facc15', reel: '#fde047', guide: '#fde047', line: '#fef08a', tip: 'dragon', tipColor: '#dc2626' },
  rod_phoenix: { shape: 'phoenix_blaze', shaft: ['#f43f5e', '#be123c'], handle: '#4c0519', handleAccent: '#fbbf24', guardColor: '#f43f5e', reel: '#fb7185', guide: '#fbbf24', line: '#ffe4e6', tip: 'phoenix', tipColor: '#f43f5e' },
  rod_poseidon: { shape: 'poseidon_trident', shaft: ['#0284c7', '#0369a1'], handle: '#facc15', handleAccent: '#38bdf8', guardColor: '#fde047', reel: '#38bdf8', guide: '#fde047', line: '#e0f2fe', tip: 'trident', tipColor: '#fde047' },
  rod_leviathan: { shape: 'leviathan_fang', shaft: ['#38bdf8', '#0284c7'], handle: '#082f49', handleAccent: '#e0f2fe', guardColor: '#bae6fd', reel: '#bae6fd', guide: '#e0f2fe', line: '#f0f9ff', tip: 'diamond', tipColor: '#e0f2fe' },
  rod_kraken: { shape: 'kraken_tentacle', shaft: ['#8b5cf6', '#4c1d95'], handle: '#2e1065', handleAccent: '#f472b6', guardColor: '#a855f7', reel: '#c4b5fd', guide: '#f472b6', line: '#f5f3ff', tip: 'gem', tipColor: '#a855f7' },
  rod_valkyrie: { shape: 'valkyrie_wings', shaft: ['#fef08a', '#ca8a04'], handle: '#713f12', handleAccent: '#ffffff', guardColor: '#ffffff', reel: '#60a5fa', guide: '#ffffff', line: '#ffffff', tip: 'crown', tipColor: '#fef08a' },
  rod_lotus: { shape: 'divine_lotus', shaft: ['#f472b6', '#be185d'], handle: '#831843', handleAccent: '#fde047', guardColor: '#fde047', reel: '#fde047', guide: '#fde047', line: '#fdf2f8', tip: 'lotus', tipColor: '#fde047' },

  // MYTHIC (5)
  rod_genesis: { shape: 'genesis_creation', shaft: ['#ffd700', '#ff007f'], handle: '#4a0e4e', handleAccent: '#00f5d4', guardColor: '#ffd700', reel: '#00f5d4', guide: '#f72585', line: '#ffffff', tip: 'crown', tipColor: '#00f5d4' },
  rod_galaxy: { shape: 'galaxy_orbit', shaft: ['#818cf8', '#c084fc'], handle: '#1e1b4b', handleAccent: '#38bdf8', guardColor: '#38bdf8', reel: '#38bdf8', guide: '#f43f5e', line: '#ffffff', tip: 'galaxy', tipColor: '#38bdf8' },
  rod_chronos: { shape: 'chronos_timewheel', shaft: ['#fbbf24', '#d97706'], handle: '#451a03', handleAccent: '#67e8f9', guardColor: '#fbbf24', reel: '#67e8f9', guide: '#fef08a', line: '#ecfeff', tip: 'star', tipColor: '#67e8f9' },
  rod_chaos: { shape: 'yggdrasil_tree', shaft: ['#10b981', '#047857'], handle: '#064e3b', handleAccent: '#34d399', guardColor: '#fbbf24', reel: '#fbbf24', guide: '#fef08a', line: '#f0fdf4', tip: 'lotus', tipColor: '#34d399' },
  rod_singularity: { shape: 'singularity_void', shaft: ['#0f172a', '#581c87'], handle: '#020617', handleAccent: '#ec4899', guardColor: '#06b6d4', reel: '#ec4899', guide: '#06b6d4', line: '#ffffff', tip: 'singularity', tipColor: '#06b6d4' },
};

const px = (c: Ctx, x: number, y: number, col: string, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};

function disc(c: Ctx, cx: number, cy: number, r: number, col: string) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(c, x, y, col);
}

function outline(c: Ctx, w: number, h: number, col = '#1a1208') {
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 200;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 200) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
    }
  c.putImageData(new ImageData(out, w, h), 0, 0);
}

function silhouette(c: Ctx, w: number, h: number) {
  const img = c.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 0) {
      img.data[i] = 26;
      img.data[i + 1] = 22;
      img.data[i + 2] = 37;
    }
  }
  c.putImageData(img, 0, 0);
}

function thickLine(
  c: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: (t: number) => number,
  color: (t: number, i: number) => string
) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const w = width(t);
    px(c, x - Math.floor(w / 2), y - Math.floor(w / 2), color(t, i), w, w);
  }
}

/** Vẽ đường cong bậc 2 nối p0 -> p2 với điểm uốn p1 */
function quadCurve(
  c: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: (t: number) => number,
  color: (t: number, i: number) => string
) {
  const n = Math.ceil(Math.hypot(x2 - x0, y2 - y0) * 1.5);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    const w = width(t);
    px(c, x - Math.floor(w / 2), y - Math.floor(w / 2), color(t, i), w, w);
  }
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Vẽ cần câu mỹ thuật độc bản trên lưới S×S */
export function drawRod(c: Ctx, id: string, S: number, withLine = true) {
  const st = ROD_STYLE[id] ?? ROD_STYLE.rod_bamboo;
  const k = S / 32;
  const P = (v: number) => Math.round(v * k);
  const big = S >= 24;
  const shape = st.shape;

  // 1. VẼ CÁN TAY CẦM (HANDLE) & ĐUÔI CÁN (POMMEL)
  const hx0 = P(3), hy0 = P(29), hx1 = P(9), hy1 = P(23);
  thickLine(c, hx0, hy0, hx1, hy1, () => (big ? 3 : 2), (_t, i) => (i % 2 ? st.handle : (st.handleAccent ?? shade(st.handle, -25))));

  // Chuôi cán đặc biệt (Pommel)
  if (big) {
    if (shape === 'royal_sceptre' || shape === 'golden_emperor' || shape === 'genesis_creation') {
      disc(c, hx0 - 1, hy0 + 1, 2.2 * k, '#fbbf24');
      px(c, hx0 - 1, hy0 + 1, '#ffffff');
    } else if (shape === 'bone_spine') {
      px(c, hx0 - 2, hy0, '#dee2e6', 2, 2);
      px(c, hx0, hy0 + 2, '#dee2e6', 2, 2);
    } else if (shape === 'chronos_timewheel') {
      // Con lắc đồng hồ
      thickLine(c, hx0, hy0, hx0 - P(2), hy0 + P(3), () => 1, () => '#fbbf24');
      disc(c, hx0 - P(2), hy0 + P(3), 1.8 * k, '#67e8f9');
    } else if (shape === 'dragon_divine') {
      // Móng vuốt rồng ở chuôi
      px(c, hx0 - 2, hy0, '#facc15', 2, 1);
      px(c, hx0, hy0 + 2, '#facc15', 1, 2);
      disc(c, hx0 - 1, hy0 + 1, 1.8 * k, '#dc2626');
    }
  }

  // 2. CHUÔI BẢO VỆ (GUARD / CROSSGUARD) TẠI (9, 23)
  const gx = hx1, gy = hy1;
  const gc = st.guardColor ?? st.handleAccent ?? '#ffd84a';
  if (big) {
    if (shape === 'valkyrie_wings') {
      // Cánh thiên thần Valkyrie dang rộng 2 bên chuôi
      px(c, gx - P(5), gy + P(1), '#ffffff', P(5), P(2));
      px(c, gx - P(6), gy - P(2), '#ffffff', P(3), P(3));
      px(c, gx - P(3), gy - P(4), '#fef08a', P(2), P(3));
      px(c, gx + P(1), gy + P(4), '#ffffff', P(4), P(2));
    } else if (shape === 'phoenix_blaze') {
      // Cánh phượng hoàng rực lửa
      px(c, gx - P(5), gy - P(1), '#f43f5e', P(4), P(2));
      px(c, gx - P(6), gy - P(3), '#fbbf24', P(3), P(2));
      px(c, gx - P(3), gy - P(5), '#ffedd5', P(2), P(2));
      px(c, gx + P(1), gy + P(3), '#f43f5e', P(3), P(2));
    } else if (shape === 'divine_lotus') {
      // Đóa sen vàng ở chuôi
      disc(c, gx, gy, 2.5 * k, '#fde047');
      px(c, gx - P(3), gy - P(2), '#f472b6', P(2), P(2));
      px(c, gx + P(2), gy + P(2), '#f472b6', P(2), P(2));
    } else if (shape === 'silver_rapier') {
      // Chuôi kiếm liễu uốn cong hình chữ D
      quadCurve(c, gx - P(3), gy + P(3), gx - P(5), gy - P(2), gx + P(1), gy - P(3), () => 1, () => '#cbd5e1');
    } else if (shape === 'dragon_divine') {
      // Đầu rồng nhô ra ở chuôi
      px(c, gx - P(2), gy - P(2), '#facc15', P(4), P(3));
      px(c, gx, gy - P(3), '#dc2626', P(2), P(1));
    } else if (shape === 'golden_emperor' || shape === 'royal_sceptre' || shape === 'diamond_regal') {
      // Nẹp bảo vệ nạm ngọc
      px(c, gx - P(2), gy - P(2), gc, P(4), P(2));
      px(c, gx - P(1), gy - P(1), '#ffffff', P(2), P(1));
    }
  }

  // 3. MÁY CÂU (REEL / ENGINE)
  if (st.reel) {
    const rx = P(11.5), ry = P(25.5);
    if (shape === 'chronos_timewheel' && big) {
      // BÁNH RĂNG THỜI GIAN VĨ ĐẠI
      disc(c, rx, ry, 3.8 * k, '#fbbf24');
      disc(c, rx, ry, 2.2 * k, '#451a03');
      // Răng cưa nhô ra 4 phía
      px(c, rx - P(4), ry, '#fbbf24', P(2), P(1));
      px(c, rx + P(3), ry, '#fbbf24', P(2), P(1));
      px(c, rx, ry - P(4), '#fbbf24', P(1), P(2));
      px(c, rx, ry + P(3), '#fbbf24', P(1), P(2));
      // Kim đồng hồ chỉ giờ
      thickLine(c, rx, ry, rx + P(2), ry - P(2), () => 1, () => '#67e8f9');
      thickLine(c, rx, ry, rx - P(1), ry - P(1), () => 1, () => '#ffffff');
    } else if (shape === 'singularity_void' && big) {
      // ĐĨA BỒI TỤ LỖ ĐEN VÔ CỰC
      disc(c, rx, ry, 4.2 * k, '#a855f7');
      disc(c, rx, ry, 3.0 * k, '#ec4899');
      disc(c, rx, ry, 1.8 * k, '#020617'); // Tâm hắc ám
      px(c, rx - P(4), ry + P(1), '#06b6d4', P(3), P(1));
      px(c, rx + P(2), ry - P(1), '#06b6d4', P(3), P(1));
    } else if (shape === 'galaxy_orbit' && big) {
      // VÒNG XOÁY NGÂN HÀ
      disc(c, rx, ry, 3.2 * k, '#818cf8');
      disc(c, rx, ry, 1.6 * k, '#1e1b4b');
      px(c, rx - P(3), ry - P(1), '#ffffff', 1, 1);
      px(c, rx + P(2), ry + P(1), '#38bdf8', 1, 1);
    } else {
      // Máy câu tiêu chuẩn
      disc(c, rx, ry, big ? 2.6 * k + 0.4 : 1.4, st.reel);
      px(c, rx, ry, shade(st.reel, -60));
      if (big) px(c, rx + P(2), ry + P(2), st.handle, 2, 1);
    }
  }

  // 4. VẼ THÂN CẦN (SHAFT) THEO DÁNG ĐỘC BẢN (SHAPE ARCHETYPE)
  let tipX = P(28);
  let tipY = P(4);

  if (shape === 'thunder_bolt') {
    // === DÁNG 1: TIA CHỚP LÔI ĐIỆN ZIG-ZAG ===
    const pts: [number, number][] = [
      [P(9), P(23)],
      [P(15), P(19)],
      [P(12), P(16)],
      [P(21), P(11)],
      [P(18), P(8)],
      [P(28), P(3)],
    ];
    for (let j = 0; j < pts.length - 1; j++) {
      thickLine(c, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], () => (big ? 2 : 1), () => (j % 2 === 0 ? st.shaft[0] : st.shaft[1]));
    }
    tipX = pts[pts.length - 1][0];
    tipY = pts[pts.length - 1][1];
    // Tia điện nhỏ phóng ra
    if (big) {
      px(c, pts[1][0] + 1, pts[1][1] - 2, '#38bdf8', 2, 1);
      px(c, pts[3][0] - 2, pts[3][1] + 1, '#fde047', 1, 2);
    }
  } else if (shape === 'curved_willow' || shape === 'reed' || shape === 'flex_fiber') {
    // === DÁNG 2: CẦN UỐN CUNG MỀM MẠI ===
    const cx = P(15), cy = P(10);
    quadCurve(
      c, hx1, hy1, cx, cy, P(28), P(6),
      (t) => (t < 0.4 && big ? 2 : 1),
      (t) => (t < 0.5 ? st.shaft[0] : st.shaft[1])
    );
    tipX = P(28);
    tipY = P(6);
    // Lá liễu rủ
    if (shape === 'curved_willow' && big) {
      for (const t of [0.4, 0.7]) {
        const lx = Math.round((1 - t) * (1 - t) * hx1 + 2 * (1 - t) * t * cx + t * t * P(28));
        const ly = Math.round((1 - t) * (1 - t) * hy1 + 2 * (1 - t) * t * cy + t * t * P(6));
        px(c, lx, ly + 2, '#5b8532', 1, 2);
      }
    }
  } else if (shape === 'moon_scythe') {
    // === DÁNG 3: LƯỠI HÁI TRĂNG TÀN ===
    quadCurve(
      c, hx1, hy1, P(17), P(11), P(27), P(5),
      (t) => (t < 0.4 && big ? 2 : 1),
      () => st.shaft[0]
    );
    tipX = P(27);
    tipY = P(5);
    if (big) {
      // Lưỡi hái cong vát
      quadCurve(c, P(27), P(5), P(29), P(1), P(24), P(2), () => 2, () => '#c7d2fe');
      px(c, P(25), P(1), '#ffffff', 2, 1);
    }
  } else if (shape === 'kraken_tentacle') {
    // === DÁNG 4: XÚC TU QUÁI BIỂN CHỮ S ===
    const pts: [number, number][] = [
      [P(9), P(23)],
      [P(14), P(18)],
      [P(18), P(15)],
      [P(22), P(10)],
      [P(27), P(4)],
    ];
    for (let j = 0; j < pts.length - 1; j++) {
      thickLine(c, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], () => (big ? 3 - Math.floor(j * 0.5) : 2), () => st.shaft[j % 2]);
      // Giác hút tím dọc thân
      if (big) px(c, pts[j][0] + 2, pts[j][1] + 1, '#f472b6', 2, 1);
    }
  } else if (shape === 'bone_spine') {
    // === DÁNG 5: CỘT SỐNG GAI XƯƠNG ===
    thickLine(c, hx1, hy1, tipX, tipY, () => 2, () => st.shaft[0]);
    if (big) {
      // Các gai xương chĩa ngang
      for (const t of [0.25, 0.45, 0.65, 0.85]) {
        const sx = Math.round(hx1 + (tipX - hx1) * t);
        const sy = Math.round(hy1 + (tipY - hy1) * t);
        px(c, sx - 2, sy + 1, '#ced4da', 2, 1);
        px(c, sx + 1, sy - 2, '#dee2e6', 1, 2);
      }
    }
  } else if (shape === 'coral_branch') {
    // === DÁNG 6: SAN HÔ ĐỎ PHÂN NHÁNH ===
    thickLine(c, hx1, hy1, tipX, tipY, () => 2, () => st.shaft[0]);
    if (big) {
      // Nhánh trái
      thickLine(c, P(14), P(18), P(11), P(15), () => 1, () => st.shaft[1]);
      disc(c, P(11), P(15), 1.2, '#fca5a5');
      // Nhánh phải
      thickLine(c, P(21), P(11), P(24), P(13), () => 1, () => st.shaft[1]);
      disc(c, P(24), P(13), 1.2, '#fca5a5');
    }
  } else if (shape === 'crystal_prism' || shape === 'amethyst_cluster') {
    // === DÁNG 7: TINH THỂ PHA LÊ GAI NHỌN ===
    thickLine(c, hx1, hy1, tipX, tipY, () => (big ? 3 : 2), (t) => (t < 0.5 ? st.shaft[0] : st.shaft[1]));
    if (big) {
      // Các gai tinh thể mọc 2 bên
      for (const t of [0.3, 0.55, 0.78]) {
        const sx = Math.round(hx1 + (tipX - hx1) * t);
        const sy = Math.round(hy1 + (tipY - hy1) * t);
        px(c, sx - 2, sy - 1, '#ffffff', 2, 2);
        px(c, sx + 1, sy + 2, st.shaft[0], 2, 1);
      }
    }
  } else if (shape === 'magma_fissure' || shape === 'obsidian_jagged') {
    // === DÁNG 8: NHAM THẠCH NỨT NẺ DUNG NHAM ===
    thickLine(c, hx1, hy1, tipX, tipY, () => (big ? 3 : 2), (_t, i) => (i % 3 === 0 ? '#ef4444' : i % 2 === 0 ? '#f97316' : st.shaft[0]));
    if (big) {
      // Đốm lửa tàn tro bay lượn
      px(c, P(16), P(13), '#facc15', 1, 1);
      px(c, P(22), P(8), '#ef4444', 1, 1);
    }
  } else if (shape === 'diamond_regal') {
    // === DÁNG 9: KIM CƯƠNG ĐA DIỆN VĨNH CỬU ===
    thickLine(c, hx1, hy1, tipX, tipY, () => 2, (_t, i) => (i % 2 === 0 ? '#ffffff' : st.shaft[0]));
    if (big) {
      for (const t of [0.3, 0.6, 0.85]) {
        const sx = Math.round(hx1 + (tipX - hx1) * t);
        const sy = Math.round(hy1 + (tipY - hy1) * t);
        px(c, sx - 1, sy - 1, '#ffffff', 2, 2);
        px(c, sx, sy, '#38bdf8', 1, 1);
      }
    }
  } else if (shape === 'dragon_divine') {
    // === DÁNG 10: THẦN LONG UỐN LƯỢN CUỘN CẦN ===
    thickLine(c, hx1, hy1, tipX, tipY, () => 2, () => st.shaft[0]);
    if (big) {
      // Thân rồng vàng cuộn quanh
      for (let t = 0.15; t < 0.85; t += 0.18) {
        const sx = Math.round(hx1 + (tipX - hx1) * t);
        const sy = Math.round(hy1 + (tipY - hy1) * t);
        px(c, sx - 1, sy + 1, '#facc15', 3, 1);
        px(c, sx + 1, sy - 1, '#fde047', 1, 2);
      }
    }
  } else if (shape === 'yggdrasil_tree') {
    // === DÁNG 11: NHÁNH CÂY THẾ GIỚI ===
    thickLine(c, hx1, hy1, tipX, tipY, () => (big ? 3 : 2), () => st.shaft[0]);
    if (big) {
      // Nhánh gỗ rẽ nhánh
      thickLine(c, P(16), P(16), P(19), P(13), () => 1, () => st.shaft[1]);
      px(c, P(19), P(13), '#34d399', 2, 2);
      px(c, P(13), P(18), '#10b981', 2, 1);
    }
  } else if (shape === 'galaxy_orbit') {
    // === DÁNG 12: THIÊN HÀ 2 VÀNH ĐAI SAO ===
    thickLine(c, hx1, hy1, tipX, tipY, () => (big ? 2 : 1), () => st.shaft[0]);
    if (big) {
      // 2 vành đai elip bao quanh cần
      px(c, P(14), P(17), '#38bdf8', 4, 1);
      px(c, P(13), P(18), '#c084fc', 2, 1);
      px(c, P(22), P(9), '#38bdf8', 4, 1);
      px(c, P(21), P(10), '#c084fc', 2, 1);
      // Ngôi sao lấp lánh
      px(c, P(17), P(14), '#ffffff', 1, 1);
    }
  } else if (shape === 'leviathan_fang') {
    // === DÁNG 13: NANH BĂNG LEVIATHAN CONG VÚT & GAI BĂNG ===
    quadCurve(c, hx1, hy1, P(16), P(12), tipX, tipY, (t) => (t < 0.5 && big ? 3 : 2), (t) => (t < 0.5 ? st.shaft[1] : st.shaft[0]));
    if (big) {
      px(c, P(14), P(14), '#ffffff', 2, 3);
      px(c, P(19), P(9), '#e0f2fe', 2, 3);
      px(c, P(24), P(6), '#ffffff', 1, 2);
    }
  } else if (shape === 'aurora_wave' || shape === 'rainbow_ribbon' || shape === 'emerald_vine') {
    // === DÁNG 14: DẢI LỤA CỰC QUANG / CẦU VỒNG / DÂY LEO NGỌC ===
    const colors = shape === 'rainbow_ribbon' ? ['#ef4444', '#facc15', '#10b981', '#38bdf8', '#a855f7', '#ec4899'] : [st.shaft[0], st.shaft[1], st.handleAccent ?? '#ffffff'];
    const n = P(24);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const wave = Math.sin(t * Math.PI * 3) * (big ? 2.2 : 1.2);
      const sx = hx1 + (tipX - hx1) * t + wave;
      const sy = hy1 + (tipY - hy1) * t - wave;
      px(c, sx, sy, colors[i % colors.length], big ? 2 : 1, big ? 2 : 1);
    }
  } else if (shape === 'silver_crescent' || shape === 'imperial_jade') {
    // === DÁNG 15: LƯỠI LIỀM NGUYỆT QUANG / NHƯ Ý BÍCH NGỌC ===
    quadCurve(c, hx1, hy1, P(20), P(16), P(26), P(5), () => (big ? 2 : 1), () => st.shaft[0]);
    if (big) {
      quadCurve(c, P(23), P(8), P(30), P(2), P(25), P(2), () => 2, () => st.handleAccent ?? '#ffffff');
    }
    tipX = P(26);
    tipY = P(5);
  } else if (shape === 'branch') {
    // === DÁNG 16: CÀNH THÔNG RỪNG GIÀ ===
    thickLine(c, hx1, hy1, tipX, tipY, () => (big ? 2 : 1), () => st.shaft[1]);
    if (big) {
      disc(c, P(15), P(15), 2.5 * k, '#2d6a4f');
      disc(c, P(22), P(9), 2.2 * k, '#52b788');
    }
  } else {
    // === DÁNG TIÊU CHUẨN / CẦN CƠ BẢN ===
    thickLine(
      c, hx1, hy1, tipX, tipY,
      (t) => (t < 0.45 && big ? 2 : 1),
      (_t, i) => (st.nodes && i % 5 === 0 ? st.nodes : i % 3 === 0 ? st.shaft[1] : st.shaft[0])
    );
    // Đốt tre phình to
    if (shape === 'bamboo' && big && st.nodes) {
      for (const t of [0.25, 0.5, 0.75]) {
        const sx = Math.round(hx1 + (tipX - hx1) * t);
        const sy = Math.round(hy1 + (tipY - hy1) * t);
        px(c, sx - 1, sy, st.nodes, 3, 1);
      }
    }
  }

  // Khoen dẫn dây (Guide rings)
  if (big) {
    for (const t of [0.35, 0.62, 0.84]) {
      px(c, Math.round(hx1 + (tipX - hx1) * t) + 1, Math.round(hy1 + (tipY - hy1) * t) + 1, st.guide);
    }
  }

  // 5. ĐẦU CẦN ĐẶC BIỆT (HEADPIECE / TIP ORNAMENT)
  const tx = tipX;
  const ty = tipY;
  const tc = st.tipColor ?? '#ffffff';

  if (st.tip === 'dragon' && big) {
    // ĐẦU RỒNG THẦN THOẠI HÁ MIỆNG NGẬM LONG CHÂU
    px(c, tx - 1, ty - 2, '#dc2626', 4, 4);
    px(c, tx + 3, ty - 1, '#facc15', 2, 2);
    px(c, tx - 2, ty - 4, '#fbbf24', 2, 2); // Sừng rồng
    px(c, tx, ty - 5, '#fbbf24', 1, 3);
    px(c, tx + 2, ty + 1, '#ffffff', 2, 2); // Viên long châu
    px(c, tx + 3, ty + 2, '#dc2626', 1, 1);
  } else if (st.tip === 'trident' && big) {
    // TAM XOA KÍCH HẢI THẦN POSEIDON (3 MŨI KÍCH VĨ ĐẠI)
    px(c, tx - 3, ty - 1, tc, 7, 1); // Thanh ngang kích
    px(c, tx - 3, ty - 4, tc, 1, 3); // Mũi kích trái
    px(c, tx - 4, ty - 5, tc, 2, 1);
    px(c, tx, ty - 6, tc, 1, 5);      // Mũi kích giữa vươn cao
    px(c, tx, ty - 7, '#ffffff', 1, 1);
    px(c, tx + 3, ty - 4, tc, 1, 3); // Mũi kích phải
    px(c, tx + 3, ty - 5, tc, 2, 1);
    disc(c, tx + 0.5, ty + 0.5, 1.5, '#38bdf8'); // Ngọc đại dương
  } else if (st.tip === 'diamond' && big) {
    // ĐẠI KIM CƯƠNG VƯƠNG GIẢ ĐA DIỆN
    px(c, tx - 2, ty - 3, tc, 5, 2);
    px(c, tx - 1, ty - 1, tc, 3, 2);
    px(c, tx, ty + 1, tc, 1, 1);
    px(c, tx - 1, ty - 2, '#ffffff', 2, 1);
    px(c, tx + 2, ty - 4, '#ffffff', 1, 1); // Tia lấp lánh
    px(c, tx - 3, ty - 1, '#ffffff', 1, 1);
  } else if (st.tip === 'crown' && big) {
    // VƯƠNG MIỆN HOÀNG GIA / THÁNH QUANG
    px(c, tx - 2, ty - 3, tc, 1, 3);
    px(c, tx, ty - 4, tc, 1, 4);
    px(c, tx + 2, ty - 3, tc, 1, 3);
    px(c, tx - 2, ty, '#ffd700', 5, 1);
    px(c, tx, ty - 1, '#ff0055', 1, 1);
    if (shape === 'valkyrie_wings') {
      // Hào quang thiên thần Halo bay lơ lửng phía trên
      disc(c, tx + 0.5, ty - 6, 2.0 * k, '#fef08a');
      disc(c, tx + 0.5, ty - 6, 1.0 * k, '#000000'); // Khoét rỗng thành vòng nhẫn
    }
  } else if (st.tip === 'lightning' && big) {
    // ĐỈNH SẤM SÉT CHỚP ĐIỆN
    px(c, tx - 1, ty - 4, tc, 2, 2);
    px(c, tx, ty - 2, tc, 2, 2);
    px(c, tx - 1, ty, tc, 2, 2);
    px(c, tx + 1, ty - 2, '#ffffff', 1, 1);
  } else if (st.tip === 'phoenix' && big) {
    // CHU TƯỚC HỎA DIỄM
    px(c, tx - 3, ty - 3, tc, 2, 2);
    px(c, tx + 2, ty - 3, tc, 2, 2);
    px(c, tx - 1, ty - 2, '#fbbf24', 3, 3);
    px(c, tx, ty - 5, '#ffffff', 1, 3);
  } else if (st.tip === 'lotus' && big) {
    // CỬU PHẨM KIM LIÊN 9 CÁNH NỞ RỘ
    px(c, tx - 3, ty - 2, tc, 7, 2);
    px(c, tx - 2, ty - 4, tc, 5, 2);
    px(c, tx, ty - 6, '#ffffff', 1, 2);
    px(c, tx - 1, ty - 1, '#fef08a', 3, 1);
  } else if (st.tip === 'galaxy' && big) {
    // THIÊN HÀ NGÂN HÀ QUAY QUANH
    disc(c, tx + 0.5, ty + 0.5, 2.5, tc);
    px(c, tx - 4, ty, '#00f5d4', 9, 1);
    px(c, tx, ty - 2, '#ffffff', 1, 1);
  } else if (st.tip === 'singularity' && big) {
    // LỖ ĐEN VÔ CỰC NÉN NĂNG LƯỢNG
    disc(c, tx + 0.5, ty + 0.5, 2.8, '#0f172a');
    px(c, tx - 4, ty, tc, 9, 1);
    px(c, tx, ty - 4, '#ec4899', 1, 9);
    px(c, tx, ty, '#ffffff', 1, 1);
  } else if (st.tip === 'sun' && big) {
    // MẶT TRỜI THÁI DƯƠNG 8 TIA SÁNG
    disc(c, tx + 0.5, ty + 0.5, 2.0, '#f59e0b');
    px(c, tx, ty - 4, '#fde047', 1, 9);
    px(c, tx - 4, ty, '#fde047', 9, 1);
    px(c, tx, ty, '#ffffff', 1, 1);
  } else if (st.tip === 'gem' && big) {
    disc(c, tx + 0.5, ty + 0.5, 1.8, tc);
    px(c, tx, ty, '#ffffff');
  } else if (st.tip === 'star' && big) {
    px(c, tx, ty - 2, tc, 1, 5);
    px(c, tx - 2, ty, tc, 5, 1);
  }

  // 6. VIỀN NỔI PIXEL (OUTLINE)
  outline(c, S, S);

  // 7. DÂY CÂU & LƯỠI CÂU (FISHING LINE & HOOK)
  if (withLine) {
    c.globalAlpha = 0.85;
    const lineX = tx + 1;
    const startY = ty + 2;
    const endY = P(21);
    for (let y = startY; y < endY; y++) {
      px(c, lineX + Math.round(Math.sin((y - startY) / 5) * 0.8), y, st.line);
    }
    c.globalAlpha = 1;
    // Lưỡi câu chữ J sắc nhọn
    const hookColor = shape === 'poseidon_trident' ? '#facc15' : shape === 'dragon_divine' ? '#fde047' : '#c8ccd4';
    px(c, lineX + 1, endY, hookColor, 1, 2);
    px(c, lineX, endY + 2, hookColor, 1, 1);
    px(c, lineX - 1, endY + 1, hookColor, 1, 1);
  }
}

// ---------------------------------------------------------------- rương quà

const CHEST: Record<string, { body: string; dark: string; lid: string; band: string; lock: string; ribbon?: string; spark?: boolean }> = {
  box_wood: { body: '#9a6b3c', dark: '#7a5230', lid: '#b8854c', band: '#6a6660', lock: '#f2c230' },
  box_silver: { body: '#a9b0ba', dark: '#7d8590', lid: '#c8ccd4', band: '#4a4f5a', lock: '#3d8fd6' },
  box_gold: { body: '#f2c230', dark: '#c9971f', lid: '#ffd84a', band: '#a86a1a', lock: '#f06090', ribbon: '#e8402a', spark: true },
  box_mythic: { body: '#4a154b', dark: '#2b0930', lid: '#83288a', band: '#00f5d4', lock: '#ff007f', ribbon: '#f72585', spark: true },
  wbox_iron: { body: '#5a3e2b', dark: '#3e291b', lid: '#7a543a', band: '#8c96a4', lock: '#ffb040' },
  wbox_mythic: { body: '#2a3654', dark: '#1a2238', lid: '#3d517c', band: '#f2c230', lock: '#49e6ff', ribbon: '#9b4dff', spark: true },
  wbox_god: { body: '#6b1426', dark: '#450a16', lid: '#9e1c36', band: '#ffd84a', lock: '#70f8ff', ribbon: '#ff942e', spark: true },
};

export function drawChest(c: Ctx, id: string, open: boolean, S = 32) {
  const s = CHEST[id] ?? CHEST.box_wood;
  const k = S / 32;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x * k), Math.round(y * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
  };
  if (open) {
    // nắp mở ngửa phía sau + ánh sáng tỏa ra
    R(5, 3, 22, 6, shade(s.lid, -30));
    R(5, 3, 22, 1, s.band);
    R(7, 9, 18, 4, '#fff6b0');
    R(10, 8, 12, 2, '#ffffff');
  } else {
    R(4, 8, 24, 6, s.lid);
    R(4, 8, 24, 1, shade(s.lid, 30));
    R(4, 13, 24, 1, s.dark);
  }
  R(4, 14, 24, 14, s.body);
  for (let y = 17; y < 28; y += 4) R(4, y, 24, 1, s.dark);
  R(4, 14, 2, 14, s.band);
  R(26, 14, 2, 14, s.band);
  if (!open) {
    R(4, 8, 2, 6, s.band);
    R(26, 8, 2, 6, s.band);
  }
  if (s.ribbon) {
    R(15, open ? 14 : 8, 3, open ? 14 : 20, s.ribbon);
    if (!open) {
      R(11, 5, 4, 3, s.ribbon);
      R(18, 5, 4, 3, s.ribbon);
    }
  }
  R(14, open ? 14 : 12, 5, 5, s.lock);
  R(15, open ? 15 : 13, 1, 2, '#ffffff');
  if (s.spark) {
    for (const [x, y] of [[2, 4], [29, 10], [1, 20], [30, 24]]) {
      R(x, y - 1, 1, 3, '#fffbe0');
      R(x - 1, y, 3, 1, '#fffbe0');
    }
  }
  outline(c, S, S);
}

// ---------------------------------------------------------------- vũ khí

interface WeaponStyle {
  kind: 'sword' | 'dagger' | 'spear' | 'axe' | 'broad' | 'scythe';
  blade: string;
  edge: string;
  guard: string;
  hilt: string;
  gem?: string;
  aura?: string;
}

export const WEAPON_STYLE: Record<string, WeaponStyle> = {
  // Kiếm thường (N & R)
  wood_sword: { kind: 'sword', blade: '#c8955a', edge: '#e8c088', guard: '#7a5230', hilt: '#5a3a1e' },
  bamboo_sword: { kind: 'sword', blade: '#8fd858', edge: '#d8ffa8', guard: '#5a8a2a', hilt: '#3f5f1e' },
  dagger: { kind: 'dagger', blade: '#d8e0e8', edge: '#ffffff', guard: '#5a5f69', hilt: '#3a2a1a' },
  bronze_sword: { kind: 'sword', blade: '#d89448', edge: '#ffd08a', guard: '#8a5220', hilt: '#4a2a12' },
  iron_sword: { kind: 'sword', blade: '#c0c6d0', edge: '#ffffff', guard: '#7d8590', hilt: '#4a3a2a' },
  steel_broadsword: { kind: 'broad', blade: '#8a94a6', edge: '#e2e8f0', guard: '#475569', hilt: '#1e293b' },
  katana_wind: { kind: 'sword', blade: '#64e8b8', edge: '#e0fff4', guard: '#f2c230', hilt: '#1e4a38', gem: '#ffffff' },
  silver_rapier: { kind: 'sword', blade: '#e8f4ff', edge: '#ffffff', guard: '#fbbf24', hilt: '#1e3a8a', gem: '#60a5fa' },
  spear: { kind: 'spear', blade: '#d8dce4', edge: '#ffffff', guard: '#c8402f', hilt: '#8a5a2e' },
  flame_scimitar: { kind: 'sword', blade: '#f97316', edge: '#fde047', guard: '#b91c1c', hilt: '#451a03', gem: '#fef08a' },
  shadow_katana: { kind: 'sword', blade: '#6d28d9', edge: '#d8b4fe', guard: '#1e1b4b', hilt: '#090d16', gem: '#c084fc' },
  battle_axe: { kind: 'axe', blade: '#a9b0ba', edge: '#ffffff', guard: '#5a5f69', hilt: '#6b4423' },
  // Kiếm hiếm SR
  emerald_spear: { kind: 'spear', blade: '#2ed87a', edge: '#c8ffe0', guard: '#f2c230', hilt: '#1a422a', gem: '#7fe8ff' },
  crystal_sword: { kind: 'sword', blade: '#7fe8ff', edge: '#e0ffff', guard: '#3a8ad8', hilt: '#2a3a5a', gem: '#ffffff' },
  sakura_katana: { kind: 'sword', blade: '#f472b6', edge: '#fce7f3', guard: '#fbbf24', hilt: '#831843', gem: '#ffffff', aura: '#fbcfe8' },
  thunder_blade: { kind: 'broad', blade: '#ffd838', edge: '#ffffd0', guard: '#3d6fd6', hilt: '#1e2848', gem: '#7fe8ff', aura: '#ffe860' },
  frost_blade: { kind: 'broad', blade: '#bfe8ff', edge: '#ffffff', guard: '#7fb8e0', hilt: '#3a5a7a', gem: '#7fe8ff' },
  jade_dragon_sword: { kind: 'broad', blade: '#10b981', edge: '#a7f3d0', guard: '#f59e0b', hilt: '#064e3b', gem: '#fde047', aura: '#6ee7b7' },
  starlight_claymore: { kind: 'broad', blade: '#fde047', edge: '#ffffff', guard: '#6366f1', hilt: '#312e81', gem: '#38bdf8', aura: '#fef08a' },
  golden_paladin_sword: { kind: 'broad', blade: '#f59e0b', edge: '#fef9c3', guard: '#dc2626', hilt: '#78350f', gem: '#ffffff', aura: '#fde047' },
  // Thần kiếm SSR
  void_sword: { kind: 'sword', blade: '#7a3ad0', edge: '#d0a0ff', guard: '#2a1040', hilt: '#1a0a28', gem: '#ff60ff', aura: '#b070ff' },
  demon_muramasa: { kind: 'sword', blade: '#e11d48', edge: '#fda4af', guard: '#18181b', hilt: '#4c0519', gem: '#ff0040', aura: '#fb7185' },
  blood_scythe: { kind: 'scythe', blade: '#e01e44', edge: '#ff90a8', guard: '#3a1020', hilt: '#220812', gem: '#ff2e55', aura: '#ff3860' },
  abyssal_greatsword: { kind: 'broad', blade: '#581c87', edge: '#e879f9', guard: '#0f172a', hilt: '#3b0764', gem: '#f43f5e', aura: '#c084fc' },
  dragon_blade: { kind: 'broad', blade: '#e8402a', edge: '#ffb020', guard: '#f2c230', hilt: '#2a1a14', gem: '#ffe680', aura: '#ff7828' },
  celestial_lotus_sword: { kind: 'sword', blade: '#ec4899', edge: '#fdf2f8', guard: '#fde047', hilt: '#701a75', gem: '#67e8f9', aura: '#f9a8d4' },
  phoenix_glaive: { kind: 'spear', blade: '#ff7b24', edge: '#fff29c', guard: '#e82a2a', hilt: '#4a1610', gem: '#ffe680', aura: '#ffae38' },
  // Chí Tôn Thần Kiếm UR (0.01%)
  holy_sword: { kind: 'broad', blade: '#fff6c8', edge: '#ffffff', guard: '#f2c230', hilt: '#f4ecd0', gem: '#7fe8ff', aura: '#fff6a0' },
  eternal_frost_emperor: { kind: 'broad', blade: '#38bdf8', edge: '#ffffff', guard: '#e0f2fe', hilt: '#0c4a6e', gem: '#fde047', aura: '#7dd3fc' },
  sun_god_saber: { kind: 'broad', blade: '#ff9500', edge: '#ffffd0', guard: '#dc2626', hilt: '#7f1d1d', gem: '#ffffff', aura: '#fde047' },
  galaxy_emperor: { kind: 'broad', blade: '#4ce8ff', edge: '#ffffff', guard: '#ffd84a', hilt: '#24144a', gem: '#ff60d8', aura: '#80f8ff' },
  chaos_origin_blade: { kind: 'broad', blade: '#a855f7', edge: '#ffffff', guard: '#fbbf24', hilt: '#1e1b4b', gem: '#22d3ee', aura: '#e879f9' },
  cosmic_void_reaper: { kind: 'broad', blade: '#f43f5e', edge: '#fff1f2', guard: '#fde047', hilt: '#31102f', gem: '#38bdf8', aura: '#fb7185' },
  immortal_sovereign_sword: { kind: 'broad', blade: '#fde047', edge: '#ffffff', guard: '#ef4444', hilt: '#451a03', gem: '#67e8f9', aura: '#fef08a' },
  // đồ boss
  dream_blade: { kind: 'sword', blade: '#c890ff', edge: '#f0d8ff', guard: '#e8402a', hilt: '#5a2d78', gem: '#ffe680' },
  fenrir_fang: { kind: 'dagger', blade: '#e8e8ff', edge: '#ffffff', guard: '#4a4a8a', hilt: '#2a2a48', gem: '#8a8aff' },
  warlord_axe: { kind: 'axe', blade: '#8ab060', edge: '#d8f0a0', guard: '#c8402f', hilt: '#5a3a1e' },
  blood_fang: { kind: 'dagger', blade: '#c8203a', edge: '#ff8090', guard: '#2a0a14', hilt: '#1a0a0a', gem: '#ff2040' },
  titan_sword: { kind: 'broad', blade: '#d8c890', edge: '#fff3c0', guard: '#8a7a4a', hilt: '#4a3a2a', gem: '#7fe8ff' },
  prism_blade: { kind: 'sword', blade: '#9ff0ff', edge: '#ffffff', guard: '#f06090', hilt: '#3a3a6a', gem: '#f2c230' },
  widow_spear: { kind: 'spear', blade: '#d8b0ff', edge: '#ffffff', guard: '#2a1040', hilt: '#3a1a4a' },
  hellfire_blade: { kind: 'broad', blade: '#ff5a20', edge: '#ffe060', guard: '#2a1414', hilt: '#1a0a0a', gem: '#ff2020', aura: '#ff6a20' },
  dragon_god_blade: { kind: 'broad', blade: '#ffb040', edge: '#fff6c8', guard: '#e8402a', hilt: '#2a1a14', gem: '#7fe8ff', aura: '#ffd040' },
};

/** Vẽ vũ khí chéo từ chuôi (dưới trái) lên mũi (trên phải) trên lưới S×S */
export function drawWeapon(c: Ctx, id: string, S: number) {
  const st = WEAPON_STYLE[id] ?? WEAPON_STYLE.wood_sword;
  const k = S / 32;
  const P = (v: number) => Math.round(v * k);
  const big = S >= 24;
  if (st.kind === 'spear') {
    thickLine(c, P(3), P(29), P(23), P(9), () => (big ? 2 : 1), (_t, i) => (i % 4 === 0 ? shade(st.hilt, -30) : st.hilt));
    thickLine(c, P(20), P(12), P(23), P(9), () => (big ? 3 : 2), () => st.guard);
    for (let i = 0; i < 7; i++) {
      const w = i < 3 ? i + 1 : 6 - i;
      thickLine(c, P(23 + i * 0.8) - w, P(9 - i * 0.8) - w, P(23 + i * 0.8) + w, P(9 - i * 0.8) + w, () => 1, () => (i === 3 ? st.edge : st.blade));
    }
    if (st.gem && big) px(c, P(21), P(11), st.gem, 2, 2);
  } else if (st.kind === 'scythe') {
    thickLine(c, P(4), P(28), P(24), P(8), () => (big ? 2 : 1), (_t, i) => (i % 3 === 0 ? shade(st.hilt, -30) : st.hilt));
    // lưỡi hái cong vút từ đỉnh cán vòng sang trái-dưới
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const bx = P(24 - t * 14);
      const by = P(8 - Math.sin(t * Math.PI) * 4 + t * 5);
      px(c, bx, by, st.blade, big ? 2 : 1, big ? 3 : 2);
      px(c, bx, by - 1, st.edge, 1, 1);
    }
    disc(c, 23 * k, 9 * k, 2 * k, st.guard);
    if (st.gem && big) px(c, P(23), P(9), st.gem, 1, 1);
  } else if (st.kind === 'axe') {
    thickLine(c, P(4), P(28), P(24), P(8), () => (big ? 2 : 1), (_t, i) => (i % 4 === 0 ? shade(st.hilt, -30) : st.hilt));
    // lưỡi rìu hình bán nguyệt nằm một bên cán, mép ngoài sáng
    const cx = 20 * k;
    const cy = 12 * k;
    const r = 7 * k;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r && x + 0.5 - cx + (y + 0.5 - cy) > 0) px(c, x, y, d > r - 1.3 ? st.edge : st.blade);
      }
    }
    disc(c, cx, cy, 1.6 * k, st.guard);
  } else {
    const len = st.kind === 'dagger' ? 0.55 : 1;
    const wide = st.kind === 'broad' ? 3 : 2;
    // chuôi + núm
    thickLine(c, P(4), P(28), P(9), P(23), () => (big ? 2 : 1), (_t, i) => (i % 2 ? st.hilt : shade(st.hilt, -30)));
    px(c, P(3), P(28), st.guard, big ? 2 : 1, big ? 2 : 1);
    // chắn tay
    thickLine(c, P(6), P(20), P(12), P(26), () => (big ? 2 : 1), () => st.guard);
    if (st.gem && big) px(c, P(9), P(23), st.gem, 1, 1);
    // lưỡi kiếm
    const tx = 10 + 17 * len;
    const ty = 22 - 17 * len;
    thickLine(c, P(10), P(22), P(tx), P(ty), (t) => (t > 0.85 ? 1 : big ? wide : 1), () => st.blade);
    thickLine(c, P(11), P(20), P(tx - 0.5), P(ty + 0.5), () => 1, () => st.edge);
  }
  if (st.aura && big) {
    for (const [ax, ay] of [[14, 8], [26, 16], [8, 14], [22, 4]]) {
      px(c, P(ax), P(ay), st.aura, 1, 1);
    }
  }
  outline(c, S, S);
}

// ---------------------------------------------------------------- GIÁP (32×32)

interface ArmorIconStyle {
  body: string;
  trim: string;
  shoulder: string;
  core: string;
  cape?: string;
  wings?: 'horn' | 'wing' | 'spike' | 'halo';
}

const ARMOR_ICON_STYLE: Record<string, ArmorIconStyle> = {
  cloth: { body: '#2563eb', trim: '#f59e0b', shoulder: '#3b82f6', core: '#60a5fa' },
  leather: { body: '#78350f', trim: '#d97706', shoulder: '#92400e', core: '#f59e0b', cape: '#451a03' },
  chain: { body: '#475569', trim: '#cbd5e1', shoulder: '#64748b', core: '#38bdf8', cape: '#1e3a8a' },
  shadow_armor: { body: '#1e1b4b', trim: '#a855f7', shoulder: '#312e81', core: '#e879f9', cape: '#0f172a', wings: 'spike' },
  steel: { body: '#64748b', trim: '#fbbf24', shoulder: '#94a3b8', core: '#ef4444', cape: '#991b1b', wings: 'horn' },
  mithril: { body: '#0284c7', trim: '#e0f2fe', shoulder: '#38bdf8', core: '#7dd3fc', cape: '#0c4a6e', wings: 'wing' },
  valkyrie_armor: { body: '#f8fafc', trim: '#fbbf24', shoulder: '#fde047', core: '#38bdf8', cape: '#be123c', wings: 'wing' },
  dragon_armor: { body: '#7f1d1d', trim: '#f59e0b', shoulder: '#b91c1c', core: '#fbbf24', cape: '#450a0a', wings: 'horn' },
  celestial_armor: { body: '#312e81', trim: '#fde047', shoulder: '#c084fc', core: '#67e8f9', cape: '#1e1b4b', wings: 'halo' },
  // Boss armors
  frog_mail: { body: '#15803d', trim: '#86efac', shoulder: '#166534', core: '#4ade80' },
  crab_shell: { body: '#b91c1c', trim: '#fca5a5', shoulder: '#dc2626', core: '#fb923c', wings: 'spike' },
  sand_armor: { body: '#b45309', trim: '#fde047', shoulder: '#d97706', core: '#38bdf8', cape: '#78350f' },
  yeti_fur: { body: '#0284c7', trim: '#f1f5f9', shoulder: '#e2e8f0', core: '#38bdf8', cape: '#075985', wings: 'horn' },
  ogre_plate: { body: '#3f3f46', trim: '#f97316', shoulder: '#52525b', core: '#ef4444', cape: '#27272a', wings: 'spike' },
  abyss_armor: { body: '#3b0764', trim: '#c084fc', shoulder: '#581c87', core: '#f43f5e', cape: '#090d16', wings: 'horn' },
};

export function drawArmorIcon(c: Ctx, id: string, S = 32) {
  const st = ARMOR_ICON_STYLE[id] ?? ARMOR_ICON_STYLE.cloth;
  const bodyDark = shade(st.body, -35);
  const bodyLight = shade(st.body, 28);
  const shDark = shade(st.shoulder, -30);

  // Áo choàng phía sau (nếu có)
  if (st.cape) {
    px(c, 6, 8, st.cape, 20, 21);
    px(c, 5, 13, shade(st.cape, -25), 22, 16);
    px(c, 7, 27, st.trim, 18, 1);
  }

  // Cánh / Sừng / Gai vai (cho giáp cấp cao)
  if (st.wings === 'horn') {
    px(c, 2, 5, st.trim, 3, 2);
    px(c, 1, 3, '#fef08a', 2, 3);
    px(c, 27, 5, st.trim, 3, 2);
    px(c, 29, 3, '#fef08a', 2, 3);
  } else if (st.wings === 'wing') {
    px(c, 1, 5, '#f8fafc', 4, 3);
    px(c, 2, 3, st.trim, 3, 2);
    px(c, 27, 5, '#f8fafc', 4, 3);
    px(c, 27, 3, st.trim, 3, 2);
  } else if (st.wings === 'spike') {
    px(c, 2, 6, st.trim, 3, 2);
    px(c, 1, 4, st.core, 2, 2);
    px(c, 27, 6, st.trim, 3, 2);
    px(c, 29, 4, st.core, 2, 2);
  } else if (st.wings === 'halo') {
    px(c, 10, 2, '#fde047', 12, 2);
    px(c, 8, 3, '#fef08a', 2, 1);
    px(c, 22, 3, '#fef08a', 2, 1);
    px(c, 1, 4, '#e0f2fe', 5, 4);
    px(c, 26, 4, '#e0f2fe', 5, 4);
    px(c, 2, 2, '#fde047', 3, 2);
    px(c, 27, 2, '#fde047', 3, 2);
  }

  // Cầu vai (Pauldrons) 2 bên
  px(c, 3, 8, st.shoulder, 7, 6);
  px(c, 3, 12, shDark, 7, 2);
  px(c, 3, 8, st.trim, 7, 1);
  px(c, 4, 10, st.core, 2, 2);

  px(c, 22, 8, st.shoulder, 7, 6);
  px(c, 22, 12, shDark, 7, 2);
  px(c, 22, 8, st.trim, 7, 1);
  px(c, 26, 10, st.core, 2, 2);

  // Thân giáp ngực (Breastplate)
  px(c, 9, 8, st.body, 14, 13);
  px(c, 10, 9, bodyLight, 5, 5);
  px(c, 9, 18, bodyDark, 14, 3);

  // Cổ giáp chữ V + viền ngực
  px(c, 12, 7, st.trim, 8, 2);
  px(c, 13, 8, '#0f172a', 6, 2);
  px(c, 9, 13, st.trim, 14, 1);
  px(c, 15, 9, st.trim, 2, 12);

  // Lõi năng lượng / Ngọc trung tâm ngực
  px(c, 13, 11, st.trim, 6, 6);
  px(c, 14, 12, st.core, 4, 4);
  px(c, 14, 12, '#ffffff', 2, 2);

  // Đai lưng (Belt) & Giáp hông (Tassets)
  px(c, 8, 20, st.trim, 16, 2);
  px(c, 14, 19, '#fef08a', 4, 3);
  px(c, 8, 22, st.shoulder, 5, 5);
  px(c, 19, 22, st.shoulder, 5, 5);
  px(c, 13, 22, bodyDark, 6, 6);
  px(c, 14, 23, st.core, 4, 4);

  outline(c, S, S);
}

// ---------------------------------------------------------------- PHỤ KIỆN (32×32)

export function drawAccessoryIcon(c: Ctx, id: string, S = 32) {
  if (id === 'lantern' || id === 'magma_core') {
    const coreCol = id === 'magma_core' ? '#ef4444' : '#fde047';
    const frameCol = id === 'magma_core' ? '#7f1d1d' : '#b45309';
    px(c, 13, 4, '#fbbf24', 6, 2);
    px(c, 10, 7, frameCol, 12, 3);
    px(c, 11, 10, '#1e293b', 10, 13);
    px(c, 12, 11, coreCol, 8, 11);
    px(c, 14, 13, '#ffffff', 4, 6);
    px(c, 9, 23, frameCol, 14, 3);
  } else if (id === 'boots') {
    // Chiến hài có cánh
    px(c, 11, 7, '#1d4ed8', 9, 12);
    px(c, 12, 8, '#3b82f6', 4, 10);
    px(c, 7, 18, '#1e40af', 15, 7);
    px(c, 6, 24, '#f59e0b', 17, 2);
    // Cánh trắng vàng bên hông giày
    px(c, 20, 8, '#f8fafc', 6, 4);
    px(c, 22, 6, '#fde047', 5, 3);
    px(c, 11, 7, '#fbbf24', 9, 2);
  } else if (id === 'ring_life' || id === 'slime_crown') {
    // Nhẫn / Vương miện ngọc lục bảo
    disc(c, 16, 18, 8, '#fbbf24');
    disc(c, 16, 18, 4.5, '#0f172a');
    px(c, 12, 6, '#10b981', 8, 6);
    px(c, 13, 7, '#6ee7b7', 4, 3);
    px(c, 14, 8, '#ffffff', 2, 2);
  } else if (id === 'amulet' || id === 'lich_amulet' || id === 'frost_heart' || id === 'banshee_veil') {
    const gem = id === 'frost_heart' ? '#38bdf8' : id === 'lich_amulet' ? '#a855f7' : '#ec4899';
    // Dây chuyền vàng + mặt hộ phù cổ ngữ
    px(c, 9, 5, '#fbbf24', 2, 8);
    px(c, 21, 5, '#fbbf24', 2, 8);
    px(c, 11, 12, '#f59e0b', 10, 2);
    px(c, 10, 14, '#fde047', 12, 12);
    px(c, 12, 16, gem, 8, 8);
    px(c, 13, 17, '#ffffff', 3, 3);
  } else {
    // Phoenix / Vũ linh phượng hoàng
    px(c, 6, 9, '#dc2626', 6, 10);
    px(c, 20, 9, '#dc2626', 6, 10);
    px(c, 4, 6, '#f97316', 5, 6);
    px(c, 23, 6, '#f97316', 5, 6);
    px(c, 12, 8, '#fbbf24', 8, 15);
    px(c, 14, 5, '#fef08a', 4, 5);
    px(c, 14, 12, '#ffffff', 4, 6);
    px(c, 11, 23, '#ef4444', 10, 4);
  }
  outline(c, S, S);
}

// ---------------------------------------------------------------- ảnh cho giao diện React

const cache = new Map<string, string>();

function toURL(key: string, S: number, draw: (c: Ctx) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  draw(c);
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}

export const rodIconURL = (id: string, locked = false) =>
  toURL(`rod:${id}:${locked}`, 40, (c) => {
    drawRod(c, id, 40);
    if (locked) silhouette(c, 40, 40);
  });

export const weaponIconURL = (id: string, locked = false) =>
  toURL(`wep:${id}:${locked}`, 32, (c) => {
    drawWeapon(c, id, 32);
    if (locked) silhouette(c, 32, 32);
  });

export const armorIconURL = (id: string) => toURL(`arm:${id}`, 32, (c) => drawArmorIcon(c, id, 32));

export const accessoryIconURL = (id: string) => toURL(`acc:${id}`, 32, (c) => drawAccessoryIcon(c, id, 32));

export const equipIconURL = (id: string, slot: 'weapon' | 'armor' | 'accessory') => {
  if (slot === 'weapon') return weaponIconURL(id);
  if (slot === 'armor') return armorIconURL(id);
  return accessoryIconURL(id);
};

export const chestURL = (id: string, open = false) => toURL(`chest:${id}:${open}`, 32, (c) => drawChest(c, id, open));
