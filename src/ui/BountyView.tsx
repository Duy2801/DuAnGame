import { MONSTERS } from '../game/config/combat';
import { ZONE_DEFS, zoneLevel } from '../game/config/zones';
import { bountyReward, claimBounty } from '../game/logic/bounty';
import { fmt, fmtTime, nextMidnight } from '../game/utils';
import { useGame } from '../store';
import { Bar } from './common';

export function BountyView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);

  return (
    <>
      <p className="muted small">"Mỗi ngày Hội treo thưởng cho 3 loài quái ở các vùng bạn đã tới. Hạ đủ rồi quay lại nhé!" — Thư ký Mai</p>
      <div className="row between small">
        <span>
          🗺️ Vùng xa nhất đã tới: <b>{g.maxZone || '—'}</b>
        </span>
        <span className="muted">Làm mới sau {fmtTime(nextMidnight(now) - now)}</span>
      </div>
      <div className="list" style={{ marginTop: 10 }}>
        {g.bounties.list.map((b, i) => {
          const m = MONSTERS[b.monster];
          const z = ZONE_DEFS[b.zone - 1];
          const r = bountyReward(b.monster, b.n);
          const done = b.progress >= b.n;
          return (
            <div key={i} className={`bounty ${b.claimed ? 'claimed' : ''}`}>
              <div className="bounty-head">
                <span className="tag">Vùng {b.zone}</span>
                <b>{z.name}</b>
                <small className="muted">Lv {zoneLevel(b.zone)}+</small>
              </div>
              <div>
                🎯 Hạ <b>{b.n}</b> {m.name}
              </div>
              <Bar value={b.progress / b.n} tone="gold" />
              <div className="row between small">
                <span>
                  {b.progress}/{b.n}
                </span>
                <span className="next">
                  🪙{fmt(r.gold)} · ✨{fmt(r.xp)} XP
                </span>
              </div>
              {b.claimed ? (
                <span className="tag ok">✓ Đã nhận</span>
              ) : (
                <button className="btn sm gold" disabled={!done} onClick={() => act((g) => claimBounty(g, i))}>
                  {done ? '🎁 Nhận thưởng' : 'Đang săn…'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="small muted">Mẹo: đi càng xa, nhiệm vụ càng thưởng lớn. Ra cổng phía đông Khu Mạo Hiểm Giả để vào vùng 1.</p>
    </>
  );
}
