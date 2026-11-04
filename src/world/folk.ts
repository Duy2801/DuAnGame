import Phaser from 'phaser';
import { ORIGIN_Y } from '../art/avatar';
import { NPC_DEFS } from '../game/config/story';
import { npcQuestState } from '../game/logic/story';
import { useGame } from '../store';
import { bus } from './bus';
import type { MapData } from './map';
import { sfx } from './sfx';
import { T } from './textures';
import type { WorldScene } from './WorldScene';

type Dir = 'down' | 'up' | 'left' | 'right';
const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const TEXT_FONT = 'system-ui, "Segoe UI", sans-serif';

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** tạo bong bóng thoại nhỏ bay nhẹ trên đầu nhân vật */
function showBubble(scene: Phaser.Scene, x: number, y: number, text: string, color = '#fffbe8') {
  const b = scene.add
    .text(x, y, text, {
      fontFamily: TEXT_FONT,
      fontSize: '6px',
      fontStyle: 'bold',
      color,
      backgroundColor: '#1a1208d8',
      padding: { x: 3, y: 1.5 },
      resolution: 4,
    })
    .setOrigin(0.5, 1)
    .setDepth(99600);
  scene.tweens.add({
    targets: b,
    y: y - 8,
    alpha: { from: 1, to: 0 },
     delay: 1600,
    duration: 700,
    onComplete: () => b.destroy(),
  });
  return b;
}

// ============================================================ 1. NPC chính (cốt truyện / cửa hàng) sống động

const MAIN_NPC_ACT: Record<string, { radius: number; lines: string[]; kite?: string; weapon?: string; anvil?: [number, number] }> = {
  kid: {
    radius: 2.6,
    kite: 'kite_butterfly',
    lines: ['🪁 Gió trên đồi mát quá~', '✨ Diều bướm bay cao chưa nè!', '🪁 Anh chị thả diều đua với em không?', '🌸 Chạy theo cánh diều vui ghê!'],
  },
  fisher: {
    radius: 1.6,
    lines: ['🎣 Suỵt... cá lớn đang rỉa mồi!', '🐟 Mặt hồ hôm nay gợn sóng đẹp thật.', '🎣 Cần tốt, mồi thơm là ắt lên hàng!'],
  },
  smith: {
    radius: 1.8,
    weapon: 'iron_sword',
    anvil: [45.4, 14.9],
    lines: ['🔨 Keng! Keng! Thép đỏ lửa rồi!', '🔥 Nhát búa dứt khoát mới ra thần binh!', '⚔️ Ai cần cường hóa trang bị thì ghé vô!'],
  },
  chief: {
    radius: 2.2,
    lines: ['🧙 Hội Mạo Hiểm luôn mở cửa đón người tài!', '⚔️ Nhớ chuẩn bị thuốc trước khi qua cổng đông.', '✨ Hôm nay sảnh Hội đông vui quá!'],
  },
  clerk: {
    radius: 0.7,
    lines: ['📋 Bảng săn thưởng mới cập nhật đây!', '✨ Hạ đủ quái nhớ ghé nhận thưởng nha!'],
  },
  armorer: {
    radius: 1.8,
    weapon: 'spear',
    lines: ['🛡️ Giáp dày, kiếm sắc — quái nào cũng sợ!', '⚔️ Hàng mới rèn vừa lên kệ!'],
  },
  alchemist: {
    radius: 1.8,
    lines: ['🧪 Thảo dược hôm nay thơm lừng!', '🍷 Bình máu đầy túi thì đi đâu cũng yên tâm.'],
  },
  merchant: {
    radius: 0.7,
    lines: ['🏪 Nông sản tươi rói mới thu hoạch đây!', '🪙 Giá chợ hôm nay tốt lắm nha cưng!'],
  },
  seeder: {
    radius: 2.0,
    lines: ['🌱 Hạt giống khỏe, gieo là lên mầm!', '🌾 Mùa màng bội thu nha bà con!'],
  },
  rancher: {
    radius: 2.2,
    lines: ['🐄 Bò cừu ăn no là cho sữa, cho lông liền!', '🐔 Nghe tiếng gà cục tác vui tai ghê!'],
  },
  winger: {
    radius: 1.8,
    lines: ['🪽 Đeo đôi cánh vào nhẹ bẫng như bay!', '✨ Lông vũ ánh sáng vừa về thêm đó!'],
  },
  breeder: {
    radius: 1.8,
    lines: ['🐾 Mấy bé thú cưng hôm nay quấn người ghê!', '🦊 Có thú cưng đi cùng đỡ buồn hẳn!'],
  },
  stylist: {
    radius: 1.8,
    lines: ['👗 Xoay một vòng xem dáng áo mới nào~', '✨ Mặc đẹp đi dạo phố ai cũng ngoái nhìn!'],
  },
  hatter: {
    radius: 1.8,
    lines: ['🎩 Mũ nón che nắng che mưa, lại còn sang!', '👒 Đội thử chiếc này xem hợp không nè!'],
  },
  jeweler: {
    radius: 1.8,
    lines: ['💎 Ngọc sáng lung linh dưới nắng!', '💍 Đeo nhẫn quý tăng vận may lắm đó!'],
  },
  baker: {
    radius: 1.8,
    lines: ['🥐 Bánh nướng thơm phức vừa ra lò đây!', '☕ Làm tách cà phê nóng cho tỉnh táo nào!'],
  },
};

