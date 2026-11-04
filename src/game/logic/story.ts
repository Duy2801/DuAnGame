import { MONSTERS } from '../config/combat';
import { STORY } from '../config/story';
import type { GameState } from '../types';
import { fail } from '../utils';
import { giveReward, rewardText } from './core';

export const currentStory = (g: GameState) => STORY[g.story.step] ?? null;

/** Ghi nhận tiến độ cốt truyện (chỉ khi đã nhận nhiệm vụ) */
export function storyTrack(g: GameState, type: string, target?: string, n = 1) {
  const s = currentStory(g);
  if (!s || !g.story.accepted || s.goal.type !== type) return;
  if (s.goal.type === 'kill' && s.goal.target !== target) return;
  g.story.progress = Math.min(s.goal.n, g.story.progress + n);
}

export type NpcQuestState = 'offer' | 'progress' | 'done' | null;

export function npcQuestState(g: GameState, npcId: string): NpcQuestState {
  const s = currentStory(g);
  if (!s || s.giver !== npcId) return null;
  if (!g.story.accepted) return 'offer';
  return g.story.progress >= s.goal.n ? 'done' : 'progress';
}

export function acceptStory(g: GameState): string {
  const s = currentStory(g);
  if (!s || g.story.accepted) fail('Không có nhiệm vụ để nhận');
  g.story.accepted = true;
  g.story.progress = 0;
  return `📜 Nhận nhiệm vụ: ${s.title}`;
}

export function completeStory(g: GameState): string {
  const s = currentStory(g);
  if (!s || !g.story.accepted || g.story.progress < s.goal.n) fail('Chưa hoàn thành nhiệm vụ');
  giveReward(g, s.reward);
  g.story = { step: g.story.step + 1, accepted: false, progress: 0 };
  return `✅ Hoàn thành "${s.title}": ${rewardText(s.reward)}`;
}

export function goalText(g: GameState): string | null {
  const s = currentStory(g);
  if (!s) return null;
  const goal = s.goal;
  const what =
    goal.type === 'kill' ? `Hạ ${goal.n} ${goalTargetName(goal.target)}`
    : goal.type === 'harvest' ? `Thu hoạch ${goal.n} ô ruộng`
    : goal.type === 'buy_equip' ? 'Mua 1 trang bị ở Kho Hội'
    : goal.type === 'fish' ? `Câu ${goal.n} con cá`
    : goal.type === 'ranch' ? `Thu sản phẩm vật nuôi ${goal.n} lần`
    : 'Thả diều trên Đồi Gió';
  return what;
}

const goalTargetName = (id: string) => MONSTERS[id]?.name ?? id;
