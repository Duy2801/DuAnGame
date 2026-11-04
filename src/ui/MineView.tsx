import { useState } from 'react';
import { ITEMS } from '../game/config/farm';
import { MINE_CHECKPOINT, MINE_COLS, PICKAXES, ROCK_BY_ID } from '../game/config/mine';
import { itemCount } from '../game/logic/core';
import {
  descend, eatForEnergy, energyNow, enterMine, hitRock, leaveMine, maxEnergy, mineStarts, nextEnergyMs, upgradePick,
} from '../game/logic/mine';
import { fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';
import { sfx } from '../world/sfx';
import { Bar, Quote } from './common';

/** Hang Mỏ Đá Ngầm: lưới đá, đập ra quặng, tìm thang xuống tầng sâu hơn */
export function MineView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const apply = useGame((s) => s.apply);
  const [pops, setPops] = useState<Record<number, { text: string; id: number }>>({});
  const [shake, setShake] = useState<number | null>(null);
  const run = g.mine.run;
  const energy = energyNow(g, now);
  const max = maxEnergy(g);
  const pick = PICKAXES[g.mine.pick];
  const nextPick = PICKAXES[g.mine.pick + 1];

  const hit = (i: number) => {
    const res = apply((g, now) => hitRock(g, i, now));
    if (!res) return;
    setShake(i);
    window.setTimeout(() => setShake((s) => (s === i ? null : s)), 160);
    if (!res.broken) return sfx.hit();
    if (res.ladder) sfx.levelUp();
    else if (res.text) sfx.coin();
    else sfx.harvest();
    if (res.text) {
      const id = Date.now();
      setPops((p) => ({ ...p, [i]: { text: res.text, id } }));
      window.setTimeout(() => setPops((p) => (p[i]?.id === id ? (({ [i]: _, ...rest }) => rest)(p) : p)), 1100);
    }
  };

  const energyBox = (
    <div className="mine-energy">
      <div className="row between small">
        <b>⚡ Thể lực {energy}/{max}</b>
        <span className="muted">{energy < max ? `+1 sau ${fmtTime(nextEnergyMs(g, now))}` : 'Đầy'}</span>
      </div>
      <Bar value={energy / max} tone="blue" />
    </div>
  );

  if (!run) {
    return (
      <>
        <Quote text="Dưới lòng đất toàn của quý đó cháu! Đập đá tìm thang 🪜 để xuống sâu — càng sâu quặng càng xịn. Cứ 10 tầng có thang máy." who="Lão Thợ Mỏ" />
        <section className="card">
          {energyBox}
          <div className="mine-info">
            <span>🏔️ Sâu nhất: <b>tầng {g.mine.deepest}</b></span>
            <span>
              {pick.emoji} {pick.name} · sức đập <b>{pick.power}</b>
            </span>
          </div>
          <h3 className="small">Chọn tầng xuất phát</h3>
          <div className="mine-starts">
            {mineStarts(g).map((f) => (
              <button key={f} className="btn gold" onClick={() => act((g) => enterMine(g, f))}>
                {f === 1 ? '⛏️ Tầng 1' : `🛗 Tầng ${f}`}
              </button>
            ))}
          </div>
          <p className="small muted">Mỗi nhát cuốc tốn 1 ⚡. Thể lực tự hồi kể cả khi offline. Ăn đồ ăn trong hang để hồi nhanh.</p>
        </section>
        <section className="card">
          <h2>⛏️ Lò cuốc</h2>
          {nextPick?.name && pick.cost ? (
            <div className="shop-item">
              <span className="big-emoji">{nextPick.emoji}</span>
              <div className="grow">
                <b>{nextPick.name}</b>
                <div className="small next">
                  Sức đập {pick.power} → {nextPick.power} · ⚡ tối đa +15
                </div>
                <div className="small">
                  🪙{fmt(pick.cost.gold)}{' '}
                  {Object.entries(pick.cost.items).map(([id, n]) => (
                    <span key={id} className={itemCount(g, id) >= n ? 'have' : 'need'}>
                      {ITEMS[id].emoji}
                      {itemCount(g, id)}/{n}{' '}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn sm gold" onClick={() => act((g) => upgradePick(g))}>
                Nâng cấp
              </button>
            </div>
          ) : (
            <p className="muted">Cuốc đã đạt cấp tối đa 💎</p>
          )}
          <p className="small muted">Quặng dùng để cường hóa vũ khí/giáp ở Lò rèn, nâng cuốc, giao đơn hàng cho Thợ rèn Hùng hoặc bán ở chợ.</p>
        </section>
      </>
    );
  }

  const nextCheckpoint = Math.ceil((run.floor + 1) / MINE_CHECKPOINT) * MINE_CHECKPOINT;
  return (
    <>
      <div className="mine-head">
        <b className="mine-floor">🏔️ Tầng {run.floor}</b>
        <small className="muted">Thang máy kế: tầng {nextCheckpoint}</small>
      </div>
      {energyBox}
      <div className="mine-grid" style={{ gridTemplateColumns: `repeat(${MINE_COLS}, 1fr)` }}>
        {run.cells.map((c, i) => {
          const r = ROCK_BY_ID[c.rock];
          const dmg = c.hp > 0 ? 1 - c.hp / c.max : 1;
          return (
            <button
              key={i}
              className={`rock ${c.hp <= 0 ? 'broken' : ''} ${shake === i ? 'shake' : ''} crack-${Math.min(3, Math.ceil(dmg * 3))} r-${c.rock}`}
              style={{ ['--c' as string]: r.color, ['--s' as string]: r.speck }}
              disabled={c.hp <= 0}
              onClick={() => hit(i)}
              title={c.hp > 0 ? `${r.name} · còn ${c.hp} nhát` : ''}
            >
              {c.hp <= 0 ? <span className="rock-got">{c.ladder ? '🪜' : c.got || ''}</span> : c.rock === 'chest' ? <span>🧰</span> : null}
              {c.hp > 0 && c.max > 1 && <i className="rock-hp" style={{ width: `${(c.hp / c.max) * 100}%` }} />}
              {pops[i] && <em className="rock-pop">{pops[i].text}</em>}
            </button>
          );
        })}
      </div>
      <div className="mine-actions">
        <button className="btn gold" disabled={!run.ladder} onClick={() => act((g) => descend(g))}>
          {run.ladder ? '🪜 Xuống tầng tiếp' : '🔍 Tìm thang...'}
        </button>
        <button className="btn ghost" onClick={() => act((g, now) => eatForEnergy(g, now))}>
          🍞 Ăn hồi ⚡
        </button>
        <button className="btn ghost" onClick={() => act((g) => leaveMine(g))}>
          ☀️ Lên
        </button>
      </div>
      <p className="small muted center">
        {pick.emoji} {pick.name} (đập {pick.power}) · Quặng đã đào: {fmt(g.stats.ores)}
      </p>
    </>
  );
}
