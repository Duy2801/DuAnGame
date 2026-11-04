import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { HOUSES, HOUSE_BY_ID, TOWER_BY_ID, houseLuxuryInfo, towerUnits, unitSlots, type HouseDef } from '../game/config/life';
import { buyHouse, houseGoldPerMin, houseHp, houseXpBonus, selectActiveHouse } from '../game/logic/life';
import { restAtHome } from '../game/logic/player';
import { fmt, fmtTime, pct } from '../game/utils';
import { useGame } from '../store';
import { sfx } from '../world/sfx';
import { Quote } from './common';
import { HouseInteriorView } from './HomeView';

// Bất động sản: căn hộ trong 2 tòa chung cư + nhà riêng ở Phố Nhà Vườn.
// Không yêu cầu cấp độ (Level) — đủ vàng là mua ngay và bước vào nhà sắm dụng cụ nội thất!

/** hạng căn theo giá — quyết định màu thẻ */
const TIERS = [
  { max: 5000, name: 'Bình dân', cls: 'tier-1' },
  { max: 20000, name: 'Trung cấp', cls: 'tier-2' },
  { max: 90000, name: 'Cao cấp', cls: 'tier-3' },
  { max: Infinity, name: 'Hạng sang', cls: 'tier-4' },
];
const tierOf = (h: HouseDef) => TIERS.find((t) => h.price <= t.max)!;

const placeOf = (h: HouseDef) => {
  const t = h.tower ? TOWER_BY_ID[h.tower] : null;
  if (!t) return h.view === 'Phố Nhà Vườn' ? '🏡 Phố Nhà Vườn' : `🏡 Phố Nhà Vườn · ${h.view}`;
  return `${t.emoji} ${t.name} · ${h.floor === t.floors ? 'Tầng thượng' : `Tầng ${h.floor}`}`;
};

/** số phút thu nhập thụ động để hoàn vốn */
const payback = (h: HouseDef) => fmtTime((h.price / h.goldPerMin) * 60_000);

