import { useEffect, useRef, useState } from 'react';
import { EQUIP_BY_ID } from '../game/config/equipment';
import { ITEMS } from '../game/config/farm';
import { RARITY_COLOR, ROD_BY_ID } from '../game/config/shops';
import { itemCount } from '../game/logic/core';
import { HOTBAR_SIZE, kindOf, selectSlot } from '../game/logic/hotbar';
import { eatFood } from '../game/logic/player';
import { rodIconURL, weaponIconURL } from '../art/rodArt';
import { useGame } from '../store';
import { bus } from '../world/bus';
import { sfx } from '../world/sfx';

export const itemIcon = (id: string) => (kindOf(id) === 'rod' ? rodIconURL(id) : weaponIconURL(id));
export const itemName = (id: string) => {
  const k = kindOf(id);
  return (k === 'rod' ? ROD_BY_ID[id]?.name : k === 'use' ? ITEMS[id]?.name : EQUIP_BY_ID[id]?.name) ?? id;
};
export const itemColor = (id: string) => {
  const k = kindOf(id);
  const wRar = EQUIP_BY_ID[id]?.rarity;
  return k === 'rod' ? RARITY_COLOR[ROD_BY_ID[id].rarity] : k === 'use' ? '#9dffa8' : wRar ? RARITY_COLOR[wRar] : '#e8e8f0';
};

/** icon của món trong ô: vũ khí / cần câu vẽ pixel, đồ ăn dùng emoji */
export function SlotIcon({ id }: { id: string }) {
  if (kindOf(id) === 'use') return <span className="hb-emoji">{ITEMS[id]?.emoji}</span>;
  return <img src={itemIcon(id)} alt="" draggable={false} />;
}

/** nội dung 1 ô của thanh nhanh (dùng chung cho HUD và hành trang) */
export function SlotFace({ id, index }: { id: string | null; index: number }) {
  const inv = useGame((s) => s.game.inventory);
  const k = kindOf(id);
  const n = k === 'use' && id ? inv[id] ?? 0 : 0;
  return (
    <>
      <span className="hb-key">{(index + 1) % 10}</span>
      {id && (
        <>
          <SlotIcon id={id} />
          {(k === 'rod' || k === 'weapon') && <i className="hb-rar" style={{ background: itemColor(id) }} />}
          {k === 'use' && <b className={`hb-count ${n ? '' : 'zero'}`}>{n}</b>}
        </>
      )}
    </>
  );
}

/** Thanh 10 ô kiểu Minecraft — luôn hiện. Chọn bằng phím 1–0, lăn chuột hoặc chạm. Ô đồ ăn: bấm là ăn. Nút 🎒 mở hành trang. */
export function Hotbar() {
  const slots = useGame((s) => s.game.hotbar.slots);
  const sel = useGame((s) => s.game.hotbar.sel);
  const apply = useGame((s) => s.apply);
  const act = useGame((s) => s.act);
  const [tip, setTip] = useState<{ name: string; color: string } | null>(null);
  const tipTimer = useRef<number>();

  const showTip = (name: string, color: string) => {
    setTip({ name, color });
    clearTimeout(tipTimer.current);
    tipTimer.current = window.setTimeout(() => setTip(null), 1500);
  };

  const select = (i: number) => {
    const id = slots[i];
    // ô đồ ăn/bình máu: dùng luôn, vẫn cầm món cũ
    if (kindOf(id) === 'use') {
      if (itemCount(useGame.getState().game, id!) < 1) {
        showTip(`Hết ${itemName(id!)}`, '#ff8a7a');
        return;
      }
      if (act((g) => eatFood(g, id!))) sfx.harvest();
      return;
    }
    apply((g) => selectSlot(g, i));
    sfx.open();
    if (id) showTip(itemName(id), itemColor(id));
    else showTip('Tay không', '#d8d4c8');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      // đang mở cửa sổ thì phím số để cửa sổ dùng
      if (document.querySelector('.panel-backdrop')) return;
      const m = /^Digit(\d)$/.exec(e.code);
      if (!m) return;
      const n = Number(m[1]);
      select(n === 0 ? 9 : n - 1);
    };
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.tagName !== 'CANVAS') return;
      // lăn chuột bỏ qua ô đồ ăn (không cầm được)
      let i = sel;
      for (let step = 0; step < HOTBAR_SIZE; step++) {
        i = (i + (e.deltaY > 0 ? 1 : HOTBAR_SIZE - 1)) % HOTBAR_SIZE;
        if (kindOf(slots[i]) !== 'use') break;
      }
      select(i);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  });

  return (
    <div className="hotbar-wrap">
      {tip && (
        <div className="hb-name" style={{ color: tip.color }} key={tip.name + Date.now()}>
          {tip.name}
        </div>
      )}
      <div className="hotbar-row">
        <div className="hotbar">
          {slots.map((id, i) => (
            <button key={i} className={`hb-slot ${i === sel ? 'sel' : ''}`} onClick={() => select(i)} title={id ? itemName(id) : 'Ô trống (tay không)'}>
              <SlotFace id={id} index={i} />
            </button>
          ))}
        </div>
        <button className="hb-bag" onClick={() => bus.emit('panel', 'inventory')} title="Hành trang (B)">
          🎒
        </button>
      </div>
    </div>
  );
}
