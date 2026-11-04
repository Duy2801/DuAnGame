// Nhân vật chibi ghép lớp (paper-doll): thân → mặt → tóc → quần → giày → áo → áo choàng → trang sức → mũ
// Thêm đồ mới chỉ cần thêm mục vào bảng *_LOOK bên dưới — không phải vẽ lại cả nhân vật.

type Ctx = CanvasRenderingContext2D;
export type Dir = 'down' | 'up' | 'side';

export const FRAME_W = 24;
export const FRAME_H = 36;
/** khung logic 24×36; hàng chạm đất; sprite đặt origin sao cho chân = vị trí + 8px (khớp hệ va chạm cũ) */
export const FEET_Y = 34;
export const ORIGIN_Y = (FEET_Y - 8) / FRAME_H;

// ---------------------------------------------------------------- bảng màu & kiểu cho màn tạo nhân vật

export const SKIN_TONES = [
  '#fdf2e9', // Sáng hồng
  '#fde8d0', // Tự nhiên
  '#f5d0a9', // Bánh mật sáng
  '#d49b6a', // Nắng vàng rực rỡ
  '#995834', // Nâu khỏe khoắn
];
export const HAIR_COLORS = [
  '#59321f', // Nâu hạt dẻ
  '#1e1b18', // Đen tuyền
  '#eab308', // Vàng kim óng ả
  '#dc2626', // Đỏ rực
  '#f1f5f9', // Bạch kim tuyết
  '#2563eb', // Xanh lam
  '#ec4899', // Hồng anh đào
  '#16a34a', // Lục bảo
];
export const EYE_COLORS = [
  '#78350f', // Nâu hổ phách
  '#0284c7', // Lam ngọc bích
  '#16a34a', // Lục bảo
  '#9333ea', // Tím thạch anh
  '#e11d48', // Đỏ hồng ngọc
];
export const CLOTH_COLORS = [
  '#2563eb', // Lam mạo hiểm
  '#dc2626', // Đỏ nhiệt huyết
  '#16a34a', // Lục thảo nguyên
  '#7c3aed', // Tím huyền bí
  '#f59e0b', // Vàng hoàng kim
  '#334155', // Đen hiệp sĩ
];

export type HairStyle = 'short' | 'spiky' | 'swept' | 'long' | 'ponytail' | 'twintails' | 'bob' | 'bun' | 'bald';
export const HAIR_STYLES: { id: HairStyle; name: string }[] = [
  { id: 'short', name: 'Ngắn' },
  { id: 'spiky', name: 'Dựng' },
  { id: 'swept', name: 'Vuốt' },
  { id: 'bob', name: 'Ngang vai' },
  { id: 'long', name: 'Dài' },
  { id: 'ponytail', name: 'Đuôi ngựa' },
  { id: 'twintails', name: 'Hai bím' },
  { id: 'bun', name: 'Búi' },
];

export type TopStyle =
  | 'tunic' | 'tee' | 'hoodie' | 'jacket' | 'leather' | 'chain' | 'plate' | 'plate_dragon'
  | 'robe' | 'dress' | 'aodai' | 'sailor' | 'royal' | 'apron' | 'ribs'
  // kiểu dành cho nhân vật nữ
  | 'blouse' | 'gown' | 'battledress'
  // đồ khởi đầu thời trang: nữ sơ mi + áo bolero + nơ, nam áo khoác mở + áo thun in hình
  | 'idol' | 'street';
export type BottomStyle = 'pants' | 'shorts' | 'skirt' | 'none';
export type ShoeStyle = 'boots' | 'shoes' | 'sneakers' | 'none';
export type PauldronStyle = 'light' | 'knight' | 'shadow' | 'royal' | 'mithril' | 'valkyrie' | 'dragon' | 'celestial';

export interface AvatarLook {
  female: boolean;
  skin: string;
  eyes: string;
  hair: { style: HairStyle; color: string };
  top: { style: TopStyle; color: string; trim?: string };
  /** trim: viền gấu váy / gấu quần xắn */
  bottom: { style: BottomStyle; color: string; trim?: string };
  shoes: { style: ShoeStyle; color: string };
  cape?: string;
  /** khăn quàng cổ (bay phấp phới) */
  scarf?: string;
  /** tất cao cổ */
  socks?: string;
  /** màu áo trong (sơ mi / áo thun) của kiểu idol / street */
  inner?: string;
  hat?: string;
  helm?: string;
  pauldrons?: PauldronStyle;
  crest?: string;
  gauntlets?: string;
  greaves?: string;
  neck?: string;
  ear?: string;
  face?: string;
  beard?: string;
  ears?: 'goblin' | 'small';
  tusks?: boolean;
  skeleton?: boolean;
  glowEyes?: boolean;
}

// ---------------------------------------------------------------- đồ → hình

/** giáp (chỉ số) → hình dáng bộ đồ chiến binh ngầu (khi mặc giáp chiến đấu) */
const ARMOR_LOOK: Record<string, Partial<AvatarLook>> = {
  leather: {
    top: { style: 'leather', color: '#78350f', trim: '#f59e0b' },
    bottom: { style: 'pants', color: '#27272a' },
    shoes: { style: 'boots', color: '#451a03' },
    cape: '#3f2305',
    pauldrons: 'light',
    crest: '#fbbf24',
    gauntlets: '#92400e',
    greaves: '#78350f',
    helm: 'helm_wolf',
  },
  chain: {
    top: { style: 'chain', color: '#64748b', trim: '#e2e8f0' },
    bottom: { style: 'pants', color: '#1e293b' },
    shoes: { style: 'boots', color: '#334155' },
    cape: '#1d4ed8',
    pauldrons: 'knight',
    crest: '#38bdf8',
    gauntlets: '#94a3b8',
    greaves: '#64748b',
    helm: 'helm_knight',
  },
  shadow_armor: {
    top: { style: 'plate_dragon', color: '#1e1b4b', trim: '#a855f7' },
    bottom: { style: 'pants', color: '#090d16' },
    shoes: { style: 'boots', color: '#312e81' },
    cape: '#0f172a',
    pauldrons: 'shadow',
    crest: '#e879f9',
    gauntlets: '#4c1d95',
    greaves: '#312e81',
    helm: 'helm_shadow',
  },
  steel: {
    top: { style: 'plate', color: '#94a3b8', trim: '#fbbf24' },
    bottom: { style: 'pants', color: '#334155' },
    shoes: { style: 'boots', color: '#475569' },
    cape: '#991b1b',
    pauldrons: 'royal',
    crest: '#ef4444',
    gauntlets: '#cbd5e1',
    greaves: '#94a3b8',
    helm: 'helm_royal',
  },
  mithril: {
    top: { style: 'plate', color: '#0284c7', trim: '#e0f2fe' },
    bottom: { style: 'pants', color: '#0c4a6e' },
    shoes: { style: 'boots', color: '#0369a1' },
    cape: '#075985',
    pauldrons: 'mithril',
    crest: '#67e8f9',
    gauntlets: '#7dd3fc',
    greaves: '#38bdf8',
    helm: 'helm_mithril',
  },
  valkyrie_armor: {
    top: { style: 'plate', color: '#f8fafc', trim: '#fbbf24' },
    bottom: { style: 'pants', color: '#334155' },
    shoes: { style: 'boots', color: '#eab308' },
    cape: '#be123c',
    pauldrons: 'valkyrie',
    crest: '#38bdf8',
    gauntlets: '#fde047',
    greaves: '#f8fafc',
    helm: 'helm_valkyrie',
  },
  dragon_armor: {
    top: { style: 'plate_dragon', color: '#991b1b', trim: '#fbbf24' },
    bottom: { style: 'pants', color: '#450a0a' },
    shoes: { style: 'boots', color: '#7f1d1d' },
    cape: '#ea580c',
    pauldrons: 'dragon',
    crest: '#fde047',
    gauntlets: '#dc2626',
    greaves: '#b91c1c',
    helm: 'helm_dragon',
  },
  celestial_armor: {
    top: { style: 'plate_dragon', color: '#312e81', trim: '#fde047' },
    bottom: { style: 'pants', color: '#1e1b4b' },
    shoes: { style: 'boots', color: '#eab308' },
    cape: '#4c1d95',
    pauldrons: 'celestial',
    crest: '#67e8f9',
    gauntlets: '#fde047',
    greaves: '#c084fc',
    helm: 'helm_celestial',
  },
  // đồ boss
  frog_mail: {
    top: { style: 'leather', color: '#15803d', trim: '#86efac' },
    bottom: { style: 'pants', color: '#14532d' },
    shoes: { style: 'boots', color: '#166534' },
    pauldrons: 'light',
    crest: '#4ade80',
    gauntlets: '#166534',
  },
  crab_shell: {
    top: { style: 'plate', color: '#b91c1c', trim: '#fed7aa' },
    bottom: { style: 'pants', color: '#7f1d1d' },
    shoes: { style: 'boots', color: '#991b1b' },
    cape: '#0284c7',
    pauldrons: 'dragon',
    crest: '#fb923c',
    gauntlets: '#dc2626',
    greaves: '#b91c1c',
  },
  sand_armor: {
    top: { style: 'plate_dragon', color: '#d97706', trim: '#fef08a' },
    bottom: { style: 'pants', color: '#78350f' },
    shoes: { style: 'boots', color: '#92400e' },
    cape: '#b91c1c',
    pauldrons: 'royal',
    crest: '#38bdf8',
    gauntlets: '#f59e0b',
    greaves: '#d97706',
    helm: 'helm_royal',
  },
  yeti_fur: {
    top: { style: 'jacket', color: '#e0f2fe', trim: '#38bdf8' },
    bottom: { style: 'pants', color: '#0369a1' },
    shoes: { style: 'boots', color: '#bae6fd' },
    cape: '#0284c7',
    pauldrons: 'mithril',
    crest: '#67e8f9',
    gauntlets: '#e0f2fe',
    greaves: '#7dd3fc',
  },
  ogre_plate: {
    top: { style: 'plate', color: '#3f3f46', trim: '#f97316' },
    bottom: { style: 'pants', color: '#18181b' },
    shoes: { style: 'boots', color: '#27272a' },
    cape: '#7f1d1d',
    pauldrons: 'dragon',
    crest: '#ef4444',
    gauntlets: '#52525b',
    greaves: '#3f3f46',
  },
  abyss_armor: {
    top: { style: 'plate_dragon', color: '#2e1065', trim: '#c084fc' },
    bottom: { style: 'pants', color: '#090d16' },
    shoes: { style: 'boots', color: '#3b0764' },
    cape: '#581c87',
    pauldrons: 'celestial',
    crest: '#f43f5e',
    gauntlets: '#7e22ce',
    greaves: '#581c87',
    helm: 'helm_shadow',
  },
};

/**
 * Giáp mặc trên nhân vật nữ: cùng chỉ số, cùng bảng màu nhưng đổi dáng —
 * áo vải → áo blouse + chân váy; giáp kim loại → giáp váy (battledress); mũ giáp → vương miện nhỏ (xem drawHat).
 */
function femaleArmor(a: Partial<AvatarLook>): Partial<AvatarLook> {
  if (!a.top) return a;
  const soft = a.top.style === 'tunic' || a.top.style === 'leather' || a.top.style === 'jacket';
  return {
    ...a,
    top: { ...a.top, style: a.top.style === 'tunic' ? 'idol' : soft ? a.top.style : 'battledress' },
    bottom: soft ? { style: 'skirt', color: a.bottom?.color ?? '#1e293b' } : { style: 'none', color: '#000' },
  };
}

type LookPatch = Partial<AvatarLook>;
/** món có dáng khác nhau cho nam / nữ */
type GenderedPatch = { m: LookPatch; f: LookPatch };
const isGendered = (x: LookPatch | GenderedPatch): x is GenderedPatch => 'm' in x && 'f' in x;

/**
 * Đồ thời trang mặc ngoài (ghi đè hình giáp). Món mặc được cho cả hai giới nhưng dáng khác nhau thì khai báo { m, f };
 * món chỉ dành cho 1 giới thì đặt `gender` ở COSMETICS (game/config/shops.ts).
 */
export const COSMETIC_LOOK: Record<string, LookPatch | GenderedPatch> = {
  top_tee: { top: { style: 'tee', color: '#f4f4f0', trim: '#c8402f' } },
  top_hoodie: { top: { style: 'hoodie', color: '#c8402f', trim: '#f4f4f0' } },
  top_sailor: { top: { style: 'sailor', color: '#f4f4f0', trim: '#2c3f8a' } },
  top_suit: { top: { style: 'jacket', color: '#2a2a38', trim: '#f4f4f0' } },
  top_aodai: { top: { style: 'aodai', color: '#d83a3a', trim: '#f2c230' }, bottom: { style: 'pants', color: '#f4f4f0' } },
  top_royal: {
    m: { top: { style: 'royal', color: '#6a3aa0', trim: '#f2c230' }, cape: '#c8302a' },
    f: { top: { style: 'gown', color: '#6a3aa0', trim: '#f2c230' }, bottom: { style: 'none', color: '#000' }, cape: '#c8302a' },
  },
  top_tee_green: { top: { style: 'tee', color: '#5fbf5a', trim: '#f4f4f0' } },
  top_apron: { top: { style: 'apron', color: '#f4f4f0', trim: '#c8402f' } },
  top_hoodie_black: { top: { style: 'hoodie', color: '#2a2a32', trim: '#c8402f' } },
  top_denim: { top: { style: 'jacket', color: '#4a6fa8', trim: '#c8d8f0' } },
  top_aodai_white: { top: { style: 'aodai', color: '#f8f8f4', trim: '#9fd3f0' }, bottom: { style: 'pants', color: '#f4f4f0' } },
  top_dress: { top: { style: 'dress', color: '#f0a0c8', trim: '#ffffff' }, bottom: { style: 'none', color: '#000' } },
  top_mage: {
    m: { top: { style: 'robe', color: '#3d5fb8', trim: '#e8e8f0' }, bottom: { style: 'none', color: '#000' } },
    f: { top: { style: 'gown', color: '#3d5fb8', trim: '#e8e8f0' }, bottom: { style: 'none', color: '#000' } },
  },
  top_shadow: {
    m: { top: { style: 'robe', color: '#22202a', trim: '#8a3ad8' }, bottom: { style: 'none', color: '#000' }, cape: '#1a1420' },
    f: { top: { style: 'gown', color: '#22202a', trim: '#8a3ad8' }, bottom: { style: 'none', color: '#000' }, cape: '#1a1420' },
  },
  top_queen: { top: { style: 'aodai', color: '#f2c230', trim: '#c8302a' }, bottom: { style: 'pants', color: '#f4ecd8' } },
  top_dragonrobe: {
    m: { top: { style: 'royal', color: '#c8302a', trim: '#f2c230' }, cape: '#f2c230' },
    f: { top: { style: 'gown', color: '#c8302a', trim: '#f2c230' }, bottom: { style: 'none', color: '#000' }, cape: '#f2c230' },
  },
  top_holy: {
    m: { top: { style: 'plate', color: '#f4f4f8', trim: '#f2c230' }, cape: '#ffffff' },
    f: { top: { style: 'battledress', color: '#f4f4f8', trim: '#f2c230' }, bottom: { style: 'none', color: '#000' }, cape: '#ffffff' },
  },
  // đồ riêng cho nam
  top_aodai_nam: { top: { style: 'aodai', color: '#1e3a8a', trim: '#f2c230' }, bottom: { style: 'pants', color: '#f4f4f0' } },
  top_prince: { top: { style: 'royal', color: '#f4f4f0', trim: '#f2c230' }, cape: '#2563eb' },
  bottom_cargo: { bottom: { style: 'pants', color: '#6b7a4a' } },
  shoes_loafer: { shoes: { style: 'shoes', color: '#4a2a1a' } },
  // đồ riêng cho nữ
  top_blouse: { top: { style: 'blouse', color: '#f9a8d4', trim: '#ffffff' } },
  top_princess: { top: { style: 'gown', color: '#f0a0c8', trim: '#ffffff' }, bottom: { style: 'none', color: '#000' } },
  bottom_jeans: { bottom: { style: 'pants', color: '#3d5f9a' } },
  bottom_shorts: { bottom: { style: 'shorts', color: '#c8955a' } },
  bottom_skirt: { bottom: { style: 'skirt', color: '#f080b0' } },
  bottom_black: { bottom: { style: 'pants', color: '#22222a' } },
  bottom_khaki: { bottom: { style: 'pants', color: '#c8b080' } },
  bottom_pleat: { bottom: { style: 'skirt', color: '#2c3f8a' } },
  bottom_white: { bottom: { style: 'pants', color: '#f4f4f0' } },
  bottom_gown: { bottom: { style: 'skirt', color: '#6a3aa0' } },
  shoes_sneaker: { shoes: { style: 'shoes', color: '#f4f4f0' } },
  shoes_boots: { shoes: { style: 'boots', color: '#7a4a2a' } },
  shoes_gold: { shoes: { style: 'shoes', color: '#f2c230' } },
  shoes_red: { shoes: { style: 'shoes', color: '#c8302a' } },
  shoes_black: { shoes: { style: 'boots', color: '#22222a' } },
  shoes_glass: { shoes: { style: 'shoes', color: '#bfefff' } },
};

