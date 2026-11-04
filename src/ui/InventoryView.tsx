import { useEffect, useState, type DragEvent } from 'react';
import { heroLook } from '../art/heroLook';
import { equipIconURL, rodIconURL } from '../art/rodArt';
import { BUFF_INFO } from '../game/config/buffs';
import { HEAL_ITEMS } from '../game/config/combat';
import { ALL_EQUIPMENT, EQUIP_BY_ID, POTION_BY_ID } from '../game/config/equipment';
import { ITEMS } from '../game/config/farm';
import { COSMETIC_BY_ID, RARITY_COLOR, RODS, ROD_BY_ID, type CosmeticKind } from '../game/config/shops';
import { itemBuffs } from '../game/logic/buffs';
import {
  STARTER_GEAR_IDS,
  discardFromBag,
  discardFromChest,
  heldItem,
  holdItem,
  kindOf,
  quickSellFromBag,
  selectSlot,
  setSlot,
  storeInChest,
  swapSlots,
  takeFromChest,
} from '../game/logic/hotbar';
import { eatFood, equipItem, playerStats, unequipAccessory, unequipArmor } from '../game/logic/player';
import { WORN_SLOTS, expiryBadgeText, isPermanent, toggleCosmetic } from '../game/logic/shop';
import type { GameState, ItemKind } from '../game/types';
import { fmt, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAll, pushAllDebounced } from '../services/online';
import { removeFishFromChestIfPresent, refreshChest } from '../services/fishingApi';
import { HeroDoll } from './HeroDoll';
import { SlotFace } from './Hotbar';
import { sellAllUnlockedFish, sellFish, syncFishBag, toggleLockFish } from '../game/logic/life';
import type { CaughtFish } from '../game/types';
import { statLine } from './ShopView';

// Hành trang kiểu Minecraft: nhân vật mặc đồ ở giữa, ô trang bị hai bên, lưới túi đồ / rương cất đồ, khung chi tiết và thanh 10 ô.
// Bỏ đồ đi (Vứt bỏ / Bán nhanh) hoặc Cất vào Rương: bấm nút ở khung chi tiết hoặc kéo thả vào ô 🗑️ Bỏ đồ / 🗄️ Rương đồ.

type Cat = 'weapon' | 'armor' | 'accessory' | 'rod' | 'cosmetic' | 'use' | 'item';
interface Entry {
  id: string;
  cat: Cat;
  inChest?: boolean;
}
/** món đang "nhấc lên": từ túi, rương hay từ ô số mấy của thanh nhanh */
interface Pick {
  id: string;
  from: number | 'bag' | 'chest';
}

const catOf = (id: string): Cat =>
  EQUIP_BY_ID[id] ? EQUIP_BY_ID[id].slot : ROD_BY_ID[id] ? 'rod' : COSMETIC_BY_ID[id] ? 'cosmetic' : HEAL_ITEMS[id] ? 'use' : 'item';

const TABS: { label: string; cats: Cat[]; chest?: boolean; fishbag?: boolean }[] = [
  { label: '🎒 Túi đồ', cats: ['weapon', 'rod', 'armor', 'accessory', 'use', 'cosmetic', 'item'] },
  { label: '🗄️ Rương đồ', cats: ['weapon', 'rod', 'armor', 'accessory', 'use', 'cosmetic', 'item'], chest: true },
  { label: '🐟 Kho cá', cats: [], fishbag: true },
];
const KIND_ORDER: ItemKind[] = ['potion', 'food', 'bait', 'fish', 'animal', 'crop', 'ore', 'seed', 'material'];
const KIND_NAME: Record<ItemKind, string> = {
  potion: 'Bình thuốc',
  food: 'Đồ ăn',
  bait: 'Mồi câu',
  fish: 'Cá',
  animal: 'Sản phẩm chăn nuôi',
  crop: 'Nông sản',
  ore: 'Khoáng sản',
  seed: 'Hạt giống',
  material: 'Nguyên liệu',
};
const CAT_NAME: Record<Exclude<Cat, 'item'>, string> = {
  weapon: 'Vũ khí',
  armor: 'Giáp',
  accessory: 'Phụ kiện',
  rod: 'Cần câu',
  cosmetic: 'Thời trang',
  use: 'Dùng được',
};
const COLS = 9;

function EntryIcon({ id, cat }: Entry) {
  if (cat === 'weapon' || cat === 'armor' || cat === 'accessory') return <img src={equipIconURL(id, cat)} alt="" draggable={false} />;
  if (cat === 'rod') return <img src={rodIconURL(id)} alt="" draggable={false} />;
  const emoji = EQUIP_BY_ID[id]?.emoji ?? COSMETIC_BY_ID[id]?.emoji ?? ITEMS[id]?.emoji ?? '❔';
  return <span className="inv-emoji">{emoji}</span>;
}

