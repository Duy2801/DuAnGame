// Đồ ở Khu Mua Sắm (cánh, thú cưng, mũ), Tiệm Câu Cá và Tiệm Diều

export type CosmeticKind = 'wings' | 'hat' | 'pet' | 'top' | 'bottom' | 'shoes' | 'neck' | 'ear' | 'face';

export interface CosmeticDef {
  id: string;
  kind: CosmeticKind;
  name: string;
  emoji: string;
  /** độ hiếm — quyết định tỉ lệ ra trong hộp quà (không bán thẳng) */
  rarity: RodRarity;
  desc: string;
  speed?: number;
  def?: number;
  goldBonus?: number;
  xpBonus?: number;
  /**
   * Món chỉ dành cho 1 giới ('m' nam / 'f' nữ); bỏ trống = cả hai giới mặc được.
   * Món unisex vẫn có thể có dáng khác nhau cho nam/nữ — khai báo { m, f } ở COSMETIC_LOOK (art/avatar.ts).
   */
  gender?: Gender;
}

export type Gender = 'm' | 'f';

const c = (d: CosmeticDef) => d;

// Đồ ở Khu Mua Sắm chỉ ra từ hộp quà ngẫu nhiên (xem COS_BOXES). Hình: cánh/thú cưng ở world/textures2.ts,
// áo/quần/giày ở COSMETIC_LOOK, mũ ở drawHat, trang sức ở NECK_COLOR/EAR_COLOR/FACE_STYLE (art/avatar.ts).
export const COSMETICS: CosmeticDef[] = [
  // ---------------- cánh: tăng tốc chạy
  c({ id: 'wings_leaf', kind: 'wings', rarity: 'N', name: 'Cánh lá non', emoji: '🍃', speed: 0.03, desc: 'Xanh mướt mùa xuân' }),
  c({ id: 'wings_butterfly', kind: 'wings', rarity: 'N', name: 'Cánh bướm', emoji: '🦋', speed: 0.04, desc: 'Lấp lánh sắc hồng' }),
  c({ id: 'wings_dragonfly', kind: 'wings', rarity: 'N', name: 'Cánh chuồn chuồn', emoji: '🪰', speed: 0.04, desc: 'Mỏng tang trong suốt' }),
  c({ id: 'wings_angel', kind: 'wings', rarity: 'R', name: 'Cánh thiên thần', emoji: '🕊️', speed: 0.06, desc: 'Trắng muốt thánh thiện' }),
  c({ id: 'wings_bat', kind: 'wings', rarity: 'R', name: 'Cánh dơi', emoji: '🦇', speed: 0.07, desc: 'Bí ẩn trong bóng đêm' }),
  c({ id: 'wings_moth', kind: 'wings', rarity: 'R', name: 'Cánh bướm đêm', emoji: '🌙', speed: 0.07, desc: 'Xanh tím huyền ảo' }),
  c({ id: 'wings_frost', kind: 'wings', rarity: 'R', name: 'Cánh băng giá', emoji: '❄️', speed: 0.08, desc: 'Toả hơi lạnh khi bay' }),
  c({ id: 'wings_sakura', kind: 'wings', rarity: 'SR', name: 'Cánh tiên anh đào', emoji: '🌸', speed: 0.1, desc: 'Cánh tiên hồng phấn' }),
  c({ id: 'wings_seraph', kind: 'wings', rarity: 'SR', name: 'Cánh thiên sứ vàng', emoji: '😇', speed: 0.11, desc: 'Viền vàng rực rỡ' }),
  c({ id: 'wings_thunder', kind: 'wings', rarity: 'SR', name: 'Cánh sấm sét', emoji: '⚡', speed: 0.12, desc: 'Nhanh như tia chớp' }),
  c({ id: 'wings_phoenix', kind: 'wings', rarity: 'SSR', name: 'Cánh phượng hoàng', emoji: '🔥', speed: 0.14, goldBonus: 0.03, desc: 'Rực lửa bất diệt · +3% vàng' }),
  c({ id: 'wings_dragon', kind: 'wings', rarity: 'SSR', name: 'Cánh rồng', emoji: '🐉', speed: 0.15, def: 3, desc: 'Vảy rồng cứng cáp · +3 phòng thủ' }),
  c({ id: 'wings_demon', kind: 'wings', rarity: 'SSR', name: 'Cánh ác quỷ', emoji: '😈', speed: 0.16, xpBonus: 0.03, desc: 'Đỏ thẫm ma mị · +3% XP' }),
  c({ id: 'wings_void', kind: 'wings', rarity: 'UR', name: 'Cánh hư không', emoji: '🌌', speed: 0.2, xpBonus: 0.06, desc: 'Nuốt cả ánh sao · +6% XP' }),
  c({ id: 'wings_rainbow', kind: 'wings', rarity: 'UR', name: 'Cánh thần cầu vồng', emoji: '🌈', speed: 0.2, goldBonus: 0.06, desc: 'Bảy sắc huyền thoại · +6% vàng' }),

  // ---------------- thú cưng: đi theo, tăng vàng/XP
  c({ id: 'pet_chick', kind: 'pet', rarity: 'N', name: 'Gà con', emoji: '🐥', goldBonus: 0.03, xpBonus: 0.02, desc: 'Lon ton dễ thương' }),
  c({ id: 'pet_duck', kind: 'pet', rarity: 'N', name: 'Vịt bông', emoji: '🦆', goldBonus: 0.02, xpBonus: 0.03, desc: 'Cạp cạp suốt ngày' }),
  c({ id: 'pet_cat', kind: 'pet', rarity: 'N', name: 'Mèo mướp', emoji: '🐱', goldBonus: 0.05, desc: 'Lười nhưng đáng yêu' }),
  c({ id: 'pet_dog', kind: 'pet', rarity: 'N', name: 'Cún vàng', emoji: '🐶', xpBonus: 0.05, desc: 'Trung thành' }),
  c({ id: 'pet_slime_green', kind: 'pet', rarity: 'N', name: 'Slime xanh', emoji: '🟢', goldBonus: 0.03, xpBonus: 0.03, desc: 'Dẻo dẻo mát lạnh' }),
  c({ id: 'pet_cat_black', kind: 'pet', rarity: 'R', name: 'Mèo mun', emoji: '🐈‍⬛', goldBonus: 0.08, desc: 'Mắt vàng bí ẩn' }),
  c({ id: 'pet_husky', kind: 'pet', rarity: 'R', name: 'Husky ngáo', emoji: '🐺', xpBonus: 0.08, desc: 'Ngáo ngơ mà khoẻ' }),
  c({ id: 'pet_bunny', kind: 'pet', rarity: 'R', name: 'Thỏ bông', emoji: '🐰', goldBonus: 0.04, xpBonus: 0.05, desc: 'Tai dài, nhảy tưng tưng' }),
  c({ id: 'pet_slime', kind: 'pet', rarity: 'R', name: 'Slime hồng', emoji: '🩷', goldBonus: 0.06, xpBonus: 0.03, desc: 'Nhún nhảy suốt ngày' }),
  c({ id: 'pet_penguin', kind: 'pet', rarity: 'R', name: 'Cánh cụt nhỏ', emoji: '🐧', goldBonus: 0.05, xpBonus: 0.04, desc: 'Lạch bạch theo chân' }),
  c({ id: 'pet_fox', kind: 'pet', rarity: 'SR', name: 'Cáo lửa', emoji: '🦊', goldBonus: 0.06, xpBonus: 0.06, desc: 'Đuôi rực như lửa' }),
  c({ id: 'pet_fox_snow', kind: 'pet', rarity: 'SR', name: 'Cáo tuyết', emoji: '🤍', goldBonus: 0.04, xpBonus: 0.09, desc: 'Trắng như tuyết đầu mùa' }),
  c({ id: 'pet_cat_lucky', kind: 'pet', rarity: 'SR', name: 'Mèo thần tài', emoji: '😺', goldBonus: 0.12, desc: 'Vẫy tay gọi vàng' }),
  c({ id: 'pet_slime_crystal', kind: 'pet', rarity: 'SR', name: 'Slime pha lê', emoji: '💎', goldBonus: 0.07, xpBonus: 0.06, desc: 'Lấp lánh như kim cương' }),
  c({ id: 'pet_dragon', kind: 'pet', rarity: 'SSR', name: 'Rồng bé', emoji: '🐲', goldBonus: 0.1, xpBonus: 0.1, desc: 'Phun lửa tí hon' }),
  c({ id: 'pet_unicorn', kind: 'pet', rarity: 'SSR', name: 'Kỳ lân con', emoji: '🦄', goldBonus: 0.08, xpBonus: 0.13, desc: 'Sừng vàng phát sáng' }),
  c({ id: 'pet_phoenix', kind: 'pet', rarity: 'SSR', name: 'Phượng hoàng con', emoji: '🐦‍🔥', goldBonus: 0.13, xpBonus: 0.08, desc: 'Lông vũ rực lửa' }),
  c({ id: 'pet_dragon_dark', kind: 'pet', rarity: 'UR', name: 'Hắc long', emoji: '🖤', goldBonus: 0.15, xpBonus: 0.18, desc: 'Rồng đen huyền thoại' }),
  c({ id: 'pet_kitsune', kind: 'pet', rarity: 'UR', name: 'Cửu vĩ hồ', emoji: '🦊', goldBonus: 0.18, xpBonus: 0.15, desc: 'Cáo chín đuôi linh thiêng' }),

  // ---------------- mũ
  c({ id: 'hat_straw', kind: 'hat', rarity: 'N', name: 'Mũ rơm', emoji: '👒', def: 1, desc: 'Nông dân chính hiệu' }),
  c({ id: 'hat_nonla', kind: 'hat', rarity: 'N', name: 'Nón lá', emoji: '🎍', def: 1, desc: 'Đậm chất Việt' }),
  c({ id: 'hat_beanie', kind: 'hat', rarity: 'R', name: 'Mũ len đỏ', emoji: '🧶', def: 2, desc: 'Ấm áp mùa đông' }),
  c({ id: 'hat_cap', kind: 'hat', rarity: 'R', name: 'Mũ lưỡi trai', emoji: '🧢', def: 2, desc: 'Năng động' }),
  c({ id: 'hat_bow', gender: 'f', kind: 'hat', rarity: 'R', name: 'Nơ hồng', emoji: '🎀', def: 1, xpBonus: 0.01, desc: 'Xinh xắn · +1% XP' }),
  c({ id: 'hat_wizard', kind: 'hat', rarity: 'SR', name: 'Mũ phù thủy', emoji: '🧙', def: 3, xpBonus: 0.02, desc: 'Có ngôi sao lấp lánh · +2% XP' }),
  c({ id: 'hat_knight', kind: 'hat', rarity: 'SR', name: 'Mũ hiệp sĩ', emoji: '⛑️', def: 5, desc: 'Sắt nguyên khối' }),
  c({ id: 'hat_tophat', kind: 'hat', rarity: 'SSR', name: 'Mũ chóp ảo thuật', emoji: '🎩', def: 4, goldBonus: 0.04, desc: 'Lôi ra cả thỏ lẫn vàng · +4% vàng' }),
  c({ id: 'hat_crown', kind: 'hat', rarity: 'UR', name: 'Vương miện', emoji: '👑', def: 8, goldBonus: 0.05, xpBonus: 0.05, desc: 'Dành cho vua · +5% vàng, +5% XP' }),

  // ---------------- áo (mặc ngoài giáp — chỉ đổi hình, chỉ số giáp giữ nguyên)
  c({ id: 'top_tee', kind: 'top', rarity: 'N', name: 'Áo thun trắng', emoji: '👕', desc: 'Đơn giản mà đẹp' }),
  c({ id: 'top_tee_green', kind: 'top', rarity: 'N', name: 'Áo thun xanh lá', emoji: '🟩', desc: 'Tươi mát' }),
  c({ id: 'top_apron', kind: 'top', rarity: 'N', name: 'Tạp dề nhà bếp', emoji: '🧑‍🍳', desc: 'Đầu bếp tại gia' }),
  c({ id: 'top_hoodie', kind: 'top', rarity: 'R', name: 'Áo hoodie đỏ', emoji: '🧥', desc: 'Phong cách đường phố' }),
  c({ id: 'top_hoodie_black', kind: 'top', rarity: 'R', name: 'Hoodie đen', emoji: '🖤', desc: 'Ngầu lòi' }),
  c({ id: 'top_sailor', kind: 'top', rarity: 'R', name: 'Áo thủy thủ', emoji: '⚓', desc: 'Cổ xanh, nơ đỏ' }),
  c({ id: 'top_denim', kind: 'top', rarity: 'R', name: 'Áo khoác jean', emoji: '🧑‍🎤', def: 1, desc: 'Bụi bặm · +1 phòng thủ' }),
  c({ id: 'top_suit', kind: 'top', rarity: 'SR', name: 'Vest lịch lãm', emoji: '🤵', def: 1, goldBonus: 0.01, desc: 'Sang trọng · +1% vàng' }),
  c({ id: 'top_aodai', gender: 'f', kind: 'top', rarity: 'SR', name: 'Áo dài đỏ', emoji: '👘', goldBonus: 0.02, desc: 'Nét đẹp Việt · +2% vàng' }),
  c({ id: 'top_aodai_white', gender: 'f', kind: 'top', rarity: 'SR', name: 'Áo dài trắng', emoji: '🤍', xpBonus: 0.02, desc: 'Nữ sinh thanh lịch · +2% XP' }),
  c({ id: 'top_dress', gender: 'f', kind: 'top', rarity: 'SR', name: 'Váy tiểu thư', emoji: '👗', goldBonus: 0.01, xpBonus: 0.01, desc: 'Bồng bềnh duyên dáng' }),
  c({ id: 'top_mage', kind: 'top', rarity: 'SR', name: 'Áo choàng pháp sư', emoji: '🔮', xpBonus: 0.03, desc: 'Thêu sao bạc · +3% XP' }),
  c({ id: 'top_royal', kind: 'top', rarity: 'SSR', name: 'Hoàng bào', emoji: '🫅', goldBonus: 0.04, xpBonus: 0.04, desc: 'Áo vua kèm áo choàng' }),
  c({ id: 'top_shadow', kind: 'top', rarity: 'SSR', name: 'Áo choàng bóng đêm', emoji: '🥷', def: 2, xpBonus: 0.05, desc: 'Ẩn mình trong màn đêm' }),
  c({ id: 'top_queen', gender: 'f', kind: 'top', rarity: 'SSR', name: 'Áo dài hoàng hậu', emoji: '👸', goldBonus: 0.05, xpBonus: 0.03, desc: 'Vàng son lộng lẫy' }),
  c({ id: 'top_dragonrobe', kind: 'top', rarity: 'UR', name: 'Long bào', emoji: '🐉', def: 3, goldBonus: 0.06, xpBonus: 0.06, desc: 'Thêu rồng vàng chín tầng' }),
  // đồ riêng nam
  c({ id: 'top_aodai_nam', gender: 'm', kind: 'top', rarity: 'SR', name: 'Áo dài khăn đóng', emoji: '🎎', goldBonus: 0.02, desc: 'Nam nhi đất Việt · +2% vàng' }),
  c({ id: 'top_prince', gender: 'm', kind: 'top', rarity: 'SSR', name: 'Lễ phục hoàng tử', emoji: '🤴', goldBonus: 0.05, xpBonus: 0.03, desc: 'Áo trắng viền vàng, choàng lam' }),
  // đồ riêng nữ
  c({ id: 'top_blouse', gender: 'f', kind: 'top', rarity: 'N', name: 'Áo blouse hồng', emoji: '🎀', desc: 'Tay phồng, cổ sen' }),
  c({ id: 'top_princess', gender: 'f', kind: 'top', rarity: 'SSR', name: 'Đầm công chúa', emoji: '👸', goldBonus: 0.03, xpBonus: 0.05, desc: 'Váy dài chấm gót lấp lánh' }),
  c({ id: 'top_holy', kind: 'top', rarity: 'UR', name: 'Thánh y ánh sáng', emoji: '✨', def: 5, goldBonus: 0.04, xpBonus: 0.08, desc: 'Giáp lễ của thánh kỵ sĩ' }),

  // ---------------- quần / váy
  c({ id: 'bottom_shorts', kind: 'bottom', rarity: 'N', name: 'Quần short', emoji: '🩳', desc: 'Mát mẻ ngày hè' }),
  c({ id: 'bottom_jeans', kind: 'bottom', rarity: 'N', name: 'Quần jean', emoji: '👖', desc: 'Bụi bặm, năng động' }),
  c({ id: 'bottom_khaki', kind: 'bottom', rarity: 'N', name: 'Quần kaki', emoji: '🟫', desc: 'Gọn gàng' }),
  c({ id: 'bottom_skirt', gender: 'f', kind: 'bottom', rarity: 'R', name: 'Chân váy hồng', emoji: '🩰', desc: 'Xòe xinh xắn' }),
  c({ id: 'bottom_black', kind: 'bottom', rarity: 'R', name: 'Quần âu đen', emoji: '👔', desc: 'Đi cùng vest rất hợp' }),
  c({ id: 'bottom_pleat', gender: 'f', kind: 'bottom', rarity: 'SR', name: 'Váy xếp ly xanh', emoji: '🎽', xpBonus: 0.01, desc: 'Đồng phục học viện' }),
  c({ id: 'bottom_white', kind: 'bottom', rarity: 'SR', name: 'Quần lụa trắng', emoji: '🤍', goldBonus: 0.01, desc: 'Đi cùng áo dài' }),
  c({ id: 'bottom_cargo', gender: 'm', kind: 'bottom', rarity: 'R', name: 'Quần túi hộp', emoji: '🪖', def: 1, desc: 'Bụi bặm phong trần · +1 phòng thủ' }),
  c({ id: 'bottom_gown', gender: 'f', kind: 'bottom', rarity: 'SSR', name: 'Váy dạ hội tím', emoji: '💜', goldBonus: 0.03, desc: 'Lấp lánh ánh sao' }),

  // ---------------- giày
  c({ id: 'shoes_sneaker', kind: 'shoes', rarity: 'N', name: 'Giày thể thao', emoji: '👟', speed: 0.02, desc: 'Chạy êm chân' }),
  c({ id: 'shoes_boots', kind: 'shoes', rarity: 'R', name: 'Bốt da nâu', emoji: '🥾', def: 1, speed: 0.01, desc: 'Leo núi thoải mái' }),
  c({ id: 'shoes_red', gender: 'f', kind: 'shoes', rarity: 'R', name: 'Giày đỏ', emoji: '👠', speed: 0.03, desc: 'Nổi bật giữa đám đông' }),
  c({ id: 'shoes_loafer', gender: 'm', kind: 'shoes', rarity: 'R', name: 'Giày tây da', emoji: '👞', speed: 0.03, desc: 'Lịch lãm từng bước' }),
  c({ id: 'shoes_black', kind: 'shoes', rarity: 'SR', name: 'Bốt chiến binh', emoji: '🖤', def: 2, speed: 0.03, desc: 'Đế thép chắc chắn' }),
  c({ id: 'shoes_gold', kind: 'shoes', rarity: 'SSR', name: 'Giày vàng', emoji: '✨', speed: 0.05, goldBonus: 0.02, desc: 'Bước tới đâu vàng tới đó' }),
  c({ id: 'shoes_glass', gender: 'f', kind: 'shoes', rarity: 'UR', name: 'Giày thủy tinh', emoji: '🩵', speed: 0.07, xpBonus: 0.04, desc: 'Của nàng công chúa' }),

  // ---------------- trang sức
  c({ id: 'face_round', kind: 'face', rarity: 'N', name: 'Kính tròn', emoji: '👓', desc: 'Thư sinh' }),
  c({ id: 'ear_gold', kind: 'ear', rarity: 'R', name: 'Bông tai vàng', emoji: '🟡', goldBonus: 0.01, desc: '+1% vàng' }),
  c({ id: 'neck_gold', kind: 'neck', rarity: 'R', name: 'Dây chuyền vàng', emoji: '📿', goldBonus: 0.02, desc: '+2% vàng' }),
  c({ id: 'face_sun', kind: 'face', rarity: 'R', name: 'Kính râm', emoji: '🕶️', desc: 'Ngầu lòi' }),
  c({ id: 'ear_pearl', kind: 'ear', rarity: 'SR', name: 'Bông tai ngọc trai', emoji: '⚪', xpBonus: 0.02, desc: '+2% XP' }),
  c({ id: 'neck_ruby', kind: 'neck', rarity: 'SR', name: 'Mặt dây ruby', emoji: '❤️', xpBonus: 0.03, desc: '+3% XP' }),
  c({ id: 'face_heart', kind: 'face', rarity: 'SR', name: 'Kính trái tim', emoji: '😍', goldBonus: 0.01, desc: 'Đáng yêu · +1% vàng' }),
  c({ id: 'neck_jade', kind: 'neck', rarity: 'SSR', name: 'Ngọc bội', emoji: '💚', goldBonus: 0.04, xpBonus: 0.04, desc: 'Ngọc quý gia truyền' }),
  c({ id: 'neck_diamond', kind: 'neck', rarity: 'UR', name: 'Dây chuyền kim cương', emoji: '💎', goldBonus: 0.06, xpBonus: 0.06, desc: 'Sáng chói cả khu phố' }),
  c({ id: 'neck_shell', kind: 'neck', rarity: 'N', name: 'Vòng vỏ sò', emoji: '🐚', goldBonus: 0.005, desc: 'Nhặt ở bãi biển hồ câu' }),
  c({ id: 'neck_silver', kind: 'neck', rarity: 'N', name: 'Dây chuyền bạc', emoji: '🔗', xpBonus: 0.01, desc: '+1% XP' }),
  c({ id: 'ear_silver', kind: 'ear', rarity: 'N', name: 'Khuyên bạc', emoji: '⚪', goldBonus: 0.005, desc: 'Đơn giản mà tinh tế' }),
  c({ id: 'face_star', kind: 'face', rarity: 'R', name: 'Kính ngôi sao', emoji: '🤩', xpBonus: 0.01, desc: 'Ngôi sao sân khấu · +1% XP' }),
  c({ id: 'ear_ruby', kind: 'ear', rarity: 'SR', name: 'Bông tai ruby', emoji: '🔴', goldBonus: 0.02, desc: '+2% vàng' }),
  c({ id: 'face_gold', kind: 'face', rarity: 'SSR', name: 'Kính gọng vàng', emoji: '🧐', goldBonus: 0.03, xpBonus: 0.02, desc: 'Phong thái quý tộc' }),
  c({ id: 'ear_star', kind: 'ear', rarity: 'SSR', name: 'Bông tai sao băng', emoji: '🌠', xpBonus: 0.04, desc: 'Lấp lánh như sao trời' }),
  c({ id: 'ear_diamond', kind: 'ear', rarity: 'UR', name: 'Bông tai kim cương', emoji: '💠', goldBonus: 0.04, xpBonus: 0.04, desc: 'Cặp đôi với dây chuyền kim cương' }),
];

