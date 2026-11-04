import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { NPC_LOOKS } from '../art/avatar';
import { kiteIconURL } from '../art/kiteArt';
import { KITE_BUFF_ALT, KITE_STAT_MAX, kitePlay, kiteSkills } from '../game/config/kitegame';
import { KITE_BOXES, KITE_BY_ID, KITE_DUP_GOLD, KITES, RARITY_COLOR, type KiteDef, type RodRarity } from '../game/config/shops';
import { buyKite, equipKite, openKiteBox, type KiteBoxResult } from '../game/logic/life';
import { DURATION_ODDS_TEXT, durationLabel, expiryBadgeText, isPermanent, rarityRank, type DurationRoll, type DurationStatus } from '../game/logic/shop';
import { CHEST_SIZE, loadCatalog, openBox, openChest, refreshChest, useChest, useServerFishing, type KiteDefRow } from '../services/fishingApi';
import { fmt, fmtTime, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAllDebounced } from '../services/online';
import { sfx } from '../world/sfx';
import { AvatarView } from './AvatarView';
import { OddsBar, RARITY_NAME, RARITY_STARS, ServerBoxGrid } from './FishingShopView';
import { KitePreview } from './KiteGame';

// Tiệm Diều Bé Na: vài diều bán thẳng, còn lại mở hộp diều ngẫu nhiên (tỉ lệ công khai, ×10 chắc chắn SR+).
// Sân thử diều cho xem diều bay thật + chỉ số & kỹ năng khi thả ở Đồi Gió.