const nameOf = (id: string) => EQUIP_BY_ID[id]?.name ?? ROD_BY_ID[id]?.name ?? COSMETIC_BY_ID[id]?.name ?? ITEMS[id]?.name ?? id;
const colorOf = (e: Entry) =>
  e.cat === 'rod'
    ? RARITY_COLOR[ROD_BY_ID[e.id].rarity]
    : e.cat === 'cosmetic'
      ? RARITY_COLOR[COSMETIC_BY_ID[e.id].rarity]
      : EQUIP_BY_ID[e.id]?.rarity
        ? RARITY_COLOR[EQUIP_BY_ID[e.id].rarity!]
        : '#fff3c4';

/** mọi thứ người chơi đang có trong túi */
function allEntries(g: GameState): Entry[] {
  const out: Entry[] = [];
  ALL_EQUIPMENT.forEach((e) => g.player.owned.includes(e.id) && e.slot === 'weapon' && out.push({ id: e.id, cat: 'weapon' }));
  RODS.forEach((r) => g.fishingGear.rods.includes(r.id) && out.push({ id: r.id, cat: 'rod' }));
  ALL_EQUIPMENT.forEach((e) => g.player.owned.includes(e.id) && e.slot !== 'weapon' && out.push({ id: e.id, cat: e.slot }));
  const items = Object.entries(g.inventory)
    .filter(([id, n]) => n > 0 && ITEMS[id])
    .sort((a, b) => KIND_ORDER.indexOf(ITEMS[a[0]].kind) - KIND_ORDER.indexOf(ITEMS[b[0]].kind));
  items.forEach(([id]) => HEAL_ITEMS[id] && out.push({ id, cat: 'use' }));
  g.cosmetics.owned.forEach((id) => COSMETIC_BY_ID[id] && out.push({ id, cat: 'cosmetic' }));
  items.forEach(([id]) => !HEAL_ITEMS[id] && out.push({ id, cat: 'item' }));
  return out;
}

/** mọi thứ đang cất trong Rương đồ cá nhân (g.chest) */
function chestEntries(g: GameState): Entry[] {
  const out: Entry[] = [];
  const gear = g.chest?.gear ?? [];
  gear.forEach((id) => {
    if (EQUIP_BY_ID[id] || ROD_BY_ID[id] || COSMETIC_BY_ID[id]) {
      out.push({ id, cat: catOf(id), inChest: true });
    }
  });
  const items = Object.entries(g.chest?.items ?? {})
    .filter(([id, n]) => n > 0 && ITEMS[id])
    .sort((a, b) => KIND_ORDER.indexOf(ITEMS[a[0]].kind) - KIND_ORDER.indexOf(ITEMS[b[0]].kind));
  items.forEach(([id]) => out.push({ id, cat: HEAL_ITEMS[id] ? 'use' : 'item', inChest: true }));
  return out;
}

const isWorn = (g: GameState, e: Entry) =>
  !e.inChest &&
  (e.cat === 'weapon' || e.cat === 'rod'
    ? heldItem(g) === e.id
    : e.cat === 'armor' || e.cat === 'accessory'
      ? g.player.equip[e.cat] === e.id
      : e.cat === 'cosmetic' && WORN_SLOTS.some((s) => g.cosmetics[s] === e.id));