export const COSMETIC_BY_ID = Object.fromEntries(COSMETICS.map((c) => [c.id, c]));

/** món này nhân vật giới tính `g` có mặc được không (món không rõ id coi như không) */
export const fitsGender = (id: string | null | undefined, g: Gender) => {
  const d = id ? COSMETIC_BY_ID[id] : undefined;
  return !!d && (!d.gender || d.gender === g);
};

// ---------------- Hộp quà ngẫu nhiên ở Khu Mua Sắm (Cánh / Thú Cưng / Thời Trang / Mũ Nón / Trang Sức)

export type CosShop = 'wings' | 'pets' | 'fashion' | 'hats' | 'jewelry';
export const COS_SHOP_KINDS: Record<CosShop, CosmeticKind[]> = {
  wings: ['wings'],
  pets: ['pet'],
  fashion: ['top', 'bottom', 'shoes'],
  hats: ['hat'],
  jewelry: ['neck', 'ear', 'face'],
};

export interface CosBox {
  id: string;
  shop: CosShop;
  name: string;
  emoji: string;
  price: number;
  /** giá kim cương (hộp VIP) — có thì không bán bằng vàng */
  gems?: number;
  odds: Partial<Record<RodRarity, number>>;
  /** 3 bậc hộp: thường / bạc / VIP — quyết định màu khung */
  tier: 1 | 2 | 3;
}