const NECK_COLOR: Record<string, [string, string]> = {
  neck_gold: ['#f2c230', '#fff2b0'],
  neck_ruby: ['#f2c230', '#e8302a'],
  neck_jade: ['#e8e8f0', '#4fd08a'],
  neck_diamond: ['#e8e8f0', '#bfefff'],
  neck_shell: ['#e8d8c0', '#f0a0b0'],
  neck_silver: ['#c8ccd4', '#e8e8f0'],
};
const EAR_COLOR: Record<string, string> = {
  ear_gold: '#f2c230', ear_pearl: '#f8f8f0', ear_silver: '#c8ccd4', ear_ruby: '#e8302a', ear_star: '#7fe8ff', ear_diamond: '#bfefff',
};
/** kính: [gọng, tròng] */
const FACE_STYLE: Record<string, [string, string]> = { face_round: ['#8a5a2e', '#d8f0ff'], face_sun: ['#1a1a22', '#2a2a3a'], face_heart: ['#e83a7a', '#ff9ac8'],
  face_star: ['#f2c230', '#fff2b0'], face_gold: ['#f2c230', '#d8f0ff'],
};

export interface LookInput {
  gender: 'm' | 'f';
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  eyes: number;
  cloth: number;
  armor: string | null;
  /** chỉ truyền món hợp giới tính (heroLook đã lọc) */
  cosmetics: Partial<Record<'hat' | 'top' | 'bottom' | 'shoes' | 'neck' | 'ear' | 'face', string | null>>;
}

/** hình của 1 món thời trang theo giới tính nhân vật */
export function cosmeticPatch(id: string, female: boolean): LookPatch | undefined {
  const p = COSMETIC_LOOK[id];
  if (!p) return undefined;
  return isGendered(p) ? (female ? p.f : p.m) : p;
}

/** phối màu đồ khởi đầu theo màu áo chọn lúc tạo nhân vật (cùng thứ tự CLOTH_COLORS) */
const OUTFIT_F = [
  { bow: '#f43f5e', skirt: '#1e3a8a' }, // lam
  { bow: '#fde047', skirt: '#7f1d1d' }, // đỏ
  { bow: '#f472b6', skirt: '#14532d' }, // lục
  { bow: '#f9a8d4', skirt: '#3b0764' }, // tím
  { bow: '#ef4444', skirt: '#78350f' }, // vàng
  { bow: '#e11d48', skirt: '#18181b' }, // đen
];
const OUTFIT_M = [
  { scarf: '#f2c230', print: '#2563eb' },
  { scarf: '#f4f4f0', print: '#dc2626' },
  { scarf: '#f97316', print: '#16a34a' },
  { scarf: '#facc15', print: '#7c3aed' },
  { scarf: '#b91c1c', print: '#d97706' },
  { scarf: '#dc2626', print: '#334155' },
];

/** Ghép hình nhân vật người chơi từ hồ sơ + giáp + đồ thời trang */
export function lookOf(i: LookInput): AvatarLook {
  const female = i.gender === 'f';
  const cloth = CLOTH_COLORS[i.cloth] ?? CLOTH_COLORS[0];
  const of = OUTFIT_F[i.cloth] ?? OUTFIT_F[0];
  const om = OUTFIT_M[i.cloth] ?? OUTFIT_M[0];
  let look: AvatarLook = {
    female,
    skin: SKIN_TONES[i.skin] ?? SKIN_TONES[1],
    eyes: EYE_COLORS[i.eyes] ?? EYE_COLORS[0],
    hair: { style: i.hairStyle, color: HAIR_COLORS[i.hair] ?? HAIR_COLORS[0] },
    // đồ khởi đầu
    //  nữ: sơ mi trắng + áo bolero màu chọn + nơ to, chân váy xếp ly lưng cao viền trắng, tất cao cổ, giày búp bê quai ngang
    //  nam: áo thun in hình + áo khoác mở màu chọn, khăn quàng, quần jean xắn gấu, giày sneaker
    top: female ? { style: 'idol', color: cloth, trim: of.bow } : { style: 'street', color: cloth, trim: om.print },
    inner: female ? '#fbfbff' : '#f4f4f0',
    bottom: female ? { style: 'skirt', color: of.skirt, trim: '#ffffff' } : { style: 'pants', color: '#2b3a55', trim: '#6b8cc4' },
    shoes: female ? { style: 'shoes', color: '#3a1f1f' } : { style: 'sneakers', color: '#f4f4f0' },
    socks: female ? '#ffffff' : undefined,
    scarf: female ? undefined : om.scarf,
  };
  if (i.armor && ARMOR_LOOK[i.armor]) {
    look = { ...look, ...(female ? femaleArmor(ARMOR_LOOK[i.armor]) : ARMOR_LOOK[i.armor]) };
    look.scarf = undefined;
  }
  for (const slot of ['top', 'bottom', 'shoes'] as const) {
    const id = i.cosmetics[slot];
    const patch = id ? cosmeticPatch(id, female) : undefined;
    if (patch) {
      look = { ...look, ...patch };
      if (slot === 'top') look.scarf = undefined;
    }
  }
  // váy dài / áo choàng dài che chân → bỏ tất
  if (['gown', 'robe'].includes(look.top.style)) look.socks = undefined;
  look.hat = i.cosmetics.hat ?? undefined;
  look.neck = i.cosmetics.neck ?? undefined;
  look.ear = i.cosmetics.ear ?? undefined;
  look.face = i.cosmetics.face ?? undefined;
  return look;
}

// ---------------------------------------------------------------- NPC & quái hình người

const base = (o: Partial<AvatarLook>): AvatarLook => ({
  female: false, skin: SKIN_TONES[1], eyes: EYE_COLORS[0], hair: { style: 'short', color: '#4a3a2a' },
  top: { style: 'tee', color: '#3d6fd1' }, bottom: { style: 'pants', color: '#4a3a2a' }, shoes: { style: 'boots', color: '#3a2a1a' },
  ...o,
});

export const NPC_LOOKS: Record<string, AvatarLook> = {
  npc_guild: base({ skin: SKIN_TONES[1], hair: { style: 'bald', color: '#e8e8f0' }, beard: '#e8e8f0', top: { style: 'robe', color: '#7b3fa0', trim: '#f2c230' }, bottom: { style: 'none', color: '#000' } }),
  npc_merchant: base({ female: true, hair: { style: 'bun', color: '#2b1b10' }, top: { style: 'apron', color: '#2f8f5a', trim: '#f4ecd8' }, bottom: { style: 'skirt', color: '#5a3a24' } }),
  npc_smith: base({ skin: SKIN_TONES[3], hair: { style: 'short', color: '#2b1b10' }, beard: '#2b1b10', top: { style: 'leather', color: '#5a3a24', trim: '#2a1a10' }, bottom: { style: 'pants', color: '#3a3a42' } }),
  npc_armorer: base({ hair: { style: 'short', color: '#4a3a2a' }, top: { style: 'plate', color: '#a9b0ba', trim: '#c8402f' }, bottom: { style: 'pants', color: '#3a3a48' }, shoes: { style: 'boots', color: '#5a5f69' }, cape: '#c8402f' }),
  npc_fisher: base({ skin: SKIN_TONES[2], hair: { style: 'short', color: '#e8e8f0' }, beard: '#e8e8f0', top: { style: 'tee', color: '#3a7ab8' }, bottom: { style: 'shorts', color: '#6a5a3a' }, hat: 'hat_straw' }),
  npc_rancher: base({ hair: { style: 'short', color: '#8a5a2e' }, beard: '#8a5a2e', top: { style: 'jacket', color: '#c84a3a', trim: '#f4ecd8' }, bottom: { style: 'pants', color: '#3d5f9a' }, hat: 'hat_straw' }),
  npc_kid: base({ female: true, hair: { style: 'ponytail', color: '#2b1b10' }, eyes: EYE_COLORS[1], top: { style: 'dress', color: '#f2c230', trim: '#ffffff' }, bottom: { style: 'none', color: '#000' }, shoes: { style: 'shoes', color: '#c8402f' } }),
  npc_hatter: base({ female: true, hair: { style: 'bob', color: '#6a3a2a' }, eyes: EYE_COLORS[2], top: { style: 'aodai', color: '#3d8fd6', trim: '#f4ecd8' }, bottom: { style: 'pants', color: '#f4f0e8' }, shoes: { style: 'shoes', color: '#3a2a1a' }, hat: 'hat_tophat' }),
  npc_jeweler: base({ skin: SKIN_TONES[2], hair: { style: 'swept', color: '#c8ccd4' }, beard: '#c8ccd4', top: { style: 'royal', color: '#2a2a48', trim: '#f2c230' }, bottom: { style: 'pants', color: '#1e1e28' }, neck: 'neck_diamond', face: 'face_gold' }),
  npc_baker: base({ female: true, skin: SKIN_TONES[1], hair: { style: 'bun', color: '#8a5a2e' }, top: { style: 'apron', color: '#f4f0e8', trim: '#e8805a' }, bottom: { style: 'skirt', color: '#e8805a' }, shoes: { style: 'shoes', color: '#8a3a2a' } }),
  npc_villager: base({ female: true, hair: { style: 'long', color: '#e8b840' }, eyes: EYE_COLORS[2], top: { style: 'dress', color: '#d06080', trim: '#f4ecd8' }, bottom: { style: 'none', color: '#000' }, shoes: { style: 'shoes', color: '#8a3a4a' } }),
  // cư dân & mạo hiểm giả dạo chơi / hoạt động trên các bản đồ
  folk_boy: base({ skin: SKIN_TONES[0], hair: { style: 'spiky', color: '#2b1b10' }, eyes: EYE_COLORS[1], top: { style: 'hoodie', color: '#e04838', trim: '#f4f4f0' }, bottom: { style: 'shorts', color: '#3d5f9a' }, shoes: { style: 'shoes', color: '#f4f4f0' }, hat: 'hat_cap' }),
  folk_girl: base({ female: true, skin: SKIN_TONES[0], hair: { style: 'twintails', color: '#7a3e1d' }, eyes: EYE_COLORS[3], top: { style: 'sailor', color: '#f4f4f0', trim: '#2c3f8a' }, bottom: { style: 'skirt', color: '#2c3f8a' }, shoes: { style: 'shoes', color: '#c8302a' }, hat: 'hat_bow' }),
  folk_lady: base({ female: true, skin: SKIN_TONES[0], hair: { style: 'long', color: '#2b1b10' }, eyes: EYE_COLORS[0], top: { style: 'aodai', color: '#d83a3a', trim: '#f2c230' }, bottom: { style: 'pants', color: '#f4f4f0' }, shoes: { style: 'shoes', color: '#c8302a' }, hat: 'hat_nonla' }),
  folk_gent: base({ skin: SKIN_TONES[1], hair: { style: 'swept', color: '#2b1b10' }, eyes: EYE_COLORS[0], top: { style: 'jacket', color: '#2a3a58', trim: '#f4f4f0' }, bottom: { style: 'pants', color: '#22222a' }, shoes: { style: 'shoes', color: '#22222a' }, face: 'face_round' }),
  folk_farmer: base({ skin: SKIN_TONES[2], hair: { style: 'short', color: '#4a3a2a' }, top: { style: 'apron', color: '#5fbf5a', trim: '#c8955a' }, bottom: { style: 'pants', color: '#5a4028' }, shoes: { style: 'boots', color: '#4a2e18' }, hat: 'hat_straw' }),
  folk_angler: base({ skin: SKIN_TONES[2], hair: { style: 'short', color: '#2b1b10' }, top: { style: 'jacket', color: '#4a6fa8', trim: '#e8d2a6' }, bottom: { style: 'shorts', color: '#c8b080' }, shoes: { style: 'shoes', color: '#7a4a2a' }, hat: 'hat_straw' }),
  folk_miner: base({ skin: SKIN_TONES[3], hair: { style: 'short', color: '#2b1b10' }, beard: '#4a3a2a', top: { style: 'leather', color: '#8a5a2e', trim: '#4a2e18' }, bottom: { style: 'pants', color: '#3a3a48' }, shoes: { style: 'boots', color: '#2a1a10' }, hat: 'hat_beanie' }),
  folk_rookie: base({ skin: SKIN_TONES[1], hair: { style: 'spiky', color: '#c8402f' }, eyes: EYE_COLORS[1], top: { style: 'leather', color: '#9a6b3c', trim: '#5a3a1e' }, bottom: { style: 'pants', color: '#4a3a2a' }, shoes: { style: 'boots', color: '#4a2e18' } }),
  folk_huntress: base({ female: true, skin: SKIN_TONES[0], hair: { style: 'ponytail', color: '#e8b840' }, eyes: EYE_COLORS[2], top: { style: 'tunic', color: '#3f8f4a', trim: '#f2c230' }, bottom: { style: 'shorts', color: '#5a3a24' }, shoes: { style: 'boots', color: '#4a2e18' }, cape: '#2f6a3a' }),
  folk_knight: base({ skin: SKIN_TONES[1], hair: { style: 'short', color: '#e8b840' }, eyes: EYE_COLORS[1], top: { style: 'chain', color: '#a9b0ba', trim: '#3d6fd1' }, bottom: { style: 'pants', color: '#3a3a48' }, shoes: { style: 'boots', color: '#5a5f69' }, cape: '#3d6fd1', hat: 'hat_knight' }),
  folk_mage: base({ female: true, skin: SKIN_TONES[0], hair: { style: 'long', color: '#e070a8' }, eyes: EYE_COLORS[3], top: { style: 'robe', color: '#6a3aa0', trim: '#f2c230' }, bottom: { style: 'none', color: '#000' }, shoes: { style: 'shoes', color: '#4a2478' }, hat: 'hat_wizard' }),
  folk_paladin: base({ skin: SKIN_TONES[0], hair: { style: 'swept', color: '#e8e8f0' }, eyes: EYE_COLORS[1], top: { style: 'plate', color: '#d8dce4', trim: '#f2c230' }, bottom: { style: 'pants', color: '#4a4f5a' }, shoes: { style: 'boots', color: '#8a8f99' }, cape: '#7b3fa0', hat: 'hat_crown' }),
  folk_dragonslayer: base({ skin: SKIN_TONES[1], hair: { style: 'spiky', color: '#e8e8f0' }, eyes: EYE_COLORS[4], top: { style: 'plate_dragon', color: '#c8302a', trim: '#f2c230' }, bottom: { style: 'pants', color: '#5a1a14' }, shoes: { style: 'boots', color: '#2a1a14' }, cape: '#f2a020' }),
  goblin: base({ skin: '#6fae3c', eyes: '#e8302a', glowEyes: true, hair: { style: 'bald', color: '#3e5e24' }, ears: 'goblin', top: { style: 'leather', color: '#7a5a3a', trim: '#4a3020' }, bottom: { style: 'shorts', color: '#5a4028' }, shoes: { style: 'none', color: '#000' } }),
  skeleton: base({ skin: '#e8e4d8', eyes: '#ff3a3a', glowEyes: true, skeleton: true, hair: { style: 'bald', color: '#e8e4d8' }, top: { style: 'ribs', color: '#e8e4d8' }, bottom: { style: 'none', color: '#000' }, shoes: { style: 'none', color: '#000' } }),
  orc: base({ skin: '#7a9a5a', eyes: '#ffd23a', glowEyes: true, hair: { style: 'spiky', color: '#2a1a10' }, ears: 'small', tusks: true, top: { style: 'leather', color: '#6b4a2b', trim: '#3a2a1a' }, bottom: { style: 'pants', color: '#4a3a2a' } }),
  dark_knight: base({ skin: '#3a3a48', eyes: '#c060ff', glowEyes: true, hair: { style: 'bald', color: '#1e1e28' }, top: { style: 'plate', color: '#2a2a38', trim: '#8a3ad8' }, bottom: { style: 'pants', color: '#1e1e28' }, shoes: { style: 'boots', color: '#14141c' }, cape: '#5a1a8a', hat: 'helm_dark' }),
};

export const AVATAR_KEYS = ['hero', ...Object.keys(NPC_LOOKS)];