/** thanh chỉ số 0..1 */
function Bar({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="kstat">
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.max(6, Math.min(1, value) * 100)}%` }} />
      </i>
      <em>{text}</em>
    </div>
  );
}

/** diều theo id: ưu tiên bản vẽ local, thiếu thì dựng tạm từ kite_defs của server */
function kiteDefOf(id: string, row?: KiteDefRow): KiteDef {
  const l = KITE_BY_ID[id];
  if (l) return l;
  return {
    id,
    name: row?.name ?? id,
    emoji: row?.emoji ?? '🪁',
    rarity: row?.rarity ?? 'N',
    mult: row?.mult ?? 1.1,
    minutes: row?.minutes ?? 4,
    colors: ['#f4f0e8', '#3d6fd1'],
    shape: 'diamond',
    tail: 'bows',
    desc: row?.descr ?? '',
  };
}

const scale = (v: number, max: number) => (v - 0.7) / (max - 0.7);

/** bốn chỉ số bay của diều */
function KiteBars({ k }: { k: KiteDef }) {
  const p = kitePlay(k.id);
  return (
    <div className="kstats">
      <Bar label="❤️ Độ bền" value={p.hp / KITE_STAT_MAX.hp} text={`${p.hp}`} />
      <Bar label="⬆️ Tốc bay" value={scale(p.climb, KITE_STAT_MAX.climb)} text={`×${p.climb}`} />
      <Bar label="🎮 Độ lái" value={scale(p.steer, KITE_STAT_MAX.steer)} text={`×${p.steer}`} />
      <Bar label="🍃 Gió lành" value={(k.mult - 1) / 0.4} text={`+${pct(k.mult - 1)}`} />
    </div>
  );
}

/** thẻ diều có khung theo độ hiếm (dùng chung khung thẻ cần câu) */
function KiteCard({
  k,
  owned,
  using,
  picked,
  onPick,
  small,
  duration,
  status,
  expText,
  isPerm,
}: {
  k: KiteDef;
  owned: boolean;
  using?: boolean;
  picked?: boolean;
  onPick?: () => void;
  small?: boolean;
  duration?: DurationRoll;
  status?: DurationStatus;
  expText?: string;
  isPerm?: boolean;
}) {
  const skills = kiteSkills(kitePlay(k.id));
  return (
    <div className={`rcard kcard r-${k.rarity} ${owned ? '' : 'locked'} ${using ? 'using' : ''} ${picked ? 'trying' : ''} ${small ? 'small' : ''}`} onClick={onPick}>
      <div className="rcard-top">
        <span className="rcard-rar">{k.rarity}</span>
        <span className="rcard-stars">{'★'.repeat(RARITY_STARS[k.rarity])}</span>
      </div>
      <div className="rcard-art">
        <img src={kiteIconURL(k.id, !owned && !small)} alt="" />
      </div>
      <b className="rcard-name">{k.name}</b>
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
          <div className="kcard-skills">{skills.length ? skills.map((s) => <span key={s.name} title={`${s.name}: ${s.desc}`}>{s.icon}</span>) : <small>Diều cơ bản</small>}</div>
          {using ? (
            <span className="rcard-using">✔ Đang dùng</span>
          ) : owned ? (
            <small className="kcard-own">Đã có</small>
          ) : k.price || k.gems ? (
            <small className="kcard-buy">{k.gems ? `💎${k.gems}` : `🪙${fmt(k.price!)}`} · mua thẳng</small>
          ) : (
            <span className="cos-lock">🔒 {RARITY_NAME[k.rarity]}</span>
          )}
        </>
      )}
    </div>
  );
}

export function KiteShop() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const apply = useGame((s) => s.apply);
  const owned = new Set(g.kites.owned);
  const [pick, setPick] = useState(g.kites.equipped ?? KITES[0].id);
  const [opening, setOpening] = useState<{ box: string; results: KiteBoxResult[]; nonce: number } | null>(null);
  const k = KITE_BY_ID[pick];
  const skills = kiteSkills(kitePlay(k.id));
  const buffLeft = g.kiteBuffUntil - now;
  const list = [...KITES].sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity));

  const online = useServerFishing();
  const cat = useChest((s) => s.catalog);
  const used = useChest((s) => s.slots.length);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!online) return;
    void loadCatalog();
    void refreshChest({ quiet: true });
  }, [online]);

  const open = async (boxId: string, n: number) => {
    if (!online) {
      const results = apply((g) => openKiteBox(g, boxId, n));
      if (results) setOpening({ box: boxId, results, nonce: Date.now() });
      return;
    }
    if (busy) return;
    setBusy(true);
    const rows = await openBox(boxId, n === 10 ? 10 : 1);
    setBusy(false);
    if (!rows?.length) return;
    const results: KiteBoxResult[] = rows.map((r) => ({ kite: kiteDefOf(r.item_id, cat?.kiteById[r.item_id]), dup: false, gold: 0, duration: r.duration, status: 'new' }));
    setOpening({ box: boxId, results, nonce: Date.now() });
  };

  return (
    <div className="gshop gs-kites">
      {/* ---------------- biển hiệu */}
      <header className="gshop-sign">
        <div className="fshop-npc">
          <AvatarView look={NPC_LOOKS.npc_kid} scale={3} />
        </div>
        <div className="fshop-title">
          <small>Đồi Gió · Hồ Câu</small>
          <h2>Tiệm Diều Bé Na</h2>
          <p>"Mỗi chiếc diều một tài riêng: có diều hút xu, có diều miễn sét, có diều dọa chim! Mở hộp thử vận may nha!" — Bé Na</p>
          <div className="fshop-badges">
            <span>{DURATION_ODDS_TEXT}</span>
            {online ? <span>🌐 Kết quả quay trên máy chủ</span> : <span>🎯 Mở ×10 chắc chắn có SR+</span>}
            {!online && <span>♻️ Trùng Vĩnh Viễn đổi vàng</span>}
          </div>
        </div>
        <div className="fshop-side">
          <div className="fshop-wallet">
            <span>🪙 {fmt(g.gold)}</span>
            <span>💎 {fmt(g.gems)}</span>
          </div>
          <div className="fshop-stats">
            <span>
              🪁 <b>{owned.size}/{KITES.length}</b> diều
            </span>
            <span>
              🏆 <b>{fmt(g.kiteBest)} m</b>
            </span>
            {online && (
              <button className="btn sm ghost" onClick={openChest}>
                🧰 Rương đồ {used}/{CHEST_SIZE}
              </button>
            )}
            {buffLeft > 0 && (
              <span>
                🍃 Gió lành <b>{fmtTime(buffLeft)}</b>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="gshop-body">
        {/* ---------------- sân thử diều */}
        <aside className={`kshop-stage r-${k.rarity}`}>
          <div className="kshop-sky">
            <KitePreview id={k.id} w={206} h={170} />
            <span className="rcard-rar">{k.rarity}</span>
          </div>
          <b className="kshop-name" style={{ color: RARITY_COLOR[k.rarity] }}>
            {k.emoji} {k.name}
          </b>
          <small className="kshop-desc">{k.desc}</small>
          <KiteBars k={k} />
          <div className="kshop-skills">
            {skills.length ? (
              skills.map((s) => (
                <div key={s.name}>
                  <span>{s.icon}</span>
                  <p>
                    <b>{s.name}</b>
                    <small>{s.desc}</small>
                  </p>
                </div>
              ))
            ) : (
              <small className="kshop-none">Không có kỹ năng đặc biệt — diều tập bay cho người mới.</small>
            )}
          </div>
          <small className="kshop-buff">
            Bay qua {KITE_BUFF_ALT} m: 🍃 +{pct(k.mult - 1)} vàng từ quái trong {k.minutes} phút
          </small>
          {g.kites.equipped === k.id ? (
            <span className="rcard-using">✔ Đang dùng — ra Đồi Gió thả thôi!</span>
          ) : owned.has(k.id) ? (
            <button className="btn gold block" onClick={() => { act((g) => equipKite(g, k.id)); pushAllDebounced(); }}>
              🪁 Chọn diều này
            </button>
          ) : null}
          {!online && (!owned.has(k.id) || !isPermanent(g, k.id)) && (k.price || k.gems) ? (
            <button
              className={`btn block ${k.gems ? 'purple' : 'gold'}`}
              disabled={k.gems ? g.gems < k.gems : g.gold < k.price!}
              onClick={() => { act((g) => buyKite(g, k.id)); pushAllDebounced(); }}
            >
              {owned.has(k.id) ? '🔄 Gia hạn / Săn Vĩnh Viễn' : 'Mua ngay'} {k.gems ? `💎${k.gems}` : `🪙${fmt(k.price!)}`}
            </button>
          ) : !owned.has(k.id) ? (
            <span className="cos-lock">🔒 Chỉ có trong hộp diều · {RARITY_NAME[k.rarity]}</span>
          ) : null}
        </aside>

        {/* ---------------- hộp diều ngẫu nhiên */}
        <main className="gshop-main">
          {online && <ServerBoxGrid kind="kite" busy={busy} onOpen={(id: string, n: number) => void open(id, n)} />}
          {!online && (
          <>
          <div className="chest-grid gshop-boxes">
            {KITE_BOXES.map((b) => {
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
                  <div className="odds-legend">
                    {(Object.entries(b.odds) as [RodRarity, number][]).map(([r, p]) => (
                      <span key={r} style={{ color: RARITY_COLOR[r] }}>
                        {r} {pct(p)}
                      </span>
                    ))}
                  </div>
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
            <b>♻️ Trùng diều đã có → đổi vàng:</b>
            {(Object.entries(KITE_DUP_GOLD) as [RodRarity, number][]).map(([r, v]) => (
              <span key={r} style={{ color: RARITY_COLOR[r] }}>
                {r} 🪙{fmt(v)}
              </span>
            ))}
          </div>
          </>
          )}
          <p className="fshop-tip">Bấm vào thẻ diều bên dưới để xem diều bay thử và chỉ số trên sân bên trái.</p>
        </main>
      </div>

      {/* ---------------- bộ sưu tập */}
      <section className="gshop-col">
        <div className="gshop-col-head">
          <h3>📖 Bộ sưu tập diều</h3>
          <div className="fshop-progress">
            <span>
              <b>{owned.size}/{KITES.length}</b>
            </span>
            <i>
              <b style={{ width: `${(owned.size / KITES.length) * 100}%` }} />
            </i>
          </div>
        </div>
        <div className="rcard-grid">
          {list.map((x) => (
            <KiteCard
              key={x.id}
              k={x}
              owned={owned.has(x.id)}
              using={g.kites.equipped === x.id}
              picked={pick === x.id}
              expText={owned.has(x.id) ? expiryBadgeText(g, x.id) : undefined}
              isPerm={owned.has(x.id) ? isPermanent(g, x.id) : false}
              onPick={() => setPick(x.id)}
            />
          ))}
        </div>
      </section>

      {opening && (
        <KiteReveal
          key={opening.nonce}
          box={opening.box}
          results={opening.results}
          onClose={() => setOpening(null)}
          onAgain={(n) => open(opening.box, n)}
          onUse={(id) => {
            act((g) => equipKite(g, id));
            pushAllDebounced();
            setPick(id);
            setOpening(null);
          }}
        />
      )}
    </div>
  );
}

type Stage = 'shake' | 'burst' | 'reveal';

/** Hoạt cảnh mở hộp diều: rung → bung sáng theo màu diều hiếm nhất → lật thẻ */
function KiteReveal({ box, results, onClose, onAgain, onUse }: {
  box: string; results: KiteBoxResult[]; onClose: () => void; onAgain: (n: number) => void; onUse: (id: string) => void;
}) {
  const [stage, setStage] = useState<Stage>('shake');
  const best = useMemo(() => results.reduce((a, b) => (rarityRank(b.kite.rarity) > rarityRank(a.kite.rarity) ? b : a)), [results]);
  const epic = rarityRank(best.kite.rarity) >= 3;
  const emoji = KITE_BOXES.find((b) => b.id === box)?.emoji ?? '🎁';

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
    <div className={`gacha ${stage} ${epic ? 'epic' : ''}`} style={{ '--rc': RARITY_COLOR[best.kite.rarity] } as CSSProperties} onClick={skip}>
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
          {epic && <div className="gacha-banner">✨ {RARITY_NAME[best.kite.rarity].toUpperCase()}! ✨</div>}
          {results.length === 1 ? (
            <div className="gacha-single">
              <div className="flip-in kreveal">
                <KitePreview id={best.kite.id} w={210} h={150} />
                <KiteCard k={best.kite} owned duration={best.duration} status={best.status} />
                <KiteBars k={best.kite} />
              </div>
              <p className={best.dup ? 'muted' : 'next'}>
                {best.dup
                  ? `Đã sở hữu Vĩnh Viễn — đổi thành 🪙${fmt(best.gold)}`
                  : `✨ ${durationLabel(best.duration, best.status)} · ${best.kite.desc}`}
              </p>
            </div>
          ) : (
            <div className="gacha-grid">
              {results.map((r, i) => (
                <div key={i} className="flip-in" style={{ animationDelay: `${i * 110}ms` }}>
                  <KiteCard k={r.kite} owned small duration={r.duration} status={r.status} />
                  <small className={r.dup ? 'muted' : 'next'}>{r.dup ? `+🪙${fmt(r.gold)}` : durationLabel(r.duration, r.status)}</small>
                </div>
              ))}
            </div>
          )}
          <div className="dialog-actions center">
            {!best.dup && (
              <button className="btn" onClick={() => onUse(best.kite.id)}>
                🪁 Dùng {best.kite.name}
              </button>
            )}
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