const ODDS_1 = { N: 0.78, R: 0.19, SR: 0.026, SSR: 0.0035, UR: 0.0005 };
const ODDS_2 = { N: 0.48, R: 0.38, SR: 0.12, SSR: 0.017, UR: 0.003 };
const ODDS_3 = { N: 0.18, R: 0.50, SR: 0.27, SSR: 0.04, UR: 0.01 };

export const COS_BOXES: CosBox[] = [
  { id: 'cbox_wing1', shop: 'wings', tier: 1, name: 'Hộp Lông Vũ', emoji: '🪶', price: 1500, odds: ODDS_1 },
  { id: 'cbox_wing2', shop: 'wings', tier: 2, name: 'Hộp Cánh Bạc', emoji: '🪽', price: 10000, odds: ODDS_2 },
  { id: 'cbox_wing3', shop: 'wings', tier: 3, name: 'Hộp Cánh Thần VIP', emoji: '👼', price: 0, gems: 50, odds: ODDS_3 },
  { id: 'cbox_pet1', shop: 'pets', tier: 1, name: 'Trứng Thú Cưng', emoji: '🥚', price: 2000, odds: ODDS_1 },
  { id: 'cbox_pet2', shop: 'pets', tier: 2, name: 'Trứng Bạc Lấp Lánh', emoji: '🪺', price: 12000, odds: ODDS_2 },
  { id: 'cbox_pet3', shop: 'pets', tier: 3, name: 'Trứng Rồng Hoàng Kim VIP', emoji: '🐉', price: 0, gems: 60, odds: ODDS_3 },
  { id: 'cbox_fash1', shop: 'fashion', tier: 1, name: 'Túi Mù Thời Trang', emoji: '🛍️', price: 800, odds: ODDS_1 },
  { id: 'cbox_fash2', shop: 'fashion', tier: 2, name: 'Hộp Thời Trang Bạc', emoji: '🎁', price: 6000, odds: ODDS_2 },
  { id: 'cbox_fash3', shop: 'fashion', tier: 3, name: 'Rương Dạ Hội VIP', emoji: '💝', price: 0, gems: 40, odds: ODDS_3 },
  { id: 'cbox_hat1', shop: 'hats', tier: 1, name: 'Túi Mũ Bất Ngờ', emoji: '👒', price: 700, odds: ODDS_1 },
  { id: 'cbox_hat2', shop: 'hats', tier: 2, name: 'Hộp Mũ Quý Ông', emoji: '🎩', price: 5000, odds: ODDS_2 },
  { id: 'cbox_hat3', shop: 'hats', tier: 3, name: 'Rương Vương Miện VIP', emoji: '👑', price: 0, gems: 40, odds: ODDS_3 },
  { id: 'cbox_jew1', shop: 'jewelry', tier: 1, name: 'Túi Nhung May Mắn', emoji: '👝', price: 900, odds: ODDS_1 },
  { id: 'cbox_jew2', shop: 'jewelry', tier: 2, name: 'Hộp Ngọc Trai', emoji: '🦪', price: 7000, odds: ODDS_2 },
  { id: 'cbox_jew3', shop: 'jewelry', tier: 3, name: 'Két Kim Cương VIP', emoji: '💎', price: 0, gems: 50, odds: ODDS_3 },
];
export const COS_BOX_BY_ID = Object.fromEntries(COS_BOXES.map((b) => [b.id, b]));
/** trùng món đã có → đổi vàng */
export const COS_DUP_GOLD: Record<RodRarity, number> = { N: 120, R: 450, SR: 1500, SSR: 5000, UR: 15000, MYTHIC: 50000 };

