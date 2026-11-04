import { useEffect, useState } from 'react';
import { WEEK_REWARDS } from '../game/config/meta';
import { BOARDS, TIER_COLOR, TIER_NAME, TITLE_BY_ID, topTitleId, type BoardId } from '../game/config/titles';
import { weekRewardGems } from '../game/logic/meta';
import { boardEntries, lastWeekRank, playerRank } from '../game/logic/ranks';
import { WEEK_MS, fmt, fmtTime, weekStart } from '../game/utils';
import { useGame } from '../store';
import { BoardSource } from './AuthPanel';
import { refreshBoards } from '../services/online';

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const [tab, setTab] = useState<BoardId>('gold');

  useEffect(() => {
    void refreshBoards();
  }, [tab]);

  const b = BOARDS.find((x) => x.id === tab)!;
  const board = boardEntries(g, now, tab);
  const myRank = playerRank(g, now, tab);
  const last = b.weekly ? lastWeekRank(g, tab) : 0;
  const myScore = board.find((e) => e.isPlayer)!.score;

  return (
    <>
      <div className="tabs rank-tabs">
        {BOARDS.map((x) => (
          <button key={x.id} className={`tab-btn ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>
            {x.icon} {x.name}
          </button>
        ))}
      </div>

      <section className="card">
        <h2>
          {b.icon} Bảng {b.name}
        </h2>
        <p className="muted small">
          {b.desc}.{' '}
          {b.weekly ? (
            <>
              Chốt bảng sau <b>{fmtTime(weekStart(now) + WEEK_MS - now)}</b>.
            </>
          ) : (
            'Bảng không reset.'
          )}
        </p>
        <div className="my-rank">
          <div>
            <small>Hạng của bạn</small>
            <b>{myRank ? `#${myRank}` : '—'}</b>
          </div>
          <div>
            <small>{b.weekly ? 'Tuần này' : 'Hiện tại'}</small>
            <b>
              {b.icon} {fmt(myScore)} {b.unit}
            </b>
          </div>
          {tab === 'gold' ? (
            <div>
              <small>Thưởng hiện tại</small>
              <b>💎 {weekRewardGems(myRank || 99)}</b>
            </div>
          ) : (
            <div>
              <small>Tuần trước</small>
              <b>{last ? `#${last}` : '—'}</b>
            </div>
          )}
        </div>
        {tab === 'gold' && (
          <div className="chips">
            {WEEK_REWARDS.map((r) => (
              <span key={r.top} className="chip static">
                Top {r.top}: 💎{r.gems}
              </span>
            ))}
          </div>
        )}

        <div className="row between top-titles-header">
          <h3 className="small">🏷️ Tranh Đua Danh Hiệu Top 5</h3>
          <small className="muted">Cập nhật theo thời gian thực</small>
        </div>
        <div className="top-titles">
          {b.titles.map((_, i) => {
            const rank = i + 1;
            const t = TITLE_BY_ID[topTitleId(tab, rank)];
            const holder = board[i];
            const hasHolder = holder && holder.score > 0;
            const isMe = hasHolder && holder.isPlayer;
            const diff = hasHolder && myScore < holder.score ? holder.score - myScore : 0;
            const passed = myRank > 0 && myRank < rank;

            return (
              <div
                key={t.id}
                className={`top-title-card t-${t.tier} ${isMe ? 'is-me' : ''}`}
                style={{ ['--tc' as string]: TIER_COLOR[t.tier] }}
              >
                {/* Dòng 1: Thứ hạng, Tên danh hiệu & Bậc phẩm */}
                <div className="top-title-head">
                  <span className="pos">{MEDALS[i] ?? `#${rank}`}</span>
                  <b className="title-name">{rank === 1 ? `👑 ${t.name} 👑` : `« ${t.name} »`}</b>
                  <span className="tier-tag">{TIER_NAME[t.tier]}</span>
                </div>

                {/* Dòng 2: Người đang nắm giữ & Tình hình tranh đua */}
                <div className="top-title-holder">
                  <div className="holder-info">
                    <span className="holder-label">Đang nắm giữ:</span>
                    {hasHolder ? (
                      <span className={`holder-name ${isMe ? 'me' : ''}`}>
                        {isMe ? '👑 Bạn' : `👤 ${holder.name}`}
                        <span className="holder-score">
                          {b.icon} {fmt(holder.score)} {b.unit}
                        </span>
                      </span>
                    ) : (
                      <span className="holder-empty">Chưa có ai</span>
                    )}
                  </div>

                  <div className="race-status">
                    {isMe ? (
                      <span className="race-badge leader">
                        {rank === 1 ? '🔥 Bạn đang dẫn đầu Top 1!' : '🔥 Bạn đang giữ Top!'}
                      </span>
                    ) : passed ? (
                      <span className="race-badge passed">✓ Bạn đã vượt qua</span>
                    ) : hasHolder ? (
                      <span className="race-badge chase" title={`Cần thêm +${fmt(diff + 1)} ${b.unit} để soán ngôi`}>
                        ⚔️ Kém <b>{fmt(diff)}</b> {b.unit}
                      </span>
                    ) : (
                      <span className="race-badge open">⚡ Cơ hội chiếm Top!</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="small muted">
          Danh hiệu Top 1–5 luân chuyển liên tục theo bảng xếp hạng trực tiếp. Bị người khác vượt qua sẽ lập tức chuyển giao danh hiệu tương ứng.
        </p>
      </section>

      <section className="card">
        <ol className="board">
          {board.filter((e) => e.score > 0).map((e, i) => (
            <li key={`${i}-${e.name}`} className={e.isPlayer ? 'me' : ''}>
              <span className="pos">{MEDALS[i] ?? i + 1}</span>
              <span className="grow">
                {e.name}
                {i < 5 && <em className={`board-title t-${TITLE_BY_ID[topTitleId(tab, i + 1)].tier}`}>{b.titles[i]}</em>}
              </span>
              <b>
                {b.icon} {fmt(e.score)}
              </b>
            </li>
          ))}
          {board.filter((e) => e.score > 0).length === 0 && (
            <p className="muted small center" style={{ padding: '16px 0' }}>
              Tuần này chưa có ai ghi điểm — hãy là người đầu tiên bứt phá ghi tên lên Bảng Vinh Danh!
            </p>
          )}
        </ol>
      </section>
      <BoardSource offline="Bản offline: đối thủ là bot mô phỏng. Bản online sẽ là người chơi thật." />
    </>
  );
}
