import type { Reward } from '../types';

export type StoryGoal =
  | { type: 'kill'; target: string; n: number }
  | { type: 'harvest' | 'buy_equip' | 'fish' | 'ranch' | 'kite'; n: number };

export interface NpcDef {
  id: string;
  name: string;
  emoji: string;
  tex: string;
  /** câu nói ngẫu nhiên khi không có nhiệm vụ */
  lines: string[];
  /** mở nhanh cửa hàng từ hội thoại */
  panel?: string;
  panelLabel?: string;
}

const npc = (d: NpcDef) => d;

export const NPC_DEFS: Record<string, NpcDef> = {
  chief: npc({
    id: 'chief', name: 'Hội trưởng Gia', emoji: '🧙', tex: 'npc_guild', panel: 'guild', panelLabel: '⚔️ Vào Hội',
    lines: ['Hội luôn cần những mạo hiểm giả gan dạ.', 'Vùng quái không có chỗ nào an toàn — mang đủ bình máu và đồ ăn.', 'Mỗi vùng có 1 Boss canh đấu trường, hạ nó sẽ được rương báu và trang bị độc quyền.', 'Ban đêm quái hung dữ hơn, nhưng rơi đồ nhiều hơn.'],
  }),
  clerk: npc({
    id: 'clerk', name: 'Thư ký Mai', emoji: '👩‍💼', tex: 'npc_villager', panel: 'bounty', panelLabel: '📋 Xem nhiệm vụ săn quái',
    lines: ['Mỗi ngày Hội treo thưởng cho 3 loài quái.', 'Hạ đủ số lượng rồi quay lại nhận thưởng nhé!'],
  }),
  armorer: npc({
    id: 'armorer', name: 'Quản kho Lý', emoji: '💂', tex: 'npc_armorer', panel: 'weapons', panelLabel: '⚔️ Xem vũ khí',
    lines: ['Vũ khí tốt là nửa chiến thắng.', 'Giáo dài đánh từ xa, hợp với người cẩn thận.'],
  }),
  smith: npc({
    id: 'smith', name: 'Thợ rèn Thiết', emoji: '🧔', tex: 'npc_smith', panel: 'smith', panelLabel: '🔨 Cường hóa',
    lines: ['Mang nguyên liệu tới, ta cường hóa đồ cho!', 'Vảy rồng là thứ quý nhất để rèn.'],
  }),
  merchant: npc({
    id: 'merchant', name: 'Cô Ba bán hàng', emoji: '👩‍🌾', tex: 'npc_merchant', panel: 'market', panelLabel: '🏪 Xem chợ',
    lines: ['Giá nông sản đổi mỗi ngày đó cưng.', 'Bí ngô bán được giá lắm.'],
  }),
  seeder: npc({
    id: 'seeder', name: 'Chú Bảy hạt giống', emoji: '👨‍🌾', tex: 'npc_rancher', panel: 'seeds', panelLabel: '🌱 Mua hạt giống',
    lines: ['Mua 10 gói trở lên được giảm giá 15%!', 'Đất tốt, hạt tốt thì mùa bội thu.'],
  }),
  rancher: npc({
    id: 'rancher', name: 'Bác Tư chăn nuôi', emoji: '🤠', tex: 'npc_rancher', panel: 'ranch', panelLabel: '🐄 Mua vật nuôi',
    lines: ['Vật nuôi phải cho ăn thì mới ra sản phẩm.', 'Sữa bò nấu Sữa ấm hồi máu rất tốt!'],
  }),
  fisher: npc({
    id: 'fisher', name: 'Ông Năm câu cá', emoji: '🎣', tex: 'npc_fisher', panel: 'fishing', panelLabel: '🎣 Tiệm câu cá',
    lines: ['Hồ này câu giờ nào cũng được, cháu ạ.', 'Mồi vàng câu cá rồng dễ hơn nhiều.', 'Trời mưa cá mập con hay cắn câu.'],
  }),
  kid: npc({
    id: 'kid', name: 'Bé Na', emoji: '👧', tex: 'npc_kid', panel: 'kites', panelLabel: '🪁 Tiệm diều',
    lines: ['Gió trên đồi mát lắm á!', 'Diều rồng bay cao nhất luôn!'],
  }),
  stylist: npc({
    id: 'stylist', name: 'Chị Hằng thời trang', emoji: '💃', tex: 'npc_villager', panel: 'fashion', panelLabel: '👗 Tiệm thời trang',
    lines: ['Mạo hiểm giả cũng phải thật phong cách!', 'Túi mù thời trang mới về, hên là trúng Long bào đó!'],
  }),
  breeder: npc({
    id: 'breeder', name: 'Anh Tùng thú cưng', emoji: '🧑', tex: 'npc_merchant', panel: 'pets', panelLabel: '🐾 Xem thú cưng',
    lines: ['Thú cưng đi theo giúp bạn kiếm thêm vàng và XP.', 'Ấp trứng đi, biết đâu ra Cửu vĩ hồ huyền thoại!'],
  }),
  boatman: npc({
    id: 'boatman', name: 'Chú Sáu lái đò', emoji: '🚣', tex: 'npc_fisher', panel: 'fishing', panelLabel: '🎣 Ghé tiệm câu',
    lines: ['Sông Quê đổ vào hồ, cá theo dòng về đông lắm!', 'Đứng trên cầu gỗ thả câu cũng được đó con.', 'Thấy cá nhảy chỗ nào thì quăng phao chỗ đó.'],
  }),
  hatter: npc({
    id: 'hatter', name: 'Cô Mai mũ nón', emoji: '👒', tex: 'npc_hatter', panel: 'hats', panelLabel: '🎩 Tiệm mũ nón',
    lines: ['Mũ xịn vừa đẹp vừa đỡ đòn nha!', 'Vương miện hiếm lắm, ai đội được là sang nhất phố.'],
  }),
  jeweler: npc({
    id: 'jeweler', name: 'Ông Kim trang sức', emoji: '🧐', tex: 'npc_jeweler', panel: 'jewelry', panelLabel: '💍 Tiệm trang sức',
    lines: ['Trang sức thật sự giúp con kiếm thêm vàng và XP đó.', 'Đeo đủ bộ kim cương thì cả phố phải ngước nhìn.'],
  }),
  baker: npc({
    id: 'baker', name: 'Cô Ba tiệm bánh', emoji: '👩‍🍳', tex: 'npc_baker', panel: 'bakery', panelLabel: '🍰 Mua bánh',
    lines: ['Bánh mới ra lò, ăn vào khỏe re!', 'Không rảnh nấu thì ghé cô, có món nào cũng có buff hết.'],
  }),
  winger: npc({
    id: 'winger', name: 'Bà Tiên cánh', emoji: '🧚', tex: 'npc_guild', panel: 'wings', panelLabel: '🪽 Xem cánh',
    lines: ['Có cánh thì chạy nhanh như gió.', 'Hộp Cánh Thần có thể ra Cánh hư không đó cháu.'],
  }),
  alchemist: npc({
    id: 'alchemist', name: 'Dược sư Lan', emoji: '👩‍🔬', tex: 'npc_kid', panel: 'potions', panelLabel: '🧪 Mua thuốc',
    lines: ['Đi vùng xa nhớ mang theo Tiên dược.', 'Bấm Q để uống thuốc nhanh!'],
  }),
};

