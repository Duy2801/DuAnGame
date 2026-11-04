import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { NPC_LOOKS } from '../art/avatar';
import { ITEMS } from '../game/config/farm';
import { FISH_BY_ID, fishKg } from '../game/config/life';
import { ALL_FISH_SPECIES, FISHING_ZONES, type FishSpeciesDef } from '../game/config/fishingZones';
import {
  BAIT_BOX,
  BAIT_SHOP,
  BAITS,
  RARITY_COLOR,
  RARITY_NAME,
  RARITY_STARS,
  ROD_BOXES,
  ROD_DUP_GOLD,
  RODS,
  getRareTier,
  getSizeTier,
  getBiteTier,
  getMissTier,
  type RodDef,
  type RodRarity,
} from '../game/config/shops';
import { itemCount, spendGold, spendGems, addItem } from '../game/logic/core';
import { buyBait, buyBaitBox, equipRod, openRodBoxMany, type BoxResult } from '../game/logic/life';
import { durationLabel, expiryBadgeText, isPermanent, type DurationRoll, type DurationStatus } from '../game/logic/shop';
import { fmt, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAllDebounced } from '../services/online';
import { chestURL, ROD_SHAPE_INFO } from '../art/rodArt';
import { FishVisual } from '../art/fishArt';
import { RodVisual, BaitVisual } from '../art/fishingVisuals';
import {
  CHEST_SIZE,
  FISH_RARITY_COLOR,
  FISH_RARITY_NAME,
  equip,
  loadCatalog,
  openBox,
  openChest,
  refreshChest,
  slotOf,
  useChest,
  useServerFishing,
  type BoxDefRow,
  type RodDefRow,
} from '../services/fishingApi';
import { AvatarView } from './AvatarView';
import { FishBagView } from './FishBagView';
import { bus } from '../world/bus';
import { sfx } from '../world/sfx';

export { RARITY_NAME, RARITY_STARS };

