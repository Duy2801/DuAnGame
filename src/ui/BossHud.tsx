import { useEffect, useState } from 'react';
import { weaponIconURL } from '../art/rodArt';
import { EQUIP_BY_ID } from '../game/config/equipment';
import { ITEMS } from '../game/config/farm';
import { fmt } from '../game/utils';
import { bus, type BossLootEvent, type BusEvents } from '../world/bus';

// Thanh máu boss trên đầu màn hình + bảng rương báu sau khi hạ boss

const STAT_TEXT: [keyof typeof EQUIP_BY_ID[string], string][] = [
  ['atk', '⚔️'], ['def', '🛡️'], ['hp', '❤️'], ['crit', '💥'], ['regen', '💚'], ['speed', '👟'],
];

function gearStats(id: string) {
  const e = EQUIP_BY_ID[id];
  return STAT_TEXT.filter(([k]) => e[k])
    .map(([k, icon]) => {
      const v = e[k] as number;
      return `${icon}${k === 'crit' || k === 'speed' ? `${Math.round(v * 100)}%` : v}`;
    })
    .join(' ');
}

export function BossHud() {
  const [boss, setBoss] = useState<BusEvents['boss']>(null);
  const [loot, setLoot] = useState<BossLootEvent | null>(null);

  useEffect(() => {
    const off = [bus.on('boss', setBoss), bus.on('bossloot', setLoot)];
    return () => off.forEach((f) => f());
  }, []);

  return (
    <>
      {boss && (
        <div className={`boss-bar ${boss.enraged ? 'rage' : ''}`}>
          <div className="boss-name">
            👑 {boss.name} {boss.enraged && <em>🔥 NỔI GIẬN</em>}
          </div>
          <div className="boss-track">
            <div className="boss-fill" style={{ width: `${(boss.hp / boss.max) * 100}%` }} />
            <span>
              {fmt(boss.hp)} / {fmt(boss.max)}
            </span>
          </div>
        </div>
      )}
      {loot && (
        <div className="boss-loot-back" onClick={() => setLoot(null)}>
          <div className="boss-loot" onClick={(e) => e.stopPropagation()}>
            <div className="bl-rays" />
            <h3>🏆 Đã hạ {loot.boss}!</h3>
            {loot.first && <div className="bl-tag">✨ Hạ lần đầu — trang bị độc quyền + kim cương ×2</div>}
            {loot.jackpot && <div className="bl-tag gold">💥 BẠO KÍCH VÀNG ×3!</div>}
            <div className="bl-money">
              <b>🪙 {fmt(loot.gold)}</b>
              {loot.gems > 0 && <b>💎 {loot.gems}</b>}
              <b>⭐ {fmt(loot.xp)} XP</b>
            </div>
            {loot.gear.length > 0 && (
              <div className="bl-gear">
                {loot.gear.map((id) => {
                  const e = EQUIP_BY_ID[id];
                  return (
                    <div key={id} className={`bl-card ${e.boss ? 'sig' : ''}`}>
                      {e.slot === 'weapon' ? <img src={weaponIconURL(id)} alt="" /> : <span className="bl-emoji">{e.emoji}</span>}
                      <div>
                        <b>{e.name}</b>
                        <small>{e.boss ? '👑 Độc quyền boss' : '🎁 Trang bị'} · {gearStats(id)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {loot.dupes.length > 0 && (
              <p className="small muted">Đã có {loot.dupes.map((id) => EQUIP_BY_ID[id].name).join(', ')} → đổi thành vàng</p>
            )}
            <div className="bl-items">
              {Object.entries(loot.items).map(([id, n]) => (
                <span key={id}>
                  {ITEMS[id]?.emoji} {ITEMS[id]?.name} ×{n}
                </span>
              ))}
            </div>
            {loot.gear.length > 0 && <p className="small">Mở 🎒 Hành trang (phím B) để mặc / cầm đồ mới.</p>}
            <button className="btn" onClick={() => setLoot(null)}>
              Tuyệt vời!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
