import { useEffect, useRef, useState } from 'react';
import { drawKite } from '../art/kiteArt';
import { KITE_BOOST, KITE_BUFF_ALT, KITE_CLIMB, KITE_CRASH_KEEP, kitePlay, kiteSkills } from '../game/config/kitegame';
import { KITE_BY_ID, KITES, RARITY_COLOR } from '../game/config/shops';
import { rewardText } from '../game/logic/core';
import { equipKite, finishKiteRun, type KiteResult } from '../game/logic/life';
import { fmt } from '../game/utils';
import { useGame } from '../store';
import { bus } from '../world/bus';
import { sfx } from '../world/sfx';

const W = 340;
const H = 460;
const PX_PER_M = 14;
const KITE_Y = H * 0.66;

type Kind = 'bird' | 'cloud' | 'coin' | 'gift' | 'wind';
interface Obj {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  r: number;
  phase: number;
  /** chim bị diều dọa bay đi */
  scared?: boolean;
}
interface Bolt {
  x: number;
  warnUntil: number;
  strikeUntil: number;
  hit: boolean;
}

const EMOJI: Record<Kind, string> = { bird: '🐦', cloud: '⛈️', coin: '🪙', gift: '🎁', wind: '💨' };
const RADIUS: Record<Kind, number> = { bird: 12, cloud: 20, coin: 11, gift: 13, wind: 14 };

/** màu trời theo độ cao: xanh trưa → xanh thẫm → tím đêm có sao */
function skyColors(alt: number): [string, string] {
  const stops: [number, [number, number, number], [number, number, number]][] = [
    [0, [143, 211, 255], [214, 240, 255]],
    [300, [74, 127, 216], [143, 200, 255]],
    [800, [42, 42, 106], [90, 90, 180]],
    [1600, [10, 10, 32], [40, 30, 90]],
  ];
  let i = 0;
  while (i < stops.length - 2 && alt > stops[i + 1][0]) i++;
  const [a0, t0, b0] = stops[i];
  const [a1, t1, b1] = stops[i + 1];
  const k = Math.max(0, Math.min(1, (alt - a0) / (a1 - a0)));
  const mix = (p: number[], q: number[]) => `rgb(${p.map((v, j) => Math.round(v + (q[j] - v) * k)).join(',')})`;
  return [mix(t0, t1), mix(b0, b1)];
}