// ---------------- Cần câu: chỉ mở được từ hộp quà ngẫu nhiên

export type RodRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'MYTHIC';

export interface RodDef {
  id: string;
  name: string;
  emoji: string;
  rarity: RodRarity;
  /** cộng thêm vào độ rộng vùng xanh */
  zone: number;
  /** nhân tỉ lệ cá hiếm */
  rare: number;
  /** đẩy kích thước cá lên (0 = bình thường) */
  size: number;
  /** <1: kim chạy chậm hơn */
  slow: number;
  /** <1: cá cắn câu nhanh hơn */
  bite: number;
  /** <1: ít bị cá rỉa mồi / đứt dây hơn */
  miss: number;
  desc: string;
}

export const RODS: RodDef[] = [
  // =========================================================================
  // 1. Phẩm cấp Thường (N) - 8 cần (Đồng, Gỗ, Tre, Tự nhiên)
  // =========================================================================
  { id: 'rod_bamboo', name: 'Cần Tre Đồng Quê', emoji: '🎋', rarity: 'N', zone: 0, rare: 1.0, size: 0, slow: 1.0, bite: 1.0, miss: 1.0, desc: 'Cần câu vót từ thân tre già, mộc mạc và gần gũi với mọi cần thủ.' },
  { id: 'rod_reed', name: 'Cần Trúc Ven Sông', emoji: '🎋', rarity: 'N', zone: 0.02, rare: 1.1, size: 0.08, slow: 0.98, bite: 0.95, miss: 0.95, desc: 'Thân trúc mảnh dẻ, vung cần êm ái, kéo cá nhỏ rất nhẹ tay.' },
  { id: 'rod_wood', name: 'Cần Gỗ Lim Cổ Thụ', emoji: '🪵', rarity: 'N', zone: 0.03, rare: 1.2, size: 0.12, slow: 0.97, bite: 0.92, miss: 0.92, desc: 'Gọt đẽo từ thân gỗ lim rừng sâu, chắc nịch và bền bỉ trước mưa nắng.' },
  { id: 'rod_pine', name: 'Cần Bách Tùng Rừng Già', emoji: '🌲', rarity: 'N', zone: 0.04, rare: 1.25, size: 0.15, slow: 0.96, bite: 0.9, miss: 0.9, desc: 'Gỗ bách tỏa hương thơm dịu nhẹ làm cá bớt cảnh giác khi rỉa mồi.' },
  { id: 'rod_bronze_old', name: 'Cần Cổ Đồng Đầm Lầy', emoji: '🥉', rarity: 'N', zone: 0.045, rare: 1.3, size: 0.18, slow: 0.95, bite: 0.88, miss: 0.88, desc: 'Đúc từ đồng cổ xỉn màu vớt dưới đáy đầm, dìm phao rất đầm và vững.' },
  { id: 'rod_willow', name: 'Cần Liễu Rủ Bờ Suối', emoji: '🌿', rarity: 'N', zone: 0.05, rare: 1.32, size: 0.2, slow: 0.94, bite: 0.86, miss: 0.86, desc: 'Độ dẻo uốn lượn như cành liễu mùa xuân, cá giãy giụa cũng khó gãy cần.' },
  { id: 'rod_clay', name: 'Cần Gốm Nung Men Ngọc', emoji: '🏺', rarity: 'N', zone: 0.055, rare: 1.35, size: 0.22, slow: 0.93, bite: 0.85, miss: 0.85, desc: 'Lớp men gốm gia truyền giữ mồi câu lan tỏa mùi thơm ngát dưới nước.' },
  { id: 'rod_oak', name: 'Cần Gỗ Sồi Ngàn Năm', emoji: '🌰', rarity: 'N', zone: 0.06, rare: 1.38, size: 0.24, slow: 0.92, bite: 0.84, miss: 0.84, desc: 'Gỗ sồi cổ thụ đanh chắc, chịu được va đập trước đá ngầm và xoáy nước.' },

  // =========================================================================
  // 2. Phẩm cấp Hiếm (R) - 10 cần (Đồng tinh luyện, Bạc, Sắt, Thép, Xương, Hợp kim)
  // =========================================================================
  { id: 'rod_iron', name: 'Cần Thiết Tinh Lò Rèn', emoji: '🎣', rarity: 'R', zone: 0.065, rare: 1.45, size: 0.26, slow: 0.91, bite: 0.82, miss: 0.82, desc: 'Sắt tôi luyện qua than hồng, chịu lực kéo cá nặng vùng nước chảy xiết.' },
  { id: 'rod_alu', name: 'Cần Hợp Kim Nhôm Hàng Không', emoji: '🎣', rarity: 'R', zone: 0.07, rare: 1.55, size: 0.3, slow: 0.9, bite: 0.8, miss: 0.8, desc: 'Siêu nhẹ và dẻo dai, cần thủ có thể vung cần cả ngày không mỏi tay.' },
  { id: 'rod_fiber', name: 'Cần Sợi Thủy Tinh Cao Cấp', emoji: '🪢', rarity: 'R', zone: 0.075, rare: 1.65, size: 0.35, slow: 0.89, bite: 0.78, miss: 0.76, desc: 'Sợi thủy tinh đan dệt tinh vi, cảm nhận được từng cú rỉa mồi nhỏ nhất.' },
  { id: 'rod_bone', name: 'Cần Bạch Cốt Cự Ngư', emoji: '🦴', rarity: 'R', zone: 0.08, rare: 1.75, size: 0.4, slow: 0.88, bite: 0.75, miss: 0.72, desc: 'Khắc từ xương gai lưng của cá khổng lồ tiền sử, mang linh khí thu hút đồng loại.' },
  { id: 'rod_copper_refined', name: 'Cần Đồng Đỏ Tinh Luyện', emoji: '🥉', rarity: 'R', zone: 0.085, rare: 1.85, size: 0.45, slow: 0.87, bite: 0.73, miss: 0.68, desc: 'Đồng đỏ dẫn truyền xung lực siêu nhạy, phát hiện cá ngậm mồi trong tích tắc.' },
  { id: 'rod_steel', name: 'Cần Thép Mạ Crôm Sáng Bóng', emoji: '⚙️', rarity: 'R', zone: 0.09, rare: 1.9, size: 0.48, slow: 0.86, bite: 0.71, miss: 0.65, desc: 'Thép hợp kim chống rỉ sét nước mặn, chịu được những cú giật bất ngờ của cá dữ.' },
  { id: 'rod_coral', name: 'Cần San Hô Thềm Lục Địa', emoji: '🪸', rarity: 'R', zone: 0.095, rare: 1.95, size: 0.5, slow: 0.85, bite: 0.69, miss: 0.62, desc: 'Khảm vụn san hô biển sâu, tỏa hương biển khơi kích thích cá háu ăn.' },
  { id: 'rod_amber', name: 'Cần Hổ Phách Hóa Thạch', emoji: '🪨', rarity: 'R', zone: 0.1, rare: 2.05, size: 0.52, slow: 0.84, bite: 0.67, miss: 0.6, desc: 'Lõi hổ phách triệu năm tỏa sắc cam ấm, khiến cá tò mò vây quanh phao.' },
  { id: 'rod_silver_plain', name: 'Cần Bạc Trắng Tinh Khiết', emoji: '🥈', rarity: 'R', zone: 0.105, rare: 2.15, size: 0.55, slow: 0.83, bite: 0.65, miss: 0.58, desc: 'Bạc trắng đánh bóng phản chiếu mặt nước, lưỡi câu bén ngót chống sẩy cá.' },
  { id: 'rod_abyss_stone', name: 'Cần Huyền Thạch Đáy Vực', emoji: '🌑', rarity: 'R', zone: 0.11, rare: 2.25, size: 0.58, slow: 0.82, bite: 0.63, miss: 0.55, desc: 'Đá đen đáy vực sâu hấp thụ sóng ngầm, giữ phao thăng bằng trước xoáy nước.' },

  // =========================================================================
  // 3. Phẩm cấp Siêu Hiếm (SR) - 10 cần (Bạc Nguyệt Quang, Pha Lê, Carbon, Cực Quang, Bạch Kim)
  // =========================================================================
  { id: 'rod_carbon', name: 'Cần Carbon Thi Đấu Quốc Tế', emoji: '🎣', rarity: 'SR', zone: 0.115, rare: 2.35, size: 0.6, slow: 0.81, bite: 0.61, miss: 0.52, desc: 'Vật liệu carbon đa lớp cao cấp chuyên dùng cho các giải vô địch thế giới.' },
  { id: 'rod_silver', name: 'Cần Bạch Ngân Nguyệt Quang', emoji: '🥈', rarity: 'SR', zone: 0.12, rare: 2.5, size: 0.65, slow: 0.8, bite: 0.59, miss: 0.5, desc: 'Bạc nguyên chất dát mỏng phản chiếu ánh trăng, cá dưới đáy sâu nhìn thấy là mê mẩn.' },
  { id: 'rod_crystal', name: 'Cần Băng Tinh Pha Lê', emoji: '💎', rarity: 'SR', zone: 0.125, rare: 2.65, size: 0.7, slow: 0.79, bite: 0.57, miss: 0.48, desc: 'Kết tinh từ khối băng vĩnh cửu, tỏa ra luồng hàn khí làm cá cắn câu chậm chạp dễ bắt.' },
  { id: 'rod_aurora', name: 'Cần Cực Quang Ảo Diệu', emoji: '🌌', rarity: 'SR', zone: 0.13, rare: 2.8, size: 0.75, slow: 0.78, bite: 0.55, miss: 0.45, desc: 'Ánh sáng 7 sắc cực quang lượn lờ quanh cần, mê hoặc cả những loài cá lẩn khuất nhất.' },
  { id: 'rod_platinum', name: 'Cần Bạch Kim Quý Tộc', emoji: '✨', rarity: 'SR', zone: 0.135, rare: 2.95, size: 0.8, slow: 0.77, bite: 0.53, miss: 0.42, desc: 'Đúc bằng bạch kim sáng lóa, phong thái quý tộc thu hút các loài cá thượng lưu.' },
  { id: 'rod_amethyst', name: 'Cần Thạch Anh Tím Hoàng Gia', emoji: '🔮', rarity: 'SR', zone: 0.14, rare: 3.1, size: 0.85, slow: 0.76, bite: 0.51, miss: 0.4, desc: 'Viên ngọc thạch anh tím tích tụ linh khí đất trời, cá bơi ngang qua liền mê muội cắn câu.' },
  { id: 'rod_topaz', name: 'Cần Hoàng Ngọc Sa Mạc', emoji: '🔶', rarity: 'SR', zone: 0.145, rare: 3.25, size: 0.88, slow: 0.75, bite: 0.49, miss: 0.38, desc: 'Thạch anh vàng ấm áp, tăng tốc độ giật mồi và khả năng bắt cá cỡ đại.' },
  { id: 'rod_obsidian', name: 'Cần Hắc Diệu Thạch Dung Nham', emoji: '🌋', rarity: 'SR', zone: 0.15, rare: 3.4, size: 0.9, slow: 0.74, bite: 0.47, miss: 0.36, desc: 'Thủy tinh núi lửa đen huyền bí, lưỡi câu nung đỏ khiến cá dữ ngoan ngoãn mắc câu.' },
  { id: 'rod_emerald_mist', name: 'Cần Lục Bảo Lam Sương', emoji: '🍃', rarity: 'SR', zone: 0.155, rare: 3.55, size: 0.92, slow: 0.73, bite: 0.45, miss: 0.34, desc: 'Ngưng đọng từ giọt sương rừng nguyên sinh, vung cần êm ru không một tiếng động.' },
  { id: 'rod_pearl', name: 'Cần Dạ Minh Châu Đại Dương', emoji: '🦪', rarity: 'SR', zone: 0.16, rare: 3.7, size: 0.95, slow: 0.72, bite: 0.43, miss: 0.32, desc: 'Đính ngọc trai phát quang dưới đáy biển sâu, chiếu sáng dẫn đường cho cá khủng cắn câu.' },

  // =========================================================================
  // 4. Phẩm cấp Cực Hiếm (SSR) - 10 cần (Vàng Ròng, Kim Cương, Huyết Ngọc, Sét, Lam Ngọc)
  // =========================================================================
  { id: 'rod_gold', name: 'Cần Hoàng Kim Phú Quý', emoji: '🏆', rarity: 'SSR', zone: 0.165, rare: 3.9, size: 1.0, slow: 0.71, bite: 0.41, miss: 0.3, desc: 'Đúc từ vàng khối 24K nạm ngọc trai, cá to và cá quý tìm tới như bị nam châm hút.' },
  { id: 'rod_jade', name: 'Cần Bích Ngọc Tiên Cảnh', emoji: '💚', rarity: 'SSR', zone: 0.17, rare: 4.1, size: 1.05, slow: 0.7, bite: 0.39, miss: 0.28, desc: 'Báu vật ngọc bích của tiên nhân để lại bờ hồ, tẩy sạch tạp khí, rước lộc đầy thuyền.' },
  { id: 'rod_ruby', name: 'Cần Huyết Ngọc Liệt Hỏa', emoji: '🔴', rarity: 'SSR', zone: 0.175, rare: 4.35, size: 1.1, slow: 0.69, bite: 0.37, miss: 0.26, desc: 'Viên hồng ngọc bốc lửa gắn đầu cần truyền sức mạnh vô song khi giằng co với cá dữ.' },
  { id: 'rod_thunder', name: 'Cần Lôi Đình Phong Bạo', emoji: '⚡', rarity: 'SSR', zone: 0.18, rare: 4.6, size: 1.15, slow: 0.68, bite: 0.35, miss: 0.24, desc: 'Hấp thụ tia sét của mây bão, phóng xung điện khiến cá khổng lồ choáng váng ngoan ngoãn lên bờ.' },
  { id: 'rod_diamond', name: 'Cần Kim Cương Hoàng Gia Vĩnh Cửu', emoji: '💎', rarity: 'SSR', zone: 0.185, rare: 4.9, size: 1.2, slow: 0.67, bite: 0.33, miss: 0.22, desc: 'Chế tác từ kim cương nguyên khối phản chiếu vạn ánh hào quang, độ cứng vô song không loài thủy quái nào bẻ gãy!' },
  { id: 'rod_sapphire', name: 'Cần Lam Ngọc Hải Uyên', emoji: '🔷', rarity: 'SSR', zone: 0.19, rare: 5.15, size: 1.25, slow: 0.66, bite: 0.31, miss: 0.2, desc: 'Trái tim của đại dương kết tinh trong viên lam ngọc xanh thẳm, điều khiển dòng hải lưu đưa cá quý vào lưới.' },
  { id: 'rod_magma', name: 'Cần Nham Thạch Địa Ngục', emoji: '🔥', rarity: 'SSR', zone: 0.195, rare: 5.4, size: 1.3, slow: 0.65, bite: 0.3, miss: 0.19, desc: 'Dòng dung nham cuồn cuộn chảy dọc thân cần, thiêu rụi sức chống cự của các loài cá săn mồi hung hãn nhất.' },
  { id: 'rod_rainbow', name: 'Cần Cầu Vồng Thất Sắc Thần Kỳ', emoji: '🌈', rarity: 'SSR', zone: 0.2, rare: 5.7, size: 1.35, slow: 0.64, bite: 0.29, miss: 0.18, desc: 'Hòa quyện hào quang 7 màu sau cơn mưa thần thoại, tăng mạnh tỷ lệ gặp cá đột biến sắc tố cỡ đại.' },
  { id: 'rod_sun_gold', name: 'Cần Thái Dương Kim Quang', emoji: '☀️', rarity: 'SSR', zone: 0.205, rare: 6.0, size: 1.4, slow: 0.63, bite: 0.28, miss: 0.17, desc: 'Tích tụ năng lượng mặt trời chói lọi, cá cắn câu như bị thiêu đốt ý chí chạy trốn.' },
  { id: 'rod_moon_shadow', name: 'Cần Nguyệt Ảnh U Linh', emoji: '🌙', rarity: 'SSR', zone: 0.21, rare: 6.3, size: 1.45, slow: 0.62, bite: 0.27, miss: 0.16, desc: 'Tỏa ánh sáng huyền bí của vầng trăng khuyết, câu cá đêm và cá kỳ dị đạt hiệu suất đỉnh cao.' },

  // =========================================================================
  // 5. Phẩm cấp Huyền Thoại (UR) - 7 cần (Thần Thú, Hải Thần, Vực Sâu, Sen Vàng)
  // =========================================================================
  { id: 'rod_dragon', name: 'Cần Long Vương Trấn Hải', emoji: '🐉', rarity: 'UR', zone: 0.22, rare: 7.0, size: 1.55, slow: 0.6, bite: 0.25, miss: 0.14, desc: 'Cần câu mang hình rồng vàng uốn lượn, uy nghi thống trị vạn dặm đầm hồ sông suối.' },
  { id: 'rod_phoenix', name: 'Cần Chu Tước Niết Bàn', emoji: '🪶', rarity: 'UR', zone: 0.23, rare: 7.5, size: 1.6, slow: 0.58, bite: 0.24, miss: 0.13, desc: 'Kết thành từ lông đuôi Phượng Hoàng Lửa, cá cắn câu liền bốc lên vầng hào quang rực rỡ.' },
  { id: 'rod_poseidon', name: 'Cần Hải Thần Tam Xoa Poseidon', emoji: '🔱', rarity: 'UR', zone: 0.24, rare: 8.2, size: 1.7, slow: 0.56, bite: 0.23, miss: 0.12, desc: 'Rèn từ mũi đinh ba của Thần Biển Poseidon — lệnh cho muôn loài thủy quái quy phục!' },
  { id: 'rod_leviathan', name: 'Cần Nanh Băng Cự Thú Leviathan', emoji: '❄️', rarity: 'UR', zone: 0.25, rare: 9.0, size: 1.8, slow: 0.54, bite: 0.22, miss: 0.11, desc: 'Khắc từ nanh băng của quái thú Leviathan Bắc Cực, đóng băng mặt nước khóa chặt cá khổng lồ.' },
  { id: 'rod_kraken', name: 'Cần Xúc Tu Hắc Hải Kraken', emoji: '🐙', rarity: 'UR', zone: 0.26, rare: 9.8, size: 1.9, slow: 0.52, bite: 0.21, miss: 0.1, desc: 'Ẩn chứa bóng tối của chúa tể biển sâu Kraken, dây cước dẻo dai siết chặt không một con mồi nào thoát nổi.' },
  { id: 'rod_valkyrie', name: 'Cần Chiến Nữ Valkyrie Thiên Giới', emoji: '⚔️', rarity: 'UR', zone: 0.27, rare: 10.5, size: 2.0, slow: 0.5, bite: 0.2, miss: 0.09, desc: 'Mang phước lành của các nữ chiến thần Valhalla, giật cần với uy lực thần thánh chém đứt mọi giằng co.' },
  { id: 'rod_lotus', name: 'Cần Cửu Phẩm Kim Liên Bồ Đề', emoji: '🪷', rarity: 'UR', zone: 0.28, rare: 11.5, size: 2.1, slow: 0.48, bite: 0.19, miss: 0.08, desc: 'Hoa sen vàng 9 cánh bung nở nơi ngọn cần, thuần hóa dịu êm cả những loài cá khổng lồ hung bạo nhất.' },

  // =========================================================================
  // 6. Phẩm cấp Thần Thoại / Tối Thượng (MYTHIC) - 5 cần (Vũ Trụ, Khởi Nguyên, Thời Gian, Thế Giới Thụ, Lỗ Đen)
  // =========================================================================
  { id: 'rod_genesis', name: 'Cần Khởi Nguyên Tối Thượng', emoji: '👑', rarity: 'MYTHIC', zone: 0.3, rare: 13.0, size: 2.3, slow: 0.45, bite: 0.17, miss: 0.06, desc: 'Tuyệt phẩm tối thượng của Vũ Trụ — Thức tỉnh sức mạnh cực hạn thu hút Thần Ngư huyền thoại!' },
  { id: 'rod_galaxy', name: 'Cần Tinh Cầu Ngân Hà Vũ Trụ', emoji: '🌌', rarity: 'MYTHIC', zone: 0.32, rare: 14.5, size: 2.45, slow: 0.43, bite: 0.15, miss: 0.05, desc: 'Mang một dải ngân hà xoay quanh ngọn cần, trường trọng lực vũ trụ tự động hút trọn các loài cá huyền bí về phía bạn!' },
  { id: 'rod_chronos', name: 'Cần Thời Không Vĩnh Hằng Chronos', emoji: '⏳', rarity: 'MYTHIC', zone: 0.34, rare: 16.0, size: 2.6, slow: 0.4, bite: 0.13, miss: 0.04, desc: 'Thao túng dòng thời gian, làm chậm chuyển động của cá xuống mức gần như bất động, câu cá bách phát bách trúng!' },
  { id: 'rod_chaos', name: 'Cần Hỗn Độn Thế Giới Thụ Yggdrasil', emoji: '🌳', rarity: 'MYTHIC', zone: 0.36, rare: 17.5, size: 2.75, slow: 0.38, bite: 0.11, miss: 0.03, desc: 'Gọt đẽo từ nhánh Thần Thụ kết nối 9 cõi thế giới, năng lượng sinh mệnh nguyên thủy gọi đàn cá nghìn năm tụ hội!' },
  { id: 'rod_singularity', name: 'Cần Điểm Kỳ Dị Lỗ Đen Vô Cực', emoji: '🌀', rarity: 'MYTHIC', zone: 0.38, rare: 20.0, size: 3.0, slow: 0.35, bite: 0.1, miss: 0.02, desc: 'Đỉnh cao tối hậu không gian vũ trụ: Lỗ đen siêu vi mô tại ngọn cần bẻ cong thực tại, nuốt trọn mọi kỷ lục câu cá toàn server!' },
];