export function InventoryView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const apply = useGame((s) => s.apply);
  const [tab, setTab] = useState(0);
  const [focus, setFocus] = useState<Entry | null>(() => {
    const h = heldItem(g);
    return h && kindOf(h) ? { id: h, cat: catOf(h) } : null;
  });
  const [pick, setPick] = useState<Pick | null>(null);
  const [drag, setDrag] = useState<Pick | null>(null);
  const st = playerStats(g);
  const slots = g.hotbar.slots;
  const held = heldItem(g);

  const isChestTab = !!TABS[tab].chest;
  const isFishTab = !!TABS[tab].fishbag;

  // Tự động đồng bộ cá vào Kho Cá khi mở giao diện
  useEffect(() => {
    act((g) => {
      syncFishBag(g);
    });
  }, [act]);

  const [fishPage, setFishPage] = useState(0);
  const fishList: CaughtFish[] = g.fishing?.fishBag ?? [];
  const FISH_PAGE_SIZE = 36;
  const totalFishPages = Math.max(1, Math.ceil(fishList.length / FISH_PAGE_SIZE));
  const safeFishPage = Math.min(fishPage, Math.max(0, totalFishPages - 1));

  useEffect(() => {
    if (fishPage >= totalFishPages) {
      setFishPage(Math.max(0, totalFishPages - 1));
    }
  }, [fishList.length, totalFishPages, fishPage]);

  const pageFish = fishList.slice(safeFishPage * FISH_PAGE_SIZE, (safeFishPage + 1) * FISH_PAGE_SIZE);
  const [focusFishId, setFocusFishId] = useState<string | null>(null);
  const selectedFish = fishList.find((f) => f.uuid === focusFishId) ?? pageFish[0] ?? fishList[0] ?? null;

  const entries = isChestTab
    ? chestEntries(g)
    : isFishTab
      ? []
      : allEntries(g).filter((e) => TABS[tab].cats.includes(e.cat));
  const cells = Math.max(4, Math.ceil(entries.length / COLS)) * COLS;

  const unlockedCommonCount = fishList.filter((f) => !f.locked && f.rarity === 'common').length;

  const bagCount = (id: string) => g.inventory[id] ?? 0;
  const chestCount = (id: string) => g.chest?.items?.[id] ?? 0;
  const countOf = (e: Entry) => (e.inChest ? chestCount(e.id) : bagCount(e.id));

  const exists = (e: Entry) => {
    if (e.inChest) {
      return e.cat === 'item' || e.cat === 'use' ? chestCount(e.id) > 0 : (g.chest?.gear ?? []).includes(e.id);
    }
    return e.cat === 'item' || e.cat === 'use' ? bagCount(e.id) > 0 : allEntries(g).some((x) => x.id === e.id);
  };
  const shown = focus && exists(focus) ? focus : null;

  // ---- hành động
  const equip = (e: Entry) => {
    if (e.inChest) {
      act((g) => takeFromChest(g, e.id, 1));
      pushAllDebounced();
      return;
    }
    if (e.cat === 'weapon' || e.cat === 'rod') act((g) => holdItem(g, e.id));
    else if (e.cat === 'armor' || e.cat === 'accessory') act((g) => equipItem(g, e.id));
    else if (e.cat === 'cosmetic' && !isWorn(g, e)) act((g) => toggleCosmetic(g, e.id));
    else if (e.cat === 'use') act((g) => eatFood(g, e.id));
    pushAllDebounced();
  };
  const unequip = (e: Entry) => {
    if (e.cat === 'weapon' || e.cat === 'rod') act((g) => setSlot(g, g.hotbar.slots.indexOf(e.id), null));
    else if (e.cat === 'armor') act((g) => unequipArmor(g));
    else if (e.cat === 'accessory') act((g) => unequipAccessory(g));
    else if (e.cat === 'cosmetic') act((g) => toggleCosmetic(g, e.id));
    pushAllDebounced();
  };
  const place = (p: Pick, i: number) => {
    if (p.from === 'bag') act((g) => setSlot(g, i, p.id));
    else if (typeof p.from === 'number' && p.from !== i) apply((g) => swapSlots(g, p.from as number, i));
    setPick(null);
    pushAllDebounced();
  };

  const clickBag = (e: Entry) => {
    setFocus(e);
    setPick(!e.inChest && kindOf(e.id) ? { id: e.id, from: 'bag' } : null);
  };
  const clickBar = (i: number) => {
    if (pick && pick.from !== 'chest') return place(pick, i);
    const id = slots[i];
    if (!id) return;
    setFocus({ id, cat: catOf(id) });
    setPick({ id, from: i });
  };

  // chọn món rồi bấm phím 1–0 → đặt vào ô đó (như Minecraft)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const m = /^Digit(\d)$/.exec(ev.code);
      if (!m || !shown || shown.inChest || !kindOf(shown.id)) return;
      const n = Number(m[1]);
      act((g) => setSlot(g, n === 0 ? 9 : n - 1, shown.id));
      setPick(null);
      pushAllDebounced();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- kéo thả (chuột)
  const dragProps = (p: Pick) => ({
    draggable: true,
    onDragStart: (ev: DragEvent) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify(p));
      ev.dataTransfer.effectAllowed = 'move';
      setDrag(p);
    },
    onDragEnd: () => setDrag(null),
  });
  const readDrop = (ev: DragEvent): Pick | null => {
    ev.preventDefault();
    setDrag(null);
    try {
      return JSON.parse(ev.dataTransfer.getData('text/plain'));
    } catch {
      return null;
    }
  };
  const allow = (ev: DragEvent) => ev.preventDefault();
  const dropOnDoll = (ev: DragEvent) => {
    const p = readDrop(ev);
    if (p) equip({ id: p.id, cat: catOf(p.id), inChest: p.from === 'chest' });
  };
  const dropOnBag = (ev: DragEvent) => {
    const p = readDrop(ev);
    if (!p) return;
    if (typeof p.from === 'number') {
      act((g) => setSlot(g, p.from as number, null));
      pushAllDebounced();
    } else if (p.from === 'chest') {
      act((g) => takeFromChest(g, p.id, 1));
      pushAllDebounced();
    }
  };
  const dropOnTrash = (ev: DragEvent) => {
    const p = readDrop(ev);
    if (!p) return;
    if (p.from === 'chest') act((g) => discardFromChest(g, p.id, 1));
    else act((g) => discardFromBag(g, p.id, 1));
    setPick(null);
    pushAllDebounced();
  };
  const dropOnChest = (ev: DragEvent) => {
    const p = readDrop(ev);
    if (!p || p.from === 'chest') return;
    act((g) => storeInChest(g, p.id, 1));
    setPick(null);
    pushAllDebounced();
  };

  // ---- ô trang bị quanh nhân vật
  const C = g.cosmetics;
  const cos = (kind: CosmeticKind, label: string, ph: string) => ({ label, ph, id: C[kind] });
  const dollL = [cos('hat', 'Mũ', '🎩'), cos('top', 'Áo', '👕'), cos('bottom', 'Quần', '👖'), cos('shoes', 'Giày', '👟')];
  const dollR = [
    { label: 'Giáp', ph: '🛡️', id: g.player.equip.armor },
    { label: 'Phụ kiện', ph: '💍', id: g.player.equip.accessory },
    cos('wings', 'Cánh', '🪽'),
    cos('pet', 'Thú cưng', '🐾'),
  ];
  const dollB = [{ label: 'Tay cầm', ph: '✋', id: held && kindOf(held) !== 'use' ? held : null }, cos('neck', 'Dây chuyền', '📿'), cos('ear', 'Bông tai', '💎'), cos('face', 'Kính', '👓')];
  const DollSlot = ({ s }: { s: { label: string; ph: string; id: string | null } }) => {
    const e = s.id ? { id: s.id, cat: catOf(s.id) } : null;
    return (
      <button
        className={`inv-cell eq ${e && shown?.id === e.id && !shown?.inChest ? 'focus' : ''}`}
        title={e ? `${s.label}: ${nameOf(e.id)} (Bấm đúp để tháo đồ)` : `${s.label}: trống`}
        onClick={() => e && clickBag(e)}
        onDoubleClick={() => e && unequip(e)}
        onDragOver={allow}
        onDrop={dropOnDoll}
        {...(e ? dragProps({ id: e.id, from: 'bag' }) : {})}
      >
        {e ? <EntryIcon {...e} /> : <span className="inv-ph">{s.ph}</span>}
        <small className="eq-label">{s.label}</small>
      </button>
    );
  };

  const placing = (pick && pick.from !== 'chest' ? pick : null) ?? (drag && drag.from !== 'chest' && kindOf(drag.id) ? drag : null);
  const chestTotal = chestEntries(g).length;

  return (
    <div className="inv">
      {/* ---------------- nhân vật */}
      <section className="inv-hero">
        <div className="inv-name">
          <b>{g.profile.name || 'Mạo hiểm giả'}</b>
          <small>Lv {g.player.level}</small>
        </div>
        <div className="inv-doll-row">
          <div className="inv-eq-col">
            {dollL.map((s) => (
              <DollSlot key={s.label} s={s} />
            ))}
          </div>
          <div className="inv-doll" onDragOver={allow} onDrop={dropOnDoll} title="Thả đồ vào nhân vật để mặc / cầm">
            <HeroDoll look={heroLook(g)} held={held} pet={C.pet} wings={C.wings} />
          </div>
          <div className="inv-eq-col">
            {dollR.map((s) => (
              <DollSlot key={s.label} s={s} />
            ))}
          </div>
        </div>
        <div className="inv-eq-row">
          {dollB.map((s) => (
            <DollSlot key={s.label} s={s} />
          ))}
        </div>
        <div className="inv-stats">
          <span>⚔️ {st.atk}</span>
          <span>🛡️ {st.def}</span>
          <span>❤️ {Math.floor(g.player.hp)}/{st.maxHp}</span>
          <span>💥 {pct(st.crit)}</span>
          <span>👟 {pct(st.speed)}</span>
          {st.regen > 0 && <span>💚 {st.regen}/s</span>}
        </div>
      </section>

      {/* ---------------- túi đồ / rương đồ */}
      <section className="inv-bag" onDragOver={allow} onDrop={dropOnBag}>
        <div className="inv-tabs">
          {TABS.map((t, i) => (
            <button key={t.label} className={`inv-tab ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)} title={t.label}>
              <span>{t.label.split(' ')[0]}</span>
              <small>
                {t.label.slice(t.label.indexOf(' ') + 1)}
                {t.chest && chestTotal > 0 ? ` (${chestTotal})` : ''}
              </small>
            </button>
          ))}
        </div>
        {isFishTab ? (
          <>
            <div className="inv-grid">
              {Array.from({ length: FISH_PAGE_SIZE }, (_, i) => {
                const f = pageFish[i];
                if (!f) return <div key={`empty_fish_${i}`} className="inv-cell empty" />;
                const isFocused = selectedFish?.uuid === f.uuid;
                const rarColor =
                  f.rarity === 'mythic'
                    ? '#ec4899'
                    : f.rarity === 'legendary'
                      ? '#f59e0b'
                      : f.rarity === 'epic'
                        ? '#a855f7'
                        : f.rarity === 'rare'
                          ? '#3b82f6'
                          : '#9ca3af';

                return (
                  <button
                    key={f.uuid}
                    className={`inv-cell ${isFocused ? 'focus' : ''}`}
                    onClick={() => setFocusFishId(f.uuid)}
                    title={`${f.emoji} ${f.name} (${f.cm}cm) - ${f.tierName}${f.locked ? ' [Đã khóa]' : ''}`}
                  >
                    <span className="inv-emoji" style={{ fontSize: '1.25rem' }}>{f.emoji}</span>
                    <b className="inv-count" style={{ fontSize: '0.62rem' }}>{Math.round(f.cm)}cm</b>
                    {f.locked && <i className="inv-on" style={{ background: '#ef4444' }} title="Đã khóa">🔒</i>}
                    <i className="hb-rar" style={{ background: rarColor }} />
                  </button>
                );
              })}
            </div>

            {/* Thanh phân trang và thao tác kho cá */}
            <div className="fish-page-bar">
              <div className="fish-page-nav">
                <button
                  className="btn sm ghost fish-nav-btn"
                  disabled={safeFishPage <= 0}
                  onClick={() => setFishPage((p) => Math.max(0, p - 1))}
                  title="Trang trước"
                >
                  ◀ Trước
                </button>

                <div className="fish-page-indicator">
                  <span className="fish-page-text">Trang <b>{safeFishPage + 1}</b> / {totalFishPages}</span>
                  <small className="fish-page-total">({fishList.length}/200 con)</small>
                </div>

                <button
                  className="btn sm ghost fish-nav-btn"
                  disabled={safeFishPage >= totalFishPages - 1}
                  onClick={() => setFishPage((p) => Math.min(totalFishPages - 1, p + 1))}
                  title="Trang sau"
                >
                  Sau ▶
                </button>
              </div>

              {totalFishPages > 1 && (
                <div className="fish-page-jumps">
                  {Array.from({ length: totalFishPages }, (_, idx) => (
                    <button
                      key={idx}
                      className={`fish-page-jump-btn ${safeFishPage === idx ? 'active' : ''}`}
                      onClick={() => setFishPage(idx)}
                      title={`Đến trang ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="fish-page-actions">
                {unlockedCommonCount > 0 && (
                  <button
                    className="btn sm gold"
                    onClick={() => {
                      act((g) => {
                        const res = sellAllUnlockedFish(g, true);
                        useGame.getState().toast(res.msg, 'ok');
                      });
                      useGame.getState().saveNow();
                      void pushAll();
                      void refreshChest({ quiet: true, skipSync: true });
                    }}
                    title="Bán tất cả cá phẩm chất Thường (không bị khóa)"
                  >
                    🪙 Bán nhanh cá thường ({unlockedCommonCount})
                  </button>
                )}
              </div>
            </div>

            <p className="inv-hint" style={{ margin: 0, textAlign: 'center' }}>
              💡 Bấm vào ô cá để xem thông số chiều dài, cân nặng hoặc bán đổi vàng / kim cương ở cột bên phải
            </p>
          </>
        ) : (
          <>
            <div className="inv-grid">
              {Array.from({ length: cells }, (_, i) => {
                const e = entries[i];
                if (!e) return <div key={i} className="inv-cell empty" />;
                const at = e.inChest ? -1 : slots.indexOf(e.id);
                const n = e.cat === 'item' || e.cat === 'use' ? countOf(e) : 0;
                return (
                  <button
                    key={`${e.inChest ? 'c_' : 'b_'}${e.id}`}
                    className={`inv-cell ${shown?.id === e.id && !!shown?.inChest === !!e.inChest ? 'focus' : ''} ${pick?.from === 'bag' && pick.id === e.id && !e.inChest ? 'picked' : ''}`}
                    onClick={() => clickBag(e)}
                    onDoubleClick={() => equip(e)}
                    title={e.inChest ? `${nameOf(e.id)} (Đang trong Rương — bấm đúp để lấy ra)` : nameOf(e.id)}
                    {...dragProps({ id: e.id, from: e.inChest ? 'chest' : 'bag' })}
                  >
                    <EntryIcon {...e} />
                    {n > 1 && <b className="inv-count">{n > 999 ? '999+' : n}</b>}
                    {isWorn(g, e) && <i className="inv-on" title="Đang dùng" />}
                    {at >= 0 && <i className="inv-at">{(at + 1) % 10}</i>}
                    {(e.cat === 'rod' || (EQUIP_BY_ID[e.id]?.rarity && (e.cat === 'weapon' || e.cat === 'armor' || e.cat === 'accessory'))) && (
                      <i className="hb-rar" style={{ background: colorOf(e) }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Ô kéo thả nhanh: Cất vào Rương & Bỏ đồ (Vứt bỏ) */}
            <div className="row between" style={{ gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <p className="inv-hint" style={{ margin: 0, flex: 1 }}>
                {isChestTab
                  ? '🗄️ Đồ đang cất trong Rương · Bấm đúp để lấy ra Túi hoặc chọn để lấy / vứt bỏ'
                  : placing
                    ? `📥 Bấm một ô ở thanh dưới để đặt ${nameOf(placing.id)} · hoặc nhấn phím 1–0`
                    : 'Bấm món để xem / bỏ đồ · bấm đúp để dùng / mặc · kéo thả vào Rương hoặc Thùng rác'}
              </p>
              <div className="row" style={{ gap: 6 }}>
                <button
                  className="btn sm ghost"
                  onDragOver={allow}
                  onDrop={dropOnChest}
                  onClick={() => {
                    if (shown && !shown.inChest) {
                      act((g) => storeInChest(g, shown.id, 1));
                      pushAllDebounced();
                    } else setTab(TABS.findIndex((t) => t.chest));
                  }}
                  title="Kéo thả đồ vào đây hoặc bấm khi đang chọn món để cất vào Rương"
                >
                  🗄️ {shown && !shown.inChest ? 'Cất vào Rương' : `Rương (${chestTotal})`}
                </button>
                <button
                  className="btn sm danger"
                  onDragOver={allow}
                  onDrop={dropOnTrash}
                  disabled={!shown || STARTER_GEAR_IDS.has(shown.id)}
                  onClick={() => {
                    if (!shown) return;
                    if (shown.inChest) act((g) => discardFromChest(g, shown.id, 1));
                    else act((g) => discardFromBag(g, shown.id, 1));
                    pushAllDebounced();
                  }}
                  title="Kéo thả món đồ vào đây hoặc bấm để vứt bỏ khỏi rương đồ"
                >
                  🗑️ Bỏ đồ
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------------- chi tiết */}
      <aside className="inv-info">
        {isFishTab ? (
          selectedFish ? (
            <FishDetail
              fish={selectedFish}
              onSell={() => {
                const fishId = selectedFish.id;
                act((g) => {
                  const res = sellFish(g, selectedFish.uuid);
                  useGame.getState().toast(res.msg, 'ok');
                });
                useGame.getState().saveNow();
                void pushAll();
                void removeFishFromChestIfPresent(fishId, 1);
              }}
              onToggleLock={() => {
                act((g) => {
                  const locked = toggleLockFish(g, selectedFish.uuid);
                  useGame.getState().toast(locked ? `🔒 Đã khóa ${selectedFish.name}` : `🔓 Đã mở khóa ${selectedFish.name}`);
                });
                useGame.getState().saveNow();
                void pushAll();
              }}
            />
          ) : (
            <div className="inv-info-empty">
              <span>🐟</span>
              <p>Kho cá trống · Hãy dùng cần câu ra bờ nước câu cá để thu thập!</p>
            </div>
          )
        ) : shown ? (
          <Detail
            e={shown}
            worn={isWorn(g, shown)}
            at={shown.inChest ? -1 : slots.indexOf(shown.id)}
            count={countOf(shown)}
            onEquip={equip}
            onUnequip={unequip}
          />
        ) : (
          <div className="inv-info-empty">
            <span>{isChestTab ? '🗄️' : '🎒'}</span>
            <p>{isChestTab ? 'Chọn một món trong Rương để lấy ra hoặc vứt bỏ' : 'Chọn một món trong túi để xem chi tiết, cất vào Rương hoặc bỏ đi'}</p>
          </div>
        )}
      </aside>

      {/* ---------------- thanh 10 ô */}
      <section className="inv-bar">
        <div className="hotbar">
          {slots.map((id, i) => (
            <button
              key={i}
              className={`hb-slot ${i === g.hotbar.sel ? 'sel' : ''} ${pick?.from === i ? 'picked' : ''} ${placing ? 'drop-ok' : ''}`}
              onClick={() => clickBar(i)}
              onDoubleClick={() => id && kindOf(id) !== 'use' && apply((g) => selectSlot(g, i))}
              onDragOver={allow}
              onDrop={(ev) => {
                const p = readDrop(ev);
                if (p && p.from !== 'chest' && kindOf(p.id)) place(p, i);
              }}
              title={id ? nameOf(id) : 'Ô trống'}
              {...(id ? dragProps({ id, from: i }) : {})}
            >
              <SlotFace id={id} index={i} />
            </button>
          ))}
        </div>
        {pick && (
          <button className="btn sm ghost" onClick={() => setPick(null)}>
            Hủy
          </button>
        )}
      </section>
    </div>
  );
}

function Detail({ e, worn, at, count, onEquip, onUnequip }: { e: Entry; worn: boolean; at: number; count: number; onEquip: (e: Entry) => void; onUnequip: (e: Entry) => void }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const lvl = g.player.level;
  const it = ITEMS[e.id];
  const eq = EQUIP_BY_ID[e.id];
  const rod = ROD_BY_ID[e.id];
  const c = COSMETIC_BY_ID[e.id];
  const pot = POTION_BY_ID[e.id];
  const type = e.cat === 'item' ? KIND_NAME[it.kind] : e.cat === 'cosmetic' ? 'Thời trang' : CAT_NAME[e.cat];
  const desc = eq?.desc ?? rod?.desc ?? c?.desc ?? pot?.desc;
  const buffs = itemBuffs(e.id);
  const canBar = !e.inChest && !!kindOf(e.id);
  const hasDur = e.cat === 'weapon' || e.cat === 'armor' || e.cat === 'accessory' || e.cat === 'rod' || e.cat === 'cosmetic';
  const isStarter = STARTER_GEAR_IDS.has(e.id);
  const isStackable = e.cat === 'item' || e.cat === 'use';

  return (
    <div className="inv-detail">
      <div className="inv-big">
        <EntryIcon {...e} />
      </div>
      <h3 style={{ color: colorOf(e) }}>{nameOf(e.id)}</h3>
      <div className="inv-tags">
        <span>{type}</span>
        {e.inChest && <span className="ok">🗄️ Trong Rương</span>}
        {(rod ?? c) && <span style={{ background: RARITY_COLOR[(rod ?? c).rarity] }}>{(rod ?? c).rarity}</span>}
        {eq?.rarity && <span style={{ background: RARITY_COLOR[eq.rarity] }}>{eq.rarity}</span>}
        {hasDur && (
          <span className={`dur-pill ${isPermanent(g, e.id) ? 'perm' : 'd7'}`}>{expiryBadgeText(g, e.id)}</span>
        )}
        {eq && eq.levelReq > 1 && <span className={lvl < eq.levelReq ? 'bad' : ''}>Lv {eq.levelReq}</span>}
        {worn && <span className="ok">Đang dùng</span>}
        {at >= 0 && <span className="ok">Ô {(at + 1) % 10}</span>}
        {count > 0 && <span>×{fmt(count)}</span>}
      </div>
      <div className="inv-lore">
        {eq && statLine(eq) && <p className="stat">{statLine(eq)}</p>}
        {rod && <p className="stat">🍀 Cá hiếm ×{rod.rare} · 📏 Cá to +{Math.round(rod.size * 100)}%</p>}
        {e.cat === 'use' && (
          <p className="stat">
            ❤️ Hồi {fmt(HEAL_ITEMS[e.id])} HP
            {pot?.energy ? ` · ⚡ +${pot.energy} thể lực` : ''}
            {buffs.map((b) => ` · ${BUFF_INFO[b.id].emoji} ${BUFF_INFO[b.id].desc(b.value)} (${b.min}p)`).join('')}
          </p>
        )}
        {it && it.sellPrice > 0 && <p>🪙 Giá bán: {fmt(it.sellPrice)}/cái</p>}
        {desc && <p className="muted">{desc}</p>}
        {it?.kind === 'seed' && <p className="muted">Ra ruộng nhấn E để gieo.</p>}
      </div>

      <div className="inv-actions">
        {e.inChest ? (
          <>
            <button
              className="btn sm gold"
              onClick={() => {
                act((g) => takeFromChest(g, e.id, 1));
                pushAllDebounced();
              }}
            >
              📤 Lấy ra Túi {isStackable && count > 1 ? '×1' : ''}
            </button>
            {isStackable && count > 1 && (
              <button
                className="btn sm"
                onClick={() => {
                  act((g) => takeFromChest(g, e.id, count));
                  pushAllDebounced();
                }}
              >
                📤 Lấy hết (×{fmt(count)})
              </button>
            )}
            <button
              className="btn sm danger"
              onClick={() => {
                act((g) => discardFromChest(g, e.id, 1));
                pushAllDebounced();
              }}
            >
              🗑️ Bỏ {isStackable && count > 1 ? '×1' : 'khỏi Rương'}
            </button>
            {isStackable && count > 1 && (
              <button
                className="btn sm danger"
                onClick={() => {
                  if (confirm(`Bỏ toàn bộ ${nameOf(e.id)} ×${count} trong Rương?`)) {
                    act((g) => discardFromChest(g, e.id, count));
                    pushAllDebounced();
                  }
                }}
              >
                🗑️ Bỏ hết (×{fmt(count)})
              </button>
            )}
          </>
        ) : (
          <>
            {(e.cat === 'weapon' || e.cat === 'rod') &&
              (worn ? (
                <span className="inv-note">✋ Đang cầm trên tay</span>
              ) : (
                <button className="btn sm" onClick={() => onEquip(e)}>
                  ✋ Cầm lên tay
                </button>
              ))}
            {(e.cat === 'armor' || e.cat === 'accessory' || e.cat === 'cosmetic') &&
              (worn ? (
                <button className="btn sm ghost" onClick={() => onUnequip(e)}>
                  Tháo ra
                </button>
              ) : (
                <button className="btn sm" onClick={() => onEquip(e)}>
                  {e.cat === 'accessory' ? 'Đeo vào' : 'Mặc vào'}
                </button>
              ))}
            {e.cat === 'use' && (
              <button className="btn sm" onClick={() => onEquip(e)}>
                🍽️ Dùng ngay
              </button>
            )}
            {canBar &&
              (at >= 0 ? (
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    act((g) => setSlot(g, at, null));
                    pushAllDebounced();
                  }}
                >
                  Bỏ khỏi ô {(at + 1) % 10}
                </button>
              ) : (
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    act((g) => {
                      const i = g.hotbar.slots.indexOf(null);
                      return setSlot(g, i < 0 ? g.hotbar.sel : i, e.id);
                    });
                    pushAllDebounced();
                  }}
                >
                  📥 Vào thanh nhanh
                </button>
              ))}

            {/* Cất vào Rương đồ */}
            {!isStarter && (
              <>
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    act((g) => storeInChest(g, e.id, 1));
                    pushAllDebounced();
                  }}
                >
                  🗄️ Cất vào Rương {isStackable && count > 1 ? '×1' : ''}
                </button>
                {isStackable && count > 1 && (
                  <button
                    className="btn sm ghost"
                    onClick={() => {
                      act((g) => storeInChest(g, e.id, count));
                      pushAllDebounced();
                    }}
                  >
                    🗄️ Cất hết (×{fmt(count)})
                  </button>
                )}
              </>
            )}

            {/* Bán nhanh lấy vàng */}
            {isStackable && it && it.sellPrice > 0 && (
              <>
                <button
                  className="btn sm gold"
                  onClick={() => {
                    act((g) => quickSellFromBag(g, e.id, 1));
                    pushAllDebounced();
                  }}
                >
                  🪙 Bán ×1 (+{fmt(it.sellPrice)})
                </button>
                {count > 1 && (
                  <button
                    className="btn sm gold"
                    onClick={() => {
                      act((g) => quickSellFromBag(g, e.id, count));
                      pushAllDebounced();
                    }}
                  >
                    🪙 Bán hết (+{fmt(it.sellPrice * count)})
                  </button>
                )}
              </>
            )}

            {/* Vứt bỏ khỏi rương đồ / túi đồ */}
            {!isStarter && (
              <>
                <button
                  className="btn sm danger"
                  onClick={() => {
                    act((g) => discardFromBag(g, e.id, 1));
                    pushAllDebounced();
                  }}
                >
                  🗑️ Bỏ {isStackable && count > 1 ? '×1' : 'đồ'}
                </button>
                {isStackable && count > 1 && (
                  <button
                    className="btn sm danger"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn bỏ hết ${nameOf(e.id)} ×${count}?`)) {
                        act((g) => discardFromBag(g, e.id, count));
                        pushAllDebounced();
                      }
                    }}
                  >
                    🗑️ Bỏ hết (×{fmt(count)})
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FishDetail({
  fish,
  onSell,
  onToggleLock,
}: {
  fish: CaughtFish;
  onSell: () => void;
  onToggleLock: () => void;
}) {
  const rarColor =
    fish.rarity === 'mythic'
      ? '#ec4899'
      : fish.rarity === 'legendary'
        ? '#f59e0b'
        : fish.rarity === 'epic'
          ? '#a855f7'
          : fish.rarity === 'rare'
            ? '#3b82f6'
            : '#9ca3af';

  const rarLabel =
    fish.rarity === 'mythic'
      ? '🌟 THẦN THOẠI CỰC PHẨM'
      : fish.rarity === 'legendary'
        ? '👑 TRUYỀN THUYẾT'
        : fish.rarity === 'epic'
          ? '💜 SỬ THI'
          : fish.rarity === 'rare'
            ? '💙 HIẾM'
            : 'CÁ THƯỜNG';

  return (
    <div className="inv-detail">
      <div className="inv-big">
        <span style={{ fontSize: '3rem', lineHeight: 1 }}>{fish.emoji}</span>
      </div>
      <h3 style={{ color: rarColor }}>{fish.name}</h3>
      <div className="inv-tags">
        <span style={{ background: rarColor, color: '#fff', fontWeight: 'bold' }}>{rarLabel}</span>
        <span className="ok">Cỡ: {fish.tierName}</span>
        {fish.locked && <span style={{ background: '#ef4444', color: '#fff' }}>🔒 Đã khóa</span>}
      </div>
      <div className="inv-lore">
        <p className="stat">📏 Chiều dài: <b>{fish.cm} cm</b> · ⚖️ Nặng: <b>{fish.kg} kg</b></p>
        <p className="stat">📍 Nơi câu: <b>{fish.zoneName}</b></p>
        <p>
          🪙 Giá bán: <b>{fmt(fish.priceGold)}</b> vàng
          {fish.priceGems ? <b style={{ color: '#60a5fa', marginLeft: 8 }}>💎 {fish.priceGems} KC</b> : null}
        </p>
        {fish.isSuperRare && (
          <p style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '0.8rem' }}>
            ✨ Cá Thần Thoại cực hiếm! Đã nhận danh hiệu tôn quý đặc biệt.
          </p>
        )}
      </div>

      <div className="inv-actions">
        <button
          className="btn sm gold"
          disabled={fish.locked}
          onClick={onSell}
          title={fish.locked ? 'Mở khóa cá trước khi bán' : 'Bán cá này lấy tiền'}
        >
          🪙 Bán cá (+{fmt(fish.priceGold)}v{fish.priceGems ? ` +${fish.priceGems}💎` : ''})
        </button>
        <button
          className="btn sm ghost"
          onClick={onToggleLock}
          title={fish.locked ? 'Mở khóa để có thể bán' : 'Khóa để không bị bán nhầm'}
        >
          {fish.locked ? '🔓 Mở khóa' : '🔒 Khóa cá'}
        </button>
      </div>
    </div>
  );
}
