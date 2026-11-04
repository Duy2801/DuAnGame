import { useEffect, useRef, useState } from 'react';
import { ACH_TIERS, ACHIEVEMENTS } from '../game/config/achievements';
import { ONLINE_GIFTS, WHEEL, WHEEL_COST_GEMS, WHEEL_MAX_SPINS } from '../game/config/meta';
import { rewardText } from '../game/logic/core';
import {
  achClaimable, achNextTier, claimAchievement, claimOnlineGift, onlineGiftReady, onlineGiftReward, spinWheel,
  wheelSpinsToday,
} from '../game/logic/rewards';
import { fmt } from '../game/utils';
import { useGame } from '../store';
import { sfx } from '../world/sfx';
import { Bar } from './common';

export function AchievementsView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const list = [...ACHIEVEMENTS].sort((a, b) => Number(achClaimable(g, b.id)) - Number(achClaimable(g, a.id)));

  return (
    <>
      <p className="muted small">
        Mỗi thành tựu có 4 bậc {ACH_TIERS.map((t) => t.emoji).join(' ')} — bậc càng cao càng nhiều 💎. Đạt bậc Kim Cương nhận <b>danh hiệu Sử thi</b>.
      </p>
      <div className="list">
        {list.map((a) => {
          const t = achNextTier(g, a.id);
          const val = a.stat(g);
          const done = t < 0;
          const goal = done ? a.goals[3] : a.goals[t];
          const ready = achClaimable(g, a.id);
          return (
            <div key={a.id} className={`ach ${done ? 'done' : ''} ${ready ? 'ready' : ''}`}>
              <span className="ach-icon">{a.emoji}</span>
              <div className="grow">
                <div className="row between">
                  <b>{a.name}</b>
                  <span className="ach-tiers">
                    {ACH_TIERS.map((tt, i) => (
                      <i key={tt.name} className={i < (g.achievements[a.id] ?? 0) ? 'on' : ''} title={`${tt.name}: ${fmt(a.goals[i])}`}>
                        {tt.emoji}
                      </i>
                    ))}
                  </span>
                </div>
                <small>{a.desc.replace('{n}', fmt(goal))}</small>
                <Bar value={Math.min(1, val / goal)} tone={ready ? 'gold' : undefined} />
                <small className="muted">
                  {fmt(Math.min(val, goal))}/{fmt(goal)}
                  {t === 3 && <> · bậc cuối tặng « {a.title} »</>}
                </small>
              </div>
              {done ? (
                <span className="tag ok">✓ Hoàn thành</span>
              ) : (
                <button className="btn sm gold" disabled={!ready} onClick={() => act((g) => claimAchievement(g, a.id))}>
                  {ACH_TIERS[t].emoji} +💎{ACH_TIERS[t].gems}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function GiftsView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const mins = Math.floor(g.online.ms / 60_000);
  const maxMin = ONLINE_GIFTS[ONLINE_GIFTS.length - 1].min;

  return (
    <>
      <section className="card">
        <div className="row between">
          <h2>⏰ Quà online hôm nay</h2>
          <b>{mins} phút</b>
        </div>
        <Bar value={Math.min(1, g.online.ms / (maxMin * 60_000))} tone="gold" />
        <div className="gift-row">
          {ONLINE_GIFTS.map((x, i) => {
            const claimed = g.online.claimed.includes(i);
            const ready = onlineGiftReady(g, i);
            return (
              <button
                key={x.min}
                className={`gift ${claimed ? 'claimed' : ready ? 'ready' : ''}`}
                disabled={!ready}
                onClick={() => act((g) => claimOnlineGift(g, i))}
              >
                <span>{claimed ? '✅' : ready ? '🎁' : '📦'}</span>
                <b>{x.min} phút</b>
                <small>{rewardText(onlineGiftReward(g, i))}</small>
              </button>
            );
          })}
        </div>
        <p className="small muted">Chỉ tính lúc đang mở game. Làm mới lúc 0h.</p>
      </section>
      <section className="card">
        <LuckyWheel />
      </section>
    </>
  );
}

const SEG = 360 / WHEEL.length;

const BULBS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i * 22.5) * (Math.PI / 180);
  return {
    cx: Number((160 + 148 * Math.cos(angle)).toFixed(2)),
    cy: Number((160 + 148 * Math.sin(angle)).toFixed(2)),
    isEven: i % 2 === 0,
  };
});

const SLICES = WHEEL.map((w, i) => {
  const a1 = (-90 + i * SEG) * (Math.PI / 180);
  const a2 = (-90 + (i + 1) * SEG) * (Math.PI / 180);
  const x1 = Number((160 + 138 * Math.cos(a1)).toFixed(2));
  const y1 = Number((160 + 138 * Math.sin(a1)).toFixed(2));
  const x2 = Number((160 + 138 * Math.cos(a2)).toFixed(2));
  const y2 = Number((160 + 138 * Math.sin(a2)).toFixed(2));
  const d = `M 160 160 L ${x1} ${y1} A 138 138 0 0 1 ${x2} ${y2} Z`;
  return { d, x1, y1, color: w.color, i };
});

function getWheelSliceInfo(g: any, i: number) {
  const item = WHEEL[i];
  if (item.goldX) {
    const gold = Math.round(item.goldX * (100 + 30 * g.player.level));
    return {
      emoji: item.goldX >= 8 ? '💰' : '🪙',
      value: `+${fmt(gold)}`,
      name: item.goldX >= 8 ? 'Đại phú' : item.goldX >= 3 ? 'Vàng vừa' : 'Vàng',
    };
  }
  if (item.reward?.gems) {
    return {
      emoji: '💎',
      value: `+${item.reward.gems}`,
      name: item.reward.gems >= 20 ? 'Jackpot' : 'Kim cương',
    };
  }
  if (item.reward?.items?.bait_gold) {
    return {
      emoji: '✨',
      value: `×${item.reward.items.bait_gold}`,
      name: 'Mồi vàng',
    };
  }
  if (item.reward?.items?.potion_m) {
    return {
      emoji: '🍷',
      value: `×${item.reward.items.potion_m}`,
      name: 'Bình máu',
    };
  }
  if (item.reward?.items?.seed_mushroom) {
    return {
      emoji: '🍄',
      value: `×${item.reward.items.seed_mushroom}`,
      name: 'Hạt nấm',
    };
  }
  return {
    emoji: '🎁',
    value: item.label,
    name: 'Quà',
  };
}

export function LuckyWheel() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const apply = useGame((s) => s.apply);
  const toast = useGame((s) => s.toast);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<{
    title: string;
    value: string;
    emoji: string;
  } | null>(null);
  const timer = useRef<number>();
  const used = wheelSpinsToday(g, now);
  const free = used === 0;
  const left = WHEEL_MAX_SPINS - used;

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const spin = () => {
    if (spinning || left <= 0) return;
    const res = apply((g, now) => spinWheel(g, now));
    if (!res) return;
    setSpinning(true);
    setWonReward(null);
    sfx.open();
    // kim ở trên cùng (12h): ô trúng dừng ở 0°, quay thêm 6 vòng
    const target = 360 - (res.index * SEG + SEG / 2);
    const next = angle - (angle % 360) + 360 * 6 + target;
    setAngle(next);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      sfx.coin();
      toast(res.text);
      const info = getWheelSliceInfo(g, res.index);
      setWonReward({
        title: info.name,
        value: info.value,
        emoji: info.emoji,
      });
    }, 3800);
  };

  return (
    <div className="wheel-stage">
      <div className="wheel-header">
        <h2>🎡 Vòng quay may mắn</h2>
        <div className={`wheel-cost-pill ${free ? 'free' : ''}`}>
          {free ? '✨ Lượt đầu miễn phí' : `💎 ${WHEEL_COST_GEMS} Kim cương`}
        </div>
      </div>

      <div className={`wheel-wrap ${spinning ? 'is-spinning' : ''}`}>
        {/* Kim chỉ (Pointer Needle) */}
        <div className={`wheel-pointer ${spinning ? 'is-spinning' : ''}`}>
          <svg viewBox="0 0 38 46" width="38" height="46">
            <defs>
              <filter id="pointer-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="rgba(0,0,0,0.6)" />
              </filter>
              <radialGradient id="jewel-grad" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#ff7b90" />
                <stop offset="60%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#880b28" />
              </radialGradient>
            </defs>
            <g filter="url(#pointer-shadow)">
              <path d="M 19 44 L 7 14 L 19 18 Z" fill="#ffe066" />
              <path d="M 19 44 L 19 18 L 31 14 Z" fill="#d49012" />
              <line x1="19" y1="18" x2="19" y2="43" stroke="#fff" strokeWidth="1.2" opacity="0.75" />
              <circle cx="19" cy="14" r="12" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
              <circle cx="19" cy="14" r="10" fill="#ffd54f" />
              <circle cx="19" cy="14" r="6" fill="url(#jewel-grad)" stroke="#5c061a" strokeWidth="1" />
              <circle cx="17.5" cy="12" r="1.8" fill="#ffffff" opacity="0.85" />
            </g>
          </svg>
        </div>

        {/* Khung viền & Vòng quay SVG */}
        <svg className="wheel-svg" viewBox="0 0 320 320">
          <defs>
            {/* Viền kim loại bóng */}
            <radialGradient id="rim-grad" cx="50%" cy="50%">
              <stop offset="85%" stopColor="#2c1404" />
              <stop offset="92%" stopColor="#5c3008" />
              <stop offset="97%" stopColor="#924f0c" />
              <stop offset="100%" stopColor="#3d1b03" />
            </radialGradient>
            {/* Lớp phủ sáng trên mặt đĩa */}
            <radialGradient id="wheel-shine" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </radialGradient>
            {/* Đèn bóng LED */}
            <radialGradient id="bulb-gold" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffe57f" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <radialGradient id="bulb-white" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </radialGradient>
          </defs>

          {/* Khung viền tủ Arcade ngoài cùng */}
          <circle cx="160" cy="160" r="156" fill="url(#rim-grad)" stroke="#924f0c" strokeWidth="4" />
          <circle cx="160" cy="160" r="148" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.6" />
          <circle cx="160" cy="160" r="139" fill="none" stroke="#1c0b02" strokeWidth="3" />

          {/* 16 Đèn LED chạy quanh viền */}
          {BULBS.map((b, idx) => (
            <circle
              key={idx}
              cx={b.cx}
              cy={b.cy}
              r="4.2"
              fill={b.isEven ? 'url(#bulb-gold)' : 'url(#bulb-white)'}
              stroke="#592b02"
              strokeWidth="1"
              className={`wheel-bulb ${b.isEven ? 'even' : 'odd'}`}
            />
          ))}

          {/* Đĩa quay (Xoay tròn theo góc angle) */}
          <g
            className="wheel-disk"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '160px 160px',
            }}
          >
            {/* Các nan rẽ quạt */}
            {SLICES.map((s) => {
              const info = getWheelSliceInfo(g, s.i);
              return (
                <g key={s.i}>
                  <path d={s.d} fill={s.color} />
                  {/* Đường nan viền vàng */}
                  <line x1="160" y1="160" x2={s.x1} y2={s.y1} stroke="#ffd54f" strokeWidth="2.5" />
                  {/* Chốt tán kim loại ở mép */}
                  <circle cx={s.x1} cy={s.y1} r="3.2" fill="#fff9c4" stroke="#78350f" strokeWidth="1" />
                  {/* Nội dung bên trong nan quạt */}
                  <g transform={`rotate(${(s.i + 0.5) * SEG}, 160, 160)`}>
                    {/* Biểu tượng Emoji */}
                    <text
                      x="160"
                      y="52"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="20"
                      style={{ userSelect: 'none' }}
                    >
                      {info.emoji}
                    </text>
                    {/* Giá trị phần thưởng */}
                    <text
                      x="160"
                      y="74"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12.5"
                      fontWeight="900"
                      fill="#ffffff"
                      stroke="#1f1406"
                      strokeWidth="2.5"
                      paintOrder="stroke fill"
                      style={{ userSelect: 'none', letterSpacing: '0.2px' }}
                    >
                      {info.value}
                    </text>
                    {/* Tên phần thưởng */}
                    <text
                      x="160"
                      y="91"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9.5"
                      fontWeight="800"
                      fill="#fff8dc"
                      stroke="#2a1604"
                      strokeWidth="2"
                      paintOrder="stroke fill"
                      opacity="0.95"
                      style={{ userSelect: 'none' }}
                    >
                      {info.name}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Lớp phủ phản quang 3D */}
            <circle cx="160" cy="160" r="138" fill="url(#wheel-shine)" pointerEvents="none" />
            <circle cx="160" cy="160" r="138" fill="none" stroke="#78350f" strokeWidth="3" />
            <circle cx="160" cy="160" r="136.5" fill="none" stroke="#ffe066" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Nút tâm tròn (Center Hub Button) */}
        <button
          className="wheel-hub-btn"
          disabled={spinning || left <= 0}
          onClick={spin}
          title={left > 0 ? (free ? 'Nhấn để quay miễn phí!' : `Quay (💎 ${WHEEL_COST_GEMS})`) : 'Hết lượt'}
        >
          <span className="wheel-hub-icon">🍀</span>
          <span className="wheel-hub-text">{spinning ? '...' : 'QUAY'}</span>
        </button>
      </div>

      {/* Thông báo chúc mừng trúng thưởng */}
      {wonReward && (
        <div className="wheel-win-card">
          <div className="wheel-win-sparkle">✨</div>
          <div className="wheel-win-content">
            <span className="wheel-win-badge">Chúc mừng bạn trúng thưởng!</span>
            <div className="wheel-win-item">
              <span className="wheel-win-emoji">{wonReward.emoji}</span>
              <span className="wheel-win-val">{wonReward.value}</span>
              <span className="wheel-win-name">({wonReward.title})</span>
            </div>
          </div>
        </div>
      )}

      {/* Thanh trạng thái lượt quay */}
      <div className="wheel-status-bar">
        <div className="wheel-status-pill">
          <span className="pill-dot" />
          <span>Hôm nay: còn <b>{left}/{WHEEL_MAX_SPINS}</b> lượt</span>
        </div>
        <small className="muted">Làm mới lúc 0h mỗi ngày</small>
      </div>

      {/* Nút bấm quay lớn */}
      <button
        className={`wheel-spin-btn ${free ? 'free' : ''}`}
        disabled={spinning || left <= 0}
        onClick={spin}
      >
        <div className="wheel-btn-main">
          <span>{spinning ? '⏳' : free ? '✨' : '🎡'}</span>
          <span>
            {spinning
              ? 'Đang quay may mắn...'
              : left <= 0
              ? 'Hôm nay hết lượt — Hẹn mai nhé!'
              : free
              ? 'QUAY MIỄN PHÍ NGAY'
              : `QUAY TIẾP (💎 ${WHEEL_COST_GEMS})`}
          </span>
        </div>
        <div className="wheel-btn-sub">
          {left <= 0
            ? 'Đã dùng hết 6/6 lượt hôm nay'
            : free
            ? 'Mỗi ngày nhận 1 lượt quay miễn phí'
            : `Còn lại ${left} lượt quay hôm nay`}
        </div>
      </button>
    </div>
  );
}