export interface StoryStep {
  giver: string;
  title: string;
  goal: StoryGoal;
  intro: string[];
  done: string;
  reward: Reward;
}

export const STORY: StoryStep[] = [
  {
    giver: 'chief', title: 'Hiểm họa Slime', goal: { type: 'kill', target: 'slime', n: 5 },
    intro: ['Chào mừng tới thị trấn, tân binh!', 'Ra cổng phía đông Khu Mạo Hiểm Giả là tới Đồng Cỏ Slime.', 'Hạ 5 con Slime để chứng minh bản lĩnh.'],
    done: 'Khá lắm! Ngươi có tố chất của một mạo hiểm giả thật sự.', reward: { gold: 150 },
  },
  {
    giver: 'merchant', title: 'Mùa vụ đầu tiên', goal: { type: 'harvest', n: 6 },
    intro: ['Khu Nông Trại phía tây bắc đang cần người làm.', 'Cưng thu hoạch giúp cô 6 ô ruộng nha.'],
    done: 'Giỏi quá! Cô tặng cưng hạt nấm phát sáng.', reward: { gold: 200, items: { seed_mushroom: 2 } },
  },
  {
    giver: 'armorer', title: 'Trang bị tận răng', goal: { type: 'buy_equip', n: 1 },
    intro: ['Đi rừng mà cầm Kiếm gỗ thì nguy lắm!', 'Mua một món ở Tiệm Vũ Khí hoặc Tiệm Giáp đi.'],
    done: 'Trông ra dáng chiến binh rồi đấy!', reward: { gold: 300 },
  },
  {
    giver: 'fisher', title: 'Thú vui bên hồ', goal: { type: 'fish', n: 3 },
    intro: ['Hồ lớn ở Khu Câu Cá câu được mọi lúc.', 'Mua mồi ở tiệm của ông rồi câu thử 3 con nào.'],
    done: 'Ha ha, cháu có khiếu câu cá đấy!', reward: { gold: 300, items: { bait_shrimp: 5 } },
  },
  {
    giver: 'rancher', title: 'Nông trại vui vẻ', goal: { type: 'ranch', n: 2 },
    intro: ['Chuồng của bác còn chỗ trống.', 'Mua vật nuôi, cho ăn rồi thu sản phẩm 2 lần nhé.'],
    done: 'Vậy là cháu thành chủ trang trại rồi!', reward: { gold: 350 },
  },
  {
    giver: 'kid', title: 'Cánh diều tuổi thơ', goal: { type: 'kite', n: 1 },
    intro: ['Anh chị mua diều ở tiệm của em rồi lên Đồi Gió thả nha!', 'Gió lành mang may mắn đó.'],
    done: 'Yay! Diều bay cao quá trời luôn!', reward: { gold: 300, gems: 5 },
  },
  {
    giver: 'chief', title: 'Bầy sói đêm', goal: { type: 'kill', target: 'wolf', n: 8 },
    intro: ['Sói Đen ở vùng 4 đang tấn công thương nhân.', 'Hạ 8 con. Cẩn thận, chúng rất nhanh!'],
    done: 'Đường buôn bán đã an toàn.', reward: { gold: 800, gems: 10 },
  },
  {
    giver: 'chief', title: 'Vua của bờ biển', goal: { type: 'kill', target: 'crab_king', n: 1 },
    intro: ['Vua Cua Khổng Lồ chiếm Bãi Biển Cua (vùng 5).', 'Thấy vòng đỏ dưới chân thì tránh ra ngay!'],
    done: 'Ngươi đã hạ boss đầu tiên! Cả thị trấn nhớ ơn ngươi.', reward: { gold: 2500, gems: 15 },
  },
  {
    giver: 'smith', title: 'Đêm nghĩa địa', goal: { type: 'kill', target: 'skeleton', n: 12 },
    intro: ['Ta cần xương cổ để thử nghiệm rèn đồ.', 'Hạ 12 Xương khô ở Nghĩa Địa Bóng Đêm (vùng 7).'],
    done: 'Tốt! Lò rèn lại đỏ lửa rồi.', reward: { gold: 4000 },
  },
  {
    giver: 'chief', title: 'Người khổng lồ đá', goal: { type: 'kill', target: 'ancient_golem', n: 1 },
    intro: ['Golem Cổ Đại đã thức giấc ở Phế Tích (vùng 10).', 'Nó cứng như núi. Hãy cường hóa vũ khí trước.'],
    done: 'Ngươi đã mạnh hơn bất kỳ ai trong Hội.', reward: { gold: 8000, gems: 20 },
  },
  {
    giver: 'clerk', title: 'Lời nguyền rừng ma', goal: { type: 'kill', target: 'ghost', n: 15 },
    intro: ['Rừng Ma Ám (vùng 14) đầy hồn ma xuyên tường.', 'Hội treo thưởng lớn: hạ 15 Hồn ma!'],
    done: 'Rừng đã yên bình trở lại. Thưởng xứng đáng!', reward: { gold: 15000, gems: 15 },
  },
  {
    giver: 'chief', title: 'Nữ hoàng của độc dược', goal: { type: 'kill', target: 'spider_queen', n: 1 },
    intro: ['Nữ Hoàng Nhện cai trị Đầm Độc (vùng 15).', 'Mang thật nhiều bình máu.'],
    done: 'Đầm độc đã được giải phóng!', reward: { gold: 25000, gems: 30 },
  },
  {
    giver: 'armorer', title: 'Kỵ sĩ bóng tối', goal: { type: 'kill', target: 'dark_knight', n: 15 },
    intro: ['Kỵ sĩ bóng tối từ Vực Hắc Ám (vùng 19) đang tiến về thị trấn.', 'Chặn chúng lại — hạ 15 tên!'],
    done: 'Thị trấn an toàn nhờ ngươi.', reward: { gold: 50000, gems: 30 },
  },
  {
    giver: 'chief', title: 'Cơn thịnh nộ của Rồng Lửa', goal: { type: 'kill', target: 'fire_dragon', n: 1 },
    intro: ['Rồng Lửa đã thức giấc ở Thiên Long Cốc (vùng 20)!', 'Nó phun cầu lửa và đập đất.', 'Số phận của cả thị trấn nằm trong tay ngươi.'],
    done: '🏆 Ngươi đã trở thành ANH HÙNG của thị trấn!', reward: { gold: 100000, gems: 100 },
  },
];
