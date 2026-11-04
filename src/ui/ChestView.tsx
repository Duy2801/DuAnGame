import { useEffect, useState, type CSSProperties } from 'react';
import { fmt } from '../game/utils';
import {
  CHEST_SIZE,
  discardItem,
  equip,
  fmtLeft,
  itemInfo,
  loadCatalog,
  refreshChest,
  sellItem,
  slotExpiryText,
  useChest,
  useServerFishing,
  type InventorySlot,
} from '../services/fishingApi';
import { useGame } from '../store';

// Rương đồ 30 ô trên máy chủ: cá / mồi gộp 1 ô, mỗi cần câu & diều 1 ô riêng có hạn sử dụng.
// Mọi thao tác (trang bị, bán, vứt bỏ) là RPC — rương hiển thị đúng như server trả về.

const COLS = 6;
const REFRESH_MS = 60_000;
const KIND_LABEL = { stack: 'Vật phẩm', rod: 'Cần câu', kite: 'Diều' } as const;

export function ChestView() {
  const online = useServerFishing();
  const slots = useChest((s) => s.slots);
  const loading = useChest((s) => s.loading);
  const loaded = useChest((s) => s.loaded);
  const error = useChest((s) => s.error);
  const cat = useChest((s) => s.catalog);
  const gold = useGame((s) => s.game.gold);
  const gems = useGame((s) => s.game.gems);
  const [now, setNow] = useState(Date.now());
  const [sel, setSel] = useState<number | null>(null);

  // tải lần đầu + mỗi 60s (server purge đồ hết hạn khi đọc rương); đồng hồ đếm ngược mỗi 30s
  useEffect(() => {
    if (!online) return;
    void loadCatalog();
    void refreshChest({ quiet: true });
    const r = window.setInterval(() => void refreshChest({ quiet: true }), REFRESH_MS);
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearInterval(r);
      clearInterval(t);
    };
  }, [online]);

  if (!online) {
    return (
      <div className="chestv">
        <div className="chestv-empty">
          <span>🔒</span>
          <p>Rương đồ 30 ô nằm trên máy chủ — đăng nhập bản online để dùng.</p>
        </div>
      </div>
    );
  }

  // món đã hết hạn nhưng server chưa purge (chưa tới lần refresh) thì ẩn luôn
  const live = slots.filter((s) => !s.expires_at || Date.parse(s.expires_at) > now);
  const bySlot = new Map(live.map((s) => [s.slot, s]));
  const picked = sel !== null ? bySlot.get(sel) ?? null : null;
  const full = live.length >= CHEST_SIZE;

  return (
    <div className="chestv">
      <header className="chestv-head">
        <div className="chestv-title">
          <b>
            Rương đồ <span className={full ? 'full' : ''}>{live.length}/{CHEST_SIZE}</span>
          </b>
          <small>{full ? '⚠️ Rương đầy — vứt bớt đồ để mở hộp / câu cá' : 'Cá & mồi gộp 1 ô · mỗi cần, diều 1 ô riêng'}</small>
        </div>
        <div className="chestv-wallet">
          <span>🪙 {fmt(gold)}</span>
          <span>💎 {fmt(gems)}</span>
        </div>
        <button className="icon-btn chestv-refresh" disabled={loading} onClick={() => void refreshChest()} title="Tải lại rương" aria-label="Tải lại rương">
          <span className={loading ? 'spin' : ''}>🔄</span>
        </button>
      </header>

      <div className="chestv-bar">
        <i style={{ width: `${(live.length / CHEST_SIZE) * 100}%` }} className={full ? 'full' : ''} />
      </div>

      {error && !loaded && <p className="chestv-err">⚠️ {error}</p>}

      <div className="chestv-grid" style={{ '--cols': COLS } as CSSProperties}>
        {Array.from({ length: CHEST_SIZE }, (_, i) => {
          const s = bySlot.get(i);
          if (!s) return <div key={i} className="cslot empty" aria-label={`Ô ${i + 1} trống`} />;
          const info = itemInfo(s.item_id, s.kind, cat);
          const exp = slotExpiryText(s, now);
          const soon = s.expires_at && Date.parse(s.expires_at) - now < 86_400_000;
          return (
            <button
              key={i}
              className={`cslot k-${s.kind} ${sel === i ? 'sel' : ''} ${s.equipped ? 'eq' : ''}`}
              style={{ '--rc': info.color } as CSSProperties}
              onClick={() => setSel(sel === i ? null : i)}
              title={info.name}
            >
              <span className="cslot-emoji">{info.emoji}</span>
              {s.kind === 'stack' && s.qty > 1 && <b className="cslot-qty">x{s.qty > 9999 ? '9999+' : s.qty}</b>}
              {exp && <small className={`cslot-exp ${!s.expires_at ? 'perm' : soon ? 'soon' : ''}`}>{exp}</small>}
              {s.equipped && <i className="cslot-eq" title="Đang trang bị">✔</i>}
            </button>
          );
        })}
      </div>

      {loading && !loaded && <p className="chestv-hint">⏳ Đang mở rương…</p>}
      {loaded && live.length === 0 && <p className="chestv-hint">Rương trống trơn. Câu cá, mua mồi hoặc mở hộp cần / diều để có đồ.</p>}

      {picked && <SlotDetail key={picked.id} s={picked} now={now} onClose={() => setSel(null)} />}
    </div>
  );
}

