import type { SeasonId } from './seasons';

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface FishSpeciesDef {
  id: string;
  name: string;
  emoji: string;
  rarity: FishRarity;
  zoneId: number; // 1..6 hoặc 0 nếu có ở mọi vùng
  cm: [number, number]; // [min, max] kích thước (cm)
  basePrice: number; // Giá vàng cơ bản
  gemPrice?: number; // Giá kim cương (nếu là cá cực hiếm / mythic)
  difficulty: number; // 0..1 độ khó câu
  nightOnly?: boolean;
  rainOnly?: boolean;
  season?: SeasonId; // Mùa xuất hiện độc quyền
  isSuperRare?: boolean; // Cá cực hiếm 0.00001%
  titleReward?: string; // Danh hiệu mở khóa khi câu được
  desc: string;
}

export interface FishingZoneDef {
  id: number;
  name: string;
  sub: string;
  emoji: string;
  color: string;
  desc: string;
  recommendedRodLevel: number;
  bounds: { x0: number; y0: number; x1: number; y1: number };
  superRareFishId: string;
}

export const FISHING_ZONES: FishingZoneDef[] = [
  {
    id: 1,
    name: 'Bờ Hồ Bình Minh',
    sub: 'Vùng Nước Nông Ven Bến · Bình Yên',
    emoji: '🌾',
    color: '#10b981',
    desc: 'Mặt nước trong vắt phẳng lặng sát bến đò và tiệm câu cá, rải rác hoa súng và bèo tấm.',
    recommendedRodLevel: 1,
    bounds: { x0: 22, y0: 56, x1: 48, y1: 67 },
    superRareFishId: 'fish_carp_god',
  },
  {
    id: 2,
    name: 'Đầm Sen Cổ Thụ',
    sub: 'Thánh Địa Sen Hồng · Thanh Tịnh',
    emoji: '🌸',
    color: '#ec4899',
    desc: 'Mặt nước ngát hương sen cổ thụ ngàn năm bạt ngàn, dòng nước thanh tịnh tụ hội linh khí trời đất.',
    recommendedRodLevel: 2,
    bounds: { x0: 0, y0: 62, x1: 22, y1: 83 },
    superRareFishId: 'fish_lotus_spirit',
  },
  {
    id: 3,
    name: 'Vực Thẳm Lòng Hồ',
    sub: 'Vực Nước Sâu Thăm Thẳm · Cuồng Phong',
    emoji: '🌊',
    color: '#3b82f6',
    desc: 'Vùng nước sâu thẳm đen nhánh bao quanh đảo đá giữa hồ, nơi trú ngụ của những sinh vật khổng lồ.',
    recommendedRodLevel: 3,
    bounds: { x0: 23, y0: 68, x1: 44, y1: 80 },
    superRareFishId: 'fish_leviathan',
  },
  {
    id: 4,
    name: 'Đầm Sương Đom Đóm',
    sub: 'Nhánh Sông Nam · Dạ Minh Huyền Ảo',
    emoji: '🌙',
    color: '#8b5cf6',
    desc: 'Nhánh sông uốn lượn phủ sương khói tím biếc, muôn vàn đom đóm dạ quang lấp lánh như bầu trời sao.',
    recommendedRodLevel: 4,
    bounds: { x0: 38, y0: 76, x1: 63, y1: 83 },
    superRareFishId: 'fish_lunar_ancient',
  },
  {
    id: 5,
    name: 'Vịnh Biển San Hô',
    sub: 'Bãi Cát Vàng Nhiệt Đới · Rạn San Hô',
    emoji: '🏝️',
    color: '#06b6d4',
    desc: 'Bãi cát vàng rực nắng, rạn san hô ngũ sắc dập dềnh bọt sóng biển và bóng dừa nghiêng.',
    recommendedRodLevel: 4,
    bounds: { x0: 49, y0: 64, x1: 63, y1: 75 },
    superRareFishId: 'fish_kirin_sea',
  },
  {
    id: 6,
    name: 'Thác Băng Cực Phong',
    sub: 'Cửa Thác Băng Giá · Sương Tuyết Vĩnh Cửu',
    emoji: '❄️',
    color: '#0ea5e9',
    desc: 'Dòng thác ngầm lạnh giá đổ từ vách đá kết băng, hoa tuyết li ti bay trong làn sương mù ảo diệu.',
    recommendedRodLevel: 5,
    bounds: { x0: 49, y0: 56, x1: 63, y1: 63 },
    superRareFishId: 'fish_frostwyrm',
  },
];

export const ZONE_BY_ID = Object.fromEntries(FISHING_ZONES.map((z) => [z.id, z]));

