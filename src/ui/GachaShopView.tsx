import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { NPC_LOOKS } from '../art/avatar';
import { heroLook } from '../art/heroLook';
import { COSMETICS, COS_BOXES, fitsGender, COS_DUP_GOLD, COS_SHOP_KINDS, RARITY_COLOR, type CosShop, type CosmeticDef, type CosmeticKind, type RodRarity } from '../game/config/shops';
import { heldItem } from '../game/logic/hotbar';
import { WORN_SLOTS, durationLabel, expiryBadgeText, isPermanent, openCosBox, rarityRank, toggleCosmetic, type CosBoxResult, type DurationRoll, type DurationStatus } from '../game/logic/shop';
import { fmt, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAllDebounced } from '../services/online';
import { sfx } from '../world/sfx';
import { AvatarView } from './AvatarView';
import { OddsBar, RARITY_NAME, RARITY_STARS } from './FishingShopView';
import { HeroDoll } from './HeroDoll';

// Tiệm Cánh / Thú Cưng / Thời Trang: không bán thẳng — mở hộp quà ngẫu nhiên, tỉ lệ công khai,
// mở ×10 chắc chắn có ít nhất 1 món SR trở lên, trùng món đã có thì đổi vàng. Có phòng thử đồ để xem trước.

const INFO: Record<CosShop, { title: string; who: string; npc: string; quote: string; tabs: { label: string; kinds: CosmeticKind[] }[] }> = {
  wings: {
    title: 'Tiệm Cánh Bà Tiên', who: 'Bà Tiên cánh', npc: 'npc_guild',
    quote: 'Cánh đẹp phải có duyên — mở hộp xem hôm nay trời ban cho cháu đôi cánh nào!',
    tabs: [{ label: '🪽 Cánh', kinds: ['wings'] }],
  },
  pets: {
    title: 'Tiệm Thú Cưng Anh Tùng', who: 'Anh Tùng', npc: 'npc_merchant',
    quote: 'Mỗi quả trứng là một bất ngờ! Ấp ra bé nào cũng đi theo giúp bạn kiếm vàng, XP.',
    tabs: [{ label: '🐾 Thú cưng', kinds: ['pet'] }],
  },
  fashion: {
    title: 'Tiệm Thời Trang Chị Hằng', who: 'Chị Hằng', npc: 'npc_villager',
    quote: 'Túi mù thời trang đây! Hên thì trúng Long bào, xui thì… vẫn xinh nha!',
    tabs: [
      { label: '👕 Áo', kinds: ['top'] },
      { label: '👖 Quần · Váy', kinds: ['bottom'] },
      { label: '👟 Giày', kinds: ['shoes'] },
    ],
  },
  hats: {
    title: 'Tiệm Mũ Nón Cô Mai', who: 'Cô Mai', npc: 'npc_hatter',
    quote: 'Từ nón lá tới vương miện — mũ nào cũng thêm phòng thủ, mũ hiếm còn thêm vàng với XP!',
    tabs: [{ label: '🎩 Mũ nón', kinds: ['hat'] }],
  },
  jewelry: {
    title: 'Tiệm Trang Sức Ông Kim', who: 'Ông Kim', npc: 'npc_jeweler',
    quote: 'Trang sức không chỉ để ngắm — đeo vào là vàng với XP chảy về túi con.',
    tabs: [
      { label: '📿 Dây chuyền', kinds: ['neck'] },
      { label: '💎 Bông tai', kinds: ['ear'] },
      { label: '🕶️ Kính', kinds: ['face'] },
    ],
  },
};

export function bonusText(c: CosmeticDef) {
  const s: string[] = [];
  if (c.speed) s.push(`👟 +${pct(c.speed)}`);
  if (c.def) s.push(`🛡️ +${c.def}`);
  if (c.goldBonus) s.push(`🪙 +${pct(c.goldBonus)}`);
  if (c.xpBonus) s.push(`✨ +${pct(c.xpBonus)} XP`);
  return s.join(' · ');
}