/** popover chi tiết 1 ô + hành động */
function SlotDetail({ s, now, onClose }: { s: InventorySlot; now: number; onClose: () => void }) {
  const cat = useChest((st) => st.catalog);
  const info = itemInfo(s.item_id, s.kind, cat);
  const [qty, setQty] = useState(s.qty);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useGame((st) => st.toast);
  const n = Math.max(1, Math.min(s.qty, Math.floor(qty) || 1));
  const stack = s.kind === 'stack';
  const canEquip = (s.kind === 'rod' || s.kind === 'kite') && !s.equipped;
  const canSell = info.isFish;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const doEquip = () =>
    run(async () => {
      if (await equip(s.slot)) toast(`${info.emoji} Đã trang bị ${info.name}`);
    });
  const doSell = () =>
    run(async () => {
      const gold = await sellItem(s.slot, n);
      if (gold !== null) {
        toast(`💰 Đã bán ${info.emoji} ${info.name} ×${n} · +🪙${fmt(gold)}`);
        if (n >= s.qty) onClose();
      }
    });
  const doDiscard = () =>
    run(async () => {
      const all = !stack || n >= s.qty;
      if (await discardItem(s.slot, all ? null : n)) {
        toast(`🗑️ Đã vứt ${info.emoji} ${info.name}${stack ? ` ×${n}` : ''}`);
        if (all) onClose();
        else setConfirm(false);
      }
    });

  const expiry = s.kind === 'stack' ? null : s.expires_at ? Date.parse(s.expires_at) : 0;

  return (
    <div className="cpop-backdrop" onClick={onClose}>
      <div className="cpop" style={{ '--rc': info.color } as CSSProperties} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={info.name}>
        <button className="icon-btn cpop-x" onClick={onClose} aria-label="Đóng">
          ✕
        </button>
        <div className="cpop-head">
          <span className="cpop-emoji">{info.emoji}</span>
          <div>
            <b>{info.name}</b>
            <small>
              <span className="cpop-rar">{info.rarity}</span> · {KIND_LABEL[s.kind]} · ô {s.slot + 1}
            </small>
          </div>
        </div>

        <div className="cpop-facts">
          {stack && (
            <span>
              Số lượng <b>{fmt(s.qty)}</b>
            </span>
          )}
          {info.price !== undefined && (
            <span>
              Giá bán <b>🪙{fmt(info.price)}</b>/con
            </span>
          )}
          {expiry !== null && (
            <span>
              Hạn dùng{' '}
              <b className={expiry ? '' : 'perm'}>
                {expiry ? `⏳ ${fmtLeft(expiry - now)} (${new Date(expiry).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })})` : '♾️ Vĩnh viễn'}
              </b>
            </span>
          )}
          {s.equipped && <span className="cpop-on">✔ Đang trang bị</span>}
        </div>

        {stack && s.qty > 1 && (canSell || confirm) && (
          <label className="cpop-qty">
            Số lượng
            <input type="number" min={1} max={s.qty} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            <button className="btn sm ghost" onClick={() => setQty(s.qty)}>
              Tất cả
            </button>
          </label>
        )}

        {confirm ? (
          <div className="cpop-confirm">
            <p>
              Vứt bỏ {info.emoji} <b>{info.name}</b>
              {stack ? ` ×${n}` : ''}? Không lấy lại được!
            </p>
            <div className="cpop-actions">
              <button className="btn danger" disabled={busy} onClick={() => void doDiscard()}>
                🗑️ Vứt luôn
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => setConfirm(false)}>
                Thôi
              </button>
            </div>
          </div>
        ) : (
          <div className="cpop-actions">
            {canEquip && (
              <button className="btn gold" disabled={busy} onClick={() => void doEquip()}>
                {s.kind === 'rod' ? '🎣' : '🪁'} Trang bị
              </button>
            )}
            {canSell && (
              <button className="btn gold" disabled={busy} onClick={() => void doSell()}>
                💰 Bán {n > 1 ? `×${n}` : ''} · 🪙{fmt((info.price ?? 0) * n)}
              </button>
            )}
            <button className="btn danger" disabled={busy} onClick={() => setConfirm(true)}>
              🗑️ Vứt bỏ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
