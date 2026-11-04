import { NPC_LOOKS } from '../art/avatar';
import { BUFF_INFO } from '../game/config/buffs';
import { HEAL_ITEMS } from '../game/config/combat';
import { ITEMS, RECIPE_BY_ID } from '../game/config/farm';
import { BAKERY_DEAL, BAKERY_MENU } from '../game/config/mall';
import { itemCount } from '../game/logic/core';
import { bakeryDeal, bakeryPrice, buyBakery } from '../game/logic/mall';
import { fmt, pct } from '../game/utils';
import { useGame } from '../store';
import { pushAllDebounced } from '../services/online';
import { AvatarView } from './AvatarView';
import { LuckyWheel } from './RewardsView';

// Khu Mua Sắm: Tiệm Bánh & Cà Phê Cô Ba · quầy Vòng Quay May Mắn

function buffText(id: string) {
  const b = RECIPE_BY_ID[id]?.buff;
  return b ? `${BUFF_INFO[b.id].emoji} ${BUFF_INFO[b.id].desc(b.value)} · ${b.min}′` : '';
}

export function BakeryView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const deal = bakeryDeal(now);
  const menu = [deal, ...BAKERY_MENU.filter((id) => id !== deal)];

  return (
    <div className="gshop gs-bakery">
      <header className="gshop-sign">
        <div className="fshop-npc">
          <AvatarView look={NPC_LOOKS.npc_baker} scale={3} />
        </div>
        <div className="fshop-title">
          <small>Khu Mua Sắm · Thị Trấn Khởi Nguyên</small>
          <h2>Tiệm Bánh & Cà Phê Cô Ba</h2>
          <p>"Không rảnh vào bếp thì ghé cô! Món nào cũng hồi máu và có buff — ăn bằng phím Q hoặc trong Hành trang." — Cô Ba</p>
          <div className="fshop-badges">
            <span>🔥 Món hôm nay −{pct(BAKERY_DEAL)}</span>
            <span>🍳 Tự nấu ở Bếp vẫn rẻ hơn</span>
          </div>
        </div>
        <div className="fshop-side">
          <div className="fshop-wallet">
            <span>🪙 {fmt(g.gold)}</span>
            <span>💎 {fmt(g.gems)}</span>
          </div>
        </div>
      </header>

      <div className="bake-grid">
        {menu.map((id) => {
          const price = bakeryPrice(id, now);
          const hot = id === deal;
          return (
            <div key={id} className={`bake-card ${hot ? 'hot' : ''}`}>
              {hot && <span className="bake-hot">🔥 Món hôm nay −{pct(BAKERY_DEAL)}</span>}
              <span className="bake-emoji">{ITEMS[id].emoji}</span>
              <b>{ITEMS[id].name}</b>
              <small className="bake-heal">❤️ +{HEAL_ITEMS[id] ?? 0} HP</small>
              <small className="bake-buff">{buffText(id)}</small>
              <small className="bake-have">Đang có {itemCount(g, id)}</small>
              <div className="bake-btns">
                {[1, 5].map((n) => (
                  <button
                    key={n}
                    className="btn sm gold"
                    disabled={g.gold < price * n}
                    onClick={() => {
                      act((g, now) => buyBakery(g, id, n, now));
                      pushAllDebounced();
                    }}
                  >
                    ×{n} · 🪙{fmt(price * n)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** quầy Vòng Quay ở Khu Mua Sắm — cùng vòng quay & lượt quay với mục 🎁 Quà */
export function WheelView() {
  return (
    <div className="mall-wheel">
      <p>
        🎪 Chú hề vẫy tay: <i>"Quay thử vận may đi! Mỗi ngày lượt đầu miễn phí."</i>
      </p>
      <LuckyWheel />
    </div>
  );
}
