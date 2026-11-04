import { Quote } from './common';
import { useEffect, useState } from 'react';
import { NPC_LOOKS } from '../art/avatar';
import { heroLook } from '../art/heroLook';
import { chestURL, equipIconURL, weaponIconURL } from '../art/rodArt';
import { BOSS_GEAR } from '../game/config/bossGear';
import { BUFF_INFO } from '../game/config/buffs';
import { MONSTERS } from '../game/config/combat';
import { ALCHEMY_RECIPES, EQUIPMENT, EQUIP_BY_ID, POTION_BY_ID, SHOP_POTIONS, WEAPON_BOXES, isRareWeapon, type PotionCategory, type PotionDef } from '../game/config/equipment';
import { CROPS, FARM_SUPPLIES, ITEMS, RANCH_SUPPLIES } from '../game/config/farm';
import { RANKS, rankIndex } from '../game/config/guild';
import { RARITY_COLOR, type RodRarity } from '../game/config/shops';
import { activeBuffs } from '../game/logic/buffs';
import { itemCount } from '../game/logic/core';
import { buyFarmSupply } from '../game/logic/farm';
import { heldItem } from '../game/logic/hotbar';
import { energyNow, maxEnergy } from '../game/logic/mine';
import { brewPotion, buyEquipment, buyPotion, clinicTreat, eatFood, equipItem, openWeaponBox, playerStats, potionPrice, type WeaponPull } from '../game/logic/player';
import { buySeeds, durationLabel, expiryBadgeText, isPermanent, seedPrice, type DurationRoll, type DurationStatus } from '../game/logic/shop';
import type { EquipDef, EquipSlot } from '../game/types';
import { fmt, fmtTime, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAllDebounced } from '../services/online';
import { sfx } from '../world/sfx';
import { AvatarView } from './AvatarView';
import { OddsBar, RARITY_NAME, RARITY_STARS } from './FishingShopView';
import { HeroDoll } from './HeroDoll';

export function equipTier(lv: number): { label: string; cls: string } {
  if (lv >= 50) return { label: 'Thần Thoại', cls: 'tier-mythic' };
  if (lv >= 38) return { label: 'Huyền Thoại', cls: 'tier-legend' };
  if (lv >= 25) return { label: 'Sử Thi', cls: 'tier-epic' };
  if (lv >= 15) return { label: 'Kỵ Sĩ', cls: 'tier-rare' };
  if (lv >= 5) return { label: 'Tinh Anh', cls: 'tier-uncommon' };
  return { label: 'Tân Binh', cls: 'tier-common' };
}

export function statLine(e: EquipDef) {
  const s: string[] = [];
  if (e.atk) s.push(`⚔️ +${e.atk}`);
  if (e.def) s.push(`🛡️ +${e.def}`);
  if (e.hp) s.push(`❤️ +${e.hp}`);
  if (e.speed) s.push(`👟 +${pct(e.speed)}`);
  if (e.crit) s.push(`💥 +${pct(e.crit)}`);
  if (e.regen) s.push(`💚 +${e.regen}/s`);
  if (e.light) s.push(`🔦 +${e.light}`);
  if (e.cooldown) s.push(`⏱ ${(e.cooldown / 1000).toFixed(2)}s`);
  if (e.range) s.push(`📏 ${e.range}`);
  return s.join(' · ');
}

function Wallet() {
  const g = useGame((s) => s.game);
  return (
    <div className="wallet">
      <span>🪙 {fmt(g.gold)}</span>
      <span>💎 {fmt(g.gems)}</span>
    </div>
  );
}

/** nút mua: giá vàng hoặc kim cương */
function PriceBtn({ gold, gems, disabled, onClick, label }: { gold: number; gems?: number; disabled?: boolean; onClick: () => void; label?: string }) {
  const g = useGame((s) => s.game);
  const cant = gems ? g.gems < gems : g.gold < gold;
  return (
    <button className={`btn sm ${gems ? 'purple' : 'gold'}`} disabled={disabled || cant} onClick={onClick}>
      {label ?? (gems ? `💎${gems}` : `🪙${fmt(gold)}`)}
    </button>
  );
}

// ---------------------------------------------------------------- Điện Thần Binh · Tiệm Vũ Khí & Hộp Quà Random

const SHOP_WEAPONS = EQUIPMENT.filter((e) => e.slot === 'weapon');
const BOSS_WEAPONS = BOSS_GEAR.filter((e) => e.slot === 'weapon');
const BOSS_NAME_BY_ID = Object.fromEntries(
  Object.values(MONSTERS)
    .filter((m) => m.boss)
    .map((m) => [m.id, m.name]),
);

function weaponCombatScore(w: EquipDef): number {
  const atk = w.atk ?? 0;
  const cdFactor = 320 / (w.cooldown ?? 320);
  const critBonus = 1 + (w.crit ?? 0) * 1.5;
  const extra = (w.hp ?? 0) * 0.4 + (w.regen ?? 0) * 8 + (w.speed ?? 0) * 200;
  return Math.round(atk * cdFactor * critBonus + extra + (w.range ?? 13) * 1.5);
}

