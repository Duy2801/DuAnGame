import { useState } from 'react';
import { RANKS, rankIndex } from '../game/config/guild';
import { SUPER_FISH_TITLES, TIER_COLOR, TIER_NAME, TIER_ORDER, TITLES } from '../game/config/titles';
import { playerStats, xpToNext } from '../game/logic/player';
import { setTitle } from '../game/logic/titles';
import { fmt, pct } from '../game/utils';
import { useGame } from '../store';
import { Bar } from './common';
import { AvatarView } from './AvatarView';
import { heroLook } from '../art/heroLook';

export function CharacterView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const [filterTab, setFilterTab] = useState<'all' | 'top' | 'super' | 'fish' | 'ach'>('all');
  const p = g.player;
  const st = playerStats(g);

  // Danh hiệu cũ đã ngừng phát chỉ hiện nếu đã sở hữu
  const availableTitles = TITLES.filter((t) => !t.legacy || g.titles.owned.includes(t.id));
  const ownedSet = new Set(g.titles.owned);
  const activeTitle = availableTitles.find((t) => t.id === g.titles.active);

  // Lọc theo danh mục
  const superSet = new Set(SUPER_FISH_TITLES.map((s) => s.id));
  const filteredTitles = availableTitles.filter((t) => {
    if (filterTab === 'top') return !!t.board;
    if (filterTab === 'super') return superSet.has(t.id);
    if (filterTab === 'ach') return t.id.startsWith('ach_');
    if (filterTab === 'fish') return !t.board && !superSet.has(t.id) && !t.id.startsWith('ach_');
    return true;
  });

  // Sắp xếp danh hiệu:
  // 1. Đang trang bị lên đầu
  // 2. Các danh hiệu đã mở khóa (từ Thần thoại -> Thường)
  // 3. Các danh hiệu chưa mở khóa (từ Thần thoại -> Thường)
  const sortedTitles = [...filteredTitles].sort((a, b) => {
    const aActive = g.titles.active === a.id ? 1 : 0;
    const bActive = g.titles.active === b.id ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;

    const aOwned = ownedSet.has(a.id) ? 1 : 0;
    const bOwned = ownedSet.has(b.id) ? 1 : 0;
    if (aOwned !== bOwned) return bOwned - aOwned;

    return TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier);
  });

  return (
    <div className="char-view-wrap">
      {/* ---------------- 1. Thẻ thông tin nhân vật chính ---------------- */}
      <section className="char-profile-card">
        <div className="char-portrait-box" title="Ảnh đại diện nhân vật">
          <AvatarView look={heroLook(g)} scale={3} spin walk />
        </div>

        <div className="char-profile-info">
          <div className="char-name-row">
            <h2 className="char-name-title">{g.profile.name || 'Mạo hiểm giả'}</h2>
            <span className="char-lvl-badge">Lv. {p.level}</span>
          </div>

          <div className="char-title-display">
            {activeTitle ? (
              <span
                className="char-active-title-badge"
                style={{
                  color: TIER_COLOR[activeTitle.tier],
                  borderColor: TIER_COLOR[activeTitle.tier],
                }}
              >
                <span>🏷️</span>
                {activeTitle.tier === 'mythic' ? `👑 ${activeTitle.name}` : `« ${activeTitle.name} »`}
              </span>
            ) : (
              <span className="char-no-title-badge">🏷️ (Chưa gắn danh hiệu)</span>
            )}
          </div>

          <div className="char-bar-group">
            <div className="char-bar-label">
              <span>❤️ Sinh lực</span>
              <b>{Math.floor(p.hp)} / {st.maxHp}</b>
            </div>
            <Bar value={p.hp / st.maxHp} tone="red" />
          </div>

          <div className="char-bar-group">
            <div className="char-bar-label">
              <span>✨ Kinh nghiệm</span>
              <b>{fmt(p.xp)} / {fmt(xpToNext(p.level))} XP</b>
            </div>
            <Bar value={p.xp / xpToNext(p.level)} tone="blue" />
          </div>
        </div>
      </section>

      {/* ---------------- 2. Lưới chỉ số chiến đấu & thành tựu ---------------- */}
      <div className="char-stats-matrix">
        <div className="char-stat-box">
          <span className="char-stat-val">⚔️ {st.atk}</span>
          <span className="char-stat-lbl">Tấn công</span>
        </div>
        <div className="char-stat-box">
          <span className="char-stat-val">🛡️ {st.def}</span>
          <span className="char-stat-lbl">Phòng thủ</span>
        </div>
        <div className="char-stat-box">
          <span className="char-stat-val">💥 {pct(st.crit)}</span>
          <span className="char-stat-lbl">Chí mạng</span>
        </div>
        <div className="char-stat-box">
          <span className="char-stat-val">👟 {pct(st.speed)}</span>
          <span className="char-stat-lbl">Tốc chạy</span>
        </div>
        <div className="char-stat-box">
          <span className="char-stat-val">🎖️ {RANKS[rankIndex(g.guildXp)].name}</span>
          <span className="char-stat-lbl">Rank Hội</span>
        </div>
        <div className="char-stat-box">
          <span className="char-stat-val">💀 {fmt(g.stats.kills)}</span>
          <span className="char-stat-lbl">Quái đã hạ</span>
        </div>
      </div>

      {/* ---------------- 3. Khung danh hiệu mạo hiểm ---------------- */}
      <section className="char-titles-card">
        <div className="char-titles-head">
          <h2>🏷️ Bộ Sưu Tập Danh Hiệu</h2>
          <span className="tag ok">
            {g.titles.owned.length} / {availableTitles.length} đã mở
          </span>
        </div>

        <p className="char-titles-hint">
          💡 Chọn danh hiệu đã mở để hiển thị trên đầu nhân vật. Danh hiệu Đua Top sẽ tự động luân chuyển theo thứ hạng tuần của bạn.
        </p>

        {/* Bộ lọc loại danh hiệu */}
        <div className="tabs" style={{ marginBottom: 10 }}>
          <button
            type="button"
            className={`tab-btn ${filterTab === 'all' ? 'on' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            🌟 Tất cả ({availableTitles.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${filterTab === 'top' ? 'on' : ''}`}
            onClick={() => setFilterTab('top')}
          >
            👑 Đua Top BXH ({availableTitles.filter((t) => t.board).length})
          </button>
          <button
            type="button"
            className={`tab-btn ${filterTab === 'super' ? 'on' : ''}`}
            onClick={() => setFilterTab('super')}
          >
            🐲 Cá Thần Thoại ({SUPER_FISH_TITLES.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${filterTab === 'fish' ? 'on' : ''}`}
            onClick={() => setFilterTab('fish')}
          >
            🎣 Ngư Thủ & Kỷ Lục
          </button>
          <button
            type="button"
            className={`tab-btn ${filterTab === 'ach' ? 'on' : ''}`}
            onClick={() => setFilterTab('ach')}
          >
            🏆 Thành Tựu
          </button>
        </div>

        {g.titles.active && (
          <button
            type="button"
            className="char-title-clear-btn"
            onClick={() => act((state) => setTitle(state, null))}
          >
            ✕ Tháo danh hiệu hiện tại
          </button>
        )}

        <div className="char-title-grid">
          {sortedTitles.map((t) => {
            const has = ownedSet.has(t.id);
            const isActive = g.titles.active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`char-title-chip t-${t.tier} ${has ? 'unlocked' : 'locked'} ${isActive ? 'on' : ''}`}
                onClick={() => {
                  if (!has) {
                    useGame.getState().toast(`🔒 ${t.name}: ${t.desc}`);
                    return;
                  }
                  act((state) => setTitle(state, isActive ? null : t.id));
                }}
                style={{ ['--tc' as string]: TIER_COLOR[t.tier] }}
                title={has ? (isActive ? 'Bấm để tháo danh hiệu' : 'Bấm để đeo danh hiệu') : `Chưa mở khóa: ${t.desc}`}
              >
                <div className="char-title-chip-name">
                  <span>
                    {has
                      ? t.tier === 'mythic'
                        ? `👑 ${t.name} 👑`
                        : `« ${t.name} »`
                      : `🔒 « ${t.name} »`}
                  </span>
                  {isActive && <span className="char-title-active-tag">✓ ĐANG ĐEO</span>}
                </div>
                <div className="char-title-chip-tier">
                  {TIER_NAME[t.tier]}
                </div>
                <div className="char-title-chip-desc">
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