// Danh sách toàn bộ 120+ loài cá trong thế giới game (bao gồm cá 6 vùng câu, cá 4 mùa độc quyền và cá thần thoại 0.00001%)
export const ALL_FISH_SPECIES: FishSpeciesDef[] = [
  // =========================================================================
  // VÙNG 1: Bờ Hồ Bình Minh (11 loài)
  // =========================================================================
  { id: 'fish_crucian', name: 'Cá diếc', emoji: '🐟', rarity: 'common', zoneId: 1, cm: [8, 25], basePrice: 20, difficulty: 0.15, desc: 'Loài cá nước ngọt phổ biến, thịt ngọt thơm, vảy bạc trắng lấp lánh.' },
  { id: 'fish_perch', name: 'Cá rô đồng', emoji: '🐠', rarity: 'common', zoneId: 1, cm: [10, 30], basePrice: 35, difficulty: 0.25, desc: 'Cá rô đồng vảy đen ánh lục, viền vây cam rực rỡ, quẫy đuôi rất khỏe.' },
  { id: 'fish_gudgeon', name: 'Cá bống cát', emoji: '🐟', rarity: 'common', zoneId: 1, cm: [12, 32], basePrice: 45, difficulty: 0.28, desc: 'Sống sát đáy bùn cát ven bến đò, thích ăn giun và phù du nước trong.' },
  { id: 'fish_grass_carp', name: 'Cá trắm cỏ', emoji: '🐟', rarity: 'common', zoneId: 1, cm: [20, 70], basePrice: 60, difficulty: 0.32, desc: 'Thích ăn rong rêu và cỏ nước non ven bờ, thân thuôn dài cơ bắp.' },
  { id: 'fish_silver_carp', name: 'Cá mè trắng', emoji: '🐟', rarity: 'common', zoneId: 1, cm: [22, 65], basePrice: 55, difficulty: 0.3, desc: 'Bơi theo bầy lọc tảo xanh, vảy lóng lánh như dát một lớp bạc.' },
  { id: 'fish_minnow', name: 'Cá lòng tong đuôi đỏ', emoji: '🐟', rarity: 'common', zoneId: 1, cm: [6, 18], basePrice: 30, difficulty: 0.18, desc: 'Chú cá nhỏ nhanh như chớp, đuôi đỏ chót lấp lánh dưới nắng bình minh.' },
  { id: 'fish_rohu', name: 'Cá trôi Ấn Độ', emoji: '🎏', rarity: 'rare', zoneId: 1, cm: [25, 80], basePrice: 110, difficulty: 0.42, desc: 'Vảy ánh hồng phớt bạc, vây đỏ tươi, lực giật mạnh mẽ khiến cần thủ bất ngờ.' },
  { id: 'fish_carp', name: 'Cá chép hoa', emoji: '🎏', rarity: 'rare', zoneId: 1, cm: [25, 85], basePrice: 120, difficulty: 0.45, desc: 'Cá chép thân vàng óng ánh kim, cặp râu cong quý phái, biểu tượng phong thủy may mắn.' },
  { id: 'fish_guppy', name: 'Cá bảy màu đồng ruộng', emoji: '🐠', rarity: 'rare', zoneId: 1, cm: [8, 22], basePrice: 130, difficulty: 0.38, desc: 'Chiếc đuôi xòe hoa ngũ sắc dập dềnh theo sóng nước, đẹp như một dải lụa màu.' },
  { id: 'fish_betta', name: 'Cá thia xiêm ngũ sắc', emoji: '🐠', rarity: 'epic', zoneId: 1, cm: [12, 35], basePrice: 480, difficulty: 0.65, desc: 'Vây dài bồng bềnh kiêu sa, màu xanh tím lấp lánh ánh kim sa tuyệt mỹ.' },
  { id: 'fish_carp_god', name: 'Kim Giáp Long Điệp Ngư', emoji: '🐲', rarity: 'mythic', zoneId: 1, cm: [150, 260], basePrice: 20000, gemPrice: 300, difficulty: 0.95, isSuperRare: true, titleReward: 'title_carp_god', desc: 'Cá Chép Thần biến dạng có vảy hoàng kim cứng như giáp long lân. Linh vật thần thoại ngàn năm có một!' },

  // =========================================================================
  // VÙNG 2: Đầm Sen Cổ Thụ (11 loài)
  // =========================================================================
  { id: 'fish_tilapia', name: 'Cá rô phi sen', emoji: '🐟', rarity: 'common', zoneId: 2, cm: [15, 42], basePrice: 50, difficulty: 0.35, desc: 'Thường kiếm ăn dưới gốc tán lá sen khổng lồ, vây lưng có sọc đỏ thẫm.' },
  { id: 'fish_climbing_perch', name: 'Cá rô cờ đầm sen', emoji: '🐠', rarity: 'common', zoneId: 2, cm: [12, 36], basePrice: 65, difficulty: 0.36, desc: 'Có khả năng trèo lên bẹ sen để bắt sâu bọ, vảy dày sậm màu bùn non.' },
  { id: 'fish_gourami', name: 'Cá sặc rằn sen biếc', emoji: '🐡', rarity: 'common', zoneId: 2, cm: [14, 38], basePrice: 70, difficulty: 0.38, desc: 'Thân dẹt hình bầu dục in vân rằn đen sọc vàng, sống trong nước đầm sen êm dịu.' },
  { id: 'fish_snakehead', name: 'Cá lóc bông sen', emoji: '🐡', rarity: 'rare', zoneId: 2, cm: [30, 95], basePrice: 160, difficulty: 0.52, desc: 'Sát thủ săn mồi ẩn nấp dưới bèo hoa dâu và ngó sen, cú táp mồi như sét đánh.' },
  { id: 'fish_elephant_ear', name: 'Cá tai tượng hoa sen', emoji: '🐠', rarity: 'rare', zoneId: 2, cm: [28, 80], basePrice: 220, difficulty: 0.55, desc: 'Cặp vây ngực dài như đôi tai mềm mại, đầu có gù tròn phúc hậu.' },
  { id: 'fish_lotus_catfish', name: 'Cá trê hồng liên', emoji: '🐡', rarity: 'rare', zoneId: 2, cm: [32, 90], basePrice: 190, difficulty: 0.53, desc: 'Thân cá óng ánh sắc hồng phấn do ngậm linh khí hoa sen hàng trăm năm.' },
  { id: 'fish_gourami_silk', name: 'Cá sặc gấm ngũ sắc', emoji: '🐠', rarity: 'rare', zoneId: 2, cm: [15, 40], basePrice: 180, difficulty: 0.48, desc: 'Lớp vảy tựa như được dệt từ gấm hoàng gia, chớp sáng ngọc bích khi bơi.' },
  { id: 'fish_koi', name: 'Cá Koi hoàng kim', emoji: '🏮', rarity: 'epic', zoneId: 2, cm: [35, 110], basePrice: 650, difficulty: 0.72, desc: 'Cá Koi quý phái được nuôi dưỡng bằng linh khí sen cổ thụ, toàn thân dát vàng nguyên khối.' },
  { id: 'fish_koi_kohaku', name: 'Cá Koi Kohaku nhị sắc', emoji: '🎏', rarity: 'epic', zoneId: 2, cm: [40, 115], basePrice: 720, difficulty: 0.74, desc: 'Màu nền trắng muốt như ngọc điểm xuyết các mảng đỏ son thắm nồng thuần khiết.' },
  { id: 'fish_dragon_butterfly', name: 'Cá chép bướm tiên', emoji: '🌸', rarity: 'legendary', zoneId: 2, cm: [50, 130], basePrice: 1500, difficulty: 0.85, desc: 'Vây dài tha thướt tựa dải lụa tiên nữ bay lượn giữa đài hoa sen ngát hương.' },
  { id: 'fish_lotus_spirit', name: 'Hồng Liên Thần Ngư', emoji: '🌸', rarity: 'mythic', zoneId: 2, cm: [160, 280], basePrice: 25000, gemPrice: 350, difficulty: 0.96, isSuperRare: true, titleReward: 'title_lotus_spirit', desc: 'Thần ngư sinh ra từ búp sen hồng triệu năm, toàn thân phát ra ánh sáng tường hòa. Cực kỳ hiếm hoi và tôn quý!' },

  // =========================================================================
  // VÙNG 3: Vực Thẳm Lòng Hồ (11 loài)
  // =========================================================================
  { id: 'fish_catfish', name: 'Cá trê sâu', emoji: '🐡', rarity: 'common', zoneId: 3, cm: [30, 110], basePrice: 140, difficulty: 0.5, desc: 'Loài cá da trơn ẩn mình dưới đáy vực sâu tối tăm, râu dài nhạy bén trong bóng đêm.' },
  { id: 'fish_black_carp', name: 'Cá trắm đen vực sâu', emoji: '🐟', rarity: 'common', zoneId: 3, cm: [35, 120], basePrice: 160, difficulty: 0.54, desc: 'Thân đen kịt như than củi, vảy to dày rắn chắc, chuyên ăn ốc đá đáy vực.' },
  { id: 'fish_piranha', name: 'Cá răng đao bóng đêm', emoji: '🐟', rarity: 'rare', zoneId: 3, cm: [20, 60], basePrice: 250, difficulty: 0.62, desc: 'Hàm răng sắc bén như dao mổ, ánh mắt đỏ quạch hung dữ lẩn khuất trong dòng nước đen.' },
  { id: 'fish_sturgeon', name: 'Cá tầm gai cổ đại', emoji: '🦈', rarity: 'rare', zoneId: 3, cm: [50, 160], basePrice: 280, difficulty: 0.65, desc: 'Hàng gai xương nhọn hoắt chạy dọc sống lưng từ thời tiền sử chưa hề tiến hóa.' },
  { id: 'fish_mekong_catfish', name: 'Cá tra dầu khổng lồ', emoji: '🐋', rarity: 'epic', zoneId: 3, cm: [80, 240], basePrice: 820, difficulty: 0.76, desc: 'Thủy quái sông nước nặng hàng tạ, sức kéo kinh hoàng làm cong vút mọi ngọn cần.' },
  { id: 'fish_arapaima', name: 'Cá hải tượng khổng lồ', emoji: '🐊', rarity: 'epic', zoneId: 3, cm: [120, 320], basePrice: 950, difficulty: 0.8, desc: 'Hóa thạch sống của Amazon, chiếc đuôi đỏ viền vảy bọc thép có thể quật ngã thuyền nan.' },
  { id: 'fish_angler', name: 'Cá lồng đèn vực sâu', emoji: '💡', rarity: 'epic', zoneId: 3, cm: [40, 130], basePrice: 800, difficulty: 0.78, desc: 'Có cần câu phát sáng dẫn dụ con mồi trong bóng tối vô tận của rãnh vực thẳm.' },
  { id: 'fish_coelacanth', name: 'Cá vây tay cổ sinh', emoji: '🦕', rarity: 'legendary', zoneId: 3, cm: [70, 190], basePrice: 1800, difficulty: 0.88, desc: 'Loài cá từ kỷ Jura ngỡ đã tuyệt chủng 66 triệu năm trước, các vây thịt tựa như tứ chi.' },
  { id: 'fish_moray_electric', name: 'Cá chình điện hắc ám', emoji: '⚡', rarity: 'legendary', zoneId: 3, cm: [90, 250], basePrice: 2100, difficulty: 0.9, desc: 'Phóng ra luồng điện thế 800 Volt làm sôi cả vùng nước quanh miệng hang đá ngầm.' },
  { id: 'fish_abyss_gulper', name: 'Cá bồ nông đáy vực', emoji: '🐙', rarity: 'legendary', zoneId: 3, cm: [80, 220], basePrice: 2300, difficulty: 0.92, desc: 'Chiếc miệng khổng lồ có thể nuốt chửng con mồi to gấp đôi cơ thể nó.' },
  { id: 'fish_leviathan', name: 'Thủy Quái Leviathan', emoji: '🦑', rarity: 'mythic', zoneId: 3, cm: [320, 600], basePrice: 40000, gemPrice: 600, difficulty: 0.98, isSuperRare: true, titleReward: 'title_leviathan_conqueror', desc: 'Cổ long thủy quái ngủ say dưới vực rãnh đáy hồ, sức mạnh khuấy đảo sóng thần. Cực kỳ hiếm hoi và tôn quý!' },

  // =========================================================================
  // VÙNG 4: Đầm Sương Đom Đóm (11 loài)
  // =========================================================================
  { id: 'fish_firefly_fish', name: 'Cá đom đóm dạ minh', emoji: '✨', rarity: 'common', zoneId: 4, cm: [10, 30], basePrice: 90, difficulty: 0.35, desc: 'Bụng phát sáng lấp lánh như ngọn đèn lồng tí hon trôi dạt trong màn sương.' },
  { id: 'fish_night_gourami', name: 'Cá sặc tím sương đêm', emoji: '🔮', rarity: 'common', zoneId: 4, cm: [15, 40], basePrice: 110, difficulty: 0.38, desc: 'Thân tím biếc ngụy trang hoàn hảo giữa đám cỏ ma quái và làn khói sương.' },
  { id: 'fish_neon_tetra', name: 'Cá dạ quang sông Nam', emoji: '🐟', rarity: 'common', zoneId: 4, cm: [8, 25], basePrice: 95, difficulty: 0.32, desc: 'Sọc neon xanh lam chạy dọc sống lưng phát quang rực rỡ khi bơi theo đàn.' },
  { id: 'fish_eel', name: 'Lươn điện dạ quang', emoji: '⚡', rarity: 'rare', zoneId: 4, cm: [40, 120], basePrice: 220, difficulty: 0.6, nightOnly: true, desc: 'Phát ra tia điện tím lập lòe trong sương đêm, lướt như tia chớp dưới lòng sông.' },
  { id: 'fish_ghost_catfish', name: 'Cá trê ma râu tím', emoji: '👻', rarity: 'rare', zoneId: 4, cm: [30, 95], basePrice: 240, difficulty: 0.58, nightOnly: true, desc: 'Cặp râu tím dài quét qua lớp bùn đáy sông, cơ thể bán trong suốt thoắt ẩn thoắt hiện.' },
  { id: 'fish_mist_sword', name: 'Cá kiếm sương mù', emoji: '🗡️', rarity: 'rare', zoneId: 4, cm: [45, 130], basePrice: 290, difficulty: 0.64, desc: 'Chiếc mõm nhọn hoắt xé toạc màn sương mù mịt mỗi khi phóng mình săn mồi.' },
  { id: 'fish_angel_dusk', name: 'Cá thần tiên dạ khúc', emoji: '🌙', rarity: 'epic', zoneId: 4, cm: [25, 75], basePrice: 680, difficulty: 0.72, desc: 'Đôi vây ngực tựa như đôi cánh thiên thần sà xuống uống ánh trăng non.' },
  { id: 'fish_moonfish', name: 'Cá mặt trăng rừng sâu', emoji: '🌙', rarity: 'epic', zoneId: 4, cm: [50, 150], basePrice: 750, difficulty: 0.75, desc: 'Thân dẹt hình bán nguyệt, lấp lánh ánh bạc phản chiếu mặt trăng đêm rằm.' },
  { id: 'fish_tiger_glow', name: 'Cá hổ dạ minh', emoji: '🐯', rarity: 'epic', zoneId: 4, cm: [35, 105], basePrice: 720, difficulty: 0.73, nightOnly: true, desc: 'Sọc vằn hổ phát quang ánh hổ phách, bản tính hung bạo làm bá chủ nhánh sông đêm.' },
  { id: 'fish_purple_arowana', name: 'Cá rồng tím dạ quang', emoji: '🐲', rarity: 'legendary', zoneId: 4, cm: [60, 160], basePrice: 1900, difficulty: 0.86, desc: 'Vảy tím huyền bí lấp lánh như chứa đựng cả dải ngân hà đầy sao sa.' },
  { id: 'fish_lunar_ancient', name: 'Nguyệt Tinh Cổ Ngư', emoji: '🔮', rarity: 'mythic', zoneId: 4, cm: [220, 420], basePrice: 30000, gemPrice: 450, difficulty: 0.97, isSuperRare: true, titleReward: 'title_lunar_fish', desc: 'Ngưng tụ ánh sáng tinh hoa nhật nguyệt, mang lại điềm lành vô tận cho ngư dân. Cực kỳ hiếm hoi và tôn quý!' },

  // =========================================================================
  // VÙNG 5: Vịnh Biển San Hô (11 loài)
  // =========================================================================
  { id: 'fish_clownfish', name: 'Cá hề san hô viền cam', emoji: '🐠', rarity: 'common', zoneId: 5, cm: [8, 24], basePrice: 120, difficulty: 0.35, desc: 'Sọc trắng cam tươi tắn, thích trú ẩn trong bụi hải quỳ độc ven rạn san hô.' },
  { id: 'fish_blue_tang', name: 'Cá bắp nẻ xanh biếc', emoji: '🐟', rarity: 'common', zoneId: 5, cm: [12, 35], basePrice: 140, difficulty: 0.38, desc: 'Sắc xanh coban sâu thẳm cùng chiếc đuôi vàng chanh nổi bật giữa làn nước trong.' },
  { id: 'fish_butterfly_reef', name: 'Cá bướm gai ngũ sắc', emoji: '🐠', rarity: 'common', zoneId: 5, cm: [14, 38], basePrice: 150, difficulty: 0.4, desc: 'Chiếc mỏ dài thon chuyên rỉa san hô mềm và giáp xác nhỏ dưới kẽ đá.' },
  { id: 'fish_barracuda', name: 'Cá nhồng biển răng nhọn', emoji: '🦈', rarity: 'rare', zoneId: 5, cm: [50, 150], basePrice: 310, difficulty: 0.68, desc: 'Tên bắn của đại dương, hàm răng sắc lẹm với tốc độ lao tới 45km/h.' },
  { id: 'fish_lionfish', name: 'Cá sư tử vây hoa độc', emoji: '🐡', rarity: 'rare', zoneId: 5, cm: [25, 65], basePrice: 330, difficulty: 0.65, desc: 'Vây xòe rộng như cánh quạt lông vũ kiêu hãnh, các gai lưng chứa nọc độc tê tái.' },
  { id: 'fish_yellowfin_tuna', name: 'Cá ngừ vây vàng', emoji: '🐟', rarity: 'rare', zoneId: 5, cm: [60, 180], basePrice: 380, difficulty: 0.72, desc: 'Chiếc vây lưng hình lưỡi liềm vàng rực, thớ thịt đỏ hồng béo ngậy danh tiếng.' },
  { id: 'fish_shark', name: 'Cá mập con san hô', emoji: '🦈', rarity: 'rare', zoneId: 5, cm: [60, 200], basePrice: 350, difficulty: 0.7, desc: 'Nhanh nhẹn và khôn ngoan bơi lượn quanh rạn san hô, vây lưng nhô trên mặt biển.' },
  { id: 'fish_stingray', name: 'Cá đuối hoa sao biển', emoji: '🛸', rarity: 'epic', zoneId: 5, cm: [50, 160], basePrice: 880, difficulty: 0.78, desc: 'Lượn như chim bay dưới đáy biển nhiệt đới, vệt đốm sao xanh biếc rực rỡ.' },
  { id: 'fish_sailfish', name: 'Cá buồm đại dương', emoji: '⛵', rarity: 'epic', zoneId: 5, cm: [90, 250], basePrice: 950, difficulty: 0.82, desc: 'Vây lưng xòe rộng như cánh buồm lướt sóng xé gió, tốc độ bơi nhanh nhất hành tinh.' },
  { id: 'fish_giant_manta', name: 'Cá đuối quỷ biển khơi', emoji: '🌊', rarity: 'legendary', zoneId: 5, cm: [150, 380], basePrice: 2400, difficulty: 0.9, desc: 'Sải cánh khổng lồ che rợp cả rạn san hô, nhảy vọt lên khỏi mặt nước ngoạn mục.' },
  { id: 'fish_kirin_sea', name: 'Hải Hoàng Kỳ Lân Ngư', emoji: '👑', rarity: 'mythic', zoneId: 5, cm: [280, 520], basePrice: 35000, gemPrice: 500, difficulty: 0.98, isSuperRare: true, titleReward: 'title_kirin_sea', desc: 'Kỳ lân linh thú cai quản hải vực san hô, vảy phát ánh sáng bảy sắc cầu vồng. Cực kỳ hiếm hoi và tôn quý!' },

  // =========================================================================
  // VÙNG 6: Thác Băng Cực Phong (11 loài)
  // =========================================================================
  { id: 'fish_ice_smelt', name: 'Cá ốt-me băng tuyết', emoji: '🐟', rarity: 'common', zoneId: 6, cm: [10, 28], basePrice: 130, difficulty: 0.42, desc: 'Thân trong suốt có mùi thơm dưa leo đặc trưng, sống sót trong nước đóng băng.' },
  { id: 'fish_polar_cod', name: 'Cá tuyết sương mù', emoji: '🐟', rarity: 'common', zoneId: 6, cm: [20, 60], basePrice: 150, difficulty: 0.45, desc: 'Chất chống đông trong máu giúp nó bơi lội tung tăng dưới tảng băng trôi.' },
  { id: 'fish_whitefish', name: 'Cá măng băng giá', emoji: '🐟', rarity: 'common', zoneId: 6, cm: [25, 75], basePrice: 170, difficulty: 0.48, desc: 'Lớp mỡ dày giữ ấm cơ thể, vảy ánh lên màu xám tro của bầu trời tuyết rơi.' },
  { id: 'fish_salmon', name: 'Cá hồi tuyết', emoji: '🍣', rarity: 'rare', zoneId: 6, cm: [45, 130], basePrice: 240, difficulty: 0.62, desc: 'Vượt dòng thác băng dựng đứng để đẻ trứng, thớ thịt đỏ cam săn chắc tuyệt hảo.' },
  { id: 'fish_frost_trout', name: 'Cá hồi chấm sông băng', emoji: '🐟', rarity: 'rare', zoneId: 6, cm: [35, 110], basePrice: 260, difficulty: 0.65, desc: 'Những đốm xanh ngọc viền trắng như hạt tuyết đọng trên nền da ánh bạc.' },
  { id: 'fish_arctic_char', name: 'Cá than cực bắc', emoji: '🐠', rarity: 'rare', zoneId: 6, cm: [40, 120], basePrice: 290, difficulty: 0.68, desc: 'Chiếc bụng đỏ rực đối lập với lưng xanh thẫm, bơi sâu dưới chân vách băng.' },
  { id: 'fish_hammer_frost', name: 'Cá đầu búa tuyết sơn', emoji: '🦈', rarity: 'epic', zoneId: 6, cm: [70, 210], basePrice: 920, difficulty: 0.82, desc: 'Chiếc đầu búa bọc lớp băng dày có thể húc vỡ những tảng băng cản đường.' },
  { id: 'fish_crystal_cod', name: 'Cá tuyết pha lê', emoji: '🧊', rarity: 'epic', zoneId: 6, cm: [55, 160], basePrice: 850, difficulty: 0.8, desc: 'Toàn thân trong suốt như khối băng pha lê tinh khiết, nhìn thấu cả xương sống.' },
  { id: 'fish_glacier_sturgeon', name: 'Cá tầm sông băng vĩnh cửu', emoji: '🦈', rarity: 'epic', zoneId: 6, cm: [80, 230], basePrice: 980, difficulty: 0.85, desc: 'Trứng cá tầm đen của loài này được xem là báu vật ẩm thực đắt đỏ nhất.' },
  { id: 'fish_ice_whale_mini', name: 'Cá voi trắng băng phong', emoji: '🐳', rarity: 'legendary', zoneId: 6, cm: [160, 360], basePrice: 2600, difficulty: 0.92, desc: 'Hóa thân nhỏ bé của cá voi trắng Bắc Cực, tiếng kêu như tiếng chuông ngân qua làn băng tuyết.' },
  { id: 'fish_frostwyrm', name: 'Băng Long Thần Ngư', emoji: '🐲', rarity: 'mythic', zoneId: 6, cm: [350, 700], basePrice: 50000, gemPrice: 800, difficulty: 0.99, isSuperRare: true, titleReward: 'title_ice_dragon_fish', desc: 'Hóa thân của Rồng Băng Thượng Cổ cuộn mình dưới chân thác ngầm. Cực kỳ hiếm hoi và tôn quý!' },

  // =========================================================================
  // 🌸 CÁ MÙA XUÂN (Spring Exclusive - 14 loài độc quyền)
  // =========================================================================
  { id: 'fish_season_spring', name: 'Cá Anh Đào Xuân Mộng', emoji: '🌸', rarity: 'epic', zoneId: 0, season: 'spring', cm: [30, 95], basePrice: 900, difficulty: 0.68, desc: 'Chỉ xuất hiện vào Mùa Xuân khi cánh hoa anh đào rụng xuống mặt nước tạo thành sóng hồng.' },
  { id: 'fish_sp_sakura_carp', name: 'Cá chép hoa đào', emoji: '🎏', rarity: 'common', zoneId: 0, season: 'spring', cm: [20, 65], basePrice: 110, difficulty: 0.35, desc: 'Vảy cá có đốm hồng phấn như từng cánh đào phai rơi đọng trên lưng cá.' },
  { id: 'fish_sp_peach_goby', name: 'Cá bống cánh đào', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'spring', cm: [8, 25], basePrice: 95, difficulty: 0.3, desc: 'Sống trong khe suối mùa xuân, thân nhỏ nhắn màu hồng cam ngọt ngào.' },
  { id: 'fish_sp_spring_rohu', name: 'Cá mè hoa mùa xuân', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'spring', cm: [22, 68], basePrice: 120, difficulty: 0.38, desc: 'Mùa xuân là mùa cá mè kết bầy đẻ trứng, vảy béo múp míp óng ánh.' },
  { id: 'fish_sp_green_perch', name: 'Cá rô xuân bích', emoji: '🐠', rarity: 'common', zoneId: 0, season: 'spring', cm: [12, 35], basePrice: 130, difficulty: 0.4, desc: 'Toàn thân xanh ngọc bích như màu chồi non mới nhú sau cơn mưa rào.' },
  { id: 'fish_sp_drizzle_trout', name: 'Cá hồi mưa xuân', emoji: '🌧️', rarity: 'rare', zoneId: 0, season: 'spring', cm: [35, 105], basePrice: 310, difficulty: 0.6, rainOnly: true, desc: 'Chỉ ngoi lên mặt nước khi trời lất phất mưa phùn mùa xuân để đớp sâu bọ.' },
  { id: 'fish_sp_lotus_bud', name: 'Cá thạch liên búp non', emoji: '🪷', rarity: 'rare', zoneId: 0, season: 'spring', cm: [25, 75], basePrice: 290, difficulty: 0.58, desc: 'Ẩn mình quanh những búp sen non mới nhú khỏi mặt bùn đầm lầy mùa xuân.' },
  { id: 'fish_sp_jade_snapper', name: 'Cá tráp ngọc bích xuân', emoji: '🐠', rarity: 'rare', zoneId: 0, season: 'spring', cm: [30, 90], basePrice: 330, difficulty: 0.62, desc: 'Thân cá trong suốt ánh ngọc xanh lục phỉ thúy, biểu tượng của sự trường thọ.' },
  { id: 'fish_sp_floral_butterfly', name: 'Cá bướm hoa xuân', emoji: '🦋', rarity: 'rare', zoneId: 0, season: 'spring', cm: [18, 55], basePrice: 350, difficulty: 0.64, desc: 'Cặp vây xòe rộng như cánh bướm chập chờn trên thảm cỏ ven mép nước.' },
  { id: 'fish_sp_emerald_ray', name: 'Cá đuối nước ngọt mùa xuân', emoji: '🍃', rarity: 'epic', zoneId: 0, season: 'spring', cm: [45, 135], basePrice: 920, difficulty: 0.74, desc: 'Thân dẹt hình lá cây xanh mướt, trôi êm ả dưới tán liễu rủ mùa xuân.' },
  { id: 'fish_sp_golden_fortune', name: 'Cá kim ngân xuân lộc', emoji: '💰', rarity: 'epic', zoneId: 0, season: 'spring', cm: [40, 120], basePrice: 980, difficulty: 0.76, desc: 'Mang lại tài lộc và may mắn đầu năm cho bất cứ cần thủ nào kiên nhẫn câu được.' },
  { id: 'fish_sp_spring_dragon_carp', name: 'Cá chép rồng nghinh xuân', emoji: '🐲', rarity: 'legendary', zoneId: 0, season: 'spring', cm: [70, 180], basePrice: 2200, difficulty: 0.88, desc: 'Cá chép vượt vũ môn đón chào tân xuân, cặp râu rồng vàng óng tỏa linh khí.' },
  { id: 'fish_sp_sacred_turtle_fish', name: 'Xuân Thủy Linh Quy Ngư', emoji: '🐢', rarity: 'legendary', zoneId: 0, season: 'spring', cm: [85, 220], basePrice: 2500, difficulty: 0.9, desc: 'Lưng mang mai rùa hoa văn xuân phân nghìn tuổi, tượng trưng cho phúc thọ vô biên.' },
  { id: 'fish_sp_phoenix_feather', name: 'Phụng Vũ Nghinh Xuân Thần Ngư', emoji: '🦚', rarity: 'mythic', zoneId: 0, season: 'spring', cm: [180, 360], basePrice: 32000, gemPrice: 480, difficulty: 0.97, desc: 'Thần ngư có vây đuôi xòe rộng như lông chim phượng hoàng, chỉ thức giấc khi xuân về.' },

  // =========================================================================
  // ☀️ CÁ MÙA HẠ (Summer Exclusive - 14 loài độc quyền)
  // =========================================================================
  { id: 'fish_season_summer', name: 'Cá Thái Dương Hỏa Diệm', emoji: '🔥', rarity: 'epic', zoneId: 0, season: 'summer', cm: [45, 140], basePrice: 1100, difficulty: 0.72, desc: 'Hấp thụ dương khí mùa Hạ oi ả, thân đỏ rực như ánh hoàng hôn trên biển nhiệt đới.' },
  { id: 'fish_su_flying_fish', name: 'Cá chuồn nhiệt đới hạ', emoji: '✈️', rarity: 'common', zoneId: 0, season: 'summer', cm: [15, 45], basePrice: 125, difficulty: 0.38, desc: 'Lướt trên ngọn sóng mùa hè đón những cơn gió nam nồng nhiệt.' },
  { id: 'fish_su_sun_goby', name: 'Cá bống cát mùa nắng', emoji: '☀️', rarity: 'common', zoneId: 0, season: 'summer', cm: [10, 30], basePrice: 100, difficulty: 0.32, desc: 'Vùi mình trong bãi cát bỏng rát, thân màu vàng đất ngụy trang tinh vi.' },
  { id: 'fish_su_silver_mullet', name: 'Cá đối vảy bạc mùa hạ', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'summer', cm: [18, 50], basePrice: 115, difficulty: 0.36, desc: 'Từng đàn cá đối tung mình nhảy múa trên mặt nước rực rỡ nắng trưa hè.' },
  { id: 'fish_su_fire_clown', name: 'Cá hề lửa rực rỡ', emoji: '🐠', rarity: 'common', zoneId: 0, season: 'summer', cm: [10, 32], basePrice: 135, difficulty: 0.4, desc: 'Màu cam cháy pha sọc đen tuyền, vô cùng năng động trong làn nước ấm mùa hạ.' },
  { id: 'fish_su_summer_snapper', name: 'Cá tráp đỏ mùa hạ', emoji: '🐟', rarity: 'rare', zoneId: 0, season: 'summer', cm: [30, 92], basePrice: 320, difficulty: 0.64, desc: 'Thịt săn chắc và ngọt bùi nhất trong những tháng hè ngập tràn phù du.' },
  { id: 'fish_su_storm_snakehead', name: 'Cá lóc săn mồi giông hạ', emoji: '⚡', rarity: 'rare', zoneId: 0, season: 'summer', cm: [38, 110], basePrice: 360, difficulty: 0.68, rainOnly: true, desc: 'Thức tỉnh theo tiếng sấm đầu mùa hạ, quẫy đuôi điên cuồng săn mồi trong mưa dông.' },
  { id: 'fish_su_flame_swordtail', name: 'Cá đuôi kiếm viền lửa', emoji: '🗡️', rarity: 'rare', zoneId: 0, season: 'summer', cm: [20, 60], basePrice: 340, difficulty: 0.62, desc: 'Chiếc đuôi kiếm dài có vệt đỏ cam như ngọn lửa đang bùng cháy dưới nước.' },
  { id: 'fish_su_fire_piranha', name: 'Cá răng đao dung nham', emoji: '🌋', rarity: 'rare', zoneId: 0, season: 'summer', cm: [22, 65], basePrice: 370, difficulty: 0.66, desc: 'Bụng đỏ rực như dung nham núi lửa, háu ăn tột độ khi nhiệt độ nước tăng cao.' },
  { id: 'fish_su_solar_emperor', name: 'Cá hoàng đế thái dương', emoji: '👑', rarity: 'epic', zoneId: 0, season: 'summer', cm: [50, 150], basePrice: 1150, difficulty: 0.78, desc: 'Được mệnh danh là vua của các loài cá nhiệt đới, vảy lấp lánh như dát vàng sa.' },
  { id: 'fish_su_ocean_blaze', name: 'Cá cờ lửa đại dương', emoji: '⛵', rarity: 'epic', zoneId: 0, season: 'summer', cm: [80, 240], basePrice: 1250, difficulty: 0.82, desc: 'Vây buồm đỏ chót vươn cao rẽ sóng biển hè, sức quẫy kéo cần thủ ngã dúi dụi.' },
  { id: 'fish_su_night_orca', name: 'Cá hổ kình hạ dạ', emoji: '🐬', rarity: 'legendary', zoneId: 0, season: 'summer', cm: [120, 300], basePrice: 2400, difficulty: 0.9, nightOnly: true, desc: 'Bóng đen khổng lồ lướt đi trong đêm hè ấm áp, săn đuổi đàn cá nhỏ dưới trăng.' },
  { id: 'fish_su_flame_arowana', name: 'Cá Kim Long Hỏa Diễm', emoji: '🐲', rarity: 'legendary', zoneId: 0, season: 'summer', cm: [80, 200], basePrice: 2600, difficulty: 0.92, desc: 'Vảy rồng đỏ rực màu hồng ngọc, tỏa ra hơi ấm kỳ diệu xua tan mọi tà khí.' },
  { id: 'fish_su_blazing_overlord', name: 'Viêm Dương Bá Vương Thần Ngư', emoji: '☀️', rarity: 'mythic', zoneId: 0, season: 'summer', cm: [240, 480], basePrice: 36000, gemPrice: 520, difficulty: 0.98, desc: 'Thần thú cai quản dương khí mùa hạ, bơi đến đâu nước hồ ấm lên và tỏa hào quang rực rỡ.' },

  // =========================================================================
  // 🍁 CÁ MÙA THU (Autumn Exclusive - 14 loài độc quyền)
  // =========================================================================
  { id: 'fish_season_autumn', name: 'Cá Phong Diệp Hoàng Kim', emoji: '🍁', rarity: 'epic', zoneId: 0, season: 'autumn', cm: [35, 105], basePrice: 1000, difficulty: 0.7, desc: 'Vảy cá có hình vân lá phong vàng óng, mang lại giá trị cao khi bán cho thương gia mùa thu.' },
  { id: 'fish_au_autumn_carp', name: 'Cá chép vàng mùa thu', emoji: '🎏', rarity: 'common', zoneId: 0, season: 'autumn', cm: [22, 70], basePrice: 120, difficulty: 0.38, desc: 'Tích tụ mỡ béo ngậy trước mùa đông, thịt ngọt thơm nhất trong tiết trời se lạnh.' },
  { id: 'fish_au_river_trout', name: 'Cá măng sông mùa thu', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'autumn', cm: [20, 60], basePrice: 110, difficulty: 0.36, desc: 'Bơi ngược dòng tìm kiếm hạt dẻ và quả chín rơi xuống lòng sông mùa thu.' },
  { id: 'fish_au_fat_perch', name: 'Cá rô đồng béo mầm', emoji: '🐠', rarity: 'common', zoneId: 0, season: 'autumn', cm: [14, 40], basePrice: 130, difficulty: 0.4, desc: 'Bụng căng tròn trứng béo ngậy, món kho tộ trứ danh của thôn trang vào mùa gặt.' },
  { id: 'fish_au_amber_loach', name: 'Cá chạch bùn thu nguyệt', emoji: '🪱', rarity: 'common', zoneId: 0, season: 'autumn', cm: [12, 38], basePrice: 105, difficulty: 0.34, desc: 'Thân trơn nhẵn màu hổ phách nâu bóng, thường rúc vào bùn lá mục mùa thu.' },
  { id: 'fish_au_sweetfish', name: 'Cá hương mùa thu', emoji: '🌿', rarity: 'rare', zoneId: 0, season: 'autumn', cm: [18, 55], basePrice: 320, difficulty: 0.62, desc: 'Toát ra mùi hương ngọt ngào như dưa hấu chín, chỉ sống trong làn nước suối mùa thu trong vắt.' },
  { id: 'fish_au_red_salmon', name: 'Cá hồi đỏ di cư mùa thu', emoji: '🍣', rarity: 'rare', zoneId: 0, season: 'autumn', cm: [40, 120], basePrice: 380, difficulty: 0.68, desc: 'Biến đổi màu đỏ rực khi vượt ngàn dặm về nguồn đẻ trứng trong mùa lá rụng.' },
  { id: 'fish_au_osmanthus_fish', name: 'Cá quế hoa đầm thu', emoji: '🌼', rarity: 'rare', zoneId: 0, season: 'autumn', cm: [25, 80], basePrice: 340, difficulty: 0.64, desc: 'Thịt thơm thoang thoảng hương hoa quế mùa thu, vảy óng ánh hoa văn hoa cúc.' },
  { id: 'fish_au_giant_goby', name: 'Cá bống tượng vảy nâu', emoji: '🐡', rarity: 'rare', zoneId: 0, season: 'autumn', cm: [28, 85], basePrice: 360, difficulty: 0.66, desc: 'Con cá bống khổng lồ vảy nâu đốm đen, nằm phục kích dưới đáy ao lá vàng.' },
  { id: 'fish_au_moon_glass', name: 'Cá vàng lưu ly trăng thu', emoji: '🌕', rarity: 'epic', zoneId: 0, season: 'autumn', cm: [30, 90], basePrice: 1050, difficulty: 0.76, nightOnly: true, desc: 'Toàn thân trong suốt như thủy tinh hổ phách, chỉ xuất hiện dưới ánh trăng rằm tháng Tám.' },
  { id: 'fish_au_golden_mahseer', name: 'Cá chép hoàng đế Mê Kông', emoji: '👑', rarity: 'epic', zoneId: 0, season: 'autumn', cm: [60, 170], basePrice: 1180, difficulty: 0.8, desc: 'Vảy to bằng bàn tay dát vàng rực, chúa tể của những ghềnh đá mùa nước rút.' },
  { id: 'fish_au_blood_dragon', name: 'Cá Huyết Long Mùa Thu', emoji: '🐉', rarity: 'legendary', zoneId: 0, season: 'autumn', cm: [75, 190], basePrice: 2500, difficulty: 0.9, desc: 'Vảy đỏ rực rỡ như rừng phong chuyển màu, tỏa ra vương khí cao quý tột bậc.' },
  { id: 'fish_au_night_tide_lord', name: 'Nguyệt Dạ Thao Giang Ngư', emoji: '🌊', rarity: 'legendary', zoneId: 0, season: 'autumn', cm: [110, 280], basePrice: 2700, difficulty: 0.92, nightOnly: true, desc: 'Cưỡi ngọn triều dâng trong đêm trăng thu tĩnh mịch, quẫy sóng làm rung chuyển bờ bến.' },
  { id: 'fish_au_nine_autumn_giant', name: 'Cửu Thu Hoàng Kim Cự Ngư', emoji: '🍂', rarity: 'mythic', zoneId: 0, season: 'autumn', cm: [250, 500], basePrice: 38000, gemPrice: 550, difficulty: 0.98, desc: 'Tích lũy linh khí của chín mùa thu ngàn năm, mỗi chiếc vảy là một chiếc lá vàng bất tử.' },

  // =========================================================================
  // ❄️ CÁ MÙA ĐÔNG (Winter Exclusive - 14 loài độc quyền)
  // =========================================================================
  { id: 'fish_season_winter', name: 'Cá Cực Quang Băng Tuyết', emoji: '🌌', rarity: 'epic', zoneId: 0, season: 'winter', cm: [50, 160], basePrice: 1300, difficulty: 0.76, desc: 'Phát ra dải ánh sáng cực quang xanh ngọc huyền ảo dưới lớp băng trong mùa Đông giá rét.' },
  { id: 'fish_wi_arctic_cod', name: 'Cá tuyết bắc cực mùa đông', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'winter', cm: [22, 65], basePrice: 140, difficulty: 0.42, desc: 'Món ăn giữ ấm không thể thiếu của các cư dân vùng hồ băng giá mùa tuyết rơi.' },
  { id: 'fish_wi_frost_sardine', name: 'Cá mòi nước lạnh', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'winter', cm: [10, 30], basePrice: 115, difficulty: 0.35, desc: 'Bơi sát nhau tạo thành quả cầu bạc xoay tròn dưới làn nước buốt giá.' },
  { id: 'fish_wi_snow_flounder', name: 'Cá bơn mùa tuyết', emoji: '🛸', rarity: 'common', zoneId: 0, season: 'winter', cm: [18, 55], basePrice: 135, difficulty: 0.4, desc: 'Thân dẹt màu trắng xóa như bông tuyết nằm nép mình sát đáy hồ kết băng.' },
  { id: 'fish_wi_ice_herring', name: 'Cá trích mùa băng giá', emoji: '🐟', rarity: 'common', zoneId: 0, season: 'winter', cm: [15, 45], basePrice: 120, difficulty: 0.38, desc: 'Vảy lóng lánh ánh lam lạnh ngắt, rất háu ăn khi câu qua lỗ băng khoét trên mặt hồ.' },
  { id: 'fish_wi_char_winter', name: 'Cá than biển băng mùa đông', emoji: '🐟', rarity: 'rare', zoneId: 0, season: 'winter', cm: [35, 110], basePrice: 350, difficulty: 0.66, desc: 'Sống dưới tầng nước sâu âm độ, da đen tuyền mướt bóng đầy chất dinh dưỡng.' },
  { id: 'fish_wi_frost_pike', name: 'Cá măng sông đóng băng', emoji: '🗡️', rarity: 'rare', zoneId: 0, season: 'winter', cm: [40, 125], basePrice: 390, difficulty: 0.7, desc: 'Chiếc mõm dài đầy răng nhọn săn mồi chớp nhoáng dưới những vết nứt của mặt băng.' },
  { id: 'fish_wi_blue_salmon', name: 'Cá hồi vây xanh mùa đông', emoji: '🍣', rarity: 'rare', zoneId: 0, season: 'winter', cm: [45, 135], basePrice: 420, difficulty: 0.72, desc: 'Bộ vây xanh băng giá tuyệt đẹp, thịt cá đậm đà làm ấm lòng mọi ngư phủ mùa đông.' },
  { id: 'fish_wi_burrow_snakehead', name: 'Cá lóc mùa đông ẩn bùn', emoji: '🐡', rarity: 'rare', zoneId: 0, season: 'winter', cm: [30, 95], basePrice: 360, difficulty: 0.65, desc: 'Vùi sâu dưới lớp bùn ấm đáy hồ để đông miên, rất khó câu nhưng khi dính thì rất to.' },
  { id: 'fish_wi_ice_crystal_glow', name: 'Cá băng tinh dạ quang', emoji: '🔮', rarity: 'epic', zoneId: 0, season: 'winter', cm: [40, 125], basePrice: 1200, difficulty: 0.78, nightOnly: true, desc: 'Cơ thể kết tinh từ pha lê băng tuyết, tỏa ra ánh sáng xanh lam dịu mát trong đêm đông.' },
  { id: 'fish_wi_frost_hammer', name: 'Cá đầu búa sông băng', emoji: '🦈', rarity: 'epic', zoneId: 0, season: 'winter', cm: [65, 190], basePrice: 1280, difficulty: 0.82, desc: 'Chiếc đầu ngang bọc băng tuyết kiên cố, lướt đi dũng mãnh phá tan những mảng băng mỏng.' },
  { id: 'fish_wi_ice_scale_dragon', name: 'Cá Rồng Vảy Băng Bắc Hải', emoji: '🐲', rarity: 'legendary', zoneId: 0, season: 'winter', cm: [85, 210], basePrice: 2800, difficulty: 0.92, desc: 'Từng chiếc vảy tựa như phiến kim cương băng giá vĩnh cửu không bao giờ tan chảy.' },
  { id: 'fish_wi_frost_whale', name: 'Hàn Băng Linh Kình', emoji: '🐳', rarity: 'legendary', zoneId: 0, season: 'winter', cm: [140, 340], basePrice: 3000, difficulty: 0.94, desc: 'Sinh vật thần thoại bơi dưới thềm băng vĩnh cửu, hơi thở phun lên hóa thành mưa tuyết trắng xóa.' },
  { id: 'fish_wi_polar_spirit_deity', name: 'Cực Hàn Thần Ngư Tuyết Lân', emoji: '❄️', rarity: 'mythic', zoneId: 0, season: 'winter', cm: [260, 550], basePrice: 42000, gemPrice: 620, difficulty: 0.99, desc: 'Chúa tể băng tuyết ngàn năm, mỗi lần xuất hiện cả mặt hồ hóa băng và tuyết hoa rơi ngập trời.' },
];

