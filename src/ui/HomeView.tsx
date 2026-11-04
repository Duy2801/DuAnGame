import { useState } from 'react';
import { heroLook } from '../art/heroLook';
import { BUFF_INFO } from '../game/config/buffs';
import { HEAL_ITEMS } from '../game/config/combat';
import { ITEMS, RECIPES } from '../game/config/farm';
import {
  FURNITURE_BY_ID,
  HOME_FURNITURE,
  HOUSES,
  HOUSE_BY_ID,
  STARTER_HOME,
  houseLuxuryInfo,
  type FurnitureCategory,
  type HouseDef,
} from '../game/config/life';
import { activeBuffs } from '../game/logic/buffs';
import { itemCount } from '../game/logic/core';
import { cook, cookMany } from '../game/logic/farm';
import {
  bestHouseLuxuryMult,
  buyFurniture,
  buyHouse,
  currentHouse,
  effectiveKitchenLevel,
  houseCombatStats,
  houseGoldPerMin,
  houseHp,
  houseXpBonus,
  selectActiveHouse,
  useHomeAppliance,
} from '../game/logic/life';
import { energyNow, maxEnergy } from '../game/logic/mine';
import { playerStats, restAtHome } from '../game/logic/player';
import { fmt, fmtTime, pct } from '../game/utils';
import { useGame } from '../store';
import { sfx } from '../world/sfx';
import { Bar } from './common';
import { HeroDoll } from './HeroDoll';

function furnitureBonusLine(id: string, mult: number) {
  const f = FURNITURE_BY_ID[id];
  if (!f) return '';
  const parts: string[] = [];
  if (f.goldPerMin) {
    const boosted = Math.round(f.goldPerMin * (1 + mult));
    parts.push(`🪙 +${boosted} vàng/phút${mult > 0 ? ` (gốc ${f.goldPerMin})` : ''}`);
  }
  if (f.hp) {
    const boostedHp = Math.round(f.hp * (1 + mult));
    parts.push(`❤️ +${boostedHp} HP`);
  }
  if (f.atk) parts.push(`⚔️ +${f.atk} Công`);
  if (f.def) parts.push(`🛡️ +${f.def} Thủ`);
  if (f.xp) parts.push(`✨ +${pct(f.xp)} XP`);
  if (f.kitchenTier) parts.push(`🍳 Mở Bếp Cấp ${f.kitchenTier}`);
  return parts.join(' · ');
}