export const ROD_BY_ID = Object.fromEntries(RODS.map((r) => [r.id, r]));

export const RARITY_COLOR: Record<RodRarity, string> = {
  N: '#9a9282',
  R: '#3d7cc8',
  SR: '#8e4dc8',
  SSR: '#e0a020',
  UR: '#e8402a',
  MYTHIC: '#ff007f',
};

export const RARITY_NAME: Record<RodRarity, string> = {
  N: 'Thường',
  R: 'Hiếm',
  SR: 'Siêu Hiếm',
  SSR: 'Cực Hiếm',
  UR: 'Huyền Thoại',
  MYTHIC: 'Thần Thoại',
};

export const RARITY_STARS: Record<RodRarity, number> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
  MYTHIC: 6,
};

export interface RodBox {
  id: string;
  name: string;
  emoji: string;
  price: number;
  gems?: number;
  odds: Partial<Record<RodRarity, number>>;
  durationOdds?: { '1d': number; '3d': number; '7d': number; perm: number };
  desc: string;
}

export const ROD_BOXES: RodBox[] = [
  {
    id: 'box_wood',
    name: 'Hộp Cần Câu Gỗ Sơ Cấp',
    emoji: '📦',
    price: 600,
    desc: 'Hộp cần thông dụng sơ cấp dành cho cần thủ mới, mở ra các loại cần câu cơ bản và cơ hội nhận Cần Vĩnh Viễn.',
    odds: { N: 0.745, R: 0.20, SR: 0.05, SSR: 0.0045, UR: 0.0005 },
    durationOdds: { '1d': 0.94, '3d': 0.05, '7d': 0.009999, perm: 0.000001 },
  },
  {
    id: 'box_silver',
    name: 'Hộp Cần Câu Bạc Tinh Chế',
    emoji: '🎁',
    price: 3800,
    desc: 'Hộp cần bạc tinh chế gia công tỉ mỉ, tăng cơ hội nhận được các loại cần câu hiếm và sở hữu vĩnh viễn.',
    odds: { N: 0.62, R: 0.27, SR: 0.09, SSR: 0.017, UR: 0.0028, MYTHIC: 0.0002 },
    durationOdds: { '1d': 0.90, '3d': 0.08, '7d': 0.01999, perm: 0.00001 },
  },
  {
    id: 'box_gold',
    name: 'Hộp Cần Hoàng Kim VIP',
    emoji: '💝',
    price: 0,
    gems: 45,
    desc: 'Hộp VIP mở rộng thượng hạng, khai mở cần câu cấp cao và cơ hội sở hữu Cần Vĩnh Viễn quý giá.',
    odds: { N: 0.524, R: 0.35, SR: 0.10, SSR: 0.02, UR: 0.0055, MYTHIC: 0.0005 },
    durationOdds: { '1d': 0.85, '3d': 0.115, '7d': 0.03495, perm: 0.00005 },
  },
  {
    id: 'box_mythic',
    name: 'Hộp Cần Thần Thoại Vô Cực',
    emoji: '👑',
    price: 0,
    gems: 120,
    desc: 'Rương VIP tối thượng chứa đựng linh khí biển sâu, cơ hội khai mở Cần Câu Thần Thoại Vô Cực độc nhất vô nhị.',
    odds: { N: 0.45, R: 0.42, SR: 0.10, SSR: 0.02, UR: 0.0085, MYTHIC: 0.0015 },
    durationOdds: { '1d': 0.80, '3d': 0.14, '7d': 0.0599, perm: 0.0001 },
  },
];