// ---------------------------------------------------------------- vẽ — nhân vật chibi vector (đầu to, mắt long lanh, viền mềm)
//
// Toàn bộ hình vẽ bằng path vector trên lưới logic FRAME_W × FRAME_H, nhân với `res` khi vẽ:
//  · ngoài thế giới: sprite sheet vẽ ở AVATAR_RES (×4) rồi thu khung về kích thước logic → nét mịn khi camera zoom
//  · trên giao diện: vẽ thẳng ở `scale` của AvatarView → luôn sắc nét
// Tỉ lệ chibi (trước khi thu K): đầu ~14 đơn vị (y 5.9–19.6), thân ~8 (19.6–27.6), chân ~6 (27–34).

/** độ phân giải sprite nhân vật ngoài thế giới: 1 đơn vị logic = 4px texture */
export const AVATAR_RES = 4;
/** thu nhỏ toàn thân quanh bàn chân để khớp kích thước cũ trong thế giới (nhãn tên, va chạm) */
const K = 0.84;
const FOOT = 34.4;
const OUT = '#2a1a16';
const LW = 0.34;

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
function rgb(h: string) {
  const n = parseInt(h.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
function rgba(h: string, a: number) {
  const [r, g, b] = rgb(h);
  return `rgba(${r},${g},${b},${a})`;
}
const inkOf = (col: string) => mix(col, '#1a0e0a', 0.62);

// ---- bút vẽ (dùng chung 1 context trong lúc vẽ 1 khung)
let c!: Ctx;
type Fill = string | CanvasGradient;
const M = (x: number, y: number) => c.moveTo(x, y);
const Ln = (x: number, y: number) => c.lineTo(x, y);
const Q = (a: number, b: number, x: number, y: number) => c.quadraticCurveTo(a, b, x, y);
const B = (a: number, b: number, d: number, e: number, x: number, y: number) => c.bezierCurveTo(a, b, d, e, x, y);
function ell(cx: number, cy: number, rx: number, ry: number) {
  c.beginPath();
  c.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2);
}
function fill(col: Fill) {
  c.fillStyle = col;
  c.fill();
}
function ink(col: string, w = LW) {
  c.lineWidth = w;
  c.strokeStyle = col;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}
function paint(col: string, grad?: Fill | null, w = LW) {
  fill(grad ?? col);
  ink(inkOf(col), w);
}
function vg(y0: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, s] of stops) g.addColorStop(o, s);
  return g;
}
const soft = (col: string, y0: number, y1: number, lt = 34, dk = -36) => vg(y0, y1, [[0, shade(col, lt)], [0.45, col], [1, shade(col, dk)]]);
function shape(build: () => void, col: string, grad?: Fill | null, w = LW) {
  c.beginPath();
  build();
  c.closePath();
  paint(col, grad, w);
}
function line(build: () => void, col: string, w = LW) {
  c.beginPath();
  build();
  ink(col, w);
}
function dot(x: number, y: number, r: number, col: Fill) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  fill(col);
}
function oval(cx: number, cy: number, rx: number, ry: number, col: string, grad?: Fill | null) {
  ell(cx, cy, rx, ry);
  paint(col, grad);
}
function capsule(x1: number, y1: number, x2: number, y2: number, w: number, col: string) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineCap = 'round';
  c.lineWidth = w + LW * 2;
  c.strokeStyle = inkOf(col);
  c.stroke();
  c.lineWidth = w;
  c.strokeStyle = col;
  c.stroke();
}
function rr(x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  M(x + r, y);
  Ln(x + w - r, y);
  Q(x + w, y, x + w, y + r);
  Ln(x + w, y + h - r);
  Q(x + w, y + h, x + w - r, y + h);
  Ln(x + r, y + h);
  Q(x, y + h, x, y + h - r);
  Ln(x, y + r);
  Q(x, y, x + r, y);
}
/** vẽ fn rồi vẽ lại lật gương quanh trục giữa x = 12 */
function both(fn: () => void) {
  fn();
  c.save();
  c.translate(24, 0);
  c.scale(-1, 1);
  fn();
  c.restore();
}
function clipped(build: () => void, inner: () => void) {
  c.save();
  c.beginPath();
  build();
  c.closePath();
  c.clip();
  inner();
  c.restore();
}
function sparkle(x: number, y: number, r: number, col = '#ffffff') {
  c.beginPath();
  M(x, y - r);
  Q(x, y, x + r, y);
  Q(x, y, x, y + r);
  Q(x, y, x - r, y);
  Q(x, y, x, y - r);
  fill(col);
}

/**
 * Vẽ 1 khung nhân vật vào (ox, oy) tính theo pixel canvas — f: 0 đứng, 1 & 2 bước chân.
 * res: số pixel canvas cho 1 đơn vị logic (khung logic FRAME_W × FRAME_H).
 */
export function drawAvatar(ctx: Ctx, ox: number, oy: number, L: AvatarLook, dir: Dir, f: number, res = 1) {
  c = ctx;
  c.save();
  c.translate(ox, oy);
  c.scale(res, res);
  c.beginPath();
  c.rect(0, 0, FRAME_W, FRAME_H);
  c.clip();
  c.translate(12, FOOT);
  c.scale(K, K);
  c.translate(-12, -FOOT);
  const up = dir === 'up';
  const bob = f ? -0.35 : 0;

  c.save();
  c.translate(0, bob);
  if (L.cape && !up) drawCape(L, dir, f);
  if (!up) hairBack(L, dir, f);
  c.restore();

  drawLegs(L, dir, f);

  c.save();
  c.translate(0, bob);
  drawBottom(L, dir);
  drawTop(L, dir);
  drawArms(L, dir, f);
  drawPauldrons(L, dir);
  if (L.cape && up) drawCape(L, dir, f);
  drawNeck(L, dir);
  drawHead(L, dir, f);
  c.restore();

  c.restore();
}

// ---------------------------------------------------------------- áo choàng

function drawCape(L: AvatarLook, dir: Dir, f: number) {
  const col = L.cape!;
  const trim = L.top.trim ?? shade(col, -45);
  const g = vg(19, 32, [[0, shade(col, 22)], [1, shade(col, -40)]]);
  if (dir === 'side') {
    const sw = f ? 0.9 : 0;
    shape(() => {
      M(10.6, 19.6);
      Q(11.8, 19.3, 12.8, 20.2);
      Q(10.8, 26, 10.2, 31.4);
      Q(8.2, 32.2, 5.8 - sw, 31.0);
      Q(7.2, 25, 10.6, 19.6);
    }, col, g);
    line(() => {
      M(5.8 - sw, 31.0);
      Q(8.2, 32.2, 10.2, 31.4);
    }, trim, 0.7);
    return;
  }
  const sw = f === 1 ? 0.5 : f === 2 ? -0.5 : 0;
  shape(() => {
    M(8.4, 19.4);
    Q(12, 18.8, 15.6, 19.4);
    Ln(18.6 + sw, 31.0);
    Q(17.0, 31.9, 15.3, 31.1);
    Q(13.6, 31.9, 12, 31.1);
    Q(10.4, 31.9, 8.7, 31.1);
    Q(7.0, 31.9, 5.4 + sw, 31.0);
  }, col, g);
  line(() => {
    M(5.6 + sw, 30.9);
    Q(7.0, 31.8, 8.7, 31.0);
    Q(10.4, 31.8, 12, 31.0);
    Q(13.6, 31.8, 15.3, 31.0);
    Q(17.0, 31.8, 18.4 + sw, 30.9);
  }, trim, 0.75);
  if (dir === 'up') {
    for (const [x0, x1] of [[10.2, 9.0], [13.8, 15.0]]) line(() => (M(x0, 20.6), Q(x0 - 0.2, 26, x1, 30.6)), shade(col, -45), 0.3);
    // móc cài vàng trên vai
    dot(8.9, 20.0, 0.55, '#f2c230');
    dot(15.1, 20.0, 0.55, '#f2c230');
  }
}

// ---------------------------------------------------------------- chân, quần, giày

function drawLegs(L: AvatarLook, dir: Dir, f: number) {
  const side = dir === 'side';
  const bone = !!L.skeleton;
  const legCol = L.bottom.style === 'pants' ? L.bottom.color : L.skin;
  // [x, nhấc, sau-lưng?]
  const legs: [number, number, boolean][] = side
    ? f === 0 ? [[11.5, 0, true], [12.7, 0, false]] : f === 1 ? [[10.6, 0, true], [13.8, 1, false]] : [[13.8, 1, true], [10.6, 0, false]]
    : [[10.3, f === 1 ? 1 : 0, false], [13.7, f === 2 ? 1 : 0, false]];
  for (const [x, lift, back] of legs) {
    const by = 32.2 - lift * 0.9;
    const col = back ? shade(legCol, -22) : legCol;
    capsule(x, 26.6, x, by, bone ? 1.2 : 2.7, col);
    if (L.bottom.style === 'pants' && !back && !bone) line(() => (M(x + 0.7, 27.4), Ln(x + 0.7, by - 0.4)), shade(legCol, -30), 0.35);
    if (L.socks && L.bottom.style !== 'pants') {
      const sc = back ? shade(L.socks, -30) : L.socks;
      capsule(x, 29.0 - lift * 0.4, x, by, 2.75, sc);
      line(() => (M(x - 1.2, 29.0 - lift * 0.4), Ln(x + 1.2, 29.0 - lift * 0.4)), L.top.trim ?? '#e8304a', 0.45);
    }
    if (L.bottom.style === 'pants' && L.bottom.trim && !bone) {
      // gấu quần xắn
      shape(() => rr(x - 1.55, by - 1.3, 3.1, 1.1, 0.4), back ? shade(L.bottom.trim!, -25) : L.bottom.trim!, null, 0.25);
    }
    if (L.bottom.style === 'shorts') capsule(x, 26.6, x, 28.9, 3.1, back ? shade(L.bottom.color, -22) : L.bottom.color);
    if (L.greaves) {
      shape(() => rr(x - 1.55, by - 3.2, 3.1, 2.3, 0.7), L.greaves!, soft(L.greaves!, by - 3.2, by - 0.9));
      line(() => (M(x - 1.3, by - 3.0), Ln(x + 1.3, by - 3.0)), L.top.trim ?? '#fbbf24', 0.5);
    }
    drawShoe(L, x, by, side, back);
  }
}

function drawShoe(L: AvatarLook, x: number, by: number, side: boolean, back: boolean) {
  const s = L.shoes;
  const fx = side ? x + 0.6 : x + (x < 12 ? -0.15 : 0.15);
  if (s.style === 'none') {
    oval(fx, by + 0.7, side ? 1.6 : 1.35, 0.85, back ? shade(L.skin, -20) : L.skin);
    return;
  }
  const col = back ? shade(s.color, -22) : s.color;
  const rx = side ? 2.1 : 1.75;
  if (s.style === 'boots') {
    shape(() => rr(x - 1.6, by - 1.9, 3.2, 2.8, 0.7), col, soft(col, by - 1.9, by + 1));
    oval(fx, by + 1.0, rx, 1.05, col, soft(col, by, by + 2));
    line(() => (M(fx - rx + 0.3, by + 1.75), Q(fx, by + 2.25, fx + rx - 0.3, by + 1.75)), shade(col, -55), 0.5);
    line(() => (M(x - 1.4, by - 1.6), Ln(x + 1.4, by - 1.6)), shade(col, 40), 0.55);
  } else if (s.style === 'sneakers') {
    const stripe = L.top.trim ?? '#e8304a';
    oval(fx, by + 0.85, rx + 0.1, 1.25, col, soft(col, by - 0.4, by + 2.1, 20, -30));
    // đế cao su + sọc + dây giày
    line(() => (M(fx - rx + 0.1, by + 1.55), Q(fx, by + 2.25, fx + rx - 0.1, by + 1.55)), shade(stripe, -30), 0.5);
    line(() => (side ? (M(fx - 1.4, by + 1.0), Q(fx, by + 0.4, fx + 1.2, by + 1.2)) : (M(fx - 1.2, by + 1.1), Q(fx, by + 0.6, fx + 1.2, by + 1.1))), stripe, 0.4);
    for (const d of [-0.4, 0.4]) dot(fx + d, by + 0.15, 0.2, shade(col, -60));
  } else {
    oval(fx, by + 0.9, rx, 1.15, col, soft(col, by - 0.2, by + 2));
    line(() => (M(fx - rx + 0.3, by + 1.65), Q(fx, by + 2.15, fx + rx - 0.3, by + 1.65)), shade(col, -55), 0.4);
    if (L.female) {
      // giày búp bê quai ngang + khuy
      line(() => (M(x - 1.3, by + 0.05), Ln(x + 1.3, by + 0.05)), shade(col, -20), 0.45);
      dot(x + (side ? 0.9 : x < 12 ? -0.9 : 0.9), by + 0.05, 0.25, '#f2c230');
    }
    dot(fx + (side ? 0.8 : -0.45), by + 0.45, 0.38, rgba('#ffffff', 0.75));
  }
}

/** váy / phần hông quần (vẽ trước thân áo) */
function drawBottom(L: AvatarLook, dir: Dir) {
  const side = dir === 'side';
  const b = L.bottom;
  if (b.style === 'pants' || b.style === 'shorts') {
    shape(() => (side ? rr(9.1, 25.6, 6.3, 2.6, 1) : rr(8.2, 25.6, 7.6, 2.6, 1)), b.color, soft(b.color, 25.6, 28.2));
  } else if (b.style === 'skirt') {
    const col = b.color;
    const g = soft(col, 25.6, 30.6, 30, -40);
    if (side) {
      shape(() => {
        M(9.8, 25.6);
        Ln(14.6, 25.6);
        Q(16.0, 27.8, 16.6, 30.0);
        Q(12.2, 30.8, 7.8, 30.0);
        Q(8.4, 27.8, 9.8, 25.6);
      }, col, g);
    } else {
      shape(() => {
        M(8.0, 25.6);
        Ln(16.0, 25.6);
        Q(17.6, 27.8, 18.4, 30.1);
        Q(16.6, 30.8, 15.0, 30.3);
        Q(13.5, 30.9, 12, 30.4);
        Q(10.5, 30.9, 9.0, 30.3);
        Q(7.4, 30.8, 5.6, 30.1);
        Q(6.4, 27.8, 8.0, 25.6);
      }, col, g);
      for (const [x0, x1] of [[9.0, 7.4], [10.4, 9.6], [12, 12], [13.6, 14.4], [15.0, 16.6]]) line(() => (M(x0, 26.4), Ln(x1, 30.0)), shade(col, -38), 0.28);
      line(() => (M(6.2, 29.7), Q(12, 30.6, 17.8, 29.7)), shade(col, 45), 0.35);
    }
    if (b.trim) {
      // 2 sọc viền gấu kiểu đồng phục
      for (const y of [28.9, 29.5]) line(() => (side ? (M(8.3, y - 0.1), Q(12.2, y + 0.6, 16.1, y - 0.1)) : (M(6.0, y), Q(12, y + 0.8, 18.0, y))), b.trim!, 0.28);
    }
  }
}

// ---------------------------------------------------------------- thân áo

function torsoPath(side: boolean, female = false) {
  if (female) {
    // vai hẹp, eo thon, hông hơi xoè
    if (side) {
      M(9.8, 19.6);
      Q(12.2, 19.1, 14.6, 19.6);
      Q(15.2, 20.2, 14.9, 21.6);
      Q(14.2, 23.6, 14.5, 25.0);
      Q(15.6, 26.4, 15.5, 27.6);
      Q(12.2, 28.2, 9.0, 27.6);
      Q(9.0, 26.4, 9.9, 25.0);
      Q(10.2, 23.6, 9.5, 21.6);
      Q(9.2, 20.2, 9.8, 19.6);
    } else {
      M(9.0, 19.6);
      Q(12, 19.0, 15.0, 19.6);
      Q(15.8, 20.1, 15.6, 21.4);
      Q(14.6, 23.6, 15.0, 25.0);
      Q(16.4, 26.4, 16.3, 27.6);
      Q(12, 28.4, 7.7, 27.6);
      Q(7.6, 26.4, 9.0, 25.0);
      Q(9.4, 23.6, 8.4, 21.4);
      Q(8.2, 20.1, 9.0, 19.6);
    }
    return;
  }
  if (side) {
    M(9.4, 19.6);
    Q(12.2, 19.0, 15.0, 19.6);
    Q(15.7, 20.2, 15.5, 21.4);
    Ln(15.0, 25.0);
    Q(15.7, 26.4, 15.6, 27.6);
    Q(12.2, 28.2, 8.9, 27.6);
    Q(8.8, 26.4, 9.4, 25.0);
    Ln(9.0, 21.4);
    Q(8.8, 20.2, 9.4, 19.6);
  } else {
    M(8.4, 19.6);
    Q(12, 18.9, 15.6, 19.6);
    Q(16.3, 20.1, 16.1, 21.3);
    Ln(15.6, 25.0);
    Q(16.4, 26.4, 16.3, 27.6);
    Q(12, 28.4, 7.7, 27.6);
    Q(7.6, 26.4, 8.4, 25.0);
    Ln(7.9, 21.3);
    Q(7.7, 20.1, 8.4, 19.6);
  }
}

