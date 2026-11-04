import Phaser from 'phaser';
import { darkness, isNight, isRaining } from '../game/clock';
import { getCurrentSeason } from '../game/config/seasons';
import { MONSTERS, NIGHT_ATK } from '../game/config/combat';
import { CROP_BY_ID, ITEMS, plotCost } from '../game/config/farm';
import { ANIMALS, HOUSE_BY_ID, TOWER_BY_ID, towerUnits, unitSlots } from '../game/config/life';
import { SKILLS, type SkillId } from '../game/config/skills';
import { ZONE_DEFS, zoneLevel } from '../game/config/zones';
import { FolkActor, StoryNpcActor, buildMapFolk } from './folk';
import { detectFishingZone } from '../game/config/fishingZones';
import { buyPlot, fertilizePlot, harvest, plotCareStep, waterPlot, weedPlot } from '../game/logic/farm';
import { animalStatus, tendAnimal } from '../game/logic/life';
import { eatFood, killMonster, playerDie, playerStats, reachZone, unlockWaypoint } from '../game/logic/player';
import { heldItem, heldKind } from '../game/logic/hotbar';
import { npcQuestState } from '../game/logic/story';
import { TIER_COLOR, TITLE_BY_ID } from '../game/config/titles';
import type { AnimalState, BossSkill, MonsterDef } from '../game/types';
import { fmt, fmtTime, mulberry32 } from '../game/utils';
import { useGame } from '../store';
import { bus, controls, skillCd, worldInfo } from './bus';
import { MAPS, RESPAWN, inRect, isMapId, isMapOpen, loadMap, toLocal, type HouseLot, type MapData, type MapId, type Spawner } from './map';
import { sfx } from './sfx';
import { T, TILE, createAnims, generateTextures, renderHero } from './textures';
import { TOWER_ART, towerWindow } from './textures3';
import { FEET_Y, FRAME_W, ORIGIN_Y, SKIN_TONES } from '../art/avatar';
import { heroLook } from '../art/heroLook';
import { ZONE_THEMES, type ZoneFx } from './zoneThemes';

/** màu nền từng loại tile cho bản đồ thu nhỏ */
const TILE_COLOR = [
  '#5fa340', '#62a843', '#6aa84a', '#c9a36b', '#3f7a3a', '#42803c', '#8d8b83', '#8d8b83', '#3b8bd4', '#3b8bd4',
  '#3a3548', '#3a3548', '#3a2e2a', '#3a2e2a', '#e8501a', '#e8501a', '#7cbf4f', '#e8d29a', '#a8784a',
  '#4f7a3a', '#4a7436', '#4a5a32', '#465630', '#8a6a42', '#86663e', '#3e3a4a', '#3a364a', '#e0b870', '#dcb46a',
  '#eef4fa', '#e8f0f8', '#a8d8f0', '#a8d8f0', '#5a4a6a', '#544466', '#7a7670', '#76726c', '#5a2a26', '#5a2a26',
  '#14101e', '#14101e', '#c8963a', '#c08c34', '#b8ae9c', '#9a7048', '#7fc060', '#4a4658', '#8a4ad8',
];
const CHUNK = 16 * T;

type Dir = 'down' | 'up' | 'left' | 'right';
type Body = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const PLAYER_SPEED = 88;
const TEXT_FONT = 'system-ui, "Segoe UI", sans-serif';
const WAKE_X = 440;
const WAKE_Y = 300;

interface Interactable {
  x: number;
  y: number;
  r: number;
  label: () => string | null;
  run: () => void;
}

interface Projectile {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  until: number;
  dmg: number;
  hostile: boolean;
  hit: Set<Monster>;
}

interface ManifestTex {
  key: string;
  file: string;
  frames?: Record<string, [number, number, number, number]>;
  grid?: { w: number; h: number; names: string[] };
}

const game = () => useGame.getState().game;
const label = (scene: Phaser.Scene, x: number, y: number, text: string, color: string, size = 6) =>
  scene.add
    .text(x, y, text, { fontFamily: TEXT_FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
    .setOrigin(0.5, 1);

// ------------------------------------------------------------------ Quái vật

class Monster {
  sprite: Body;
  shadow: Phaser.GameObjects.Image;
  barBg: Phaser.GameObjects.Rectangle;
  bar: Phaser.GameObjects.Rectangle;
  nameTag?: Phaser.GameObjects.Text;
  hp: number;
  dead = false;
  asleep = false;
  stunUntil = 0;
  nextHit = 0;
  nextWander = 0;
  nextSpecial = 0;
  specialToggle = false;
  wander = { x: 0, y: 0 };
  home: { x: number; y: number };
  readonly barW: number;
  /** hào quang dưới chân boss */
  aura?: Phaser.GameObjects.Ellipse;
  engaged = false;
  introduced = false;
  skillIdx = 0;
  /** boss dưới 50% HP: nhanh hơn, ra chiêu dồn dập */
  enraged = false;
  chargeUntil = 0;
  chargeHit = false;
  chargeVec = { x: 0, y: 0 };
  /** quái do boss triệu hồi: chết là mất, không hồi sinh */
  minion = false;

  constructor(private scene: WorldScene, public def: MonsterDef, public spawner: Spawner, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, def.tex, def.char ? 'down_0' : '0') as Body;
    if (!def.char) this.sprite.play(`${def.tex}_move`);
    if (def.scale) this.sprite.setScale(def.scale);
    if (def.tint) this.sprite.setTint(def.tint);
    const [bw, bh] = def.tex === 'fire_dragon' ? [30, 12] : def.tex === 'golem' ? [14, 8] : [10, 6];
    this.sprite.body.setSize(bw, bh).setOffset((this.sprite.width - bw) / 2, this.sprite.height - bh - 1);
    if (def.ai !== 'fly') scene.physics.add.collider(this.sprite, scene.collideLayer);
    const big = def.boss || def.tex === 'golem' || (def.scale ?? 1) > 1.2;
    this.shadow = scene.add.image(x, y, big ? 'shadow_big' : 'shadow').setScale(def.boss ? Math.max(1, (def.scale ?? 1) * 0.7) : 1);
    this.barW = def.boss ? 34 : big ? 18 : 14;
    this.barBg = scene.add.rectangle(x, y, this.barW + 2, 3, 0x1a1208).setOrigin(0, 0.5).setVisible(false);
    this.bar = scene.add.rectangle(x, y, this.barW, 1, 0xe8402a).setOrigin(0, 0.5).setVisible(false);
    if (def.boss) {
      this.nameTag = label(scene, x, y, `👑 ${def.name}`, '#f2c230', 7);
      const aw = Math.max(28, this.sprite.displayWidth * 0.9);
      this.aura = scene.add.ellipse(x, y, aw, aw * 0.4, def.aura ?? 0xffd23a, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: this.aura, alpha: { from: 0.15, to: 0.55 }, scaleX: { from: 0.9, to: 1.12 }, duration: 650, yoyo: true, repeat: -1 });
    }
    this.hp = def.hp;
    this.home = { x, y };
  }

  get feetY() {
    return this.sprite.y + this.sprite.displayHeight / 2 - 1;
  }

  /** khôi phục màu sau khi nháy trắng */
  restoreTint() {
    if (this.enraged) this.sprite.setTint(0xff7a6a);
    else if (this.def.tint) this.sprite.setTint(this.def.tint);
    else this.sprite.clearTint();
  }

  update(time: number, night: boolean) {
    if (this.dead) return;
    const s = this.sprite;
    const p = this.scene.player;
    // ở xa người chơi: ngủ, tắt vật lý cho nhẹ máy
    if (Math.abs(p.x - s.x) > WAKE_X || Math.abs(p.y - s.y) > WAKE_Y) {
      if (!this.asleep) {
        s.setVelocity(0, 0);
        s.body.enable = false;
        this.asleep = true;
        this.engaged = false;
      }
      return;
    }
    if (this.asleep) {
      s.body.enable = true;
      this.asleep = false;
    }
    const feet = this.feetY;
    s.setDepth(feet);
    this.shadow.setPosition(s.x, feet).setDepth(feet - 1).setAlpha(this.def.ai === 'fly' ? 0.5 : 1);
    this.aura?.setPosition(s.x, feet).setDepth(feet - 2);
    const top = s.y - s.displayHeight / 2 - 3;
    this.barBg.setPosition(s.x - this.barW / 2 - 1, top).setDepth(feet + 1);
    this.bar.setPosition(s.x - this.barW / 2, top).setDepth(feet + 2);
    this.nameTag?.setPosition(s.x, top - 3).setDepth(99500);
    if (time < this.stunUntil) return;
    // boss đang lao tới: giữ hướng, trúng người chơi 1 lần mỗi cú lao
    if (time < this.chargeUntil) {
      s.setVelocity(this.chargeVec.x, this.chargeVec.y);
      if (Math.random() < 0.35) this.scene.puffs(s.x, feet, 1);
      if (!this.chargeHit && Math.hypot(p.x - s.x, p.y - s.y) < this.def.radius + 10) {
        this.chargeHit = true;
        this.scene.hurtPlayer(this.def.atk * 1.5 * (night ? NIGHT_ATK : 1), s.x, s.y);
      }
      return;
    }

    const dx = p.x - s.x;
    const dy = p.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const homeD = Math.hypot(s.x - this.home.x, s.y - this.home.y);
    const engaged = !this.scene.playerDead && !this.scene.playerSafe && dist < this.def.aggro && homeD < 240;
    this.engaged = engaged;
    const sp = this.def.speed * (this.enraged ? 1.3 : 1);

    if (engaged) {
      if (this.def.ai === 'hop') {
        const hop = 0.55 + 0.7 * Math.abs(Math.sin(time / 170));
        s.setVelocity((dx / dist) * sp * hop, (dy / dist) * sp * hop);
      } else if (this.def.ai === 'fly') {
        const w = Math.sin(time / 140) * 0.9;
        s.setVelocity(((dx - dy * w) / dist) * sp, ((dy + dx * w) / dist) * sp);
      } else {
        const keep = this.def.ai === 'dragon' && dist < 34 ? 0.2 : 1;
        s.setVelocity((dx / dist) * sp * keep, (dy / dist) * sp * keep);
      }
    } else if (homeD > 48) {
      const hx = this.home.x - s.x;
      const hy = this.home.y - s.y;
      s.setVelocity((hx / homeD) * sp * 0.7, (hy / homeD) * sp * 0.7);
    } else {
      if (time > this.nextWander) {
        this.nextWander = time + 1500 + Math.random() * 2500;
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() < 0.4 ? 0 : sp * 0.35;
        this.wander = { x: Math.cos(a) * v, y: Math.sin(a) * v };
      }
      s.setVelocity(this.wander.x, this.wander.y);
    }
    const vx = s.body.velocity.x;
    const vy = s.body.velocity.y;
    if (this.def.char) {
      const moving = Math.abs(vx) + Math.abs(vy) > 2;
      const d = Math.abs(vx) > Math.abs(vy) ? 'side' : vy < 0 ? 'up' : 'down';
      if (moving) s.play(`${this.def.tex}_walk_${d}`, true);
      else s.anims.stop();
      s.setFlipX(d === 'side' && vx < 0);
    } else if (this.def.ai === 'dragon') {
      s.setFlipX(dx < 0);
    } else if (Math.abs(vx) > 1) {
      s.setFlipX(vx < 0);
    }

    if (engaged && dist < this.def.radius + 8 && time > this.nextHit) {
      this.nextHit = time + 900;
      this.scene.hurtPlayer(this.def.atk * (night ? NIGHT_ATK : 1), s.x, s.y);
    }
    if (engaged && this.def.skills && time > this.nextSpecial) {
      const skill = this.def.skills[this.skillIdx++ % this.def.skills.length];
      this.nextSpecial = time + (this.enraged ? 2200 : 3500) + Math.random() * 600;
      this.scene.bossSkill(this, skill);
    }
  }

  hurt(dmg: number, crit: boolean, dx: number, dy: number, time: number) {
    const s = this.sprite;
    this.hp -= dmg;
    s.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.restoreTint());
    const kb = this.def.boss ? 30 : this.def.tex === 'golem' ? 70 : 170;
    s.setVelocity(dx * kb, dy * kb);
    this.stunUntil = time + (this.def.boss ? 60 : 170);
    this.nextHit = Math.max(this.nextHit, time + 250);
    this.scene.floatText(s.x, s.y - s.displayHeight / 2, crit ? `${dmg}!` : `${dmg}`, crit ? '#ffd23a' : '#ffffff', crit ? 10 : 8);
    this.barBg.setVisible(true);
    this.bar.setVisible(true).setSize(Math.max(0, (this.barW * this.hp) / this.def.hp), 1);
    if (this.def.boss && this.hp > 0) {
      if (!this.enraged && this.hp < this.def.hp / 2) this.scene.bossEnrage(this);
      this.scene.bossBar(this);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    const { x, y } = this.sprite;
    this.sprite.disableBody(true, true);
    for (const o of [this.shadow, this.barBg, this.bar, this.nameTag, this.aura]) o?.setVisible(false);
    this.scene.puffs(x, y + 4, this.def.boss ? 16 : 6);
    this.scene.onKill(this, x, y);
    if (this.minion) {
      this.scene.time.delayedCall(400, () => this.destroy());
      return;
    }
    this.scene.time.delayedCall(this.def.respawnMs, () => this.respawn());
  }

  destroy() {
    for (const o of [this.sprite, this.shadow, this.barBg, this.bar, this.nameTag, this.aura]) o?.destroy();
    this.scene.removeMonster(this);
  }

  respawn() {
    const pos = this.scene.randomSpawn(this.spawner, true);
    this.hp = this.def.hp;
    this.dead = false;
    this.enraged = false;
    this.introduced = false;
    this.skillIdx = 0;
    this.restoreTint();
    this.aura?.setVisible(true).setFillStyle(this.def.aura ?? 0xffd23a, 0.35);
    this.home = pos;
    this.sprite.enableBody(true, pos.x, pos.y, true, true);
    this.asleep = false;
    if (!this.def.char) this.sprite.play(`${this.def.tex}_move`);
    this.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 500 });
    this.shadow.setVisible(true);
    this.nameTag?.setVisible(true);
    this.bar.setSize(this.barW, 1);
  }
}

// ------------------------------------------------------------------ Scene

interface AnimalObj {
  sprite: Phaser.GameObjects.Sprite;
  icon: Phaser.GameObjects.Text;
  it: Interactable;
}

