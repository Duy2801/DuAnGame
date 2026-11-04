import { create } from 'zustand';
import { FISH_BY_ID } from '../game/config/life';
import { ITEMS } from '../game/config/farm';
import { KITE_BY_ID, RARITY_COLOR, ROD_BY_ID, type RodRarity } from '../game/config/shops';
import { addToHotbar, applyHeld } from '../game/logic/hotbar';
import type { DurationRoll } from '../game/logic/shop';
import { useGame } from '../store';
import { ONLINE } from './config';
import { db, useOnline } from './online';

// Hồ Câu Cá · Thả diều · Rương đồ 30 ô — bản online, server quyết định mọi kết quả.
// Hợp đồng: docs/fishing-api.md. File này chỉ gọi RPC + đồng bộ kết quả về state trên máy
// (g.gold/g.gems, g.fishingGear, g.kites, g.itemExpiry) để Hotbar / WorldScene chạy như cũ.

// ---------------------------------------------------------------- kiểu dữ liệu (theo hợp đồng)

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type SlotKind = 'stack' | 'rod' | 'kite';

export interface FishSpecies {
  id: string;
  name: string;
  emoji: string;
  rarity: FishRarity;
  price: number;
  cm_min: number;
  cm_max: number;
  difficulty: number;
  night: boolean;
  rain: boolean;
  sort: number;
}

export interface RodDefRow {
  id: string;
  name: string;
  emoji: string;
  rarity: RodRarity;
  zone: number;
  size: number;
  slow: number;
  bite: number;
  miss: number;
  descr: string;
  sort: number;
}

export interface RodFishRate {
  rod_id: string;
  fish_id: string;
  weight: number;
}

export interface KiteDefRow {
  id: string;
  name: string;
  emoji: string;
  rarity: RodRarity;
  mult: number;
  minutes: number;
  descr: string;
  sort: number;
}

export interface BoxDefRow {
  id: string;
  kind: 'rod' | 'kite';
  name: string;
  emoji: string;
  price_gold: number | null;
  price_gems: number | null;
  odds: Partial<Record<RodRarity, number>>;
}

export interface ShopItemRow {
  id: string;
  name: string;
  emoji: string;
  price_gold: number;
  qty: number;
}

export interface InventorySlot {
  id: string;
  user_id?: string;
  slot: number;
  item_id: string;
  kind: SlotKind;
  qty: number;
  /** ISO; null = vĩnh viễn */
  expires_at: string | null;
  equipped: boolean;
  acquired_at?: string;
}

export interface Wallet {
  gold: number;
  gems: number;
}

export interface BoxResultRow {
  item_id: string;
  kind: 'rod' | 'kite';
  rarity: RodRarity;
  duration: DurationRoll;
  expires_at: string | null;
  slot: number;
}

export interface FishStartResult {
  cast_id: string;
  wait_ms: number;
  difficulty: number;
  zone: number;
  slow: number;
}

export type FishFinishResult =
  | {
      caught: true;
      fish_id: string;
      name: string;
      emoji: string;
      rarity: FishRarity;
      cm: number;
      kg: number;
      points: number;
      record: boolean;
      slot: number;
    }
  | { caught: false; reason: string };

export interface FishTopRow {
  user_id: string;
  name: string;
  points: number;
  biggest_cm: number;
  biggest_fish: string | null;
}

export interface Catalog {
  fish: FishSpecies[];
  rods: RodDefRow[];
  rates: RodFishRate[];
  kites: KiteDefRow[];
  boxes: BoxDefRow[];
  shop: ShopItemRow[];
  fishById: Record<string, FishSpecies>;
  rodById: Record<string, RodDefRow>;
  kiteById: Record<string, KiteDefRow>;
}

export const CHEST_SIZE = 30;

// ---------------------------------------------------------------- store rương

interface ChestState {
  slots: InventorySlot[];
  wallet: Wallet | null;
  loading: boolean;
  error: string;
  /** đã tải rương ít nhất 1 lần trong phiên này */
  loaded: boolean;
  catalog: Catalog | null;
  /** cửa sổ Rương đồ đang mở (PanelHost hiển thị) */
  open: boolean;
  refresh: () => Promise<void>;
}

