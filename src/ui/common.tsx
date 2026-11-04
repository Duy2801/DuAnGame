import type { ReactNode } from 'react';
import { useGame } from '../store';

export function Modal({ title, onClose, children, className = '' }: { title: ReactNode; onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className={`sheet ${className}`.trim()} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, tone = 'green' }: { value: number; tone?: 'green' | 'gold' | 'blue' | 'red' }) {
  return (
    <div className={`bar ${tone}`}>
      <div style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }} />
    </div>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** lời NPC dạng bong bóng thoại ở đầu mỗi cửa hàng */
export function Quote({ text, who }: { text: string; who: string }) {
  return (
    <div className="npc-quote">
      <p>{text}</p>
      <b>— {who}</b>
    </div>
  );
}