/** Thẻ vũ khí đẳng cấp dùng cho cả Kho Thần Binh và màn lật thẻ Gacha */
function WeaponCard({
  w,
  owned,
  equipped,
  trying,
  level,
  gold,
  isNew,
  dupGold,
  duration,
  status,
  expText,
  isPerm,
  small,
  onTry,
  onEquip,
  onBuy,
  onRandom,
}: {
  w: EquipDef;
  owned?: boolean;
  equipped?: boolean;
  trying?: boolean;
  level?: number;
  gold?: number;
  isNew?: boolean;
  dupGold?: number;
  duration?: DurationRoll;
  status?: DurationStatus;
  expText?: string;
  isPerm?: boolean;
  small?: boolean;
  onTry?: () => void;
  onEquip?: () => void;
  onBuy?: () => void;
  onRandom?: () => void;
}) {
  const rar: RodRarity = w.rarity ?? 'N';
  const rare = isRareWeapon(rar);
  const col = RARITY_COLOR[rar];
  const lockedLvl = level !== undefined && level < w.levelReq && !owned;
  const cps = w.cooldown ? (1000 / w.cooldown).toFixed(1) : '3.0';

  return (
    <div
      className={`rcard wcard r-${rar} ${equipped ? 'active' : ''} ${trying ? 'trying' : ''} ${owned === false ? 'locked' : ''} ${small ? 'small' : ''}`}
      style={{ ['--rc' as string]: col }}
      onClick={onTry}
    >
      <div className="rcard-top">
        <span className="rcard-rar">{rar}</span>
        <span className="rcard-stars">{'★'.repeat(RARITY_STARS[rar])}</span>
      </div>
      {isNew && <span className="rcard-badge new">✨ MỚI!</span>}
      {!isNew && dupGold ? <span className="rcard-badge dup">+🪙{fmt(dupGold)}</span> : null}
      {!isNew && !dupGold && status === 'upgraded_perm' && <span className="rcard-badge new">♾️ VĨNH VIỄN!</span>}
      {!isNew && !dupGold && status === 'extended' && <span className="rcard-badge ok">+⏳ GIA HẠN</span>}
      {!isNew && !dupGold && !status && w.boss && <span className="wcard-boss-tag">💀 BOSS</span>}
      <div className="rcard-art wcard-art">
        <img src={weaponIconURL(w.id, false)} alt={w.name} />
      </div>
      <b className="rcard-name">{w.name}</b>
      <small className="rcard-tier">
        {RARITY_NAME[rar]} · Lv {w.levelReq}
      </small>
      {duration && !dupGold && (
        <span className={`dur-pill ${duration === 'perm' ? 'perm' : duration === '7d' ? 'd7' : 'd3'}`}>
          {duration === 'perm' ? '♾️ VĨNH VIỄN' : durationLabel(duration, status)}
        </span>
      )}
      {!duration && owned && expText && (
        <span className={`dur-pill ${isPerm ? 'perm' : 'd7'}`}>{expText}</span>
      )}
      {!duration && !owned && !w.boss && (
        <span className={`dur-pill ${rare ? 'perm' : 'd3'}`}>
          {rar === 'UR' ? '🎲 0.01% · ♾️ Vĩnh viễn' : rare ? '🎲 Random · ♾️ Vĩnh viễn' : '⏳ Kiếm thường (Theo ngày)'}
        </span>
      )}
      <div className="wcard-stats">
        <span className="ws-atk">⚔️ +{w.atk ?? 0}</span>
        {w.crit ? <span className="ws-crit">💥 +{pct(w.crit)}</span> : <span>⚡ {cps} đòn/s</span>}
        <span>📏 Tầm {w.range ?? 13}</span>
      </div>
      {!small && <p className="rcard-desc">{w.desc}</p>}
      {(onEquip || onBuy || onTry || onRandom) && (
        <div className="cos-acts wcard-acts" onClick={(e) => e.stopPropagation()}>
          {onTry && (
            <button className={`btn sm ghost ${trying ? 'on' : ''}`} onClick={onTry} title="Cầm thử trên sân khấu">
              {trying ? '🙈' : '👁'}
            </button>
          )}
          {equipped ? (
            <span className="rcard-tag ok">✋ Đang cầm</span>
          ) : owned ? (
            onEquip && (
              <button className="btn sm" onClick={onEquip}>
                ✋ Cầm
              </button>
            )
          ) : null}
          {owned && !isPerm && !rare && !w.boss && w.price > 0 && onBuy && (
            <button
              className="btn sm gold"
              disabled={lockedLvl || (gold !== undefined && gold < w.price)}
              onClick={onBuy}
              title="Gia hạn thêm ngày sử dụng cho kiếm thường!"
            >
              ⏳ +Ngày · 🪙{fmt(w.price)}
            </button>
          )}
          {!owned &&
            (w.boss ? (
              <span className="cos-lock">👹 {BOSS_NAME_BY_ID[w.boss] ?? 'Boss Cấm Địa'}</span>
            ) : rare ? (
              <button
                className="btn sm purple"
                onClick={onRandom}
                title="Kiếm Hiếm không có kiếm ngày và không bán lẻ — bấm để Quay Random Hộp Quà!"
              >
                🎲 {rar === 'UR' ? 'Random 0.01%' : 'Quay Random'}
              </button>
            ) : (
              onBuy && (
                <button
                  className="btn sm gold"
                  disabled={lockedLvl || (gold !== undefined && gold < w.price)}
                  onClick={onBuy}
                  title={lockedLvl ? `Cần Lv ${w.levelReq} để nhận Kiếm Ngày — hoặc Quay Random Hộp Quà!` : 'Kiếm thường nhận theo ngày (3–7 Ngày)'}
                >
                  {lockedLvl ? `🔒 Lv ${w.levelReq}` : w.price === 0 ? 'Miễn phí' : `⏳ Kiếm Ngày · 🪙${fmt(w.price)}`}
                </button>
              )
            ))}
        </div>
      )}
    </div>
  );
}

