import { useEffect, useRef, useState } from 'react';
import { ITEMS } from '../game/config/farm';
import { SIZE_TIERS, fishKg } from '../game/config/life';
import { getCurrentSeason } from '../game/config/seasons';
import { FISHING_ZONES, ZONE_BY_ID } from '../game/config/fishingZones';
import { BAITS, RARITY_COLOR, ROD_BY_ID, getRareTier, getSizeTier } from '../game/config/shops';
import { itemCount } from '../game/logic/core';
import { catchFish, lineSnapChance, recordServerCatch, rollFish, spendBait, type CastInfo, type CatchResult, type FishOvertakeInfo, type FishRoll } from '../game/logic/life';
import { FISH_RARITY_COLOR, FISH_RARITY_NAME, fishFinish, fishStart, itemInfo, refreshChest, useChest, useServerFishing, type FishFinishResult } from '../services/fishingApi';
import { pushAll } from '../services/online';
import { useGame } from '../store';
import { bus, type FishingRequest } from '../world/bus';
import { TIER_COLOR, TITLE_BY_ID } from '../game/config/titles';
import { sfx } from '../world/sfx';
import { FishVisual } from '../art/fishArt';
import { RodVisual, BaitVisual } from '../art/fishingVisuals';

type Phase = 'bait' | 'cast' | 'wait' | 'bite' | 'reel' | 'land' | 'win' | 'lose';

/** lượt câu online: server giữ bí mật con cá, chỉ báo thông số minigame */
interface ServerCast {
  castId: string;
  difficulty: number;
  zone: number;
  slow: number;
}

type ServerCatch = Extract<FishFinishResult, { caught: true }>;

const fmtSec = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

/**
 * Mini-game câu cá:
 * 0. Chọn mồi (tốn 1 mồi mỗi lần thả)
 * 1. Chờ cá cắn — ngẫu nhiên, lâu nhất 1 phút (cần xịn chờ ít hơn). Phao có lúc nhúc nhích giả: đừng giật!
 * 2. "❗" hiện lên → bấm ngay. Có lúc cá chỉ rỉa mồi rồi chạy.
 * 3. Kim chạy qua lại → bấm khi kim trong vùng xanh. Cá to cần kéo nhiều lần hơn, có thể đứt dây.
 *
 * Bản online: fish_start trả thời gian chờ + độ khó; fish_finish trả con cá thật. Máy không tự quay cá.
 */