export const useChest = create<ChestState>()(() => ({
  slots: [],
  wallet: null,
  loading: false,
  error: '',
  loaded: false,
  catalog: null,
  open: false,
  refresh: () => refreshChest(),
}));

export const openChest = () => useChest.setState({ open: true });
export const closeChest = () => useChest.setState({ open: false });

export function resetChest() {
  useChest.setState({ slots: [], wallet: null, loading: false, error: '', loaded: false, open: false });
}

/** bản online + đã đăng nhập → câu cá / hộp cần / diều / rương chạy trên server */
export const serverFishing = () => ONLINE && !!db && useOnline.getState().status === 'in';
export const useServerFishing = () => useOnline((s) => ONLINE && s.status === 'in');

// ---------------------------------------------------------------- lỗi → toast tiếng Việt

const FISH_ERRORS: [RegExp, string][] = [
  [/not authenticated|jwt|permission denied|auth\.uid|chưa đăng nhập/i, 'Cần đăng nhập để dùng Hồ Câu Cá online'],
  [/could not find the function|PGRST202|schema cache|does not exist/i, 'Máy chủ chưa bật tính năng câu cá — thử lại sau ít phút'],
  [/failed to fetch|networkerror|network request|load failed/i, 'Không kết nối được máy chủ — kiểm tra mạng'],
  [/rate limit|too many/i, 'Thao tác quá nhanh, đợi một lát nhé'],
  [/chest.*full|inventory.*full/i, 'Rương đầy (30/30 ô) — vứt bớt đồ rồi thử lại'],
  [/insufficient.*gold|not enough gold/i, 'Không đủ vàng'],
  [/insufficient.*gem|not enough gem/i, 'Không đủ kim cương'],
  [/too early|quá sớm/i, 'Giật cần sớm quá!'],
];

export function viFishError(msg: string): string {
  const clean = msg.replace(/^(P0001|ERROR):\s*/i, '').trim();
  return FISH_ERRORS.find(([re]) => re.test(clean))?.[1] ?? (clean || 'Máy chủ báo lỗi');
}

interface RpcOpts {
  /** không hiện toast (chạy nền) */
  quiet?: boolean;
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}, opts: RpcOpts = {}): Promise<T | null> {
  if (!db) return null;
  try {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error(error.message || error.code || 'error');
    return data as T;
  } catch (e) {
    const msg = viFishError(e instanceof Error ? e.message : String(e));
    useChest.setState({ error: msg });
    if (opts.quiet) console.warn(`[fishing] ${name}:`, msg);
    else useGame.getState().toast(msg, 'err');
    return null;
  }
}

/** chạy lần lượt các thao tác đụng tới ví để không giẫm lên nhau */
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------- ví

const snapshot = (): Wallet => {
  const g = useGame.getState().game;
  return { gold: g.gold, gems: g.gems };
};

/**
 * Gán số dư server về g.gold/g.gems. `sent` = số dư trên máy lúc gửi yêu cầu: phần chênh lệch phát sinh
 * trong lúc chờ (vàng kiếm được từ nông trại…) được cộng giữ lại, lần sync sau sẽ đẩy lên.
 */
function applyWallet(w: Wallet | null | undefined, sent?: Wallet) {
  if (!w || w.gold === undefined || w.gems === undefined) return;
  const gold = Number(w.gold);
  const gems = Number(w.gems);
  if (!Number.isFinite(gold) || !Number.isFinite(gems)) return;
  useGame.getState().apply((g) => {
    const dGold = sent ? g.gold - sent.gold : 0;
    const dGems = sent ? g.gems - sent.gems : 0;
    g.gold = Math.max(0, gold + dGold);
    g.gems = Math.max(0, gems + dGems);
  });
  useChest.setState({ wallet: { gold, gems } });
}