/** Màn hình đập Hộp Quà Thần Binh: Rương rung lắc → Nổ hào quang → Lật thẻ Vũ Khí */
function WeaponGachaModal({ boxId, pulls, onClose }: { boxId: string; pulls: WeaponPull[]; onClose: () => void }) {
  const [phase, setPhase] = useState<'shake' | 'burst' | 'reveal'>('shake');
  const bestRar: RodRarity = pulls.reduce<RodRarity>((best, p) => {
    const order: RodRarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
    const r = p.weapon.rarity ?? 'N';
    return order.indexOf(r) > order.indexOf(best) ? r : best;
  }, 'N');
  const col = RARITY_COLOR[bestRar];
  const hasJackpot = bestRar === 'SSR' || bestRar === 'UR';

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('burst');
      sfx.crit();
    }, 1150);
    const t2 = setTimeout(() => {
      setPhase('reveal');
      if (hasJackpot) sfx.levelUp();
      else sfx.coin();
    }, 1650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hasJackpot]);

  const skip = () => {
    if (phase !== 'reveal') {
      setPhase('reveal');
      sfx.levelUp();
    }
  };

  return (
    <div className={`gacha-backdrop r-${bestRar}`} style={{ ['--rc' as string]: col }} onClick={phase === 'reveal' ? onClose : skip}>
      <div className={`gacha ${phase}`} onClick={(e) => e.stopPropagation()}>
        <div className="gacha-rays" />
        {phase !== 'reveal' ? (
          <div className="gacha-stage" onClick={skip}>
            <img className="gacha-chest" src={chestURL(boxId, phase === 'burst')} alt="" />
            <p>{phase === 'shake' ? '🔥 Đang giải phóng phong ấn Thần Binh… (bấm để mở nhanh)' : '⚡ BÙNG NỔ THẦN KHÍ!'}</p>
          </div>
        ) : (
          <div className="gacha-reveal">
            <h2>
              {bestRar === 'UR'
                ? '👑 KỲ TÍCH 0.01% · NỔ CHÍ TÔN THẦN KIẾM UR VĨNH VIỄN!'
                : bestRar === 'SSR'
                  ? '🔥 ĐẠI CÁT ĐẠI LỢI · NỔ THẦN KIẾM SSR VĨNH VIỄN!'
                  : pulls.length === 1
                    ? '⚔️ Khui Hộp Thần Binh Thành Công!'
                    : '⚔️ Kết Quả Khui 10 Hộp Thần Binh!'}
            </h2>
            <p className="wshop-gacha-sub">
              {pulls.some((p) => isRareWeapon(p.weapon.rarity) && !p.dupGold)
                ? '👑 NỔ KIẾM HIẾM (SR / SSR / UR) · NHẬN NGAY ♾️ VĨNH VIỄN TRỌN ĐỜI (KHÔNG CÓ HẠN NGÀY)!'
                : '⏳ Kiếm Thường (N / R) có hạn 3 Ngày / 7 Ngày — Quay trúng Kiếm Hiếm (SR / SSR / UR) nhận Vĩnh Viễn!'}
            </p>
            <div className={`gacha-cards ${pulls.length > 1 ? 'multi' : 'single'}`}>
              {pulls.map((p, i) => (
                <div key={i} className="gacha-slot" style={{ animationDelay: `${i * 0.07}s` }}>
                  <WeaponCard
                    w={p.weapon}
                    owned
                    isNew={p.isNew}
                    dupGold={p.dupGold}
                    duration={p.duration}
                    status={p.status}
                    small={pulls.length > 1}
                  />
                </div>
              ))}
            </div>
            <button className="btn wshop-claim-btn" onClick={onClose}>
              ⚔️ Thu Nhận Thần Binh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WeaponShop() {
  const g = useGame((s) => s.game);
  const apply = useGame((s) => s.apply);
  const act = useGame((s) => s.act);
  const st = playerStats(g);
  const currentHeld = heldItem(g);
  const currentWeapon = (currentHeld && EQUIP_BY_ID[currentHeld]?.slot === 'weapon' ? EQUIP_BY_ID[currentHeld] : null) ??
    (g.player.equip.weapon ? EQUIP_BY_ID[g.player.equip.weapon] : EQUIP_BY_ID.wood_sword);

  const [tryId, setTryId] = useState<string>(currentWeapon.id);
  const [tab, setTab] = useState<'armory' | 'boss'>('armory');
  const [rarFilter, setRarFilter] = useState<'ALL' | RodRarity>('ALL');
  const [gacha, setGacha] = useState<{ boxId: string; pulls: WeaponPull[] } | null>(null);

  const preview = EQUIP_BY_ID[tryId] ?? currentWeapon;
  const previewRar: RodRarity = preview.rarity ?? 'N';
  const previewRare = isRareWeapon(previewRar);
  const previewCol = RARITY_COLOR[previewRar];
  const isOwned = g.player.owned.includes(preview.id);
  const isEquipped = currentWeapon.id === preview.id;
  const atkDiff = (preview.atk ?? 0) - (currentWeapon.atk ?? 0);
  const score = weaponCombatScore(preview);
  const curScore = weaponCombatScore(currentWeapon);
  const scoreDiff = score - curScore;

  const ownedShopCount = SHOP_WEAPONS.filter((w) => g.player.owned.includes(w.id)).length;
  const ownedBossCount = BOSS_WEAPONS.filter((w) => g.player.owned.includes(w.id)).length;

  const pullBox = (boxId: string, n: 1 | 10) => {
    const res = apply((s) => openWeaponBox(s, boxId, n));
    if (res) {
      sfx.open();
      setGacha({ boxId, pulls: res });
      pushAllDebounced();
      // tự động chuyển sân thử sang thần binh xịn nhất vừa nổ
      const order: RodRarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
      const best = [...res].sort((a, b) => order.indexOf(b.weapon.rarity ?? 'N') - order.indexOf(a.weapon.rarity ?? 'N'))[0];
      if (best) setTryId(best.weapon.id);
    }
  };

  const filteredWeapons = (tab === 'armory' ? SHOP_WEAPONS : BOSS_WEAPONS).filter(
    (w) => rarFilter === 'ALL' || (w.rarity ?? 'N') === rarFilter,
  );

  return (
    <div className="fshop gshop gs-weapons">
      {/* ---------------- Bảng hiệu Điện Thần Binh */}
      <div className="gshop-sign wshop-sign">
        <div className="fshop-keeper">
          <AvatarView look={NPC_LOOKS.npc_armorer} scale={3} />
        </div>
        <div className="fshop-speech">
          <div className="wshop-title-row">
            <b>⚔️ Điện Thần Binh · Đại Sư Rèn Lý</b>
            <span className="wshop-vip-pill">🎲 RANDOM KIẾM HIẾM 0.01%</span>
          </div>
          <p>
            “Kho tàng <b>{SHOP_WEAPONS.length} Danh Kiếm & Thần Binh</b>! <b>Kiếm Hiếm (SR / SSR / UR) không có kiếm ngày</b>, chỉ nổ qua <b>Quay Random</b> và trúng là nhận <b>♾️ Vĩnh Viễn</b> — <b>Chí Tôn UR tỉ lệ 0.01%</b>! Chỉ <b>Kiếm Thường (N / R)</b> mới có kiếm ngày (3–7 Ngày).”
          </p>
        </div>
        <div className="fshop-side">
          <div className="fshop-wallet">
            <span>🪙 {fmt(g.gold)}</span>
            <span>💎 {fmt(g.gems)}</span>
          </div>
          <div className="wshop-hero-power">
            <span>⚔️ Công: <b>{st.atk}</b></span>
            <span>💥 Bạo: <b>{pct(st.crit)}</b></span>
            <span>⚡ Lực chiến: <b>{fmt(st.atk * 12 + st.def * 8 + st.maxHp)}</b></span>
          </div>
        </div>
      </div>

      {/* ---------------- Khu trung tâm: Sân Thử Thần Binh + 3 Hộp Quà Random Vũ Khí */}
      <div className="gshop-body">
        <aside className="gshop-stage wshop-stage" style={{ ['--rc' as string]: previewCol }}>
          <div className="wshop-stage-head">
            <span className="rcard-rar" style={{ background: previewCol }}>
              {previewRar} · {'★'.repeat(RARITY_STARS[previewRar])}
            </span>
            <span className="wshop-score-badge">⚡ Uy lực: {fmt(score)}</span>
          </div>

          <div className="gshop-doll wshop-doll">
            <HeroDoll look={heroLook(g)} held={preview.id} pet={g.cosmetics.pet} wings={g.cosmetics.wings} scale={4} />
          </div>

          <div className="wshop-preview-title">
            <img src={weaponIconURL(preview.id)} alt="" className="wshop-mini-icon" />
            <div>
              <b style={{ color: previewCol }}>{preview.name}</b>
              <small>
                {RARITY_NAME[previewRar]} · {previewRare ? (previewRar === 'UR' ? '🎲 Random 0.01% · ♾️ Vĩnh Viễn' : '🎲 Random · ♾️ Vĩnh Viễn') : `⏳ Kiếm Thường (Có Hạn Ngày · Lv ${preview.levelReq})`}
              </small>
            </div>
          </div>

          {/* 4 thanh chỉ số trực quan */}
          <div className="kstats wshop-bars">
            <div className="kstat">
              <span>⚔️ Công lực</span>
              <i>
                <b style={{ width: `${Math.min(100, Math.max(6, ((preview.atk ?? 5) / 440) * 100))}%` }} />
              </i>
              <em>+{preview.atk ?? 0}</em>
            </div>
            <div className="kstat">
              <span>⚡ Tốc chém</span>
              <i>
                <b style={{ width: `${Math.min(100, Math.max(15, ((600 - (preview.cooldown ?? 340)) / 420) * 100))}%` }} />
              </i>
              <em>{((1000 / (preview.cooldown ?? 340))).toFixed(1)}/s</em>
            </div>
            <div className="kstat">
              <span>📏 Tầm đánh</span>
              <i>
                <b style={{ width: `${Math.min(100, ((preview.range ?? 13) / 25) * 100)}%` }} />
              </i>
              <em>{preview.range ?? 13}m</em>
            </div>
            <div className="kstat">
              <span>💥 Chí mạng</span>
              <i>
                <b style={{ width: `${Math.min(100, ((preview.crit ?? 0) / 0.25) * 100)}%` }} />
              </i>
              <em>+{pct(preview.crit ?? 0)}</em>
            </div>
          </div>

          {/* So sánh với vũ khí đang cầm */}
          {preview.id !== currentWeapon.id && (
            <div className={`wshop-diff ${scoreDiff >= 0 ? 'up' : 'down'}`}>
              {scoreDiff >= 0
                ? `▲ Mạnh hơn ${currentWeapon.name}: ${atkDiff >= 0 ? `+${atkDiff} Công` : `${atkDiff} Công`} (${scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} Uy lực)`
                : `▼ Yếu hơn ${currentWeapon.name}: ${atkDiff} Công (${scoreDiff} Uy lực)`}
            </div>
          )}

          <div className="wshop-stage-actions">
            {isEquipped ? (
              <span className="rcard-tag ok">✋ Đang trang bị trên tay</span>
            ) : isOwned ? (
              <button className="btn sm" onClick={() => act((s) => equipItem(s, preview.id))}>
                ✋ Trang Bị Chiến Đấu Ngay
              </button>
            ) : preview.boss ? (
              <span className="wshop-boss-hint">👹 Rớt độc quyền từ Boss {BOSS_NAME_BY_ID[preview.boss] ?? preview.boss}</span>
            ) : previewRare ? (
              <button
                className="btn sm purple"
                disabled={g.gold < 900}
                onClick={() => pullBox('wbox_iron', 1)}
              >
                🎲 Kiếm Hiếm Không Có Kiếm Ngày · Quay Random Ngay (🪙900)
              </button>
            ) : (
              <button
                className="btn sm gold"
                disabled={g.player.level < preview.levelReq || g.gold < preview.price}
                onClick={() => {
                  act((s) => buyEquipment(s, preview.id));
                  pushAllDebounced();
                }}
              >
                {g.player.level < preview.levelReq
                  ? `🔒 Kiếm Ngày cần Lv ${preview.levelReq} (Hoặc mở Hộp Random!)`
                  : `⏳ Nhận Kiếm Ngày (3–7 Ngày) · 🪙${fmt(preview.price)}`}
              </button>
            )}
          </div>
        </aside>

        {/* ---------------- 3 Hộp Quà Random Vũ Khí */}
        <div className="gshop-main wshop-main">
          <div className="wshop-box-banner">
            <div>
              <h3>🎲 Hộp Quà Random Danh Kiếm · Tỉ Lệ Kiếm Hiếm 0.01%</h3>
              <p>
                <b>Kiếm Hiếm (SR / SSR / UR)</b>: <b>Không có kiếm ngày</b>, chỉ mở Random và trúng là nhận <b>♾️ Vĩnh Viễn</b>! <b>Chí Tôn UR tỉ lệ 0.01%</b> · <b>Kiếm Thường (N / R)</b>: Random hạn <b>⏳ 3 Ngày / 7 Ngày</b>.
              </p>
            </div>
            <div className="wshop-perks">
              <span>👑 Kiếm Hiếm UR: 0.01%</span>
              <span>♾️ Kiếm Hiếm = Vĩnh Viễn</span>
              <span>⏳ Kiếm Thường = Theo Ngày</span>
            </div>
          </div>

          <div className="chest-grid">
            {WEAPON_BOXES.map((b, idx) => {
              const isGem = !!b.cost.gems;
              const unit = b.cost.gems ?? b.cost.gold ?? 0;
              const cur = isGem ? g.gems : g.gold;
              const sym = isGem ? '💎' : '🪙';
              return (
                <div key={b.id} className={`cbox wbox t${idx + 1}`}>
                  {b.badge && <span className="cbox-badge">{b.badge}</span>}
                  <div className="cbox-art wbox-art">
                    <img className="cbox-img" src={chestURL(b.id, false)} alt={b.name} />
                    <span className="wbox-swords">⚔️</span>
                  </div>
                  <b>{b.name}</b>
                  <p>{b.desc}</p>
                  <OddsBar odds={b.odds} />
                  <div className="chest-btns">
                    <button
                      className={`btn ${isGem ? 'purple' : 'gold'}`}
                      disabled={cur < unit}
                      onClick={() => pullBox(b.id, 1)}
                    >
                      <span>Khui ×1</span>
                      <b>
                        {sym}
                        {fmt(unit)}
                      </b>
                    </button>
                    <button
                      className={`btn ${isGem ? 'purple' : 'gold'} wbox-x10`}
                      disabled={cur < unit * 10}
                      onClick={() => pullBox(b.id, 10)}
                    >
                      <span>×10 (Bảo hiểm SR+)</span>
                      <b>
                        {sym}
                        {fmt(unit * 10)}
                      </b>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- Kho Thần Binh & Đồ Giám Vũ Khí */}
      <div className="gshop-col wshop-codex">
        <div className="wshop-codex-head">
          <div className="wshop-tabs">
            <button className={`tab-btn ${tab === 'armory' ? 'on' : ''}`} onClick={() => setTab('armory')}>
              ⚔️ Danh Sách Kiếm Random & Tiệm ({ownedShopCount}/{SHOP_WEAPONS.length})
            </button>
            <button className={`tab-btn ${tab === 'boss' ? 'on' : ''}`} onClick={() => setTab('boss')}>
              💀 Thần Binh Boss Cấm Địa ({ownedBossCount}/{BOSS_WEAPONS.length})
            </button>
          </div>
          <div className="wshop-rar-filters">
            {(['ALL', 'UR', 'SSR', 'SR', 'R', 'N'] as const).map((r) => (
              <button
                key={r}
                className={`wshop-rar-pill ${rarFilter === r ? 'on' : ''}`}
                style={r !== 'ALL' ? { ['--rc' as string]: RARITY_COLOR[r] } : undefined}
                onClick={() => setRarFilter(r)}
              >
                {r === 'ALL' ? `Tất cả (${SHOP_WEAPONS.length})` : r === 'UR' ? `UR 0.01% ${'★'.repeat(RARITY_STARS[r])}` : `${r} ${'★'.repeat(RARITY_STARS[r])}`}
              </button>
            ))}
          </div>
        </div>

        <div className="rcard-grid wcard-grid">
          {filteredWeapons.map((w) => {
            const owned = g.player.owned.includes(w.id);
            const equipped = currentWeapon.id === w.id;
            return (
              <WeaponCard
                key={w.id}
                w={w}
                owned={owned}
                equipped={equipped}
                trying={tryId === w.id}
                level={g.player.level}
                gold={g.gold}
                expText={owned ? expiryBadgeText(g, w.id) : undefined}
                isPerm={owned ? isPermanent(g, w.id) : false}
                onTry={() => setTryId(w.id)}
                onEquip={() => {
                  act((s) => equipItem(s, w.id));
                  pushAllDebounced();
                }}
                onBuy={() => {
                  act((s) => buyEquipment(s, w.id));
                  pushAllDebounced();
                }}
                onRandom={() => pullBox('wbox_iron', 1)}
              />
            );
          })}
        </div>
      </div>

      {gacha && <WeaponGachaModal boxId={gacha.boxId} pulls={gacha.pulls} onClose={() => setGacha(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------- Tiệm Giáp & Phụ Kiện

export function EquipShop({ slots, who, quote }: { slots: EquipSlot[]; who: string; quote: string }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const [tab, setTab] = useState<EquipSlot>(slots[0]);
  const [tryId, setTryId] = useState<string | null>(null);
  const st = playerStats(g);
  const LABEL: Record<EquipSlot, string> = { weapon: '⚔️ Vũ khí', armor: '🛡️ Chiến Giáp', accessory: '💍 Phụ kiện' };
  const trying = tryId ? EQUIP_BY_ID[tryId] : null;
  const previewGame = trying
    ? {
        ...g,
        player: { ...g.player, equip: { ...g.player.equip, [trying.slot]: trying.id } },
        // Tạm ẩn đồ thời trang che giáp khi đang thử giáp để thấy trọn bộ chiến giáp ngầu
        cosmetics: trying.slot === 'armor' ? { ...g.cosmetics, top: null, bottom: null, shoes: null, hat: null } : g.cosmetics,
      }
    : g;
  const look = heroLook(previewGame);
  const previewSt = trying ? playerStats(previewGame) : st;
  const held = trying?.slot === 'weapon' ? trying.id : heldItem(g);
  const tryTier = trying ? equipTier(trying.levelReq) : null;

  const diffBadge = (cur: number, next: number) => {
    const d = next - cur;
    if (!trying || d === 0) return null;
    return <span className={`stat-diff ${d > 0 ? 'pos' : 'neg'}`}>{d > 0 ? `+${d}` : d}</span>;
  };

  return (
    <>
      <Quote text={quote} who={who} />
      <div className="fitting">
        <div className="fitting-stage doll-fit">
          <HeroDoll look={look} held={held} pet={g.cosmetics.pet} scale={5} />
        </div>
        <div className="grow">
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <b>🪞 Phòng Thử Chiến Giáp & Thần Vật</b>
            {trying && tryTier && <span className={`tier-badge ${tryTier.cls}`}>{tryTier.label}</span>}
          </div>
          {trying ? (
            <div className="trying-preview-card">
              <img className="equip-pixel-icon sm" src={equipIconURL(trying.id, trying.slot)} alt={trying.name} />
              <div>
                <b>{trying.name}</b>
                <div className="small next">{statLine(trying)}</div>
              </div>
            </div>
          ) : (
            <p className="small muted">Bấm 👁 hoặc bấm vào biểu tượng giáp để mặc thử lên nhân vật và so sánh chỉ số.</p>
          )}
          {trying && (
            <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => setTryId(null)}>
              ✖ Bỏ mặc thử
            </button>
          )}
          <Wallet />
        </div>
      </div>
      <div className="stats-row">
        <div>
          <b>
            ⚔️ {previewSt.atk} {diffBadge(st.atk, previewSt.atk)}
          </b>
          <small>Tấn công</small>
        </div>
        <div>
          <b>
            🛡️ {previewSt.def} {diffBadge(st.def, previewSt.def)}
          </b>
          <small>Phòng thủ</small>
        </div>
        <div>
          <b>
            ❤️ {previewSt.maxHp} {diffBadge(st.maxHp, previewSt.maxHp)}
          </b>
          <small>HP tối đa</small>
        </div>
      </div>
      {slots.length > 1 && (
        <div className="tabs">
          {slots.map((s) => (
            <button key={s} className={`tab-btn ${tab === s ? 'on' : ''}`} onClick={() => setTab(s)}>
              {LABEL[s]}
            </button>
          ))}
        </div>
      )}
      <div className="list">
        {EQUIPMENT.filter((e) => e.slot === tab).map((e) => {
          const owned = g.player.owned.includes(e.id);
          const using = g.player.equip[e.slot] === e.id;
          const locked = g.player.level < e.levelReq;
          const tier = equipTier(e.levelReq);
          const isTrying = tryId === e.id;
          const perm = owned && isPermanent(g, e.id);
          return (
            <div key={e.id} className={`shop-item equip-card ${using ? 'using' : ''} ${isTrying ? 'trying' : ''} ${locked ? 'locked' : ''}`}>
              <div className={`equip-icon-box ${tier.cls}`} onClick={() => setTryId(isTrying ? null : e.id)} title="Bấm để mặc thử">
                <img className="equip-pixel-icon" src={equipIconURL(e.id, e.slot)} alt={e.name} />
              </div>
              <div className="grow">
                <div className="equip-title-row">
                  <b>{e.name}</b>
                  <span className={`tier-badge ${tier.cls}`}>{tier.label}</span>
                  <span className="tag sm">Lv {e.levelReq}</span>
                  {owned && <span className={`dur-pill ${perm ? 'perm' : 'd7'}`}>{expiryBadgeText(g, e.id)}</span>}
                </div>
                <div className="small next">{statLine(e)}</div>
                <div className="small muted">{e.desc} · ⏳ Mua nhận hạn 3 Ngày (74%) / 7 Ngày (25%) / Vĩnh Viễn (1%)</div>
              </div>
              {!using && (
                <button className={`btn sm ${isTrying ? 'gold' : 'ghost'}`} onClick={() => setTryId(isTrying ? null : e.id)} title="Thử">
                  {isTrying ? '🙈' : '👁'}
                </button>
              )}
              {using ? (
                <span className="tag ok">Đang dùng</span>
              ) : owned ? (
                <button
                  className="btn sm"
                  onClick={() => {
                    act((g) => equipItem(g, e.id));
                    pushAllDebounced();
                  }}
                >
                  Mặc
                </button>
              ) : null}
              {(!owned || !perm) && e.price > 0 && (
                <PriceBtn
                  gold={e.price}
                  disabled={locked}
                  label={locked ? `🔒 Lv ${e.levelReq}` : owned ? `🔄 🪙${fmt(e.price)}` : undefined}
                  onClick={() => {
                    act((g) => buyEquipment(g, e.id));
                    pushAllDebounced();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export const ArmorShop = () => <EquipShop slots={['armor', 'accessory']} who="Quản kho Lý" quote="Chiến giáp rực lửa, cầu vai sừng rồng và hộ phù cổ ngữ — khoác lên là uy trấn sơn hà!" />;

// ---------------------------------------------------------------- Tiệm Thuốc & Lò Luyện Đan

function potionEffectsLine(p: PotionDef) {
  const parts: string[] = [];
  if (p.heal > 0) parts.push(`❤️ Hồi ${fmt(p.heal)} HP`);
  if (p.energy) parts.push(`⚡ +${p.energy} Thể lực mỏ`);
  if (p.buffs) {
    for (const b of p.buffs) {
      const info = BUFF_INFO[b.id];
      parts.push(`${info.emoji} ${info.name}: ${info.desc(b.value)} (${b.min} phút)`);
    }
  }
  return parts.join(' · ');
}

export function PotionShop() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const [tab, setTab] = useState<PotionCategory | 'alchemy'>('heal');

  const st = playerStats(g);
  const curHp = Math.floor(g.player.hp);
  const curEnergy = energyNow(g, now);
  const maxE = maxEnergy(g);
  const buffs = activeBuffs(g, now);
  const clinicFee = g.player.level < 5 ? 0 : 35;
  const needClinic = curHp < st.maxHp || curEnergy < maxE;

  const filteredPotions = SHOP_POTIONS.filter((p) => p.category === tab);

  return (
    <>
      <Quote
        text="Từ thảo dược trị thương, linh dược kích phát sức mạnh săn Boss cho đến lò luyện đan gia truyền — cứ giao cho ta! Mua sỉ ×10 lọ được giảm ngay 10% nhé!"
        who="Dược sư Lan — Y Quán & Luyện Đan Sư"
      />

      {/* Quầy Chẩn Trị & Trạng Thái Cơ Thể */}
      <div className="farm-care-panel">
        <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <span>
              ❤️ Sinh lực: <b>{fmt(curHp)}/{fmt(st.maxHp)}</b>
            </span>
            <span>
              ⚡ Thể lực mỏ: <b>{curEnergy}/{maxE}</b>
            </span>
            <span>
              🪙 <b>{fmt(g.gold)}</b> · 💎 <b>{fmt(g.gems)}</b>
            </span>
          </div>
          <button
            className="btn sm gold"
            disabled={!needClinic || g.gold < clinicFee}
            onClick={() => act((g, now) => clinicTreat(g, now))}
            title="Hồi đầy 100% HP và +20 ⚡ thể lực đào mỏ ngay tại chỗ"
          >
            🩺 Châm cứu hồi phục {clinicFee === 0 ? '(Miễn phí)' : `🪙${clinicFee}`}
          </button>
        </div>

        {buffs.length > 0 ? (
          <div className="farm-supply-bar" style={{ marginTop: 6 }}>
            <small className="muted">✨ Hiệu ứng đang có:</small>
            {buffs.map(([id, b]) => (
              <span key={id} className="tag sm ok">
                {BUFF_INFO[id].emoji} {BUFF_INFO[id].name} ({BUFF_INFO[id].desc(b.value)}) · còn {fmtTime(b.until - now)}
              </span>
            ))}
          </div>
        ) : (
          <div className="small muted" style={{ marginTop: 4 }}>
            💡 Mẹo: Uống <b>Linh Dược Buff</b> trước khi vào vùng sâu, câu cá hoặc đánh Boss để tăng mạnh sát thương, phòng thủ và tài lộc!
          </div>
        )}
      </div>

      {/* Các phân mục của Tiệm Thuốc */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'heal' ? 'on' : ''}`} onClick={() => setTab('heal')}>
          🧪 Thuốc Trị Thương (8)
        </button>
        <button className={`tab-btn ${tab === 'elixir' ? 'on' : ''}`} onClick={() => setTab('elixir')}>
          ✨ Linh Dược Buff (7)
        </button>
        <button className={`tab-btn ${tab === 'tonic' ? 'on' : ''}`} onClick={() => setTab('tonic')}>
          ⚡ Thể Lực & Y Tế (7)
        </button>
        <button className={`tab-btn ${tab === 'alchemy' ? 'on' : ''}`} onClick={() => setTab('alchemy')}>
          ⚗️ Lò Luyện Đan ({ALCHEMY_RECIPES.length})
        </button>
      </div>

      {tab === 'alchemy' ? (
        <div className="list">
          {ALCHEMY_RECIPES.map((r) => {
            const out = POTION_BY_ID[r.outputId];
            const enoughGold = g.gold >= r.goldCost;
            const enoughMats = Object.entries(r.inputs).every(([id, n]) => itemCount(g, id) >= n);
            const canBrew = enoughGold && enoughMats;
            return (
              <div key={r.id} className="shop-item">
                <span className="big-emoji">{out.emoji}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <b>
                      {out.name} ×{r.outputQty}
                    </b>
                    <span className="tag sm ok">Luyện đan</span>
                    <span className="muted small">đang có {itemCount(g, r.outputId)}</span>
                  </div>
                  <div className="small next">{potionEffectsLine(out)}</div>
                  <div className="small muted">{r.note}</div>
                  <div className="small" style={{ marginTop: 3 }}>
                    Nguyên liệu:{' '}
                    <span className={enoughGold ? 'have' : 'need'}>🪙{fmt(r.goldCost)}</span>{' '}
                    {Object.entries(r.inputs).map(([id, n]) => {
                      const have = itemCount(g, id);
                      const it = ITEMS[id];
                      return (
                        <span key={id} className={have >= n ? 'have' : 'need'} style={{ marginRight: 6 }}>
                          {it?.emoji} {it?.name} {have}/{n}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="shop-buy">
                  <button className="btn sm gold" disabled={!canBrew} onClick={() => act((g) => brewPotion(g, r.id))}>
                    ⚗️ Điều chế
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="list">
          {filteredPotions.map((p) => {
            const count = itemCount(g, p.id);
            const p10 = potionPrice(p.id, 10);
            return (
              <div key={p.id} className="shop-item">
                <span className="big-emoji">{p.emoji}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <b>{p.name}</b>
                    {p.tag && <span className={`tag sm ${p.category === 'elixir' ? 'ok' : ''}`}>{p.tag}</span>}
                    <span className="muted small">có {count}</span>
                  </div>
                  <div className="small next">{potionEffectsLine(p)}</div>
                  <div className="small muted">{p.desc}</div>
                </div>
                <div className="shop-buy">
                  {count > 0 && (
                    <button className="btn sm ghost" onClick={() => act((g, now) => eatFood(g, p.id, now))} title="Uống ngay 1 lọ">
                      🍷 Uống
                    </button>
                  )}
                  <PriceBtn gold={p.price} onClick={() => act((g) => buyPotion(g, p.id, 1))} />
                  <PriceBtn gold={p.price * 5} label={`×5 🪙${fmt(p.price * 5)}`} onClick={() => act((g) => buyPotion(g, p.id, 5))} />
                  <PriceBtn gold={p10} label={`×10 🪙${fmt(p10)}`} onClick={() => act((g) => buyPotion(g, p.id, 10))} />
                </div>
              </div>
            );
          })}

          {/* Trong tab Thể Lực & Y Tế, hiển thị thêm Thuốc Thú Y & Thuốc Thảo Mộc Nông Trại */}
          {tab === 'tonic' && (
            <>
              <div className="small muted" style={{ padding: '6px 4px 2px', fontWeight: 700 }}>
                🩺 Chế Phẩm Thú Y & Thảo Mộc Bảo Vệ Mùa Màng
              </div>
              {[...RANCH_SUPPLIES, ...FARM_SUPPLIES.filter((s) => s.id === 'pesticide')].map((s) => (
                <div key={s.id} className="shop-item">
                  <span className="big-emoji">{s.emoji}</span>
                  <div className="grow">
                    <div className="row" style={{ gap: 6 }}>
                      <b>{s.name}</b>
                      <span className="tag sm">Y tế nông trại</span>
                      <span className="muted small">có {itemCount(g, s.id)}</span>
                    </div>
                    <div className="small next">{s.desc}</div>
                  </div>
                  <div className="shop-buy">
                    <PriceBtn gold={s.price} label={`🪙${s.price}`} onClick={() => act((g) => buyFarmSupply(g, s.id, 1))} />
                    <PriceBtn gold={s.price * 5} label={`×5 🪙${s.price * 5}`} onClick={() => act((g) => buyFarmSupply(g, s.id, 5))} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Tiệm Hạt Giống & Phân Bón

export function SeedShop() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const rank = rankIndex(g.guildXp);
  const [tab, setTab] = useState<'fruit' | 'supply' | 'veg'>('fruit');

  return (
    <>
      <Quote
        text="Trồng cây phải có phân bón, nước tưới và thuốc bắt sâu mới ra hoa quả ngọt lành! Mua từ 10 gói hạt giảm ngay 15%."
        who="Chú Bảy — Hạt Giống & Vật Tư Nông Nghiệp"
      />
      <Wallet />
      <div className="tabs">
        <button className={`tab-btn ${tab === 'fruit' ? 'on' : ''}`} onClick={() => setTab('fruit')}>
          🍎 Hoa Quả Thật (10 loại)
        </button>
        <button className={`tab-btn ${tab === 'supply' ? 'on' : ''}`} onClick={() => setTab('supply')}>
          🌿 Phân Bón & Thuốc Trừ Sâu
        </button>
        <button className={`tab-btn ${tab === 'veg' ? 'on' : ''}`} onClick={() => setTab('veg')}>
          🌾 Hạt Giống Rau Củ
        </button>
      </div>

      {tab === 'supply' ? (
        <div className="list">
          {FARM_SUPPLIES.map((s) => (
            <div key={s.id} className="shop-item">
              <span className="big-emoji">{s.emoji}</span>
              <div className="grow">
                <b>{s.name}</b> <span className="muted small">đang có {itemCount(g, s.id)}</span>
                <div className="small next">{s.desc}</div>
              </div>
              <div className="shop-buy">
                <PriceBtn gold={s.price} label={`🪙${s.price}`} onClick={() => act((g) => buyFarmSupply(g, s.id, 1))} />
                <PriceBtn gold={s.price * 5} label={`×5 🪙${s.price * 5}`} onClick={() => act((g) => buyFarmSupply(g, s.id, 5))} />
                <PriceBtn gold={s.price * 10} label={`×10 🪙${s.price * 10}`} onClick={() => act((g) => buyFarmSupply(g, s.id, 10))} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="list">
          {CROPS.filter((c) => c.seedCost !== null && (tab === 'fruit' ? c.category === 'fruit' : c.category !== 'fruit')).map((c) => {
            const locked = rank < c.rankReq;
            return (
              <div key={c.id} className={`shop-item ${locked ? 'locked' : ''}`}>
                <span className="big-emoji">{c.emoji}</span>
                <div className="grow">
                  <div className="row">
                    <b>Hạt {c.name.toLowerCase()}</b>
                    {c.category === 'fruit' && <span className="tag sm ok">Hoa quả thật</span>}
                    <span className="muted small">có {itemCount(g, `seed_${c.id}`)}</span>
                  </div>
                  {c.desc && <div className="small next">{c.desc}</div>}
                  <div className="small muted">
                    ⏱ {fmtTime(c.growSec * 1000)} · thu {c.yield} trái · bán ~🪙{c.sellPrice}/trái
                    {locked && ` · 🔒 cần Hội rank ${RANKS[c.rankReq].name}`}
                  </div>
                </div>
                <div className="shop-buy">
                  <PriceBtn gold={seedPrice(c.id, 1)} disabled={locked} label={`🪙${seedPrice(c.id, 1)}`} onClick={() => act((g) => buySeeds(g, c.id, 1))} />
                  <PriceBtn gold={seedPrice(c.id, 10)} disabled={locked} label={`×10 🪙${seedPrice(c.id, 10)}`} onClick={() => act((g) => buySeeds(g, c.id, 10))} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