function belt(side: boolean, y = 25.0, col = '#4a2a14', buckle = '#f2c230') {
  c.beginPath();
  if (side) rr(8.8, y, 6.9, 1.2, 0.3);
  else rr(7.6, y, 8.8, 1.2, 0.3);
  fill(col);
  c.beginPath();
  if (side) rr(13.8, y - 0.1, 1.4, 1.4, 0.3);
  else rr(11.2, y - 0.1, 1.6, 1.4, 0.3);
  fill(buckle);
  dot(side ? 14.2 : 11.6, y + 0.3, 0.22, '#ffffff');
}

function drawTop(L: AvatarLook, dir: Dir) {
  const T = L.top;
  const side = dir === 'side';
  const up = dir === 'up';
  const col = T.color;
  const trim = T.trim ?? shade(col, -40);
  const dk = shade(col, -40);
  const lt = shade(col, 40);

  // phần tà dài (vẽ trước thân để thân đè lên eo)
  if (T.style === 'robe') {
    const g = soft(col, 26, 33.4, 20, -45);
    shape(() => (side
      ? (M(9.6, 26.4), Ln(14.8, 26.4), Q(16.6, 30, 16.8, 33.0), Q(12.2, 33.6, 8.0, 33.0), Q(8.4, 30, 9.6, 26.4))
      : (M(8.0, 26.4), Ln(16.0, 26.4), Q(17.6, 30, 18.2, 33.0), Q(12, 33.8, 5.8, 33.0), Q(6.4, 30, 8.0, 26.4))), col, g);
    line(() => (side ? (M(8.2, 32.6), Q(12.2, 33.2, 16.6, 32.6)) : (M(6.0, 32.6), Q(12, 33.4, 18.0, 32.6))), trim, 0.8);
    if (!up && !side) c.beginPath(), rr(11.2, 26.4, 1.6, 6.9, 0.3), fill(trim);
  } else if (T.style === 'dress') {
    const g = soft(col, 24.5, 30.8, 30, -40);
    shape(() => (side
      ? (M(9.8, 24.6), Ln(14.6, 24.6), Q(16.8, 27.6, 17.2, 30.4), Q(12.2, 31.2, 7.4, 30.4), Q(8.0, 27.6, 9.8, 24.6))
      : (M(8.2, 24.6), Ln(15.8, 24.6), Q(18.6, 27.6, 19.2, 30.4), Q(17.4, 31.2, 15.6, 30.6), Q(13.8, 31.3, 12, 30.7), Q(10.2, 31.3, 8.4, 30.6), Q(6.6, 31.2, 4.8, 30.4), Q(5.4, 27.6, 8.2, 24.6))), col, g);
    line(() => (side ? (M(7.6, 30.1), Q(12.2, 30.9, 17.0, 30.1)) : (M(5.0, 30.1), Q(12, 31.0, 19.0, 30.1))), trim, 0.7);
    if (!side) for (const [x0, x1] of [[10, 8.6], [14, 15.4]]) line(() => (M(x0, 25.4), Ln(x1, 30.0)), shade(col, -30), 0.3);
  } else if (T.style === 'gown') {
    // váy dài chấm gót, có tầng bèo
    const g = soft(col, 24.5, 33.6, 30, -42);
    shape(() => (side
      ? (M(9.8, 24.6), Ln(14.8, 24.6), Q(17.4, 29, 17.8, 33.0), Q(12.4, 33.9, 7.0, 33.0), Q(7.6, 29, 9.8, 24.6))
      : (M(8.4, 24.6), Ln(15.6, 24.6), Q(19.0, 29, 19.8, 33.0), Q(17.8, 33.8, 15.9, 33.2), Q(14.0, 33.9, 12, 33.3), Q(10.0, 33.9, 8.1, 33.2), Q(6.2, 33.8, 4.2, 33.0), Q(5.0, 29, 8.4, 24.6))), col, g);
    if (!side) {
      line(() => (M(5.6, 29.4), Q(7.2, 30.2, 8.8, 29.6), Q(10.4, 30.4, 12, 29.7), Q(13.6, 30.4, 15.2, 29.6), Q(16.8, 30.2, 18.4, 29.4)), trim, 0.55);
      for (const [x0, x1] of [[10.2, 8.2], [13.8, 15.8]]) line(() => (M(x0, 25.4), Q(x0 + (x1 - x0) * 0.3, 29, x1, 32.8)), shade(col, -32), 0.3);
      sparkle(9.0, 31.2, 0.5, rgba('#ffffff', 0.8));
      sparkle(15.4, 30.6, 0.45, rgba('#ffffff', 0.8));
    }
    line(() => (side ? (M(7.2, 32.7), Q(12.4, 33.5, 17.6, 32.7)) : (M(4.5, 32.7), Q(12, 33.7, 19.5, 32.7))), trim, 0.75);
  } else if (T.style === 'battledress') {
    // váy giáp: các phiến giáp xoè, viền kim loại
    const g = soft(col, 25, 30.6, 40, -40);
    shape(() => (side
      ? (M(9.6, 25.2), Ln(14.8, 25.2), Q(16.8, 27.8, 17.2, 30.2), Q(12.2, 30.9, 7.4, 30.2), Q(8.0, 27.8, 9.6, 25.2))
      : (M(8.2, 25.2), Ln(15.8, 25.2), Q(18.2, 27.8, 18.9, 30.2), Q(12, 31.1, 5.1, 30.2), Q(5.8, 27.8, 8.2, 25.2))), col, g);
    if (!side) for (const [x0, x1] of [[9.9, 8.4], [12, 12], [14.1, 15.6]]) line(() => (M(x0, 25.6), Ln(x1, 30.4)), shade(col, -45), 0.35);
    line(() => (side ? (M(7.6, 30.0), Q(12.2, 30.8, 17.0, 30.0)) : (M(5.3, 30.0), Q(12, 31.0, 18.7, 30.0))), trim, 0.8);
  } else if (T.style === 'aodai') {
    const g = soft(col, 26, 33, 22, -40);
    shape(() => (side
      ? (M(10.0, 26.6), Ln(14.6, 26.6), Q(15.6, 29.6, 16.4, 32.6), Ln(11.4, 32.8), Q(10.4, 29.6, 10.0, 26.6))
      : (M(9.2, 26.6), Ln(14.8, 26.6), Q(14.6, 30, 14.4, 32.8), Q(12, 33.2, 9.6, 32.8), Q(9.4, 30, 9.2, 26.6))), col, g);
    line(() => (side ? (M(11.4, 32.6), Ln(16.3, 32.4)) : (M(9.7, 32.6), Q(12, 33.0, 14.3, 32.6))), trim, 0.7);
  }

  // thân (kiểu idol / street nhìn chính diện: lộ áo trong)
  const fem = L.female;
  const layered = (T.style === 'idol' || T.style === 'street') && !side && !up;
  const bodyCol = layered ? L.inner ?? '#f8f8f4' : col;
  const gBody = soft(bodyCol, 19, 28.2, layered ? 8 : 30, layered ? -22 : -38);
  shape(() => torsoPath(side, fem), bodyCol, gBody);

  clipped(() => torsoPath(side, fem), () => {
    // bóng nhẹ phía dưới cánh tay + vệt sáng vai
    if (!side) {
      ell(12, 19.4, 5.2, 0.9);
      fill(rgba(lt, 0.35));
    }
    if (up) {
      if (T.style === 'hoodie') shape(() => (M(9.4, 19.4), Q(12, 18.8, 14.6, 19.4), Q(14.4, 23.0, 12, 23.6), Q(9.6, 23.0, 9.4, 19.4)), dk, null, 0.3);
      if (['tunic', 'leather', 'plate', 'plate_dragon', 'chain', 'royal'].includes(T.style)) belt(false, 25.0, shade(trim, -60), trim);
      if (T.style === 'apron') line(() => (M(7.8, 25.2), Ln(16.2, 25.2)), trim, 0.6), dot(12, 25.2, 0.7, trim);
      if (T.style === 'chain') chainmail(side, lt);
      if (T.style === 'ribs') ribs(side, true);
      return;
    }
    if (side) {
      switch (T.style) {
        case 'tunic':
        case 'leather':
        case 'plate':
        case 'plate_dragon':
        case 'royal':
          belt(true);
          break;
        case 'chain':
          chainmail(true, lt);
          belt(true, 25.0, shade(trim, -50), trim);
          break;
        case 'jacket':
          c.beginPath(), rr(14.0, 19.2, 1.6, 9, 0.2), fill(trim);
          break;
        case 'sailor':
          shape(() => (M(10.0, 19.4), Ln(11.8, 19.4), Ln(11.0, 22.0), Ln(9.6, 21.2)), trim, null, 0.25);
          dot(14.2, 21.2, 0.6, '#d8303a');
          break;
        case 'apron':
          c.beginPath(), rr(13.8, 21.0, 1.8, 7, 0.4), fill(trim);
          break;
        case 'hoodie':
          shape(() => (M(9.4, 19.4), Q(10.0, 22.4, 11.4, 22.6), Q(12.0, 21.0, 11.4, 19.4)), dk, null, 0.25);
          break;
        case 'ribs':
          ribs(true, false);
          break;
        case 'blouse':
          c.beginPath(), rr(9.0, 24.0, 6.4, 3.8, 0.4), fill(shade(T.color, -55));
          dot(14.0, 20.4, 0.6, '#e8304a');
          break;
        case 'gown':
        case 'battledress':
          c.beginPath(), rr(9.0, 24.0, 6.4, 0.9, 0.3), fill(trim);
          break;
        case 'idol':
          shape(() => (M(13.4, 19.4), Q(14.8, 20.0, 15.4, 21.6), Ln(14.6, 23.6), Q(13.6, 22.0, 13.4, 19.4)), L.inner ?? '#ffffff', null, 0.25);
          bow(14.6, 20.6, 0.8, trim);
          break;
        case 'street':
          c.beginPath(), rr(14.0, 19.4, 1.6, 9, 0.3), fill(L.inner ?? '#f4f4f0');
          line(() => (M(13.9, 19.6), Ln(13.9, 28.0)), shade(col, -45), 0.3);
          line(() => (M(10.0, 26.4), Ln(12.6, 26.4)), shade(col, -40), 0.3);
          break;
      }
      return;
    }
    const cx = 12;
    switch (T.style) {
      case 'tunic':
        shape(() => (M(10.6, 19.0), Ln(cx, 21.9), Ln(13.4, 19.0)), L.skin, null, 0.25);
        line(() => (M(10.4, 19.2), Ln(cx, 22.2), Ln(13.6, 19.2)), trim, 0.45);
        belt(false);
        c.beginPath(), rr(7.5, 26.7, 9, 1.6, 0.2), fill(rgba(trim, 0.9));
        break;
      case 'tee':
        shape(() => (M(10.4, 19.0), Q(cx, 21.0, 13.6, 19.0)), L.skin, null, 0.25);
        line(() => (M(10.3, 19.2), Q(cx, 21.2, 13.7, 19.2)), T.trim ?? dk, 0.5);
        if (T.trim) sparkle(cx, 23.6, 1.3, T.trim);
        break;
      case 'hoodie':
        shape(() => (M(9.4, 19.2), Q(cx, 22.2, 14.6, 19.2), Q(cx, 20.4, 9.4, 19.2)), dk, null, 0.3);
        line(() => (M(11.0, 20.6), Ln(10.8, 23.0)), trim, 0.35);
        line(() => (M(13.0, 20.6), Ln(13.2, 23.0)), trim, 0.35);
        dot(10.8, 23.1, 0.35, trim);
        dot(13.2, 23.1, 0.35, trim);
        line(() => (M(9.4, 26.6), Ln(9.8, 24.6), Ln(14.2, 24.6), Ln(14.6, 26.6)), dk, 0.35);
        break;
      case 'jacket':
        shape(() => (M(10.8, 19.0), Ln(13.2, 19.0), Ln(12.8, 28.4), Ln(11.2, 28.4)), trim, null, 0.2);
        // nam thắt cà vạt, nữ thắt nơ
        if (L.female) bow(cx, 20.4, 0.9, '#c8303a');
        else shape(() => (M(11.6, 19.8), Ln(12.4, 19.8), Ln(12.7, 23.4), Ln(12, 24.4), Ln(11.3, 23.4)), '#c8303a', null, 0.2);
        shape(() => (M(10.6, 19.0), Ln(9.2, 21.2), Ln(10.8, 23.4)), dk, null, 0.25);
        shape(() => (M(13.4, 19.0), Ln(14.8, 21.2), Ln(13.2, 23.4)), dk, null, 0.25);
        dot(10.3, 25.0, 0.3, lt);
        dot(13.7, 25.0, 0.3, lt);
        break;
      case 'leather':
        capsule(8.4, 20.0, 15.4, 26.4, 1.0, trim);
        dot(11.9, 23.2, 0.55, '#f2c230');
        belt(false, 25.2, shade(trim, -50));
        line(() => (M(7.8, 27.4), Q(cx, 28.1, 16.2, 27.4)), trim, 0.6);
        break;
      case 'chain':
        chainmail(false, lt);
        shape(() => (M(10.0, 19.4), Ln(14.0, 19.4), Ln(13.6, 28.4), Ln(10.4, 28.4)), trim, soft(trim, 19, 28), 0.25);
        sparkle(cx, 22.6, 1.1, shade(trim, -60));
        belt(false, 25.2, shade(trim, -70), '#f2c230');
        break;
      case 'plate':
      case 'plate_dragon':
        shape(() => (M(9.0, 20.0), Q(cx, 19.4, 15.0, 20.0), Q(15.0, 23.8, cx, 24.8), Q(9.0, 23.8, 9.0, 20.0)), lt, vg(19.4, 24.8, [[0, shade(col, 70)], [1, col]]), 0.25);
        line(() => (M(cx, 19.8), Ln(cx, 24.4)), dk, 0.3);
        line(() => (M(9.6, 20.6), Q(10.4, 20.2, 11.0, 20.4)), '#ffffff', 0.4);
        for (const y of [25.6, 26.6]) line(() => (M(8.4, y), Q(cx, y + 0.5, 15.6, y)), dk, 0.3);
        line(() => (M(7.8, 27.5), Q(cx, 28.3, 16.2, 27.5)), trim, 0.7);
        if (T.style === 'plate_dragon') {
          shape(() => (M(cx, 20.4), Q(13.6, 21.0, 13.2, 22.6), Q(cx, 22.0, 10.8, 22.6), Q(10.4, 21.0, cx, 20.4)), trim, null, 0.25);
        }
        break;
      case 'robe':
        shape(() => (M(10.4, 19.0), Ln(cx, 22.0), Ln(13.6, 19.0)), shade(col, -25), null, 0.2);
        c.beginPath(), rr(11.2, 21.6, 1.6, 7, 0.3), fill(trim);
        line(() => (M(10.2, 19.2), Ln(cx, 22.2), Ln(13.8, 19.2)), trim, 0.5);
        belt(false, 25.0, shade(trim, -50), trim);
        break;
      case 'dress':
        shape(() => (M(10.0, 19.0), Q(cx, 21.0, 14.0, 19.0)), L.skin, null, 0.25);
        line(() => (M(9.8, 19.2), Q(cx, 21.2, 14.2, 19.2)), trim, 0.55);
        c.beginPath(), rr(8.0, 24.0, 8.0, 1.0, 0.3), fill(trim);
        bow(cx, 24.5, 1.0, trim);
        break;
      case 'aodai':
        c.beginPath(), rr(10.4, 18.8, 3.2, 1.4, 0.4), fill(trim);
        line(() => (M(cx, 20.2), Q(13.6, 20.4, 15.4, 21.8)), trim, 0.5);
        for (const [x, y] of [[13.2, 20.6], [14.4, 21.1]]) dot(x, y, 0.28, '#ffffff');
        line(() => (M(9.8, 26.8), Q(cx, 27.2, 14.2, 26.8)), shade(col, -30), 0.3);
        break;
      case 'sailor':
        shape(() => (M(8.2, 19.4), Ln(15.8, 19.4), Ln(14.6, 22.6), Ln(cx, 21.2), Ln(9.4, 22.6)), trim, null, 0.25);
        line(() => (M(9.2, 21.6), Ln(cx, 20.4), Ln(14.8, 21.6)), '#ffffff', 0.3);
        bow(cx, 21.6, 1.2, '#d8303a');
        break;
      case 'royal':
        shape(() => (M(8.2, 19.2), Q(cx, 18.4, 15.8, 19.2), Q(15.6, 21.0, cx, 21.2), Q(8.4, 21.0, 8.2, 19.2)), '#f4f4f0', null, 0.25);
        for (const x of [9.6, 12, 14.4]) dot(x, 19.9, 0.28, '#1a1a22');
        c.beginPath(), rr(11.1, 21.0, 1.8, 7, 0.3), fill(trim);
        for (const y of [22.4, 24.0]) dot(cx, y, 0.35, '#ffffff');
        belt(false, 25.2, shade(trim, -60), trim);
        break;
      case 'apron':
        shape(() => (M(9.4, 21.2), Ln(14.6, 21.2), Ln(15.0, 28.6), Ln(9.0, 28.6)), trim, soft(trim, 21, 28.6, 20, -20), 0.25);
        line(() => (M(9.6, 21.3), Ln(8.6, 19.5)), trim, 0.5);
        line(() => (M(14.4, 21.3), Ln(15.4, 19.5)), trim, 0.5);
        shape(() => rr(10.6, 24.2, 2.8, 1.8, 0.4), shade(trim, -20), null, 0.25);
        break;
      case 'ribs':
        ribs(false, false);
        break;
      case 'blouse':
        // cổ sen trắng + nơ + áo nịt eo đan dây
        shape(() => (M(9.4, 19.2), Q(10.4, 21.4, 12, 20.4), Q(13.6, 21.4, 14.6, 19.2), Q(12, 19.9, 9.4, 19.2)), '#ffffff', null, 0.25);
        shape(() => (M(9.2, 24.0), Q(12, 23.4, 14.8, 24.0), Ln(15.2, 27.8), Q(12, 28.4, 8.8, 27.8)), shade(col, -55), soft(shade(col, -55), 24, 28), 0.25);
        for (const y of [24.9, 25.9, 26.9]) {
          line(() => (M(11.2, y), Ln(12.8, y + 0.5)), T.trim ?? '#ffffff', 0.22);
          line(() => (M(12.8, y), Ln(11.2, y + 0.5)), T.trim ?? '#ffffff', 0.22);
        }
        bow(cx, 20.6, 0.95, '#e8304a');
        break;
      case 'gown':
        shape(() => (M(9.4, 19.0), Q(10.6, 20.8, cx, 20.0), Q(13.4, 20.8, 14.6, 19.0)), L.skin, null, 0.25);
        line(() => (M(9.2, 19.3), Q(10.6, 21.2, cx, 20.4), Q(13.4, 21.2, 14.8, 19.3)), trim, 0.5);
        c.beginPath(), rr(8.6, 24.0, 6.8, 1.0, 0.3), fill(trim);
        gemDot(cx, 22.2, trim);
        bow(cx, 24.5, 0.8, trim);
        break;
      case 'idol': {
        // áo bolero ngắn 2 vạt + viền + cúc vàng
        const g = soft(col, 19, 24, 34, -30);
        both(() => {
          shape(() => (M(9.2, 19.3), Q(7.8, 19.8, 7.9, 21.6), Q(8.2, 23.4, 8.6, 24.0), Q(9.8, 24.3, 10.6, 23.6), Q(10.4, 21.6, 11.0, 20.6), Q(10.6, 19.6, 9.2, 19.3)), col, g, 0.3);
          line(() => (M(10.9, 20.7), Q(10.4, 21.8, 10.6, 23.5)), '#ffffff', 0.3);
          dot(9.9, 22.4, 0.32, '#f2c230');
        });
        // cổ sơ mi + nơ to rủ dải
        shape(() => (M(10.4, 19.2), Ln(11.6, 20.6), Ln(12, 19.6), Ln(12.4, 20.6), Ln(13.6, 19.2)), L.inner ?? '#ffffff', null, 0.25);
        shape(() => (M(11.7, 20.6), Q(11.0, 21.8, 10.9, 22.8), Ln(11.6, 22.5), Ln(12, 21.0)), trim, null, 0.22);
        shape(() => (M(12.3, 20.6), Q(13.0, 21.8, 13.1, 22.8), Ln(12.4, 22.5), Ln(12, 21.0)), trim, null, 0.22);
        bow(cx, 20.6, 1.25, trim);
        dot(cx - 1.0, 20.2, 0.22, rgba('#ffffff', 0.7));
        break;
      }
      case 'street':
        // áo thun in hình
        shape(() => (M(10.6, 19.0), Q(cx, 20.6, 13.4, 19.0)), L.skin, null, 0.22);
        line(() => (M(10.5, 19.2), Q(cx, 20.8, 13.5, 19.2)), shade(L.inner ?? '#f4f4f0', -50), 0.35);
        shape(() => (M(cx, 21.6), Ln(13.2, 23.0), Ln(cx, 24.4), Ln(10.8, 23.0)), trim, null, 0.25);
        sparkle(cx, 23.0, 0.75, '#ffffff');
        c.beginPath(), rr(10.8, 24.9, 2.4, 0.45, 0.2), fill(trim);
        break;
      case 'battledress':
        shape(() => (M(9.4, 19.4), Q(cx, 18.9, 14.6, 19.4), Q(14.8, 23.6, cx, 24.6), Q(9.2, 23.6, 9.4, 19.4)), lt, vg(19, 24.6, [[0, shade(col, 70)], [1, col]]), 0.25);
        line(() => (M(10.0, 20.2), Q(10.6, 19.8, 11.2, 20.0)), '#ffffff', 0.4);
        line(() => (M(9.0, 24.4), Q(cx, 25.4, 15.0, 24.4)), trim, 0.8);
        bow(cx, 24.6, 0.75, trim);
        break;
    }
  });
  // vẽ lại viền thân sau khi tô chi tiết
  c.beginPath();
  torsoPath(side, fem);
  c.closePath();
  ink(inkOf(col));
  if (T.style === 'street') streetJacket(L, dir);
  if (T.style === 'idol') idolWaist(L, dir);

  // lõi năng lượng / huy hiệu ngực của chiến giáp
  if (L.crest && !up) {
    if (side) {
      shape(() => (M(14.2, 21.6), Ln(15.0, 22.6), Ln(14.2, 23.6), Ln(13.4, 22.6)), trim, null, 0.25);
      dot(14.2, 22.6, 0.4, L.crest);
    } else {
      shape(() => (M(12, 20.9), Ln(13.5, 22.6), Ln(12, 24.3), Ln(10.5, 22.6)), trim, soft(trim, 21, 24.3), 0.3);
      const g = vg(21.6, 23.6, [[0, shade(L.crest, 70)], [1, shade(L.crest, -40)]]);
      c.beginPath();
      M(12, 21.6), Ln(12.8, 22.6), Ln(12, 23.6), Ln(11.2, 22.6), c.closePath();
      fill(g);
      sparkle(11.7, 22.2, 0.6);
    }
  }
}