async function syncWalletRaw(opts: RpcOpts): Promise<Wallet | null> {
  const sent = snapshot();
  const w = await rpc<Wallet>('sync_wallet', { p_gold: Math.floor(sent.gold), p_gems: Math.floor(sent.gems) }, opts);
  if (w) applyWallet(w, sent);
  return w;
}

/** đẩy số dư trên máy lên server, nhận lại số dư được chấp nhận (tăng bị chặn trần theo thời gian) */
export function syncWallet(opts: RpcOpts = {}): Promise<Wallet | null> {
  if (!db) return Promise.resolve(null);
  return serial(() => syncWalletRaw(opts));
}

// ---------------------------------------------------------------- catalog (tải 1 lần, cache)

let catalogP: Promise<Catalog | null> | null = null;
/** box_defs / shop_items có thể có cột sort (ngoài hợp đồng) */
const sortOf = (row: object) => Number((row as { sort?: number }).sort ?? 0);

async function fetchCatalog(): Promise<Catalog | null> {
  if (!db) return null;
  const [fish, rods, rates, kites, boxes, shop] = await Promise.all([
    db.from('fish_species').select('*').order('sort'),
    db.from('rod_defs').select('*').order('sort'),
    db.from('rod_fish_rates').select('rod_id,fish_id,weight').limit(5000),
    db.from('kite_defs').select('*').order('sort'),
    db.from('box_defs').select('*'),
    db.from('shop_items').select('*'),
  ]);
  const err = fish.error ?? rods.error ?? rates.error ?? kites.error ?? boxes.error ?? shop.error;
  if (err) throw new Error(err.message);
  const num = (v: unknown) => Number(v ?? 0);
  const cat: Catalog = {
    fish: (fish.data as FishSpecies[]).map((f) => ({ ...f, price: num(f.price), cm_min: num(f.cm_min), cm_max: num(f.cm_max), difficulty: num(f.difficulty) })),
    rods: (rods.data as RodDefRow[]).map((r) => ({ ...r, zone: num(r.zone), size: num(r.size), slow: num(r.slow), bite: num(r.bite), miss: num(r.miss) })),
    rates: (rates.data as RodFishRate[]).map((r) => ({ ...r, weight: num(r.weight) })),
    kites: (kites.data as KiteDefRow[]).map((k) => ({ ...k, mult: num(k.mult), minutes: num(k.minutes) })),
    boxes: (boxes.data as BoxDefRow[])
      .map((b) => ({ ...b, price_gold: b.price_gold === null ? null : num(b.price_gold), price_gems: b.price_gems === null ? null : num(b.price_gems), odds: b.odds ?? {} }))
      .sort((a, b) => sortOf(a) - sortOf(b) || (a.price_gems ?? 0) - (b.price_gems ?? 0) || (a.price_gold ?? 0) - (b.price_gold ?? 0)),
    shop: (shop.data as ShopItemRow[]).map((s) => ({ ...s, price_gold: num(s.price_gold), qty: num(s.qty) })).sort((a, b) => sortOf(a) - sortOf(b) || a.price_gold - b.price_gold),
    fishById: {},
    rodById: {},
    kiteById: {},
  };
  cat.fishById = Object.fromEntries(cat.fish.map((f) => [f.id, f]));
  cat.rodById = Object.fromEntries(cat.rods.map((r) => [r.id, r]));
  cat.kiteById = Object.fromEntries(cat.kites.map((k) => [k.id, k]));
  return cat;
}

/** tải bảng catalog (cá, cần, tỉ lệ cá theo cần, diều, hộp, mồi) một lần rồi giữ trong bộ nhớ */
export function loadCatalog(): Promise<Catalog | null> {
  if (!catalogP) {
    catalogP = fetchCatalog()
      .then((c) => {
        useChest.setState({ catalog: c });
        return c;
      })
      .catch((e) => {
        catalogP = null;
        console.warn('[fishing] catalog', e);
        useChest.setState({ error: viFishError(e instanceof Error ? e.message : String(e)) });
        return null;
      });
  }
  return catalogP;
}

// ---------------------------------------------------------------- rương

interface ChestPayload {
  slots: InventorySlot[];
  wallet: Wallet;
}

