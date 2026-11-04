import { ITEMS } from '../game/config/farm';
import { ORDER_NPC_BY_ID } from '../game/config/orders';
import { itemCount } from '../game/logic/core';
import { canDeliver, deliverOrder, skipOrder } from '../game/logic/orders';
import { sellPrice } from '../game/logic/market';
import { dayKey, fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';

/** Bảng Đơn Hàng: giao combo hàng cho dân làng, lời hơn bán chợ + XP + có khi kim cương */
export function OrdersView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const day = dayKey(now);

  return (
    <>
      <p className="muted small">
        Dân làng đặt hàng, trả giá <b>cao gấp ~2 lần</b> giá gốc kèm XP. Hàng lấy từ ruộng, chuồng, hồ câu, bếp và quái vật — chơi gì cũng có đơn để giao!
      </p>
      <div className="orders">
        {g.orders.map((s, i) => {
          if (!s.order) {
            return (
              <div key={i} className="order waiting">
                <span className="order-npc">⏳</span>
                <div className="grow">
                  <b>Đang chờ đơn mới</b>
                  <small className="muted">Có đơn sau {fmtTime(Math.max(0, s.readyAt - now))}</small>
                </div>
              </div>
            );
          }
          const o = s.order;
          const npc = ORDER_NPC_BY_ID[o.npc];
          const ok = canDeliver(g, o);
          const marketValue = Object.entries(o.items).reduce((sum, [id, n]) => sum + sellPrice(id, day) * n, 0);
          return (
            <div key={i} className={`order ${ok ? 'ready' : ''}`}>
              <span className="order-npc">{npc.emoji}</span>
              <div className="grow">
                <b>{npc.name}</b>
                <small className="order-line">“{o.line}”</small>
                <div className="order-items">
                  {Object.entries(o.items).map(([id, n]) => {
                    const have = itemCount(g, id);
                    return (
                      <span key={id} className={`order-item ${have >= n ? 'ok' : ''}`} title={ITEMS[id].name}>
                        {ITEMS[id].emoji} {ITEMS[id].name} <b>{Math.min(have, n)}/{n}</b>
                      </span>
                    );
                  })}
                </div>
                <div className="order-reward">
                  🪙 <b>{fmt(o.gold)}</b> · ⭐ {fmt(o.xp)} XP{o.gems > 0 && <> · 💎 {o.gems}</>}
                  <small className="muted"> (bán chợ chỉ được 🪙{fmt(marketValue)})</small>
                </div>
              </div>
              <div className="order-btns">
                <button className="btn sm gold" disabled={!ok} onClick={() => act((g, now) => deliverOrder(g, i, now))}>
                  Giao hàng
                </button>
                <button className="btn sm ghost" onClick={() => act((g, now) => skipOrder(g, i, now))} title="Bỏ đơn này, đơn mới tới sau 10 phút">
                  Bỏ qua
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="small muted center">📦 Đã giao {fmt(g.stats.orders)} đơn</p>
    </>
  );
}