function chainmail(side: boolean, lt: string) {
  const [x0, x1] = side ? [8.8, 15.6] : [7.6, 16.4];
  for (let y = 20.2, row = 0; y < 28; y += 0.9, row++)
    for (let x = x0 + (row % 2) * 0.5; x < x1; x += 1.0) {
      c.beginPath();
      c.arc(x, y, 0.42, 0, Math.PI);
      ink(lt, 0.18);
    }
}
function ribs(side: boolean, back: boolean) {
  const dk = '#8a8678';
  if (!side) {
    c.beginPath(), rr(11.4, 19.4, 1.2, 8.4, 0.4), fill(back ? '#c8c4b4' : '#a8a494');
    for (const y of [21.0, 22.6, 24.2]) line(() => (M(8.4, y + 0.6), Q(12, y - 0.6, 15.6, y + 0.6)), dk, 0.45);
  } else for (const y of [21.0, 22.6, 24.2]) line(() => (M(10.0, y), Q(12.4, y - 0.4, 14.6, y + 0.5)), dk, 0.45);
}
function bow(x: number, y: number, s: number, col: string) {
  shape(() => (M(x, y), Q(x - 1.6 * s, y - 1.3 * s, x - 1.8 * s, y), Q(x - 1.6 * s, y + 1.3 * s, x, y)), col, null, 0.25);
  shape(() => (M(x, y), Q(x + 1.6 * s, y - 1.3 * s, x + 1.8 * s, y), Q(x + 1.6 * s, y + 1.3 * s, x, y)), col, null, 0.25);
  dot(x, y, 0.45 * s, shade(col, -30));
}

/** áo khoác mở của kiểu street: 2 vạt dài qua hông, cổ dựng, khoá kéo, túi */
function streetJacket(L: AvatarLook, dir: Dir) {
  const col = L.top.color;
  const g = soft(col, 19, 29, 34, -40);
  if (dir === 'down') {
    both(() => {
      shape(() => (M(9.6, 19.0), Q(7.7, 19.4, 7.7, 21.2), Q(7.6, 25.6, 7.4, 28.8), Q(9.0, 29.3, 10.7, 28.8), Q(10.5, 24.0, 10.6, 21.6), Q(10.4, 20.2, 9.6, 19.0)), col, g, 0.32);
      line(() => (M(10.55, 21.6), Ln(10.6, 28.6)), shade(col, -50), 0.25);
      line(() => (M(8.0, 26.4), Q(9.0, 26.8, 10.0, 26.4)), shade(col, -45), 0.28);
      // cổ áo dựng
      shape(() => (M(9.8, 18.8), Q(8.6, 18.6, 8.4, 19.6), Q(9.8, 20.6, 10.8, 21.4), Q(10.6, 19.8, 9.8, 18.8)), shade(col, -18), null, 0.25);
    });
    // gấu áo bo
    for (const x of [7.5, 13.3]) c.beginPath(), rr(x, 28.2, 3.2, 0.7, 0.3), fill(shade(col, -35));
  } else if (dir === 'side') {
    shape(() => (M(9.0, 27.6), Q(12.2, 28.4, 15.6, 27.6), Q(15.8, 28.6, 15.6, 29.0), Q(12.2, 29.6, 8.8, 29.0), Q(8.6, 28.4, 9.0, 27.6)), col, g, 0.3);
  } else {
    shape(() => (M(7.8, 27.4), Q(12, 28.4, 16.2, 27.4), Ln(16.4, 28.8), Q(12, 29.6, 7.6, 28.8)), col, g, 0.3);
    line(() => (M(12, 19.6), Ln(12, 28.6)), shade(col, -40), 0.28);
    // mũ trùm sau lưng
    shape(() => (M(9.2, 19.2), Q(12, 18.6, 14.8, 19.2), Q(14.6, 22.0, 12, 22.4), Q(9.4, 22.0, 9.2, 19.2)), shade(col, -20), null, 0.3);
  }
}

/** chân váy lưng cao của kiểu idol: đai eo màu váy + 2 cúc */
function idolWaist(L: AvatarLook, dir: Dir) {
  if (L.bottom.style !== 'skirt') return;
  const sk = L.bottom.color;
  const side = dir === 'side';
  shape(() => (side ? rr(9.0, 24.6, 6.4, 2.6, 0.5) : (M(8.9, 24.7), Q(12, 24.2, 15.1, 24.7), Ln(15.7, 27.4), Q(12, 27.9, 8.3, 27.4))), sk, soft(sk, 24.4, 27.6, 30, -20), 0.3);
  if (dir === 'down') for (const y of [25.4, 26.6]) dot(12, y, 0.3, '#f2c230');
}

function gemDot(x: number, y: number, frame: string) {
  dot(x, y, 0.75, frame);
  dot(x, y, 0.45, '#e8304a');
  dot(x - 0.15, y - 0.18, 0.15, '#ffffff');
}

// ---------------------------------------------------------------- tay, cầu vai

function drawArms(L: AvatarLook, dir: Dir, f: number) {
  const puff = ['blouse', 'gown', 'dress'].includes(L.top.style);
  const longS = !['tee', 'apron', 'dress', 'ribs', 'sailor', 'blouse', 'gown'].includes(L.top.style);
  const sleeve = L.top.style === 'ribs' ? L.skin : L.top.color;
  const w = L.skeleton ? 1.2 : L.female ? 2.0 : 2.3;
  const sh = L.female ? 0.5 : 0; // vai nữ hẹp hơn
  const arm = (sx: number, sy: number, ex: number, ey: number, back = false) => {
    const sc = back ? shade(sleeve, -25) : sleeve;
    if (longS) capsule(sx, sy, ex, ey, w, sc);
    const at = (t: number): [number, number] => [sx + (ex - sx) * t, sy + (ey - sy) * t];
    if (L.top.style === 'idol') {
      const [px, py] = at(0.12);
      oval(px, py + 0.2, 1.45, 1.3, sc, soft(sc, py - 1.2, py + 1.5, 40, -20));
      const [cx0, cy0] = at(0.86);
      capsule(cx0, cy0, ex, ey, w + 0.25, L.inner ?? '#ffffff');
    } else if (L.top.style === 'street') {
      const [cx0, cy0] = at(0.8);
      capsule(cx0, cy0, ex, ey, w + 0.35, shade(sc, -30));
    }
    else {
      capsule(sx, sy, ex, ey, w - 0.3, back ? shade(L.skin, -20) : L.skin);
      if (puff) oval(sx + (ex - sx) * 0.15, sy + (ey - sy) * 0.15 + 0.3, 1.55, 1.35, sc, soft(sc, sy - 1, sy + 1.8, 40, -20));
      else capsule(sx, sy, sx + (ex - sx) * 0.42, sy + (ey - sy) * 0.42, w + 0.25, sc);
    }
    if (L.gauntlets) {
      const gx = sx + (ex - sx) * 0.58;
      const gy = sy + (ey - sy) * 0.58;
      capsule(gx, gy, ex, ey, w + 0.4, L.gauntlets);
      line(() => (M(gx - 1.2, gy), Ln(gx + 1.2, gy)), L.top.trim ?? '#fbbf24', 0.45);
    }
    oval(ex, ey + 0.7, 1.05, 1.05, back ? shade(L.skin, -20) : L.skin);
  };
  if (dir === 'side') {
    const sw = f === 1 ? 1.4 : f === 2 ? -1.4 : 0.2;
    arm(12.2, 20.4, 12.2 + sw, 25.0);
  } else {
    const a = f === 1 ? 0.45 : f === 2 ? -0.45 : 0;
    arm(8.1 + sh, 20.3, 7.0 + sh, 25.0 + a);
    arm(15.9 - sh, 20.3, 17.0 - sh, 25.0 - a);
  }
}

function drawPauldrons(L: AvatarLook, dir: Dir) {
  const p = L.pauldrons;
  const side = dir === 'side';
  const trim = L.top.trim ?? '#fbbf24';
  const col = L.top.color;
  const gem = L.crest ?? trim;
  if (!p) {
    if (L.top.style === 'plate' || L.top.style === 'plate_dragon') {
      if (side) oval(12.2, 20.2, 1.8, 1.2, col, soft(col, 19, 21.4, 50));
      else both(() => oval(8.0, 20.1, 1.9, 1.25, col, soft(col, 18.8, 21.4, 50)));
    }
    return;
  }
  const big = p === 'light' ? 0 : p === 'knight' || p === 'mithril' || p === 'shadow' || p === 'valkyrie' ? 1 : 2;
  const fs = L.female ? 0.78 : 1;
  const rx = (1.9 + big * 0.35) * fs;
  const ry = (1.3 + big * 0.25) * fs;
  const one = (x: number, y: number) => {
    // phụ kiện vươn khỏi vai (vẽ trước để cầu vai đè gốc)
    if (p === 'shadow') {
      shape(() => (M(x - 1.0, y - 0.6), Q(x - 2.4, y - 2.0, x - 2.6, y - 3.6), Q(x - 0.8, y - 2.2, x + 0.4, y - 1.0)), trim, null, 0.25);
    } else if (p === 'dragon') {
      shape(() => (M(x - 0.8, y - 0.8), Q(x - 2.8, y - 2.0, x - 2.6, y - 4.4), Q(x - 1.4, y - 2.8, x + 0.6, y - 1.2)), '#fef08a', vg(y - 4.4, y, [[0, '#fff7c0'], [1, trim]]), 0.25);
    } else if (p === 'valkyrie' || p === 'celestial') {
      const wc = p === 'valkyrie' ? '#f8fafc' : '#e0f2fe';
      shape(() => (M(x - 0.6, y - 0.6), Q(x - 3.2, y - 2.0, x - 3.4, y - 4.0), Q(x - 2.6, y - 2.6, x - 2.0, y - 2.8), Q(x - 2.0, y - 1.6, x + 0.4, y - 0.8)), wc, null, 0.25);
    } else if (p === 'royal') {
      dot(x - 1.4, y - 1.2, 0.7, trim);
    } else if (p === 'mithril') {
      shape(() => (M(x - 1.2, y - 0.4), Q(x - 2.8, y - 1.4, x - 3.0, y - 2.8), Q(x - 1.6, y - 1.8, x, y - 0.8)), '#e0f2fe', null, 0.25);
    }
    oval(x, y, rx, ry, col, vg(y - ry, y + ry, [[0, shade(col, 60)], [0.5, col], [1, shade(col, -40)]]));
    c.beginPath();
    c.ellipse(x, y + 0.1, rx - 0.15, ry - 0.15, 0, Math.PI * 0.05, Math.PI * 0.95);
    ink(trim, 0.45);
    if (big) dot(x, y - 0.1, 0.42, gem);
    if (p === 'royal') for (const d of [-1, 0, 1]) dot(x + d * 0.8, y + ry + 0.15, 0.3, trim);
    if (p === 'celestial') dot(x - 2.4, y - 3.6, 0.6, '#fde047');
  };
  if (side) one(12.2, 20.3);
  else both(() => one(L.female ? 8.6 : 8.0, 20.1));
}

