import { CROPS, ITEMS } from '../game/config/farm';
import { useState } from 'react';
import { HOT_MULT, hotItem, priceMult, sell, sellAllCrops, sellPrice } from '../game/logic/market';
import { readyOrderCount } from '../game/logic/orders';
import { OrdersView } from './OrdersView';
import type { ItemKind } from '../game/types';
import { dayKey, fmt } from '../game/utils';
import { useGame } from '../store';

const KIND_LABEL: Record<ItemKind, string> = {
  crop: 'Nông sản', seed: 'Hạt giống', food: 'Đồ ăn', material: 'Chiến lợi phẩm', fish: 'Cá', animal: 'Sản phẩm chăn nuôi', potion: 'Bình máu', bait: 'Mồi câu', ore: 'Quặng & đá quý',
};
const KIND_ORDER: ItemKind[] = ['crop', 'fish', 'animal', 'food', 'ore', 'potion', 'bait', 'seed', 'material'];

const trend = (m: number) => `${m >= 1 ? '+' : ''}${Math.round((m - 1) * 100)}%`;
const trendClass = (m: number) => (m >= 1.2 ? 'up' : m <= 0.85 ? 'down' : 'flat');

export function MarketView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const day = dayKey(now);
  const [tab, setTab] = useState<'orders' | 'sell'>('orders');
  const hot = ITEMS[hotItem(day)];
  const ready = readyOrderCount(g);

  const owned = Object.entries(g.inventory)
    .filter(([id, n]) => n > 0 && ITEMS[id])
    .map(([id, n]) => ({ item: ITEMS[id], n }))
    .sort((a, b) => KIND_ORDER.indexOf(a.item.kind) - KIND_ORDER.indexOf(b.item.kind));
  const cropTotal = owned.filter((x) => x.item.kind === 'crop').reduce((s, x) => s + x.n * sellPrice(x.item.id, day), 0);

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'orders' ? 'on' : ''}`} onClick={() => setTab('orders')}>
          📋 Đơn hàng{ready > 0 && <i className="tab-badge">{ready}</i>}
        </button>
        <button className={`tab-btn ${tab === 'sell' ? 'on' : ''}`} onClick={() => setTab('sell')}>
          🏪 Bán đồ
        </button>
      </div>
      <div className="hot-item">
        <span className="big-emoji">{hot.emoji}</span>
        <div className="grow">
          <small>🔥 MẶT HÀNG HOT HÔM NAY</small>
          <b>
            {hot.name} · giá ×{HOT_MULT} = 🪙{fmt(sellPrice(hot.id, day))}/cái
          </b>
        </div>
        {(g.inventory[hot.id] ?? 0) > 0 && <span className="tag ok">Bạn có ×{g.inventory[hot.id]}</span>}
      </div>
      {tab === 'orders' ? (
        <OrdersView />
      ) : (
        <>
      <section className="card">
        <h2>📈 Giá hôm nay</h2>
        <p className="muted small">Giá đổi mỗi ngày lúc 0h. Trồng đúng loại đang được giá để lời to!</p>
        <div className="price-grid">
          {CROPS.map((c) => {
            const m = priceMult(c.id, day);
            return (
              <div key={c.id} className="price">
                <span className="big-emoji">{c.emoji}</span>
                <b>🪙{fmt(sellPrice(c.id, day))}</b>
                <small className={trendClass(m)}>
                  {m >= 1.2 && '🔥 '}
                  {trend(m)}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <h2>📦 Kho đồ</h2>
          <button className="btn sm gold" disabled={!cropTotal} onClick={() => act((g, now) => sellAllCrops(g, now))}>
            Bán hết nông sản · 🪙{fmt(cropTotal)}
          </button>
        </div>
        {owned.length === 0 ? (
          <p className="muted">Kho trống — ra đồng thu hoạch thôi!</p>
        ) : (
          <div className="list">
            {owned.map(({ item, n }) => (
              <div key={item.id} className="inv-row">
                <span className="big-emoji">{item.emoji}</span>
                <div className="grow">
                  <b>{item.name}</b> <span className="muted">×{n}</span>
                  <div className="small muted">
                    {KIND_LABEL[item.kind]} · 🪙{fmt(sellPrice(item.id, day))}/cái
                  </div>
                </div>
                <button className="btn sm ghost" onClick={() => act((g, now) => sell(g, item.id, 1, now))}>
                  Bán 1
                </button>
                <button className="btn sm gold" onClick={() => act((g, now) => sell(g, item.id, n, now))}>
                  Bán hết
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </>
  );
}