/** thẻ món đồ có khung theo độ hiếm (dùng chung khung thẻ cần câu) */
function CosCard({
  c,
  owned,
  worn,
  trying,
  onTry,
  onWear,
  small,
  duration,
  status,
  expText,
  isPerm,
}: {
  c: CosmeticDef;
  owned: boolean;
  worn?: boolean;
  trying?: boolean;
  onTry?: () => void;
  onWear?: () => void;
  small?: boolean;
  duration?: DurationRoll;
  status?: DurationStatus;
  expText?: string;
  isPerm?: boolean;
}) {
  return (
    <div className={`rcard cos r-${c.rarity} ${owned ? '' : 'locked'} ${worn ? 'using' : ''} ${trying ? 'trying' : ''} ${small ? 'small' : ''}`}>
      <div className="rcard-top">
        <span className="rcard-rar">{c.rarity}</span>
        <span className="rcard-stars">{'★'.repeat(RARITY_STARS[c.rarity])}</span>
      </div>
      <div className="rcard-art">
        <span className="cos-art">{c.emoji}</span>
      </div>
      <b className="rcard-name">{c.name}</b>
      {duration && (
        <span className={`dur-pill ${duration === 'perm' ? 'perm' : duration === '7d' ? 'd7' : 'd3'}`}>
          {durationLabel(duration, status)}
        </span>
      )}
      {!duration && owned && expText && (
        <span className={`dur-pill ${isPerm ? 'perm' : 'd7'}`}>{expText}</span>
      )}
      {!small && (
        <>
          <small className="cos-bonus">{bonusText(c) || c.desc}</small>
          <div className="cos-acts">
            {onTry && (
              <button className="btn sm ghost" onClick={onTry} title="Mặc thử">
                {trying ? '🙈' : '👁'}
              </button>
            )}
            {owned ? (
              onWear && (
                <button className={`btn sm ${worn ? 'ghost' : ''}`} onClick={onWear}>
                  {worn ? 'Tháo' : c.kind === 'pet' ? 'Dẫn theo' : 'Mặc'}
                </button>
              )
            ) : (
              <span className="cos-lock">🔒 {RARITY_NAME[c.rarity]}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function GachaShop({ shop }: { shop: CosShop }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const apply = useGame((s) => s.apply);
  const info = INFO[shop];
  const [tab, setTab] = useState(0);
  const [tryId, setTryId] = useState<string | null>(null);
  const [opening, setOpening] = useState<{ box: string; results: CosBoxResult[]; nonce: number } | null>(null);
  const owned = new Set(g.cosmetics.owned);
  const all = COSMETICS.filter((c) => COS_SHOP_KINDS[shop].includes(c.kind) && fitsGender(c.id, g.profile.gender));
  const list = all.filter((c) => info.tabs[tab].kinds.includes(c.kind)).sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity));
  const have = all.filter((c) => owned.has(c.id)).length;
  const isWorn = (id: string) => WORN_SLOTS.some((s) => g.cosmetics[s] === id);

  const trying = tryId ? COSMETICS.find((c) => c.id === tryId) : null;
  const cos = trying ? { ...g.cosmetics, [trying.kind]: trying.id } : g.cosmetics;
  const look = heroLook({ ...g, cosmetics: cos });

  const open = (boxId: string, n: number) => {
    const results = apply((g) => openCosBox(g, boxId, n));
    if (results) {
      setOpening({ box: boxId, results, nonce: Date.now() });
      pushAllDebounced();
    }
  };

  return (
    <div className={`gshop gs-${shop}`}>
      {/* ---------------- biển hiệu */}
      <header className="gshop-sign">
        <div className="fshop-npc">
          <AvatarView look={NPC_LOOKS[info.npc]} scale={3} />
        </div>
        <div className="fshop-title">
          <small>Khu Mua Sắm · Thị Trấn Khởi Nguyên</small>
          <h2>{info.title}</h2>
          <p>"{info.quote}" — {info.who}</p>
          <div className="fshop-badges">
            <span>⏳ 3 Ngày (74%) · 7 Ngày (25%) · ♾️ Vĩnh Viễn (1%)</span>
            <span>🎯 Mở ×10 chắc chắn có SR+</span>
            <span>♻️ Trùng Vĩnh Viễn đổi vàng</span>
          </div>
        </div>
        <div className="fshop-side">
          <div className="fshop-wallet">
            <span>🪙 {fmt(g.gold)}</span>
            <span>💎 {fmt(g.gems)}</span>
          </div>
          <div className="fshop-stats">
            <span>
              📖 Bộ sưu tập <b>{have}/{all.length}</b>
            </span>
          </div>
        </div>
      </header>

      <div className="gshop-body">
        {/* ---------------- phòng thử đồ */}
        <aside className="gshop-stage">
          <div className="gshop-doll">
            <HeroDoll look={look} held={heldItem(g)} pet={cos.pet} wings={cos.wings} />
          </div>
          {trying ? (
            <div className="gshop-trying">
              <b style={{ color: RARITY_COLOR[trying.rarity] }}>
                {trying.emoji} {trying.name}
              </b>
              <small>{bonusText(trying) || trying.desc}</small>
              <button className="btn sm ghost" onClick={() => setTryId(null)}>
                Bỏ thử
              </button>
            </div>
          ) : (
            <p className="gshop-hint">🪞 Bấm 👁 trên thẻ để mặc thử — kể cả món chưa có.</p>
          )}
        </aside>

        {/* ---------------- hộp quà */}
        <main className="gshop-main">
          <div className="chest-grid gshop-boxes">
            {COS_BOXES.filter((b) => b.shop === shop).map((b) => {
              const unit = b.gems ?? b.price;
              const money = b.gems ? g.gems : g.gold;
              const cur = b.gems ? '💎' : '🪙';
              return (
                <div key={b.id} className={`chest-card cbox t${b.tier}`}>
                  {b.gems && <span className="vip-tag">VIP</span>}
                  <div className="chest-glow" />
                  <span className="cbox-art">{b.emoji}</span>
                  <b>{b.name}</b>
                  <OddsBar odds={b.odds} />
                  <div className="chest-btns">
                    {[1, 10].map((n) => (
                      <button key={n} className={`btn sm ${b.gems ? 'purple' : 'gold'}`} disabled={money < unit * n} onClick={() => open(b.id, n)}>
                        <span>{n === 1 ? 'Mở ×1' : 'Mở ×10 · SR+'}</span>
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
          <div className="fshop-note">
            <b>♻️ Trùng món đã có → đổi vàng:</b>
            {(Object.entries(COS_DUP_GOLD) as [RodRarity, number][]).map(([r, v]) => (
              <span key={r} style={{ color: RARITY_COLOR[r] }}>
                {r} 🪙{fmt(v)}
              </span>
            ))}
          </div>
        </main>
      </div>

      {/* ---------------- bộ sưu tập */}
      <section className="gshop-col">
        <div className="gshop-col-head">
          <h3>📖 Bộ sưu tập</h3>
          <div className="fshop-progress">
            <span>
              <b>{have}/{all.length}</b>
            </span>
            <i>
              <b style={{ width: `${(have / all.length) * 100}%` }} />
            </i>
          </div>
        </div>
        {info.tabs.length > 1 && (
          <div className="fshop-tabs">
            {info.tabs.map((t, i) => (
              <button key={t.label} className={`fshop-tab ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className="rcard-grid">
          {list.map((c) => (
            <CosCard
              key={c.id}
              c={c}
              owned={owned.has(c.id)}
              worn={isWorn(c.id)}
              trying={tryId === c.id}
              expText={owned.has(c.id) ? expiryBadgeText(g, c.id) : undefined}
              isPerm={owned.has(c.id) ? isPermanent(g, c.id) : false}
              onTry={() => setTryId(tryId === c.id ? null : c.id)}
              onWear={() => {
                act((g) => toggleCosmetic(g, c.id));
                pushAllDebounced();
              }}
            />
          ))}
        </div>
      </section>

      {opening && (
        <CosReveal
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

/** Hoạt cảnh mở hộp: rung → bung sáng theo màu món hiếm nhất → lật thẻ */
function CosReveal({ box, results, onClose, onAgain }: { box: string; results: CosBoxResult[]; onClose: () => void; onAgain: (n: number) => void }) {
  const [stage, setStage] = useState<Stage>('shake');
  const best = useMemo(() => results.reduce((a, b) => (rarityRank(b.item.rarity) > rarityRank(a.item.rarity) ? b : a)), [results]);
  const color = RARITY_COLOR[best.item.rarity];
  const epic = rarityRank(best.item.rarity) >= 3;
  const emoji = COS_BOXES.find((b) => b.id === box)?.emoji ?? '🎁';

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setStage('burst');
      sfx.slam();
    }, 1200);
    const t2 = window.setTimeout(() => {
      setStage('reveal');
      sfx.levelUp();
    }, 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => stage !== 'reveal' && setStage('reveal');
  return (
    <div className={`gacha ${stage} ${epic ? 'epic' : ''}`} style={{ '--rc': color } as CSSProperties} onClick={skip}>
      <div className="gacha-rays" />
      {stage !== 'reveal' && (
        <div className="gacha-chest">
          <div className="gacha-aura" />
          <span className="gacha-emoji">{emoji}</span>
          {stage === 'shake' && <p>Chạm để bỏ qua</p>}
        </div>
      )}
      {stage === 'burst' && <div className="gacha-flash" />}
      {stage === 'reveal' && (
        <div className="gacha-result" onClick={(e) => e.stopPropagation()}>
          {epic && <div className="gacha-banner">✨ {RARITY_NAME[best.item.rarity].toUpperCase()}! ✨</div>}
          {results.length === 1 ? (
            <div className="gacha-single">
              <div className="flip-in">
                <CosCard c={best.item} owned duration={best.duration} status={best.status} />
              </div>
              <p className={best.dup ? 'muted' : 'next'}>
                {best.dup
                  ? `Đã sở hữu Vĩnh Viễn — đổi thành 🪙${fmt(best.gold)}`
                  : `✨ ${durationLabel(best.duration, best.status)} · ${best.item.desc}`}
              </p>
            </div>
          ) : (
            <div className="gacha-grid">
              {results.map((r, i) => (
                <div key={i} className="flip-in" style={{ animationDelay: `${i * 110}ms` }}>
                  <CosCard c={r.item} owned small duration={r.duration} status={r.status} />
                  <small className={r.dup ? 'muted' : 'next'}>{r.dup ? `+🪙${fmt(r.gold)}` : durationLabel(r.duration, r.status)}</small>
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

export const WingShop = () => <GachaShop shop="wings" />;
export const PetShop = () => <GachaShop shop="pets" />;
export const FashionShop = () => <GachaShop shop="fashion" />;
export const HatShop = () => <GachaShop shop="hats" />;
export const JewelryShop = () => <GachaShop shop="jewelry" />;
