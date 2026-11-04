import { useState } from 'react';
import { ITEMS, RECIPES } from '../game/config/farm';
import { CLASSES, HERO_MAX_LEVEL, MAX_TEAM, MISSIONS, MISSION_BY_ID, RANKS, RECRUIT, rankIndex } from '../game/config/guild';
import { itemCount } from '../game/logic/core';
import {
  busyHeroIds, claimMission, dismissHero, heroCap, heroPower, levelUp, levelUpCost, missionPreview, recruit, sendMission,
} from '../game/logic/guild';
import type { ActiveMission, Hero, MissionDef } from '../game/types';
import { fmt, fmtTime, pct } from '../game/utils';
import { useGame } from '../store';
import { Bar, Modal } from './common';

export function GuildView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const [sending, setSending] = useState<MissionDef | null>(null);

  const rank = rankIndex(g.guildXp);
  const cur = RANKS[rank];
  const next = RANKS[rank + 1];
  const busy = busyHeroIds(g);
  const idle = g.heroes.length - busy.size;
  const board = MISSIONS.filter((m) => m.rankReq <= rank);
  const locked = MISSIONS.find((m) => m.rankReq > rank);
  const heroes = [...g.heroes].sort((a, b) => heroPower(b) - heroPower(a));

  return (
    <>
      <section className="card guild-head">
        <div className="rank-badge">{cur.name}</div>
        <div className="grow">
          <h2>Hội Mạo Hiểm Giả</h2>
          <Bar value={next ? (g.guildXp - cur.xp) / (next.xp - cur.xp) : 1} tone="gold" />
          <small className="muted">
            {next ? `${fmt(g.guildXp)}/${fmt(next.xp)} XP lên rank ${next.name}` : 'Đã đạt rank cao nhất!'}
          </small>
        </div>
      </section>

      {g.missions.length > 0 && (
        <section className="card">
          <h2>🧭 Đội đang thám hiểm</h2>
          <div className="list">
            {g.missions.map((am) => (
              <ActiveRow key={am.uid} am={am} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h2>📋 Bảng nhiệm vụ</h2>
          <span className="tag">{idle} người rảnh</span>
        </div>
        <div className="list">
          {board.map((m) => (
            <div key={m.id} className="mission">
              <span className="big-emoji">{m.emoji}</span>
              <div className="grow">
                <b>{m.name}</b> <span className="tag sm">{RANKS[m.rankReq].name}</span>
                <div className="small muted">
                  ⏱ {fmtTime(m.durationSec * 1000)} · 💪 {m.reqPower} · 🪙 {fmt(m.gold[0])}–{fmt(m.gold[1])} · +{m.xp} XP
                </div>
                {(m.drops.length > 0 || m.gems) && (
                  <div className="small muted">
                    Có thể rơi: {m.drops.map((d) => ITEMS[d.item].emoji).join(' ')}
                    {m.gems && ' 💎'}
                  </div>
                )}
              </div>
              <button className="btn sm" disabled={idle === 0} onClick={() => setSending(m)}>
                Gửi đội
              </button>
            </div>
          ))}
          {locked && (
            <div className="mission locked">
              <span className="big-emoji">🔒</span>
              <div className="grow">
                <b>{locked.name}</b>
                <div className="small muted">Mở khi Hội đạt rank {RANKS[locked.rankReq].name}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <h2>🧝 Mạo hiểm giả</h2>
          <span className="tag">
            {g.heroes.length}/{heroCap(g)}
          </span>
        </div>
        <div className="list">
          {heroes.map((h) => (
            <HeroRow key={h.id} hero={h} busy={busy.has(h.id)} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>🍺 Quán rượu — tuyển người</h2>
        <div className="actions">
          <button className="btn gold" onClick={() => act((g) => recruit(g, 'gold'))}>
            Tuyển thường · 🪙 {RECRUIT.gold.cost}
          </button>
          <button className="btn purple" onClick={() => act((g) => recruit(g, 'gems'))}>
            Tuyển VIP · 💎 {RECRUIT.gems.cost}
          </button>
        </div>
        <p className="small muted">
          Thường: N {pct(RECRUIT.gold.odds.N)} · R {pct(RECRUIT.gold.odds.R)} · SR {pct(RECRUIT.gold.odds.SR)} · SSR{' '}
          {pct(RECRUIT.gold.odds.SSR)}
          <br />
          VIP: R {pct(RECRUIT.gems.odds.R)} · SR {pct(RECRUIT.gems.odds.SR)} · SSR {pct(RECRUIT.gems.odds.SSR)}
        </p>
      </section>

      {sending && <SendModal mission={sending} onClose={() => setSending(null)} />}
    </>
  );
}

function ActiveRow({ am }: { am: ActiveMission }) {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const m = MISSION_BY_ID[am.missionId];
  const done = now >= am.endAt;
  const names = am.heroIds.map((id) => g.heroes.find((h) => h.id === id)?.name ?? '?').join(', ');
  return (
    <div className={`mission active ${done ? 'done' : ''}`}>
      <span className="big-emoji">{m.emoji}</span>
      <div className="grow">
        <b>{m.name}</b>
        <div className="small muted">
          {names} · 🎯 {pct(am.chance)}
        </div>
        {!done && <Bar value={(now - am.startAt) / (am.endAt - am.startAt)} tone="blue" />}
      </div>
      {done ? (
        <button className="btn sm" onClick={() => act((g, now) => claimMission(g, am.uid, now))}>
          Nhận
        </button>
      ) : (
        <span className="timer">{fmtTime(am.endAt - now)}</span>
      )}
    </div>
  );
}

function HeroRow({ hero: h, busy }: { hero: Hero; busy: boolean }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const c = CLASSES[h.cls];
  const maxed = h.level >= HERO_MAX_LEVEL;
  const cost = levelUpCost(h);
  return (
    <div className="hero">
      <span className={`rarity r-${h.rarity}`}>{h.rarity}</span>
      <span className="big-emoji">{c.emoji}</span>
      <div className="grow">
        <b>{h.name}</b> <span className="small muted">Lv {h.level}</span>
        <div className="small muted">
          {c.name} · 💪 {fmt(heroPower(h))}
        </div>
        <div className="small perk">{c.perk}</div>
      </div>
      {busy ? (
        <span className="tag">Đang đi</span>
      ) : (
        <div className="hero-actions">
          <button className="btn sm gold" disabled={maxed || g.gold < cost} onClick={() => act((g) => levelUp(g, h.id))}>
            {maxed ? 'Max' : <>⬆ 🪙{fmt(cost)}</>}
          </button>
          <button
            className="link-btn"
            onClick={() => {
              if (confirm(`Cho ${h.name} rời Hội?`)) act((g) => dismissHero(g, h.id));
            }}
          >
            cho nghỉ
          </button>
        </div>
      )}
    </div>
  );
}

function SendModal({ mission, onClose }: { mission: MissionDef; onClose: () => void }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const busy = busyHeroIds(g);
  const idleHeroes = g.heroes.filter((h) => !busy.has(h.id)).sort((a, b) => heroPower(b) - heroPower(a));
  const [picked, setPicked] = useState<number[]>(() => idleHeroes.slice(0, MAX_TEAM).map((h) => h.id));
  const [food, setFood] = useState<string | null>(null);
  const foods = RECIPES.filter((r) => itemCount(g, r.id) > 0);
  const p = missionPreview(g, mission, picked, food);
  const chanceTone = p.chance < 0.5 ? 'bad' : p.chance < 0.8 ? 'mid' : 'good';

  const toggle = (id: number) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_TEAM ? [...cur, id] : cur));

  return (
    <Modal title={`${mission.emoji} ${mission.name}`} onClose={onClose}>
      <h4>Chọn đội (tối đa {MAX_TEAM})</h4>
      <div className="chips">
        {idleHeroes.map((h) => (
          <button key={h.id} className={`chip ${picked.includes(h.id) ? 'on' : ''}`} onClick={() => toggle(h.id)}>
            {CLASSES[h.cls].emoji} {h.name}{' '}
            <small>
              {h.rarity} · 💪{fmt(heroPower(h))}
            </small>
          </button>
        ))}
      </div>

      <h4>Mang theo đồ ăn</h4>
      <div className="chips">
        <button className={`chip ${food === null ? 'on' : ''}`} onClick={() => setFood(null)}>
          Không mang
        </button>
        {foods.map((r) => (
          <button key={r.id} className={`chip ${food === r.id ? 'on' : ''}`} onClick={() => setFood(r.id)}>
            {r.emoji} {r.name} ×{itemCount(g, r.id)} <small>+{pct(r.successBonus)}</small>
          </button>
        ))}
      </div>
      {foods.length === 0 && <p className="small muted">Nấu món ở Bếp (tab Nông trại) để tăng tỉ lệ thành công.</p>}

      <div className="preview">
        <div>
          <small>Sức mạnh</small>
          <b>
            {fmt(p.power)}/{mission.reqPower}
          </b>
        </div>
        <div>
          <small>Thành công</small>
          <b className={chanceTone}>{pct(p.chance)}</b>
        </div>
        <div>
          <small>Thời gian</small>
          <b>{fmtTime(p.durationMs)}</b>
        </div>
      </div>

      <button
        className="btn block"
        disabled={!picked.length}
        onClick={() => {
          if (act((g, now) => sendMission(g, mission.id, picked, food, now))) onClose();
        }}
      >
        Xuất phát!
      </button>
    </Modal>
  );
}