const isLive = (s: InventorySlot, now = Date.now()) => !s.expires_at || Date.parse(s.expires_at) > now;

async function getChestRaw(opts: RpcOpts): Promise<InventorySlot[] | null> {
  const sent = snapshot();
  const data = await rpc<ChestPayload>('get_chest', {}, opts);
  if (!data) return null;
  const slots = (data.slots ?? []).map((s) => ({ ...s, qty: Number(s.qty), slot: Number(s.slot) })).sort((a, b) => a.slot - b.slot);
  useChest.setState({ slots, loaded: true, error: '' });
  mirrorChest(slots);
  applyWallet(data.wallet, sent);
  return slots;
}

/** đọc rương (server tự purge đồ hết hạn). Mặc định sync ví trước để không ghi đè vàng chưa đẩy lên. */
export function refreshChest(opts: RpcOpts & { skipSync?: boolean } = {}): Promise<void> {
  if (!db) return Promise.resolve();
  useChest.setState({ loading: true });
  void loadCatalog();
  return serial(async () => {
    try {
      if (!opts.skipSync) await syncWalletRaw({ quiet: true });
      await getChestRaw(opts);
    } finally {
      useChest.setState({ loading: false });
    }
  });
}

/**
 * Chép rương server sang state trên máy: cần câu / diều sở hữu (chưa hết hạn), món đang trang bị,
 * hạn sử dụng (g.itemExpiry). Cần tre luôn có.
 */
function mirrorChest(slots: InventorySlot[]) {
  const now = Date.now();
  const live = slots.filter((s) => isLive(s, now));
  const rodSlots = live.filter((s) => s.kind === 'rod');
  const kiteSlots = live.filter((s) => s.kind === 'kite');
  const rods = [...new Set(['rod_bamboo', ...rodSlots.map((s) => s.item_id)])];
  const kites = [...new Set(kiteSlots.map((s) => s.item_id))];
  const eqRod = rodSlots.find((s) => s.equipped)?.item_id;
  const eqKite = kiteSlots.find((s) => s.equipped)?.item_id;
  const cat = useChest.getState().catalog;
  const gearIds = new Set([...Object.keys(ROD_BY_ID), ...Object.keys(KITE_BY_ID), ...(cat?.rods.map((r) => r.id) ?? []), ...(cat?.kites.map((k) => k.id) ?? [])]);

  useGame.getState().apply((g) => {
    g.fishingGear.rods = rods;
    g.fishingGear.rod = eqRod ?? (rods.includes(g.fishingGear.rod) ? g.fishingGear.rod : 'rod_bamboo');
    g.kites.owned = kites;
    g.kites.equipped = eqKite ?? (g.kites.equipped && kites.includes(g.kites.equipped) ? g.kites.equipped : kites[0] ?? null);

    // hạn sử dụng: món có nhiều ô thì lấy hạn xa nhất, có 1 ô vĩnh viễn thì coi như vĩnh viễn
    const exp: Record<string, number> = { ...(g.itemExpiry ?? {}) };
    for (const id of Object.keys(exp)) if (gearIds.has(id)) delete exp[id];
    const perm = new Set<string>();
    for (const s of [...rodSlots, ...kiteSlots]) {
      if (!s.expires_at) {
        perm.add(s.item_id);
        delete exp[s.item_id];
      } else if (!perm.has(s.item_id)) {
        exp[s.item_id] = Math.max(exp[s.item_id] ?? 0, Date.parse(s.expires_at));
      }
    }
    g.itemExpiry = exp;

    // cần đã mất (hết hạn / vứt bỏ) thì rời khỏi thanh nhanh
    const before = g.hotbar.slots.join('|');
    g.hotbar.slots = g.hotbar.slots.map((id) => (id && ROD_BY_ID[id] && !rods.includes(id) ? null : id));
    if (g.hotbar.slots.join('|') !== before) {
      applyHeld(g);
      if (!rods.includes(g.fishingGear.rod)) g.fishingGear.rod = eqRod ?? 'rod_bamboo';
    }
  });
}