function drawScarf(L: AvatarLook, dir: Dir) {
  const col = L.scarf!;
  const g = soft(col, 18.6, 21, 30, -30);
  const fr = shade(col, -35);
  // vòng khăn quanh cổ
  shape(() => (M(8.6, 19.0), Q(12, 18.0, 15.4, 19.0), Q(15.6, 20.2, 14.8, 20.8), Q(12, 21.6, 9.2, 20.8), Q(8.4, 20.2, 8.6, 19.0)), col, g, 0.3);
  line(() => (M(9.4, 20.0), Q(12, 20.8, 14.6, 20.0)), fr, 0.25);
  if (dir === 'down') {
    // đuôi khăn rủ trước ngực bên trái + tua rua
    shape(() => (M(9.6, 20.4), Q(8.6, 22.4, 9.0, 24.6), Ln(10.8, 24.6), Q(10.8, 22.4, 11.2, 20.8)), col, soft(col, 20, 24.6, 20, -30), 0.3);
    for (const x of [9.4, 10.0, 10.6]) line(() => (M(x, 24.6), Ln(x, 25.3)), col, 0.25);
    line(() => (M(9.1, 23.6), Ln(10.8, 23.6)), fr, 0.3);
  } else if (dir === 'side') {
    // đuôi khăn bay ra sau
    shape(() => (M(10.4, 19.8), Q(8.0, 19.4, 5.6, 20.8), Ln(5.2, 22.6), Q(7.6, 21.6, 10.0, 21.4)), col, g, 0.3);
    line(() => (M(5.6, 21.0), Ln(5.3, 22.4)), fr, 0.3);
  } else {
    shape(() => (M(13.0, 20.6), Q(13.8, 22.8, 13.2, 25.0), Ln(14.8, 25.2), Q(15.0, 22.6, 14.6, 20.4)), col, soft(col, 20, 25, 20, -30), 0.3);
  }
}

function drawNeck(L: AvatarLook, dir: Dir) {
  if (L.scarf) drawScarf(L, dir);
  if (!L.neck || !NECK_COLOR[L.neck] || dir === 'up') return;
  const [chain, gem] = NECK_COLOR[L.neck];
  if (dir === 'side') {
    line(() => (M(12.6, 19.4), Q(13.6, 20.8, 14.4, 20.4)), chain, 0.3);
    dot(14.2, 20.8, 0.5, gem);
    return;
  }
  line(() => (M(9.8, 19.3), Q(12, 21.6, 14.2, 19.3)), chain, 0.32);
  c.beginPath();
  M(12, 20.3), Ln(12.75, 21.1), Ln(12, 22.1), Ln(11.25, 21.1), c.closePath();
  fill(gem);
  ink(inkOf(chain), 0.2);
  dot(11.8, 20.9, 0.2, '#ffffff');
}

// ---------------------------------------------------------------- đầu & mặt

function headPath(hx: number) {
  M(hx - 7.5, 12.8);
  B(hx - 7.5, 7.7, hx - 4.2, 5.9, hx, 5.9);
  B(hx + 4.2, 5.9, hx + 7.5, 7.7, hx + 7.5, 12.8);
  B(hx + 7.5, 16.9, hx + 4.3, 19.6, hx, 19.6);
  B(hx - 4.3, 19.6, hx - 7.5, 16.9, hx - 7.5, 12.8);
}

function drawHead(L: AvatarLook, dir: Dir, f: number) {
  const side = dir === 'side';
  const up = dir === 'up';
  const sk = L.skin;
  const skInk = mix(sk, '#5a2418', 0.62);
  const hx = side ? 12.5 : 12;

  // tai nhọn (goblin) / tai nhỏ (orc) nằm sau đầu
  if (L.ears === 'goblin') {
    if (!side) both(() => shape(() => (M(5.0, 12.2), Ln(0.4, 9.6), Q(2.2, 14.8, 5.2, 15.6)), sk, null));
  } else if (L.ears === 'small' && !side) {
    both(() => shape(() => (M(4.8, 12.4), Ln(2.6, 10.6), Q(3.0, 14.6, 5.0, 15.4)), sk, null));
  }
  if (!side && !up) both(() => oval(4.6, 14.6, 0.95, 1.3, sk));

  // khuôn mặt
  c.beginPath();
  headPath(hx);
  c.closePath();
  const g = c.createRadialGradient(hx - 1.8, 11.2, 1, hx, 12.8, 9.5);
  g.addColorStop(0, shade(sk, 12));
  g.addColorStop(0.65, sk);
  g.addColorStop(1, shade(sk, -22));
  fill(g);
  ink(skInk);

  if (up) {
    hairUp(L, f);
    drawHeadwear(L, dir);
    return;
  }
  // bóng tóc đổ lên trán
  clipped(() => headPath(hx), () => {
    ell(hx + (side ? 1.2 : 0), 10.2, 6.8, 3.0);
    fill(rgba(shade(sk, -40), 0.35));
  });

  drawFace(L, side, hx);
  hairFront(L, dir, f);
  if (side) {
    if (L.ears === 'goblin') {
      shape(() => (M(11.6, 13.0), Ln(5.4, 9.2), Q(7.0, 14.8, 11.2, 15.8)), sk, null);
      line(() => (M(10.4, 13.6), Q(8.0, 12.0, 7.0, 11.0)), shade(sk, -35), 0.3);
    } else {
      ell(10.8, 14.8, 0.9, 1.25);
      fill(sk);
      ink(mix(sk, '#5a2418', 0.4), 0.28);
      line(() => (M(11.0, 14.2), Q(10.5, 14.8, 11.0, 15.4)), shade(sk, -40), 0.22);
    }
  }

  // bông tai
  if (L.ear && EAR_COLOR[L.ear]) {
    const ec = EAR_COLOR[L.ear];
    const ear = (x: number) => {
      line(() => (M(x, 15.8), Ln(x, 16.6)), ec, 0.22);
      dot(x, 17.0, 0.5, ec);
      dot(x - 0.15, 16.85, 0.15, '#ffffff');
    };
    if (side) ear(10.8);
    else ear(4.6), ear(19.4);
  }
  // kính
  if (L.face) {
    const [frame, lens] = FACE_STYLE[L.face] ?? FACE_STYLE.face_round;
    const glass = (x: number, rx: number) => {
      ell(x, 14.5, rx, 1.75);
      fill(rgba(lens, L.face === 'face_sun' ? 0.88 : 0.4));
      ink(frame, 0.42);
      line(() => (M(x - rx * 0.5, 13.6), Ln(x - rx * 0.1, 13.3)), '#ffffff', 0.25);
    };
    if (side) {
      glass(16.6, 1.5);
      line(() => (M(15.1, 14.0), Ln(11.4, 13.6)), frame, 0.38);
    } else {
      glass(9.0, 2.0);
      glass(15.0, 2.0);
      line(() => (M(11.0, 14.1), Q(12, 13.6, 13.0, 14.1)), frame, 0.38);
    }
    if (L.face === 'face_heart' || L.face === 'face_star') for (const x of side ? [16.6] : [9.0, 15.0]) sparkle(x + 0.8, 13.6, 0.55);
  }
  drawHeadwear(L, dir);
}

function drawFace(L: AvatarLook, side: boolean, hx: number) {
  const sk = L.skin;
  if (L.skeleton) {
    const sock = (x: number, rx: number) => {
      oval(x, 14.2, rx, 1.8, '#2a2420');
      dot(x, 14.4, 0.5, L.eyes);
    };
    if (side) sock(16.6, 1.3);
    else sock(9.2, 1.7), sock(14.8, 1.7);
    shape(() => (side ? (M(19.0, 15.6), Ln(19.8, 16.6), Ln(18.8, 16.6)) : (M(12, 15.8), Ln(12.7, 16.9), Ln(11.3, 16.9))), '#2a2420', null, 0.2);
    const [x0, x1] = side ? [16.4, 19.4] : [9.6, 14.4];
    c.beginPath(), rr(x0, 17.4, x1 - x0, 1.2, 0.3), fill('#2a2420');
    for (let x = x0 + 0.5; x < x1 - 0.2; x += 0.95) c.beginPath(), rr(x, 17.5, 0.7, 1.0, 0.2), fill(sk);
    return;
  }
  // má hồng
  const blush = rgba('#ff7a8a', L.female ? 0.5 : 0.36);
  if (side) {
    ell(17.6, 16.6, 1.2, 0.6), fill(blush);
  } else {
    ell(7.6, 16.6, 1.35, 0.65), fill(blush);
    ell(16.4, 16.6, 1.35, 0.65), fill(blush);
  }
  // mắt
  if (side) eyeSide(L, 16.7, 14.5);
  else eyeFront(L, 9.0, 14.5, -1), eyeFront(L, 15.0, 14.5, 1);
  // mũi & miệng
  const mouthCol = L.female ? '#c2414b' : '#9a3a2e';
  if (side) {
    dot(19.6, 15.8, 0.22, shade(sk, -45));
    if (L.female) shape(() => (M(17.9, 17.5), Q(18.7, 18.4, 19.2, 17.4), Q(18.6, 17.7, 17.9, 17.5)), mouthCol, null, 0.2);
    else line(() => (M(17.9, 17.5), Q(18.6, 18.0, 19.1, 17.4)), mouthCol, 0.36);
  } else {
    dot(hx, 16.1, 0.22, shade(sk, -45));
    if (L.female) {
      shape(() => (M(11.3, 17.4), Q(12, 18.6, 12.7, 17.4), Q(12, 17.7, 11.3, 17.4)), mouthCol, null, 0.2);
      dot(12, 18.0, 0.22, '#f58a9a');
    } else line(() => (M(11.2, 17.4), Q(12, 18.2, 12.8, 17.4)), mouthCol, 0.38);
  }
  if (L.beard) {
    const bc = L.beard;
    const g = soft(bc, 15, 21.6, 30, -30);
    if (side) {
      shape(() => (M(11.6, 15.0), Q(12.2, 20.6, 16.4, 21.0), Q(19.4, 20.4, 19.8, 17.4), Q(18.4, 17.2, 17.2, 17.8), Q(14.4, 17.6, 11.6, 15.0)), bc, g);
      dot(18.6, 18.1, 0.35, '#8a3a2e');
    } else {
      shape(() => (M(6.0, 14.8), Q(6.4, 20.6, 12, 21.6), Q(17.6, 20.6, 18.0, 14.8), Q(16.6, 17.4, 14.2, 17.0), Q(12, 16.6, 9.8, 17.0), Q(7.4, 17.4, 6.0, 14.8)), bc, g);
      shape(() => (M(12, 16.8), Q(10.2, 16.0, 9.4, 17.6), Q(10.8, 17.8, 12, 17.3), Q(13.2, 17.8, 14.6, 17.6), Q(13.8, 16.0, 12, 16.8)), shade(bc, -10), null, 0.25);
      ell(12, 18.4, 0.8, 0.35), fill('#8a3a2e');
    }
  }
  if (L.tusks) {
    const tusk = (x: number) => shape(() => (M(x - 0.45, 18.0), Ln(x, 16.4), Ln(x + 0.45, 18.0)), '#f4f0e8', null, 0.22);
    if (side) tusk(18.6);
    else tusk(10.8), tusk(13.2);
  }
}

/** mắt chibi to tròn: tròng chuyển màu, con ngươi, 2 đốm sáng, mi trên dày */
function eyeFront(L: AvatarLook, x: number, y: number, o: number) {
  const s = L.female ? 1.08 : 1;
  const rx = 1.45 * s;
  const ry = 1.95 * s;
  const glow = !!L.glowEyes;
  ell(x, y, rx, ry);
  fill(glow ? '#1a1220' : '#ffffff');
  if (glow) {
    c.save();
    c.shadowColor = L.eyes;
    c.shadowBlur = 1.5;
    ell(x, y + 0.2, rx * 0.7, ry * 0.55);
    fill(L.eyes);
    c.restore();
    dot(x - 0.3, y - 0.2, 0.35, '#ffffff');
  } else {
    ell(x, y + 0.15, rx * 0.88, ry * 0.92);
    fill(vg(y - ry, y + ry, [[0, shade(L.eyes, -75)], [0.5, L.eyes], [1, shade(L.eyes, 80)]]));
    ell(x, y + 0.05, rx * 0.42, ry * 0.46);
    fill(shade(L.eyes, -100));
    dot(x - 0.45, y - 0.7, 0.58 * s, '#ffffff');
    dot(x + 0.45, y + 0.8, 0.26, 'rgba(255,255,255,0.9)');
  }
  c.beginPath();
  c.ellipse(x, y + 0.25, rx + 0.25, ry + 0.05, 0, Math.PI * 1.06, Math.PI * 1.94);
  ink('#2a1814', 0.62);
  if (L.female) line(() => (M(x + o * (rx + 0.1), y - 0.9), Q(x + o * (rx + 0.7), y - 1.2, x + o * (rx + 0.95), y - 1.9)), '#2a1814', 0.42);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, Math.PI * 0.3, Math.PI * 0.7);
  ink(mix(L.skin, '#7a3a2a', 0.45), 0.25);
}
function eyeSide(L: AvatarLook, x: number, y: number) {
  const s = L.female ? 1.08 : 1;
  const rx = 1.05 * s;
  const ry = 1.9 * s;
  ell(x, y, rx, ry);
  fill(L.glowEyes ? '#1a1220' : '#ffffff');
  ell(x + 0.15, y + 0.15, rx * 0.85, ry * 0.9);
  fill(L.glowEyes ? L.eyes : vg(y - ry, y + ry, [[0, shade(L.eyes, -75)], [0.5, L.eyes], [1, shade(L.eyes, 80)]]));
  if (!L.glowEyes) {
    ell(x + 0.2, y + 0.05, rx * 0.4, ry * 0.45);
    fill(shade(L.eyes, -100));
  }
  dot(x - 0.2, y - 0.7, 0.5 * s, '#ffffff');
  c.beginPath();
  c.ellipse(x, y + 0.25, rx + 0.25, ry + 0.05, 0, Math.PI * 1.1, Math.PI * 1.95);
  ink('#2a1814', 0.6);
  if (L.female) line(() => (M(x + rx + 0.1, y - 0.9), Q(x + rx + 0.7, y - 1.2, x + rx + 0.9, y - 1.9)), '#2a1814', 0.4);
}

// ---------------------------------------------------------------- tóc

interface HairInk {
  h: string;
  hl: string;
  hd: string;
  line: string;
}
function hairInk(col: string): HairInk {
  return { h: col, hl: shade(col, 55), hd: shade(col, -45), line: mix(col, '#1a0e0a', 0.66) };
}
/** tô 1 mảng tóc: chuyển màu dọc + dải bóng (angel ring) + viền */
function hairShape(build: () => void, H: HairInk, y0: number, y1: number, shine = true) {
  c.beginPath();
  build();
  c.closePath();
  fill(vg(y0, y1, [[0, H.hl], [0.35, H.h], [1, H.hd]]));
  if (shine) {
    c.save();
    c.clip();
    c.beginPath();
    c.ellipse(12, 9.4, 6.2, 4.6, 0, Math.PI * 1.12, Math.PI * 1.42);
    ink(rgba('#ffffff', 0.45), 0.75);
    c.beginPath();
    c.ellipse(12, 9.4, 6.2, 4.6, 0, Math.PI * 1.56, Math.PI * 1.8);
    ink(rgba('#ffffff', 0.4), 0.75);
    c.restore();
    c.beginPath();
    build();
    c.closePath();
  }
  ink(H.line);
}

