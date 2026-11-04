import { useMemo, useState } from 'react';
import { NPC_DEFS, STORY } from '../game/config/story';
import { rewardText } from '../game/logic/core';
import { acceptStory, completeStory, goalText, npcQuestState } from '../game/logic/story';
import { pick } from '../game/utils';
import { useGame } from '../store';
import { bus, type PanelId } from '../world/bus';

export function DialogBox({ npcId, onClose }: { npcId: string; onClose: () => void }) {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);
  const npc = NPC_DEFS[npcId];
  const state = npcQuestState(g, npcId);
  const step = STORY[g.story.step];
  const [page, setPage] = useState(0);
  const flavor = useMemo(() => pick(npc.lines), [npc]);

  let lines: string[];
  if (state === 'offer') lines = step.intro;
  else if (state === 'progress') lines = [`Thế nào rồi? ${goalText(g)} (${g.story.progress}/${step.goal.n}).`];
  else if (state === 'done') lines = [step.done];
  else lines = [g.story.step >= STORY.length && npcId === 'chief' ? '🏆 Anh hùng của làng! Cả làng tự hào về ngươi.' : flavor];
  const last = page >= lines.length - 1;
  const shop = npc.panel ? { panel: npc.panel as PanelId, label: npc.panelLabel ?? 'Mở cửa hàng' } : null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-portrait">{npc.emoji}</div>
        <div className="dialog-main">
          <div className="dialog-name">
            {npc.name}
            {state && <span className="dialog-quest">📜 {step.title}</span>}
          </div>
          <p className="dialog-text" key={page}>
            {lines[page]}
          </p>
          {state === 'offer' && last && (
            <p className="small dialog-reward">
              🎯 {goalText(g)} · 🎁 {rewardText(step.reward)}
            </p>
          )}
          <div className="dialog-actions">
            {!last ? (
              <button className="btn sm" onClick={() => setPage(page + 1)}>
                Tiếp ▶
              </button>
            ) : state === 'offer' ? (
              <button
                className="btn sm gold"
                onClick={() => {
                  act((g) => acceptStory(g));
                  onClose();
                }}
              >
                ✋ Nhận nhiệm vụ
              </button>
            ) : state === 'done' ? (
              <button
                className="btn sm gold"
                onClick={() => {
                  act((g) => completeStory(g));
                  onClose();
                }}
              >
                🎁 Nhận thưởng
              </button>
            ) : null}
            {shop && (
              <button
                className="btn sm ghost"
                onClick={() => {
                  onClose();
                  bus.emit('panel', shop.panel);
                }}
              >
                {shop.label}
              </button>
            )}
            <button className="btn sm ghost" onClick={onClose}>
              Tạm biệt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
