import { GEAR } from '../game/config/combat';
import { ITEMS } from '../game/config/farm';
import { itemCount } from '../game/logic/core';
import { playerStats, upgradeGear } from '../game/logic/player';
import type { GearSlot } from '../game/types';
import { fmt } from '../game/utils';
import { useGame } from '../store';

export function SmithView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const st = playerStats(g);

  return (
    <>
      <p className="muted small">"Mang vàng và chiến lợi phẩm từ quái tới đây, ta rèn cho ngươi đồ xịn!" — Thợ rèn Thiết</p>
      <div className="stats-row">
        <div>
          <b>⚔️ {st.atk}</b>
          <small>Tấn công</small>
        </div>
        <div>
          <b>❤️ {st.maxHp}</b>
          <small>HP tối đa</small>
        </div>
        <div>
          <b>🛡️ {st.def}</b>
          <small>Phòng thủ</small>
        </div>
      </div>
      {(Object.keys(GEAR) as GearSlot[]).map((slot) => {
        const def = GEAR[slot];
        const lvl = g.player.gear[slot];
        const maxed = lvl >= def.max;
        const cost = def.cost(lvl);
        const enough = g.gold >= cost.gold && Object.entries(cost.items).every(([id, n]) => itemCount(g, id) >= n);
        return (
          <section key={slot} className="card building">
            <div className="building-icon">{def.emoji}</div>
            <div className="grow">
              <div className="row between">
                <b>
                  {def.name} +{lvl}
                </b>
                <span className="tag">
                  {lvl}/{def.max}
                </span>
              </div>
              <div className="small next">Mỗi cấp: {def.perLevel}</div>
              {!maxed && (
                <div className="small">
                  Cần: <span className={g.gold >= cost.gold ? 'have' : 'need'}>🪙{fmt(cost.gold)}</span>{' '}
                  {Object.entries(cost.items).map(([id, n]) => (
                    <span key={id} className={itemCount(g, id) >= n ? 'have' : 'need'}>
                      {ITEMS[id].emoji}
                      {itemCount(g, id)}/{n}{' '}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button className="btn gold sm" disabled={maxed || !enough} onClick={() => act((g) => upgradeGear(g, slot))}>
              {maxed ? 'Tối đa' : 'Rèn'}
            </button>
          </section>
        );
      })}
    </>
  );
}