export function ServerBoxGrid({
  kind,
  busy,
  onOpen,
}: {
  kind: 'rod' | 'kite';
  busy?: boolean;
  onOpen: (boxId: string, count: number) => void;
}) {
  const g = useGame((s) => s.game);
  const [boxes, setBoxes] = useState<BoxDefRow[]>([]);

  useEffect(() => {
    let unmounted = false;
    loadCatalog().then((c) => {
      if (!unmounted && c?.boxes) {
        setBoxes(c.boxes.filter((b: BoxDefRow) => b.kind === kind));
      }
    });
    return () => {
      unmounted = true;
    };
  }, [kind]);

  if (!boxes.length) {
    return <div className="gshop-empty">Đang tải danh sách hộp từ máy chủ...</div>;
  }

  return (
    <div className="chest-grid gshop-boxes">
      {boxes.map((b: BoxDefRow) => {
        const unit = b.price_gems ?? b.price_gold ?? 0;
        const cur = b.price_gems ? '💎' : '🪙';
        const money = b.price_gems ? g.gems : g.gold;
        return (
          <div key={b.id} className="chest-card cbox t2">
            {b.price_gems && <span className="vip-tag">VIP</span>}
            <div className="chest-glow" />
            <span className="cbox-art">{b.emoji}</span>
            <b>{b.name}</b>
            <OddsBar odds={b.odds} />
            <div className="odds-legend">
              {(Object.entries(b.odds) as [RodRarity, number][]).map(([r, p]) => (
                <span key={r} style={{ color: RARITY_COLOR[r] }}>
                  {r} {pct(p ?? 0)}
                </span>
              ))}
            </div>
            <div className="chest-btns">
              {[1, 10].map((n) => (
                <button
                  key={n}
                  className={`btn sm ${b.price_gems ? 'purple' : 'gold'}`}
                  disabled={busy || money < unit * n}
                  onClick={() => onOpen(b.id, n)}
                >
                  <span>{n === 1 ? 'Mở ×1' : 'Mở ×10'}</span>
                  <b>
                    {cur}
                    {fmt(unit * n)}
                  </b>
                </button>
              ))}
            </div>
            {money < unit && (
              <small className="chest-short">
                Còn thiếu {cur}
                {fmt(unit - money)}
              </small>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Cần câu theo id: ưu tiên thông số local (hình vẽ, chỉ số), thiếu thì dựng từ rod_defs của server */
export function rodDefOf(id: string, row?: RodDefRow): RodDef {
  const l = ROD_BY_ID_LOCAL[id];
  if (l) return row ? { ...l, name: row.name, emoji: row.emoji, rarity: row.rarity } : l;
  return {
    id,
    name: row?.name ?? id,
    emoji: row?.emoji ?? '🎣',
    rarity: row?.rarity ?? 'N',
    zone: row?.zone ?? 0,
    rare: 1,
    size: row?.size ?? 0,
    slow: row?.slow ?? 1,
    bite: row?.bite ?? 1,
    miss: row?.miss ?? 1,
    desc: row?.descr ?? '',
  };
}
const ROD_BY_ID_LOCAL: Record<string, RodDef> = Object.fromEntries(RODS.map((r) => [r.id, r]));

export const boxPrice = (b: BoxDefRow) =>
  b.price_gems ? { unit: b.price_gems, cur: '💎', gems: true } : { unit: b.price_gold ?? 0, cur: '🪙', gems: false };

const RANK = (r: RodRarity) => RARITY_STARS[r] ?? 1;

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rstat">
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.max(4, Math.min(1, value) * 100)}%` }} />
      </i>
    </div>
  );
}

/** Thẻ cần câu kiểu thẻ bài */
export function RodCard({
  rod,
  owned,
  using,
  onUse,
  small,
  duration,
  status,
  expText,
  isPerm,
}: {
  rod: RodDef;
  owned: boolean;
  using?: boolean;
  onUse?: () => void;
  small?: boolean;
  duration?: DurationRoll;
  status?: DurationStatus;
  expText?: string;
  isPerm?: boolean;
}) {
  return (
    <div className={`rcard r-${rod.rarity} ${owned ? '' : 'locked'} ${using ? 'using' : ''} ${small ? 'small' : ''}`}>
      <div className="rcard-top">
        <span className="rcard-rar">{rod.rarity}</span>
        <span className="rcard-stars">{'★'.repeat(RARITY_STARS[rod.rarity] ?? 1)}</span>
      </div>
      <div className="rcard-art" style={{ filter: owned ? 'none' : 'brightness(0.18) contrast(1.4)' }}>
        <RodVisual rodId={rod.id} rarity={rod.rarity} width={small ? 96 : 136} height={small ? 54 : 74} animated={owned} />
      </div>
      <b className="rcard-name">{owned ? rod.name : '???'}</b>
      {duration && (
        <span className={`dur-pill ${duration === 'perm' ? 'perm' : duration === '7d' ? 'd7' : 'd3'}`}>
          {durationLabel(duration, status)}
        </span>
      )}
      {!duration && owned && expText && (
        <span className={`dur-pill ${isPerm ? 'perm' : 'd7'}`}>{expText}</span>
      )}
      {!small &&
        (owned ? (
          <div className="rstats">
            <StatBar label="Cá hiếm" value={(rod.rare - 1) / 8} />
            <StatBar label="Cá to" value={rod.size / 2} />
            <StatBar label="Cắn nhanh" value={(1 - rod.bite) / 0.7} />
            <StatBar label="Bền dây" value={(1 - rod.miss) / 0.85} />
          </div>
        ) : (
          <small className="rcard-hint">{RARITY_NAME[rod.rarity]} · Mở hộp để nhận</small>
        ))}
      {!small && owned && onUse && (using ? <span className="rcard-using">✔ Đang dùng</span> : <button className="btn sm" onClick={onUse}>Dùng</button>)}
    </div>
  );
}

export function OddsBar({ odds }: { odds: Partial<Record<RodRarity, number>> }) {
  return (
    <div className="chest-rarity-row">
      {(Object.keys(odds) as RodRarity[]).map((r) => (
        <span key={r} className="rarity-badge-pill" style={{ color: RARITY_COLOR[r], borderColor: RARITY_COLOR[r] }}>
          {r}
        </span>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'box', label: '🎁 Rương Cần Câu' },
  { id: 'bait', label: '🪱 Mồi Câu & VIP' },
  { id: 'all_rods', label: '🎣 50 Cần Câu' },
  { id: 'fish_pedia', label: '🐟 Bách Khoa Cá' },
  { id: 'fish_collection', label: '📖 Bộ Sưu Tập Cá' },
  { id: 'perm_rods', label: '🏆 Cần Vĩnh Viễn' },
  { id: 'fish_bag', label: '💰 Kho Cá & Bán Cá' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function FishingShop() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const apply = useGame((s) => s.apply);
  const [tab, setTab] = useState<Tab>('box');
  const [opening, setOpening] = useState<{ box: string; results: BoxResult[]; nonce: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [rodFilter, setRodFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [colFilter, setColFilter] = useState<string>('all');

  const online = useServerFishing();
  const cat = useChest((s) => s.catalog);
  const used = useChest((s) => s.slots.length);
  const owned = new Set(g.fishingGear.rods);
  const big = g.fishing?.biggest;
  const rodList = useMemo(() => {
    if (!online || !cat?.rods.length) return RODS;
    const serverMap = new Map(cat.rods.map((r) => [r.id, r]));
    return RODS.map((r) => rodDefOf(r.id, serverMap.get(r.id)));
  }, [online, cat?.rods]);

  useEffect(() => {
    if (!online) return;
    void loadCatalog();
    void refreshChest({ quiet: true });
  }, [online]);

  const open = async (boxId: string, n: number) => {
    if (!online) {
      const results = apply((g) => openRodBoxMany(g, boxId, n));
      if (results) setOpening({ box: boxId, results, nonce: Date.now() });
      return;
    }
    if (busy) return;
    setBusy(true);
    const rows = await openBox(boxId, n === 10 ? 10 : 1);
    setBusy(false);
    if (!rows?.length) return;
    const results: BoxResult[] = rows.map((r) => ({
      rod: rodDefOf(r.item_id, cat?.rodById[r.item_id]),
      dup: false,
      gold: 0,
      duration: r.duration,
      status: 'new',
    }));
    setOpening({ box: boxId, results, nonce: Date.now() });
  };

  const pickRod = (id: string) => {
    sfx.click();
    if (!online) {
      act((g) => equipRod(g, id));
      pushAllDebounced();
      useGame.getState().toast(`Đang trang bị ${rodDefOf(id).name}!`, 'ok');
      return;
    }
    if (id === 'rod_bamboo') {
      act((g) => equipRod(g, id));
      pushAllDebounced();
      return;
    }
    const s = slotOf(id, 'rod');
    if (s) void equip(s.slot).then((ok) => {
      if (ok) {
        pushAllDebounced();
        useGame.getState().toast(`Đang dùng ${rodDefOf(id).name}`);
      }
    });
  };

  // Mua gói mồi số lượng lớn (×50 hoặc ×100) với chiết khấu ưu đãi
  const handleBuyBaitBulk = (b: typeof BAIT_SHOP[0], packs = 5) => {
    act((g) => {
      const discountMult = packs === 10 ? 8.8 : 4.75; // ×100 giảm 12%, ×50 giảm 5%
      const totalQty = b.qty * packs;
      if (b.gems) {
        const costGems = Math.max(1, Math.round(b.gems * (packs === 10 ? 9 : 4.8)));
        if (g.gems < costGems) return useGame.getState().toast(`Không đủ ${costGems} kim cương!`, 'err');
        spendGems(g, costGems);
      } else {
        const costGold = Math.round(b.price * discountMult);
        if (g.gold < costGold) return useGame.getState().toast(`Không đủ ${fmt(costGold)} vàng!`, 'err');
        spendGold(g, costGold);
      }
      addItem(g, b.id, totalQty);
      sfx.buy();
      useGame.getState().toast(`Đã mua sỉ +${totalQty} ${ITEMS[b.id]?.name ?? b.name}!`, 'ok');
    });
    pushAllDebounced();
  };

  // Tính số lượng cá đã khám phá
  const bestMap = g.fishing?.best ?? {};
  const discoveredCount = ALL_FISH_SPECIES.filter(
    (f) => (bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id)
  ).length;

  // Thống kê bộ sưu tập theo mùa & vùng
  const springCaught = ALL_FISH_SPECIES.filter((f) => f.season === 'spring' && ((bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id))).length;
  const summerCaught = ALL_FISH_SPECIES.filter((f) => f.season === 'summer' && ((bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id))).length;
  const autumnCaught = ALL_FISH_SPECIES.filter((f) => f.season === 'autumn' && ((bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id))).length;
  const winterCaught = ALL_FISH_SPECIES.filter((f) => f.season === 'winter' && ((bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id))).length;
  const zonesCaught = ALL_FISH_SPECIES.filter((f) => !f.season && ((bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id))).length;

  // Lọc danh sách cho tab Bộ Sưu Tập Cá
  const filteredCollection = ALL_FISH_SPECIES.filter((f) => {
    const isCaught = (bestMap[f.id] ?? 0) > 0 || (g.fishing?.fishBag ?? []).some((b) => b.id === f.id);
    if (colFilter === 'caught') return isCaught;
    if (colFilter === 'uncaught') return !isCaught;
    if (colFilter === 'spring') return f.season === 'spring';
    if (colFilter === 'summer') return f.season === 'summer';
    if (colFilter === 'autumn') return f.season === 'autumn';
    if (colFilter === 'winter') return f.season === 'winter';
    if (colFilter === 'zones') return !f.season;
    if (colFilter === 'mythic') return f.isSuperRare || f.rarity === 'mythic';
    return true;
  });

  // Lọc 20 cần câu
  const filteredRods = rodList.filter((r) => {
    if (rodFilter === 'all') return true;
    return r.rarity === rodFilter;
  });

  // Lọc cá theo mùa / vùng
  const filteredFish = ALL_FISH_SPECIES.filter((f) => {
    if (seasonFilter === 'all') return true;
    if (seasonFilter === 'mythic') return f.isSuperRare || f.rarity === 'mythic';
    if (seasonFilter === 'zones') return !f.season;
    return f.season === seasonFilter;
  });

  // Cần câu vĩnh viễn đã sở hữu
  const permRodsList = rodList.filter((r) => owned.has(r.id) && isPermanent(g, r.id));

  return (
    <div className="fshop" style={{ width: '100%' }}>
      {/* ---------------- Biển hiệu Tiệm Câu Cá Ông Năm ---------------- */}
      <header className="fshop-sign">
        <div className="fshop-npc">
          <AvatarView look={NPC_LOOKS.npc_fisher} scale={3} />
        </div>
        <div className="fshop-title">
          <small>Khu Câu Cá · Thị Trấn Khởi Nguyên</small>
          <h2>Tiệm Câu Cá Ông Năm</h2>
          <p>"Sắm cần xịn, mồi ngon rồi ra hồ câu cá to và tranh tài nhé!"</p>
          <div className="fshop-badges">
            <span>🎣 Dụng cụ & mồi câu</span>
            <span>🏆 Tranh tài bảng xếp hạng</span>
          </div>
        </div>
        <div className="fshop-side">
          <div className="fshop-wallet">
            <span>🪙 {fmt(g.gold)}</span>
            <span>💎 {fmt(g.gems)}</span>
          </div>
          <div className="fshop-stats">
            <span>
              🐟 <b>{fmt(g.stats.fish)}</b> cá đã câu
            </span>
            <span>
              🎣 <b>{owned.size}/{rodList.length}</b> cần sở hữu
            </span>
            <span>
              👑 <b>{permRodsList.length}/{rodList.length}</b> cần vĩnh viễn
            </span>
            {big && (
              <span>
                🏅 {FISH_BY_ID[big.id]?.emoji} <b>{big.cm} cm</b>
              </span>
            )}
          </div>
          <button className="btn sm ghost" onClick={() => bus.emit('panel', 'fishrank')}>
            🏆 Bảng Top Câu Cá
          </button>
          {online && (
            <button className="btn sm ghost" onClick={openChest}>
              🧰 Rương đồ {used}/{CHEST_SIZE}
            </button>
          )}
        </div>
      </header>

      {/* ---------------- Thanh 6 Tabs Chức Năng ---------------- */}
      <nav className="fshop-tabs-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`fshop-tab-btn ${tab === t.id ? 'on' : ''}`}
            onClick={() => {
              sfx.click();
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ---------------- Nội dung từng Tab ---------------- */}
      <div className="fshop-tab-content" style={{ minWidth: 0, width: '100%' }}>
        {/* ==================== TAB 1: TẤT CẢ 20 CẦN CÂU ==================== */}
        {tab === 'all_rods' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `Tất cả (${rodList.length})` },
                  { id: 'N', label: '🎋 Thường' },
                  { id: 'R', label: '🎣 Hiếm' },
                  { id: 'SR', label: '💎 Siêu Hiếm' },
                  { id: 'SSR', label: '🏆 Cực Hiếm' },
                  { id: 'UR', label: '🐉 Huyền Thoại' },
                  { id: 'MYTHIC', label: '👑 Thần Thoại' },
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`btn sm ${rodFilter === f.id ? 'gold' : 'ghost'}`}
                    onClick={() => setRodFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="small muted">Hiển thị {filteredRods.length} / {rodList.length} cần câu mạo hiểm</span>
            </div>

            <div className="rod-grid-20">
              {filteredRods.map((r) => {
                const isEquipped = g.fishingGear.rod === r.id;
                const isOwned = owned.has(r.id);
                const isPerm = isOwned && isPermanent(g, r.id);
                const expiry = isOwned ? expiryBadgeText(g, r.id) : undefined;
                return (
                  <div
                    key={r.id}
                    className={`rod-card-item rarity-${r.rarity} ${isEquipped ? 'equipped' : ''}`}
                  >
                    <div className="rod-header-row">
                      <span className="rod-rarity-badge" style={{ background: RARITY_COLOR[r.rarity] }}>
                        {RARITY_NAME[r.rarity]} · {'★'.repeat(RARITY_STARS[r.rarity] ?? 1)}
                      </span>
                      {isPerm ? (
                        <span className="dur-pill perm">👑 Vĩnh Viễn</span>
                      ) : isOwned && expiry ? (
                        <span className="dur-pill d7">{expiry}</span>
                      ) : null}
                    </div>

                    <div className={`rod-icon-box rarity-${r.rarity}`}>
                      <RodVisual rodId={r.id} rarity={r.rarity} width={152} height={82} animated={true} />
                    </div>

                    <h4 className="rod-title-name">{r.name}</h4>

                    {ROD_SHAPE_INFO[r.id] && (
                      <div className="rod-shape-badge">
                        <span className="rod-shape-emoji">{ROD_SHAPE_INFO[r.id].icon}</span>
                        <span className="rod-shape-text">{ROD_SHAPE_INFO[r.id].title}</span>
                      </div>
                    )}

                    <div className="rod-stats-box">
                      <span>🌟 Thu hút: <b>{getRareTier(r.rare)}</b></span>
                      <span>📏 Cỡ cá: <b>{getSizeTier(r.size)}</b></span>
                      <span>⚡ Tốc độ: <b>{getBiteTier(r.bite)}</b></span>
                      <span>🛡️ Dây câu: <b>{getMissTier(r.miss)}</b></span>
                    </div>

                    <p className="rod-desc-text">"{r.desc}"</p>

                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      {isEquipped ? (
                        <span className="rcard-using" style={{ display: 'block', textAlign: 'center', padding: '6px 0', background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', borderRadius: 8, fontWeight: 800 }}>
                          ✔ Đang Sử Dụng
                        </span>
                      ) : isOwned ? (
                        <button className="btn sm gold block" onClick={() => pickRod(r.id)}>
                          Trang Bị Cần Này
                        </button>
                      ) : (
                        <button className="btn sm ghost block" onClick={() => setTab('box')} title="Mở rương cần câu để sở hữu">
                          🔒 Mở Rương Săn Cần
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: BÁCH KHOA TOÀN THƯ CÁ (HIỆN RÕ RÀNG 122 LOÀI) ==================== */}
        {tab === 'fish_pedia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `Toàn Bộ ${ALL_FISH_SPECIES.length} Loài` },
                  { id: 'zones', label: '🌊 Cá 6 Vùng Hồ (66)' },
                  { id: 'spring', label: '🌸 Mùa Xuân (14)' },
                  { id: 'summer', label: '🔥 Mùa Hạ (14)' },
                  { id: 'autumn', label: '🍁 Mùa Thu (14)' },
                  { id: 'winter', label: '❄️ Mùa Đông (14)' },
                  { id: 'mythic', label: '🐲 Cá Thần Thoại' },
                ].map((s) => (
                  <button
                    key={s.id}
                    className={`btn sm ${seasonFilter === s.id ? 'gold' : 'ghost'}`}
                    onClick={() => setSeasonFilter(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="small">
                  Đang hiển thị: <b style={{ color: '#fbbf24' }}>{filteredFish.length}/{ALL_FISH_SPECIES.length}</b> loài cá minh họa đầy đủ
                </span>
              </div>
            </div>

            <div className="fish-pedia-grid">
              {filteredFish.map((f: FishSpeciesDef) => {
                const best = bestMap[f.id] ?? 0;
                const inBagCount = (g.fishing?.fishBag ?? []).filter((b) => b.id === f.id).length;
                const caught = best > 0 || inBagCount > 0;
                const rarityColor = FISH_RARITY_COLOR[f.rarity] ?? '#9ca3af';

                return (
                  <div
                    key={f.id}
                    className={`fish-pedia-card ${f.isSuperRare ? 'mythic' : ''}`}
                    style={{
                      border: f.isSuperRare
                        ? '2px solid #fbbf24'
                        : f.rarity === 'legendary'
                        ? '1.5px solid #f59e0b'
                        : f.rarity === 'epic'
                        ? '1.5px solid #a855f7'
                        : '1.5px solid #5a3a1e',
                    }}
                  >
                    {/* Tranh vẽ minh họa mỹ thuật cá CHÂN THẬT ĐẦY ĐỦ - KHÔNG CÒN ẨN ? */}
                    <div className={`fish-card-art-box ${f.isSuperRare ? 'mythic' : f.rarity}`} style={{ height: 75 }}>
                      <FishVisual fish={f} width={120} height={66} animated={true} uncaught={false} />
                    </div>

                    <div className="fish-pedia-head">
                      <span className="fish-pedia-emoji">{f.emoji}</span>
                      <div className="fish-pedia-info" style={{ flex: 1 }}>
                        <b>{f.name}</b>
                        <span style={{ fontSize: 11, fontWeight: 800, color: rarityColor }}>
                          {FISH_RARITY_NAME[f.rarity] ?? f.rarity} {f.isSuperRare && '· Siêu Cực Hiếm'}
                        </span>
                      </div>
                      {caught ? (
                        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 800, background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: 99 }}>
                          ✓ Đã bắt
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 99 }}>
                          Chưa câu
                        </span>
                      )}
                    </div>

                    <div className="fish-pedia-details">
                      <span>
                        <span>🏆 Kỷ lục cá nhân:</span>
                        <b style={{ color: caught && best > 0 ? '#fbbf24' : '#9ca3af' }}>{caught && best > 0 ? `${best} cm (${fishKg(best)} kg)` : 'Chưa câu được'}</b>
                      </span>
                      <span>
                        <span>📏 Kích thước loài:</span>
                        <span>{f.cm[0]} - {f.cm[1]} cm</span>
                      </span>
                      <span>
                        <span>🪙 Giá thu mua:</span>
                        <span>{fmt(f.basePrice)} vàng {f.gemPrice ? `· 💎 ${f.gemPrice} KC` : ''}</span>
                      </span>
                      <span>
                        <span>📍 Vùng sinh sống:</span>
                        <span>{f.zoneId > 0 ? `Vùng ${f.zoneId} (${FISHING_ZONES[f.zoneId - 1]?.name ?? ''})` : 'Mọi vùng nước'}</span>
                      </span>
                      <span>
                        <span>⏰ Mùa & Điều kiện:</span>
                        <span>
                          {f.season ? `Mùa ${f.season === 'spring' ? 'Xuân 🌸' : f.season === 'summer' ? 'Hạ ☀️' : f.season === 'autumn' ? 'Thu 🍁' : 'Đông ❄️'}` : 'Quanh năm'}
                          {f.nightOnly ? ' · Đêm 🌙' : ''}
                          {f.rainOnly ? ' · Mưa 🌧️' : ''}
                        </span>
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4 }}>
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: BỘ SƯU TẬP CÁ (TIẾN ĐỘ THU THẬP & SỔ TAY ĐÃ BẮT) ==================== */}
        {tab === 'fish_collection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header Tiến độ Sưu tập */}
            <div style={{ background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45), rgba(88, 28, 135, 0.45))', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fef08a', fontSize: '1.15rem' }}>
                    📖 BỘ SƯU TẬP & TIẾN ĐỘ THU THẬP
                  </h3>
                  <small style={{ color: '#93c5fd' }}>
                    Thu thập đầy đủ 122 loài cá trong thế giới để trở thành Huyền Thoại Ngư Vương!
                  </small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ color: '#4ade80', fontSize: '1.25rem' }}>
                    {discoveredCount} / {ALL_FISH_SPECIES.length} loài
                  </b>
                  <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                    Đã hoàn thành {Math.round((discoveredCount / ALL_FISH_SPECIES.length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Thanh tiến trình phần trăm */}
              <div style={{ height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                <div
                  style={{
                    width: `${(discoveredCount / ALL_FISH_SPECIES.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #f59e0b, #ec4899)',
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              {/* Tỉ lệ hoàn thành theo 4 Mùa & Vùng */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="chip static" style={{ background: 'rgba(236, 72, 153, 0.25)', borderColor: '#ec4899' }}>
                  🌸 Xuân: <b>{springCaught}/14</b>
                </span>
                <span className="chip static" style={{ background: 'rgba(245, 158, 11, 0.25)', borderColor: '#f59e0b' }}>
                  ☀️ Hạ: <b>{summerCaught}/14</b>
                </span>
                <span className="chip static" style={{ background: 'rgba(234, 88, 12, 0.25)', borderColor: '#ea580c' }}>
                  🍁 Thu: <b>{autumnCaught}/14</b>
                </span>
                <span className="chip static" style={{ background: 'rgba(56, 189, 248, 0.25)', borderColor: '#38bdf8' }}>
                  ❄️ Đông: <b>{winterCaught}/14</b>
                </span>
                <span className="chip static" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981' }}>
                  🌊 6 Vùng Hồ: <b>{zonesCaught}/66</b>
                </span>
              </div>
            </div>

            {/* Bộ lọc Bộ Sưu Tập */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8 }}>
              {[
                { id: 'all', label: `Tất Cả (${ALL_FISH_SPECIES.length})` },
                { id: 'caught', label: `✓ Đã Bắt (${discoveredCount})` },
                { id: 'uncaught', label: `🔒 Chưa Bắt (${ALL_FISH_SPECIES.length - discoveredCount})` },
                { id: 'spring', label: '🌸 Mùa Xuân' },
                { id: 'summer', label: '☀️ Mùa Hạ' },
                { id: 'autumn', label: '🍁 Mùa Thu' },
                { id: 'winter', label: '❄️ Mùa Đông' },
                { id: 'zones', label: '🌊 6 Vùng Hồ' },
                { id: 'mythic', label: '🐲 Cá Thần Thoại' },
              ].map((s) => (
                <button
                  key={s.id}
                  className={`btn sm ${colFilter === s.id ? 'gold' : 'ghost'}`}
                  onClick={() => setColFilter(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Lưới các thẻ cá trong Bộ Sưu Tập */}
            <div className="fish-pedia-grid">
              {filteredCollection.map((f: FishSpeciesDef) => {
                const best = bestMap[f.id] ?? 0;
                const inBagCount = (g.fishing?.fishBag ?? []).filter((b) => b.id === f.id).length;
                const isCaught = best > 0 || inBagCount > 0;
                const rarityColor = FISH_RARITY_COLOR[f.rarity] ?? '#9ca3af';

                return (
                  <div
                    key={f.id}
                    className={`fish-pedia-card ${isCaught ? '' : 'uncaught'} ${f.isSuperRare ? 'mythic' : ''}`}
                    style={{
                      border: isCaught
                        ? f.isSuperRare
                          ? '2px solid #fbbf24'
                          : f.rarity === 'legendary'
                          ? '1.5px solid #f59e0b'
                          : f.rarity === 'epic'
                          ? '1.5px solid #a855f7'
                          : '1px solid rgba(255,255,255,0.15)'
                        : '1px dashed rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Hình ảnh cá: Đã bắt thì hiện ảnh đầy đủ chuyển động, chưa bắt thì hiện bóng bí ẩn */}
                    <div className={`fish-card-art-box ${isCaught ? (f.isSuperRare ? 'mythic' : f.rarity) : ''}`} style={{ height: 68 }}>
                      <FishVisual fish={f} width={110} height={60} animated={isCaught} uncaught={!isCaught} />
                    </div>

                    <div className="fish-pedia-head">
                      <span className="fish-pedia-emoji">{isCaught ? f.emoji : '❓'}</span>
                      <div className="fish-pedia-info" style={{ flex: 1 }}>
                        <b>{isCaught ? f.name : '??? (Chưa Sưu Tập)'}</b>
                        <span style={{ fontSize: 11, fontWeight: 800, color: rarityColor }}>
                          {FISH_RARITY_NAME[f.rarity] ?? f.rarity} {f.isSuperRare && '· Siêu Cực Hiếm'}
                        </span>
                      </div>
                      {isCaught ? (
                        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 800, background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: 99 }}>
                          ✓ Đã có
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(0, 0, 0, 0.4)', padding: '2px 8px', borderRadius: 99 }}>
                          🔒 Chưa có
                        </span>
                      )}
                    </div>

                    <div className="fish-pedia-details">
                      <span>
                        <span>🏆 Kỷ lục cá nhân:</span>
                        <b style={{ color: isCaught && best > 0 ? '#fbbf24' : '#9ca3af' }}>{isCaught && best > 0 ? `${best} cm (${fishKg(best)} kg)` : 'Chưa câu được'}</b>
                      </span>
                      <span>
                        <span>🎒 Trong túi / rương:</span>
                        <b style={{ color: inBagCount > 0 ? '#4ade80' : '#9ca3af' }}>{inBagCount} con</b>
                      </span>
                      <span>
                        <span>📏 Kích thước loài:</span>
                        <span>{f.cm[0]} - {f.cm[1]} cm</span>
                      </span>
                      <span>
                        <span>📍 Vùng sinh sống:</span>
                        <span>{f.zoneId > 0 ? `Vùng ${f.zoneId} (${FISHING_ZONES[f.zoneId - 1]?.name ?? ''})` : 'Mọi vùng nước'}</span>
                      </span>
                      <span>
                        <span>⏰ Mùa xuất hiện:</span>
                        <span>
                          {f.season ? `Mùa ${f.season === 'spring' ? 'Xuân 🌸' : f.season === 'summer' ? 'Hạ ☀️' : f.season === 'autumn' ? 'Thu 🍁' : 'Đông ❄️'}` : 'Quanh năm'}
                          {f.nightOnly ? ' · Đêm 🌙' : ''}
                          {f.rainOnly ? ' · Mưa 🌧️' : ''}
                        </span>
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: 11.5, color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.35 }}>
                      {isCaught
                        ? f.desc
                        : `Gợi ý: Tìm câu ở Vùng ${f.zoneId > 0 ? f.zoneId : 'hồ'} vào ${f.season ? `Mùa ${f.season === 'spring' ? 'Xuân' : f.season === 'summer' ? 'Hạ' : f.season === 'autumn' ? 'Thu' : 'Đông'}` : 'quanh năm'}.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: MỒI CÂU & VIP ==================== */}
        {tab === 'bait' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="bait-card-grid">
              {BAIT_SHOP.map((b) => {
                const count = itemCount(g, b.id);
                const def = BAITS.find((x) => x.id === b.id) ?? BAITS[0];
                const rar = def.rarity ?? 'N';
                const rarCol = RARITY_COLOR[rar];
                const isVip = rar === 'SSR' || rar === 'UR';
                const isMythic = rar === 'MYTHIC';
                const cost50Gold = Math.round(b.price * 4.75);
                const cost100Gold = Math.round(b.price * 8.8);
                const cost50Gems = b.gems ? Math.max(1, Math.round(b.gems * 4.8)) : 0;
                const cost100Gems = b.gems ? Math.max(1, Math.round(b.gems * 9)) : 0;

                return (
                  <div
                    key={b.id}
                    className={`bait-card-box rarity-${rar} ${isMythic ? 'mythic' : isVip ? 'vip' : ''}`}
                  >
                    <div className="rod-header-row" style={{ marginBottom: 4 }}>
                      <span className="rod-rarity-badge" style={{ background: rarCol }}>
                        {RARITY_NAME[rar]} · {'★'.repeat(RARITY_STARS[rar] ?? 1)}
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: count > 0 ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.08)',
                          color: count > 0 ? '#4ade80' : '#94a3b8',
                          border: count > 0 ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid transparent',
                        }}
                      >
                        🎒 Sẵn có: {count}
                      </span>
                    </div>

                    <div className="bait-card-head">
                      <div className={`bait-visual-frame rarity-${rar}`}>
                        <BaitVisual baitId={b.id} size={52} />
                      </div>
                      <div className="bait-card-info">
                        <b style={{ fontSize: 15, color: '#fff3c4' }}>{b.name}</b>
                        <div className="bait-target-pill">
                          🎯 {def.target}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4, minHeight: 32 }}>
                      "{def.desc}"
                    </p>

                    <div className="bait-buy-btns" style={{ marginTop: 'auto' }}>
                      <button
                        className={`btn sm ${b.gems ? 'purple' : 'gold'}`}
                        disabled={b.gems ? g.gems < b.gems : g.gold < b.price}
                        onClick={() => {
                          act((g) => {
                            buyBait(g, b.id);
                            sfx.buy();
                            useGame.getState().toast(`Đã mua +10 ${b.name}!`, 'ok');
                          });
                          pushAllDebounced();
                        }}
                      >
                        Lẻ ×10 ({b.gems ? `💎${b.gems}` : `🪙${fmt(b.price)}`})
                      </button>
                      <button
                        className={`btn sm ${b.gems ? 'purple' : 'gold'}`}
                        disabled={b.gems ? g.gems < cost50Gems : g.gold < cost50Gold}
                        onClick={() => handleBuyBaitBulk(b, 5)}
                        title="Mua sỉ 50 mồi tiết kiệm 5%"
                      >
                        Sỉ ×50 ({b.gems ? `💎${cost50Gems}` : `🪙${fmt(cost50Gold)}`})
                      </button>
                      <button
                        className={`btn sm ${b.gems ? 'purple' : ' outline'}`}
                        style={!b.gems ? { borderColor: '#fbbf24', color: '#fef08a' } : {}}
                        disabled={b.gems ? g.gems < cost100Gems : g.gold < cost100Gold}
                        onClick={() => handleBuyBaitBulk(b, 10)}
                        title="Mua thùng 100 mồi tiết kiệm 12%"
                      >
                        Thùng ×100 ({b.gems ? `💎${cost100Gems}` : `🪙${fmt(cost100Gold)}`})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hộp Mồi May Mắn */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85), rgba(88, 28, 135, 0.45))', padding: '14px 18px', borderRadius: 12, border: '2px dashed #f59e0b' }}>
              <div>
                <b style={{ color: '#ffe680', fontSize: 15 }}>🎁 Tráp Mồi Bách Bảo Ngẫu Nhiên</b>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#cbd5e1' }}>
                  Mở ngẫu nhiên <b>{BAIT_BOX.min}–{BAIT_BOX.max} viên mồi</b> đủ 10 cấp độ — Cơ hội trúng <b>Mồi Kim Thiền Hoàng Kim</b>, <b>Huyết Tinh Hải Vương</b> và <b>Long Châu Thần Thoại</b>!
                </p>
              </div>
              <button
                className="btn gold"
                disabled={g.gold < BAIT_BOX.price}
                onClick={() => {
                  act((g) => {
                    const msg = buyBaitBox(g);
                    sfx.buy();
                    useGame.getState().toast(msg, 'ok');
                  });
                  pushAllDebounced();
                }}
              >
                🎁 Mở Tráp Mồi (🪙{BAIT_BOX.price})
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: MỞ RƯƠNG CẦN CÂU ==================== */}
        {tab === 'box' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="chest-top-banner">
              🎁 <b>Rương May Mắn:</b> Khai mở ngẫu nhiên các loại Cần Câu quý hiếm và cơ hội đặc biệt sở hữu Cần Vĩnh Viễn!
            </div>

            <div className="chest-grid">
              {ROD_BOXES.map((b) => {
                const unit = b.gems ?? b.price;
                const have = b.gems ? g.gems : g.gold;
                const cur = b.gems ? '💎' : '🪙';

                return (
                  <div key={b.id} className={`chest-card ${b.id}`}>
                    {b.gems && <span className="vip-tag">VIP</span>}
                    <div className="chest-glow" />
                    <img className="chest-img" src={chestURL(b.id)} alt="" />
                    <b className="chest-title">{b.name}</b>
                    <p className="chest-desc">{b.desc}</p>

                    <div className="chest-badge-perm">
                      ✨ Cơ hội mở trúng Cần Vĩnh Viễn
                    </div>

                    <div className="chest-btns" style={{ marginTop: 'auto' }}>
                      {[1, 10].map((n) => (
                        <button
                          key={n}
                          className={`btn sm ${b.gems ? 'purple' : 'gold'}`}
                          disabled={busy || have < unit * n}
                          onClick={() => open(b.id, n)}
                        >
                          <span>{n === 1 ? 'Mở ×1' : 'Mở ×10'}</span>
                          <b>
                            {cur}
                            {fmt(unit * n)}
                          </b>
                        </button>
                      ))}
                    </div>

                    {have < unit && (
                      <small className="chest-short">
                        Còn thiếu {cur}
                        {fmt(unit - have)}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="fshop-note">
              <b>♻️ Trùng cần câu Vĩnh Viễn → Hoàn trả vàng tương ứng:</b>
              {(Object.entries(ROD_DUP_GOLD) as [RodRarity, number][]).map(([r, v]) => (
                <span key={r} style={{ color: RARITY_COLOR[r] }}>
                  {r} 🪙{fmt(v)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: BỘ SƯU TẬP CẦN VĨNH VIỄN ==================== */}
        {tab === 'perm_rods' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(180, 83, 9, 0.2))', border: '2px solid #fbbf24', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <b style={{ color: '#fff3c4', fontSize: 16 }}>
                  🏆 Bảng Danh Dự Cần Câu Vĩnh Viễn ({permRodsList.length}/{rodList.length})
                </b>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#fde68a' }}>
                  Chỉ những cần câu bạn sở hữu <b>VĨNH VIỄN</b> mới được khắc tên tại đây. Cần câu có hạn dùng (1/3/7 ngày) sẽ không tính.
                </p>
              </div>
              <button className="btn sm gold" onClick={() => setTab('box')}>
                🎁 Mở Rương Săn Cần Vĩnh Viễn
              </button>
            </div>

            <div className="perm-pedestal-grid">
              {rodList.map((r) => {
                const isPerm = owned.has(r.id) && isPermanent(g, r.id);
                const isEquipped = g.fishingGear.rod === r.id;

                return (
                  <div
                    key={r.id}
                    className={`perm-pedestal ${isPerm ? 'unlocked' : 'locked'}`}
                  >
                    <span className="perm-tag" style={isPerm ? {} : { background: '#475569', color: '#94a3b8' }}>
                      {isPerm ? '👑 VĨNH VIỄN' : '🔒 CHƯA SỞ HỮU'}
                    </span>

                    <div className={`rod-icon-box rarity-${r.rarity}`} style={{ width: '100%', height: 74, margin: '4px 0', filter: isPerm ? 'none' : 'brightness(0.22) grayscale(0.8)' }}>
                      <RodVisual rodId={r.id} rarity={r.rarity} width={132} height={68} animated={isPerm} />
                    </div>

                    <b style={{ color: isPerm ? '#fff3c4' : '#94a3b8', fontSize: 13.5, textAlign: 'center' }}>
                      {r.name}
                    </b>

                    <span style={{ fontSize: 11, fontWeight: 800, color: RARITY_COLOR[r.rarity] }}>
                      {RARITY_NAME[r.rarity]} · {'★'.repeat(RARITY_STARS[r.rarity] ?? 1)}
                    </span>

                    <div style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 2, width: '100%', background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: 6 }}>
                      <span>Thu hút: <b>{getRareTier(r.rare)}</b></span>
                      <span>Cỡ cá: <b>{getSizeTier(r.size)}</b></span>
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%' }}>
                      {isPerm ? (
                        isEquipped ? (
                          <span className="rcard-using" style={{ display: 'block', padding: '4px 0', fontSize: 12 }}>✔ Đang Dùng</span>
                        ) : (
                          <button className="btn sm gold block" onClick={() => pickRod(r.id)}>
                            Trang Bị Ngay
                          </button>
                        )
                      ) : (
                        <small style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                          Mở rương để săn
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: KHO CÁ & BÁN CÁ ==================== */}
        {tab === 'fish_bag' && (
          <div style={{ width: '100%' }}>
            <FishBagView />
          </div>
        )}
      </div>

      {/* ---------------- Hoạt cảnh mở rương quà may mắn ---------------- */}
      {opening && (
        <BoxOpening
          key={opening.nonce}
          box={opening.box}
          results={opening.results}
          onClose={() => setOpening(null)}
          onAgain={(n) => open(opening.box, n)}
        />
      )}
    </div>
  );
}

type Stage = 'shake' | 'burst' | 'reveal';

/** Hoạt cảnh mở rương: rung mạnh dần → bật nắp + cột sáng màu độ hiếm → lật thẻ */
function BoxOpening({
  box,
  results,
  onClose,
  onAgain,
}: {
  box: string;
  results: BoxResult[];
  onClose: () => void;
  onAgain: (n: number) => void;
}) {
  const [stage, setStage] = useState<Stage>('shake');
  const best = useMemo(
    () => results.reduce((a, b) => (RANK(b.rod.rarity) > RANK(a.rod.rarity) ? b : a)),
    [results]
  );
  const color = RARITY_COLOR[best.rod.rarity];
  const epic = RANK(best.rod.rarity) >= 4;

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setStage('burst');
      sfx.slam();
    }, 1300);
    const t2 = window.setTimeout(() => {
      setStage('reveal');
      sfx.levelUp();
    }, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => stage !== 'reveal' && setStage('reveal');
  const style = { '--rc': color } as CSSProperties;

  return (
    <div className={`gacha ${stage} ${epic ? 'epic' : ''}`} style={style} onClick={skip}>
      <div className="gacha-rays" />
      {stage !== 'reveal' && (
        <div className="gacha-chest">
          <div className="gacha-aura" />
          <img src={chestURL(box, stage === 'burst')} alt="" />
          {stage === 'shake' && <p>Chạm để bỏ qua</p>}
        </div>
      )}
      {stage === 'burst' && <div className="gacha-flash" />}
      {stage === 'reveal' && (
        <div className="gacha-result" onClick={(e) => e.stopPropagation()}>
          {epic && <div className="gacha-banner">✨ {RARITY_NAME[best.rod.rarity]?.toUpperCase()}! ✨</div>}
          {results.length === 1 ? (
            <div className="gacha-single">
              <div className="flip-in">
                <RodCard rod={best.rod} owned duration={best.duration} status={best.status} />
              </div>
              <p className={best.dup ? 'muted' : 'next'}>
                {best.dup
                  ? `Đã sở hữu Vĩnh Viễn — đổi thành 🪙${fmt(best.gold)}`
                  : `✨ ${durationLabel(best.duration, best.status)} · ${best.rod.desc}`}
              </p>
            </div>
          ) : (
            <div className="gacha-grid">
              {results.map((r, i) => (
                <div key={i} className="flip-in" style={{ animationDelay: `${i * 110}ms` }}>
                  <RodCard rod={r.rod} owned small duration={r.duration} status={r.status} />
                  <small className={r.dup ? 'muted' : 'next'}>
                    {r.dup ? `+🪙${fmt(r.gold)}` : durationLabel(r.duration, r.status)}
                  </small>
                </div>
              ))}
            </div>
          )}
          <div className="dialog-actions center">
            <button className="btn gold" onClick={() => onAgain(1)}>
              Mở tiếp ×1
            </button>
            <button className="btn gold" onClick={() => onAgain(10)}>
              Mở ×10
            </button>
            <button className="btn ghost" onClick={onClose}>
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