function hairBack(L: AvatarLook, dir: Dir, f: number) {
  const s = L.hair.style;
  if (s === 'bald') return;
  const H = hairInk(L.hair.color);
  const D = hairInk(shade(L.hair.color, -18));
  if (dir === 'side') {
    if (s === 'long') hairShape(() => (M(5.2, 8), Q(2.4, 18, 4.0 - (f ? 0.5 : 0), 26.6), Q(7, 27.4, 9.4, 26.0), Q(9.6, 20, 10.4, 15.6)), D, 8, 27, false);
    if (s === 'ponytail') {
      const sw = f === 1 ? 0.8 : f === 2 ? -0.4 : 0;
      hairShape(() => (M(6.6, 6.4), Q(0.4 - sw, 7.4, 1.2 - sw, 15.6), Q(1.8 - sw, 19.4, 3.8 - sw, 21.8), Q(3.8, 16.4, 5.2, 13.6), Q(6.4, 11, 7.6, 9.6)), H, 6, 22, false);
      dot(6.6, 7.4, 0.9, '#e11d48');
    }
    if (s === 'twintails') hairShape(() => (M(6.4, 8.6), Q(2.8, 12, 3.4, 18), Q(3.8, 22, 5.6, 24.6), Q(5.6, 19.6, 6.6, 16.6), Q(7.6, 13, 8.4, 11)), H, 8, 25, false);
    if (s === 'bob') hairShape(() => (M(4.6, 9), Q(3.4, 18.6, 6.0, 19.4), Q(9.0, 19.8, 10.6, 18.4), Ln(10.8, 12)), D, 9, 20, false);
    if (s === 'bun') hairShape(() => ell(6.2, 5.0, 2.6, 2.6), H, 2.4, 7.6, false);
    return;
  }
  // nhìn chính diện
  if (s === 'long') hairShape(() => (M(3.6, 10), Q(2.2, 20, 3.4, 27.6), Q(8, 28.6, 12, 27.8), Q(16, 28.6, 20.6, 27.6), Q(21.8, 20, 20.4, 10)), D, 10, 28, false);
  if (s === 'bob') hairShape(() => (M(3.8, 11), Q(3.4, 19.6, 6.0, 19.8), Ln(18.0, 19.8), Q(20.6, 19.6, 20.2, 11)), D, 11, 20, false);
  if (s === 'ponytail') {
    const sw = f === 1 ? 0.5 : f === 2 ? -0.5 : 0;
    hairShape(() => (M(17.4, 6.4), Q(23.8 + sw, 7.4, 22.8 + sw, 15.4), Q(22.4 + sw, 20.0, 19.8 + sw, 22.8), Q(20.8, 17.6, 19.4, 13.4), Q(18.6, 10.6, 16.6, 9.0)), H, 6, 23, false);
  }
  if (s === 'twintails') {
    const sw = f === 1 ? 0.4 : f === 2 ? -0.4 : 0;
    both(() => hairShape(() => (M(5.6, 7.4), Q(0.2 - sw, 9.8, 0.8 - sw, 17.0), Q(1.2 - sw, 22.6, 3.8 - sw, 25.6), Q(3.4, 20.4, 4.8, 16.6), Q(5.8, 13.6, 6.4, 10.2)), H, 7, 26, false));
  }
}

function hairFront(L: AvatarLook, dir: Dir, f: number) {
  const s = L.hair.style;
  const H = hairInk(L.hair.color);
  const side = dir === 'side';
  if (s === 'bald') {
    // chút tóc mai / tóc gáy cho người hói
    if (L.skeleton || L.ears) return;
    if (side) hairShape(() => (M(8.2, 12.0), Q(7.4, 14.6, 9.0, 16.4), Q(10.0, 14.0, 9.4, 12.0)), H, 12, 16.4, false);
    else both(() => hairShape(() => (M(4.6, 10.6), Q(4.2, 13.6, 5.2, 15.2), Q(6.0, 13.0, 5.8, 10.8)), H, 10.6, 15.2, false));
    return;
  }
  if (side) {
    if (s === 'bun') {
      // búi đã vẽ phía sau
    }
    hairShape(() => {
      M(20.0, 12.8);
      if (s === 'spiky') {
        Ln(20.6, 8.0), Ln(22.4, 6.4), Ln(19.8, 5.2), Ln(19.6, 2.2), Ln(16.4, 3.4), Ln(14.8, 0.4), Ln(12.6, 3.0), Ln(9.4, 1.4), Ln(9.2, 4.2), Ln(5.4, 3.8), Ln(6.4, 6.6), Ln(2.8, 7.8), Ln(4.6, 10.6), Ln(3.0, 13.6), Ln(4.8, 16.4);
      } else {
        Q(20.6, s === 'swept' ? 3.4 : 4.4, 12.5, s === 'swept' ? 2.8 : 3.6);
        B(5.6, 3.6, 3.6, 9.6, s === 'bob' ? 4.4 : 4.8, 16.4);
      }
      Q(7.2, 17.6, 9.6, 16.4);
      Q(10.2, 13.8, 11.6, 12.6);
      if (s === 'swept') {
        Q(13.0, 9.6, 15.8, 10.4);
        Q(18.8, 11.2, 20.0, 12.8);
      } else if (s === 'spiky') {
        Ln(13.6, 10.4), Ln(14.4, 12.4), Ln(15.8, 10.2), Ln(17.0, 12.6), Ln(18.2, 10.4), Ln(20.0, 12.8);
      } else {
        Q(13.4, 10.6, 15.0, 11.6);
        Q(16.2, 9.8, 17.4, 11.8);
        Q(18.6, 10.6, 20.0, 12.8);
      }
    }, H, 2.4, 17);
    if (s === 'twintails') bow(7.4, 9.0, 0.9, '#f43f5e');
    if (s === 'bun') line(() => (M(4.4, 3.6), Ln(8.4, 6.4)), '#f59e0b', 0.45);
    return;
  }
  // ---- nhìn chính diện
  if (s === 'bun') {
    hairShape(() => ell(12, 3.4, 2.8, 2.6), H, 0.8, 6, false);
    line(() => (M(13.6, 1.6), Ln(16.2, 0.6)), '#f59e0b', 0.45);
    dot(16.3, 0.6, 0.45, '#f43f5e');
  }
  hairShape(() => {
    if (s === 'spiky') {
      M(3.9, 15);
      for (const [x, y] of [[3.0, 10.2], [1.2, 8.4], [4.2, 7.4], [3.6, 4.0], [7.0, 5.0], [8.0, 1.2], [10.6, 3.6], [12.4, 0.2], [14.2, 3.4], [17.2, 1.4], [17.4, 5.0], [20.8, 4.2], [19.8, 7.4], [22.8, 8.6], [21.0, 10.2], [20.1, 15]]) Ln(x, y);
      for (const [x, y] of [[19.4, 12.2], [17.8, 10.0], [16.6, 13.0], [15.2, 10.0], [13.6, 12.8], [12.2, 10.0], [10.6, 12.9], [9.4, 10.0], [7.6, 12.6], [6.6, 10.2], [5.0, 12.4]]) Ln(x, y);
      return;
    }
    if (s === 'bob') {
      M(3.6, 19.4);
      B(2.6, 9.4, 6.0, 3.4, 12, 3.4);
      B(18.0, 3.4, 21.4, 9.4, 20.4, 19.4);
      Q(19.2, 20.0, 18.2, 19.0);
      Q(18.4, 14, 17.6, 11.0);
      Q(16.4, 11.8, 15.0, 11.4);
      Q(13.6, 11.8, 12.2, 11.4);
      Q(10.8, 11.8, 9.4, 11.4);
      Q(8.0, 11.8, 6.4, 11.0);
      Q(5.6, 14, 5.8, 19.0);
      Q(4.8, 20.0, 3.6, 19.4);
      return;
    }
    if (s === 'long') {
      M(3.4, 23.5);
      B(2.4, 9.4, 6.0, 3.4, 12, 3.4);
      B(18.0, 3.4, 21.6, 9.4, 20.6, 23.5);
      Q(19.6, 24.4 + (f ? 0.3 : 0), 18.6, 23.0);
      Q(18.8, 15, 17.8, 10.8);
    } else {
      const sy = s === 'swept' ? 15 : 15.2;
      const top = s === 'swept' ? 2.8 : 3.6;
      M(3.9, sy);
      B(3.0, 9.4, 6.0, top, 12, top);
      B(18.0, top, 21.0, 9.4, 20.1, sy);
      if (s === 'swept') {
        Q(19.8, 11.6, 18.4, 9.6);
        Q(15.6, 8.8, 13.4, 9.6);
        Q(10.0, 10.8, 8.2, 13.4);
        Q(8.0, 11.2, 7.0, 10.6);
        Q(6.6, 12.6, 5.6, 13.0);
        Q(5.4, 11.4, 5.0, 11.0);
        Q(4.2, 12.8, 3.9, sy);
        return;
      }
      Q(19.6, 12.2, 17.9, 10.4);
    }
    // mái so le
    Q(17.4, 12.4, 15.7, 12.6);
    Q(15.2, 10.5, 13.6, 9.9);
    Q(13.0, 12.1, 11.3, 12.3);
    Q(10.8, 10.3, 9.4, 10.0);
    Q(8.7, 12.1, 7.0, 12.4);
    if (s === 'long') {
      Q(6.5, 11.4, 6.2, 10.8);
      Q(5.2, 15, 5.4, 23.0);
      Q(4.4, 24.4 + (f ? 0.3 : 0), 3.4, 23.5);
    } else {
      Q(6.7, 10.7, 5.9, 10.3);
      Q(4.6, 12.6, 3.9, 15.2);
    }
  }, H, 2.6, s === 'long' ? 24 : 16);
  // vài sợi tóc tạo nếp
  if (s !== 'spiky') {
    line(() => (M(12.6, 4.6), Q(13.4, 7.4, 13.6, 9.6)), H.hd, 0.25);
    line(() => (M(9.6, 5.2), Q(9.2, 7.8, 9.4, 9.8)), H.hd, 0.25);
  }
  if (s === 'twintails') both(() => bow(5.4, 7.6, 0.85, '#f43f5e'));
  if (s === 'ponytail') dot(18.2, 7.2, 0.8, '#e11d48');
}

function hairUp(L: AvatarLook, f: number) {
  const s = L.hair.style;
  if (s === 'bald') return;
  const H = hairInk(L.hair.color);
  if (s === 'long') hairShape(() => (M(3.8, 11), Q(2.6, 21, 3.6, 27.6), Q(12, 29, 20.4, 27.6), Q(21.4, 21, 20.2, 11)), H, 11, 28, false);
  if (s === 'bob') hairShape(() => (M(4.0, 11), Q(3.6, 19.8, 6.4, 19.9), Ln(17.6, 19.9), Q(20.4, 19.8, 20.0, 11)), H, 11, 20, false);
  if (s === 'twintails') {
    const sw = f === 1 ? 0.4 : f === 2 ? -0.4 : 0;
    both(() => hairShape(() => (M(5.6, 7.4), Q(0.2 - sw, 9.8, 0.8 - sw, 17.0), Q(1.2 - sw, 22.6, 3.8 - sw, 25.6), Q(3.4, 20.4, 4.8, 16.6), Q(5.8, 13.6, 6.4, 10.2)), H, 7, 26, false));
  }
  hairShape(() => {
    if (s === 'spiky') {
      M(4.4, 16.4);
      for (const [x, y] of [[3.0, 10.2], [1.2, 8.4], [4.2, 7.4], [3.6, 4.0], [7.0, 5.0], [8.0, 1.2], [10.6, 3.6], [12.4, 0.2], [14.2, 3.4], [17.2, 1.4], [17.4, 5.0], [20.8, 4.2], [19.8, 7.4], [22.8, 8.6], [21.0, 10.2], [19.6, 16.4]]) Ln(x, y);
      Q(12, 19.6, 4.4, 16.4);
      return;
    }
    M(4.2, 13);
    B(4.2, 6.4, 7.6, 3.5, 12, 3.5);
    B(16.4, 3.5, 19.8, 6.4, 19.8, 13);
    Q(19.6, 17.8, 16.6, 19.0);
    Q(12, 20.2, 7.4, 19.0);
    Q(4.4, 17.8, 4.2, 13);
  }, H, 3, 19.6);
  // xoáy tóc
  line(() => (M(12.6, 7.4), Q(11.0, 7.0, 11.4, 8.6), Q(12.4, 9.6, 13.2, 8.4)), H.hd, 0.3);
  line(() => (M(8.6, 12.4), Q(9.4, 15.6, 8.8, 18.4)), H.hd, 0.25);
  line(() => (M(15.4, 12.4), Q(14.6, 15.6, 15.2, 18.4)), H.hd, 0.25);
  if (s === 'ponytail') {
    const sw = f === 1 ? 0.5 : f === 2 ? -0.5 : 0;
    hairShape(() => (M(10.6, 9.6), Q(9.6, 16, 11.2 + sw, 23.0), Q(12.4 + sw, 23.8, 13.4 + sw, 22.4), Q(14.4, 16, 13.4, 9.6)), H, 9, 24, false);
    oval(12, 9.6, 1.6, 0.8, '#e11d48');
  }
  if (s === 'bun') {
    hairShape(() => ell(12, 6.0, 2.8, 2.6), H, 3.4, 8.6, false);
    line(() => (M(9.0, 5.2), Ln(15.0, 6.6)), '#f59e0b', 0.45);
  }
  if (s === 'twintails') both(() => bow(5.4, 7.6, 0.85, '#f43f5e'));
}

// ---------------------------------------------------------------- mũ & mũ giáp

function drawHeadwear(L: AvatarLook, dir: Dir) {
  const id = L.hat ?? L.helm;
  if (!id) return;
  if (L.female && TIARA[id]) tiara(TIARA[id], dir);
  else drawHat(id, dir);
}

type TiaraSpec = [metal: string, gem: string, extra: 'none' | 'feather' | 'horns' | 'flower'];
/** mũ giáp / vương miện khi đội trên nhân vật nữ → vương miện nhỏ (tiara) */
const TIARA: Record<string, TiaraSpec> = {
  helm_band: ['#f59e0b', '#38bdf8', 'flower'],
  helm_knight: ['#cbd5e1', '#38bdf8', 'feather'],
  helm_shadow: ['#7c3aed', '#e879f9', 'horns'],
  helm_royal: ['#f2c230', '#ef4444', 'feather'],
  helm_dragon: ['#f2c230', '#dc2626', 'horns'],
  hat_crown: ['#f2c230', '#e8302a', 'none'],
};

function tiara([metal, gemCol, extra]: TiaraSpec, dir: Dir) {
  const side = dir === 'side';
  const front = dir !== 'up';
  const g = vg(3.6, 9.6, [[0, shade(metal, 80)], [0.5, metal], [1, shade(metal, -50)]]);
  if (extra === 'horns') both(() => shape(() => (M(7.4, 7.6), Q(5.0, 6.4, 5.0, 3.4), Q(6.6, 5.2, 8.8, 6.6)), shade(metal, 30), vg(3.4, 7.6, [[0, '#fde68a'], [1, metal]]), 0.25));
  if (extra === 'feather') {
    shape(() => (M(17.2, 7.8), Q(20.6, 5.6, 20.8, 2.4), Q(18.6, 3.6, 16.6, 7.0)), '#f8fafc', vg(2.4, 7.8, [[0, '#ffffff'], [1, '#cbd5e1']]), 0.25);
    line(() => (M(17.0, 7.4), Q(19.2, 5.4, 20.4, 2.8)), '#94a3b8', 0.2);
  }
  // vòng cài trên tóc
  line(() => (M(5.0, 9.6), Q(12, 6.2, 19.0, 9.6)), shade(metal, -40), 1.0);
  line(() => (M(5.0, 9.6), Q(12, 6.2, 19.0, 9.6)), metal, 0.6);
  if (!front) return;
  const cx = side ? 15.6 : 12;
  // đỉnh vương miện 3 nhọn + đá quý
  shape(() => (M(cx - 3.0, 8.0), Ln(cx - 2.4, 5.6), Ln(cx - 1.2, 6.8), Ln(cx, 3.8), Ln(cx + 1.2, 6.8), Ln(cx + 2.4, 5.6), Ln(cx + 3.0, 8.0), Q(cx, 7.0, cx - 3.0, 8.0)), metal, g, 0.25);
  for (const x of [cx - 2.4, cx, cx + 2.4]) dot(x, x === cx ? 3.8 : 5.6, 0.4, '#fff7d0');
  c.beginPath();
  M(cx, 5.6), Ln(cx + 0.7, 6.5), Ln(cx, 7.4), Ln(cx - 0.7, 6.5), c.closePath();
  fill(vg(5.6, 7.4, [[0, shade(gemCol, 80)], [1, shade(gemCol, -40)]]));
  dot(cx - 0.2, 6.2, 0.15, '#ffffff');
  if (extra === 'flower') {
    for (const x of side ? [11.4] : [7.4, 16.6]) {
      for (let k = 0; k < 5; k++) dot(x + Math.cos((k * Math.PI * 2) / 5) * 0.55, 8.4 + Math.sin((k * Math.PI * 2) / 5) * 0.55, 0.42, '#fbcfe8');
      dot(x, 8.4, 0.3, '#fde047');
    }
  }
}

