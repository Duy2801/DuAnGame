import { useEffect, useState } from 'react';
import { FISH, FISH_BY_ID, fishKg } from '../game/config/life';
import { FISH_WEEK_REWARDS, fishLeaderboard, fishRewardGems } from '../game/logic/fishrank';
import { BOARDS, TITLE_BY_ID, topTitleId } from '../game/config/titles';
import { WEEK_MS, fmt, fmtTime, weekKey, weekStart } from '../game/utils';
import { remote } from '../game/logic/remote';
import { fishingTop, useChest, useServerFishing, type FishTopRow } from '../services/fishingApi';
import { useGame } from '../store';
import { BoardSource } from './AuthPanel';
import { FishVisual } from '../art/fishArt';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Bảng Top Câu Cá tuần + sổ kỷ lục từng loài */
export function FishRankView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const [tab, setTab] = useState<'top' | 'album'>('top');
  const online = useServerFishing();
  const fishCat = useChest((s) => s.catalog?.fishById);
  const [top, setTop] = useState<FishTopRow[] | null>(null);
  const wk = weekKey(now);
  useEffect(() => {
    if (!online) return;
    let alive = true;
    const load = () =>
      void fishingTop(wk).then((rows) => {
        if (!alive || !rows) return;
        setTop(rows);
        const meRow = rows.find((r) => r.user_id === remote.me);
        if (meRow && meRow.points > g.fishing.week.points) {
          g.fishing.week.points = meRow.points;
          if (meRow.biggest_cm > (g.fishing.biggest?.cm ?? 0)) {
            g.fishing.biggest = { id: meRow.biggest_fish ?? 'fish_perch', cm: meRow.biggest_cm };
          }
        }
      });
    load();
    const t = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [online, wk]);

  // bản online: BXH tính trên server từ catch_log (không dùng điểm trên máy)
  const board = online
    ? (top ?? []).map((r) => ({
        name: r.name,
        score: r.points,
        biggest: r.biggest_cm,
        fish: r.biggest_fish,
        isPlayer: r.user_id === remote.me,
      }))
    : fishLeaderboard(g, now).map((e) => ({ ...e, fish: null as string | null }));
  const mine = board.find((e) => e.isPlayer);
  const myRank = board.findIndex((e) => e.isPlayer) + 1;
  const myPoints = online ? mine?.score ?? 0 : g.fishing.week.points;
  const big = g.fishing.biggest;

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'top' ? 'on' : ''}`} onClick={() => setTab('top')}>
          🏆 Top tuần
        </button>
        <button className={`tab-btn ${tab === 'album' ? 'on' : ''}`} onClick={() => setTab('album')}>
          📖 Kỷ lục ({Object.keys(g.fishing?.best ?? {}).length}/{FISH.length} loài)
        </button>
      </div>

      {tab === 'top' ? (
        <>
          <p className="muted small">
            Điểm = giá trị cá × cỡ cá (cá to, cá hiếm được nhiều điểm). Chốt bảng sau <b>{fmtTime(weekStart(now) + WEEK_MS - now)}</b>.
          </p>
          <div className="my-rank">
            <div>
              <small>Hạng của bạn</small>
              <b>{myRank > 0 ? `#${myRank}` : online ? '—' : `#${myRank}`}</b>
            </div>
            <div>
              <small>Điểm tuần này</small>
              <b>🎣 {fmt(myPoints)}</b>
            </div>
            <div>
              <small>Thưởng hiện tại</small>
              <b>💎 {myPoints > 0 && myRank > 0 ? fishRewardGems(myRank) : 0}</b>
            </div>
          </div>
          <div className="chips">
            {FISH_WEEK_REWARDS.map((r) => (
              <span key={r.top} className="chip static">
                Top {r.top}: 💎{r.gems}
              </span>
            ))}
          </div>
          {g.fishing.week.lastResult && (
            <p className="small">
              Tuần trước: hạng <b>#{g.fishing.week.lastResult.rank}</b>, đã nhận 💎{g.fishing.week.lastResult.gems}
            </p>
          )}
          {online && !top && <p className="muted small center">⏳ Đang tải bảng xếp hạng từ máy chủ…</p>}
          {online && top && top.length === 0 && <p className="muted small center">Tuần này chưa ai câu được cá — mở hàng thôi!</p>}
          <ol className="board">
            {board.filter((e) => e.score > 0).map((e, i) => (
              <li key={`${i}-${e.name}`} className={e.isPlayer ? 'me' : ''}>
                <span className="pos">{MEDALS[i] ?? i + 1}</span>
                <span className="grow">
                  {e.name}
                  {i < 5 && (
                    <em className={`board-title t-${TITLE_BY_ID[topTitleId('fish', i + 1)].tier}`}>
                      {BOARDS.find((b) => b.id === 'fish')!.titles[i]}
                    </em>
                  )}
                </span>
                <small className="muted">
                  📏 {e.fish ? `${fishCat?.[e.fish]?.emoji ?? FISH_BY_ID[e.fish]?.emoji ?? ''} ` : ''}
                  {e.biggest}cm
                </small>
                <b>🎣 {fmt(e.score)}</b>
              </li>
            ))}
          </ol>
          <BoardSource offline="Bản offline: đối thủ là bot. Bản online sẽ là ngư thủ thật." />
        </>
      ) : (
        <>
          <div className="stats-row">
            <div>
              <b>🎣 {fmt(g.stats.fish)}</b>
              <small>Tổng cá đã câu</small>
            </div>
            <div>
              <b>{big ? `${FISH_BY_ID[big.id]?.emoji ?? '🐟'} ${big.cm}cm` : '—'}</b>
              <small>Con to nhất</small>
            </div>
            <div>
              <b>
                {Object.keys(g.fishing?.best ?? {}).length}/{FISH.length}
              </b>
              <small>Loài đã câu</small>
            </div>
          </div>
          <div className="album">
            {FISH.map((f) => {
              const cm = g.fishing?.best?.[f.id];
              return (
                <div key={f.id} className={`album-card ${cm ? '' : 'locked'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ margin: '4px 0' }}>
                    <FishVisual fish={f} width={70} height={42} animated={!!cm} uncaught={!cm} />
                  </div>
                  <b>{cm ? f.name : '???'}</b>
                  {cm ? (
                    <small>
                      🏅 {cm}cm · {fishKg(cm)}kg
                      <br />
                      <span className="muted">tối đa {f.cm[1]}cm</span>
                    </small>
                  ) : (
                    <small className="muted">{f.night ? '🌙 Cắn ban đêm' : f.rain ? '🌧️ Cắn khi mưa' : f.season ? `Mùa ${f.season}` : 'Chưa câu được'}</small>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