/** mở trùng cần đã có vĩnh viễn → đổi thành vàng tương ứng */
export const ROD_DUP_GOLD: Record<RodRarity, number> = {
  N: 200,
  R: 800,
  SR: 2500,
  SSR: 8000,
  UR: 25000,
  MYTHIC: 60000,
};

export interface BaitDef {
  id: string;
  name: string;
  emoji: string;
  rarity: RodRarity;
  rare: number;
  superRareMult: number;
  bite: number;
  size: number;
  target: string;
  desc: string;
}

export const BAITS: BaitDef[] = [
  {
    id: 'bait_worm',
    name: 'Mồi Giun Đào Đất Đỏ',
    emoji: '🪱',
    rarity: 'N',
    rare: 1.0,
    superRareMult: 1,
    bite: 1.0,
    size: 0,
    target: 'Cá nước ngọt bờ hồ & suối cạn (Chép, Diếc, Rô)',
    desc: 'Giun đất đỏ tươi đào sau mưa, ngọ nguậy tự nhiên dưới nước, mồi câu kinh điển của mọi cần thủ.',
  },
  {
    id: 'bait_dough',
    name: 'Mồi Cám Thơm Ngũ Cốc',
    emoji: '🌾',
    rarity: 'N',
    rare: 1.3,
    superRareMult: 2,
    bite: 0.92,
    size: 0.08,
    target: 'Cá ăn cỏ & cá đàn mặt nước (Trắm, Mè, Cá Vàng)',
    desc: 'Ủ từ bột ngô nếp, khoai lang mật và cám gạo rang thơm lừng, tan chậm tạo ổ dụ đàn cá kéo tới.',
  },
  {
    id: 'bait_cricket',
    name: 'Mồi Dế Cơm Béo Ngậy',
    emoji: '🦗',
    rarity: 'R',
    rare: 1.7,
    superRareMult: 4,
    bite: 0.85,
    size: 0.15,
    target: 'Cá suối đá & cá phàm ăn tầng giữa (Cá Quả, Cá Lăng)',
    desc: 'Dế cơm đồng quê béo tròn, đôi càng đạp nước tạo sóng âm kích thích cá săn mồi đớp câu nhanh.',
  },
  {
    id: 'bait_shrimp',
    name: 'Mồi Tôm Bạc Tươi Sống',
    emoji: '🦐',
    rarity: 'R',
    rare: 2.6,
    superRareMult: 12,
    bite: 0.76,
    size: 0.28,
    target: 'Cá dữ đầm lầy & cửa biển (Cá Lóc, Cá Chình, Cá Vược)',
    desc: 'Tôm sông vỏ bạc búng khỏe, mùi tanh nồng nàn lan xa trong nước dụ cá săn mồi cỡ lớn.',
  },
  {
    id: 'bait_squid',
    name: 'Mồi Mực Ống Cắt Khứa',
    emoji: '🦑',
    rarity: 'SR',
    rare: 3.8,
    superRareMult: 30,
    bite: 0.7,
    size: 0.4,
    target: 'Cá đại dương & Vịnh San Hô (Cá Ngừ, Cá Kiếm, Cá Đuối)',
    desc: 'Thịt mực ống biển trắng ngần khứa vảy rồng, dai chắc không sợ cá nhỏ rỉa mất, chuyên trị cá biển lớn.',
  },
  {
    id: 'bait_glow',
    name: 'Mồi Sứa Dạ Quang Vực Thẳm',
    emoji: '🪼',
    rarity: 'SR',
    rare: 5.2,
    superRareMult: 75,
    bite: 0.64,
    size: 0.52,
    target: 'Cá câu đêm, Vực Sâu Đại Dương & Đảo Băng',
    desc: 'Tinh chất xúc tu sứa phát quang sinh học xanh-tím, tỏa sáng ma mị dưới đáy vực tối tăm thu hút cá kỳ dị.',
  },
  {
    id: 'bait_lure_silver',
    name: 'Mồi Cá Giả Bạc Cơ Khí',
    emoji: '🐟',
    rarity: 'SSR',
    rare: 7.0,
    superRareMult: 150,
    bite: 0.58,
    size: 0.68,
    target: 'Cá săn mồi đầu bảng & Cá Mập (Mọi vùng nước)',
    desc: 'Mồi Minnow 3D mạ bạc gắn thìa xoay phản quang và bi tạo sóng âm, khiêu khích bản năng săn mồi của cự ngư.',
  },
  {
    id: 'bait_gold',
    name: 'Mồi Kim Thiền Hoàng Kim',
    emoji: '🐝',
    rarity: 'SSR',
    rare: 9.5,
    superRareMult: 350,
    bite: 0.5,
    size: 0.85,
    target: 'Cá Quý Hiếm, Cá Hoàng Gia & Cá Đột Biến Cỡ Đại',
    desc: 'Nhộng ve sầu phủ bụi vàng 24K tẩm xạ hương thượng hạng và mật hoa ngàn năm, cá quý tranh nhau đớp mồi.',
  },
  {
    id: 'bait_dragon_blood',
    name: 'Mồi Huyết Tinh Hải Vương',
    emoji: '🩸',
    rarity: 'UR',
    rare: 14.0,
    superRareMult: 1000,
    bite: 0.42,
    size: 1.05,
    target: 'Thủy Quái Biển Sâu & Cá Bậc Huyền Thoại',
    desc: 'Viên huyết tinh cô đặc từ máu thủy quái cổ đại, tỏa xung năng lượng đỏ thẫm triệu hồi bá chủ vùng nước.',
  },
  {
    id: 'bait_abyss',
    name: 'Mồi Long Châu Thần Thoại',
    emoji: '🔮',
    rarity: 'MYTHIC',
    rare: 20.0,
    superRareMult: 2500,
    bite: 0.35,
    size: 1.35,
    target: 'Đánh Thức Thần Ngư & Cá Thần Thoại Độc Bản',
    desc: 'Bảo châu kết tinh linh khí Long Vương ngàn năm, tỏa hào quang ngũ sắc đánh thức Thần Ngư ẩn mình dưới đáy thế giới!',
  },
];

