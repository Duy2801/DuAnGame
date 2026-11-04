import { useEffect } from 'react';
import { SEASONS } from '../game/config/seasons';
import { sellAllUnlockedFish, sellFish, syncFishBag, toggleLockFish } from '../game/logic/life';
import { useGame } from '../store';
import { pushAll } from '../services/online';
import { removeFishFromChestIfPresent, refreshChest } from '../services/fishingApi';
import type { CaughtFish } from '../game/types';
import { FishVisual } from '../art/fishArt';

export function FishBagView() {
  const g = useGame((s) => s.game);
  const act = useGame((s) => s.act);

  useEffect(() => {
    act((g) => {
      syncFishBag(g);
    });
  }, [act]);

  const fishList: CaughtFish[] = g.fishing?.fishBag ?? [];
  const totalCount = fishList.length;

  // Sắp xếp mặc định theo cá giá trị cao -> thấp (mới câu lên trước nếu bằng giá)
  const sorted = [...fishList].sort((a, b) => {
    const priceA = (a.priceGems ?? 0) * 1000 + a.priceGold;
    const priceB = (b.priceGems ?? 0) * 1000 + b.priceGold;
    if (priceB !== priceA) return priceB - priceA;
    return b.caughtAt - a.caughtAt;
  });

  // Tính tổng giá trị cá chưa khóa
  const unlockedFish = fishList.filter((f) => !f.locked);
  const totalGoldUnlocked = unlockedFish.reduce((sum, f) => sum + (f.priceGems && f.priceGems > 0 ? 0 : f.priceGold), 0);
  const totalGemsUnlocked = unlockedFish.reduce((sum, f) => sum + (f.priceGems ?? 0), 0);

  const handleSell = (f: CaughtFish) => {
    const fishId = f.id;
    act((g) => {
      const res = sellFish(g, f.uuid);
      useGame.getState().toast(res.msg, 'ok');
    });
    useGame.getState().saveNow();
    void pushAll();
    void removeFishFromChestIfPresent(fishId, 1);
  };

  const handleSellAllCommon = () => {
    act((g) => {
      const res = sellAllUnlockedFish(g, true);
      useGame.getState().toast(res.msg, 'ok');
    });
    useGame.getState().saveNow();
    void pushAll();
    void refreshChest({ quiet: true, skipSync: true });
  };

  const handleSellAllUnlocked = () => {
    act((g) => {
      const res = sellAllUnlockedFish(g, false);
      useGame.getState().toast(res.msg, 'ok');
    });
    useGame.getState().saveNow();
    void pushAll();
    void refreshChest({ quiet: true, skipSync: true });
  };

  const handleToggleLock = (f: CaughtFish) => {
    act((g) => {
      const locked = toggleLockFish(g, f.uuid);
      useGame.getState().toast(locked ? `🔒 Đã khóa ${f.name}` : `🔓 Đã mở khóa ${f.name}`);
    });
    useGame.getState().saveNow();
    void pushAll();
  };

  return (
    <div className="fish-bag-container" style={{ padding: '6px 4px', color: '#f3f4f6' }}>
      {/* Thanh Bán Cá Nhanh gọn gàng */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2d1b0e, #3e2512)',
          border: '2px solid #8b5a2b',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 14,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fef3c7' }}>
            🐟 Kho Cá: <span style={{ color: '#fbbf24' }}>{totalCount}/200</span>
          </div>
          {unlockedFish.length > 0 && (
            <div style={{ fontSize: '0.88rem', color: '#fde68a', background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: 8 }}>
              Ước tính bán ({unlockedFish.length} con):{' '}
              <b style={{ color: '#fbbf24' }}>🪙 {totalGoldUnlocked.toLocaleString()} Vàng</b>
              {totalGemsUnlocked > 0 && (
                <b style={{ color: '#60a5fa', marginLeft: 8 }}>+ 💎 {totalGemsUnlocked.toLocaleString()} KC</b>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn small"
            onClick={handleSellAllCommon}
            disabled={unlockedFish.length === 0}
            title="Bán nhanh toàn bộ cá thường chưa khóa"
            style={{
              background: unlockedFish.length === 0 ? '#4b5563' : '#059669',
              borderColor: '#10b981',
              fontWeight: 700,
              padding: '7px 14px',
            }}
          >
            🪙 Bán Nhanh Cá Thường
          </button>
          <button
            className="btn small gold"
            onClick={handleSellAllUnlocked}
            disabled={unlockedFish.length === 0}
            title="Bán tất cả cá chưa khóa trong kho"
            style={{
              fontWeight: 800,
              padding: '7px 14px',
            }}
          >
            💰 Bán Tất Cả ({unlockedFish.length})
          </button>
        </div>
      </div>

      {/* Danh sách cá trong túi */}
      {sorted.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: 'rgba(30, 41, 59, 0.75)',
            borderRadius: 12,
            border: '1px dashed rgba(255,255,255,0.18)',
            color: '#cbd5e1',
          }}
        >
          <span style={{ fontSize: '2.8rem', display: 'block', marginBottom: 8 }}>🐟</span>
          <b style={{ fontSize: '1.05rem', color: '#fef3c7' }}>Kho cá của bạn đang trống</b>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
            Hãy ra bờ hồ hoặc biển câu cá rồi mang về đây bán lấy Vàng & Kim Cương!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 10,
            maxHeight: '58vh',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {sorted.map((f) => {
            const seasonDef = SEASONS[f.season];
            return (
              <div
                key={f.uuid}
                className="fish-bag-card"
                style={{
                  background: f.isSuperRare
                    ? 'linear-gradient(135deg, rgba(88,28,135,0.85), rgba(180,83,9,0.75))'
                    : '#1e293b',
                  border: f.isSuperRare
                    ? '2px solid #fbbf24'
                    : f.locked
                    ? '1.5px solid #ef4444'
                    : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                {/* Nút Khóa góc trên */}
                <button
                  onClick={() => handleToggleLock(f)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    zIndex: 2,
                    padding: '4px 6px',
                  }}
                  title={f.locked ? 'Đang khóa — Bấm để mở khóa' : 'Bấm để khóa tránh bán nhầm'}
                >
                  {f.locked ? '🔒' : '🔓'}
                </button>

                <div>
                  <div className={`fish-card-art-box ${f.isSuperRare ? 'mythic' : f.rarity ?? 'common'}`}>
                    <FishVisual fish={f} width={130} height={75} animated={true} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.15rem' }}>{f.emoji}</span>
                    <div>
                      <b style={{ color: f.isSuperRare ? '#fbbf24' : '#f3f4f6', fontSize: '0.95rem' }}>
                        {f.name}
                      </b>
                      {f.isSuperRare && (
                        <div style={{ color: '#f472b6', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          ⭐ THẦN THOẠI
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.45' }}>
                    <div>
                      📏 <b>{f.cm} cm</b> ({f.kg} kg) · <b>{f.tierName}</b>
                    </div>
                    {seasonDef && (
                      <div style={{ color: '#94a3b8' }}>
                        📍 {f.zoneName} · <span style={{ color: seasonDef.color }}>{seasonDef.emoji} {seasonDef.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Giá bán và nút bán ngay */}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {f.priceGems && f.priceGems > 0 ? (
                      <span style={{ color: '#60a5fa' }}>💎 {f.priceGems} KC</span>
                    ) : (
                      <span style={{ color: '#fbbf24' }}>🪙 {f.priceGold.toLocaleString()} Vàng</span>
                    )}
                  </span>

                  <button
                    className="btn small"
                    disabled={f.locked}
                    onClick={() => handleSell(f)}
                    style={{
                      background: f.locked ? '#4b5563' : '#d97706',
                      borderColor: f.locked ? '#6b7280' : '#fbbf24',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      padding: '4px 12px',
                    }}
                  >
                    {f.locked ? 'Đã Khóa' : '💰 Bán'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