export function KiteGame({ kiteId: startId, onClose }: { kiteId: string; onClose: () => void }) {
  const g = useGame((s) => s.game);
  const apply = useGame((s) => s.apply);
  const act = useGame((s) => s.act);
  const kiteId = g.kites.equipped ?? startId;
  const kite = KITE_BY_ID[kiteId] ?? KITE_BY_ID.kite_paper;
  const play = kitePlay(kiteId);
  const skills = kiteSkills(play);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'intro' | 'fly' | 'end'>('intro');
  const [hud, setHud] = useState({ alt: 0, hp: play.hp, coins: 0, gifts: 0, shield: play.shield ?? 0 });
  const [result, setResult] = useState<{ res: KiteResult; alt: number; crashed: boolean; coins: number } | null>(null);
  const reel = useRef<() => void>(() => {});
  const input = useRef({ left: false, right: false, target: null as number | null });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) input.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) input.current.right = true;
      if (phase === 'fly' && (e.code === 'Space' || e.code === 'Enter')) reel.current();
    };
    const up = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) input.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) input.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fly') return;
    const c = canvas.current!.getContext('2d')!;
    const st = {
      x: W / 2, vx: 0, alt: 0, hp: play.hp, shield: play.shield ?? 0, coins: 0, gifts: 0, t: 0,
      boostUntil: 0, hurtUntil: 0, shake: 0, over: false,
    };
    const objs: Obj[] = [];
    const bolts: Bolt[] = [];
    const bg = Array.from({ length: 9 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 0.8 }));
    const stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, a: Math.random() }));
    const spawnAcc: Record<Kind | 'bolt', number> = { bird: 0, cloud: 0, coin: 0, gift: 0, wind: 0, bolt: 0 };
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;

    const finish = (crashed: boolean) => {
      if (st.over) return;
      st.over = true;
      const run = { alt: st.alt, coins: st.coins, gifts: st.gifts, crashed };
      const res = apply((g, now) => finishKiteRun(g, run, now));
      if (crashed) sfx.die();
      else sfx.levelUp();
      if (res) setResult({ res, alt: Math.floor(st.alt), crashed, coins: st.coins });
      setPhase('end');
    };
    reel.current = () => finish(false);

    const spawn = (kind: Kind) => {
      const fromSide = kind === 'bird' && Math.random() < 0.6;
      const dir = Math.random() < 0.5 ? -1 : 1;
      objs.push({
        kind,
        x: fromSide ? (dir > 0 ? -20 : W + 20) : 20 + Math.random() * (W - 40),
        y: fromSide ? Math.random() * KITE_Y * 0.8 : -30,
        vx: kind === 'bird' ? dir * (50 + Math.random() * 70 + Math.min(80, st.alt / 10)) : kind === 'cloud' ? (Math.random() - 0.5) * 30 : 0,
        r: RADIUS[kind],
        phase: Math.random() * 6,
      });
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      st.t += dt;
      const boosting = st.t < st.boostUntil;
      const climb = KITE_CLIMB * play.climb * (1 + st.alt / 450) * (boosting ? KITE_BOOST.mult : 1);
      st.alt += climb * dt;
      const scroll = climb * PX_PER_M * dt;

      // lái diều: phím hoặc kéo theo ngón tay/chuột, gió đẩy ngang nhẹ
      const steer = 300 * play.steer;
      const inp = input.current;
      let ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (inp.target !== null) ax = Math.max(-1, Math.min(1, (inp.target - st.x) / 40));
      const gust = Math.sin(st.t * 0.7) * 30 * Math.min(1, st.alt / 200);
      st.vx += (ax * steer - st.vx) * Math.min(1, dt * 8);
      st.x = Math.max(18, Math.min(W - 18, st.x + (st.vx + gust) * dt));

      // sinh vật thể: càng cao càng nhiều chướng ngại
      const danger = Math.min(3.5, 0.5 + st.alt / 160);
      const rates: Record<Kind | 'bolt', number> = {
        bird: danger * 0.7, cloud: danger * 0.35, coin: 1.8, gift: 0.12 * (play.luck ?? 1), wind: 0.14, bolt: st.alt > 120 ? Math.min(0.6, (st.alt - 120) / 600) : 0,
      };
      for (const k of Object.keys(rates) as (Kind | 'bolt')[]) {
        spawnAcc[k] += rates[k] * dt;
        while (spawnAcc[k] >= 1) {
          spawnAcc[k] -= 1;
          if (k === 'bolt') bolts.push({ x: 30 + Math.random() * (W - 60), warnUntil: st.t + 1.2, strikeUntil: st.t + 1.5, hit: false });
          else spawn(k);
        }
      }

      const hurt = () => {
        if (st.t < st.hurtUntil) return;
        if (st.shield > 0) {
          // khiên vỡ thay cho diều
          st.shield--;
          st.hurtUntil = st.t + 0.8;
          st.shake = 0.15;
          sfx.slam();
          return;
        }
        st.hp--;
        st.hurtUntil = st.t + 1.2;
        st.shake = 0.3;
        sfx.hurt();
        if (st.hp <= 0) finish(true);
      };

      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        o.y += scroll * (o.kind === 'cloud' ? 0.85 : 1);
        o.x += o.vx * dt;
        if (o.kind === 'coin' || o.kind === 'gift') {
          o.x += Math.sin(st.t * 2 + o.phase) * 10 * dt;
          // 🧲 hút xu & quà lại gần diều
          const dx = st.x - o.x;
          const dy = KITE_Y - o.y;
          const d = Math.hypot(dx, dy);
          if (play.magnet && d < play.magnet + o.r && d > 1) {
            o.x += (dx / d) * 260 * dt;
            o.y += (dy / d) * 260 * dt;
          }
        }
        if (o.scared) o.y -= scroll * 0.8;
        if (o.y > H + 40 || o.x < -50 || o.x > W + 50) {
          objs.splice(i, 1);
          continue;
        }
        if (Math.hypot(o.x - st.x, o.y - KITE_Y) < o.r + 11) {
          if (o.kind === 'coin') {
            st.coins++;
            sfx.coin();
          } else if (o.kind === 'gift') {
            st.gifts++;
            sfx.open();
          } else if (o.kind === 'wind') {
            st.boostUntil = st.t + KITE_BOOST.sec * (play.wind ?? 1);
            sfx.harvest();
          } else if (o.kind === 'bird' && play.birdSafe) {
            // 🐦 chim hoảng sợ bay vụt đi
            if (!o.scared) {
              o.scared = true;
              o.vx = (o.x < st.x ? -1 : 1) * 320;
              sfx.swing();
            }
            continue;
          } else hurt();
          objs.splice(i, 1);
        }
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        if (st.t > b.strikeUntil) {
          bolts.splice(i, 1);
          continue;
        }
        if (st.t > b.warnUntil && !b.hit && Math.abs(b.x - st.x) < 22) {
          b.hit = true;
          if (!play.boltProof) hurt();
        }
      }
      for (const b of bg) {
        b.y += scroll * 0.35 * b.s;
        if (b.y > H + 30) {
          b.y = -30;
          b.x = Math.random() * W;
        }
      }

      // ---- vẽ
      const [top, bottom] = skyColors(st.alt);
      c.save();
      if (st.shake > 0) {
        st.shake -= dt;
        c.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      c.fillStyle = grad;
      c.fillRect(-10, -10, W + 20, H + 20);
      if (st.alt > 600) {
        c.fillStyle = '#fff';
        for (const s of stars) {
          c.globalAlpha = Math.min(1, (st.alt - 600) / 500) * (0.4 + 0.6 * Math.abs(Math.sin(st.t + s.a * 6)));
          c.fillRect(s.x, s.y, 1.5, 1.5);
        }
        c.globalAlpha = 1;
      }
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (const b of bg) {
        c.beginPath();
        c.ellipse(b.x, b.y, 30 * b.s, 11 * b.s, 0, 0, Math.PI * 2);
        c.ellipse(b.x + 18 * b.s, b.y - 6 * b.s, 20 * b.s, 10 * b.s, 0, 0, Math.PI * 2);
        c.fill();
      }
      // vạch độ cao mỗi 50 m
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.font = 'bold 11px sans-serif';
      c.setLineDash([6, 6]);
      for (let m = Math.ceil((st.alt - 10) / 50) * 50; m < st.alt + KITE_Y / PX_PER_M; m += 50) {
        const y = KITE_Y - (m - st.alt) * PX_PER_M;
        if (y < -10 || y > H) continue;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        c.fillText(`${m} m`, 6, y - 3);
      }
      c.setLineDash([]);
      // sét: cảnh báo đỏ rồi đánh xuống
      for (const b of bolts) {
        if (st.t < b.warnUntil) {
          c.fillStyle = `rgba(255,60,40,${0.12 + 0.12 * Math.abs(Math.sin(st.t * 14))})`;
          c.fillRect(b.x - 22, 0, 44, H);
          c.font = '20px serif';
          c.fillText('⚡', b.x - 10, 26);
        } else {
          c.fillStyle = 'rgba(255,255,200,0.9)';
          c.fillRect(b.x - 5, 0, 10, H);
          c.fillStyle = 'rgba(255,255,120,0.35)';
          c.fillRect(b.x - 22, 0, 44, H);
        }
      }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      for (const o of objs) {
        c.font = `${o.kind === 'cloud' ? 38 : 24}px serif`;
        c.save();
        c.translate(o.x, o.y);
        if (o.kind === 'bird' && o.vx < 0) c.scale(-1, 1);
        c.fillText(EMOJI[o.kind], 0, o.kind === 'bird' ? Math.sin(st.t * 8 + o.phase) * 2 : 0);
        c.restore();
      }
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      // dây diều
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(W / 2, H + 10);
      c.quadraticCurveTo(W / 2 + (st.x - W / 2) * 0.3 + 20, KITE_Y + 90, st.x, KITE_Y + 4);
      c.stroke();
      // 🧲 vòng hút xu
      if (play.magnet) {
        c.strokeStyle = 'rgba(255,230,120,0.3)';
        c.setLineDash([3, 5]);
        c.beginPath();
        c.arc(st.x, KITE_Y, play.magnet, st.t, st.t + Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      }
      // thân diều theo hình dáng, nghiêng theo hướng lái
      const blink = st.t < st.hurtUntil && Math.floor(st.t * 12) % 2 === 0;
      c.save();
      c.translate(st.x, KITE_Y);
      if (!blink) drawKite(c, kite, { t: st.t, vx: st.vx, tilt: Math.max(-0.4, Math.min(0.4, st.vx / 700)) });
      if (st.shield > 0) {
        c.strokeStyle = `rgba(127,232,255,${0.55 + 0.25 * Math.sin(st.t * 6)})`;
        c.fillStyle = 'rgba(127,232,255,0.12)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, -2, 30, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      if (boosting) {
        c.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 3; i++) c.fillRect(-20 + i * 18 + Math.sin(st.t * 20 + i) * 3, 22 + ((st.t * 120 + i * 13) % 30), 2, 10);
      }
      c.restore();
      c.restore();

      if (now - hudAt > 100) {
        hudAt = now;
        setHud({ alt: Math.floor(st.alt), hp: st.hp, coins: st.coins, gifts: st.gifts, shield: st.shield });
      }
      if (!st.over) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      st.over = true;
      cancelAnimationFrame(raf);
    };
  }, [phase, apply, kite, play]);

  const pointerX = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };
  const close = () => {
    bus.emit('kitedone', !!result && !result.crashed);
    onClose();
  };

  return (
    <div className="panel-backdrop">
      <div className="panel kite-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            {kite.emoji} Thả diều · {kite.name}
          </h3>
          {phase !== 'fly' && (
            <button className="icon-btn" onClick={close} aria-label="Đóng">
              ✕
            </button>
          )}
        </div>
        <div className="panel-body kite-body">
          {phase === 'intro' && (
            <div className="kite-intro">
              <KitePreview id={kite.id} />
              {g.kites.owned.length > 1 && (
                <div className="kite-pick">
                  {KITES.filter((k) => g.kites.owned.includes(k.id)).map((k) => (
                    <button
                      key={k.id}
                      className={k.id === kite.id ? 'on' : ''}
                      style={{ borderColor: RARITY_COLOR[k.rarity] }}
                      title={k.name}
                      onClick={() => act((g) => equipKite(g, k.id))}
                    >
                      {k.emoji}
                    </button>
                  ))}
                </div>
              )}
              <p>
                Lái diều bằng <b>← →</b> / <b>A D</b> hoặc <b>kéo ngón tay</b>. Né 🐦 chim, ⛈️ mây giông và cột ⚡ sét đỏ. Nhặt 🪙 xu, 🎁 túi quà, 💨 gió đẩy bay nhanh.
              </p>
              <p className="small">
                Càng cao càng nhiều quà nhưng càng nguy hiểm! Bấm <b>🪢 Thu diều</b> (hoặc Space) để giữ trọn phần thưởng — diều rơi chỉ còn {Math.round(KITE_CRASH_KEEP * 100)}% số xu.
                Bay qua {KITE_BUFF_ALT} m nhận <b>Gió lành +{Math.round((kite.mult - 1) * 100)}% vàng</b> từ quái trong {kite.minutes} phút.
              </p>
              <div className="kite-stats">
                <span>❤️ Độ bền {play.hp}</span>
                <span>⬆️ Bay ×{play.climb}</span>
                <span>🏆 Kỷ lục {fmt(g.kiteBest)} m</span>
              </div>
              {skills.length > 0 && (
                <div className="kite-skills">
                  {skills.map((s) => (
                    <span key={s.name} title={s.desc}>
                      {s.icon} {s.name}
                    </span>
                  ))}
                </div>
              )}
              <button className="btn gold block big-btn" onClick={() => setPhase('fly')}>
                🪁 Thả diều!
              </button>
            </div>
          )}
          {phase === 'fly' && (
            <>
              <div className="kite-hud">
                <b>⬆️ {fmt(hud.alt)} m</b>
                <span>
                  {'❤️'.repeat(Math.max(0, hud.hp))}
                  {'🖤'.repeat(Math.max(0, play.hp - hud.hp))}
                  {hud.shield > 0 && ` 🛡️${hud.shield}`}
                </span>
                <span>🪙 {hud.coins}</span>
                <span>🎁 {hud.gifts}</span>
              </div>
              <canvas
                ref={canvas}
                width={W}
                height={H}
                className="kite-canvas"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  input.current.target = pointerX(e);
                }}
                onPointerMove={(e) => {
                  if (input.current.target !== null) input.current.target = pointerX(e);
                }}
                onPointerUp={() => (input.current.target = null)}
                onPointerCancel={() => (input.current.target = null)}
              />
              <button className="btn gold block" onClick={() => reel.current()}>
                🪢 Thu diều · giữ trọn thưởng
              </button>
            </>
          )}
          {phase === 'end' && result && (
            <div className="kite-intro">
              <div className="kite-intro-emoji">{result.crashed ? '💥' : '🏁'}</div>
              <h2>{result.crashed ? 'Diều bị rơi!' : 'Thu diều thành công!'}</h2>
              {result.res.record && <p className="kite-record">🏆 KỶ LỤC MỚI: {fmt(result.alt)} m!</p>}
              <div className="kite-stats">
                <span>⬆️ {fmt(result.alt)} m</span>
                <span>
                  🪙 {result.res.coinsKept}
                  {result.crashed && `/${result.coins}`} xu
                </span>
              </div>
              <p>
                Nhận: <b>🪙 {fmt(result.res.gold)}</b>
                {(result.res.gifts.gems || Object.keys(result.res.gifts.items ?? {}).length > 0) && <> · 🎁 {rewardText(result.res.gifts)}</>}
              </p>
              {result.res.buff && <p className="buff-tag">🪁 Gió lành +{Math.round((kite.mult - 1) * 100)}% vàng từ quái trong {kite.minutes} phút!</p>}
              <div className="row">
                <button
                  className="btn gold grow"
                  onClick={() => {
                    setResult(null);
                    setHud({ alt: 0, hp: play.hp, coins: 0, gifts: 0, shield: play.shield ?? 0 });
                    setPhase('fly');
                  }}
                >
                  🪁 Bay lại
                </button>
                <button className="btn ghost grow" onClick={close}>
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** diều bay lượn trên nền trời — xem trước ở màn chuẩn bị & tiệm diều */
export function KitePreview({ id, w = 220, h = 150 }: { id: string; w?: number; h?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const k = KITE_BY_ID[id];
    const cv = ref.current!;
    const c = cv.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = h * dpr;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const x = w / 2 + Math.sin(t * 0.9) * w * 0.18;
      const y = h * 0.34 + Math.sin(t * 1.7) * 6;
      const vx = Math.cos(t * 0.9) * 120;
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(w * 0.3, h + 4);
      c.quadraticCurveTo(x - 10, y + 70, x, y + 4);
      c.stroke();
      c.translate(x, y);
      c.scale(h / 140, h / 140);
      drawKite(c, k, { t, vx, tilt: vx / 900 });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id, w, h]);
  return <canvas ref={ref} className="kite-preview" style={{ width: w, height: h }} />;
}
