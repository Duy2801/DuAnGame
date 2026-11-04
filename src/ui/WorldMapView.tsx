import { useState } from 'react';
import { ZONE_DEFS, zoneLevel } from '../game/config/zones';
import { getCurrentSeason } from '../game/config/seasons';
import { useGame } from '../store';
import { bus, worldInfo } from '../world/bus';
import { MAPS, WAYPOINTS, isMapOpen, waypointAt, zoneMapId, type MapId, type Waypoint } from '../world/map';

interface FishingMapMeta {
  id: MapId;
  orientationTag: string;
  zones: string;
  bossFish: string;
  bgGradient: string;
}

const FISHING_MAPS_META: FishingMapMeta[] = [
  {
    id: 'lake',
    orientationTag: '🌿 Map Tự Nhiên Cân Bằng (52x42)',
    zones: 'Vùng 1: Bờ Sông Quê · Vùng 2: Đầm Sen Trăng · Vùng 3: Vực Thẳm Hồ',
    bossFish: '🌸 Linh Hồn Sen Vàng & Kim Giáp Long Điệp (Cực Phẩm)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.35))',
  },
  {
    id: 'deepsea',
    orientationTag: '🗺️ Map Chiều Ngang Rộng Lớn (58x36)',
    zones: 'Vùng 4: Vịnh San Hô Cát Vàng · Vùng 5: Vực Biển Hải Tặc Leviathan',
    bossFish: '🌊 Thủy Quái Leviathan & Hải Hoàng Kỳ Lân (Chúa Tể)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(30, 58, 138, 0.4))',
  },
  {
    id: 'glacier',
    orientationTag: '🧭 Map Chiều Dọc Hẻm Băng Sâu (38x54)',
    zones: 'Vùng 6: Đầm Băng Cực Bắc & Vực Băng Vĩnh Cửu Ngàn Năm',
    bossFish: '❄️ Băng Long Thần Ngư Thượng Cổ (Huyền Thoại)',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0.5))',
  },
  {
    id: 'windhill',
    orientationTag: '🪁 Map Thảo Nguyên Lộng Gió (48x36)',
    zones: 'Đỉnh Đồi Thả Diều · Tiệm Diều · Cối Xay Gió Khổng Lồ',
    bossFish: '🦅 Thả diều trên mây & Ngắm hoa dại rực rỡ',
    bgGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(161, 98, 7, 0.35))',
  },
];

const TOWN_MAP_IDS: MapId[] = ['town', 'farm', 'adventure'];

