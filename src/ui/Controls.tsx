import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { SKILLS } from '../game/config/skills';
import { foodCount } from '../game/logic/player';
import { useGame } from '../store';
import { bus, controls, skillCd } from '../world/bus';

const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

export function Controls() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [touch] = useState(isTouch);
  const food = useGame((s) => foodCount(s.game));

  useEffect(() => bus.on('prompt', setPrompt), []);

  return (
    <>
      {touch && <Joystick />}
      {/* Prompt tương tác duy nhất: dạng pill bo tròn bán trong suốt ở giữa đáy màn hình trên thanh 10 ô */}
      {prompt && (
        <button
          className="hud-interact-pill"
          onPointerDown={() => (controls.interact = true)}
          title="Nhấn E hoặc chạm để tương tác"
        >
          <span className="pill-key">{touch ? '✋' : 'E'}</span>
          <span className="pill-text">{prompt}</span>
        </button>
      )}
      <div className="action-pad">
        <SkillBar touch={touch} />
        <button className="act-btn eat" disabled={!food} onPointerDown={() => (controls.eat = true)}>
          <span>🍖</span>
          <small>{food}</small>
        </button>
        <HoldButton className="act-btn attack" onFire={() => (controls.attack = true)}>
          <span>⚔️</span>
        </HoldButton>
      </div>
    </>
  );
}

/** Nút kỹ năng có vòng hồi chiêu */
function SkillBar({ touch }: { touch: boolean }) {
  const level = useGame((s) => s.game.player.level);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);
  const now = Date.now();

  return (
    <div className="skill-bar">
      {SKILLS.map((s) => {
        const locked = level < s.level;
        const left = Math.max(0, (skillCd[s.id] ?? 0) - now);
        const frac = left / s.cd;
        return (
          <button
            key={s.id}
            className={`skill-btn ${locked ? 'locked' : ''}`}
            title={`${s.name} (${s.key}) — ${s.desc}`}
            onPointerDown={() => (controls.skill = s.id)}
            style={{ ['--cd' as string]: `${frac * 360}deg` }}
          >
            <span>{locked ? '🔒' : s.emoji}</span>
            {left > 0 && <i>{Math.ceil(left / 1000)}</i>}
            {locked ? <small>Lv{s.level}</small> : !touch && <small>{s.key === 'Shift' ? '⇧' : s.key}</small>}
          </button>
        );
      })}
    </div>
  );
}

/** Giữ nút để chém liên tục */
function HoldButton({ className, onFire, children }: { className: string; onFire: () => void; children: ReactNode }) {
  const timer = useRef<number>();
  const stop = () => clearInterval(timer.current);
  useEffect(() => stop, []);
  return (
    <button
      className={className}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onFire();
        stop();
        timer.current = window.setInterval(onFire, 120);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      {children}
    </button>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 42;

  const move = (e: PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    controls.joyX = dx / R;
    controls.joyY = dy / R;
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    controls.joyX = controls.joyY = 0;
  };

  return (
    <div
      ref={base}
      className="joy"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = e.pointerId;
        move(e);
      }}
      onPointerMove={(e) => active.current === e.pointerId && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joy-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