/** ô tốt nhất đang chứa món này (ưu tiên vĩnh viễn, rồi hạn xa nhất) */
export function slotOf(itemId: string, kind?: SlotKind): InventorySlot | undefined {
  const now = Date.now();
  return useChest
    .getState()
    .slots.filter((s) => s.item_id === itemId && (!kind || s.kind === kind) && isLive(s, now))
    .sort((a, b) => (a.expires_at ? Date.parse(a.expires_at) : Infinity) < (b.expires_at ? Date.parse(b.expires_at) : Infinity) ? 1 : -1)[0];
}

// ---------------------------------------------------------------- các RPC

/** mua mồi ở tiệm (p_qty = số gói) */
export function buyItem(itemId: string, qty = 1) {
  return serial(async () => {
    await syncWalletRaw({ quiet: true });
    const sent = snapshot();
    const res = await rpc<{ slot: InventorySlot | number; wallet: Wallet }>('buy_item', { p_item_id: itemId, p_qty: qty });
    if (!res) return null;
    applyWallet(res.wallet, sent);
    await getChestRaw({ quiet: true });
    return res;
  });
}

/** mở hộp cần câu / diều ×1 hoặc ×10 */
export function openBox(boxId: string, count: 1 | 10) {
  return serial(async () => {
    await syncWalletRaw({ quiet: true });
    const sent = snapshot();
    const res = await rpc<{ results: BoxResultRow[]; wallet: Wallet }>('open_box', { p_box_id: boxId, p_count: count });
    if (!res) return null;
    applyWallet(res.wallet, sent);
    await getChestRaw({ quiet: true });
    // cần mới: tự vào ô trống trên thanh nhanh như bản offline
    const rods = new Set(res.results.filter((r) => r.kind === 'rod' && ROD_BY_ID[r.item_id]).map((r) => r.item_id));
    if (rods.size) useGame.getState().apply((g) => rods.forEach((id) => g.fishingGear.rods.includes(id) && addToHotbar(g, id, false)));
    return res.results ?? [];
  });
}

/** trang bị cần câu / diều ở ô này (server bỏ trang bị cái cùng loại trước đó) */
export function equip(slot: number, opts: RpcOpts = {}) {
  return serial(async () => {
    const res = await rpc<{ ok: boolean }>('equip', { p_slot: slot }, opts);
    if (!res) return false;
    const { slots } = useChest.getState();
    const target = slots.find((s) => s.slot === slot);
    if (target) {
      const next = slots.map((s) => (s.kind === target.kind ? { ...s, equipped: s.slot === slot } : s));
      useChest.setState({ slots: next });
      mirrorChest(next);
    }
    return true;
  });
}

/** vứt bỏ (qty null = cả ô) */
export function discardItem(slot: number, qty: number | null = null) {
  return serial(async () => {
    const res = await rpc<{ ok: boolean }>('discard_item', { p_slot: slot, p_qty: qty });
    if (!res) return false;
    await getChestRaw({ quiet: true });
    return true;
  });
}

/** bán cá trong rương */
export function sellItem(slot: number, qty: number) {
  return serial(async () => {
    await syncWalletRaw({ quiet: true });
    const sent = snapshot();
    const res = await rpc<{ gold_gained: number; wallet: Wallet }>('sell_item', { p_slot: slot, p_qty: qty });
    if (!res) return null;
    applyWallet(res.wallet, sent);
    await getChestRaw({ quiet: true });
    return Number(res.gold_gained);
  });
}

/** Tự động dọn cá khỏi ô rương server (inventory_slots) khi cá đã được bán ở Kho Cá */
export async function removeFishFromChestIfPresent(fishId: string, count: number = 1) {
  if (!db) return;
  const { slots } = useChest.getState();
  const match = slots.find((s) => s.item_id === fishId && s.kind === 'stack');
  if (match) {
    await discardItem(match.slot, Math.min(match.qty, count));
  }
}