/** Không gian bên trong căn nhà: Sân khấu nội thất trực quan + Dùng dụng cụ + Sắm đồ trong nhà + Đổi/Mua nhà không cần đi */
export function HouseInteriorView({ initialHouseId }: { initialHouseId?: string }) {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);

  const [tab, setTab] = useState<'room' | 'shop' | 'kitchen' | 'realty'>('room');
  const [furnCat, setFurnCat] = useState<'all' | FurnitureCategory>('all');
  const [previewHouseId, setPreviewHouseId] = useState<string | null>(initialHouseId ?? null);

  const st = playerStats(g);
  const curEnergy = energyNow(g, now);
  const maxE = maxEnergy(g);
  const ownedFurn = g.furniture ?? [];
  const luxMult = bestHouseLuxuryMult(g);
  const kitchenLvl = effectiveKitchenLevel(g);
  const hStat = houseCombatStats(g);
  const buffs = activeBuffs(g, now);

  const activeHouse: HouseDef =
    previewHouseId && HOUSE_BY_ID[previewHouseId]
      ? HOUSE_BY_ID[previewHouseId]
      : currentHouse(g);
  const isOwnedHouse = activeHouse.id === 'starter_home' || g.houses.includes(activeHouse.id);
  const lux = houseLuxuryInfo(activeHouse);

  const usableAppliances = HOME_FURNITURE.filter((f) => ownedFurn.includes(f.id) && f.action);
  const filteredFurniture = HOME_FURNITURE.filter((f) => furnCat === 'all' || f.category === furnCat);

  return (
    <div className="home-interior">
      {/* ---------------- SÂN KHẤU KHÔNG GIAN BÊN TRONG NHÀ */}
      <section className={`interior-stage ${lux.roomCls}`}>
        <div className="interior-header">
          <div>
            <span className="interior-rank-badge">
              {'★'.repeat(lux.stars)} {lux.rankName}
            </span>
            <h3>
              {activeHouse.emoji} {activeHouse.name}
              {!isOwnedHouse && <span className="tag sm bad" style={{ marginLeft: 6 }}>Đang xem thử</span>}
            </h3>
            <small>
              📐 {activeHouse.area} · 🪟 {activeHouse.view} · {lux.wallDesc}
            </small>
          </div>
          <div className="interior-mult-box">
            <b>+{Math.round(lux.mult * 100)}%</b>
            <small>Thưởng nội thất</small>
          </div>
        </div>

        {/* Khung cảnh phòng khách / phòng ngủ trực quan */}
        <div className="interior-room-canvas">
          {/* Cửa sổ & Trang trí trần nhà */}
          <div className="interior-wall-row">
            <div className="interior-window">
              <span>🪟 {activeHouse.view}</span>
              <div className="interior-ambi">
                {lux.ambiEmojis.map((em, i) => (
                  <span key={i}>{em}</span>
                ))}
              </div>
            </div>
            {ownedFurn.includes('furn_chandelier') && (
              <div className="interior-chandelier" title="Đèn Chùm Pha Lê Tiệp Khắc">
                ✨🕯️✨
              </div>
            )}
          </div>

          {/* Giữa phòng: Các dụng cụ đã mua bài trí quanh nhân vật */}
          <div className="interior-floor-stage">
            <div className="interior-furn-side">
              {HOME_FURNITURE.filter((f) => ownedFurn.includes(f.id))
                .slice(0, 8)
                .map((f) => (
                  <button
                    key={f.id}
                    className={`interior-furn-spot ${f.action ? 'interactive' : ''}`}
                    title={f.action ? `${f.name}: Bấm để ${f.action.label}` : `${f.name}: ${ furnitureBonusLine(f.id, luxMult)}`}
                    onClick={() => {
                      if (f.action && isOwnedHouse) {
                        if (act((g, now) => useHomeAppliance(g, f.id, playerStats(g).maxHp, now))) sfx.harvest();
                      }
                    }}
                  >
                    <span className="furn-spot-emoji">{f.emoji}</span>
                    <small>{f.name.split(' ')[0]}</small>
                  </button>
                ))}
              {ownedFurn.length === 0 && (
                <div className="interior-empty-hint" onClick={() => setTab('shop')}>
                  🛋️ Phòng còn trống — bấm vào đây để sắm Giường, Bếp từ, Tivi, Bể cá, Bồn Jacuzzi...
                </div>
              )}
            </div>

            <div className="interior-avatar-center">
              <HeroDoll look={heroLook(g)} held={null} pet={g.cosmetics.pet} wings={g.cosmetics.wings} scale={3.6} />
              <span className="interior-floor-tag">{lux.floorDesc}</span>
            </div>

            {ownedFurn.length > 8 && (
              <div className="interior-furn-side">
                {HOME_FURNITURE.filter((f) => ownedFurn.includes(f.id))
                  .slice(8, 16)
                  .map((f) => (
                    <button
                      key={f.id}
                      className={`interior-furn-spot ${f.action ? 'interactive' : ''}`}
                      title={f.action ? `${f.name}: Bấm để ${f.action.label}` : `${f.name}: ${furnitureBonusLine(f.id, luxMult)}`}
                      onClick={() => {
                        if (f.action && isOwnedHouse) {
                          if (act((g, now) => useHomeAppliance(g, f.id, playerStats(g).maxHp, now))) sfx.harvest();
                        }
                      }}
                    >
                      <span className="furn-spot-emoji">{f.emoji}</span>
                      <small>{f.name.split(' ')[0]}</small>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Thanh chỉ số tổng hợp của Tổ Ấm */}
        <div className="interior-summary-bar">
          <span>
            ❤️ HP: <b>{Math.floor(g.player.hp)}/{st.maxHp}</b> <small>(Nhà +{houseHp(g)})</small>
          </span>
          <span>
            ⚡ Thể lực: <b>{curEnergy}/{maxE}</b>
          </span>
          <span>
            🪙 Thu nhập nhà: <b>+{fmt(houseGoldPerMin(g))}/phút</b>
          </span>
          <span>
            ✨ Thưởng: <b>+{pct(houseXpBonus(g))} XP</b>
            {(hStat.atk > 0 || hStat.def > 0) && ` · ⚔️+${hStat.atk} 🛡️+${hStat.def}`}
          </span>
          <span>
            🪙 Vàng: <b>{fmt(g.gold)}</b>
          </span>
        </div>

        {!isOwnedHouse && (
          <div className="interior-buy-banner">
            <div>
              <b>🔑 Bạn đang tham quan {activeHouse.name}</b>
              <small>Mua ngay không cần cấp độ để dọn vào ở và hưởng +{Math.round(lux.mult * 100)}% hiệu suất mọi dụng cụ trong nhà!</small>
            </div>
            <button
              className="btn gold"
              disabled={g.gold < activeHouse.price}
              onClick={() => {
                if (act((g) => buyHouse(g, activeHouse.id))) sfx.coin();
              }}
            >
              {g.gold < activeHouse.price
                ? `Thiếu 🪙${fmt(activeHouse.price - g.gold)}`
                : `🔑 Mua căn này · 🪙${fmt(activeHouse.price)}`}
            </button>
          </div>
        )}
      </section>

      {/* ---------------- 4 TAB QUẢN LÝ & MUA SẮM TRONG NHÀ */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'room' ? 'on' : ''}`} onClick={() => setTab('room')}>
          🏠 Sinh Hoạt Tại Gia ({usableAppliances.length + 1})
        </button>
        <button className={`tab-btn ${tab === 'shop' ? 'on' : ''}`} onClick={() => setTab('shop')}>
          🛋️ Sắm Dụng Cụ Trong Nhà ({ownedFurn.length}/{HOME_FURNITURE.length})
        </button>
        <button className={`tab-btn ${tab === 'kitchen' ? 'on' : ''}`} onClick={() => setTab('kitchen')}>
          🍳 Phòng Bếp (Cấp {kitchenLvl})
        </button>
        <button className={`tab-btn ${tab === 'realty' ? 'on' : ''}`} onClick={() => setTab('realty')}>
          🏙️ Mua / Đổi Nhà ({g.houses.length}/{HOUSES.length})
        </button>
      </div>

      {/* ---------------- TAB 1: SINH HOẠT & SỬ DỤNG DỤNG CỤ TRONG NHÀ */}
      {tab === 'room' && (
        <>
          {/* Chọn nhanh giữa các căn nhà đang sở hữu */}
          <section className="card">
            <div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}>
              <b>🔑 Chuyển đổi căn nhà đang ở ({g.houses.length} BĐS sở hữu)</b>
              <button className="btn sm gold" onClick={() => setTab('realty')}>
                🏙️ Mua nhà mới (Khỏi cần đi)
              </button>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {[STARTER_HOME, ...HOUSES.filter((h) => g.houses.includes(h.id))].map((h) => {
                const isCur = activeHouse.id === h.id;
                return (
                  <button
                    key={h.id}
                    className={`btn sm ${isCur ? 'gold' : 'ghost'}`}
                    onClick={() => {
                      setPreviewHouseId(h.id);
                      act((g) => selectActiveHouse(g, h.id));
                    }}
                  >
                    {h.emoji} {h.name} {h.price > 0 ? `(+${Math.round(houseLuxuryInfo(h).mult * 100)}%)` : ''}
                  </button>
                );
              })}
            </div>
          </section>

          {buffs.length > 0 && (
            <div className="farm-supply-bar" style={{ marginBottom: 8 }}>
              <small className="muted">✨ Buff đang kích hoạt:</small>
              {buffs.map(([id, b]) => (
                <span key={id} className="tag sm ok">
                  {BUFF_INFO[id].emoji} {BUFF_INFO[id].name} ({BUFF_INFO[id].desc(b.value)}) · {fmtTime(b.until - now)}
                </span>
              ))}
            </div>
          )}

          <div className="list">
            {/* Giường ngủ cơ bản luôn có sẵn */}
            <div className="shop-item">
              <span className="big-emoji">🛏️</span>
              <div className="grow">
                <b>Giường Ngủ Tổ Ấm</b>
                <Bar value={g.player.hp / st.maxHp} tone="red" />
                <div className="small muted">
                  ❤️ HP hiện tại: {Math.floor(g.player.hp)}/{st.maxHp} · Nghỉ ngơi hồi đầy 100% máu miễn phí
                </div>
              </div>
              <button className="btn sm gold" onClick={() => act((g) => restAtHome(g))}>
                😴 Ngủ hồi HP
              </button>
            </div>

            {/* Các dụng cụ tương tác đã sắm */}
            {usableAppliances.map((f) => (
              <div key={f.id} className="shop-item">
                <span className="big-emoji">{f.emoji}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <b>{f.name}</b>
                    <span className="tag sm ok">Đã lắp đặt</span>
                  </div>
                  <div className="small next">{furnitureBonusLine(f.id, luxMult)}</div>
                  <div className="small muted">{f.desc}</div>
                </div>
                <button
                  className="btn sm gold"
                  onClick={() => {
                    if (act((g, now) => useHomeAppliance(g, f.id, playerStats(g).maxHp, now))) sfx.harvest();
                  }}
                >
                  {f.action!.label}
                </button>
              </div>
            ))}

            {usableAppliances.length === 0 && (
              <section className="card hint">
                🛋️ Bạn chưa sắm dụng cụ tiện nghi nào (như <b>Máy Pha Cà Phê Espresso, Ghế Massage, Bếp Điện Từ, Bể Cá, Giàn Tập Gym, Bồn Tắm Jacuzzi...</b>). Hãy qua tab <b>🛋️ Sắm Dụng Cụ Trong Nhà</b> để trang hoàng tổ ấm nhé!
              </section>
            )}
          </div>
        </>
      )}

      {/* ---------------- TAB 2: CỬA HÀNG DỤNG CỤ & NỘI THẤT TRONG NHÀ */}
      {tab === 'shop' && (
        <>
          <div className="farm-care-panel" style={{ marginBottom: 8 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}>
              <b>
                🛋️ Siêu Thị Nội Thất & Gia Dụng · Nhà càng xịn dụng cụ càng sinh lời cao (Hiện tại: +{Math.round(luxMult * 100)}%)
              </b>
              <span className="tag">🪙 {fmt(g.gold)}</span>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {(
                [
                  ['all', '🏠 Tất cả (16)'],
                  ['bedroom', '🛏️ Phòng Ngủ'],
                  ['kitchen', '🍳 Phòng Bếp'],
                  ['living', '📺 Phòng Khách & Gym'],
                  ['luxury', '💎 Đại Gia Phong Thủy'],
                ] as const
              ).map(([k, label]) => (
                <button key={k} className={`btn sm ${furnCat === k ? 'gold' : 'ghost'}`} onClick={() => setFurnCat(k)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="list">
            {filteredFurniture.map((f) => {
              const has = ownedFurn.includes(f.id);
              return (
                <div key={f.id} className={`shop-item ${has ? 'using' : ''}`}>
                  <span className="big-emoji">{f.emoji}</span>
                  <div className="grow">
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <b>{f.name}</b>
                      {has && <span className="tag sm ok">Đã sắm trong nhà</span>}
                      {f.action && <span className="tag sm">Tương tác dùng được</span>}
                    </div>
                    <div className="small next">{furnitureBonusLine(f.id, luxMult)}</div>
                    {f.action && <div className="small" style={{ color: '#2b7a3e', fontWeight: 700 }}>✨ Công năng: {f.action.label}</div>}
                    <div className="small muted">{f.desc}</div>
                  </div>
                  <div className="shop-buy">
                    {has ? (
                      f.action ? (
                        <button
                          className="btn sm"
                          onClick={() => {
                            if (act((g, now) => useHomeAppliance(g, f.id, playerStats(g).maxHp, now))) sfx.harvest();
                          }}
                        >
                          Dùng ngay
                        </button>
                      ) : (
                        <span className="tag ok">Đang trưng bày</span>
                      )
                    ) : (
                      <button
                        className="btn sm gold"
                        disabled={g.gold < f.price}
                        onClick={() => {
                          if (act((g) => buyFurniture(g, f.id))) sfx.coin();
                        }}
                      >
                        🛒 🪙{fmt(f.price)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------------- TAB 3: PHÒNG BẾP TẠI GIA */}
      {tab === 'kitchen' && (
        <>
          {kitchenLvl === 0 ? (
            <section className="card hint">
              <p style={{ margin: '0 0 8px' }}>
                🍳 Nhà bạn chưa có <b>Bếp</b>. Bạn có thể mua ngay <b>🍲 Bếp Điện Từ Đôi (🪙900)</b> hoặc <b>👨‍🍳 Quầy Bar & Đảo Bếp 5 Sao (🪙12.500)</b> bên dưới để mở khóa nấu ăn tại gia mà không cần đi ra xưởng!
              </p>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn sm gold"
                  disabled={g.gold < 900}
                  onClick={() => {
                    if (act((g) => buyFurniture(g, 'furn_stove'))) sfx.coin();
                  }}
                >
                  🍲 Sắm Bếp Điện Từ Đôi (Mở Bếp Cấp 2) · 🪙900
                </button>
                <button
                  className="btn sm gold"
                  disabled={g.gold < 12500}
                  onClick={() => {
                    if (act((g) => buyFurniture(g, 'furn_chef_island'))) sfx.coin();
                  }}
                >
                  👨‍🍳 Sắm Đảo Bếp 5 Sao (Mở Bếp Cấp 3) · 🪙12.500
                </button>
              </div>
            </section>
          ) : (
            <section className="card">
              <div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}>
                <h2>🍳 Bếp Gia Đình</h2>
                <div className="row" style={{ gap: 6 }}>
                  <span className="tag ok">Cấp {kitchenLvl}/3</span>
                  {kitchenLvl < 3 && (
                    <button
                      className="btn sm gold"
                      disabled={g.gold < 12500}
                      onClick={() => {
                        if (act((g) => buyFurniture(g, 'furn_chef_island'))) sfx.coin();
                      }}
                    >
                      👨‍🍳 Nâng lên Đảo Bếp 5 Sao (Cấp 3) · 🪙12.500
                    </button>
                  )}
                </div>
              </div>
              <div className="list">
                {RECIPES.map((r) => {
                  const enough = Object.entries(r.inputs).every(([id, n]) => itemCount(g, id) >= n);
                  const locked = kitchenLvl < r.kitchenLevel;
                  return (
                    <div key={r.id} className={`recipe ${locked ? 'locked' : ''}`}>
                      <span className="big-emoji">{r.emoji}</span>
                      <div className="grow">
                        <b>{r.name}</b> <span className="muted small">có {itemCount(g, r.id)}</span>
                        <div className="small">
                          {Object.entries(r.inputs).map(([id, n]) => (
                            <span key={id} className={itemCount(g, id) >= n ? 'have' : 'need'}>
                              {ITEMS[id].emoji}
                              {itemCount(g, id)}/{n}{' '}
                            </span>
                          ))}
                        </div>
                        <div className="small muted">
                          ❤️ +{HEAL_ITEMS[r.id]} HP · 🪙 {r.sellPrice}
                          {r.buff && (
                            <b className="buff-tag">
                              {' '}
                              {BUFF_INFO[r.buff.id].emoji} {BUFF_INFO[r.buff.id].desc(r.buff.value)} · {r.buff.min}p
                            </b>
                          )}
                        </div>
                      </div>
                      <div className="order-btns">
                        <button className="btn sm" disabled={locked || !enough} onClick={() => act((g) => cook(g, r.id))}>
                          {locked ? `Bếp ${r.kitchenLevel}` : 'Nấu'}
                        </button>
                        {!locked && enough && (
                          <button className="btn sm ghost" onClick={() => act((g) => cookMany(g, r.id, 5))}>
                            ×5
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ---------------- TAB 4: MUA NHÀ TỪ XA (KHÔNG CẦN CẤP ĐỘ, KHÔNG CẦN ĐI BỘ) */}
      {tab === 'realty' && (
        <div className="list">
          <div className="farm-care-panel">
            <b>🏙️ Mua Nhà Online — Không Cần Cấp Độ · Không Cần Đi Xa · Nhà Càng Đắt Càng Đẹp & Nhân Thưởng Nội Thất Càng Cao!</b>
          </div>
          {[...HOUSES]
            .sort((a, b) => a.price - b.price)
            .map((h) => {
              const owned = g.houses.includes(h.id);
              const isCur = activeHouse.id === h.id;
              const hLux = houseLuxuryInfo(h);
              return (
                <div key={h.id} className={`shop-item ${owned ? 'using' : ''}`}>
                  <span className="big-emoji">{h.emoji}</span>
                  <div className="grow">
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <b>{h.name}</b>
                      <span className="tag sm ok">
                        {'★'.repeat(hLux.stars)} {hLux.rankName}
                      </span>
                      {owned && <span className="tag sm ok">🔑 Đã sở hữu</span>}
                    </div>
                    <div className="small next">
                      🪙 +{fmt(h.goldPerMin)} vàng/phút · ✨ +{pct(h.xp)} XP
                      {h.hp ? ` · ❤️ +${h.hp} HP` : ''}
                      {h.privatePond ? ' · 🎣 Hồ cá hiếm ×3' : ''} · 🛋️ <b>+{Math.round(hLux.mult * 100)}% hiệu suất nội thất</b>
                    </div>
                    <div className="small muted">
                      📐 {h.area} · 🪟 {h.view} · {hLux.wallDesc}
                    </div>
                  </div>
                  <div className="shop-buy">
                    <button
                      className="btn sm ghost"
                      onClick={() => {
                        setPreviewHouseId(h.id);
                        if (owned) act((g) => selectActiveHouse(g, h.id));
                      }}
                    >
                      {isCur ? '🏠 Đang ở' : owned ? '🚪 Vào ở' : '👁 Xem nhà'}
                    </button>
                    {!owned && (
                      <button
                        className="btn sm gold"
                        disabled={g.gold < h.price}
                        onClick={() => {
                          if (act((g) => buyHouse(g, h.id))) {
                            setPreviewHouseId(h.id);
                            sfx.coin();
                          }
                        }}
                      >
                        🔑 Mua 🪙{fmt(h.price)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export function HomeView() {
  return <HouseInteriorView />;
}