/** Chi tiết 1 căn: thông số, đặc quyền, nút mua / bước vào trong nhà & sắm dụng cụ */
export function PropertyDetail({ id, onEnterHouse }: { id: string; onEnterHouse?: (houseId: string) => void }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const h = HOUSE_BY_ID[id];
  const owned = g.houses.includes(id);
  const tier = tierOf(h);
  const lux = houseLuxuryInfo(h);

  return (
    <section className={`prop-detail ${tier.cls} ${owned ? 'owned' : ''}`}>
      <div className="prop-hero">
        <div className="prop-emoji">{h.emoji}</div>
        <div className="grow">
          <span className="prop-tier">
            {'★'.repeat(lux.stars)} {lux.rankName}
          </span>
          <h2>{h.name}</h2>
          <p className="prop-place">{placeOf(h)}</p>
        </div>
      </div>
      <div className="prop-specs">
        <span>📐 {h.area}</span>
        <span>🪟 {h.view}</span>
        <span>🛋️ +{Math.round(lux.mult * 100)}% hiệu suất dụng cụ</span>
      </div>
      <div className="prop-stats">
        <div>
          <b>+{fmt(h.goldPerMin)}</b>
          <small>🪙 vàng/phút</small>
        </div>
        <div>
          <b>+{pct(h.xp)}</b>
          <small>✨ XP đánh quái</small>
        </div>
        <div>
          <b>{h.hp ? `+${h.hp}` : h.privatePond ? '×3' : '—'}</b>
          <small>{h.privatePond ? '🎣 cá hiếm' : '❤️ HP tối đa'}</small>
        </div>
      </div>
      <ul className="prop-perks">
        {h.perks.map((p) => (
          <li key={p}>✨ {p}</li>
        ))}
        <li>🏛️ Nội thất: {lux.wallDesc} · {lux.floorDesc}</li>
      </ul>
      {owned ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="prop-owned">🔑 Đây là nhà của bạn — đang sinh lời 🪙 {fmt(h.goldPerMin)}/phút</div>
          {onEnterHouse && (
            <button
              className="btn gold block"
              onClick={() => {
                act((g) => selectActiveHouse(g, id));
                onEnterHouse(id);
              }}
            >
              🚪 Bước Vào Nhà & Sắm Dụng Cụ Nội Thất
            </button>
          )}
          <button className="btn block" onClick={() => act((g) => restAtHome(g))}>
            😴 Nghỉ ngơi nhanh (Hồi đầy HP)
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          <div className="prop-price">
            <span>Giá bán (Mua ngay · Không cần cấp độ)</span>
            <b>🪙 {fmt(h.price)}</b>
            <small>Hoàn vốn sau ~{payback(h)} thu nhập thụ động</small>
          </div>
          <button
            className="btn gold block prop-buy"
            disabled={g.gold < h.price}
            onClick={() => {
              if (act((g) => buyHouse(g, id))) {
                sfx.coin();
                onEnterHouse?.(id);
              }
            }}
          >
            {g.gold < h.price ? `Còn thiếu 🪙 ${fmt(h.price - g.gold)}` : '🔑 Ký hợp đồng · Mua & Dọn Vào Ngay'}
          </button>
          {onEnterHouse && (
            <button className="btn ghost block" onClick={() => onEnterHouse(id)}>
              👁 Vào Xem Thử Không Gian Nội Thất
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Thẻ rao bán dùng trong lưới Sàn BĐS */
function ListingCard({ h, on, onPick }: { h: HouseDef; on: boolean; onPick: () => void }) {
  const g = useGame((s) => s.game);
  const owned = g.houses.includes(h.id);
  const tier = tierOf(h);
  const lux = houseLuxuryInfo(h);
  return (
    <button className={`listing ${tier.cls} ${on ? 'on' : ''} ${owned ? 'owned' : ''}`} onClick={onPick}>
      <span className={`listing-badge ${owned ? 'mine' : 'sale'}`}>{owned ? '🔑 CỦA BẠN' : `${'★'.repeat(lux.stars)} ĐANG BÁN`}</span>
      <span className="listing-emoji">{h.emoji}</span>
      <b className="listing-name">{h.name}</b>
      <span className="listing-place">{placeOf(h)}</span>
      <span className="listing-meta">
        📐 {h.area.split(' · ')[0]} · 🪙 +{h.goldPerMin}/ph · 🛋️ +{Math.round(lux.mult * 100)}%
      </span>
      <span className="listing-price">{owned ? '🚪 Đã sở hữu' : `🪙 ${fmt(h.price)}`}</span>
    </button>
  );
}

/** Tổng quan danh mục nhà đang sở hữu */
function Portfolio() {
  const g = useGame((s) => s.game);
  const value = g.houses.reduce((s, id) => s + (HOUSE_BY_ID[id]?.price ?? 0), 0);
  return (
    <div className="portfolio">
      <div>
        <b>
          {g.houses.length}/{HOUSES.length}
        </b>
        <small>🔑 căn sở hữu</small>
      </div>
      <div>
        <b>🪙 {fmt(value)}</b>
        <small>💼 tổng giá trị</small>
      </div>
      <div>
        <b>+{fmt(houseGoldPerMin(g))}</b>
        <small>🪙 vàng/phút</small>
      </div>
      <div>
        <b>
          +{pct(houseXpBonus(g))} · +{houseHp(g)}
        </b>
        <small>✨ XP · ❤️ HP</small>
      </div>
    </div>
  );
}

type Filter = 'all' | 'tower' | 'house' | 'mine';

/** Sàn Bất Động Sản: mọi căn đang rao, lọc theo loại, xem chi tiết, mua tại chỗ & bước vào trong nhà */
export function RealtyView() {
  const g = useGame((s) => s.game);
  const [filter, setFilter] = useState<Filter>('all');
  const firstForSale = HOUSES.find((h) => !g.houses.includes(h.id)) ?? HOUSES[0];
  const [pick, setPick] = useState(firstForSale.id);
  const [insideHouseId, setInsideHouseId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const list = useMemo(
    () =>
      HOUSES.filter((h) => (filter === 'tower' ? !!h.tower : filter === 'house' ? !h.tower : filter === 'mine' ? g.houses.includes(h.id) : true)).sort(
        (a, b) => a.price - b.price,
      ),
    [filter, g.houses],
  );
  const choose = (id: string) => {
    setPick(id);
    sfx.open();
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  if (insideHouseId) {
    return (
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <b>🏠 Đang ở trong: {HOUSE_BY_ID[insideHouseId]?.name}</b>
          <button className="btn sm ghost" onClick={() => setInsideHouseId(null)}>
            ⬅️ Quay lại Sàn Bất Động Sản
          </button>
        </div>
        <HouseInteriorView initialHouseId={insideHouseId} />
      </div>
    );
  }

  return (
    <div className="realty">
      <div className="realty-sign">
        <span className="realty-sign-top">🏙️ SÀN GIAO DỊCH TRỰC TUYẾN</span>
        <b>BẤT ĐỘNG SẢN & NỘI THẤT HOÀNG KIM</b>
        <small>Không giới hạn cấp độ · Đủ vàng là mua ngay · Nhà càng đắt nội thất càng xịn</small>
      </div>
      <Quote
        text="Không cần cày cấp, không cần chạy bộ đi xa! Cứ đủ vàng là ký hợp đồng nhận nhà ngay, bước vào nhà sắm sửa Giường Hoàng Gia, Bếp 5 Sao, Bồn Jacuzzi để sinh lời mỗi phút!"
        who="Môi giới Kim"
      />
      <Portfolio />
      <div className="tabs">
        {(
          [
            ['all', `🏘️ Tất cả (${HOUSES.length})`],
            ['tower', `🏢 Chung cư (${HOUSES.filter((h) => h.tower).length})`],
            ['house', `🏡 Nhà riêng (${HOUSES.filter((h) => !h.tower).length})`],
            ['mine', `🔑 Của tôi (${g.houses.length})`],
          ] as [Filter, string][]
        ).map(([k, t]) => (
          <button key={k} className={`tab-btn ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
            {t}
          </button>
        ))}
      </div>
      <div className="realty-split">
        <div className="listing-grid">
          {list.map((h) => (
            <ListingCard key={h.id} h={h} on={pick === h.id} onPick={() => choose(h.id)} />
          ))}
          {!list.length && <p className="muted center">Bạn chưa có căn nào — chọn tab "Tất cả" để xem hàng đang bán.</p>}
        </div>
        <div ref={detailRef}>
          <PropertyDetail id={pick} onEnterHouse={(id) => setInsideHouseId(id)} />
        </div>
      </div>
    </div>
  );
}

/** cư dân ở các căn không bán — mỗi tòa cố định */
const RESIDENTS = ['👨‍👩‍👧', '👵', '🧑‍🎨', '👨‍🍳', '🧙', '👩‍🚀', '🧑‍💻', '👮', '🧑‍🌾', '💃', '🐱', '🧛'];

/** Sảnh tòa chung cư: mặt cắt tòa nhà, chọn căn theo tầng */
export function TowerView({ id }: { id: string }) {
  const g = useGame((s) => s.game);
  const t = TOWER_BY_ID[id];
  const units = towerUnits(id);
  const bySlot = new Map<string, HouseDef>();
  for (const h of units) for (const sl of unitSlots(h)) bySlot.set(`${h.floor}:${sl}`, h);
  const left = units.filter((h) => !g.houses.includes(h.id)).length;
  const [pick, setPick] = useState((units.find((h) => !g.houses.includes(h.id)) ?? units[0]).id);
  const [insideHouseId, setInsideHouseId] = useState<string | null>(null);

  if (insideHouseId) {
    return (
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <b>🏢 Đang ở trong căn hộ: {HOUSE_BY_ID[insideHouseId]?.name}</b>
          <button className="btn sm ghost" onClick={() => setInsideHouseId(null)}>
            ⬅️ Ra sảnh {t.name}
          </button>
        </div>
        <HouseInteriorView initialHouseId={insideHouseId} />
      </div>
    );
  }

  const floors = Array.from({ length: t.floors }, (_, i) => t.floors - i);
  return (
    <div className={`tower-view tv-${id}`}>
      <div className="tower-hero">
        <span className="tower-hero-emoji">{t.emoji}</span>
        <div className="grow">
          <h2>{t.name}</h2>
          <p>{t.slogan}</p>
        </div>
        <span className="tower-count">
          <b>{left}</b>
          <small>căn đang bán</small>
        </span>
      </div>
      <div className="realty-split">
        <div className="tower-cut" style={{ '--cols': t.perFloor } as CSSProperties}>
          <div className="tower-roof">{id === 'sky' ? '🚁 Sân bay trực thăng · Vương miện vàng' : '🌿 Vườn trên mái · Bể nước'}</div>
          {floors.map((f) => {
            if (f === 1) {
              return (
                <div key={f} className="tower-floor lobby">
                  <span className="floor-no">T1</span>
                  <div className="unit lobby-cell">🛎️ Sảnh lễ tân · 🛗 Thang máy · 🏋️ Gym</div>
                </div>
              );
            }
            const whole = units.find((h) => h.floor === f && h.wholeFloor);
            const cells = whole ? [whole] : Array.from({ length: t.perFloor }, (_, sl) => bySlot.get(`${f}:${sl}`) ?? null);
            return (
              <div key={f} className={`tower-floor ${whole ? 'whole' : ''}`}>
                <span className="floor-no">{whole ? 'PH' : `T${f}`}</span>
                {cells.map((h, sl) => {
                  if (!h) {
                    return (
                      <div key={sl} className="unit taken" title="Đã có chủ">
                        <span>{RESIDENTS[(f * 7 + sl * 3 + id.length) % RESIDENTS.length]}</span>
                        <small>Đã có chủ</small>
                      </div>
                    );
                  }
                  const owned = g.houses.includes(h.id);
                  return (
                    <button
                      key={sl}
                      className={`unit sale ${tierOf(h).cls} ${owned ? 'owned' : ''} ${pick === h.id ? 'on' : ''}`}
                      onClick={() => {
                        setPick(h.id);
                        sfx.open();
                      }}
                    >
                      <span>{owned ? '🔑' : h.emoji}</span>
                      <small>{owned ? 'Nhà bạn' : `🪙 ${fmt(h.price)}`}</small>
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="tower-ground" />
        </div>
        <PropertyDetail id={pick} onEnterHouse={(hid) => setInsideHouseId(hid)} />
      </div>
      <p className="muted small center">Mẹo: Bấm vào bất kỳ căn hộ nào để mua ngay (không cần cấp độ) hoặc bước vào trang trí nội thất!</p>
    </div>
  );
}