/** thả câu: server trừ mồi + giữ bí mật con cá; trả thời gian chờ & độ khó minigame */
export async function fishStart(baitId: string | null) {
  const res = await rpc<FishStartResult>('fish_start', { p_bait_id: baitId });
  if (!res) return null;
  // mồi vừa bị trừ trong rương
  if (baitId) {
    const { slots } = useChest.getState();
    useChest.setState({
      slots: slots.flatMap((s) => (s.item_id === baitId && s.kind === 'stack' ? (s.qty > 1 ? [{ ...s, qty: s.qty - 1 }] : []) : [s])).slice(),
    });
    const left = useChest.getState().slots;
    // ô mồi cuối cùng đã hết: cập nhật lại từ server cho chắc
    if (!left.some((s) => s.item_id === baitId)) void refreshChest({ quiet: true, skipSync: true });
  }
  return { ...res, wait_ms: Number(res.wait_ms), difficulty: Number(res.difficulty), zone: Number(res.zone), slow: Number(res.slow) };
}

/** kết thúc minigame — server trả con cá thật (hoặc lý do trượt) */
export async function fishFinish(castId: string, success: boolean, opts: RpcOpts = {}) {
  const res = await rpc<FishFinishResult>('fish_finish', { p_cast_id: castId, p_success: success }, opts);
  if (res?.caught) void refreshChest({ quiet: true, skipSync: true });
  if (res && res.caught) return { ...res, cm: Number(res.cm), kg: Number(res.kg), points: Number(res.points) };
  return res;
}

/** BXH câu cá tuần (top 50) */
export async function fishingTop(week: string) {
  const res = await rpc<FishTopRow[]>('fishing_top', { p_week: week }, { quiet: true });
  return res?.map((r) => ({ ...r, points: Number(r.points), biggest_cm: Number(r.biggest_cm ?? 0) })) ?? null;
}

// ---------------------------------------------------------------- trang bị từ thanh nhanh / tiệm → equip(slot)

// Hotbar, tiệm, KiteGame vẫn đổi g.fishingGear.rod / g.kites.equipped trên máy như bản offline;
// ở đây theo dõi thay đổi đó và gọi equip(slot) để server dùng đúng cần/diều.
let equipTimer: number | undefined;
async function pushEquip() {
  if (!serverFishing() || !useChest.getState().loaded) return;
  const g = useGame.getState().game;
  const { slots } = useChest.getState();
  const want: [SlotKind, string | null][] = [
    ['rod', g.fishingGear.rod],
    ['kite', g.kites.equipped],
  ];
  for (const [kind, id] of want) {
    if (!id) continue;
    const cur = slots.find((s) => s.kind === kind && s.equipped && isLive(s))?.item_id;
    if (cur === id) continue;
    const s = slotOf(id, kind);
    // cần tre không nằm trong rương: server tự dùng khi không có cần nào được trang bị
    if (s) await equip(s.slot, { quiet: true });
  }
}

if (typeof window !== 'undefined') {
  useGame.subscribe((s, prev) => {
    if (s.game.fishingGear.rod === prev.game.fishingGear.rod && s.game.kites.equipped === prev.game.kites.equipped) return;
    if (!serverFishing()) return;
    window.clearTimeout(equipTimer);
    equipTimer = window.setTimeout(() => void pushEquip(), 350);
  });
}

// ---------------------------------------------------------------- hiển thị

export const FISH_RARITY_COLOR: Record<FishRarity, string> = {
  common: '#9a9282',
  uncommon: '#4caf50',
  rare: '#3d7cc8',
  epic: '#8e4dc8',
  legendary: '#e0a020',
  mythic: '#ff3d7f',
};
export const FISH_RARITY_NAME: Record<FishRarity, string> = {
  common: 'Thường',
  uncommon: 'Khá',
  rare: 'Hiếm',
  epic: 'Sử thi',
  legendary: 'Huyền thoại',
  mythic: 'Thần thoại',
};
export const FISH_RARITIES: FishRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export interface ItemInfo {
  name: string;
  emoji: string;
  color: string;
  rarity: string;
  /** giá bán 1 con (cá) */
  price?: number;
  isFish: boolean;
}