export const BAIT_BY_ID = Object.fromEntries(BAITS.map((b) => [b.id, b]));

export interface BaitShopItem {
  id: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
  gems?: number;
  desc: string;
}

export const BAIT_SHOP: BaitShopItem[] = [
  { id: 'bait_worm', name: 'Mồi Giun Đào Đất Đỏ', emoji: '🪱', qty: 10, price: 40, desc: 'Hộp 10 con giun đào tươi rói' },
  { id: 'bait_dough', name: 'Mồi Cám Thơm Ngũ Cốc', emoji: '🌾', qty: 10, price: 85, desc: 'Túi 10 viên cám ngũ cốc ủ mật' },
  { id: 'bait_cricket', name: 'Mồi Dế Cơm Béo Ngậy', emoji: '🦗', qty: 10, price: 150, desc: 'Lồng 10 con dế cơm đồng quê' },
  { id: 'bait_shrimp', name: 'Mồi Tôm Bạc Tươi Sống', emoji: '🦐', qty: 10, price: 320, desc: 'Giỏ 10 con tôm bạc búng khỏe' },
  { id: 'bait_squid', name: 'Mồi Mực Ống Cắt Khứa', emoji: '🦑', qty: 10, price: 580, desc: 'Khay 10 miếng mực biển khứa vảy' },
  { id: 'bait_glow', name: 'Mồi Sứa Dạ Quang Vực Thẳm', emoji: '🪼', qty: 10, price: 880, desc: 'Lọ 10 mồi sứa phát sáng đáy vực' },
  { id: 'bait_lure_silver', name: 'Mồi Cá Giả Bạc Cơ Khí', emoji: '🐟', qty: 10, price: 1380, desc: 'Hộp 10 mồi cá giả Minnow 3D' },
  { id: 'bait_gold', name: 'Mồi Kim Thiền Hoàng Kim', emoji: '🐝', qty: 10, price: 2100, desc: 'Tráp 10 nhộng vàng 24K tẩm xạ hương' },
  { id: 'bait_dragon_blood', name: 'Mồi Huyết Tinh Hải Vương', emoji: '🩸', qty: 10, price: 0, gems: 12, desc: '10 viên huyết tinh triệu hồi Thủy Quái' },
  { id: 'bait_abyss', name: 'Mồi Long Châu Thần Thoại', emoji: '🔮', qty: 10, price: 0, gems: 20, desc: '10 viên Long Châu đánh thức Thần Ngư!' },
];

