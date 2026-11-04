export type SkillId = 'dash' | 'spin' | 'wave' | 'heal';

export interface SkillDef {
  id: SkillId;
  name: string;
  emoji: string;
  level: number;
  cd: number;
  key: string;
  desc: string;
}

export const SKILLS: SkillDef[] = [
  { id: 'dash', name: 'Lướt', emoji: '💨', level: 1, cd: 2500, key: 'Shift', desc: 'Lướt nhanh về phía trước, bất tử trong chốc lát' },
  { id: 'spin', name: 'Chém xoáy', emoji: '🌀', level: 3, cd: 6000, key: 'U', desc: 'Xoay kiếm 360°, gây 160% sát thương mọi quái xung quanh' },
  { id: 'wave', name: 'Sóng kiếm', emoji: '🌊', level: 6, cd: 8000, key: 'I', desc: 'Phóng sóng kiếm xuyên thấu, 220% sát thương' },
  { id: 'heal', name: 'Hồi phục', emoji: '💚', level: 10, cd: 30000, key: 'O', desc: 'Hồi ngay 35% HP tối đa' },
];