/** Bản đồ thế giới: xem bản đồ đang đứng + chọn khu muốn tới (dịch chuyển trực tiếp) */
export function WorldMapView({ onClose }: { onClose: () => void }) {
  const g = useGame((s) => s.game);
  const [hover, setHover] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(false);

  const here = MAPS[worldInfo.map] ?? MAPS.town;
  const W = worldInfo.mapW;
  const H = worldInfo.mapH;
  const pct = (v: number, max: number) => `${(v / max) * 100}%`;
  const currentSeason = getCurrentSeason();

  const stonesOf = (m: MapId) => WAYPOINTS.filter((w) => w.m === m);
  const unlocked = (w: Waypoint) => isMapOpen(w.m) && (!!w.town || g.waypoints.includes(w.id));

  const go = (w: Waypoint) => {
    if (!isMapOpen(w.m)) return;
    const [x, y] = waypointAt(w);
    onClose();
    bus.emit('teleport', { map: w.m, x, y });
  };

  const getOrientationLabel = (mId: string) => {
    if (mId === 'deepsea') return '🗺️ Bản đồ Ngang (58×36)';
    if (mId === 'glacier') return '🧭 Bản đồ Dọc (38×54)';
    if (mId === 'lake') return '🌿 Bản đồ Cân Bằng (52×42)';
    if (mId === 'windhill') return '🪁 Bản đồ Đồi Thảo Nguyên (48×36)';
    return '🏘️ Khu Vực Đô Thị';
  };

  return (
    <div className="wm">
      {/* ---------------- 1. BẢN ĐỒ KHU VỰC ĐANG ĐỨNG (MINIMAP) */}
      <section className="wm-here">
        <div className="wm-here-head">
          <span className="wm-here-icon">{here.icon}</span>
          <div className="wm-here-details">
            <small>Vị trí hiện tại của bạn</small>
            <b>{here.name}</b>
            <div className="wm-here-tag-badge">{getOrientationLabel(here.id)}</div>
            <div className="wm-here-season">
              {currentSeason.emoji} <span>{currentSeason.name}</span> · {currentSeason.desc}
            </div>
          </div>
        </div>

        <div className="world-map" style={{ aspectRatio: `${W} / ${H}` }}>
          {worldInfo.minimap ? (
            <img src={worldInfo.minimap} alt="Bản đồ chi tiết" />
          ) : (
            <div className="wm-empty">Đang tải bản đồ...</div>
          )}

          {stonesOf(here.id).map((w) => {
            const [x, y] = waypointAt(w);
            const ok = unlocked(w);
            return (
              <button
                key={w.id}
                className={`map-wp ${ok ? '' : 'locked'}`}
                style={{ left: pct(x, W), top: pct(y, H) }}
                disabled={!ok}
                onClick={() => go(w)}
                onPointerEnter={() => setHover(w.name)}
                onPointerLeave={() => setHover(null)}
                title={w.name}
              >
                🔮
              </button>
            );
          })}
          <span
            className="map-player"
            style={{ left: pct(worldInfo.px, W), top: pct(worldInfo.py, H) }}
            title="Vị trí của bạn"
          />
        </div>

        <p className="small center map-hover">
          {hover ?? '💡 Đi tới cổng ở mép bản đồ (có bảng tên) để sang khu kế bên, hoặc bấm 🔮 để dịch chuyển.'}
        </p>
      </section>

      {/* ---------------- 2. THIÊN ĐƯỜNG CÂU CÁ & NGOẠI CẢNH DÃ NGOẠI */}
      <section className="wm-section-box">
        <div className="wm-section-header">
          <h4 className="wm-title">🎣 Thiên Đường Câu Cá & Khám Phá Thiên Nhiên</h4>
          <span className="wm-section-subtitle">Địa hình chân thật uốn lượn tự nhiên · Map Dọc & Ngang đa dạng · Cá Thần Thoại Vô Giá</span>
        </div>

        <div className="wm-fishing-grid">
          {FISHING_MAPS_META.map((meta) => {
            const m = MAPS[meta.id];
            if (!m) return null;
            const isHere = m.id === here.id;
            const stones = stonesOf(m.id);
            const mainWp = stones[0];

            return (
              <div
                key={m.id}
                className={`wm-fish-card ${isHere ? 'here' : ''}`}
                style={{ background: meta.bgGradient }}
              >
                <div className="wm-fish-head">
                  <span className="wm-fish-icon">{m.icon}</span>
                  <div>
                    <div className="wm-fish-name-row">
                      <b className="wm-fish-name">{m.name}</b>
                      {isHere && <span className="wm-badge-here">📍 Đang ở đây</span>}
                    </div>
                    <span className="wm-fish-orient">{meta.orientationTag}</span>
                  </div>
                </div>

                <div className="wm-fish-body">
                  <div className="wm-fish-row">
                    <span className="wm-fish-label">📍 Vùng câu:</span>
                    <span className="wm-fish-val">{meta.zones}</span>
                  </div>
                  <div className="wm-fish-row">
                    <span className="wm-fish-label">👑 Thần thoại:</span>
                    <span className="wm-fish-val highlight">{meta.bossFish}</span>
                  </div>
                </div>

                <div className="wm-fish-foot">
                  {isHere ? (
                    <button className="wm-btn-teleport current" disabled>
                      📍 Bạn đang đứng tại đây
                    </button>
                  ) : (
                    <button
                      className="wm-btn-teleport"
                      onClick={() => mainWp && go(mainWp)}
                      title={`Dịch chuyển tức thời tới ${m.name}`}
                    >
                      🔮 Dịch Chuyển Tới Đây
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- 3. KHU VỰC ĐÔ THỊ & SINH HOẠT */}
      <section className="wm-section-box">
        <div className="wm-section-header">
          <h4 className="wm-title">🏘️ Khu Vực Đô Thị & Sinh Hoạt</h4>
          <span className="wm-section-subtitle">Khu phố sầm uất · Nông trại gia trang · Hội mạo hiểm rèn đúc</span>
        </div>

        <div className="wm-towns-grid">
          {TOWN_MAP_IDS.map((id) => {
            const m = MAPS[id];
            if (!m) return null;
            const isHere = m.id === here.id;
            const stones = stonesOf(m.id);
            const mainWp = stones[0];

            return (
              <div key={m.id} className={`wm-town-card ${isHere ? 'here' : ''}`}>
                <div className="wm-town-card-main">
                  <span className="wm-town-icon">{m.icon}</span>
                  <div className="wm-town-card-info">
                    <b>{m.name}</b>
                    <small>{m.sub}</small>
                  </div>
                </div>

                <div className="wm-town-card-actions">
                  {isHere ? (
                    <span className="wm-badge-here">📍 Đang ở đây</span>
                  ) : (
                    <button
                      className="wm-btn-teleport mini"
                      onClick={() => mainWp && go(mainWp)}
                    >
                      🔮 Dịch chuyển
                    </button>
                  )}
                </div>

                {stones.length > 1 && (
                  <div className="wm-stones">
                    {stones.map((w) => (
                      <button
                        key={w.id}
                        className="chip"
                        onClick={() => go(w)}
                        title={`Tới ${w.name}`}
                      >
                        🔮 {w.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- 4. 20 VÙNG QUÁI VIỄN CHINH */}
      <section className="wm-section-box collapsible">
        <button
          className="wm-collapse-toggle"
          onClick={() => setShowZones(!showZones)}
        >
          <span>⚔️ Vùng Quái Viễn Chinh ({ZONE_DEFS.length} Vùng)</span>
          <span>{showZones ? '▲ Thu gọn' : '▼ Mở rộng danh sách'}</span>
        </button>

        {showZones && (
          <div className="wm-zones-wrapper">
            <div className="wm-zones">
              {ZONE_DEFS.map((z) => {
                const w = WAYPOINTS.find((x) => x.id === `camp_${z.id}`)!;
                const zid = zoneMapId(z.id);
                const mapOpen = isMapOpen(zid);
                const ok = mapOpen && unlocked(w);
                const reached = z.id <= Math.max(1, g.maxZone + 1);
                const isHere = zid === here.id;
                return (
                  <button
                    key={z.id}
                    className={`wm-zone ${!mapOpen ? 'locked' : ok ? 'open' : reached ? 'walk' : 'fog'} ${
                      z.boss ? 'boss' : ''
                    } ${isHere ? 'here' : ''}`}
                    disabled={!ok}
                    onClick={() => go(w)}
                    title={
                      !mapOpen
                        ? '🚧 Khu vực đang bảo trì'
                        : ok
                        ? `Dịch chuyển tới cửa vùng ${z.id}`
                        : reached
                        ? 'Đi ngang 🔮 đá dịch chuyển ở cửa vùng để kích hoạt'
                        : 'Chưa khám phá'
                    }
                  >
                    <span className="wm-zn">{z.id}</span>
                    {z.boss && <i className="wm-crown">👑</i>}
                    <b>{reached ? z.name : '???'}</b>
                    <small>Lv {zoneLevel(z.id)}+</small>
                    <em>
                      {isHere
                        ? '📍 Đang ở đây'
                        : !mapOpen
                        ? '🔒'
                        : ok
                        ? '🔮 Tới'
                        : reached
                        ? '🚶 Bộ'
                        : '🔒'}
                    </em>
                  </button>
                );
              })}
            </div>
            <p className="small muted center">
              Vùng 1 nối với cổng phía đông Khu Mạo Hiểm Giả. Đi ngang 🔮 đá ở cửa mỗi vùng để kích hoạt dịch chuyển nhanh.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