export const FISH_BY_ID = Object.fromEntries(ALL_FISH_SPECIES.map((f) => [f.id, f]));

/**
 * Tỉ lệ cá siêu hiếm (Super Rare / Mythic): 0.00001% = 0.0000001 trong hệ thập phân
 * Để gameplay vừa có tính độc nhất vô nhị vừa công bằng, mồi cao cấp hoặc vận may thần thánh
 * có thể tăng nhẹ cơ hội này.
 */
export const SUPER_RARE_CHANCE = 0.0000001; // 0.00001%

/**
 * Tự động phát hiện người chơi đang ở Vùng Câu Cá nào (1..6)
 * dựa vào tọa độ tile (x, y) trên bản đồ thế giới
 */
export function detectFishingZone(mapId: string, tx: number, ty: number): FishingZoneDef {
  if (mapId === 'glacier') {
    return FISHING_ZONES[5]; // Zone 6: Thác Băng Cực Phong & Vực Băng Vĩnh Cửu
  }
  if (mapId === 'deepsea') {
    return ty < 28 ? FISHING_ZONES[4] : FISHING_ZONES[3]; // Zone 5 (Vịnh San Hô) & Zone 4 (Biển Sâu)
  }
  if (mapId === 'lake') {
    if (tx < 18 && ty >= 8 && ty <= 32) return FISHING_ZONES[1]; // Zone 2: Đầm Sen Cổ Thụ
    if (ty >= 30) return FISHING_ZONES[2]; // Zone 3: Vực Thẳm Lòng Hồ
    return FISHING_ZONES[0]; // Zone 1: Bờ Hồ Bình Minh
  }

  return FISHING_ZONES[0]; // Mặc định Vùng 1
}