export class StoryNpcActor {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  nameLabel: Phaser.GameObjects.Text;
  marker: Phaser.GameObjects.Text;
  bubble?: Phaser.GameObjects.Text;
  kiteImg?: Phaser.GameObjects.Image;
  kiteLine?: Phaser.GameObjects.Graphics;
  heldImg?: Phaser.GameObjects.Image;
  readonly homeX: number;
  readonly homeY: number;
  readonly fixedTalk: boolean;
  readonly it: { x: number; y: number; r: number; label: () => string | null; run: () => void };
  private tx: number;
  private ty: number;
  private moving = false;
  private facing: Dir = 'down';
  private nextMoveAt = 0;
  private nextActAt = 0;
  private swingAt = -9999;

  constructor(private scene: WorldScene, public id: string, nx: number, ny: number, talk?: [number, number]) {
    const def = NPC_DEFS[id];
    const x = nx * T;
    const y = ny * T;
    this.homeX = x;
    this.homeY = y;
    this.tx = x;
    this.ty = y;
    this.fixedTalk = !!talk;

    this.sprite = scene.add.sprite(x, y, def.tex, 'down_0').setOrigin(0.5, ORIGIN_Y).setDepth(y + 8);
    this.shadow = scene.add.image(x, y + 7, 'shadow').setDepth(y + 7);
    this.nameLabel = scene.add
      .text(x, y - 19, def.name, { fontFamily: TEXT_FONT, fontSize: '6px', fontStyle: 'bold', color: '#fff2b0', stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(99000);
    this.marker = scene.add
      .text(x, y - 26, '❗', { fontFamily: TEXT_FONT, fontSize: '9px', fontStyle: 'bold', color: '#ffd23a', stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(99001)
      .setVisible(false);

    const cfg = MAIN_NPC_ACT[id];
    if (cfg?.kite) {
      this.kiteLine = scene.add.graphics().setDepth(94999);
      this.kiteImg = scene.add.image(x + 18, y - 54, cfg.kite).setDepth(95002);
    }
    if (cfg?.weapon) {
      this.heldImg = scene.add.image(x + 4, y - 1, `weptex_${cfg.weapon}`).setOrigin(0.15, 0.85).setScale(0.75).setDepth(y + 8.3);
    }

    const [ix, iy] = talk ?? [nx, ny + 0.5];
    this.it = {
      x: ix * T,
      y: iy * T,
      r: 20,
      label: () => {
        const st = npcQuestState(useGame.getState().game, id);
        return st === 'offer' ? `❗ Nói chuyện · ${def.name}` : st === 'done' ? `❓ Trả nhiệm vụ · ${def.name}` : `💬 ${def.name}`;
      },
      run: () => {
        sfx.open();
        bus.emit('dialog', id);
      },
    };
    this.nextMoveAt = 800 + Math.random() * 2000;
    this.nextActAt = 2500 + Math.random() * 4500;
  }

  update(time: number, delta: number) {
    const def = NPC_DEFS[this.id];
    const cfg = MAIN_NPC_ACT[this.id];
    const s = this.sprite;
    const p = this.scene.player;
    const distP = Math.hypot(p.x - s.x, p.y - s.y);

    // Khi người chơi đứng gần thì dừng lại quay mặt về phía người chơi cho thân thiện
    if (distP < 26 && !this.fixedTalk) {
      if (this.moving) {
        this.moving = false;
        s.anims.stop();
      }
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
      s.setFlipX(this.facing === 'left').setFrame(`${ad}_0`);
    } else if (this.moving) {
      const dx = this.tx - s.x;
      const dy = this.ty - s.y;
      const d = Math.hypot(dx, dy);
      const speed = this.id === 'kid' ? 38 : 26;
      const step = (speed * delta) / 1000;
      if (d <= step || this.scene.canWalkAt(s.x + (dx / (d || 1)) * 6, s.y + (dy / (d || 1)) * 6) === false) {
        if (d <= step) {
          s.x = this.tx;
          s.y = this.ty;
        }
        this.moving = false;
        s.anims.stop();
        const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        s.setFrame(`${ad}_0`);
        this.nextMoveAt = time + 1600 + Math.random() * 2800;
        // Thợ rèn tới cạnh đe thì gõ búa tóe lửa
        if (cfg?.anvil && Math.hypot(s.x - cfg.anvil[0] * T, s.y - cfg.anvil[1] * T) < 16) {
          this.facing = 'left';
          s.setFlipX(true).setFrame('side_0');
          this.swingAt = time;
          this.scene.puffs(cfg.anvil[0] * T - 4, cfg.anvil[1] * T - 6, 3);
        }
      } else {
        s.x += (dx / d) * step;
        s.y += (dy / d) * step;
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
        const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        s.setFlipX(this.facing === 'left');
        s.anims.play(`${def.tex}_walk_${ad}`, true);
      }
    } else if (time > this.nextMoveAt) {
      const r = (cfg?.radius ?? 1.5) * T;
      if (this.fixedTalk) {
        // NPC đứng sau quầy: đi ngang nhẹ phía sau quầy
        this.tx = this.homeX + Phaser.Math.Between(-9, 9);
        this.ty = this.homeY;
        this.moving = Math.abs(this.tx - s.x) > 3;
      } else if (cfg?.anvil && Math.random() < 0.45) {
        this.tx = cfg.anvil[0] * T + 8;
        this.ty = cfg.anvil[1] * T;
        this.moving = true;
      } else {
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2;
          const d = (0.3 + Math.random() * 0.7) * r;
          const nx = this.homeX + Math.cos(a) * d;
          const ny = this.homeY + Math.sin(a) * d;
          if (this.scene.canWalkAt(nx, ny)) {
            this.tx = nx;
            this.ty = ny;
            this.moving = true;
            break;
          }
        }
      }
      if (!this.moving) this.nextMoveAt = time + 2000;
    }

    // Nhún nhẹ khi đứng yên
    const bob = this.moving ? 0 : Math.sin(time / 280 + this.homeX) * 0.6;
    const feet = s.y + 8;
    s.setDepth(feet);
    this.shadow.setPosition(s.x, feet - 1).setDepth(feet - 1);
    this.nameLabel.setPosition(s.x, s.y - 19 + bob);
    this.marker.setPosition(s.x, s.y - 26 + Math.sin(time / 180) * 1.5);
    if (!this.fixedTalk) {
      this.it.x = s.x;
      this.it.y = s.y + 5;
    }

    // Vũ khí / búa cầm tay
    if (this.heldImg) {
      const left = this.facing === 'left';
      const up = this.facing === 'up';
      const t = (time - this.swingAt) / 200;
      const swing = t >= 0 && t < 1 ? -1.2 + 2.2 * Math.sin((t * Math.PI) / 2) : 0;
      this.heldImg
        .setPosition(s.x + (left || up ? -4 : 4), s.y + (up ? -3 : -1))
        .setFlipX(left || up)
        .setRotation(swing * (left || up ? -1 : 1))
        .setDepth(up ? feet - 0.3 : feet + 0.3);
    }

    // Diều bay trên đầu (Bé Na)
    if (this.kiteImg && this.kiteLine) {
      const kx = s.x + 18 + Math.sin(time / 520) * 9;
      const ky = s.y - 54 + Math.cos(time / 380) * 5;
      this.kiteImg.setPosition(kx, ky).setRotation(Math.sin(time / 420) * 0.14);
      const hx = s.x + (this.facing === 'left' ? -3 : 3);
      const hy = s.y - 2;
      this.kiteLine.clear().lineStyle(0.6, 0xf8f4e8, 0.85);
      this.kiteLine.beginPath();
      this.kiteLine.moveTo(hx, hy);
      const mx = (hx + kx) / 2 + 4;
      const my = (hy + ky) / 2 + 6;
      this.kiteLine.lineTo(mx, my);
      this.kiteLine.lineTo(kx, ky + 4);
      this.kiteLine.strokePath();
    }

    // Bong bóng hoạt động / câu nói vui
    if (time > this.nextActAt) {
      this.nextActAt = time + 6500 + Math.random() * 7500;
      if (distP < 210 && cfg?.lines.length) {
        if (this.id === 'smith') {
          this.swingAt = time;
          this.scene.puffs(s.x + (this.facing === 'left' ? -6 : 6), s.y - 2, 2);
        }
        this.bubble?.destroy();
        this.bubble = showBubble(this.scene, s.x, s.y - 26, pick(cfg.lines));
      }
    } else if (this.bubble?.active) {
      this.bubble.setPosition(s.x, s.y - 26);
    }
  }
}

// ============================================================ 2. Cư dân & Mạo hiểm giả hoạt động khắp các bản đồ

export type FolkRole = 'stroll' | 'shopper' | 'angler' | 'kiter' | 'farmer' | 'trainee' | 'miner' | 'hunter' | 'camper';

interface FolkSpec {
  name: string;
  tex: string;
  role: FolkRole;
  /** các điểm mốc (tile cục bộ của bản đồ) để di chuyển qua lại */
  waypoints: [number, number][];
  /** bán kính tản bộ quanh mỗi mốc (tile) */
  wander?: number;
  speed?: number;
  weapon?: string;
  rod?: string;
  kite?: string;
  pet?: string;
  wings?: string;
  /** điểm mặt nước để quăng phao (cho angler) */
  waterAt?: [number, number];
  /** các câu thoại / cảm xúc khi hoạt động hoặc khi người chơi bắt chuyện */
  lines: string[];
}

export class FolkActor {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  nameTag: Phaser.GameObjects.Text;
  wingsImg?: Phaser.GameObjects.Image;
  petSprite?: Phaser.GameObjects.Sprite;
  petShadow?: Phaser.GameObjects.Image;
  heldImg?: Phaser.GameObjects.Image;
  kiteImg?: Phaser.GameObjects.Image;
  kiteLine?: Phaser.GameObjects.Graphics;
  fishLine?: Phaser.GameObjects.Graphics;
  bobber?: Phaser.GameObjects.Image;
  ripple?: Phaser.GameObjects.Image;
  bubble?: Phaser.GameObjects.Text;
  readonly it: { x: number; y: number; r: number; label: () => string | null; run: () => void };

  private wpIdx = 0;
  private tx: number;
  private ty: number;
  private moving = false;
  private facing: Dir = 'down';
  private pauseUntil = 0;
  private nextActAt = 0;
  private swingAt = -9999;
  private seed = Math.random() * 1000;
  private fishingCast = false;

  constructor(private scene: WorldScene, public spec: FolkSpec) {
    const start = this.safeTile(spec.waypoints[0]);
    const x = start[0] * T + 8;
    const y = start[1] * T + 8;
    this.tx = x;
    this.ty = y;

    if (spec.wings) {
      this.wingsImg = scene.add.image(x, y - 4, spec.wings);
    }
    this.sprite = scene.add.sprite(x, y, spec.tex, 'down_0').setOrigin(0.5, ORIGIN_Y).setDepth(y + 8);
    this.shadow = scene.add.image(x, y + 7, 'shadow').setDepth(y + 7);
    const tagColor = spec.role === 'hunter' || spec.role === 'trainee' || spec.role === 'camper' ? '#ffd89a' : '#d8f4ff';
    this.nameTag = scene.add
      .text(x, y - 19, spec.name, { fontFamily: TEXT_FONT, fontSize: '5.5px', fontStyle: 'bold', color: tagColor, stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(98900);

    if (spec.pet) {
      this.petSprite = scene.add.sprite(x - 10, y + 4, spec.pet, '0').play(`${spec.pet}_move`);
      this.petShadow = scene.add.image(x - 10, y + 10, 'shadow').setScale(0.7);
    }
    if (spec.weapon || spec.rod) {
      const key = spec.weapon ? `weptex_${spec.weapon}` : `rodtex_${spec.rod}`;
      this.heldImg = scene.add.image(x + 4, y - 1, key).setOrigin(0.15, 0.85).setScale(spec.rod ? 0.75 : 0.8);
    }
    if (spec.kite) {
      this.kiteLine = scene.add.graphics().setDepth(94999);
      this.kiteImg = scene.add.image(x + 16, y - 52, spec.kite).setDepth(95002);
    }
    if (spec.role === 'angler') {
      this.fishLine = scene.add.graphics().setDepth(98950);
      this.bobber = scene.add.image(x, y, 'bobber').setDepth(98951).setVisible(false);
      this.ripple = scene.add.image(x, y, 'ripple').setAlpha(0.7).setDepth(y - 2).setVisible(false);
      scene.tweens.add({ targets: this.ripple, scale: { from: 0.5, to: 1.45 }, alpha: { from: 0.8, to: 0 }, duration: 1350, repeat: -1 });
    }

    this.it = {
      x,
      y: y + 4,
      r: 13,
      label: () => `💬 Chào ${spec.name}`,
      run: () => this.greetPlayer(),
    };

    this.pauseUntil = Math.random() * 1200;
    this.nextActAt = 1800 + Math.random() * 4500;
  }

  private safeTile([wx, wy]: [number, number]): [number, number] {
    if (this.scene.canWalkAt(wx * T + 8, wy * T + 8)) return [wx, wy];
    for (let r = 1; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (this.scene.canWalkAt((wx + dx) * T + 8, (wy + dy) * T + 8)) return [wx + dx, wy + dy];
        }
      }
    }
    return [wx, wy];
  }

  private greetPlayer() {
    const s = this.sprite;
    const p = this.scene.player;
    const dx = p.x - s.x;
    const dy = p.y - s.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    this.moving = false;
    s.anims.stop();
    s.setFlipX(this.facing === 'left').setFrame(`${ad}_0`);
    this.pauseUntil = this.scene.time.now + 3000;
    const line = pick(this.spec.lines);
    this.say(line);
    sfx.open();
    useGame.getState().toast(`💬 ${this.spec.name}: "${line}"`);
  }

  private say(text: string, color = '#fffbe8') {
    this.bubble?.destroy();
    this.bubble = showBubble(this.scene, this.sprite.x, this.sprite.y - 25, text, color);
  }

  update(time: number, delta: number) {
    const s = this.sprite;
    const p = this.scene.player;
    const distP = Math.hypot(p.x - s.x, p.y - s.y);
    const sp = this.spec.speed ?? (this.spec.role === 'kiter' || this.spec.role === 'hunter' ? 44 : 32);

    // 1. Thợ săn ở vùng quái: ưu tiên tìm quái gần đó để giao chiến tạo không khí
    if (this.spec.role === 'hunter') {
      this.updateHunter(time, delta, sp, distP);
    } else if (this.moving) {
      const dx = this.tx - s.x;
      const dy = this.ty - s.y;
      const d = Math.hypot(dx, dy);
      const step = (sp * delta) / 1000;
      const nx = s.x + (dx / (d || 1)) * Math.min(d, step);
      const ny = s.y + (dy / (d || 1)) * Math.min(d, step);
      if (d <= step || !this.scene.canWalkAt(nx, ny)) {
        if (d <= step) {
          s.x = this.tx;
          s.y = this.ty;
        }
        this.moving = false;
        s.anims.stop();
        this.onArrive(time);
      } else {
        s.x = nx;
        s.y = ny;
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
        const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        s.setFlipX(this.facing === 'left');
        s.anims.play(`${this.spec.tex}_walk_${ad}`, true);
      }
    } else if (time > this.pauseUntil) {
      this.pickNextTarget(time);
    }

    // 2. Thực hiện hoạt động định kỳ tại chỗ
    if (time > this.nextActAt) {
      this.nextActAt = time + 3500 + Math.random() * 5500;
      this.performActivity(time, distP);
    }

    // 3. Cập nhật vị trí bóng, tên, thú cưng, cánh, vũ khí, cần câu, diều
    const feet = s.y + 8;
    s.setDepth(feet);
    this.shadow.setPosition(s.x, feet - 1).setDepth(feet - 1);
    this.nameTag.setPosition(s.x, s.y - 19);
    this.it.x = s.x;
    this.it.y = s.y + 4;
    if (this.bubble?.active) this.bubble.setPosition(s.x, s.y - 25);

    if (this.wingsImg) {
      this.wingsImg
        .setPosition(s.x, s.y - 4)
        .setDepth(this.facing === 'up' ? feet + 0.4 : feet - 0.4)
        .setScale(0.78 + 0.18 * Math.abs(Math.sin((time + this.seed) / 115)), 0.95);
    }
    if (this.petSprite && this.petShadow) {
      const [fx, fy] = DIR_VEC[this.facing];
      const ptx = s.x - fx * 12 - (fy !== 0 ? 8 : 0);
      const pty = s.y + 4 - fy * 9;
      const k = Math.min(1, delta * 0.006);
      const pdx = ptx - this.petSprite.x;
      this.petSprite.x += pdx * k;
      this.petSprite.y += (pty - this.petSprite.y) * k;
      if (Math.abs(pdx) > 0.8) this.petSprite.setFlipX(pdx < 0);
      this.petSprite.setDepth(this.petSprite.y + 6);
      this.petShadow.setPosition(this.petSprite.x, this.petSprite.y + 6).setDepth(this.petSprite.y + 5);
    }
    if (this.heldImg) {
      const left = this.facing === 'left';
      const up = this.facing === 'up';
      const t = (time - this.swingAt) / 190;
      const isSwinging = t >= 0 && t < 1;
      const isRod = !!this.spec.rod;
      const isMoving = this.moving;
      const bobY = isMoving ? Math.sin((time + this.seed) / 85) * 0.75 : Math.sin((time + this.seed) / 400) * 0.25;
      const bobRot = isMoving ? Math.sin((time + this.seed) / 85) * 0.05 : 0;

      let hx = s.x;
      let hy = s.y - 2 + bobY;
      let originX = 0.15;
      let baseRot = 0;

      if (this.facing === 'left') {
        hx = s.x - 3.5;
        originX = 0.85;
        baseRot = isRod ? -0.32 + bobRot : -0.12 + bobRot;
      } else if (this.facing === 'right') {
        hx = s.x + 3.5;
        originX = 0.15;
        baseRot = isRod ? -0.32 - bobRot : 0.12 - bobRot;
      } else if (this.facing === 'down') {
        hx = s.x + 5.5;
        originX = 0.15;
        baseRot = isRod ? -0.22 + bobRot : 0.15 + bobRot;
      } else if (this.facing === 'up') {
        hx = s.x + 5.5;
        hy = s.y - 3 + bobY;
        originX = 0.15;
        baseRot = isRod ? -0.25 + bobRot : -0.2 + bobRot;
      }

      let finalRot = baseRot;
      if (isSwinging) {
        const swingProg = -1.4 + 2.8 * Math.sin((t * Math.PI) / 2);
        finalRot = left ? -swingProg : swingProg;
      } else if (isRod && this.fishingCast) {
        finalRot = left ? 0.35 : -0.35;
      }

      this.heldImg
        .setOrigin(originX, 0.85)
        .setPosition(hx, hy)
        .setFlipX(left)
        .setRotation(finalRot)
        .setDepth(up ? feet - 0.3 : feet + 0.3);
    }
    if (this.kiteImg && this.kiteLine) {
      const kx = s.x + 16 + Math.sin((time + this.seed) / 480) * 11;
      const ky = s.y - 52 + Math.cos((time + this.seed) / 360) * 6;
      this.kiteImg.setPosition(kx, ky).setRotation(Math.sin((time + this.seed) / 390) * 0.16);
      const hx = s.x + (this.facing === 'left' ? -3 : 3);
      const hy = s.y - 2;
      this.kiteLine.clear().lineStyle(0.6, 0xf8f4e8, 0.85);
      this.kiteLine.beginPath();
      this.kiteLine.moveTo(hx, hy);
      this.kiteLine.lineTo((hx + kx) / 2 + 3, (hy + ky) / 2 + 6);
      this.kiteLine.lineTo(kx, ky + 4);
      this.kiteLine.strokePath();
    }
    if (this.fishLine && this.bobber && this.ripple) {
      if (this.fishingCast && !this.moving && this.spec.waterAt) {
        const wx = this.spec.waterAt[0] * T + 8;
        const wy = this.spec.waterAt[1] * T + 8 + Math.sin((time + this.seed) / 260) * 1.2;
        this.bobber.setVisible(true).setPosition(wx, wy);
        this.ripple.setVisible(true).setPosition(wx, this.spec.waterAt[1] * T + 10);
        const hx = s.x + (this.facing === 'left' ? -8 : this.facing === 'right' ? 8 : 3);
        const hy = s.y - 4;
        this.fishLine.clear().lineStyle(0.55, 0xf0f8ff, 0.85);
        this.fishLine.beginPath();
        this.fishLine.moveTo(hx, hy);
        this.fishLine.lineTo((hx + wx) / 2, (hy + wy) / 2 + 5);
        this.fishLine.lineTo(wx, wy - 2);
        this.fishLine.strokePath();
      } else {
        this.fishLine.clear();
        this.bobber.setVisible(false);
        this.ripple.setVisible(false);
      }
    }
  }

  private pickNextTarget(time: number) {
    this.fishingCast = false;
    const wps = this.spec.waypoints;
    this.wpIdx = (this.wpIdx + 1) % wps.length;
    const [bx, by] = wps[this.wpIdx];
    const w = this.spec.wander ?? 0.8;
    for (let k = 0; k < 10; k++) {
      const nx = (bx + (Math.random() - 0.5) * 2 * w) * T + 8;
      const ny = (by + (Math.random() - 0.5) * 2 * w) * T + 8;
      if (this.scene.canWalkAt(nx, ny)) {
        this.tx = nx;
        this.ty = ny;
        this.moving = true;
        return;
      }
    }
    this.pauseUntil = time + 1500;
  }

  private onArrive(time: number) {
    const s = this.sprite;
    if (this.spec.role === 'angler' && this.spec.waterAt && this.wpIdx === 0) {
      const wx = this.spec.waterAt[0] * T + 8;
      const wy = this.spec.waterAt[1] * T + 8;
      const dx = wx - s.x;
      const dy = wy - s.y;
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      this.fishingCast = true;
      this.swingAt = time;
      this.pauseUntil = time + 6500 + Math.random() * 5500;
    } else if (this.spec.role === 'trainee') {
      this.facing = 'up';
      this.swingAt = time;
      this.pauseUntil = time + 2600 + Math.random() * 2000;
    } else {
      const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
      s.setFlipX(this.facing === 'left').setFrame(`${ad}_0`);
      this.pauseUntil = time + 1800 + Math.random() * 3200;
    }
    const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    s.setFlipX(this.facing === 'left').setFrame(`${ad}_0`);
  }

  private performActivity(time: number, distP: number) {
    if (distP > 240) return;
    const s = this.sprite;
    const role = this.spec.role;

    if (role === 'angler' && this.fishingCast && this.spec.waterAt) {
      // Giật cần câu cá lên!
      this.swingAt = time;
      const wx = this.spec.waterAt[0] * T + 8;
      const wy = this.spec.waterAt[1] * T + 8;
      if (Math.random() < 0.55) {
        const fishEmoji = pick(['🐟', '🐠', '🐡', '🦐', '🦀']);
        const fish = this.scene.add.text(wx, wy, fishEmoji, { fontSize: '10px', resolution: 4 }).setOrigin(0.5).setDepth(99500);
        this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 580,
          onUpdate: (tw) => {
            const k = tw.getValue() ?? 0;
            fish.setPosition(wx + (s.x - wx) * k, wy + (s.y - 10 - wy) * k - Math.sin(k * Math.PI) * 20).setAngle(k * 360);
          },
          onComplete: () => fish.destroy(),
        });
        this.say(pick(['🎣 Dính cá rồi!', `✨ Lên được ${fishEmoji} nè!`, '🐟 Cá tươi rói luôn!']), '#b8f8ff');
      } else {
        this.say(pick(this.spec.lines));
      }
      return;
    }

    if (role === 'trainee' && !this.moving) {
      this.swingAt = time;
      const [dx, dy] = DIR_VEC[this.facing];
      const hx = s.x + dx * 12;
      const hy = s.y + dy * 10;
      const sl = this.scene.add.image(hx, hy, 'slash').setRotation(Math.atan2(dy, dx)).setDepth(s.depth + 1).setScale(0.85);
      this.scene.tweens.add({ targets: sl, alpha: 0, scale: 1.15, duration: 160, onComplete: () => sl.destroy() });
      this.scene.puffs(hx, hy, 2);
      if (Math.random() < 0.65) this.say(pick(this.spec.lines), '#ffe29a');
      return;
    }

    if (role === 'miner' && !this.moving) {
      this.swingAt = time;
      const [dx, dy] = DIR_VEC[this.facing];
      this.scene.puffs(s.x + dx * 10, s.y + dy * 8, 3);
      if (Math.random() < 0.7) this.say(pick(this.spec.lines), '#ffe29a');
      return;
    }

    if (role === 'farmer' && !this.moving) {
      this.scene.puffs(s.x, s.y + 4, 2);
      if (Math.random() < 0.75) this.say(pick(this.spec.lines), '#d8f8b8');
      return;
    }

    if (Math.random() < 0.65) {
      this.say(pick(this.spec.lines));
    }
  }

  /** AI của mạo hiểm giả săn quái ngoài chiến trường */
  private updateHunter(time: number, delta: number, sp: number, distP: number) {
    const s = this.sprite;
    const foe = this.scene.findMonsterNear(s.x, s.y, 95);
    if (foe) {
      const mx = foe.sprite.x;
      const my = foe.sprite.y;
      const dx = mx - s.x;
      const dy = my - s.y;
      const d = Math.hypot(dx, dy) || 1;
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
      s.setFlipX(this.facing === 'left');

      if (d > 18) {
        const step = (sp * 1.15 * delta) / 1000;
        const nx = s.x + (dx / d) * step;
        const ny = s.y + (dy / d) * step;
        if (this.scene.canWalkAt(nx, ny)) {
          s.x = nx;
          s.y = ny;
          s.anims.play(`${this.spec.tex}_walk_${ad}`, true);
        }
      } else {
        s.anims.stop();
        s.setFrame(`${ad}_0`);
        if (time - this.swingAt > 680) {
          this.swingAt = time;
          const hx = s.x + (dx / d) * 13;
          const hy = s.y + (dy / d) * 11;
          const sl = this.scene.add.image(hx, hy, 'slash').setRotation(Math.atan2(dy, dx)).setDepth(s.depth + 1).setTint(0x9fe8ff).setScale(0.9);
          this.scene.tweens.add({ targets: sl, alpha: 0, scale: 1.2, duration: 160, onComplete: () => sl.destroy() });
          // Chém phụ sát thương tạo hiệu ứng chiến đấu sôi động nhưng chừa lại máu cuối cho người chơi kết liễu
          if (foe.hp > foe.def.hp * 0.25) {
            const chip = Math.max(1, Math.round(foe.def.hp * 0.04));
            foe.hurt(chip, false, dx / d, dy / d, time);
          } else {
            foe.sprite.setTintFill(0xffffff);
            this.scene.time.delayedCall(60, () => foe.restoreTint());
            this.scene.puffs(mx, my, 2);
          }
          if (distP < 180 && Math.random() < 0.22) {
            this.say(pick(this.spec.lines), '#ffd89a');
          }
        }
      }
      return;
    }

    // Không có quái gần đó thì tuần tra theo mốc
    if (this.moving) {
      const dx = this.tx - s.x;
      const dy = this.ty - s.y;
      const d = Math.hypot(dx, dy);
      const step = (sp * delta) / 1000;
      const nx = s.x + (dx / (d || 1)) * Math.min(d, step);
      const ny = s.y + (dy / (d || 1)) * Math.min(d, step);
      if (d <= step || !this.scene.canWalkAt(nx, ny)) {
        this.moving = false;
        s.anims.stop();
        const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        s.setFrame(`${ad}_0`);
        this.pauseUntil = time + 1200 + Math.random() * 1800;
      } else {
        s.x = nx;
        s.y = ny;
        this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
        const ad = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        s.setFlipX(this.facing === 'left');
        s.anims.play(`${this.spec.tex}_walk_${ad}`, true);
      }
    } else if (time > this.pauseUntil) {
      this.pickNextTarget(time);
    }
  }
}

// ============================================================ 3. Danh sách nhân vật hoạt động cho từng bản đồ

export function buildMapFolk(scene: WorldScene, m: MapData): FolkActor[] {
  const id = m.info.id;
  const specs: FolkSpec[] = [];

  if (id === 'town') {
    specs.push(
      {
        name: 'Tiểu Thư Hoa Cúc',
        tex: 'folk_lady',
        role: 'shopper',
        wings: 'wings_butterfly',
        pet: 'pet_bunny',
        waypoints: [[45, 16], [51, 16], [57, 16], [51, 25], [45, 25]],
        lines: ['👗 Thị trấn hôm nay thật thanh bình!', '🛍️ Mua sắm dạo phố thích ghê~'],
      },
      {
        name: 'Kiếm Sĩ Long',
        tex: 'folk_knight',
        role: 'stroll',
        weapon: 'crystal_sword',
        wings: 'wings_angel',
        waypoints: [[29, 7], [37, 7], [35, 12], [32, 8], [22, 8]],
        lines: ['🏆 Tuần này nhiều cần thủ câu được cá to lắm!', '⚔️ Dạo một vòng thị trấn hít thở không khí nào!'],
      },
    );
  } else if (id === 'farm') {
    specs.push({
      name: 'Bác Hai Lúa',
      tex: 'folk_farmer',
      role: 'farmer',
      waypoints: [[12, 18], [8, 24], [15, 23], [20, 23], [13, 21]],
      lines: ['🌾 Đất đai màu mỡ, mùa màng tốt tươi!', '🌱 Chăm chỉ làm đồng chẳng lo thiếu vàng!'],
    });
  } else if (id === 'adventure') {
    specs.push(
      {
        name: 'Tân Binh Kiên',
        tex: 'folk_rookie',
        role: 'trainee',
        weapon: 'wood_sword',
        waypoints: [[6, 9.2], [9, 9.2], [5, 15.5]],
        wander: 0.2,
        lines: ['⚔️ Hây! Chát! Luyện tập chăm chỉ mỗi ngày!', '🪵 Kiếm gỗ cũng có thể rèn nên tuyệt kỹ!'],
      },
      {
        name: 'Lãng Khách Phong',
        tex: 'folk_angler',
        role: 'angler',
        rod: 'rod_carbon',
        waterAt: [40, 28],
        waypoints: [[38.5, 28], [38.5, 24], [35, 23]],
        wander: 0.2,
        lines: ['🎣 Hồ Gương trong vắt thật tĩnh lặng!', '🐟 Câu cá thư giãn sau những chuyến đi săn quái.'],
      },
    );
  } else if (id === 'lake') {
    specs.push({
      name: 'Cần Thủ Lão Luyện',
      tex: 'folk_angler',
      role: 'angler',
      rod: 'rod_gold',
      waterAt: [21, 24],
      waypoints: [[21, 22], [26, 22], [26, 12], [21, 8]],
      wander: 0.15,
      lines: ['🎣 Dòng Sông Thơ và Đầm Sen hôm nay cá cắn câu rộn ràng lắm!', '🏆 Ai câu được Linh Hồn Sen Vàng Thần Thoại sẽ nhận danh hiệu Thần Thoại!'],
    });
  } else if (id === 'deepsea') {
    specs.push({
      name: 'Thuyền Trưởng Bạc',
      tex: 'folk_paladin',
      role: 'angler',
      rod: 'rod_carbon',
      waterAt: [21, 20],
      waypoints: [[21, 15], [26, 15], [16, 15]],
      wander: 0.15,
      lines: ['🌊 Vịnh Biển San Hô toàn cá ngừ đại dương và cá kiếm!', '⚓ Nghe đồn dưới vực thẳm có Thủy Quái Leviathan Thần Thoại!'],
    });
  } else if (id === 'glacier') {
    specs.push({
      name: 'Cần Thủ Băng Tuyết',
      tex: 'folk_dragonslayer',
      role: 'angler',
      rod: 'rod_ice',
      waterAt: [21, 20],
      waypoints: [[21, 15], [26, 15], [16, 15]],
      wander: 0.15,
      lines: ['❄️ Băng tuyết lạnh buốt nhưng câu cá tuyết cực kỳ đã tay!', '🐲 Băng Long Thần Ngư Thần Thoại chỉ xuất hiện ở vực băng này!'],
    });
  } else if (id === 'windhill') {
    specs.push({
      name: 'Bé Mây',
      tex: 'folk_girl',
      role: 'kiter',
      kite: 'kite_rainbow',
      pet: 'pet_dog',
      speed: 44,
      waypoints: [[12, 16], [7, 14], [10, 11], [15, 14], [11, 18]],
      lines: ['🌈 Diều Cầu Vồng rực rỡ cả bầu trời!', '💨 Gió trên Đồi Gió thổi căng dây diều đã quá!'],
    });
  } else {
    // 20 Vùng quái (zone1 .. zone20):
    // Trại an toàn ZONE_CAMP: x 1..6, y 10..15 (lửa trại ở 4, 13); Chiến trường: x 8..30, y 3..22
    const zi = m.info.zone;
    const tier = zi <= 4 ? 0 : zi <= 9 ? 1 : zi <= 14 ? 2 : 3;
    const weapons = [
      ['iron_sword', 'spear', 'dagger'],
      ['spear', 'battle_axe', 'crystal_sword'],
      ['crystal_sword', 'frost_blade', 'void_sword'],
      ['void_sword', 'dragon_blade', 'holy_sword'],
    ][tier];
    const looks = [
      ['folk_rookie', 'folk_huntress', 'folk_knight'],
      ['folk_knight', 'folk_huntress', 'folk_mage'],
      ['folk_mage', 'folk_paladin', 'folk_knight'],
      ['folk_dragonslayer', 'folk_paladin', 'folk_mage'],
    ][tier];
    const wingsList = [undefined, 'wings_angel', 'wings_thunder', 'wings_phoenix'] as const;
    const hunterNames = [
      ['Thợ Săn Phong', 'Kiếm Sĩ Nam', 'Cung Thủ Hà'],
      ['Hiệp Sĩ Bạc', 'Pháp Sư Băng', 'Chiến Binh Lửa'],
      ['Thánh Kỵ Sĩ', 'Kiếm Khách Ảnh', 'Đại Pháp Sư'],
      ['Long Kỵ Sĩ', 'Chiến Thần Vũ', 'Kiếm Thánh'],
    ][tier];

    // 3 mạo hiểm giả tuần tra & săn quái khắp vùng
    specs.push(
      {
        name: `Trinh Sát Vùng ${zi}`,
        tex: looks[0],
        role: 'hunter',
        weapon: weapons[0],
        speed: 46,
        waypoints: [[5, 11], [9, 8], [13, 13], [8, 17], [5, 15]],
        wander: 1.2,
        lines: [
          `⚔️ Đang mở đường ở Vùng ${zi}, cùng tiến lên nào!`,
          '👑 Cẩn thận Boss canh giữ ở góc sâu của vùng này nhé!',
          '🔮 Nhớ đi ngang Đá Dịch Chuyển ở cửa vào để mở khóa đường đi nhanh!',
          '🍷 Nhớ canh máu rồi bấm Q ăn đồ hồi phục kịp thời!',
        ],
      },
      {
        name: hunterNames[(zi - 1) % 3],
        tex: looks[1],
        role: 'hunter',
        weapon: weapons[1],
        wings: wingsList[tier],
        speed: 48,
        waypoints: [[10, 8], [18, 7], [25, 11], [16, 13], [10, 13]],
        wander: 1.5,
        lines: [
          '⚔️ Xem đường kiếm của ta đây!',
          '💥 Cùng dọn sạch lũ quái vùng này nào!',
          '🔥 Đòn cuối nhường bạn kết liễu nhận thưởng đó!',
          '✨ Đi săn có đồng đội vui hơn hẳn!',
        ],
      },
      {
        name: hunterNames[(zi + 1) % 3],
        tex: looks[2],
        role: 'hunter',
        weapon: weapons[2],
        wings: tier >= 2 ? 'wings_dragon' : undefined,
        speed: 48,
        waypoints: [[12, 18], [22, 19], [28, 14], [20, 13], [14, 15]],
        wander: 1.5,
        lines: [
          '⚡ Tiếp chiêu! Chém!',
          '🛡️ Quái vùng này đông đấy, giữ vững đội hình!',
          '🪙 Săn quái ban đêm rơi nhiều vàng hơn hẳn!',
          '⚔️ Không con quái nào cản được bước chân mạo hiểm giả!',
        ],
      },
    );
  }

  return specs.map((sp) => new FolkActor(scene, sp));
}