function drawHat(id: string, dir: Dir) {
  const side = dir === 'side';
  const up = dir === 'up';
  const front = !up;
  const gem = (x: number, y: number, col: string, r = 0.75) => {
    if (!front) return;
    c.beginPath();
    M(x, y - r), Ln(x + r * 0.85, y), Ln(x, y + r), Ln(x - r * 0.85, y), c.closePath();
    fill(vg(y - r, y + r, [[0, shade(col, 80)], [1, shade(col, -40)]]));
    ink(inkOf(col), 0.2);
    dot(x - r * 0.25, y - r * 0.3, r * 0.22, '#ffffff');
  };
  const gx = side ? 16.4 : 12;
  const metalCap = (col: string, rimCol: string, rimY = 10.2) => {
    shape(() => (M(4.0, rimY), B(4.0, 2.0, 20.0, 2.0, 20.0, rimY), Q(12, rimY - 1.2, 4.0, rimY)), col, vg(3, rimY, [[0, shade(col, 60)], [0.6, col], [1, shade(col, -35)]]));
    line(() => (M(4.2, rimY - 0.2), Q(12, rimY - 1.4, 19.8, rimY - 0.2)), rimCol, 0.9);
    line(() => (M(7.2, 5.6), Q(9.0, 4.2, 11.0, 4.0)), rgba('#ffffff', 0.7), 0.45);
  };
  const plume = (col: string, h = 4) => {
    const g = vg(4 - h, 4, [[0, shade(col, 40)], [1, shade(col, -30)]]);
    shape(() => (M(11.2, 4.4), Q(10.4, 4 - h * 0.6, 12.4, 4 - h), Q(15.6, 3.4 - h * 0.4, 14.2, 2.0), Q(13.6, 3.6, 12.8, 4.4)), col, g);
  };
  const wing = (x: number, y: number, col: string, tip: string) => {
    const one = () =>
      shape(() => (M(x, y), Q(x - 3.0, y - 1.0, x - 3.6, y - 4.6), Q(x - 2.4, y - 3.6, x - 1.6, y - 3.8), Q(x - 1.6, y - 2.6, x - 0.6, y - 2.6), Q(x - 0.8, y - 1.4, x + 0.6, y - 1.0)), col, vg(y - 4.6, y, [[0, tip], [1, col]]));
    both(one);
  };
  const horn = (col: string, tip: string, big = false) => {
    const k = big ? 1.25 : 1;
    both(() => shape(() => (M(6.6, 6.6), Q(3.4, 5.4, 3.0, 2.0 - k), Q(5.0, 3.6 - k * 0.4, 8.6, 5.2)), col, vg(0, 6.6, [[0, tip], [1, col]])));
  };
  switch (id) {
    case 'hat_straw':
      oval(12, 8.2, 11, 2.4, '#e8c870', vg(5.8, 10.6, [[0, '#f6e098'], [1, '#c8a050']]));
      shape(() => (M(6.6, 8.2), B(6.6, 2.0, 17.4, 2.0, 17.4, 8.2), Q(12, 9.0, 6.6, 8.2)), '#e8c870', vg(3, 8.2, [[0, '#f6e098'], [1, '#d8b060']]));
      line(() => (M(6.7, 7.2), Q(12, 8.0, 17.3, 7.2)), '#c8402f', 1.0);
      for (const x of [8.6, 11.0, 13.4, 15.6]) line(() => (M(x, 3.8), Ln(x - 0.2, 6.6)), '#c8a050', 0.18);
      break;
    case 'hat_nonla':
      shape(() => (M(12, 0.4), Ln(23.2, 8.8), Q(12, 11.0, 0.8, 8.8)), '#f0e0b0', vg(0.4, 10, [[0, '#fbf1cf'], [1, '#d8c890']]));
      for (const t of [0.35, 0.62, 0.85]) line(() => (M(12 - 11.2 * t, 0.4 + 8.4 * t), Q(12, 0.4 + 10.6 * t, 12 + 11.2 * t, 0.4 + 8.4 * t)), '#c8b070', 0.22);
      if (front) line(() => (M(4.6, 9.6), Q(12, 22, 19.4, 9.6)), '#c8402f', 0.25);
      break;
    case 'hat_wizard':
      oval(12, 7.8, 9.8, 2.0, '#6a3aa0', vg(5.8, 9.8, [[0, '#8a5ac0'], [1, '#4a2478']]));
      shape(() => (M(6.8, 7.6), Q(8.6, 3.4, 11.4, 1.4), Q(14.6, -0.6, 18.4, 1.0), Q(14.8, 1.6, 15.0, 3.6), Q(16.2, 5.6, 17.2, 7.6), Q(12, 8.6, 6.8, 7.6)), '#6a3aa0', vg(0, 8, [[0, '#9a6ad0'], [1, '#5a2e8a']]));
      line(() => (M(7.0, 6.6), Q(12, 7.8, 17.0, 6.6)), '#f2c230', 0.9);
      if (front) sparkle(gx - 0.4, 4.2, 1.2, '#fde047');
      dot(18.4, 1.0, 0.55, '#fde047');
      break;
    case 'hat_knight':
    case 'helm_dark': {
      const m = id === 'hat_knight' ? '#a9b0ba' : '#2a2a38';
      const g = c.createRadialGradient(9.6, 7.6, 0.5, 12, 11.8, 9.4);
      g.addColorStop(0, shade(m, 80));
      g.addColorStop(0.5, m);
      g.addColorStop(1, shade(m, -45));
      oval(12, 11.8, 8.6, 8.4, m, g);
      if (front) {
        c.beginPath();
        if (side) rr(13.4, 12.6, 7.4, 2.4, 0.8);
        else rr(4.6, 12.6, 14.8, 2.4, 0.8);
        fill('#14141c');
        if (id === 'helm_dark') for (const x of side ? [17.2] : [9.0, 15.0]) dot(x, 13.8, 0.55, '#c060ff');
        line(() => (side ? (M(17.6, 15.4), Ln(17.6, 19.0)) : (M(12, 15.4), Ln(12, 19.6))), shade(m, -40), 0.4);
      }
      line(() => (M(6.6, 7.2), Q(8.4, 5.0, 11.0, 4.4)), rgba('#ffffff', 0.6), 0.5);
      plume(id === 'hat_knight' ? '#c8402f' : '#8a3ad8', 4.4);
      break;
    }
    case 'hat_beanie':
      shape(() => (M(3.9, 10.2), B(3.9, 2.0, 20.1, 2.0, 20.1, 10.2), Q(12, 9.4, 3.9, 10.2)), '#c8302a', vg(3, 10, [[0, '#e8504a'], [1, '#a8201a']]));
      shape(() => (M(3.8, 8.6), Q(12, 7.4, 20.2, 8.6), Ln(20.2, 10.8), Q(12, 9.8, 3.8, 10.8)), '#8a1a1a', null);
      for (let x = 5.4; x < 19.5; x += 1.4) line(() => (M(x, 8.4 - (x < 12 ? (x - 4) * 0.08 : (20 - x) * 0.08)), Ln(x, 10.2)), '#6a1010', 0.2);
      oval(12, 2.6, 2.0, 1.9, '#f4f4f0', vg(0.8, 4.4, [[0, '#ffffff'], [1, '#d8d8d0']]));
      break;
    case 'hat_cap':
      if (up) shape(() => rr(9.6, 9.0, 4.8, 1.2, 0.5), '#2a4a9a', null);
      shape(() => (M(4.3, 9.6), B(4.3, 2.6, 19.7, 2.6, 19.7, 9.6), Q(12, 8.8, 4.3, 9.6)), '#3d6fd1', vg(3, 9.6, [[0, '#5d8ff1'], [1, '#2d5fb1']]));
      if (side) shape(() => (M(17.0, 8.8), Q(22.8, 8.4, 23.2, 10.2), Q(20.0, 10.8, 17.0, 10.0)), '#2a4a9a', null);
      else if (front) oval(12, 9.7, 7.6, 1.5, '#2a4a9a', null);
      if (front) {
        c.beginPath();
        if (side) rr(14.4, 5.2, 2.4, 2.4, 0.6);
        else rr(10.6, 5.0, 2.8, 2.6, 0.6);
        fill('#f4f4f0');
        dot(side ? 15.6 : 12, side ? 6.4 : 6.3, 0.6, '#c8302a');
      }
      dot(12, 3.3, 0.5, '#2a4a9a');
      break;
    case 'hat_bow': {
      const bx = side ? 13.6 : 16.4;
      shape(() => (M(bx, 4.8), Q(bx - 3.0, 1.4, bx - 3.4, 4.6), Q(bx - 3.0, 7.6, bx, 4.8)), '#f080b0', vg(1.6, 7.6, [[0, '#ffb0d4'], [1, '#d8609a']]));
      shape(() => (M(bx, 4.8), Q(bx + 3.0, 1.4, bx + 3.4, 4.6), Q(bx + 3.0, 7.6, bx, 4.8)), '#f080b0', vg(1.6, 7.6, [[0, '#ffb0d4'], [1, '#d8609a']]));
      oval(bx, 4.8, 1.0, 1.1, '#c8407a');
      dot(bx - 2.0, 3.6, 0.4, '#ffd0e4');
      break;
    }
    case 'hat_tophat':
      oval(12, 6.8, 8.2, 1.7, '#22222a', vg(5, 8.6, [[0, '#3a3a48'], [1, '#14141a']]));
      shape(() => rr(7.4, -0.6, 9.2, 7.4, 0.8), '#22222a', vg(0, 7, [[0, '#3a3a48'], [0.5, '#22222a'], [1, '#1a1a20']]));
      c.beginPath(), rr(7.4, 4.4, 9.2, 1.5, 0.2), fill('#c8302a');
      oval(12, -0.5, 4.6, 0.9, '#2e2e3a');
      line(() => (M(8.4, 0.6), Ln(8.4, 4.0)), rgba('#ffffff', 0.35), 0.5);
      if (front) sparkle(side ? 15.6 : 14.6, 5.1, 0.9, '#fde047');
      break;
    case 'hat_crown': {
      const g = vg(1, 8, [[0, '#fff2a0'], [0.5, '#f2c230'], [1, '#b8860b']]);
      shape(() => (M(6.2, 8.0), Ln(5.6, 2.8), Ln(8.6, 5.2), Ln(12, 1.0), Ln(15.4, 5.2), Ln(18.4, 2.8), Ln(17.8, 8.0), Q(12, 9.0, 6.2, 8.0)), '#f2c230', g);
      for (const [x, y] of [[5.6, 2.6], [12, 0.8], [18.4, 2.6]]) dot(x, y, 0.6, '#fff2a0');
      line(() => (M(6.3, 7.0), Q(12, 7.9, 17.7, 7.0)), '#b8860b', 0.35);
      gem(gx, 5.8, '#e8302a', 0.95);
      if (!side) gem(8.6, 6.6, '#3d6fd1', 0.6), gem(15.4, 6.6, '#3d6fd1', 0.6);
      break;
    }
    // ---- mũ chiến giáp / vương miện hộ trán (vẫn lộ mắt & tóc)
    case 'helm_band':
      line(() => (M(4.4, 10.4), Q(12, 7.6, 19.6, 10.4)), '#f59e0b', 1.0);
      gem(gx, 8.6, '#38bdf8', 0.95);
      break;
    case 'helm_wolf':
      both(() => {
        shape(() => (M(5.4, 7.4), Ln(5.0, 1.8), Ln(9.4, 4.6)), '#92400e', vg(1.8, 7.4, [[0, '#b45a1e'], [1, '#78350f']]));
        shape(() => (M(6.0, 6.2), Ln(5.8, 3.4), Ln(8.0, 4.8)), '#f0a0a0', null, 0.15);
      });
      line(() => (M(4.4, 10.4), Q(12, 7.6, 19.6, 10.4)), '#78350f', 1.2);
      gem(gx, 8.6, '#fbbf24', 0.9);
      break;
    case 'helm_knight':
      metalCap('#94a3b8', '#cbd5e1');
      if (front && !side) shape(() => rr(11.4, 9.0, 1.2, 4.0, 0.4), '#94a3b8', null, 0.25);
      plume('#3b82f6', 4.2);
      gem(gx, 7.4, '#38bdf8', 0.7);
      break;
    case 'helm_shadow':
      horn('#a855f7', '#e879f9');
      metalCap('#1e1b4b', '#a855f7');
      gem(gx, 7.4, '#e879f9', 0.85);
      break;
    case 'helm_royal':
      metalCap('#cbd5e1', '#fbbf24');
      plume('#dc2626', 5.2);
      gem(gx, 7.4, '#ef4444', 0.85);
      break;
    case 'helm_mithril':
      wing(5.0, 9.0, '#e0f2fe', '#ffffff');
      line(() => (M(4.4, 10.4), Q(12, 7.6, 19.6, 10.4)), '#38bdf8', 1.1);
      gem(gx, 8.4, '#67e8f9', 1.0);
      break;
    case 'helm_valkyrie':
      wing(5.2, 9.2, '#f8fafc', '#fef08a');
      line(() => (M(4.4, 10.4), Q(12, 7.6, 19.6, 10.4)), '#fbbf24', 1.1);
      gem(gx, 8.4, '#38bdf8', 1.0);
      break;
    case 'helm_dragon':
      horn('#f59e0b', '#fef08a', true);
      metalCap('#991b1b', '#fbbf24');
      gem(gx, 7.4, '#fde047', 0.9);
      break;
    case 'helm_celestial':
      c.save();
      c.shadowColor = '#fde047';
      c.shadowBlur = 1.2;
      c.beginPath();
      c.ellipse(12, 1.8, 4.6, 1.1, 0, 0, Math.PI * 2);
      ink('#fde047', 0.7);
      c.restore();
      wing(5.0, 9.0, '#e0f2fe', '#ffffff');
      line(() => (M(4.4, 10.4), Q(12, 7.6, 19.6, 10.4)), '#fde047', 1.1);
      gem(gx, 8.4, '#67e8f9', 1.0);
      break;
  }
}

// ---------------------------------------------------------------- viền & sprite sheet

/** độ dày viền ngoài (px) theo độ phân giải */
export const outlineT = (res: number) => Math.max(1, Math.round(res * 0.42));

/**
 * Viền đậm quanh hình (dilate mặt nạ alpha rồi lót màu viền phía sau) — giữ mép mềm của nét vector.
 * t: độ dày viền tính bằng pixel canvas.
 */
export function outlineFrame(cx: Ctx, x0: number, y0: number, w: number, h: number, t = 1, col = OUT) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  w = Math.round(w);
  h = Math.round(h);
  if (w <= 0 || h <= 0) return;
  const img = cx.getImageData(x0, y0, w, h);
  const d = img.data;
  const n = w * h;
  const m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
  const o = new Uint8Array(n);
  const r2 = (t + 0.35) * (t + 0.35);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!m[i]) continue;
      // chỉ điểm biên mới cần loang viền
      if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && m[i - 1] && m[i + 1] && m[i - w] && m[i + w]) continue;
      for (let dy = -t; dy <= t; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -t; dx <= t; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w || dx * dx + dy * dy > r2) continue;
          o[yy * w + xx] = 1;
        }
      }
    }
  const [rr0, gg0, bb0] = rgb(col);
  for (let i = 0; i < n; i++) {
    if (!o[i]) continue;
    const k = i * 4;
    const a = d[k + 3] / 255;
    if (a >= 1) continue;
    d[k] = Math.round(d[k] * a + rr0 * (1 - a));
    d[k + 1] = Math.round(d[k + 1] * a + gg0 * (1 - a));
    d[k + 2] = Math.round(d[k + 2] * a + bb0 * (1 - a));
    d[k + 3] = 255;
  }
  cx.putImageData(img, x0, y0);
}

export const AVATAR_DIRS: Dir[] = ['down', 'up', 'side'];

/** Vẽ cả sprite sheet 9 khung (down/up/side × 3) ở độ phân giải res */
export function drawAvatarSheet(cx: Ctx, look: AvatarLook, res = AVATAR_RES) {
  const fw = FRAME_W * res;
  const fh = FRAME_H * res;
  cx.clearRect(0, 0, fw * 9, fh);
  AVATAR_DIRS.forEach((d, di) => {
    for (let f = 0; f < 3; f++) {
      const ox = (di * 3 + f) * fw;
      drawAvatar(cx, ox, 0, look, d, f, res);
      outlineFrame(cx, ox, 0, fw, fh, outlineT(res));
    }
  });
}

/** toạ độ các khung trên sprite sheet (pixel texture, đã nhân res) */
export const avatarFrames = (res = AVATAR_RES) =>
  AVATAR_DIRS.flatMap((d, di) => [0, 1, 2].map((f) => ({ name: `${d}_${f}`, x: (di * 3 + f) * FRAME_W * res, y: 0, w: FRAME_W * res, h: FRAME_H * res })));
