import { useState } from 'react';
import { CROPS, CROP_BY_ID } from '../game/config/farm';
import { RANKS, rankIndex } from '../game/config/guild';
import { itemCount } from '../game/logic/core';
import {
  buyFarmSupply,
  fertilizeAllPlots,
  growMs,
  harvestAll,
  plantAll,
  plotCareStep,
  waterAllPlots,
  weedAllPlots,
} from '../game/logic/farm';
import { sellPrice } from '../game/logic/market';
import type { FertilizerKind } from '../game/types';
import { dayKey, fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';
import { bus } from '../world/bus';
import { Modal } from './common';

export function SeedPicker({
  plotIndex,
  onPick,
  onClose,
}: {
  plotIndex: number;
  onPick: (cropId: string, fert?: FertilizerKind) => void;
  onClose: () => void;
}) {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);
  const rank = rankIndex(g.guildXp);
  const day = dayKey(now);
  const [tab, setTab] = useState<'fruit' | 'veg'>('fruit');
  const [fert, setFert] = useState<FertilizerKind | undefined>(() =>
    itemCount(g, 'fert_basic') > 0 ? 'basic' : undefined,
  );

  const emptyCount = g.plots.filter((p) => !p.cropId).length;
  const needWater = g.plots.filter((p) => p.cropId && plotCareStep(p, now) === 'water').length;
  const needFert = g.plots.filter((p) => p.cropId && plotCareStep(p, now) === 'fertilize').length;
  const needWeed = g.plots.filter((p) => p.cropId && plotCareStep(p, now) === 'weed').length;
  const readyCount = g.plots.filter((p) => p.cropId && plotCareStep(p, now) === 'ready').length;
  const curPlot = g.plots[plotIndex];
  const curCrop = curPlot?.cropId ? CROP_BY_ID[curPlot.cropId] : null;

  const fertBag = {
    basic: itemCount(g, 'fert_basic'),
    super: itemCount(g, 'fert_super'),
    gold: itemCount(g, 'fert_gold'),
    pesticide: itemCount(g, 'pesticide'),
  };

  const list = CROPS.filter((c) => (tab === 'fruit' ? c.category === 'fruit' : c.category !== 'fruit'));

  return (
    <Modal title="🌾 Quản Lý Canh Tác & Chọn Giống Cây Trồng" onClose={onClose}>
      <div className="farm-care-panel">
        <div className="row between">
          <b>📋 Quy trình canh tác: 🌱 Gieo → 💧 Tưới → 🌿 Bón phân → 🐛 Bắt sâu → 🧺 Thu hoạch</b>
          <span className="tag">🪙 {fmt(g.gold)}</span>
        </div>
        <div className="farm-supply-bar">
          <span>🌿 Phân hữu cơ: <b>{fertBag.basic}</b></span>
          <span>⚡ Phân siêu tốc: <b>{fertBag.super}</b></span>
          <span>🌟 Phân hoàng kim: <b>{fertBag.gold}</b></span>
          <span>🧴 Thuốc trừ sâu: <b>{fertBag.pesticide}</b></span>
          <button
            className="btn sm ghost"
            onClick={() => act((g) => buyFarmSupply(g, 'fert_basic', 5))}
            disabled={g.gold < 60}
          >
            +5 🌿 (🪙60)
          </button>
          <button
            className="btn sm ghost"
            onClick={() => act((g) => buyFarmSupply(g, 'pesticide', 3))}
            disabled={g.gold < 54}
          >
            +3 🧴 (🪙54)
          </button>
        </div>

        <div className="farm-quick-actions">
          <button
            className="btn sm"
            disabled={needWater === 0}
            onClick={() => {
              if (act((g, now) => waterAllPlots(g, now))) bus.emit('planted', plotIndex);
            }}
          >
            💧 Tưới tất cả ({needWater})
          </button>
          <button
            className="btn sm"
            disabled={needFert === 0}
            onClick={() => {
              if (act((g, now) => fertilizeAllPlots(g, fert ?? 'basic', now))) bus.emit('planted', plotIndex);
            }}
          >
            🌿 Bón phân tất cả ({needFert})
          </button>
          <button
            className="btn sm"
            disabled={needWeed === 0}
            onClick={() => {
              if (act((g, now) => weedAllPlots(g, now))) bus.emit('planted', plotIndex);
            }}
          >
            🐛 Bắt sâu / Nhổ cỏ ({needWeed})
          </button>
          <button
            className="btn sm gold"
            disabled={readyCount === 0}
            onClick={() => {
              if (act((g, now) => harvestAll(g, now))) bus.emit('planted', plotIndex);
            }}
          >
            🧺 Thu hoạch chín ({readyCount})
          </button>
        </div>

        {curCrop && (
          <div className="farm-plot-status">
            <span>
              Ô #{plotIndex + 1}: <b>{curCrop.emoji} {curCrop.name}</b>
            </span>
            <span>{curPlot.watered ? '✅ Đã tưới' : '💧 Chưa tưới'}</span>
            <span>{curPlot.fertilized ? `✅ Đã bón (${curPlot.fertilizer ?? 'basic'})` : '🌿 Chưa bón phân'}</span>
            <span>{curPlot.weeded && !curPlot.pest ? '✅ Sạch sâu cỏ' : '🐛 Cần làm cỏ/bắt sâu'}</span>
          </div>
        )}
      </div>

      <div className="farm-fert-selector">
        <span className="small">🌱 Bón lót khi gieo:</span>
        {(
          [
            [undefined, 'Không bón sẵn'],
            ['basic', `🌿 Hữu cơ (${fertBag.basic})`],
            ['super', `⚡ Siêu tốc (${fertBag.super})`],
            ['gold', `🌟 Hoàng kim (${fertBag.gold})`],
          ] as [FertilizerKind | undefined, string][]
        ).map(([k, label]) => (
          <button
            key={k ?? 'none'}
            className={`chip-btn ${fert === k ? 'on' : ''}`}
            onClick={() => setFert(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'fruit' ? 'on' : ''}`} onClick={() => setTab('fruit')}>
          🍎 Hoa Quả Thật (10 loại)
        </button>
        <button className={`tab-btn ${tab === 'veg' ? 'on' : ''}`} onClick={() => setTab('veg')}>
          🌾 Rau Củ & Nông Sản
        </button>
      </div>

      <div className="list">
        {list.map((c) => {
          const locked = rank < c.rankReq;
          const rare = c.seedCost === null;
          const seeds = itemCount(g, `seed_${c.id}`);
          const canPlant = !locked && (seeds > 0 || (!rare && g.gold >= c.seedCost!));
          return (
            <div key={c.id} className={`seed-row ${!canPlant ? 'locked' : ''}`}>
              <span className="big-emoji">{c.emoji}</span>
              <div className="grow">
                <div className="row">
                  <b>{c.name}</b>
                  {c.category === 'fruit' && <span className="tag sm ok">Hoa quả thật</span>}
                  {seeds > 0 && <span className="tag sm">🌰 Có {seeds} hạt</span>}
                </div>
                {c.desc && <div className="small next">{c.desc}</div>}
                <div className="small muted">
                  ⏱ {fmtTime(growMs(g, c))} · thu {c.yield} trái · giá chợ ~🪙{fmt(sellPrice(c.id, day))}/trái
                </div>
              </div>
              <div className="shop-buy">
                {locked ? (
                  <span className="seed-cost">🔒 Rank {RANKS[c.rankReq].name}</span>
                ) : (
                  <>
                    <button
                      className="btn sm gold"
                      disabled={!canPlant || !!curPlot?.cropId}
                      onClick={() => onPick(c.id, fert)}
                    >
                      {seeds > 0 ? '🌱 Gieo (túi)' : rare ? 'Hết hạt' : `🌱 🪙${c.seedCost}`}
                    </button>
                    {emptyCount > 1 && (
                      <button
                        className="btn sm"
                        disabled={!canPlant}
                        onClick={() => {
                          if (act((g, now) => plantAll(g, c.id, now, fert))) {
                            bus.emit('planted', plotIndex);
                            onClose();
                          }
                        }}
                      >
                        Gieo hết ({emptyCount})
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
