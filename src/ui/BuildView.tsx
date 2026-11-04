import { BUILDINGS } from '../game/config/farm';
import { offlineCapMs, passiveRate, upgradeBuilding } from '../game/logic/farm';
import { fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';

export function BuildView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);

  return (
    <>
      <section className="card">
        <h2>🏗️ Đầu tư nông trại</h2>
        <p className="muted small">Vàng kiếm từ Hội hãy đổ vào đây. Công trình làm việc cả khi bạn tắt game.</p>
        <div className="stats-row">
          <div>
            <b>🪙 {fmt(passiveRate(g) * 60)}</b>
            <small>vàng/phút</small>
          </div>
          <div>
            <b>⏳ {offlineCapMs(g) / 3_600_000}g</b>
            <small>tích lũy offline</small>
          </div>
          <div>
            <b>🌱 -{g.buildings.well * 8}%</b>
            <small>thời gian lớn</small>
          </div>
        </div>
      </section>

      {BUILDINGS.map((b) => {
        const lvl = g.buildings[b.id];
        const maxed = lvl >= b.maxLevel;
        const cost = maxed ? 0 : b.cost(lvl);
        return (
          <section key={b.id} className="card building">
            <div className="building-icon">{b.emoji}</div>
            <div className="grow">
              <div className="row between">
                <b>{b.name}</b>
                <span className="tag">
                  Cấp {lvl}/{b.maxLevel}
                </span>
              </div>
              <div className="small">{b.effect(lvl)}</div>
              {!maxed && <div className="small next">→ {b.effect(lvl + 1)}</div>}
              {b.id === 'windmill' && !maxed && (
                <div className="small muted">Hoàn vốn sau ~{fmtTime((cost / 5) * 60_000)}</div>
              )}
            </div>
            <button className="btn gold sm" disabled={maxed || g.gold < cost} onClick={() => act((g) => upgradeBuilding(g, b.id))}>
              {maxed ? (
                'Tối đa'
              ) : (
                <>
                  {lvl === 0 ? 'Xây' : 'Nâng'}
                  <br />
                  🪙 {fmt(cost)}
                </>
              )}
            </button>
          </section>
        );
      })}
    </>
  );
}