/** Hộp mồi may mắn: rẻ, ra ngẫu nhiên đầy đủ 10 loại mồi */
export const BAIT_BOX = {
  price: 60,
  min: 6,
  max: 14,
  odds: {
    bait_worm: 0.34,
    bait_dough: 0.24,
    bait_cricket: 0.16,
    bait_shrimp: 0.11,
    bait_squid: 0.06,
    bait_glow: 0.04,
    bait_lure_silver: 0.025,
    bait_gold: 0.015,
    bait_dragon_blood: 0.007,
    bait_abyss: 0.003,
  } as Record<string, number>,
};

export type KiteShape = 'diamond' | 'delta' | 'box' | 'star' | 'fish' | 'butterfly' | 'bird' | 'dragon' | 'cloud';
export type KiteTail = 'ribbon' | 'bows' | 'flame' | 'sparkle' | 'none';

export interface KiteDef {
  id: string;
  name: string;
  emoji: string;
  rarity: RodRarity;
  /** bán thẳng ở tiệm (không có giá = chỉ ra từ hộp diều) */
  price?: number;
  gems?: number;
  /** Gió lành: nhân vàng từ quái trong `minutes` phút */
  mult: number;
  minutes: number;
  /** [màu chính, màu phụ, màu điểm nhấn] */
  colors: [string, string, string?];
  shape: KiteShape;
  tail: KiteTail;
  desc: string;
}

// Hình vẽ: art/kiteArt.ts · Độ bền, tốc độ & kỹ năng khi bay: config/kitegame.ts (KITE_PLAY)
export const KITES: KiteDef[] = [
  { id: 'kite_paper', name: 'Diều giấy', emoji: '🪁', rarity: 'N', price: 100, mult: 1.15, minutes: 4, colors: ['#f4f0e8', '#3d6fd1'], shape: 'diamond', tail: 'bows', desc: 'Chiếc diều đầu tiên của mọi đứa trẻ' },
  { id: 'kite_fish', name: 'Diều cá chép', emoji: '🎏', rarity: 'N', mult: 1.15, minutes: 4, colors: ['#f06030', '#f4f0e8', '#1a1208'], shape: 'fish', tail: 'none', desc: 'Cá chép vượt vũ môn — hút xu quanh mình' },
  { id: 'kite_star', name: 'Diều ngôi sao', emoji: '⭐', rarity: 'N', mult: 1.15, minutes: 5, colors: ['#f2c230', '#fff6c8'], shape: 'star', tail: 'ribbon', desc: 'Sao may mắn — trời rơi nhiều túi quà hơn' },
  { id: 'kite_butterfly', name: 'Diều cánh bướm', emoji: '🦋', rarity: 'R', price: 1500, mult: 1.2, minutes: 6, colors: ['#f06090', '#9a5ad8', '#ffe680'], shape: 'butterfly', tail: 'ribbon', desc: 'Lượn uyển chuyển, đón gió lâu hơn' },
  { id: 'kite_owl', name: 'Diều cú mèo', emoji: '🦉', rarity: 'R', mult: 1.2, minutes: 6, colors: ['#8a6a4a', '#f2d8a8', '#f2c230'], shape: 'bird', tail: 'bows', desc: 'Cú canh đêm — có khiên đỡ 1 cú va' },
  { id: 'kite_box', name: 'Diều hộp', emoji: '📦', rarity: 'R', mult: 1.2, minutes: 6, colors: ['#e8402a', '#f4f0e8'], shape: 'box', tail: 'none', desc: 'Khung hộp chắc chắn — xu nhặt được giá trị hơn' },
  { id: 'kite_eagle', name: 'Diều đại bàng', emoji: '🦅', rarity: 'SR', price: 6000, mult: 1.25, minutes: 8, colors: ['#8a5a2e', '#f4f0e8', '#f2c230'], shape: 'bird', tail: 'none', desc: 'Chúa tể bầu trời — chim nhỏ tránh xa' },
  { id: 'kite_flute', name: 'Diều sáo', emoji: '🎶', rarity: 'SR', mult: 1.25, minutes: 8, colors: ['#3a8a5a', '#f2e8c8', '#c8402f'], shape: 'delta', tail: 'ribbon', desc: 'Diều sáo đồng quê — gió đẩy mạnh và lâu' },
  { id: 'kite_cloud', name: 'Diều mây trắng', emoji: '☁️', rarity: 'SR', mult: 1.25, minutes: 8, colors: ['#ffffff', '#9fd3f0', '#5a8ac8'], shape: 'cloud', tail: 'ribbon', desc: 'Hòa vào mây giông — sét đánh không trúng' },
  { id: 'kite_phoenix', name: 'Diều phượng hoàng', emoji: '🔥', rarity: 'SSR', mult: 1.3, minutes: 10, colors: ['#e8402a', '#f2c230', '#fff2b0'], shape: 'bird', tail: 'flame', desc: 'Lửa thiêng hộ thân — 2 lớp khiên, xu sáng hơn' },
  { id: 'kite_rainbow', name: 'Diều cầu vồng', emoji: '🌈', rarity: 'SSR', mult: 1.3, minutes: 10, colors: ['#e8402a', '#3d8fe0', '#f2c230'], shape: 'delta', tail: 'sparkle', desc: 'Cuối cầu vồng là kho báu — quà ×2, hút xu xa' },
  { id: 'kite_dragon', name: 'Diều rồng VIP', emoji: '🐉', rarity: 'UR', price: 0, gems: 60, mult: 1.35, minutes: 12, colors: ['#e8402a', '#f2c230', '#2f9a5a'], shape: 'dragon', tail: 'none', desc: 'Rồng cưỡi mây — miễn sét, có khiên, hút xu' },
  { id: 'kite_galaxy', name: 'Diều ngân hà', emoji: '🌌', rarity: 'UR', mult: 1.4, minutes: 12, colors: ['#2a1a5a', '#b070ff', '#7fe8ff'], shape: 'star', tail: 'sparkle', desc: 'Huyền thoại sao trời — mọi chỉ số đều đỉnh' },
];

export const KITE_BY_ID = Object.fromEntries(KITES.map((k) => [k.id, k]));

export interface KiteBox {
  id: string;
  name: string;
  emoji: string;
  tier: 1 | 2 | 3;
  price: number;
  gems?: number;
  odds: Partial<Record<RodRarity, number>>;
}

/** Hộp diều ngẫu nhiên — mở ×10 chắc chắn có SR trở lên */
export const KITE_BOXES: KiteBox[] = [
  { id: 'kbox_1', name: 'Túi Diều May Mắn', emoji: '🎐', tier: 1, price: 800, odds: ODDS_1 },
  { id: 'kbox_2', name: 'Hộp Diều Bạc', emoji: '🎁', tier: 2, price: 5000, odds: ODDS_2 },
  { id: 'kbox_3', name: 'Rương Diều Rồng VIP', emoji: '🏮', tier: 3, price: 0, gems: 50, odds: ODDS_3 },
];
/** trùng diều đã có → đổi vàng */
export const KITE_DUP_GOLD: Record<RodRarity, number> = { N: 100, R: 400, SR: 1400, SSR: 4500, UR: 14000, MYTHIC: 50000 };

/** Chuyển đổi chỉ số câu cá sang phẩm chất RPG tinh tế, loại bỏ hoàn toàn số % */
export function getRareTier(rare: number): string {
  if (rare >= 14) return 'Thần Cấp';
  if (rare >= 8) return 'Cực Phẩm';
  if (rare >= 4) return 'Cao Cấp';
  if (rare >= 2) return 'Nhạy Bén';
  return 'Cơ Bản';
}

export function getSizeTier(size: number): string {
  if (size >= 2.0) return 'Khổng Lồ';
  if (size >= 1.0) return 'Rất Lớn';
  if (size >= 0.4) return 'To Lớn';
  return 'Vừa Phải';
}

export function getBiteTier(bite: number): string {
  if (bite <= 0.2) return 'Thần Tốc';
  if (bite <= 0.4) return 'Rất Nhanh';
  if (bite <= 0.65) return 'Nhanh';
  return 'Tiêu Chuẩn';
}

export function getMissTier(miss: number): string {
  if (miss <= 0.05) return 'Bất Hoại';
  if (miss <= 0.15) return 'Siêu Cường';
  if (miss <= 0.3) return 'Kiên Cố';
  return 'Chắc Chắn';
}