export class WorldScene extends Phaser.Scene {
  player!: Body;
  playerShadow!: Phaser.GameObjects.Image;
  collideLayer!: Phaser.Tilemaps.TilemapLayer;
  playerDead = false;

  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private solid: boolean[][] = [];
  private water: [number, number][] = [];
  private lava: [number, number][] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: Dir = 'down';
  private heroTex = 'hero';
  private lookKey = '';
  private monsters: Monster[] = [];
  private interactables: Interactable[] = [];
  private plotSoil: Phaser.GameObjects.Image[] = [];
  private plotCrop: Phaser.GameObjects.Image[] = [];
  private plotBadge: Phaser.GameObjects.Text[] = [];
  private readyTweens = new Map<number, Phaser.Tweens.Tween>();
  private farmBuildings: { building: string; img: Phaser.GameObjects.Image; lot: Phaser.GameObjects.Image }[] = [];
  private houseObjs: { lot: HouseLot; sale: Phaser.GameObjects.Components.Visible[]; own: Phaser.GameObjects.Components.Visible[] }[] = [];
  /** tòa chung cư: mỗi căn bán có ô kính nhấp nháy (đang bán) / sáng vàng (đã mua) */
  private towerObjs: {
    id: string;
    units: { id: string; sale: Phaser.GameObjects.Rectangle[]; lit: Phaser.GameObjects.Rectangle[] }[];
    tag: Phaser.GameObjects.Text;
    beacon?: { x: number; y: number; color: number };
  }[] = [];
  /** ô cửa sổ sáng đèn khi trời tối (vẽ trên lớp màn đêm) */
  private nightWindows: Phaser.GameObjects.Rectangle[] = [];
  /** bản đồ đang đứng — mỗi lần sang bản đồ khác, scene được tạo mới hoàn toàn */
  private m!: MapData;
  /** khóa cổng vài trăm ms sau khi tới nơi / đang chuyển bản đồ */
  private exitLockUntil = 0;
  private traveling = false;
  private npcMarkers: { id: string; marker: Phaser.GameObjects.Text }[] = [];
  private storyNpcs: StoryNpcActor[] = [];
  private folks: FolkActor[] = [];
  private animalObjs = new Map<number, AnimalObj>();
  private blades?: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private target: Interactable | null = null;
  private promptLabel: string | null = null;
  private nextAttack = 0;
  private invulnUntil = 0;
  private knockUntil = 0;
  private dashUntil = 0;
  private dashVec: [number, number] = [0, 0];
  private projectiles: Projectile[] = [];
  private paused = false;
  private areaKey = '';
  private timers = { save: 0, regen: 0, sync: 0, water: 0, env: 0, boss: 0 };
  /** boss đang giao chiến (hiện thanh máu lớn trên HUD) */
  private bossShown: Monster | null = null;
  private waterFrame = 0;
  private unsubs: (() => void)[] = [];
  private touchMode = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  private stats = playerStats(game());
  // khí quyển
  private nightNow = false;
  private rainNow = false;
  private nightRect!: Phaser.GameObjects.Rectangle;
  private lightPool: Phaser.GameObjects.Image[] = [];
  private rain!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflies!: Phaser.GameObjects.Particles.ParticleEmitter;
  private lampLights: [number, number][] = [];
  private glows: { x: number; y: number; color: number }[] = [];
  private campfires: [number, number][] = [];
  private fx: Partial<Record<ZoneFx, Phaser.GameObjects.Particles.ParticleEmitter>> = {};
  private curZone = 0;
  /** người chơi đang ở thị trấn (vùng quái không có chỗ an toàn) */
  playerSafe = true;
  // vẽ theo vùng nhìn thấy (bản đồ rất lớn)
  private chunks = new Map<string, Phaser.GameObjects.GameObject[]>();
  private shownChunks = new Set<string>();
  // thời trang
  private wingsImg!: Phaser.GameObjects.Image;
  private pet!: Phaser.GameObjects.Sprite;
  private petShadow!: Phaser.GameObjects.Image;
  private cosKey = '';
  // món đang cầm trên tay (vũ khí / cần câu) + tên & danh hiệu trên đầu
  private heldImg!: Phaser.GameObjects.Image;
  private handGrip!: Phaser.GameObjects.Graphics;
  private swingAt = -9999;
  private nameTag!: Phaser.GameObjects.Text;
  private titleTag!: Phaser.GameObjects.Text;
  /** danh hiệu Top 1 (Thần thoại): chữ đổi màu cầu vồng */
  private tagMythic = false;
  private tagHueAt = 0;
  private tagKey = '';
  private rodWarnAt = 0;
  // câu cá: đứng sát bờ nước nào cũng quăng cần được
  private waterSet = new Set<number>();
  private fishZone = false;
  private castTarget: { x: number; y: number; dx: number; dy: number } | null = null;
  private castIt: Interactable = { x: -999, y: -999, r: 14, label: () => null, run: () => {} };
  private fishGear: {
    rod: Phaser.GameObjects.Image;
    line: Phaser.GameObjects.Graphics;
    bobber: Phaser.GameObjects.Image;
    ripple: Phaser.GameObjects.Image;
    dir: [number, number];
    landed: boolean;
    pull: number;
  } | null = null;

  inBoat = false;
  boatSprite: Phaser.GameObjects.Image | null = null;
  playerCollider!: Phaser.Physics.Arcade.Collider;
  private lastBoatWake = 0;

  constructor() {
    super('world');
  }

  preload() {
    // Bộ hình ngoài (tùy chọn): public/assets/manifest.json — xem public/assets/README.md
    this.load.json('asset-manifest', 'assets/manifest.json');
    this.load.on('filecomplete-json-asset-manifest', (_k: string, _t: string, data: { textures?: ManifestTex[] }) => {
      for (const t of data?.textures ?? []) this.load.image(t.key, `assets/${t.file}`);
    });
  }

  private applyManifest() {
    const data = this.cache.json.get('asset-manifest') as { textures?: ManifestTex[] } | undefined;
    for (const t of data?.textures ?? []) {
      if (!this.textures.exists(t.key)) continue;
      const tex = this.textures.get(t.key);
      for (const [name, [x, y, w, h]] of Object.entries(t.frames ?? {})) tex.add(name, 0, x, y, w, h);
      if (t.grid) {
        const src = tex.getSourceImage() as HTMLImageElement;
        const cols = Math.max(1, Math.floor(src.width / t.grid.w));
        t.grid.names.forEach((name, i) => tex.add(name, 0, (i % cols) * t.grid!.w, Math.floor(i / cols) * t.grid!.h, t.grid!.w, t.grid!.h));
      }
    }
  }

  create() {
    this.applyManifest();
    generateTextures(this, heroLook(game()));
    createAnims(this);
    const saved = game().player.map;
    const initialMap: MapId = isMapId(saved) && isMapOpen(saved) ? saved : 'lake';
    const w = (this.m = loadMap(initialMap));
    const { w: MAP_W, h: MAP_H } = w.info;
    this.solid = w.solid;
    this.water = w.water;
    for (const [x, y] of w.water) this.waterSet.add(y * MAP_W + x);
    this.lava = w.lava;

    const map = this.make.tilemap({ data: w.ground, tileWidth: T, tileHeight: T });
    this.groundLayer = map.createLayer(0, map.addTilesetImage('tiles', 'tiles', T, T, 0, 0)!, 0, 0)!.setDepth(-1000);
    const cmap = this.make.tilemap({ data: w.solid.map((r) => r.map((s) => (s ? 0 : -1))), tileWidth: T, tileHeight: T });
    this.collideLayer = cmap.createLayer(0, cmap.addTilesetImage('tiles', 'tiles', T, T, 0, 0)!, 0, 0)!.setVisible(false);
    this.collideLayer.setCollision(0);
    this.physics.world.setBounds(0, 0, MAP_W * T, MAP_H * T);

    for (const p of [...w.props, ...w.fences]) {
      if (p.tex === 'campfire_spot') {
        const s = this.add.sprite(p.x, p.y, 'campfire', '0').setOrigin(0.5, 1).setDepth(p.y).play('campfire_move');
        this.addToChunk(s);
        this.campfires.push([p.x, p.y - 6]);
        continue;
      }
      if (p.tex === 'ship_galleon' || p.tex === 'ship_junk' || p.tex === 'ship_steamer') {
        const ship = this.add.image(p.x, p.y, p.tex).setOrigin(0.5, 0.9).setDepth(p.y);
        this.tweens.add({
          targets: ship,
          y: ship.y + 2,
          angle: { from: -1.2, to: 1.2 },
          duration: 2400 + Math.random() * 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.addToChunk(ship);
        continue;
      }
      if (p.tex === 'bridge_stone_v' || p.tex === 'bridge_stone_h') {
        this.addToChunk(this.add.image(p.x, p.y, p.tex).setOrigin(0.5, 1).setDepth(-500));
        continue;
      }
      this.addToChunk(this.add.image(p.x, p.y, p.tex).setOrigin(0.5, 1).setDepth(p.y));
    }
    this.lampLights = w.lamps.map(([x, y]) => [x * T + 8, y * T + 7]);
    this.glows = w.glows;
    if (w.fountain) {
      const f = w.fountain;
      this.add.sprite(f.x * T, f.y * T, f.tex, '0').setOrigin(0.5, 1).setDepth(f.y * T).play(`${f.tex}_move`);
    }
    this.buildMinimap(w.ground, w.solid);
    this.createExits();

    this.createStructures();
    this.createHouses();
    this.createPlots();
    this.createNpcs();
    this.createLifeSpots();
    this.createLakeLife();
    this.createWaypoints();
    this.createPlayer();
    this.createCosmetics();
    this.createMonsters();
    this.createAtmosphere();

    this.prompt = this.add
      .text(0, 0, '', { fontFamily: TEXT_FONT, fontSize: '7px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#1a1208cc', padding: { x: 3, y: 2 }, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(100000)
      .setVisible(false);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,E,K,Q,ENTER,SHIFT,L,ONE,TWO,THREE,U,I,O') as Record<string, Phaser.Input.Keyboard.Key>;
    // bắt theo sự kiện để không bỏ sót những lần nhấn rất nhanh
    const on = (keys: string[], fn: () => void) => keys.forEach((k) => kb.on(`keydown-${k}`, fn));
    on(['SPACE', 'J'], () => (controls.attack = true));
    on(['E', 'K', 'ENTER'], () => (controls.interact = true));
    on(['Q'], () => (controls.eat = true));
    on(['SHIFT', 'L'], () => (controls.skill = 'dash'));
    // phím số 1–0 dành cho thanh 10 ô (React xử lý)
    on(['U'], () => (controls.skill = 'spin'));
    on(['I'], () => (controls.skill = 'wave'));
    on(['O'], () => (controls.skill = 'heal'));
    // phím tắt mở bảng: M bản đồ · B túi đồ · N nhiệm vụ
    const openPanel = (id: 'map' | 'inventory' | 'quests' | 'home' | 'rank' | 'giftcode') => () => !this.paused && bus.emit('panel', id);
    on(['M'], openPanel('map'));
    on(['B'], openPanel('inventory'));
    on(['N'], openPanel('quests'));
    on(['H'], openPanel('home'));
    on(['R'], openPanel('rank'));
    on(['G'], openPanel('giftcode'));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.touchMode = p.wasTouch;
      if (!p.wasTouch && p.leftButtonDown()) controls.attack = true;
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * T, MAP_H * T);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    cam.fadeIn(450);
    this.exitLockUntil = this.time.now + 700;

    this.unsubs.push(
      bus.on('pause', (p) => {
        this.paused = p;
        if (p) {
          this.physics.pause();
          this.player.anims.stop();
        } else {
          this.physics.resume();
          controls.attack = controls.interact = controls.eat = false;
          controls.skill = null;
        }
      }),
      bus.on('planted', (i) => this.onPlanted(i)),
      bus.on('kitedone', (ok) => this.onKiteDone(ok)),
      bus.on('fishfx', (e) => this.onFishFx(e.type, e.emoji)),
      bus.on('typing', (t) => {
        const kb = this.input.keyboard!;
        kb.enabled = !t;
        if (t) kb.disableGlobalCapture();
        else kb.enableGlobalCapture();
        kb.resetKeys();
      }),
      bus.on('teleport', ({ map, x, y }) => {
        if (!isMapOpen(map)) {
          useGame.getState().toast('🚧 Khu vực đang bảo trì — tạm thời chỉ mở Hồ Câu Cá & Đồi Gió', 'err');
          return;
        }
        if (map !== this.m.info.id) {
          this.travel(map, [x, y], true);
          return;
        }
        this.puffs(this.player.x, this.player.y, 6);
        this.player.setPosition(x * T, y * T).setVelocity(0, 0);
        this.cameras.main.centerOn(x * T, y * T);
        this.cameras.main.flash(250, 160, 230, 255);
        this.pet.setPosition(x * T - 10, y * T + 4);
        this.updateChunks(true);
        sfx.levelUp();
      }),
    );
    const cleanup = () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.scale.off('resize', this.applyZoom, this);
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
    this.syncWorld(Date.now());
    if (import.meta.env.DEV) (window as unknown as { __world: WorldScene }).__world = this;
  }

  // ---------------- chỉ vẽ cảnh vật gần camera

  private addToChunk(o: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) {
    const key = `${Math.floor(o.x / CHUNK)},${Math.floor(o.y / CHUNK)}`;
    let list = this.chunks.get(key);
    if (!list) this.chunks.set(key, (list = []));
    list.push(o);
    o.setVisible(false);
  }

  private updateChunks(force = false) {
    const wv = this.cameras.main.worldView;
    const x0 = Math.floor((wv.x - CHUNK) / CHUNK);
    const x1 = Math.floor((wv.right + CHUNK) / CHUNK);
    const y0 = Math.floor((wv.y - CHUNK) / CHUNK);
    const y1 = Math.floor((wv.bottom + CHUNK) / CHUNK);
    const want = new Set<string>();
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) want.add(`${cx},${cy}`);
    for (const key of this.shownChunks) {
      if (want.has(key) && !force) continue;
      this.chunks.get(key)?.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(false));
      this.shownChunks.delete(key);
    }
    for (const key of want) {
      if (this.shownChunks.has(key)) continue;
      this.chunks.get(key)?.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(true));
      this.shownChunks.add(key);
    }
  }