export function FishingGame({ req, onClose }: { req: FishingRequest; onClose: () => void }) {
  const g = useGame((s) => s.game);
  const apply = useGame((s) => s.apply);
  const online = useServerFishing();
  const chestSlots = useChest((s) => s.slots);
  const rod = ROD_BY_ID[g.fishingGear.rod] ?? ROD_BY_ID.rod_bamboo;
  const [cast, setCast] = useState<CastInfo | null>(null);
  const [roll, setRoll] = useState<FishRoll | null>(null);
  const [srv, setSrv] = useState<ServerCast | null>(null);
  const srvRef = useRef<ServerCast | null>(null);
  const [srvRes, setSrvRes] = useState<ServerCatch | null>(null);
  const [srvTitles, setSrvTitles] = useState<string[]>([]);
  const [topOvertake, setTopOvertake] = useState<FishOvertakeInfo | null>(null);
  const [phase, setPhase] = useState<Phase>('bait');
  const [loseMsg, setLoseMsg] = useState('');
  const [result, setResult] = useState<CatchResult | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [needle, setNeedle] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [nibble, setNibble] = useState(false);
  const needleRef = useRef(0);
  const timer = useRef<number>();
  const castAt = useRef(0);
  const casts = useRef(0);

  const localBaits = BAITS.filter((b) => itemCount(g, b.id) > 0).map((b) => ({
    id: b.id,
    emoji: ITEMS[b.id].emoji,
    name: ITEMS[b.id].name,
    n: itemCount(g, b.id),
    rare: b.rare,
    superRareMult: b.superRareMult,
    size: b.size,
    desc: b.desc,
  }));
  // bản online: mồi nằm trong rương server
  const onlineBaits = chestSlots
    .filter((s) => s.kind === 'stack' && s.qty > 0 && (s.item_id.startsWith('bait_') || BAITS.some((b) => b.id === s.item_id)))
    .map((s) => {
      const info = itemInfo(s.item_id, 'stack');
      const bDef = BAITS.find((b) => b.id === s.item_id);
      return {
        id: s.item_id,
        emoji: info.emoji,
        name: info.name,
        n: s.qty,
        rare: bDef?.rare ?? 1,
        superRareMult: bDef?.superRareMult ?? 1,
        size: bDef?.size ?? 0,
        desc: bDef?.desc ?? '',
      };
    });
  const baits = online ? onlineBaits : localBaits;

  useEffect(() => {
    if (online) void refreshChest({ quiet: true, skipSync: true });
  }, [online]);

  const difficulty = online ? srv?.difficulty ?? 0.3 : roll ? Math.min(0.95, roll.fish.difficulty + roll.pct * 0.15) : 0.3;
  const zoneW = Math.max(0.07, 0.34 - difficulty * 0.22 + (online ? srv?.zone ?? 0 : rod.zone));
  const needHits = online ? (difficulty >= 0.75 ? 5 : difficulty >= 0.55 ? 4 : 3) : roll && roll.tier >= 2 ? (roll.tier === 3 ? 5 : 4) : 3;
  const slow = online ? srv?.slow || 1 : rod.slow;
  const [zoneX, setZoneX] = useState(0.3);

  const fx = (type: 'cast' | 'nibble' | 'bite' | 'hit' | 'catch' | 'lose' | 'end', emoji?: string) => bus.emit('fishfx', { type, emoji });

  /** báo server lượt câu đã hỏng (lỗi bỏ qua: vd giật sớm hơn wait_ms) */
  const abandon = () => {
    const c = srvRef.current;
    srvRef.current = null;
    if (c) void fishFinish(c.castId, false, { quiet: true });
  };

  const lose = (msg: string) => {
    abandon();
    fx('lose');
    sfx.hurt();
    setLoseMsg(msg);
    setPhase('lose');
  };

  const resetRound = () => {
    setZoneX(0.15 + Math.random() * 0.5);
    setHits(0);
    setMisses(0);
    setResult(null);
    setSrvRes(null);
    setSrvTitles([]);
    setTopOvertake(null);
    castAt.current = Date.now();
    setElapsed(0);
    // lần quăng tiếp theo: đưa phao về lại mặt nước (lần đầu phao đang bay)
    if (casts.current++ > 0) fx('lose');
    sfx.plant();
  };

  const startCastOnline = async (baitId: string | null) => {
    setPhase('cast');
    fx('cast');
    const res = await fishStart(baitId);
    if (!res) {
      setPhase('bait');
      fx('end');
      return;
    }
    const c = { castId: res.cast_id, difficulty: res.difficulty, zone: res.zone, slow: res.slow };
    srvRef.current = c;
    setSrv(c);
    setRoll(null);
    setCast({ rareMult: 1, sizeBonus: 0, waitMs: Math.max(0, res.wait_ms), emptyBite: false, miss: 0 });
    resetRound();
    setPhase('wait');
  };

  const landOnline = async () => {
    const c = srvRef.current;
    if (!c) return;
    srvRef.current = null;
    setPhase('land');
    const res = await fishFinish(c.castId, true);
    if (!res) {
      lose('📡 Máy chủ không phản hồi — con cá đã sổng mất…');
      return;
    }
    if (!res.caught) {
      lose(`💥 ${res.reason || 'Cá đã thoát!'}`);
      return;
    }
    const catchRes = apply((g, now) => recordServerCatch(g, res.fish_id, res.cm, res.points, now)) ?? { titles: [] };
    const titles = catchRes.titles ?? [];
    useGame.getState().saveNow();
    void pushAll();
    setSrvRes(res);
    setSrvTitles(titles);
    if (catchRes.rankOvertake) {
      setTopOvertake(catchRes.rankOvertake);
      const ro = catchRes.rankOvertake;
      useGame.getState().toast(`🎉 BỨT PHÁ TOP ${ro.newRank} BẢNG CÂU CÁ! Nhận danh hiệu « ${ro.title.name} »!`);
    }
    useGame.getState().toast(`🎣 ${res.emoji} ${res.name} ${res.cm}cm (${res.kg}kg) · +${res.points} điểm${res.record ? ' · 🏅 KỶ LỤC MỚI!' : ''}`);
    for (const id of titles) useGame.getState().toast(`🏷️ Danh hiệu mới: ${TITLE_BY_ID[id].name} — chọn hiện trên đầu ở 🎒 Nhân vật`);
    fx('catch', res.emoji);
    sfx.levelUp();
    setPhase('win');
  };

  const startCast = (baitId: string | null) => {
    if (online) {
      if (phase !== 'cast') void startCastOnline(baitId);
      return;
    }
    if (!baitId) return;
    const info = apply((g) => spendBait(g, baitId));
    if (!info) return;
    fx('cast');
    setCast(info);
    setRoll(rollFish({ ...req, rareMult: info.rareMult, sizeBonus: info.sizeBonus, superRareMult: info.superRareMult }));
    resetRound();
    setPhase('wait');
  };

  // chờ cá cắn + phao nhúc nhích giả
  useEffect(() => {
    if (phase !== 'wait' || !cast) return;
    const tick = window.setInterval(() => {
      const e = Date.now() - castAt.current;
      setElapsed(e);
      const nib = Math.random() < 0.12;
      setNibble(nib);
      if (nib) fx('nibble');
    }, 250);
    timer.current = window.setTimeout(() => {
      setNibble(false);
      setPhase('bite');
      fx('bite');
      sfx.hit();
    }, cast.waitMs);
    return () => {
      clearTimeout(timer.current);
      clearInterval(tick);
    };
  }, [phase, cast]);

  // cá cắn — bấm trong ~1 giây
  useEffect(() => {
    if (phase !== 'bite') return;
    timer.current = window.setTimeout(() => lose('🐟 Chậm tay quá, cá nhả mồi chạy mất!'), 1000);
    return () => clearTimeout(timer.current);
  }, [phase]);

  // kim chạy qua lại, cá càng khó/càng to kim càng nhanh
  useEffect(() => {
    if (phase !== 'reel') return;
    let raf = 0;
    const start = performance.now();
    const speed = (0.9 + difficulty * 1.8) * slow;
    const loop = (t: number) => {
      const v = (Math.sin(((t - start) / 1000) * speed * Math.PI) + 1) / 2;
      needleRef.current = v;
      setNeedle(v);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, difficulty, slow]);

  // cất cần giữa chừng → báo server hủy lượt & dọn dẹp cần trên thế giới
  useEffect(() => () => {
    abandon();
    fx('end');
  }, []);

  const press = () => {
    if (phase === 'wait') {
      lose(nibble ? '😅 Phao chỉ nhúc nhích thôi — giật sớm, cá sợ chạy mất!' : '😅 Giật sớm quá, cá chạy mất!');
      return;
    }
    if (phase === 'bite') {
      clearTimeout(timer.current);
      if (cast?.emptyBite) {
        lose('🪱 Cá rỉa sạch mồi rồi chạy mất… (cần xịn ít bị hơn)');
        return;
      }
      setPhase('reel');
      return;
    }
    if (phase !== 'reel' || !cast || (!online && !roll)) return;
    const v = needleRef.current;
    if (v >= zoneX && v <= zoneX + zoneW) {
      sfx.coin();
      fx('hit');
      const h = hits + 1;
      setHits(h);
      setZoneX(0.1 + Math.random() * (0.8 - zoneW));
      if (h >= needHits) {
        if (online) {
          void landOnline();
          return;
        }
        if (!roll) return;

        // Thiết lập chuẩn xác: Đối với Cá Thần Thoại / Siêu Hiếm, tỉ lệ giật được thành công đúng tối đa 10% (0.10)
        const isMythicFish = !!roll.isSuperRare || !!roll.fish.isSuperRare || (roll.fish as any).rarity === 'mythic';
        if (isMythicFish) {
          const mythicCatchChance = 0.10; // Đúng chuẩn 10% theo yêu cầu
          if (Math.random() >= mythicCatchChance) {
            lose(`💥 SẨY CÁ THẦN THOẠI! ${roll.fish.name} (${roll.cm}cm) quẫy cuồng loạn xé toạc mặt nước thoát thân!`);
            return;
          }
        }

        if (Math.random() < lineSnapChance(roll.pct, cast.miss)) {
          lose(`💥 ĐỨT DÂY! Con ${roll.fish.name} ${roll.cm}cm quá khỏe…`);
          return;
        }
        const res = apply((g, now) => catchFish(g, { id: roll.fish.id, cm: roll.cm, pct: roll.pct, zoneId: roll.zoneId, season: roll.season, isSuperRare: roll.isSuperRare }, now));
        if (res) {
          useGame.getState().saveNow();
          void pushAll();
          setResult(res);
          if (res.rankOvertake) {
            setTopOvertake(res.rankOvertake);
            const ro = res.rankOvertake;
            useGame.getState().toast(`🎉 BỨT PHÁ TOP ${ro.newRank} BẢNG CÂU CÁ! Nhận danh hiệu « ${ro.title.name} »!`);
          }
          useGame.getState().toast(res.msg);
          for (const id of res.titles) useGame.getState().toast(`🏷️ Danh hiệu mới: ${TITLE_BY_ID[id].name} — chọn hiện trên đầu ở 🎒 Nhân vật`);
        }
        fx('catch', roll.fish.emoji);
        sfx.levelUp();
        setPhase('win');
      }
    } else {
      sfx.hurt();
      const m = misses + 1;
      setMisses(m);
      if (m >= 3) lose('🎣 Cá vùng vẫy thoát khỏi lưỡi câu!');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        if (phase === 'bait') {
          // Bắt buộc người chơi phải tự chọn mồi câu trước, không tự động quăng
          return;
        } else if (phase === 'win' || phase === 'lose') {
          fx('end');
          setPhase('bait');
        } else if (phase !== 'cast' && phase !== 'land') {
          press();
        }
      }
      if (phase === 'bait') {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= baits.length) {
          e.preventDefault();
          startCast(baits[num - 1].id);
        } else if (e.key === '0' && online) {
          e.preventDefault();
          startCast(null);
        }
      }
      if (e.code === 'Escape') {
        fx('end');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tier = roll ? SIZE_TIERS[roll.tier] : null;
  const zoneInfo = req.zoneId ? ZONE_BY_ID[req.zoneId] ?? FISHING_ZONES[0] : FISHING_ZONES[0];
  const season = getCurrentSeason();

  return (
    <div className="fish-hud">
      <div className="fishing compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 8, marginBottom: 8, fontSize: '0.85rem' }}>
          <span style={{ color: zoneInfo.color, fontWeight: 'bold' }}>
            {zoneInfo.emoji} Vùng {zoneInfo.id}: {zoneInfo.name}
          </span>
          <span style={{ color: season.color, fontWeight: 'bold' }}>
            {season.emoji} {season.name} ({season.timeLeftStr})
          </span>
        </div>
        <div className="fish-head">
          <div style={{ width: 92, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 8, border: `1px solid ${RARITY_COLOR[rod.rarity]}55`, flexShrink: 0 }}>
            <RodVisual rodId={rod.id} rarity={rod.rarity} width={86} height={46} animated={true} />
          </div>
          <div className="grow">
            <b>
              {rod.name} <span style={{ color: RARITY_COLOR[rod.rarity] }}>[{rod.rarity}]</span>
            </b>
            <small>
              {getRareTier(rod.rare)} · Cỡ cá: {getSizeTier(rod.size)} {req.privatePond && '· Hồ riêng'} {req.night && '🌙'} {req.rain && '🌧️'}
              {online && ' · 🌐 máy chủ'}
            </small>
          </div>
          {phase === 'wait' && <span className="fish-timer">⏱ {fmtSec(elapsed)}</span>}
        </div>
        {phase === 'bait' && (
          <div className="bait-select-container">
            <div className="bait-select-banner">
              <span className="bsb-title">🪱 BƯỚC 1: CHỌN MỒI CÂU ĐỂ THẢ CÂU</span>
              <span className="bsb-sub">Bấm chọn mồi hoặc ấn số [1 - {baits.length}] trên bàn phím để gắn mồi & quăng cần</span>
            </div>
            {baits.length === 0 && !online ? (
              <div className="bait-empty-box">
                <p>⚠️ Bạn hiện không còn mồi câu nào!</p>
                <small>Hãy ghé <b>Tiệm Câu Cá Ông Năm</b> cạnh bờ hồ để mua mồi (giun đào, cám thơm, dế cơm, tôm bạc…) hoặc mở tráp mồi bách bảo.</small>
              </div>
            ) : (
              <div className="bait-select-grid">
                {baits.map((b, idx) => (
                  <button
                    key={b.id}
                    className="bait-select-card"
                    onClick={() => startCast(b.id)}
                    title={`Chọn ${b.name} (Phím [${idx + 1}])`}
                  >
                    <div className="bsc-top">
                      <span className="bsc-key">[{idx + 1}]</span>
                      <span className="bsc-qty">Còn: {b.n}</span>
                    </div>
                    <div className="bsc-icon" style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                      <BaitVisual baitId={b.id} size={46} />
                    </div>
                    <div className="bsc-name">{b.name}</div>
                    {b.desc && <div className="bsc-desc">{b.desc}</div>}
                    <div className="bsc-btn">Gắn mồi & Quăng cần 🎣</div>
                  </button>
                ))}
                {online && (
                  <button className="bait-select-card no-bait" onClick={() => startCast(null)} title="Câu không mồi (Phím [0])">
                    <div className="bsc-top">
                      <span className="bsc-key">[0]</span>
                      <span className="bsc-qty">Tự do</span>
                    </div>
                    <div className="bsc-icon">🪝</div>
                    <div className="bsc-name">Câu Không Mồi</div>
                    <div className="bsc-buffs">
                      <span className="bsc-tag normal">Tỉ lệ cơ bản</span>
                    </div>
                    <div className="bsc-desc">Dùng lưỡi câu không mồi, tỉ lệ cắn câu chậm hơn.</div>
                    <div className="bsc-btn">Quăng câu không mồi 🎣</div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {phase === 'cast' && <p className="fishing-tip">🎣 Đang quăng câu…</p>}
        {phase === 'land' && <p className="fishing-tip hot">🐟 Đang kéo cá lên bờ…</p>}
        {phase === 'wait' && (
          <p className="fishing-tip">{nibble ? '👀 Phao nhúc nhích… chưa phải đâu!' : 'Kiên nhẫn chờ cá cắn câu (tối đa 1 phút)…'}</p>
        )}
        {phase === 'bite' && <p className="fishing-tip hot">CÁ CẮN CÂU! BẤM NGAY!</p>}
        {phase === 'reel' && (roll || online) && (
          <>
            <p className="fishing-tip">
              {tier && roll && roll.tier >= 2 ? `${tier.emoji} Cá ${tier.name.toLowerCase()} đang vùng vẫy! ` : ''}Kéo {hits}/{needHits} · trượt {misses}/3
            </p>
            <div className="reel-bar" onPointerDown={press}>
              <div className="reel-zone" style={{ left: `${zoneX * 100}%`, width: `${zoneW * 100}%` }} />
              <div className="reel-needle" style={{ left: `${needle * 100}%` }} />
            </div>
          </>
        )}
        {phase === 'win' && online && srvRes && (
          <div className="fishing-result">
            {topOvertake && (
              <div className="rank-overtake-banner">
                <div className="rob-glow" />
                <div className="rob-header">
                  <span className="rob-sparkle">✨</span>
                  <b className="rob-main-text">🏆 BỨT PHÁ BẢNG CÂU CÁ!</b>
                  <span className="rob-sparkle">✨</span>
                </div>
                <div className="rob-rank-text">
                  🎉 Chúc mừng bạn vừa vươn lên <b>TOP {topOvertake.newRank}</b>!
                </div>
                <div
                  className={`rob-title-badge t-${topOvertake.title.tier}`}
                  style={{ ['--tc' as string]: TIER_COLOR[topOvertake.title.tier] }}
                >
                  {topOvertake.newRank === 1 ? '👑 ' : '« '}{topOvertake.title.name}{topOvertake.newRank === 1 ? ' 👑' : ' »'}
                </div>
                <div className="rob-subnote">
                  {topOvertake.oldRank > 0
                    ? `Đã soán ngôi hạng #${topOvertake.oldRank} & tự động đeo danh hiệu!`
                    : 'Đoạt danh hiệu vinh quang & tự động đeo danh hiệu!'}
                  <div className="rob-warning">⚠️ Danh hiệu luân chuyển theo thời gian thực — sẽ bị lấy đi nếu người khác vượt qua bạn!</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 6px' }}>
              <FishVisual fish={{ id: srvRes.fish_id, name: srvRes.name, rarity: srvRes.rarity as any }} width={150} height={90} animated={true} />
            </div>
            <div className="fish-result-name">
              <span className="fr-title">{srvRes.name}</span>
              <span className="fr-rarity" style={{ color: FISH_RARITY_COLOR[srvRes.rarity], borderColor: `${FISH_RARITY_COLOR[srvRes.rarity]}66` }}>
                {FISH_RARITY_NAME[srvRes.rarity] ?? srvRes.rarity}
              </span>
            </div>
            <div className="fish-result-stats">
              <span>📏 {srvRes.cm} cm</span>
              <span>•</span>
              <span>⚖️ {srvRes.kg} kg</span>
            </div>
            <div className="fish-result-points">
              +{srvRes.points} điểm Top Câu Cá · đã cất vào 🐟 Kho cá
            </div>
            {srvRes.record && <em className="record">🏅 KỶ LỤC MỚI!</em>}
            {srvTitles.map((id) => (
              <em key={id} className="record" style={{ color: TIER_COLOR[TITLE_BY_ID[id].tier] }}>
                🏷️ Danh hiệu mới: {TITLE_BY_ID[id].name}
              </em>
            ))}
          </div>
        )}
        {phase === 'win' && !online && roll && tier && (
          <div className="fishing-result">
            {topOvertake && (
              <div className="rank-overtake-banner">
                <div className="rob-glow" />
                <div className="rob-header">
                  <span className="rob-sparkle">✨</span>
                  <b className="rob-main-text">🏆 BỨT PHÁ BẢNG CÂU CÁ!</b>
                  <span className="rob-sparkle">✨</span>
                </div>
                <div className="rob-rank-text">
                  🎉 Chúc mừng bạn vừa vươn lên <b>TOP {topOvertake.newRank}</b>!
                </div>
                <div
                  className={`rob-title-badge t-${topOvertake.title.tier}`}
                  style={{ ['--tc' as string]: TIER_COLOR[topOvertake.title.tier] }}
                >
                  {topOvertake.newRank === 1 ? '👑 ' : '« '}{topOvertake.title.name}{topOvertake.newRank === 1 ? ' 👑' : ' »'}
                </div>
                <div className="rob-subnote">
                  {topOvertake.oldRank > 0
                    ? `Đã soán ngôi hạng #${topOvertake.oldRank} & tự động đeo danh hiệu!`
                    : 'Đoạt danh hiệu vinh quang & tự động đeo danh hiệu!'}
                  <div className="rob-warning">⚠️ Danh hiệu luân chuyển theo thời gian thực — sẽ bị lấy đi nếu người khác vượt qua bạn!</div>
                </div>
              </div>
            )}
            {roll.isSuperRare && (
              <div style={{ background: 'linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6)', padding: '6px 12px', borderRadius: 8, color: '#fff', textAlign: 'center', fontWeight: 'bold', margin: '2px 0 8px', textShadow: '0 0 10px rgba(0,0,0,0.8)', width: '100%' }}>
                🌟 CÁ CỰC HIẾM THẦN THOẠI! 🌟
                <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Thưởng nóng: +💎50 Kim Cương!</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 6px' }}>
              <FishVisual fish={roll.fish} width={150} height={90} animated={true} />
            </div>
            <div className="fish-result-name">
              <span className="fr-title">{roll.fish.name}</span>
              <span className="fr-rarity" style={{ color: roll.fish.rare ? '#a855f7' : '#94a3b8', borderColor: roll.fish.rare ? '#a855f766' : '#94a3b866' }}>
                {tier.emoji} {tier.name}
              </span>
            </div>
            <div className="fish-result-stats">
              <span>📏 {roll.cm} cm</span>
              <span>•</span>
              <span>⚖️ {fishKg(roll.cm)} kg</span>
              <span>•</span>
              <span>{zoneInfo.name}</span>
            </div>
            {result && (
              <div className="fish-result-points">
                +{result.points} điểm Top Câu Cá{result.bonus ? ` · +🪙${result.bonus}` : ''} · đã cất vào 🐟 Kho cá
              </div>
            )}
            {result?.record && <em className="record">🏅 KỶ LỤC MỚI!</em>}
            {result?.titles.map((id) => (
              <em key={id} className="record" style={{ color: TIER_COLOR[TITLE_BY_ID[id].tier] }}>
                🏷️ Danh hiệu mới: {TITLE_BY_ID[id].name}
              </em>
            ))}
          </div>
        )}
        {phase === 'lose' && <p className="fishing-result lose">{loseMsg}</p>}

        <div className="dialog-actions center">
          {phase === 'win' || phase === 'lose' ? (
            <>
              <button className="btn" onClick={() => { fx('end'); setPhase('bait'); }}>
                🎣 Câu tiếp
              </button>
              <button className="btn outline" onClick={() => { fx('end'); onClose(); bus.emit('panel', 'fishing'); }}>
                🐟 Kho Cá
              </button>
            </>
          ) : phase !== 'bait' ? (
            <button className="btn gold big-btn" disabled={phase === 'cast' || phase === 'land'} onClick={press}>
              {phase === 'wait' ? '…' : phase === 'bite' ? '❗ Giật cần!' : phase === 'cast' || phase === 'land' ? '⏳' : '🎣 Kéo!'}
            </button>
          ) : null}
          <button className="btn ghost" onClick={() => { fx('end'); onClose(); }}>
            Cất cần
          </button>
        </div>
      </div>
    </div>
  );
}
