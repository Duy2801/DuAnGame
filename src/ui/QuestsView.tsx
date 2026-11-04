import { useState } from 'react';
import { CHESTS, DAILY_BY_ID, LOGIN_REWARDS } from '../game/config/meta';
import { achClaimableCount, onlineGiftReadyCount, wheelFree } from '../game/logic/rewards';
import { AchievementsView, GiftsView } from './RewardsView';
import { rewardText } from '../game/logic/core';
import { chestReward, claimChest, claimLogin, claimQuest, loginState } from '../game/logic/meta';
import { fmt, fmtTime, nextMidnight } from '../game/utils';
import { useGame } from '../store';
import { Bar, Modal } from './common';

export function QuestsView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const maxPoints = CHESTS[CHESTS.length - 1].points;
  const [tab, setTab] = useState<'daily' | 'ach' | 'gift'>('daily');
  const achN = achClaimableCount(g);
  const giftN = onlineGiftReadyCount(g) + (wheelFree(g, now) ? 1 : 0);
  const tabs = (
    <div className="tabs">
      <button className={`tab-btn ${tab === 'daily' ? 'on' : ''}`} onClick={() => setTab('daily')}>
        📜 Hằng ngày
      </button>
      <button className={`tab-btn ${tab === 'ach' ? 'on' : ''}`} onClick={() => setTab('ach')}>
        🏅 Thành tựu{achN > 0 && <i className="tab-badge">{achN}</i>}
      </button>
      <button className={`tab-btn ${tab === 'gift' ? 'on' : ''}`} onClick={() => setTab('gift')}>
        🎁 Quà & Vòng quay{giftN > 0 && <i className="tab-badge">{giftN}</i>}
      </button>
    </div>
  );
  if (tab === 'ach') return <>{tabs}<AchievementsView /></>;
  if (tab === 'gift') return <>{tabs}<GiftsView /></>;

  return (
    <>
      {tabs}
      <section className="card">
        <h2>📅 Điểm danh 7 ngày</h2>
        <LoginCalendar />
      </section>

      <section className="card">
        <div className="row between">
          <h2>📜 Nhiệm vụ hằng ngày</h2>
          <small className="muted">Làm mới sau {fmtTime(nextMidnight(now) - now)}</small>
        </div>

        <div className="activity">
          <div className="row between small">
            <span>⚡ Điểm hoạt động</span>
            <b>
              {g.daily.points}/{maxPoints}
            </b>
          </div>
          <Bar value={g.daily.points / maxPoints} tone="gold" />
          <div className="chests">
            {CHESTS.map((c, i) => {
              const claimed = g.daily.chests.includes(i);
              const ready = !claimed && g.daily.points >= c.points;
              return (
                <button
                  key={i}
                  className={`chest ${claimed ? 'claimed' : ready ? 'ready' : ''}`}
                  disabled={!ready}
                  title={rewardText(chestReward(g, i))}
                  onClick={() => act((g) => claimChest(g, i))}
                >
                  <span>{claimed ? '✅' : ready ? '🎁' : '📦'}</span>
                  <small>{c.points}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="list">
          {g.daily.quests.map((q) => {
            const def = DAILY_BY_ID[q.id];
            const done = q.progress >= def.target;
            return (
              <div key={q.id} className={`quest ${q.claimed ? 'claimed' : ''}`}>
                <div className="grow">
                  <div>{def.text}</div>
                  <Bar value={q.progress / def.target} />
                  <small className="muted">
                    {fmt(q.progress)}/{fmt(def.target)}
                  </small>
                </div>
                {q.claimed ? (
                  <span className="tag ok">✓ Xong</span>
                ) : (
                  <button className="btn sm" disabled={!done} onClick={() => act((g) => claimQuest(g, q.id))}>
                    +{def.points} ⚡
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function LoginCalendar({ onClaimed }: { onClaimed?: () => void }) {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const s = loginState(g, now);

  return (
    <>
      <div className="login-grid">
        {LOGIN_REWARDS.map((r, i) => {
          const done = i <= s.doneUpTo;
          const today = i === s.nextIndex && s.canClaim;
          return (
            <div key={i} className={`login-day ${done ? 'done' : ''} ${today ? 'today' : ''} ${i === 6 ? 'big' : ''}`}>
              <small>Ngày {i + 1}</small>
              <span>{done ? '✅' : rewardText(r)}</span>
            </div>
          );
        })}
      </div>
      <button
        className="btn block"
        disabled={!s.canClaim}
        onClick={() => {
          if (act((g, now) => claimLogin(g, now))) onClaimed?.();
        }}
      >
        {s.canClaim ? `Điểm danh ngày ${s.nextIndex + 1}` : 'Hôm nay đã điểm danh — mai quay lại nhé!'}
      </button>
    </>
  );
}

export function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="📅 Quà đăng nhập hằng ngày" onClose={onClose}>
      <p className="small muted">Đăng nhập liên tục 7 ngày để nhận quà lớn. Bỏ một ngày sẽ phải bắt đầu lại!</p>
      <LoginCalendar onClaimed={onClose} />
    </Modal>
  );
}