export function itemInfo(id: string, kind: SlotKind, cat: Catalog | null = useChest.getState().catalog): ItemInfo {
  if (kind === 'rod') {
    const r = cat?.rodById[id];
    const l = ROD_BY_ID[id];
    const rar = (r?.rarity ?? l?.rarity ?? 'N') as RodRarity;
    return { name: r?.name ?? l?.name ?? id, emoji: r?.emoji ?? l?.emoji ?? '🎣', color: RARITY_COLOR[rar] ?? '#9a9282', rarity: rar, isFish: false };
  }
  if (kind === 'kite') {
    const k = cat?.kiteById[id];
    const l = KITE_BY_ID[id];
    const rar = (k?.rarity ?? l?.rarity ?? 'N') as RodRarity;
    return { name: k?.name ?? l?.name ?? id, emoji: k?.emoji ?? l?.emoji ?? '🪁', color: RARITY_COLOR[rar] ?? '#9a9282', rarity: rar, isFish: false };
  }
  const f = cat?.fishById[id];
  if (f) return { name: f.name, emoji: f.emoji, color: FISH_RARITY_COLOR[f.rarity] ?? '#9a9282', rarity: FISH_RARITY_NAME[f.rarity] ?? f.rarity, price: f.price, isFish: true };
  const lf = FISH_BY_ID[id];
  if (lf) return { name: lf.name, emoji: lf.emoji, color: lf.rare ? FISH_RARITY_COLOR.rare : FISH_RARITY_COLOR.common, rarity: lf.rare ? 'Hiếm' : 'Thường', price: lf.price, isFish: true };
  const sh = cat?.shop.find((s) => s.id === id);
  const it = ITEMS[id];
  return { name: sh?.name ?? it?.name ?? id, emoji: sh?.emoji ?? it?.emoji ?? '📦', color: '#6d7a8a', rarity: 'Vật phẩm', isFish: false };
}

/** phần trăm với đủ chữ số cho tỉ lệ cực nhỏ: 12.5% · 0.35% · 0.0005% */
export function fmtRate(p: number): string {
  const v = p * 100;
  if (!(v > 0)) return '0%';
  if (v >= 10) return `${Number(v.toFixed(1))}%`;
  if (v >= 1) return `${Number(v.toFixed(2))}%`;
  const decimals = Math.min(10, Math.ceil(-Math.log10(v)) + 1);
  return `${Number(v.toFixed(decimals)).toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '')}%`;
}

/** tỉ lệ ra từng loài cá của 1 cần (trọng số chuẩn hoá về %) */
export function rodRates(cat: Catalog, rodId: string): { fish: FishSpecies; p: number }[] {
  let rows = cat.rates.filter((r) => r.rod_id === rodId && r.weight > 0);
  // cần chưa có bảng riêng (vd cần tre không có trong rod_fish_rates) → dùng bảng của cần tre / cần đầu tiên
  if (!rows.length) {
    const fb = cat.rates.some((r) => r.rod_id === 'rod_bamboo') ? 'rod_bamboo' : cat.rods[0]?.id;
    rows = cat.rates.filter((r) => r.rod_id === fb && r.weight > 0);
  }
  const total = rows.reduce((s, r) => s + r.weight, 0) || 1;
  return rows
    .map((r) => ({ fish: cat.fishById[r.fish_id], p: r.weight / total }))
    .filter((x): x is { fish: FishSpecies; p: number } => !!x.fish)
    .sort((a, b) => a.fish.sort - b.fish.sort);
}

/** thời gian còn lại dạng "2 ngày 3 giờ" */
export function fmtLeft(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${min} phút`;
  if (min > 0) return `${min} phút`;
  return '< 1 phút';
}

export const slotExpiryText = (s: InventorySlot, now = Date.now()) => {
  if (s.kind === 'stack') return '';
  if (!s.expires_at) return '♾️';
  const left = Date.parse(s.expires_at) - now;
  return left > 0 ? `⏳ ${fmtLeft(left)}` : '⌛ Hết hạn';
};