  private buildMinimap(ground: number[][], solid: boolean[][]) {
    const { w: MAP_W, h: MAP_H } = this.m.info;
    const S = 4; // 4px per tile cho bản đồ sắc nét, chi tiết cao
    const cv = document.createElement('canvas');
    cv.width = MAP_W * S;
    cv.height = MAP_H * S;
    const c = cv.getContext('2d')!;

    // 1. Vẽ nền gạch với màu sắc chân thật
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = ground[y][x];
        const px = x * S;
        const py = y * S;
        let col = TILE_COLOR[t] ?? '#5fa340';
        if (t === TILE.WATER) col = '#2563eb';
        else if (t === TILE.WATER2) col = '#1e3a8a';
        else if (t === TILE.DOCK) col = '#92400e';
        else if (t === TILE.SAND) col = '#fde047';
        else if (t === TILE.SNOW) col = '#f8fafc';
        else if (t === TILE.ICE || t === TILE.ICE2) col = '#7dd3fc';

        c.fillStyle = col;
        c.fillRect(px, py, S, S);

        // Chi tiết ván cầu gỗ
        if (t === TILE.DOCK) {
          c.fillStyle = '#b45309';
          c.fillRect(px, py, S, 1);
          c.fillStyle = '#78350f';
          c.fillRect(px, py + S - 1, S, 1);
        }

        // Đổ bóng solid nhẹ
        if (solid[y][x] && t !== TILE.WATER && t !== TILE.WATER2 && t !== TILE.LAVA) {
          c.fillStyle = 'rgba(0,0,0,0.18)';
          c.fillRect(px, py, S, S);
        }
      }
    }

    // 2. Vẽ structures (công trình, tiệm cá, tiệm diều, nhà cửa, chòi sen)
    for (const s of this.m.structures) {
      const sx = s.tx * S;
      const sy = s.ty * S;
      const sw = s.tw * S;
      const sh = s.th * S;
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.fillRect(sx + 1, sy + sh - 2, sw, 3);
      c.fillStyle = s.id.includes('fish') ? '#0284c7' : s.id.includes('kite') ? '#ea580c' : '#b45309';
      c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#fef08a';
      c.fillRect(sx + 2, sy + 2, sw - 4, Math.max(2, Math.floor(sh / 2)));
    }

    // 3. Vẽ props thiên nhiên & ngoại cảnh
    for (const p of this.m.props) {
      const px = p.x * S;
      const py = p.y * S;
      const tex = p.tex;
      if (tex === 'tree' || tex === 'pine') {
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.beginPath(); c.arc(px + S / 2, py + S / 2 + 2, S * 1.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = tex === 'tree' ? '#15803d' : '#047857';
        c.beginPath(); c.arc(px + S / 2, py + S / 2 - 1, S * 1.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#22c55e';
        c.beginPath(); c.arc(px + S / 2 - 1, py + S / 2 - 2, S * 0.5, 0, Math.PI * 2); c.fill();
      } else if (tex === 'snow_pine') {
        c.fillStyle = '#065f46';
        c.beginPath(); c.arc(px + S / 2, py + S / 2, S * 1.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f8fafc';
        c.beginPath(); c.arc(px + S / 2, py + S / 2 - 2, S * 0.6, 0, Math.PI * 2); c.fill();
      } else if (tex === 'palm') {
        c.fillStyle = '#16a34a';
        c.beginPath(); c.arc(px + S / 2, py + S / 2 - 2, S * 1.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#78350f';
        c.fillRect(px + S / 2 - 1, py + S / 2 - 1, 2, S + 2);
      } else if (tex === 'sakura') {
        c.fillStyle = '#f472b6';
        c.beginPath(); c.arc(px + S / 2, py + S / 2, S * 1.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fbcfe8';
        c.beginPath(); c.arc(px + S / 2 - 1, py + S / 2 - 1, S * 0.5, 0, Math.PI * 2); c.fill();
      } else if (tex === 'lotus') {
        c.fillStyle = '#ec4899';
        c.fillRect(px, py, S, S);
        c.fillStyle = '#fef08a';
        c.fillRect(px + 1, py + 1, S - 2, S - 2);
      } else if (tex === 'lilypad') {
        c.fillStyle = '#10b981';
        c.beginPath(); c.arc(px + S / 2, py + S / 2, S * 0.7, 0, Math.PI * 2); c.fill();
      } else if (tex === 'boat_sail') {
        c.fillStyle = '#78350f';
        c.fillRect(px - 1, py + 1, S * 2, S);
        c.fillStyle = '#f8fafc';
        c.beginPath();
        c.moveTo(px + S / 2, py - S * 2);
        c.lineTo(px + S * 2, py + 1);
        c.lineTo(px + S / 2, py + 1);
        c.fill();
      } else if (tex === 'ship_galleon' || tex === 'ship_junk' || tex === 'ship_steamer') {
        c.fillStyle = '#78350f';
        c.fillRect(px - 2, py - 1, S * 3.2, S * 1.6);
        c.fillStyle = '#f8fafc';
        c.fillRect(px, py - 3, S * 2, S * 1.5);
      } else if (tex === 'boat_row' || tex === 'boat_moored') {
        c.fillStyle = '#92400e';
        c.fillRect(px - 1, py, S * 1.8, S * 0.9);
      } else if (tex === 'pavilion') {
        c.fillStyle = '#991b1b';
        c.fillRect(px - 2, py - 3, S * 2.5, S * 1.5);
        c.fillStyle = '#fde047';
        c.fillRect(px, py - 4, S * 1.5, 2);
      } else if (tex === 'campfire') {
        c.fillStyle = '#ea580c';
        c.fillRect(px, py, S, S);
        c.fillStyle = '#fef08a';
        c.fillRect(px + 1, py + 1, S - 2, S - 2);
      } else if (tex === 'ice_crystal') {
        c.fillStyle = '#38bdf8';
        c.beginPath();
        c.moveTo(px + S / 2, py - S);
        c.lineTo(px + S, py + S);
        c.lineTo(px, py + S);
        c.fill();
      } else if (tex === 'boulder' || tex === 'rock') {
        c.fillStyle = '#64748b';
        c.beginPath(); c.arc(px + S / 2, py + S / 2, S * 0.8, 0, Math.PI * 2); c.fill();
      } else if (tex === 'snowman') {
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(px + S / 2, py + S / 2, S * 0.8, 0, Math.PI * 2); c.fill();
      } else if (tex === 'bridge_stone_v') {
        const tx = Math.floor(p.x / T);
        const ty = Math.floor((p.y - 16) / T);
        c.fillStyle = '#94a3b8';
        c.fillRect((tx - 1) * S, (ty - 5) * S, 3 * S, 6 * S);
        c.fillStyle = '#e2e8f0';
        c.fillRect((tx - 1) * S + 1, (ty - 5) * S, 3 * S - 2, 6 * S);
      } else if (tex === 'bridge_stone_h') {
        const tx = Math.floor(p.x / T);
        const ty = Math.floor((p.y - 16) / T);
        c.fillStyle = '#94a3b8';
        c.fillRect((tx - 3) * S, (ty - 2) * S, 7 * S, 3 * S);
        c.fillStyle = '#e2e8f0';
        c.fillRect((tx - 3) * S, (ty - 2) * S + 1, 7 * S, 3 * S - 2);
      }
    }

    worldInfo.minimap = cv.toDataURL();
    worldInfo.mapW = MAP_W;
    worldInfo.mapH = MAP_H;
    worldInfo.map = this.m.info.id;
  }

  /** cổng ở mép bản đồ: bảng tên nơi sẽ tới + mũi tên nhấp nháy */
  private createExits() {
    for (const e of this.m.exits) {
      const cx = ((e.x0 + e.x1 + 1) / 2) * T;
      const cy = ((e.y0 + e.y1 + 1) / 2) * T;
      const { w, h } = this.m.info;
      // đẩy bảng tên vào trong bản đồ một chút
      const ix = e.x0 === 0 ? 30 : e.x1 === w - 1 ? -30 : 0;
      const iy = e.y0 === 0 ? 30 : e.y1 === h - 1 ? -22 : 0;
      const arrow = e.x0 === 0 ? '◀' : e.x1 === w - 1 ? '▶' : e.y0 === 0 ? '▲' : '▼';
      const to = MAPS[e.to];
      const t = label(this, cx + ix, cy + iy, `${arrow} ${to.icon} ${to.name}`, '#fff2b0', 6).setDepth(99000);
      this.tweens.add({ targets: t, alpha: 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.glows.push({ x: cx, y: cy, color: 0xfff0a0 });
    }
  }

  /** sang bản đồ khác: lưu chỗ đứng mới rồi dựng lại scene từ đầu (an toàn, không sót đồ của bản đồ cũ) */
  private travel(to: MapId, at: [number, number], flash = false) {
    if (this.traveling) return;
    if (!isMapOpen(to)) {
      useGame.getState().toast('🚧 Khu vực đang bảo trì — tạm thời chỉ mở Hồ Câu Cá & Đồi Gió', 'err');
      return;
    }
    this.traveling = true;
    if (this.inBoat) {
      this.inBoat = false;
      if (this.boatSprite) {
        this.boatSprite.destroy();
        this.boatSprite = null;
      }
    }
    this.player.setVelocity(0, 0);
    useGame.getState().setPlayer({ map: to, x: Math.round(at[0] * T), y: Math.round(at[1] * T) });
    if (flash) sfx.levelUp();
    else sfx.open();
    const cam = this.cameras.main;
    cam.fadeOut(flash ? 250 : 300, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => this.reload());
  }

  /** dựng lại thế giới theo bản đồ đang lưu trong save (đổi scene ngoài vòng lặp của Phaser) */
  private reload() {
    window.setTimeout(() => {
      const mgr = this.game.scene;
      mgr.remove('world');
      mgr.add('world', WorldScene, true);
    });
  }

  private createWaypoints() {
    for (const w of this.m.waypoints) {
      this.interactables.push({
        x: w.x * T,
        y: w.y * T,
        r: 18,
        label: () => '🔮 Đá dịch chuyển · Mở bản đồ',
        run: () => {
          if (!w.town) useGame.getState().act((g) => unlockWaypoint(g, w.id));
          sfx.open();
          bus.emit('panel', 'map');
        },
      });
      this.glows.push({ x: w.x * T, y: (w.y - 2.4) * T, color: 0x7fe8ff });
    }
  }

  private createCosmetics() {
    this.heldImg = this.add.image(0, 0, 'weptex_wood_sword').setOrigin(0.15, 0.85).setVisible(false);
    this.handGrip = this.add.graphics().setVisible(false);
    const tag = (color: string) =>
      this.add
        .text(0, 0, '', { fontFamily: TEXT_FONT, fontSize: '6px', fontStyle: 'bold', color, stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
        .setOrigin(0.5, 1)
        .setDepth(99500);
    this.nameTag = tag('#ffffff');
    this.titleTag = tag('#ffd23a');
    this.wingsImg = this.add.image(0, 0, 'wings_angel').setVisible(false);
    this.pet = this.add.sprite(this.player.x - 12, this.player.y + 4, 'pet_cat', '0').setVisible(false);
    this.petShadow = this.add.image(0, 0, 'shadow').setScale(0.7).setVisible(false);
  }

  private syncTags() {
    const g = game();
    const t = g.titles.active ? TITLE_BY_ID[g.titles.active] : null;
    const key = `${g.profile.name}|${t?.id}`;
    if (key === this.tagKey) return;
    this.tagKey = key;
    this.nameTag.setText(g.profile.name);
    this.tagMythic = t?.tier === 'mythic';
    this.titleTag
      .setText(t ? (this.tagMythic ? `👑 ${t.name} 👑` : `« ${t.name} »`) : '')
      .setColor(t ? TIER_COLOR[t.tier] : '#ffffff')
      .setShadow(0, 0, t ? TIER_COLOR[t.tier] : '#000', t && (t.tier === 'legend' || this.tagMythic) ? 4 : 0, false, true);
  }

  /** vẽ món đang cầm: vũ khí (vung khi chém) hoặc cần câu; ô trống = tay không */
  private updateHeld(time: number) {
    const p = this.player;
    const img = this.heldImg;
    const id = heldItem(game());
    const kind = heldKind(game());
    if (!id || !kind || this.fishGear || this.playerDead) {
      img.setVisible(false);
      this.handGrip?.setVisible(false);
      return;
    }
    const tex = kind === 'weapon' ? `weptex_${id}` : `rodtex_${id}`;
    if (img.texture.key !== tex) img.setTexture(tex);

    const facing = this.facing;
    const isMoving = Math.abs(p.body.velocity.x) > 5 || Math.abs(p.body.velocity.y) > 5;

    // Nhún nhảy tự nhiên theo bước chân khi đi bộ & nhịp thở khi đứng yên
    const bobY = isMoving ? Math.sin(time / 85) * 0.75 : Math.sin(time / 400) * 0.25;
    const bobRot = isMoving ? Math.sin(time / 85) * 0.05 : Math.sin(time / 400) * 0.02;

    let hx = p.x;
    let hy = p.y - 2 + bobY;
    let flipX = false;
    let originX = 0.15;
    let baseRot = 0;
    let depth = p.depth + 0.3;

    if (facing === 'left') {
      hx = p.x - 3.5;
      flipX = true;
      originX = 0.85; // Chuôi cần nằm trọn vẹn ở bên phải quad khi lật ngang
      // Cần câu giương cao chếch trước, không che mặt hay đâm qua người
      baseRot = kind === 'rod' ? -0.32 + bobRot : -0.12 + bobRot;
      depth = p.depth + 0.3;
    } else if (facing === 'right') {
      hx = p.x + 3.5;
      flipX = false;
      originX = 0.15; // Chuôi cần nằm ở bên trái quad
      baseRot = kind === 'rod' ? -0.32 - bobRot : 0.12 - bobRot;
      depth = p.depth + 0.3;
    } else if (facing === 'down') {
      hx = p.x + 5.5; // Cầm bên tay phải nhân vật (bên phải màn hình)
      flipX = false;
      originX = 0.15;
      baseRot = kind === 'rod' ? -0.22 + bobRot : 0.15 + bobRot;
      depth = p.depth + 0.3;
    } else if (facing === 'up') {
      hx = p.x + 5.5;
      hy = p.y - 3 + bobY;
      flipX = false;
      originX = 0.15;
      baseRot = kind === 'rod' ? -0.25 + bobRot : -0.2 + bobRot;
      depth = p.depth - 0.3; // Quay lưng lại: tay ở phía trước ngực nên bị lưng che
    }

    // Hiệu ứng vung kiếm khi chém quái
    const t = (time - this.swingAt) / 180;
    const isSwinging = kind === 'weapon' && t >= 0 && t < 1;
    let finalRot = baseRot;
    if (isSwinging) {
      const swingProg = -1.4 + 2.8 * Math.sin((t * Math.PI) / 2);
      finalRot = facing === 'left' ? -swingProg : swingProg;
    }

    img
      .setVisible(true)
      .setOrigin(originX, 0.85)
      .setFlipX(flipX)
      .setScale(kind === 'rod' ? 0.78 : 0.8)
      .setPosition(hx, hy)
      .setRotation(finalRot)
      .setDepth(depth)
      .setAlpha(p.alpha);

    // Vẽ bàn tay nắm chặt chuôi cần/kiếm (Hand Grip) tạo độ chân thật tối đa
    if (this.handGrip) {
      if (facing === 'up' || isSwinging) {
        this.handGrip.setVisible(false);
      } else {
        const skinIdx = game().profile?.skin ?? 2;
        const skinStr = SKIN_TONES[skinIdx] ?? '#d49b6a';
        const skinColor = parseInt(skinStr.replace('#', '0x'), 16) || 0xd49b6a;
        this.handGrip
          .clear()
          .setVisible(true)
          .setDepth(depth + 0.1)
          .fillStyle(skinColor, p.alpha)
          .fillRoundedRect(hx - 1.5, hy - 1, 3, 2.5, 0.8);
      }
    }
  }

  private syncCosmetics() {
    const c = game().cosmetics;
    const key = `${c.wings}|${c.pet}`;
    if (key === this.cosKey) return;
    this.cosKey = key;
    this.wingsImg.setVisible(!!c.wings);
    if (c.wings) this.wingsImg.setTexture(c.wings);
    this.pet.setVisible(!!c.pet);
    this.petShadow.setVisible(!!c.pet);
    if (c.pet) this.pet.play(`${c.pet}_move`);
  }

  private updateCosmetics(time: number, delta: number) {
    const p = this.player;
    const d = p.depth;
    if (this.wingsImg.visible) {
      this.wingsImg
        .setPosition(p.x, p.y - 4)
        .setDepth(this.facing === 'up' ? d + 0.5 : d - 0.5)
        .setScale(0.8 + 0.2 * Math.abs(Math.sin(time / 110)), 1)
        .setAlpha(p.alpha);
    }
    if (this.pet.visible) {
      const [fx, fy] = DIR_VEC[this.facing];
      const tx = p.x - fx * 14 - (fy !== 0 ? 10 : 0);
      const ty = p.y + 4 - fy * 10;
      const k = Math.min(1, delta * 0.006);
      const dx = tx - this.pet.x;
      if (Math.abs(dx) > 30 * 16) this.pet.setPosition(tx, ty);
      this.pet.x += dx * k;
      this.pet.y += (ty - this.pet.y) * k;
      if (Math.abs(dx) > 1) this.pet.setFlipX(dx < 0);
      this.pet.setDepth(this.pet.y + 6);
      this.petShadow.setPosition(this.pet.x, this.pet.y + 6).setDepth(this.pet.y + 5);
    }
  }

  // ---------------- câu cá trong thế giới

  private isWater(tx: number, ty: number) {
    return this.waterSet.has(ty * this.m.info.w + tx);
  }

  private castPrivate() {
    const t = this.castTarget;
    if (!t) return false;
    const tx = Math.floor(t.x / T);
    const ty = Math.floor(t.y / T);
    const pond = this.m.privatePond;
    return !!pond && inRect(pond, tx, ty);
  }

  /** tìm mặt nước sát chân nhân vật để quăng phao (ưu tiên hướng đang nhìn) */
  private scanWater() {
    const p = this.player;
    const fx = Math.floor(p.x / T);
    const fy = Math.floor((p.y + 6) / T);
    const [vx, vy] = DIR_VEC[this.facing];

    // Khi đang chèo thuyền giữa hồ/biển: luôn có thể quăng cần ra mặt nước phía trước
    if (this.inBoat) {
      let targetTx = fx + vx * 2;
      let targetTy = fy + vy * 2;
      if (!this.isWater(targetTx, targetTy)) {
        targetTx = fx + vx;
        targetTy = fy + vy;
      }
      if (!this.isWater(targetTx, targetTy)) {
        targetTx = fx;
        targetTy = fy;
      }
      const targetX = targetTx * T + 8;
      const targetY = targetTy * T + 8;
      if (this.castTarget) {
        this.castTarget.x = targetX;
        this.castTarget.y = targetY;
        this.castTarget.dx = vx;
        this.castTarget.dy = vy;
      } else {
        this.castTarget = { x: targetX, y: targetY, dx: vx, dy: vy };
      }
      this.castIt.x = p.x;
      this.castIt.y = p.y + 6;
      if (!this.fishZone) {
        this.fishZone = true;
        bus.emit('fishzone', true);
      }
      return;
    }

    let near = false;
    let bestD = Infinity;
    let bestTx = 0;
    let bestTy = 0;
    let found = false;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (!this.isWater(fx + dx, fy + dy)) continue;
        near = true;
        const d = Math.hypot(dx, dy);
        if (d > 1.9) continue;
        const score = d - (dx * vx + dy * vy) * 0.6;
        if (!found || score < bestD) {
          found = true;
          bestD = score;
          bestTx = fx + dx;
          bestTy = fy + dy;
        }
      }
    }
    if (near !== this.fishZone) {
      this.fishZone = near;
      bus.emit('fishzone', near);
    }
    if (!found) {
      this.castTarget = null;
      this.castIt.x = this.castIt.y = -999;
      return;
    }
    // quăng xa thêm ~2 ô ra giữa nước nếu được
    const dirx = bestTx - fx;
    const diry = bestTy - fy;
    const l = Math.hypot(dirx, diry) || 1;
    let tx = bestTx;
    let ty = bestTy;
    for (let k = 1; k <= 2; k++) {
      const nx = Math.round(bestTx + (dirx / l) * k);
      const ny = Math.round(bestTy + (diry / l) * k);
      if (this.isWater(nx, ny)) {
        tx = nx;
        ty = ny;
      }
    }
    const ndx = dirx / l;
    const ndy = diry / l;
    const targetX = tx * T + 8;
    const targetY = ty * T + 8;
    if (this.castTarget) {
      this.castTarget.x = targetX;
      this.castTarget.y = targetY;
      this.castTarget.dx = ndx;
      this.castTarget.dy = ndy;
    } else {
      this.castTarget = { x: targetX, y: targetY, dx: ndx, dy: ndy };
    }
    this.castIt.x = p.x;
    this.castIt.y = p.y + 6;
  }

  private startCast() {
    const t = this.castTarget;
    if (!t || this.fishGear) return;
    if (heldKind(game()) !== 'rod') {
      useGame.getState().toast('🎣 Bấm phím số (hoặc chạm ô) để cầm cần câu trước đã', 'err');
      return;
    }
    if (this.castPrivate() && !game().houses.includes('lakehouse')) {
      useGame.getState().toast('🔒 Mua Nhà ven hồ để câu ở hồ riêng (cá hiếm gấp 3)', 'err');
      return;
    }
    const p = this.player;
    // quay mặt ra phía nước
    this.facing = Math.abs(t.dx) > Math.abs(t.dy) ? (t.dx < 0 ? 'left' : 'right') : t.dy < 0 ? 'up' : 'down';
    p.anims.stop();
    p.setFlipX(this.facing === 'left').setFrame(`${this.animDir()}_0`);

    const tx = Math.floor(t.x / T);
    const ty = Math.floor(t.y / T);
    const zoneDef = detectFishingZone(this.m.info.id, tx + this.m.info.ox, ty + this.m.info.oy);
    // Bật bảng chọn mồi câu trước khi quăng cần
    bus.emit('fishing', { privatePond: this.castPrivate(), night: this.nightNow, rain: this.rainNow, zoneId: zoneDef.id });
  }

  /** Chỉ thực hiện vung cần & quăng phao sau khi đã xác nhận chọn mồi câu */
  doCastBobber() {
    const t = this.castTarget;
    if (!t) return;
    const p = this.player;
    if (this.fishGear) this.cleanupFishGear();
    const rodId = game().fishingGear.rod;
    const rod = this.add.image(p.x, p.y, `rodtex_${rodId}`).setOrigin(0.12, 0.88);
    const line = this.add.graphics();
    const bobber = this.add.image(p.x, p.y, 'bobber').setDepth(99000);
    const ripple = this.add.image(t.x, t.y + 3, 'ripple').setAlpha(0).setDepth(t.y - 2);
    this.fishGear = { rod, line, bobber, ripple, dir: [t.dx, t.dy], landed: false, pull: 0 };
    // vung cần rồi phao bay theo đường cong xuống nước
    const tip = this.rodTip();
    bobber.setPosition(tip.x, tip.y);
    sfx.swing();
    this.tweens.addCounter({
      from: 0, to: 1, duration: 520, ease: 'Sine.easeOut',
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        const s = this.rodTip();
        bobber.setPosition(s.x + (t.x - s.x) * k, s.y + (t.y - s.y) * k - Math.sin(k * Math.PI) * 22);
      },
      onComplete: () => {
        if (!this.fishGear) return;
        this.fishGear.landed = true;
        this.splash(t.x, t.y, 5);
        sfx.plant();
        ripple.setAlpha(0.9);
        this.tweens.add({ targets: ripple, scale: { from: 0.5, to: 1.6 }, alpha: { from: 0.9, to: 0 }, duration: 1400, repeat: -1 });
        this.tweens.add({ targets: bobber, y: t.y + 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });
    this.cameras.main.setFollowOffset(0, -34);
  }

  private cleanupFishGear() {
    const g = this.fishGear;
    if (!g) return;
    this.tweens.killTweensOf([g.bobber, g.ripple, g]);
    g.rod.destroy();
    g.line.destroy();
    g.bobber.destroy();
    g.ripple.destroy();
    this.fishGear = null;
    this.cameras.main.setFollowOffset(0, 0);
  }

  /** vị trí ngọn cần theo hướng quăng */
  private rodTip() {
    const p = this.player;
    const g = this.fishGear;
    const [dx, dy] = g?.dir ?? DIR_VEC[this.facing];
    const base = Math.atan2(dy, dx);
    const lift = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? -0.75 : 0.75) : 0;
    const a = base + lift - (g?.pull ?? 0) * (dx >= 0 ? 0.25 : -0.25);
    const hx = p.x + dx * 3;
    const hy = p.y - 1;
    return { x: hx + Math.cos(a) * 21, y: hy + Math.sin(a) * 21, a, hx, hy };
  }

  private updateFishing(time: number) {
    const g = this.fishGear;
    if (!g) return;
    const want = `rodtex_${game().fishingGear.rod}`;
    if (g.rod.texture.key !== want) g.rod.setTexture(want);
    const tip = this.rodTip();
    g.rod.setPosition(tip.hx, tip.hy).setRotation(tip.a + Math.PI / 4).setDepth(this.player.depth + (g.dir[1] < -0.5 ? -0.4 : 0.4));
    // dây võng xuống giữa ngọn cần và phao
    const b = g.bobber;
    const sag = g.landed ? 6 + Math.sin(time / 300) * 1.5 - g.pull * 5 : 2;
    g.line.clear().lineStyle(0.6, 0xf4f8ff, 0.9).setDepth(99000);
    g.line.beginPath();
    g.line.moveTo(tip.x, tip.y);
    for (let i = 1; i <= 8; i++) {
      const k = i / 8;
      g.line.lineTo(tip.x + (b.x - tip.x) * k, tip.y + (b.y - 3 - tip.y) * k + Math.sin(k * Math.PI) * sag);
    }
    g.line.strokePath();
  }

  private splash(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const d = this.add.image(x, y, 'puff').setTint(0xbfe4ff).setScale(0.5).setDepth(99001);
      this.tweens.add({
        targets: d, x: x + Phaser.Math.Between(-8, 8), y: y - Phaser.Math.Between(4, 12), alpha: 0, duration: 420, ease: 'Quad.easeOut',
        onComplete: () => d.destroy(),
      });
    }
  }

  private onFishFx(type: 'cast' | 'nibble' | 'bite' | 'hit' | 'catch' | 'lose' | 'end', emoji?: string) {
    if (type === 'cast') {
      this.doCastBobber();
      return;
    }
    if (type === 'end') {
      this.cleanupFishGear();
      return;
    }
    const g = this.fishGear;
    if (!g) return;
    const b = g.bobber;
    const t = this.castTarget ?? { x: b.x, y: b.y };
    if (type === 'nibble') {
      this.tweens.add({ targets: b, angle: { from: -15, to: 15 }, duration: 80, yoyo: true, repeat: 1, onComplete: () => b.setAngle(0) });
    } else if (type === 'bite') {
      this.tweens.killTweensOf(b);
      b.setY(b.y + 3);
      this.splash(b.x, b.y, 4);
      this.floatText(b.x, b.y - 12, '❗', '#ffd23a', 12);
      this.tweens.add({ targets: b, x: b.x + 2, duration: 60, yoyo: true, repeat: -1 });
      this.cameras.main.shake(120, 0.002);
    } else if (type === 'hit') {
      // mỗi lần kéo trúng: phao bị kéo lại gần, cần cong lên
      g.pull = 1;
      this.tweens.add({ targets: g, pull: 0, duration: 300 });
      const p = this.player;
      this.tweens.add({ targets: b, x: b.x + (p.x - b.x) * 0.2, y: b.y + (p.y - b.y) * 0.2, duration: 200 });
      this.splash(b.x, b.y, 2);
    } else if (type === 'catch') {
      this.tweens.killTweensOf(b);
      const p = this.player;
      const fish = this.add.text(b.x, b.y, emoji ?? '🐟', { fontSize: '12px', resolution: 4 }).setOrigin(0.5).setDepth(100001);
      this.splash(b.x, b.y, 7);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 650, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          fish.setPosition(b.x + (p.x - b.x) * k, b.y + (p.y - 10 - b.y) * k - Math.sin(k * Math.PI) * 26).setAngle(k * 360);
        },
        onComplete: () => {
          this.sparkles(p.x, p.y - 8);
          this.tweens.add({ targets: fish, y: fish.y - 10, alpha: 0, duration: 700, onComplete: () => fish.destroy() });
        },
      });
      b.setVisible(false);
    } else if (type === 'lose') {
      this.tweens.killTweensOf(b);
      this.splash(b.x, b.y, 4);
      b.setPosition(t.x, t.y).setAngle(0).setVisible(true);
      this.tweens.add({ targets: b, y: t.y + 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /** chỉ dùng khi test tự động */
  debugMonsters() {
    return this.monsters.map((m) => ({ id: m.def.id, x: Math.round(m.sprite.x), y: Math.round(m.sprite.y), hp: m.hp, dead: m.dead }));
  }

  private applyZoom() {
    const { width, height } = this.scale;
    let z = Math.round(width / (width < 700 ? 200 : 330));
    z = Math.max(2, Math.min(z, Math.floor(height / 150), 5));
    this.cameras.main.setZoom(z);
  }

  // ---------------- dựng thế giới

  private createStructures() {
    for (const s of this.m.structures) {
      const cx = (s.tx + s.tw / 2) * T;
      const by = (s.ty + s.th) * T;
      const img = this.add.image(cx, by, s.tex).setOrigin(0.5, 1).setDepth(by);
      if (s.building) {
        const lot = this.add.image(cx, by, 'b_lot').setOrigin(0.5, 1).setDepth(by);
        this.farmBuildings.push({ building: s.building, img, lot });
      }
      if (s.id === 'windmill') this.blades = this.add.image(cx, by - 46, 'b_blades').setDepth(by + 1);
      if (s.id === 'smith') {
        this.add.image((s.tx + 4.4) * T, (s.ty + 4.9) * T, 'anvil').setOrigin(0.5, 1).setDepth((s.ty + 4.9) * T);
        this.smoke(s.tx * T + 13, by - 64, 0x8a8a8a, 380);
      }
      if (s.id === 'home') this.smoke(s.tx * T + 62, by - 64, 0xd8d8d8, 600);
      if (s.tower) this.createTower(s.tower, cx - img.width / 2, by - img.height, by);
      if (s.id === 'realty') label(this, cx, by - 2, '🏙️ SÀN BẤT ĐỘNG SẢN', '#ffe27a', 6).setDepth(99000);
      const tower = s.tower;
      this.interactables.push({
        x: s.door[0] * T,
        y: s.door[1] * T,
        r: s.building ? 24 : 18,
        label: () => {
          if (tower) {
            const left = towerUnits(tower).filter((h) => !game().houses.includes(h.id)).length;
            return `🛗 Vào ${s.label}${left ? ` · ${left} căn đang bán` : ''}`;
          }
          return s.building && !game().buildings[s.building] ? `🚧 Xây ${s.label}` : s.label;
        },
        run: () => {
          sfx.open();
          if (tower) bus.emit('tower', tower);
          else bus.emit('panel', s.panel);
        },
      });
    }
    // biển báo đọc được
    for (const sg of this.m.signs) {
      const gx = sg.x * T;
      const gy = sg.y * T;
      this.add.image(gx, gy, 'signpost').setOrigin(0.5, 1).setDepth(gy);
      this.interactables.push({ x: gx, y: gy, r: 18, label: () => 'Đọc biển báo', run: () => useGame.getState().toast(sg.text) });
    }
  }

  private smoke(x: number, y: number, tint: number, frequency: number) {
    this.add
      .particles(x, y, 'puff', {
        speedY: { min: -16, max: -8 }, speedX: { min: -4, max: 4 }, scale: { start: 0.5, end: 1.5 },
        alpha: { start: 0.45, end: 0 }, lifespan: 2000, frequency, tint,
      })
      .setDepth(y + 80);
  }

  private createTower(id: string, x0: number, y0: number, by: number) {
    const t = TOWER_BY_ID[id];
    const art = TOWER_ART[id];
    const units = towerUnits(id);
    const forSale = new Set(units.flatMap((h) => unitSlots(h).map((sl) => `${h.floor}:${sl}`)));
    const rect = (f: number, sl: number, color: number, depth: number) => {
      const w = towerWindow(id, f, sl);
      return this.add.rectangle(x0 + w.x, y0 + w.y, w.w, w.h, color).setOrigin(0, 0).setDepth(depth);
    };
    // căn của dân làng: tối là lên đèn (cố định theo tòa)
    const rnd = mulberry32(id.charCodeAt(0) * 131 + id.length);
    for (let f = 2; f <= t.floors; f++) {
      for (let sl = 0; sl < t.perFloor; sl++) {
        if (forSale.has(`${f}:${sl}`) || rnd() < 0.3) continue;
        this.nightWindows.push(rect(f, sl, rnd() < 0.5 ? 0xffd98a : 0xfff0c0, 90002).setAlpha(0));
      }
    }
    const units2: (typeof this.towerObjs)[number]['units'] = [];
    for (const h of units) {
      const slots = unitSlots(h);
      const sale = slots.map((sl) => rect(h.floor!, sl, 0xffd23a, by + 1).setAlpha(0.15).setStrokeStyle(1, 0xffe27a));
      this.tweens.add({ targets: sale, alpha: 0.65, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const lit = slots.flatMap((sl) => {
        const night = rect(h.floor!, sl, 0xffd23a, 90002).setAlpha(0);
        this.nightWindows.push(night);
        return [rect(h.floor!, sl, 0xffc93a, by + 1), night];
      });
      units2.push({ id: h.id, sale, lit });
    }
    const lobby = id === 'sky' ? 26 : 24;
    label(this, x0 + art.w / 2, by - lobby, `${t.emoji} ${t.name.toUpperCase()}`, id === 'sky' ? '#ffe27a' : '#9ff0e8', 7).setDepth(99000);
    const tag = label(this, x0 + art.w / 2, by - lobby + 8, '', '#ffd23a', 6).setDepth(99000);
    // đèn tầng mái sáng khi sở hữu penthouse
    const beacon = id === 'sky' ? { x: x0 + art.w / 2, y: y0 + 8, color: 0xffd23a } : undefined;
    this.towerObjs.push({ id, units: units2, tag, beacon });
  }

  private createHouses() {
    for (const lot of this.m.houses) {
      const cx = (lot.tx + lot.tw / 2) * T;
      const by = (lot.ty + lot.th) * T;
      const top = by - lot.th * T;
      const def = HOUSE_BY_ID[lot.house];
      // nhà luôn dựng sẵn để người chơi xem tận nơi, chưa mua thì cắm biển bán
      this.add.image(cx, by, lot.tex).setOrigin(0.5, 1).setDepth(by);
      for (let y = lot.ty + lot.th - lot.solidRows; y < lot.ty + lot.th; y++) {
        for (let x = lot.tx; x < lot.tx + lot.tw; x++) {
          this.collideLayer.putTileAt(0, x, y);
          this.solid[y][x] = true;
        }
      }
      const saleSign = this.add.image(cx + 18, by + 14, 'sale_sign').setOrigin(0.5, 1).setDepth(by + 14);
      this.tweens.add({ targets: saleSign, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const sale = [
        saleSign,
        label(this, cx, top + 1, `${def.emoji} ${def.name}`, '#fff2b0', 6).setDepth(99000),
        label(this, cx, top + 9, `🏷️ ĐANG BÁN · 🪙 ${fmt(def.price)}`, '#ffd23a', 6).setDepth(99000),
      ];
      const own = [
        this.add.image(cx - 18, by + 14, 'own_flag').setOrigin(0.5, 1).setDepth(by + 14),
        label(this, cx, top + 1, `🔑 ${def.name} · Nhà bạn`, '#9dff9a', 6).setDepth(99000),
      ];
      this.houseObjs.push({ lot, sale, own });
      this.interactables.push({
        x: lot.door[0] * T,
        y: lot.door[1] * T,
        r: 20,
        label: () => (game().houses.includes(lot.house) ? `${def.emoji} Vào ${def.name}` : `🔑 Xem nhà ${def.name} · 🪙${fmt(def.price)}`),
        run: () => {
          sfx.open();
          bus.emit('house', lot.house);
        },
      });
    }
  }

  private createPlots() {
    this.m.plots.forEach(([tx, ty], i) => {
      const x = tx * T + 16;
      const y = ty * T + 16;
      this.plotSoil[i] = this.add.image(x, y, 'weeds').setDepth(-500);
      this.plotCrop[i] = this.add.image(x, y, 'crop_wheat_0').setDepth(y + 10).setVisible(false);
      this.plotBadge[i] = label(this, x + 9, y - 4, '', '#ffffff', 7).setDepth(y + 20);
      this.interactables.push({ x, y: y + 2, r: 19, label: () => this.plotLabel(i), run: () => this.plotAction(i) });
    });
    if (this.m.info.id === 'farm') {
      // Thùng ủ phân & quản lý ruộng vườn ngay góc đông nam cánh đồng
      this.interactables.push({
        x: 21.5 * T,
        y: 18.8 * T,
        r: 22,
        label: () => '🌿 Trạm Ủ Phân & Quản Lý Canh Tác',
        run: () => {
          sfx.open();
          bus.emit('seed', 0);
        },
      });
    }
  }

  private createNpcs() {
    for (const n of this.m.npcs) {
      const actor = new StoryNpcActor(this, n.id, n.x, n.y, n.talk);
      this.storyNpcs.push(actor);
      this.npcMarkers.push({ id: n.id, marker: actor.marker });
      this.interactables.push(actor.it);
    }
    this.folks = buildMapFolk(this, this.m);
    for (const f of this.folks) this.interactables.push(f.it);
    // gà chạy quanh nông trại (trang trí)
    const yard = this.m.chickens;
    if (yard) {
      for (let i = 0; i < 4; i++) {
        const c = this.add.sprite((yard.x0 + 1 + i * 3.5) * T, (yard.y0 + 1) * T, 'chicken', '0').play('chicken_move');
        this.wanderSprite(c, yard.x0 * T, yard.y0 * T, yard.x1 * T, yard.y1 * T);
      }
    }
  }

  private wanderSprite(c: Phaser.GameObjects.Sprite, x0: number, y0: number, x1: number, y1: number) {
    const go = () => {
      if (!c.active) return;
      const nx = Phaser.Math.Between(x0, x1);
      const ny = Phaser.Math.Between(y0, y1);
      c.setFlipX(nx < c.x);
      this.tweens.add({
        targets: c, x: nx, y: ny, duration: Phaser.Math.Between(1500, 3500),
        onUpdate: () => c.setDepth(c.y + 6),
        onComplete: () => this.time.delayedCall(Phaser.Math.Between(500, 3000), go),
      });
    };
    go();
  }

  private createLifeSpots() {
    this.castIt = {
      x: -999,
      y: -999,
      r: 14,
      label: () =>
        this.castTarget && !this.fishGear
          ? heldKind(game()) !== 'rod'
            ? '🎣 Chọn cần câu ở thanh 10 ô để câu'
            : this.castPrivate() && !game().houses.includes('lakehouse')
              ? '🔒 Hồ riêng của Nhà ven hồ'
              : '🎣 Quăng cần câu'
          : null,
      run: () => this.startCast(),
    };
    this.interactables.push(this.castIt);
    const kite = this.m.kiteSpot;
    if (!kite) return;
    const kx = kite.x * T;
    const ky = kite.y * T;
    this.add.image(kx + 20, ky - 4, 'signpost').setOrigin(0.5, 1).setDepth(ky);
    this.interactables.push({ x: kx, y: ky, r: 26, label: () => '🪁 Thả diều', run: () => this.startKite() });
  }

  // ---------------- Hồ Câu: thuyền neo nhấp nhô, thuyền & vịt bơi theo đường cong, cá nhảy

  private createLakeLife() {
    const life = this.m.lakeLife;
    if (!life) return;
    for (const b of life.moored) {
      const img = this.add.image(b.x * T, b.y * T, 'boat_moored').setOrigin(0.5, 0.8).setDepth(b.y * T).setFlipX(!!b.flip);
      this.tweens.add({ targets: img, y: img.y + 1.5, angle: { from: -2, to: 2 }, duration: 1500 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // Thêm tương tác bước lên thuyền chèo ra câu cá
      this.interactables.push({
        x: b.x * T,
        y: b.y * T,
        r: 32,
        label: () => (this.inBoat ? null : '⛵ Lên thuyền ra câu cá'),
        run: () => this.boardBoat(b.x * T, b.y * T),
      });
    }
    for (const r of life.routes) {
      const pts = r.pts.map(([x, y]) => new Phaser.Math.Vector2(x * T, y * T));
      if (r.loop) pts.push(pts[0].clone());
      const curve = new Phaser.Curves.Spline(pts);
      const gap = 0.012;
      const sprites = Array.from({ length: 1 + (r.n ?? 0) }, (_, i) => this.add.image(0, 0, i && r.trail ? r.trail : r.tex).setOrigin(0.5, 0.85));
      let prev = 0;
      let dir = 1;
      this.tweens.addCounter({
        from: 0, to: 1, duration: r.ms, repeat: -1, yoyo: !r.loop,
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 0;
          if (v !== prev) dir = v > prev ? 1 : -1;
          prev = v;
          sprites.forEach((s, i) => {
            let t = v - dir * i * gap;
            t = r.loop ? ((t % 1) + 1) % 1 : Math.max(0, Math.min(1, t));
            const p = curve.getPoint(t);
            const q = curve.getPoint(r.loop ? (t + 0.002) % 1 : Math.min(1, t + 0.002));
            const bob = Math.sin(this.time.now / 380 + i * 1.3) * 0.8;
            s.setPosition(p.x, p.y + bob).setDepth(p.y);
            // ảnh vẽ quay sang phải; đi ngược hướng thì lật
            if (Math.abs(q.x - p.x) > 0.01) s.setFlipX((q.x - p.x) * dir < 0);
          });
        },
      });
    }
    this.time.addEvent({ delay: 2200, loop: true, callback: () => this.fishJump() });
  }

  /** một con cá nhảy khỏi mặt nước ở chỗ ngẫu nhiên trong khung nhìn */
  private fishJump() {
    const v = this.cameras.main.worldView;
    for (let i = 0; i < 20; i++) {
      const tx = Math.floor((v.x + Math.random() * v.width) / T);
      const ty = Math.floor((v.y + Math.random() * v.height) / T);
      if (!this.isWater(tx, ty) || !this.isWater(tx + 1, ty) || !this.isWater(tx, ty + 1)) continue;
      const x = tx * T + 8;
      const y = ty * T + 10;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const f = this.add.image(x, y, 'jumpfish').setDepth(y).setFlipX(dir < 0).setAngle(-50 * dir);
      this.tweens.add({ targets: f, y: y - 14, duration: 320, yoyo: true, ease: 'Quad.easeOut', onComplete: () => f.destroy() });
      this.tweens.add({ targets: f, x: x + 10 * dir, angle: 50 * dir, duration: 640 });
      for (const [at, delay] of [[x, 0], [x + 10 * dir, 620]] as const) {
        const rp = this.add.image(at, y + 2, 'ripple').setDepth(y - 1).setAlpha(0).setScale(0.4);
        this.tweens.add({ targets: rp, alpha: { from: 0.9, to: 0 }, scale: 1.4, duration: 700, delay, onComplete: () => rp.destroy() });
      }
      return;
    }
  }

  boardBoat(x: number, y: number) {
    if (this.inBoat) return;
    this.inBoat = true;
    if (this.playerCollider) this.playerCollider.active = false;
    this.player.setPosition(x, y).setVelocity(0, 0);
    this.playerShadow.setVisible(false);
    if (this.boatSprite) this.boatSprite.destroy();
    this.boatSprite = this.add.image(x, y + 4, 'boat_player').setDepth(this.player.depth - 1).setOrigin(0.5, 0.6);
    this.tweens.add({
      targets: this.boatSprite,
      scaleX: { from: 0.85, to: 1 },
      scaleY: { from: 0.85, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
    });
    sfx.plant();
    this.splash(x, y + 6, 8);
    this.floatText(x, y - 22, '⛵ Đã lên thuyền câu cá!', '#38bdf8', 11);
    useGame.getState().toast('⛵ Đã lên thuyền! Dùng WASD / mũi tên chèo trên mặt nước, cầm Cần Câu để câu cá giữa hồ!', 'ok');
  }

  disembarkBoat(targetX: number, targetY: number) {
    if (!this.inBoat) return;
    this.inBoat = false;
    if (this.playerCollider) this.playerCollider.active = true;
    this.player.setPosition(targetX, targetY).setVelocity(0, 0);
    this.playerShadow.setVisible(true);
    if (this.boatSprite) {
      this.boatSprite.destroy();
      this.boatSprite = null;
    }
    sfx.click();
    this.floatText(targetX, targetY - 20, '⚓ Đã lên bờ!', '#fef08a', 10);
  }

  private createPlayer() {
    const saved = game().player;
    const [sx, sy] = toLocal(this.m.info.id, this.m.info.spawn);
    let x = sx * T;
    let y = sy * T;
    const isSavedMapOpen = isMapId(saved.map) && isMapOpen(saved.map);
    const inside = saved.x > 0 && saved.y > 0 && saved.x < this.m.info.w * T && saved.y < this.m.info.h * T;
    if (isSavedMapOpen && inside && saved.map === this.m.info.id && !this.isSolidAt(saved.x, saved.y + 6)) {
      x = saved.x;
      y = saved.y;
    } else {
      useGame.getState().setPlayer({ map: this.m.info.id, x: Math.round(x), y: Math.round(y) });
    }
    this.player = this.physics.add.sprite(x, y, 'hero', 'down_0').setOrigin(0.5, ORIGIN_Y) as Body;
    this.player.body.setSize(10, 6).setOffset((FRAME_W - 10) / 2, FEET_Y - 6);
    this.player.setCollideWorldBounds(true);
    this.playerCollider = this.physics.add.collider(this.player, this.collideLayer);
    this.playerShadow = this.add.image(x, y, 'shadow');
  }

  private createMonsters() {
    for (const sp of this.m.spawners) {
      for (let i = 0; i < sp.count; i++) {
        const pos = this.randomSpawn(sp, false);
        this.monsters.push(new Monster(this, MONSTERS[sp.monster], sp, pos.x, pos.y));
      }
    }
  }

  private createAtmosphere() {
    this.nightRect = this.add.rectangle(0, 0, 64, 64, 0x0a1030, 0).setOrigin(0, 0).setDepth(90000).setVisible(false);
    this.rain = this.add
      .particles(0, 0, 'rain', {
        x: { min: -40, max: 480 }, y: { min: -30, max: 0 }, speedY: { min: 240, max: 300 }, speedX: { min: -60, max: -40 },
        lifespan: 1100, quantity: 3, frequency: 25, emitting: false,
      })
      .setDepth(95000);
    this.fireflies = this.add
      .particles(0, 0, 'firefly', {
        x: { min: -170, max: 170 }, y: { min: -100, max: 100 }, speed: { min: 2, max: 9 }, lifespan: 3200,
        alpha: { start: 0.9, end: 0 }, frequency: 240, blendMode: 'ADD', emitting: false,
      })
      .setDepth(95001);

    // hiệu ứng riêng từng vùng quái — phát theo khung nhìn
    const X = { min: -40, max: 480 };
    const Y = { min: -30, max: 320 };
    const mk = (fx: ZoneFx, tex: string, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) => {
      this.fx[fx] = this.add.particles(0, 0, tex, { emitting: false, ...cfg }).setDepth(95003);
    };
    mk('snow', 'firefly', { x: X, y: { min: -20, max: 0 }, speedY: { min: 25, max: 55 }, speedX: { min: -15, max: 10 }, lifespan: 6000, frequency: 35, tint: 0xffffff, alpha: { start: 1, end: 0.6 } });
    mk('ash', 'firefly', { x: X, y: { min: -20, max: 0 }, speedY: { min: 15, max: 35 }, speedX: { min: -25, max: -5 }, lifespan: 7000, frequency: 90, tint: 0x9a8a7a, alpha: 0.7 });
    mk('leaf', 'firefly', { x: X, y: { min: -20, max: 0 }, speedY: { min: 20, max: 38 }, speedX: { min: 10, max: 30 }, lifespan: 8000, frequency: 120, tint: 0xf59e0b, rotate: { min: 0, max: 360 } });
    mk('ember', 'firefly', { x: X, y: { min: 260, max: 320 }, speedY: { min: -45, max: -20 }, speedX: { min: -8, max: 8 }, lifespan: 5000, frequency: 70, tint: 0xff8a30, blendMode: 'ADD', alpha: { start: 1, end: 0 } });
    mk('spore', 'firefly', { x: X, y: Y, speed: { min: 3, max: 10 }, lifespan: 4500, frequency: 110, tint: 0xc8a0ff, blendMode: 'ADD', alpha: { start: 0.9, end: 0 } });
    mk('fog', 'puff', { x: X, y: Y, speedX: { min: 5, max: 14 }, lifespan: 7000, frequency: 220, tint: 0xc8c8e0, scale: { start: 2, end: 5 }, alpha: { start: 0.14, end: 0 } });
    mk('petal', 'petal', { x: X, y: { min: -20, max: 0 }, speedY: { min: 18, max: 36 }, speedX: { min: 12, max: 34 }, lifespan: 9000, frequency: 80, rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0.6 } });
    mk('sparkle', 'spark', { x: X, y: Y, lifespan: 1200, frequency: 65, scale: { start: 0.8, end: 0 }, blendMode: 'ADD', tint: 0xfde047, alpha: { start: 0.9, end: 0 } });
  }

  private isSolidAt(px: number, py: number) {
    const tx = Math.floor(px / T);
    const ty = Math.floor(py / T);
    return this.solid[ty]?.[tx] ?? true;
  }

  /** kiểm tra chân nhân vật phụ có đi vào ô trống trong bản đồ được không */
  canWalkAt(px: number, py: number) {
    if (px < T * 1.3 || py < T * 1.3 || px > (this.m.info.w - 1.3) * T || py > (this.m.info.h - 1.3) * T) return false;
    return !this.isSolidAt(px, py + 6);
  }

  /** tìm quái gần nhân vật phụ để mạo hiểm giả lao vào giao chiến */
  findMonsterNear(x: number, y: number, maxD: number) {
    return this.nearestMonster(x, y, maxD);
  }

  randomSpawn(sp: Spawner, avoidPlayer: boolean) {
    for (let i = 0; i < 60; i++) {
      const tx = Phaser.Math.Between(sp.area.x0, sp.area.x1);
      const ty = Phaser.Math.Between(sp.area.y0, sp.area.y1);
      if (this.solid[ty][tx]) continue;
      if (sp.avoid.some((r) => tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1)) continue;
      const x = tx * T + 8;
      const y = ty * T + 8;
      if (avoidPlayer && Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 130) continue;
      return { x, y };
    }
    return { x: ((sp.area.x0 + sp.area.x1) / 2) * T, y: ((sp.area.y0 + sp.area.y1) / 2) * T };
  }

  // ---------------- đồng bộ thế giới với state

  private syncWorld(now: number) {
    const g = game();
    this.stats = playerStats(g);
    this.syncPlots(now);
    const b = g.buildings;
    for (const fb of this.farmBuildings) {
      const built = b[fb.building as keyof typeof b] > 0;
      fb.img.setVisible(built);
      fb.lot.setVisible(!built);
    }
    this.blades?.setVisible(b.windmill > 0);
    for (const h of this.houseObjs) {
      const owned = g.houses.includes(h.lot.house);
      h.sale.forEach((o) => o.setVisible(!owned));
      h.own.forEach((o) => o.setVisible(owned));
    }
    for (const to of this.towerObjs) {
      let left = 0;
      for (const u of to.units) {
        const owned = g.houses.includes(u.id);
        if (!owned) left++;
        u.sale.forEach((r) => r.setVisible(!owned));
        u.lit.forEach((r) => r.setVisible(owned));
      }
      const mine = to.units.length - left;
      const text = (left ? `🏷️ Đang bán ${left} căn` : '✨ Đã bán hết') + (mine ? ` · 🔑 ${mine} căn của bạn` : '');
      if (to.tag.text !== text) to.tag.setText(text);
      if (to.beacon && g.houses.includes('sky_penthouse') && !this.glows.includes(to.beacon)) this.glows.push(to.beacon);
    }
    for (const n of this.npcMarkers) {
      const st = npcQuestState(g, n.id);
      n.marker.setVisible(st === 'offer' || st === 'done').setText(st === 'done' ? '❓' : '❗');
    }
    this.syncAnimals(g.animals, now);
    this.syncCosmetics();
    this.syncTags();
    const look = heroLook(g);
    const lk = JSON.stringify(look);
    if (lk !== this.lookKey) {
      this.lookKey = lk;
      renderHero(this, look);
    }
  }

  private syncAnimals(list: AnimalState[], now: number) {
    // vật nuôi chỉ ở chuồng Khu Nông Trại
    if (!this.m.ranchPen) return;
    const seen = new Set<number>();
    for (const a of list) {
      seen.add(a.uid);
      let o = this.animalObjs.get(a.uid);
      if (!o) o = this.spawnAnimal(a);
      const st = animalStatus(game(), a.uid, now);
      const def = ANIMALS[a.kind];
      const badge =
        st === 'sick'
          ? '🤒'
          : st === 'vaccine'
            ? '💉'
            : st === 'hungry'
              ? '🍽️'
              : st === 'dirty'
                ? '🧹'
                : st === 'ready'
                  ? ITEMS[def.product].emoji
                  : '';
      o.icon.setText(badge);
    }
    for (const [uid, o] of this.animalObjs) {
      if (seen.has(uid)) continue;
      o.sprite.destroy();
      o.icon.destroy();
      this.interactables = this.interactables.filter((it) => it !== o.it);
      this.animalObjs.delete(uid);
    }
  }

  private spawnAnimal(a: AnimalState): AnimalObj {
    const def = ANIMALS[a.kind];
    const pen = this.m.ranchPen!;
    const [x0, y0, x1, y1] = [pen.x0 * T, pen.y0 * T, pen.x1 * T, pen.y1 * T];
    const x = Phaser.Math.Between(x0, x1);
    const y = Phaser.Math.Between(y0, y1);
    const sprite = this.add.sprite(x, y, a.kind, '0').play(`${a.kind}_move`);
    this.wanderSprite(sprite, x0, y0, x1, y1);
    const icon = label(this, x, y - 8, '', '#ffffff', 8).setDepth(99000);
    const it: Interactable = {
      x, y, r: 16,
      label: () => {
        const g = game();
        const st = animalStatus(g, a.uid, Date.now());
        const cur = g.animals.find((v) => v.uid === a.uid);
        if (st === 'sick') return `💊 Chữa bệnh cho ${def.name} (Thuốc thú y)`;
        if (st === 'vaccine') return `💉 Chích ngừa vắc-xin cho ${def.name}`;
        if (st === 'hungry') return `🍽️ Cho ${def.name} ăn (${Object.entries(def.feed).map(([id, n]) => `${ITEMS[id].emoji}${n}`).join(' ')})`;
        if (st === 'dirty') return `🧹 Dọn vệ sinh chuồng ${def.name}`;
        if (st === 'ready') return `🧺 Thu ${ITEMS[def.product].emoji} từ ${def.name}`;
        return `${def.emoji} ${def.name} · Khoẻ mạnh · ${fmtTime((cur?.readyAt ?? 0) - Date.now())}`;
      },
      run: () => {
        if (animalStatus(game(), a.uid, Date.now()) === 'growing') {
          sfx.open();
          bus.emit('panel', 'ranch');
          return;
        }
        if (useGame.getState().act((g, now) => tendAnimal(g, a.uid, now))) {
          sfx.harvest();
          this.sparkles(sprite.x, sprite.y);
          this.syncAnimals(game().animals, Date.now());
        }
      },
    };
    this.interactables.push(it);
    const o = { sprite, icon, it };
    this.animalObjs.set(a.uid, o);
    return o;
  }

  // ---------------- ruộng

  private plotLabel(i: number): string | null {
    const g = game();
    if (i >= g.plots.length) return i === g.plots.length ? `Mua ô đất · 🪙${fmt(plotCost(i))}` : null;
    const p = g.plots[i];
    if (!p.cropId) return '🌱 Gieo hạt (Hoa quả / Rau củ)';
    const crop = CROP_BY_ID[p.cropId];
    const now = Date.now();
    const step = plotCareStep(p, now);
    if (step === 'water') return `💧 Tưới nước cho ${crop.emoji} ${crop.name}`;
    if (step === 'fertilize') return `🌿 Bón phân cho ${crop.emoji} ${crop.name}`;
    if (step === 'weed') return `${p.pest ? '🐛 Phun thuốc bắt sâu' : '🌱 Nhổ cỏ chăm cây'} (${crop.emoji} ${crop.name})`;
    if (step === 'ready') return `🧺 Thu hoạch ${crop.emoji} ${crop.name}`;
    return `${crop.emoji} ${crop.name} · Đã chăm đủ · ${fmtTime(p.readyAt - now)}`;
  }

  private plotAction(i: number) {
    const store = useGame.getState();
    const g = store.game;
    if (i >= g.plots.length) {
      if (store.act((g) => buyPlot(g))) {
        sfx.coin();
        this.puffs(this.plotSoil[i].x, this.plotSoil[i].y, 8);
        this.syncPlots(Date.now());
      }
      return;
    }
    const p = g.plots[i];
    if (!p.cropId) {
      bus.emit('seed', i);
      return;
    }
    const now = Date.now();
    const step = plotCareStep(p, now);
    const img = this.plotCrop[i];
    if (step === 'water') {
      if (store.act((g, now) => waterPlot(g, i, now))) {
        sfx.plant();
        this.splash(img.x, img.y, 6);
        this.floatText(img.x, img.y - 10, '💧 Đã tưới', '#7fe8ff', 8);
        this.syncPlots(Date.now());
      }
      return;
    }
    if (step === 'fertilize') {
      if (store.act((g, now) => fertilizePlot(g, i, 'basic', now))) {
        sfx.plant();
        this.sparkles(img.x, img.y);
        this.floatText(img.x, img.y - 10, '🌿 Đã bón phân', '#9dff9a', 8);
        this.syncPlots(Date.now());
      }
      return;
    }
    if (step === 'weed') {
      if (store.act((g, now) => weedPlot(g, i, now))) {
        sfx.swing();
        this.puffs(img.x, img.y, 5);
        this.floatText(img.x, img.y - 10, '✨ Sạch cỏ sâu', '#ffe27a', 8);
        this.syncPlots(Date.now());
      }
      return;
    }
    if (step !== 'ready') {
      bus.emit('seed', i);
      return;
    }
    const msg = store.apply((g, now) => harvest(g, i, now));
    if (msg !== undefined) {
      sfx.harvest();
      const bumper = msg.startsWith('🌟');
      this.floatText(img.x, img.y - 10, msg.split(' ').slice(0, bumper ? 5 : 2).join(' '), bumper ? '#ffd23a' : '#b8f07a', bumper ? 10 : 9);
      this.sparkles(img.x, img.y);
      if (bumper) {
        sfx.levelUp();
        this.sparkles(img.x - 6, img.y - 4);
        this.sparkles(img.x + 6, img.y - 4);
      }
      this.syncPlots(Date.now());
    }
  }

  private onPlanted(i: number) {
    sfx.plant();
    const soil = this.plotSoil[i] ?? this.plotSoil[0];
    if (soil) this.puffs(soil.x, soil.y + 4, 4);
    this.syncPlots(Date.now());
  }

  private syncPlots(now: number) {
    const g = game();
    this.m.plots.forEach((_, i) => {
      const owned = i < g.plots.length;
      const p = g.plots[i];
      const soilTex = !owned
        ? 'weeds'
        : !p?.cropId
          ? 'soil'
          : p.watered === false
            ? 'soil_dry'
            : p.fertilized === false
              ? 'soil_wet'
              : 'soil_fert';
      this.plotSoil[i].setTexture(soilTex).setAlpha(owned || i === g.plots.length ? 1 : 0.6);
      const img = this.plotCrop[i];
      const badge = this.plotBadge[i];
      if (!p?.cropId) {
        img.setVisible(false);
        badge?.setText('');
        this.readyTweens.get(i)?.stop();
        this.readyTweens.delete(i);
        img.setScale(1);
        return;
      }
      const step = plotCareStep(p, now);
      const ready = step === 'ready';
      const progress = (now - p.plantedAt) / Math.max(1, p.readyAt - p.plantedAt);
      img.setTexture(`crop_${p.cropId}_${ready ? 2 : progress < 0.5 ? 0 : 1}`).setVisible(true);
      const badgeTxt =
        step === 'water'
          ? '💧'
          : step === 'fertilize'
            ? '🌿'
            : step === 'weed'
              ? p.pest
                ? '🐛'
                : '🌱'
              : step === 'ready'
                ? '🧺'
                : p.fertilizer === 'gold'
                  ? '🌟'
                  : p.fertilizer === 'super'
                    ? '⚡'
                    : '';
      badge?.setText(badgeTxt);
      if (ready && !this.readyTweens.has(i)) {
        this.readyTweens.set(i, this.tweens.add({ targets: img, scaleY: 1.06, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
      } else if (!ready && this.readyTweens.has(i)) {
        this.readyTweens.get(i)!.stop();
        this.readyTweens.delete(i);
        img.setScale(1);
      }
    });
  }

  // ---------------- chiến đấu

  private nearestMonster(x: number, y: number, maxD: number): Monster | null {
    let best: Monster | null = null;
    let bd = Infinity;
    for (const m of this.monsters) {
      if (m.dead || m.asleep) continue;
      const d = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, x, y);
      if (d < maxD + m.def.radius && d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  private aimAt(m: Monster | null): [number, number] {
    const p = this.player;
    if (!m) return DIR_VEC[this.facing];
    const ax = m.sprite.x - p.x;
    const ay = m.sprite.y - (p.y + 3);
    const l = Math.hypot(ax, ay) || 1;
    const dx = ax / l;
    const dy = ay / l;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    p.setFlipX(this.facing === 'left');
    if (!p.anims.isPlaying) p.setFrame(`${this.animDir()}_0`);
    return [dx, dy];
  }

  private rollDamage(mult: number) {
    const st = this.stats;
    const crit = Math.random() < st.crit;
    return { crit, dmg: Math.max(1, Math.round(st.atk * mult * (0.85 + Math.random() * 0.3) * (crit ? 1.8 : 1))) };
  }

  private attack(time: number) {
    const st = this.stats;
    if (time < this.nextAttack) return;
    if (heldKind(game()) === 'rod') {
      if (time > this.rodWarnAt) {
        this.rodWarnAt = time + 2500;
        useGame.getState().toast('🎣 Đang cầm cần câu — bấm phím số để đổi sang vũ khí', 'err');
      }
      return;
    }
    this.nextAttack = time + st.cooldown;
    this.swingAt = time;
    const p = this.player;
    const [dx, dy] = this.aimAt(this.nearestMonster(p.x, p.y + 3, 21 + st.range));
    const hx = p.x + dx * st.range;
    const hy = p.y + 3 + dy * (st.range - 2);
    const slash = this.add.image(hx, hy, 'slash').setRotation(Math.atan2(dy, dx)).setDepth(p.depth + 1).setTint(st.color).setScale(Math.max(1, st.range / 15));
    this.tweens.add({ targets: slash, alpha: 0, scale: slash.scale * 1.3, duration: 170, onComplete: () => slash.destroy() });
    sfx.swing();

    let hit = false;
    for (const m of this.monsters) {
      if (m.dead) continue;
      if (Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, hx, hy) < 13 + m.def.radius) {
        const { crit, dmg } = this.rollDamage(1);
        m.hurt(dmg, crit, dx, dy, time);
        (crit ? sfx.crit : sfx.hit)();
        hit = true;
      }
    }
    if (hit) this.cameras.main.shake(60, 0.002);
  }

  private useSkill(id: SkillId, time: number) {
    const def = SKILLS.find((s) => s.id === id)!;
    const store = useGame.getState();
    if (store.game.player.level < def.level) {
      store.toast(`🔒 ${def.emoji} ${def.name} mở khóa ở Lv ${def.level}`, 'err');
      return;
    }
    const now = Date.now();
    if (now < (skillCd[id] ?? 0)) return;
    skillCd[id] = now + def.cd;
    const p = this.player;

    if (id === 'dash') {
      const ix = (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) - (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0) + controls.joyX;
      const iy = (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) - (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0) + controls.joyY;
      const l = Math.hypot(ix, iy);
      this.dashVec = l > 0.15 ? [ix / l, iy / l] : DIR_VEC[this.facing];
      this.dashUntil = time + 170;
      this.invulnUntil = Math.max(this.invulnUntil, time + 280);
      sfx.swing();
      this.time.addEvent({
        delay: 28, repeat: 5,
        callback: () => {
          const gh = this.add.image(p.x, p.y, p.texture.key, p.frame.name).setOrigin(0.5, ORIGIN_Y).setFlipX(p.flipX).setAlpha(0.55).setTint(0x9fd3ff).setDepth(p.depth - 1);
          this.tweens.add({ targets: gh, alpha: 0, duration: 260, onComplete: () => gh.destroy() });
        },
      });
    } else if (id === 'spin') {
      const R = 30;
      for (const m of this.monsters) {
        if (m.dead) continue;
        const d = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, p.x, p.y + 3);
        if (d < R + m.def.radius) {
          const { crit, dmg } = this.rollDamage(1.6);
          m.hurt(dmg, crit, (m.sprite.x - p.x) / (d || 1), (m.sprite.y - p.y) / (d || 1), time);
        }
      }
      const blades = [0, 1, 2, 3].map(() => this.add.image(p.x, p.y, 'slash').setTint(this.stats.color).setDepth(p.depth + 1));
      this.tweens.addCounter({
        from: 0, to: 1, duration: 320,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          blades.forEach((b, k) => {
            const a = t * Math.PI * 2.2 + (k * Math.PI) / 2;
            b.setPosition(this.player.x + Math.cos(a) * 15, this.player.y + 3 + Math.sin(a) * 12).setRotation(a + Math.PI / 2).setAlpha(1 - t * 0.6);
          });
        },
        onComplete: () => blades.forEach((b) => b.destroy()),
      });
      sfx.crit();
      this.cameras.main.shake(120, 0.004);
    } else if (id === 'wave') {
      const [dx, dy] = this.aimAt(this.nearestMonster(p.x, p.y, 130));
      const img = this.add.image(p.x + dx * 10, p.y + 3 + dy * 10, 'slash').setTint(0x7fe8ff).setScale(1.6).setRotation(Math.atan2(dy, dx)).setDepth(99000);
      this.projectiles.push({ img, vx: dx * 240, vy: dy * 240, until: time + 700, dmg: 2.2, hostile: false, hit: new Set() });
      sfx.crit();
    } else {
      const g = store.game;
      const heal = Math.round(this.stats.maxHp * 0.35);
      store.setPlayer({ hp: Math.min(this.stats.maxHp, g.player.hp + heal) });
      this.floatText(p.x, p.y - 12, `+${heal} HP`, '#7dff8a', 10);
      this.sparkles(p.x, p.y);
      const ring = this.add.circle(p.x, p.y + 4, 6, 0x7dff8a, 0).setStrokeStyle(2, 0x7dff8a, 1).setDepth(p.depth + 2);
      this.tweens.add({ targets: ring, radius: 26, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      sfx.levelUp();
    }
  }

  private updateProjectiles(time: number, delta: number) {
    const p = this.player;
    this.projectiles = this.projectiles.filter((pr) => {
      pr.img.x += (pr.vx * delta) / 1000;
      pr.img.y += (pr.vy * delta) / 1000;
      if (time > pr.until) {
        pr.img.destroy();
        return false;
      }
      if (pr.hostile) {
        if (!this.playerDead && Phaser.Math.Distance.Between(pr.img.x, pr.img.y, p.x, p.y + 3) < 10) {
          this.hurtPlayer(pr.dmg, pr.img.x - pr.vx * 0.05, pr.img.y - pr.vy * 0.05);
          this.puffs(pr.img.x, pr.img.y, 3);
          pr.img.destroy();
          return false;
        }
      } else {
        for (const m of this.monsters) {
          if (m.dead || pr.hit.has(m)) continue;
          if (Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, pr.img.x, pr.img.y) < 12 + m.def.radius) {
            pr.hit.add(m);
            const { crit, dmg } = this.rollDamage(pr.dmg);
            const l = Math.hypot(pr.vx, pr.vy) || 1;
            m.hurt(dmg, crit, pr.vx / l, pr.vy / l, time);
            sfx.hit();
          }
        }
      }
      return true;
    });
  }

  hurtPlayer(raw: number, fromX: number, fromY: number) {
    const time = this.time.now;
    if (time < this.invulnUntil || this.playerDead || this.playerSafe) return;
    this.invulnUntil = time + 700;
    const store = useGame.getState();
    const dmg = Math.max(1, Math.round(raw * (0.85 + Math.random() * 0.3)) - this.stats.def);
    const hp = Math.max(0, store.game.player.hp - dmg);
    store.setPlayer({ hp });

    const p = this.player;
    this.floatText(p.x, p.y - 10, `-${dmg}`, '#ff5a4a', 9);
    p.setTint(0xff6060);
    this.time.delayedCall(140, () => p.clearTint());
    this.tweens.add({ targets: p, alpha: 0.4, duration: 90, yoyo: true, repeat: 3, onComplete: () => p.setAlpha(1) });
    const a = Math.atan2(p.y - fromY, p.x - fromX);
    p.setVelocity(Math.cos(a) * 160, Math.sin(a) * 160);
    this.knockUntil = time + 130;
    this.cameras.main.shake(110, 0.004);
    sfx.hurt();
    if (hp <= 0) this.playerDie();
  }

  private playerDie() {
    this.playerDead = true;
    const p = this.player;
    p.setVelocity(0, 0);
    p.anims.stop();
    sfx.die();
    this.tweens.add({ targets: p, angle: 90, duration: 300 });
    const cam = this.cameras.main;
    cam.fadeOut(900, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      useGame.getState().act((g) => playerDie(g));
      const respawnMap: MapId = isMapOpen(RESPAWN.map) ? RESPAWN.map : 'lake';
      const respawnAt: [number, number] = isMapOpen(RESPAWN.map) ? RESPAWN.at : MAPS.lake.spawn;
      const [rx, ry] = toLocal(respawnMap, respawnAt);
      p.setAngle(0);
      if (this.m.info.id !== respawnMap) {
        useGame.getState().setPlayer({ map: respawnMap, x: rx * T, y: ry * T });
        this.reload();
        return;
      }
      p.setPosition(rx * T, ry * T);
      cam.centerOn(rx * T, ry * T);
      this.playerDead = false;
      this.invulnUntil = this.time.now + 2000;
      cam.fadeIn(700);
    });
  }

  bossSlam(m: Monster, R: number) {
    const tx = this.player.x;
    const ty = this.player.y + 6;
    m.sprite.setVelocity(0, 0);
    m.stunUntil = this.time.now + 950;
    const warn = this.add.ellipse(tx, ty, R * 2, R * 1.2, 0xff3030, 0.2).setStrokeStyle(1, 0xff6050, 1).setDepth(ty - 2);
    this.tweens.add({ targets: warn, alpha: { from: 0.2, to: 0.6 }, duration: 200, yoyo: true, repeat: 1 });
    const sc = m.def.scale ?? 1;
    this.tweens.add({ targets: m.sprite, scaleY: sc * 0.8, scaleX: sc * 1.15, duration: 400, yoyo: true, onComplete: () => m.sprite.setScale(sc) });
    this.time.delayedCall(850, () => {
      warn.destroy();
      if (m.dead) return;
      sfx.slam();
      this.cameras.main.shake(220, 0.007);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        this.puffs(tx + Math.cos(a) * R * 0.8, ty + Math.sin(a) * R * 0.5, 1);
      }
      const ex = (this.player.x - tx) / R;
      const ey = (this.player.y + 6 - ty) / (R * 0.6);
      if (ex * ex + ey * ey <= 1) {
        this.invulnUntil = 0;
        this.hurtPlayer(m.def.atk * 1.6, tx, ty - 1);
      }
    });
  }

  /** Rồng Lửa phun 5 cầu lửa hình quạt */
  dragonFire(m: Monster) {
    const s = m.sprite;
    m.stunUntil = this.time.now + 700;
    s.setVelocity(0, 0);
    s.setTint(0xffb060);
    this.time.delayedCall(380, () => {
      s.clearTint();
      if (m.dead) return;
      const mx = s.x + (s.flipX ? -20 : 20) * (m.def.scale ?? 1);
      const my = s.y - 6;
      const base = Math.atan2(this.player.y - my, this.player.x - mx);
      const n = m.enraged ? 3 : 2;
      for (let k = -n; k <= n; k++) {
        const a = base + k * 0.22;
        const img = this.add.image(mx, my, 'fireball').setDepth(99000);
        if (m.def.shot) img.setTint(m.def.shot);
        this.tweens.add({ targets: img, angle: 360, duration: 600, repeat: -1 });
        this.projectiles.push({ img, vx: Math.cos(a) * 115, vy: Math.sin(a) * 115, until: this.time.now + 2600, dmg: m.def.atk * 0.7, hostile: true, hit: new Set() });
      }
      sfx.slam();
    });
  }

  // ---------------- boss

  bossSkill(m: Monster, skill: BossSkill) {
    if (skill === 'slam') this.bossSlam(m, 30 + (m.def.scale ?? 1) * 4 + (m.enraged ? 8 : 0));
    else if (skill === 'fire') this.dragonFire(m);
    else if (skill === 'charge') this.bossCharge(m);
    else if (skill === 'nova') this.bossNova(m);
    else this.bossSummon(m);
  }

  /** vạch đỏ cảnh báo rồi lao thẳng tới chỗ người chơi vừa đứng */
  private bossCharge(m: Monster) {
    const s = m.sprite;
    s.setVelocity(0, 0);
    m.stunUntil = this.time.now + 650;
    const a = Math.atan2(this.player.y - s.y, this.player.x - s.x);
    const line = this.add
      .rectangle(s.x, s.y, 150, 10 * (m.def.scale ?? 1), 0xff3030, 0.25)
      .setOrigin(0, 0.5)
      .setRotation(a)
      .setDepth(s.depth - 1);
    this.tweens.add({ targets: line, alpha: { from: 0.15, to: 0.55 }, duration: 160, yoyo: true, repeat: 1 });
    this.time.delayedCall(650, () => {
      line.destroy();
      if (m.dead) return;
      sfx.slam();
      m.chargeVec = { x: Math.cos(a) * 265, y: Math.sin(a) * 265 };
      m.chargeUntil = this.time.now + 560;
      m.chargeHit = false;
    });
  }

  /** vòng sáng tụ lực rồi bắn đạn tỏa tròn */
  private bossNova(m: Monster) {
    const s = m.sprite;
    const color = m.def.shot ?? 0xffffff;
    s.setVelocity(0, 0);
    m.stunUntil = this.time.now + 700;
    const ring = this.add.circle(s.x, s.y, 6, color, 0).setStrokeStyle(2, color, 0.9).setDepth(99000);
    this.tweens.add({ targets: ring, radius: 28 * (m.def.scale ?? 1), alpha: { from: 1, to: 0.2 }, duration: 500, onComplete: () => ring.destroy() });
    this.time.delayedCall(500, () => {
      if (m.dead) return;
      const n = m.enraged ? 16 : 12;
      const off = Math.random() * Math.PI;
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * Math.PI * 2;
        const img = this.add.image(s.x, s.y - 4, 'fireball').setDepth(99000).setScale(0.8);
        if (m.def.shot) img.setTint(m.def.shot);
        this.tweens.add({ targets: img, angle: 360, duration: 600, repeat: -1 });
        this.projectiles.push({ img, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, until: this.time.now + 2400, dmg: m.def.atk * 0.6, hostile: true, hit: new Set() });
      }
      sfx.slam();
    });
  }

  /** gọi quái thường của vùng ra trợ chiến (tối đa 4 con cùng lúc) */
  private bossSummon(m: Monster) {
    if (this.monsters.filter((x) => x.minion && !x.dead).length >= 4) {
      this.bossSlam(m, 36);
      return;
    }
    const def = MONSTERS[m.def.minion ?? ZONE_DEFS[m.def.zone - 1]?.monster];
    if (!def) return;
    const s = m.sprite;
    s.setVelocity(0, 0);
    m.stunUntil = this.time.now + 600;
    this.floatText(s.x, s.y - s.displayHeight / 2 - 6, '‼ Triệu hồi!', '#ff9a8a', 8);
    for (let k = 0; k < (m.enraged ? 3 : 2); k++) {
      const a = Math.random() * Math.PI * 2;
      const x = s.x + Math.cos(a) * 30;
      const y = s.y + Math.sin(a) * 22;
      if (this.isSolidAt(x, y)) continue;
      const mm = new Monster(this, def, m.spawner, x, y);
      mm.minion = true;
      this.monsters.push(mm);
      this.sparkles(x, y);
    }
  }

  bossEnrage(m: Monster) {
    m.enraged = true;
    m.restoreTint();
    m.aura?.setFillStyle(0xff3020, 0.5);
    m.nextSpecial = 0;
    this.cameras.main.shake(320, 0.01);
    this.floatText(m.sprite.x, m.sprite.y - m.sprite.displayHeight / 2 - 8, '🔥 NỔI GIẬN!', '#ff5a4a', 11);
    sfx.slam();
    this.bossBar(m);
  }

  /** thanh máu boss trên HUD */
  bossBar(m: Monster | null) {
    bus.emit('boss', m && !m.dead ? { name: m.def.name, hp: Math.max(0, m.hp), max: m.def.hp, enraged: m.enraged, zone: m.def.zone } : null);
  }

  removeMonster(m: Monster) {
    this.monsters = this.monsters.filter((x) => x !== m);
  }

  /** boss vào trận: banner cảnh báo + thanh máu; ra khỏi tầm thì ẩn */
  private watchBoss(time: number) {
    if (time < this.timers.boss) return;
    this.timers.boss = time + 300;
    const b = this.monsters.find((x) => x.def.boss && !x.dead && x.engaged) ?? null;
    if (b === this.bossShown) return;
    if (b && !b.introduced) {
      b.introduced = true;
      bus.emit('zone', { name: `👑 ${b.def.name}`, level: '⚠️ BOSS xuất hiện · Hạ gục để mở rương báu!' });
      this.cameras.main.shake(260, 0.006);
      sfx.slam();
    }
    this.bossShown = b;
    this.bossBar(b);
  }

  /** rương báu bật ra chỗ boss gục */
  private bossChest(x: number, y: number) {
    const c = this.add.image(x, y + 6, 'chest').setOrigin(0.5, 1).setDepth(y + 6).setScale(0);
    this.tweens.add({ targets: c, scale: 1.3, y: y + 2, duration: 380, ease: 'Back.easeOut' });
    this.time.delayedCall(800, () => {
      c.setTexture('chest_open');
      sfx.levelUp();
      this.sparkles(x, y - 6);
      for (let i = 0; i < 14; i++) {
        const coin = this.add.image(x, y - 8, 'coin').setDepth(99000);
        this.tweens.add({
          targets: coin, x: x + Phaser.Math.Between(-40, 40), y: y + Phaser.Math.Between(-30, 14), duration: 500, ease: 'Quad.easeOut',
          onComplete: () => this.tweens.add({ targets: coin, x: this.player.x, y: this.player.y, duration: 300, delay: 200 + i * 30, onComplete: () => coin.destroy() }),
        });
      }
    });
    this.tweens.add({ targets: c, alpha: 0, delay: 6000, duration: 800, onComplete: () => c.destroy() });
  }

  onKill(m: Monster, x: number, y: number) {
    const store = useGame.getState();
    const night = this.nightNow;
    const res = store.apply((g, now) => killMonster(g, m.def.id, now, night));
    if (!res) return;
    sfx.coin();
    const coins = Math.min(8, 2 + Math.floor((res.reward.gold ?? 0) / 10));
    for (let i = 0; i < coins; i++) {
      const c = this.add.image(x, y, 'coin').setDepth(99000);
      const ox = x + Phaser.Math.Between(-14, 14);
      const oy = y + Phaser.Math.Between(-10, 6);
      this.tweens.chain({
        targets: c,
        tweens: [
          { x: ox, y: oy, duration: 220, ease: 'Quad.easeOut' },
          { x: { getEnd: () => this.player.x }, y: { getEnd: () => this.player.y }, duration: 260, delay: 120 + i * 40, ease: 'Quad.easeIn' },
        ],
        onComplete: () => c.destroy(),
      });
    }
    this.floatText(x, y - 12, `+${res.reward.gold}🪙${night ? ' 🌙' : ''}`, '#ffd23a', 8);
    this.time.delayedCall(180, () => this.floatText(x, y - 4, `+${res.xp} XP`, '#7fe0ff', 7));
    Object.entries(res.reward.items ?? {}).forEach(([id, n], k) => {
      this.time.delayedCall(360 + k * 200, () => this.floatText(x, y - 20, `${ITEMS[id].emoji} ${ITEMS[id].name} ×${n}`, '#ffffff', 7));
    });
    if (m.def.boss) {
      this.cameras.main.flash(300, 255, 240, 200);
      this.bossShown = null;
      this.bossBar(null);
      this.bossChest(x, y);
      const l = res.loot;
      bus.emit('bossloot', {
        boss: m.def.name, gold: res.reward.gold ?? 0, gems: res.reward.gems ?? 0, xp: res.xp, items: res.reward.items ?? {},
        gear: l?.gear ?? [], dupes: l?.dupes ?? [], first: !!l?.first, jackpot: !!l?.jackpot,
      });
    }
    if (res.levelUps > 0) this.levelUpFx();
  }

  private levelUpFx() {
    const p = this.player;
    const lv = game().player.level;
    this.stats = playerStats(game());
    sfx.levelUp();
    const ring = this.add.circle(p.x, p.y + 4, 6, 0xffe680, 0).setStrokeStyle(2, 0xffe680, 1).setDepth(p.depth + 2);
    this.tweens.add({ targets: ring, radius: 30, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    this.floatText(p.x, p.y - 16, `LÊN CẤP ${lv}!`, '#ffe680', 11);
    this.sparkles(p.x, p.y);
    const unlocked = SKILLS.find((s) => s.level === lv);
    useGame.getState().toast(unlocked ? `⭐ Lên cấp ${lv}! Mở khóa kỹ năng ${unlocked.emoji} ${unlocked.name}` : `⭐ Lên cấp ${lv}! Sức mạnh tăng, HP hồi đầy`);
  }

  private eat() {
    const store = useGame.getState();
    const before = store.game.player.hp;
    if (store.apply((g) => eatFood(g)) !== undefined) {
      const healed = useGame.getState().game.player.hp - before;
      this.floatText(this.player.x, this.player.y - 12, `+${healed} HP`, '#7dff8a', 9);
      sfx.harvest();
    }
  }

  // ---------------- thả diều

  private startKite() {
    if (!game().kites.equipped) {
      useGame.getState().toast('🪁 Bạn chưa có diều — mua ở Tiệm Diều cạnh đồi', 'err');
      return;
    }
    sfx.open();
    bus.emit('kite', game().kites.equipped!);
  }

  /** diều bay đi sau khi thu diều thành công */
  private onKiteDone(ok: boolean) {
    const p = this.player;
    const id = game().kites.equipped;
    if (!id) return;
    const k = this.add.image(p.x + 10, p.y - 12, id).setDepth(95002);
    this.tweens.add({ targets: k, y: k.y - (ok ? 90 : -10), x: k.x + (ok ? 50 : 8), alpha: 0, angle: ok ? 0 : 160, duration: 1400, onComplete: () => k.destroy() });
    if (ok) this.sparkles(p.x, p.y - 10);
  }

  // ---------------- hiệu ứng

  floatText(x: number, y: number, text: string, color: string, size = 8) {
    const t = this.add
      .text(x, y, text, { fontFamily: TEXT_FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#1a1208', strokeThickness: 2, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(100001);
    this.tweens.add({ targets: t, y: y - 16, alpha: { from: 1, to: 0 }, duration: 950, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  puffs(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, 'puff').setDepth(y + 20).setAlpha(0.8);
      this.tweens.add({
        targets: p, x: x + Phaser.Math.Between(-12, 12), y: y + Phaser.Math.Between(-12, 4), alpha: 0, scale: { from: 0.6, to: 1.4 },
        duration: Phaser.Math.Between(300, 550), onComplete: () => p.destroy(),
      });
    }
  }

  private sparkles(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const s = this.add.image(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-8, 8), 'spark').setDepth(100000);
      this.tweens.add({ targets: s, y: s.y - 10, alpha: 0, angle: 90, duration: 600, delay: i * 60, onComplete: () => s.destroy() });
    }
  }

  // ---------------- ngày/đêm, mưa

  private updateAtmosphere(time: number) {
    const now = Date.now();
    if (time > this.timers.env) {
      this.timers.env = time + 500;
      this.nightNow = isNight(now);
      this.rainNow = isRaining(now);
      this.rain.emitting = this.rainNow;
    }
    const cam = this.cameras.main;
    const wv = cam.worldView;
    this.rain.setPosition(wv.x, wv.y);
    const zone = this.curZone;
    const theme = zone > 0 ? ZONE_THEMES[zone] : null;
    this.fireflies.emitting = this.nightNow && !this.rainNow && (zone === 0 || zone <= 4);
    this.fireflies.setPosition(this.player.x, this.player.y);

    // Hiệu ứng thời tiết theo 4 Mùa (Spring, Summer, Autumn, Winter) khi ở các bản đồ dã ngoại / câu cá (zone === 0)
    const season = getCurrentSeason(now).id;
    let seasonFx: ZoneFx | null = null;
    if (zone === 0) {
      if (this.m.info.id === 'glacier') {
        seasonFx = 'snow'; // Bản đồ Băng Tuyết Bắc Cực luôn có tuyết rơi
      } else {
        if (season === 'spring') seasonFx = 'petal'; // Cánh hoa đào bay lượn mùa xuân
        else if (season === 'summer') seasonFx = this.rainNow ? null : 'sparkle'; // Ánh nắng hè vàng rực lấp lánh (nếu ko mưa)
        else if (season === 'autumn') seasonFx = 'leaf'; // Lá phong vàng đỏ rơi rụng mùa thu
        else if (season === 'winter') seasonFx = 'snow'; // Bông tuyết trắng rơi mùa đông
      }
    }

    for (const [k, em] of Object.entries(this.fx)) {
      em!.emitting = theme?.fx === k || (zone === 0 && seasonFx === k);
      em!.setPosition(wv.x, wv.y);
    }

    const global = darkness(now);
    let dark = global + (this.rainNow ? 0.12 : 0);
    let color = 0x0a1030;
    if (theme?.overlay && theme.overlay.alpha >= dark) {
      dark = theme.overlay.alpha;
      color = theme.overlay.color;
    } else if (theme?.overlay) {
      dark = Math.min(0.85, dark + theme.overlay.alpha * 0.4);
    }
    // màn tối phủ rộng hơn khung nhìn để camera trượt không lộ mép
    const M = 48;
    const rect = this.nightRect;
    let used = 0;
    if (dark >= 0.02) {
      rect
        .setVisible(true)
        .setPosition(wv.x - M, wv.y - M)
        .setSize(wv.width + M * 2, wv.height + M * 2)
        .setFillStyle(color, Math.min(0.85, dark));
      const strength = Math.min(1, dark * 1.4);
      const light = (x: number, y: number, r: number, tint: number, a = 1) => {
        if (x + r < wv.x || x - r > wv.right || y + r < wv.y || y - r > wv.bottom) return;
        let img = this.lightPool[used];
        if (!img) {
          img = this.add.image(0, 0, 'light').setBlendMode(Phaser.BlendModes.ADD).setDepth(90001);
          this.lightPool.push(img);
        }
        used++;
        img.setVisible(true).setPosition(x, y).setScale(r / 32).setTint(tint).setAlpha(strength * a);
      };
      light(this.player.x, this.player.y, this.stats.light, 0xfff0c8, 0.42);
      if (global > 0.1 || this.rainNow) for (const [x, y] of this.lampLights) light(x, y, 48, 0xffb040, 0.6);
      for (const gl of this.glows) light(gl.x, gl.y, 24, gl.color, 0.45);
      const flick = 1 + Math.sin(time / 90) * 0.06 + Math.sin(time / 37) * 0.04;
      for (const [x, y] of this.campfires) light(x, y, 52 * flick, 0xff9a40, 0.75);
      for (const pr of this.projectiles) light(pr.img.x, pr.img.y, pr.hostile ? 26 : 20, pr.hostile ? 0xff7a30 : 0x7fe8ff, 0.8);
    } else {
      rect.setVisible(false);
    }
    for (let i = used; i < this.lightPool.length; i++) this.lightPool[i].setVisible(false);
    const winA = dark >= 0.02 ? Math.min(1, dark * 1.6) * 0.9 : 0;
    for (const r of this.nightWindows) r.setAlpha(winA);
  }

  // ---------------- vòng lặp

  update(time: number, delta: number) {
    const now = Date.now();
    if (time > this.timers.water) {
      this.timers.water = time + 650;
      this.waterFrame ^= 1;
      for (const [x, y] of this.water) this.groundLayer.putTileAt(this.waterFrame ? TILE.WATER2 : TILE.WATER, x, y);
      for (const [x, y] of this.lava) this.groundLayer.putTileAt(this.waterFrame ? TILE.LAVA2 : TILE.LAVA, x, y);
    }
    if (this.blades?.visible) this.blades.rotation += delta * 0.0012 * Math.min(3, game().buildings.windmill);
    if (time > this.timers.sync) {
      this.timers.sync = time + 300;
      this.syncWorld(now);
    }
    if (!this.paused) this.scanWater();
    for (const o of this.animalObjs.values()) {
      o.it.x = o.sprite.x;
      o.it.y = o.sprite.y + 4;
      o.icon.setPosition(o.sprite.x, o.sprite.y - 7);
    }
    this.updateAtmosphere(time);
    this.updateChunks();
    this.updateCosmetics(time, delta);
    this.updateFishing(time);
    this.updateHeld(time);
    {
      const p = this.player;
      const top = p.y - 19;
      this.nameTag.setPosition(p.x, top).setVisible(!this.playerDead);
      this.titleTag.setPosition(p.x, top - 7).setVisible(!this.playerDead);
      if (this.tagMythic && time - this.tagHueAt > 80) {
        this.tagHueAt = time;
        const hue = Math.floor(time / 8) % 360;
        this.titleTag.setColor(`hsl(${hue}, 100%, 70%)`).setShadow(0, 0, `hsl(${(hue + 180) % 360}, 100%, 60%)`, 4, false, true);
      }
    }
    worldInfo.px = this.player.x / T;
    worldInfo.py = this.player.y / T;
    if (this.paused) return;

    for (const a of this.storyNpcs) a.update(time, delta);
    for (const f of this.folks) f.update(time, delta);
    for (const m of this.monsters) m.update(time, this.nightNow);
    this.watchBoss(time);
    this.updateProjectiles(time, delta);
    const p = this.player;
    const feet = p.y + 8;
    p.setDepth(feet);
    this.playerShadow.setPosition(p.x, feet - 1).setDepth(feet - 1);
    if (this.playerDead) return;

    this.handleMovement(time);
    if (controls.attack) {
      controls.attack = false;
      this.attack(time);
    }
    if (controls.skill) {
      const s = controls.skill;
      controls.skill = null;
      this.useSkill(s, time);
    }
    if (controls.interact) {
      controls.interact = false;
      this.target?.run();
    }
    if (controls.eat) {
      controls.eat = false;
      this.eat();
    }
    this.updatePrompt();

    if (time > this.timers.regen) {
      this.timers.regen = time + 1000;
      const g = game();
      const { maxHp, regen } = this.stats;
      if (g.player.hp < maxHp) {
        const safe = this.playerSafe;
        const heal = Math.max(1, Math.round(maxHp * (safe ? 0.06 : 0.008) + regen));
        useGame.getState().setPlayer({ hp: Math.min(maxHp, g.player.hp + heal) });
      } else if (g.player.hp > maxHp) {
        useGame.getState().setPlayer({ hp: maxHp });
      }
    }
    if (time > this.timers.save) {
      this.timers.save = time + 2000;
      const s = game().player;
      if (Math.abs(s.x - p.x) > 2 || Math.abs(s.y - p.y) > 2) useGame.getState().setPlayer({ x: Math.round(p.x), y: Math.round(p.y) });
    }
    this.updateZone();
  }

  /** banner khu vực / vùng quái, mở khóa trại, ghi nhận vùng xa nhất */
  private updateZone() {
    const p = this.player;
    const zi = this.m.info.zone;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor((p.y + 6) / T);
    this.curZone = zi;
    this.playerSafe = zi === 0;
    this.checkExits(tx, ty);
    let key: string;
    let banner: { name: string; level: string };
    if (zi === 0) {
      const di = this.m.districts.findIndex((d) => p.x / T >= d.x0 && p.x / T <= d.x1 + 1 && p.y / T >= d.y0 && p.y / T <= d.y1 + 1);
      key = `d${di}`;
      banner = di >= 0 ? this.m.districts[di] : { name: this.m.info.name, level: `${this.m.info.sub} · Vùng an toàn` };
    } else {
      const z = ZONE_DEFS[zi - 1];
      key = `z${zi}`;
      banner = { name: `${zi}. ${z.name}`, level: `Khuyên dùng Lv ${zoneLevel(zi)}+ · ⚠️ Không có chỗ an toàn · 👑 ${MONSTERS[z.boss].name}` };
      // đi ngang đá dịch chuyển ở cửa vào là kích hoạt
      const wp = this.m.waypoints[0];
      if (wp && !game().waypoints.includes(wp.id) && Math.hypot(p.x / T - wp.x, p.y / T - wp.y) < 3) useGame.getState().act((g) => unlockWaypoint(g, wp.id));
    }
    if (key === this.areaKey) return;
    this.areaKey = key;
    bus.emit('zone', banner);
    if (zi > 0) {
      const store = useGame.getState();
      if (zi > store.game.maxZone) store.apply((g) => reachZone(g, zi));
    }
  }

  /** bước vào ô cổng ở mép bản đồ → sang bản đồ kế bên */
  private checkExits(tx: number, ty: number) {
    if (this.traveling || this.playerDead || this.time.now < this.exitLockUntil) return;
    const e = this.m.exits.find((e) => inRect(e, tx, ty));
    if (e) {
      if (!isMapOpen(e.to)) {
        this.exitLockUntil = this.time.now + 1200;
        useGame.getState().toast('🚧 Khu vực đang bảo trì — tạm thời chỉ mở Hồ Câu Cá & Đồi Gió', 'err');
        sfx.hit();
        const p = this.player;
        const kick = 24;
        let kx = 0;
        let ky = 0;
        if (p.body.velocity.x > 0) kx = -kick;
        else if (p.body.velocity.x < 0) kx = kick;
        if (p.body.velocity.y > 0) ky = -kick;
        else if (p.body.velocity.y < 0) ky = kick;
        if (kx === 0 && ky === 0) {
          if (this.facing === 'up') ky = kick;
          else if (this.facing === 'down') ky = -kick;
          else if (this.facing === 'left') kx = kick;
          else if (this.facing === 'right') kx = -kick;
          else ky = kick;
        }
        for (let step = kick; step >= 6; step -= 4) {
          const nx = p.x + (kx !== 0 ? Math.sign(kx) * step : 0);
          const ny = p.y + (ky !== 0 ? Math.sign(ky) * step : 0);
          if (!this.isSolidAt(nx, ny + 6) && nx > 16 && nx < (this.m.info.w - 1) * T && ny > 16 && ny < (this.m.info.h - 1) * T) {
            p.setPosition(nx, ny);
            break;
          }
        }
        p.setVelocity(0, 0);
        return;
      }
      this.travel(e.to, e.at);
    }
  }

  private animDir() {
    return this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
  }

  private handleMovement(time: number) {
    const p = this.player;
    if (time < this.dashUntil) {
      p.setVelocity(this.dashVec[0] * 300, this.dashVec[1] * 300);
      return;
    }
    if (time < this.knockUntil) return;
    const k = this.keys;
    let ix = 0;
    let iy = 0;
    if (k.A.isDown || k.LEFT.isDown) ix -= 1;
    if (k.D.isDown || k.RIGHT.isDown) ix += 1;
    if (k.W.isDown || k.UP.isDown) iy -= 1;
    if (k.S.isDown || k.DOWN.isDown) iy += 1;
    ix += controls.joyX;
    iy += controls.joyY;
    const len = Math.hypot(ix, iy);

    // Chèo thuyền lướt trên mặt nước
    if (this.inBoat) {
      const speed = 120 * this.stats.speed;
      if (len > 0.15) {
        const mag = Math.min(1, len);
        const targetVx = (ix / len) * speed * mag;
        const targetVy = (iy / len) * speed * mag;

        // Kiểm tra ô nước phía trước để lướt mượt mà không phi lên bờ
        const nextTx = Math.floor((p.x + (targetVx > 0 ? 10 : -10)) / T);
        const curTy = Math.floor((p.y + 6) / T);
        const curTx = Math.floor(p.x / T);
        const nextTy = Math.floor((p.y + 6 + (targetVy > 0 ? 10 : -10)) / T);

        const canX = this.isWater(nextTx, curTy);
        const canY = this.isWater(curTx, nextTy);

        p.setVelocity(canX ? targetVx : 0, canY ? targetVy : 0);
        this.facing = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 'left' : 'right') : iy < 0 ? 'up' : 'down';
        p.setFlipX(this.facing === 'left');

        // Tạo vệt sóng & bọt nước sau đuôi thuyền
        if (time > this.lastBoatWake + 220) {
          this.lastBoatWake = time;
          const wakeX = p.x + (ix > 0 ? -12 : 12);
          const rp = this.add.image(wakeX, p.y + 8, 'ripple').setScale(0.5).setAlpha(0.6).setDepth(p.y - 2);
          this.tweens.add({ targets: rp, scale: 1.3, alpha: 0, duration: 600, onComplete: () => rp.destroy() });
        }
      } else {
        p.setVelocity(0, 0);
      }

      // Lắc lư bồng bềnh tự nhiên theo sóng nước
      const bob = Math.sin(time / 220) * 1.5;
      if (this.boatSprite) {
        this.boatSprite.setPosition(p.x, p.y + 4 + bob);
        this.boatSprite.setFlipX(this.facing === 'left');
        this.boatSprite.setDepth(p.depth - 1);
      }
      p.setFrame(`${this.animDir()}_0`);
      return;
    }

    if (len > 0.15) {
      const mag = Math.min(1, len);
      const speed = PLAYER_SPEED * this.stats.speed;
      p.setVelocity((ix / len) * speed * mag, (iy / len) * speed * mag);
      this.facing = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 'left' : 'right') : iy < 0 ? 'up' : 'down';
      p.setFlipX(this.facing === 'left');
      p.anims.play(`${this.heroTex}_walk_${this.animDir()}`, true);
      p.anims.timeScale = 0.6 + mag * 0.6;
    } else {
      p.setVelocity(0, 0);
      p.anims.stop();
      p.setFrame(`${this.animDir()}_0`);
    }
  }

  private updatePrompt() {
    const fx = this.player.x;
    const fy = this.player.y + 6;
    let best: Interactable | null = null;
    let text: string | null = null;
    let bd = Infinity;

    // Khi ở trên thuyền: nếu đang sát bờ hoặc cầu cảng, cho phép bấm nút để cập bến lên bờ
    if (this.inBoat) {
      const curTx = Math.floor(fx / T);
      const curTy = Math.floor(fy / T);
      const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let landTile: [number, number] | null = null;
      for (const [dx, dy] of dirs) {
        const nx = curTx + dx;
        const ny = curTy + dy;
        if (nx >= 0 && nx < this.m.info.w && ny >= 0 && ny < this.m.info.h) {
          if (!this.isWater(nx, ny)) {
            landTile = [nx, ny];
            break;
          }
        }
      }
      const isHoldingRod = heldKind(game()) === 'rod';
      if (landTile && !isHoldingRod) {
        best = {
          x: fx,
          y: fy,
          r: 36,
          label: () => '⚓ Xuống thuyền (Lên bờ)',
          run: () => this.disembarkBoat(landTile![0] * T + 8, landTile![1] * T + 8),
        };
        text = '⚓ Xuống thuyền (Lên bờ)';
        bd = 0;
      }
    }

    for (const it of this.interactables) {
      const d = Math.hypot(it.x - fx, it.y - fy);
      if (d < it.r && d < bd) {
        const l = it.label();
        if (l) {
          best = it;
          text = l;
          bd = d;
        }
      }
    }
    this.target = best;
    // Tắt prompt nổi trong Phaser để không bao giờ đè lên tên & danh hiệu người chơi
    // Chỉ hiển thị 1 pill duy nhất ở chính giữa đáy màn hình trên thanh 10 ô (React UI)
    this.prompt.setVisible(false);
    if (best && text) {
      this.prompt.setText(this.touchMode ? text : `[E] ${text}`).setPosition(best.x, best.y + 14);
    }
    if (text !== this.promptLabel) {
      this.promptLabel = text;
      bus.emit('prompt', text);
    }
  }
}
