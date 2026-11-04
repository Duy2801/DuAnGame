import { useEffect, useRef, useState } from 'react';
import { AccountSection } from './AuthPanel';
import { RANKS, rankIndex } from '../game/config/guild';
import { CHESTS, DAILY_BY_ID } from '../game/config/meta';
import { loginState } from '../game/logic/meta';
import { playerStats, xpToNext } from '../game/logic/player';
import { clockText, isNight, isRaining } from '../game/clock';
import { getCurrentSeason } from '../game/config/seasons';
import { NPC_DEFS } from '../game/config/story';
import { currentStory, goalText } from '../game/logic/story';
import { fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';
import { bus } from '../world/bus';
import { isMuted, setMuted, sfx } from '../world/sfx';
import { Modal } from './common';
import { passiveRate } from '../game/logic/farm';
import { activeBuffs } from '../game/logic/buffs';
import { BUFF_INFO } from '../game/config/buffs';
import { readyOrderCount } from '../game/logic/orders';
import { achClaimableCount, onlineGiftReadyCount, wheelFree } from '../game/logic/rewards';
import { AvatarView } from './AvatarView';
import { BossHud } from './BossHud';
import { heroLook } from '../art/heroLook';

export function Hud() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const [zone, setZone] = useState<{ name: string; level: string } | null>(null);
  const [settings, setSettings] = useState(false);
  const zoneTimer = useRef<number>();

  useEffect(
    () =>
      bus.on('zone', (z) => {
        setZone(z);
        clearTimeout(zoneTimer.current);
        zoneTimer.current = window.setTimeout(() => setZone(null), 2800);
      }),
    [],
  );

  const p = g.player;
  const st = playerStats(g);
  const story = currentStory(g);
  const night = isNight(now);
  const rain = isRaining(now);
  const season = getCurrentSeason(now);
  const kiteLeft = g.kiteBuffUntil - now;
  const questBadge =
    g.daily.quests.filter((q) => !q.claimed && q.progress >= DAILY_BY_ID[q.id].target).length +
    CHESTS.filter((c, i) => !g.daily.chests.includes(i) && g.daily.points >= c.points).length +
    (loginState(g, now).canClaim ? 1 : 0) +
    achClaimableCount(g) +
    onlineGiftReadyCount(g) +
    (wheelFree(g, now) ? 1 : 0);
  const ordersReady = readyOrderCount(g);
  const teamsBack = g.missions.filter((m) => now >= m.endAt).length;
  const lowHp = p.hp / st.maxHp < 0.3;

  return (
    <>
      {lowHp && <div className="low-hp" />}
      <div className="hud-left" onClick={() => bus.emit('panel', 'character')}>
        <div className="hud-avatar">
          <AvatarView look={heroLook(g)} scale={2} head />
          <span className="hud-lv">{p.level}</span>
        </div>
        <div className="hud-bars">
          <div className="hud-pname">{g.profile.name}</div>
          <div className="hud-bar hp">
            <div style={{ width: `${(p.hp / st.maxHp) * 100}%` }} />
            <span>
              {Math.floor(p.hp)}/{st.maxHp}
            </span>
          </div>
          <div className="hud-bar xp">
            <div style={{ width: `${(p.xp / xpToNext(p.level)) * 100}%` }} />
          </div>
          <div className="hud-env">
            <span>
              {night ? '🌙' : '☀️'} {clockText(now)}
            </span>
            <span
              style={{ color: season.color, cursor: 'pointer', fontWeight: 'bold' }}
              title={`${season.name}: ${season.desc} (${season.bonusDesc}) · Đổi mùa sau ${season.timeLeftStr} — Bấm để mở Cẩm nang câu cá`}
              onClick={(e) => {
                e.stopPropagation();
                bus.emit('panel', 'fishing');
              }}
            >
              {season.emoji} {season.name} ({season.timeLeftStr})
            </span>
            {rain && <span>🌧️ Mưa</span>}
            {kiteLeft > 0 && <span title="Gió lành: +20% vàng từ quái">🪁 {fmtTime(kiteLeft)}</span>}
            {activeBuffs(g, now).map(([id, b]) => (
              <span key={id} className="buff-chip" title={`${BUFF_INFO[id].name}: ${BUFF_INFO[id].desc(b.value)}`}>
                {BUFF_INFO[id].emoji} {fmtTime(b.until - now)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {story && (
        <div className="quest-tracker" onClick={() => bus.emit('panel', 'quests')}>
          <b>📜 {story.title}</b>
          {g.story.accepted ? (
            <span>
              {goalText(g)} ({g.story.progress}/{story.goal.n}){g.story.progress >= story.goal.n && ' ✅ quay lại báo cáo'}
            </span>
          ) : (
            <span>❗ Gặp {NPC_DEFS[story.giver].name} để nhận nhiệm vụ</span>
          )}
        </div>
      )}

      <div className="hud-right">
        <div className="hud-res">
          <span className="hud-coin">
            🪙 <CountUp value={g.gold} quiet={Math.ceil(passiveRate(g) * 2)} />
          </span>
          <span className="hud-coin">
            💎 <CountUp value={g.gems} />
          </span>
          <span className="hud-rank">{RANKS[rankIndex(g.guildXp)].name}</span>
        </div>
        <div className="hud-menu" role="toolbar" aria-label="Thanh chức năng">
          <button
            onClick={() => {
              sfx.open();
              bus.emit('panel', 'map');
            }}
            title="Bản đồ thế giới (M) — Dịch chuyển nhanh"
            aria-label="Bản đồ"
          >
            <span className="menu-icon">🗺️</span>
            <small className="menu-key">M</small>
          </button>
          <button
            onClick={() => {
              sfx.open();
              bus.emit('panel', 'quests');
            }}
            title="Nhiệm vụ, Thành tựu & Quà tặng (N)"
            aria-label="Nhiệm vụ"
          >
            <span className="menu-icon">📜</span>
            {questBadge > 0 && <i>{questBadge}</i>}
            <small className="menu-key">N</small>
          </button>
          <button
            onClick={() => {
              sfx.open();
              bus.emit('panel', 'rank');
            }}
            title="Bảng xếp hạng (R) — Vinh danh & Hội viên"
            aria-label="Bảng xếp hạng"
          >
            <span className="menu-icon">🏆</span>
            <small className="menu-key">R</small>
          </button>
          <button
            onClick={() => {
              sfx.open();
              bus.emit('panel', 'giftcode');
            }}
            title="Nhập mã quà tặng Giftcode (G)"
            aria-label="Giftcode"
          >
            <span className="menu-icon">🎁</span>
            <small className="menu-key">G</small>
          </button>
          <button
            onClick={() => {
              sfx.open();
              setSettings(true);
            }}
            title="Cài đặt hệ thống"
            aria-label="Cài đặt"
          >
            <span className="menu-icon">⚙️</span>
            <small className="menu-key">⚙</small>
          </button>
        </div>
      </div>

      <div className="hud-notices">
        {ordersReady > 0 && (
          <div className="hud-notice orders-notice" onClick={() => bus.emit('panel', 'market')}>
            📋 {ordersReady} đơn hàng đủ hàng — bấm để giao
          </div>
        )}
        {teamsBack > 0 && <div className="hud-notice">⚔️ {teamsBack} đội đã về — tới Hội nhận thưởng</div>}
      </div>

      {zone && (
        <div className="zone-banner" key={zone.name}>
          <b>{zone.name}</b>
          <small>{zone.level}</small>
        </div>
      )}

      <BossHud />
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </>
  );
}

/** số đếm tăng dần + bong bóng "+N" khi nhận tiền */
function CountUp({ value, quiet = 0 }: { value: number; quiet?: number }) {
  const [shown, setShown] = useState(value);
  const [pops, setPops] = useState<{ id: number; d: number }[]>([]);
  const prev = useRef(value);
  const seq = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const d = Math.floor(value) - Math.floor(from);
    if (d === 0) return;
    if (d > quiet) {
      const id = ++seq.current;
      setPops((p) => [...p.slice(-2), { id, d }]);
      window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1200);
    }
    const t0 = performance.now();
    const dur = Math.min(700, 200 + Math.abs(d) * 4);
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setShown(from + (value - from) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <b className="count-up">
      {fmt(shown)}
      {pops.map((p) => (
        <em key={p.id} className="coin-pop">
          +{fmt(p.d)}
        </em>
      ))}
    </b>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [muted, setM] = useState(isMuted());
  // đóng cửa sổ khi đang gõ thì bật lại phím điều khiển
  useEffect(() => () => bus.emit('typing', false), []);
  const [tab, setTab] = useState<SettingsTab>('general');
  return (
    <Modal title="⚙️ Cài đặt" onClose={onClose} className="st-sheet">
      <div className="st-tabs" role="tablist">
        {SETTINGS_TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`st-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="st-body">
      {tab === 'general' && (
        <div className="st-pane">
          <div className="st-row">
            <div>
              <b>{muted ? '🔇' : '🔊'} Âm thanh</b>
              <small>Nhạc nền &amp; hiệu ứng</small>
            </div>
            <button
              className={`st-switch ${muted ? '' : 'on'}`}
              aria-pressed={!muted}
              onClick={() => {
                setMuted(!muted);
                setM(!muted);
              }}
            >
              <i />
            </button>
          </div>
          <AccountSection />
        </div>
      )}

      {tab === 'keys' && (
        <div className="st-pane">
          {KEY_GROUPS.map((grp) => (
            <section key={grp.title} className="st-keygroup">
              <h4>{grp.title}</h4>
              <div className="st-keys">
                {grp.keys.map(([keys, label]) => (
                  <div key={label} className="st-key">
                    <span className="st-caps">
                      {keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      </div>
    </Modal>
  );
}

type SettingsTab = 'general' | 'keys';
const SETTINGS_TABS: [SettingsTab, string][] = [
  ['general', '⚙️ Chung'],
  ['keys', '⌨️ Phím bấm'],
];

/** bảng phím tắt — mỗi nhóm một khung, mỗi phím một ô */
const KEY_GROUPS: { title: string; keys: [string[], string][] }[] = [
  {
    title: '🚶 Di chuyển & Hành động',
    keys: [
      [['W', 'A', 'S', 'D'], 'Di chuyển (hoặc phím mũi tên)'],
      [['Space', 'J'], 'Chém tấn công (hoặc click chuột)'],
      [['E'], 'Tương tác / Câu cá / Nhặt đồ'],
      [['Q'], 'Ăn thức ăn hồi phục máu'],
      [['Shift'], 'Lướt né chiêu nhanh'],
    ],
  },
  {
    title: '✨ Kỹ năng chiến đấu',
    keys: [
      [['U'], 'Chém xoáy kiếm (Sát thương diện rộng)'],
      [['I'], 'Sóng kiếm (Tấn công tầm xa)'],
      [['O'], 'Hồi phục thần tốc (Bơm máu)'],
    ],
  },
  {
    title: '🧰 Bảng chức năng & Thanh 10 ô',
    keys: [
      [['1', '…', '0'], 'Chọn ô trên thanh nhanh (hoặc lăn chuột)'],
      [['M'], 'Bản đồ thế giới (Dịch chuyển)'],
      [['N'], 'Nhiệm vụ, thành tựu & quà tặng'],
      [['B'], 'Hành trang / Túi đồ'],
      [['R'], 'Bảng xếp hạng / Tượng vinh danh'],
      [['G'], 'Nhập mã quà tặng (Giftcode)'],
    ],
  },
];
