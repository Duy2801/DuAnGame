import React, { useId } from 'react';
import { ROD_STYLE, type RodShape } from './rodArt';
import type { RodRarity } from '../game/config/shops';

export interface RodVisualProps {
  rodId: string;
  rarity?: RodRarity;
  width?: number;
  height?: number;
  animated?: boolean;
}

/**
 * Component vẽ minh họa mỹ thuật chi tiết cao cho từng loại Cần Câu (50 cần - 12 nhóm hình thái độc bản)
 * Mỗi cần có cấu trúc thân, chuôi, máy câu, ngọn cần, phao/lưỡi câu và hiệu ứng hạt hoàn toàn khác nhau.
 */
export const RodVisual: React.FC<RodVisualProps> = ({
  rodId,
  rarity = 'N',
  width = 140,
  height = 76,
  animated = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const st = ROD_STYLE[rodId] ?? ROD_STYLE.rod_bamboo;
  const shape: RodShape = st.shape;
  const c0 = st.shaft[0];
  const c1 = st.shaft[1];
  const handleCol = st.handle;
  const accentCol = st.handleAccent ?? '#fbbf24';
  const guardCol = st.guardColor ?? accentCol;
  const reelCol = st.reel ?? '#cbd5e1';
  const tipCol = st.tipColor ?? c0;

  const isHighTier = rarity === 'SSR' || rarity === 'UR' || rarity === 'MYTHIC';
  const isMythic = rarity === 'MYTHIC';
  const isUR = rarity === 'UR';

  return (
    <svg
      viewBox="0 0 160 88"
      width={width}
      height={height}
      style={{ overflow: 'visible', display: 'block', userSelect: 'none' }}
    >
      <defs>
        <linearGradient id={`shaft_${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c0} />
          <stop offset="100%" stopColor={tipCol} />
        </linearGradient>

        <linearGradient id={`gold_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id={`rainbow_${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="20%" stopColor="#f59e0b" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="80%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        <radialGradient id={`aura_${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tipCol} stopOpacity={isMythic ? '0.55' : isUR ? '0.42' : isHighTier ? '0.3' : '0.15'} />
          <stop offset="65%" stopColor={c0} stopOpacity="0.08" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </radialGradient>

        <filter id={`glow_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={isMythic ? '3.2' : isUR ? '2.4' : '1.5'} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. HÀO QUANG NỀN THEO CẤP ĐỘ */}
      <ellipse cx="82" cy="44" rx={isMythic ? 72 : 60} ry={isMythic ? 36 : 28} fill={`url(#aura_${uid})`} />

      {/* 2. VÒNG TRÒN PHÁP TRẬN / HÀO QUANG NỀN CHO UR & MYTHIC */}
      {isMythic && (
        <g opacity="0.55">
          <circle
            cx="118"
            cy="24"
            r="22"
            fill="none"
            stroke={tipCol}
            strokeWidth="1"
            strokeDasharray="4 3"
          >
            {animated && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 118 24"
                to="360 118 24"
                dur="8s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle
            cx="118"
            cy="24"
            r="16"
            fill="none"
            stroke={accentCol}
            strokeWidth="0.8"
            strokeDasharray="2 4"
          >
            {animated && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 118 24"
                to="0 118 24"
                dur="6s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      )}

      {/* =====================================================================
          3. HÌNH THÁI ĐỘC BẢN CỦA TỪNG DẠNG CẦN CÂU
         ===================================================================== */}

      {/* --- NHÓM A: CẦN TRE / TRÚC / LIỄU / THÔNG TỰ NHIÊN --- */}
      {(shape === 'bamboo' || shape === 'reed' || shape === 'curved_willow' || shape === 'branch') && (
        <g>
          {/* Tay cầm quấn dây mây mộc */}
          <path d="M 16,74 L 38,58" stroke={handleCol} strokeWidth="6" strokeLinecap="round" />
          <path d="M 18,72 L 36,59" stroke={accentCol} strokeWidth="5" strokeLinecap="butt" strokeDasharray="2 3" />
          {/* Thân cần uốn cong tự nhiên */}
          <path
            d={shape === 'curved_willow' ? 'M 38,58 Q 76,20 132,22' : 'M 38,58 Q 80,28 134,16'}
            fill="none"
            stroke={`url(#shaft_${uid})`}
            strokeWidth={shape === 'reed' ? '3' : '4.2'}
            strokeLinecap="round"
          />
          {/* Các mắt đốt tre gồ lên */}
          {shape !== 'branch' && (
            <g stroke={st.nodes ?? '#3f6212'} strokeWidth="2.4" strokeLinecap="round">
              <line x1="56" y1="43" x2="60" y2="48" />
              <line x1="80" y1="30" x2="83" y2="35" />
              <line x1="106" y1="20" x2="108" y2="25" />
            </g>
          )}
          {/* Chồi lá tre / lá liễu / cành thông */}
          {shape === 'bamboo' && (
            <g fill="#65a30d">
              <path d="M 58,44 Q 50,34 42,36 Q 50,42 58,44 Z" />
              <path d="M 82,31 Q 76,20 68,21 Q 75,28 82,31 Z" />
            </g>
          )}
          {shape === 'curved_willow' && (
            <g stroke="#84cc16" strokeWidth="1.3" fill="none">
              <path d="M 66,38 Q 64,52 60,58" />
              <path d="M 92,26 Q 90,42 86,50" />
              <path d="M 114,22 Q 113,36 110,44" />
              <circle cx="60" cy="58" r="1.8" fill="#a3e635" />
              <circle cx="86" cy="50" r="1.8" fill="#a3e635" />
              <circle cx="110" cy="44" r="1.8" fill="#a3e635" />
            </g>
          )}
          {shape === 'branch' && (
            <g>
              <path d="M 64,41 L 54,28" stroke={handleCol} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="52" cy="26" r="6" fill="#2d6a4f" />
              <circle cx="56" cy="24" r="5" fill="#40916c" />
              <path d="M 96,26 L 90,15" stroke={handleCol} strokeWidth="2" strokeLinecap="round" />
              <circle cx="89" cy="14" r="5" fill="#52b788" />
              {/* Quả thông treo chuôi */}
              <ellipse cx="20" cy="77" rx="3" ry="4.5" fill="#78350f" />
            </g>
          )}
          {/* Dây câu & Phao hồ lô cổ điển */}
          <path d={shape === 'curved_willow' ? 'M 132,22 L 132,68' : 'M 134,16 L 134,68'} stroke={st.line} strokeWidth="1" strokeDasharray="2 1" />
          <circle cx={shape === 'curved_willow' ? 132 : 134} cy="45" r="3" fill="#ef4444" />
          <circle cx={shape === 'curved_willow' ? 132 : 134} cy="41" r="2" fill="#fef08a" />
          <path d={shape === 'curved_willow' ? 'M 132,68 C 132,74 126,74 127,69' : 'M 134,68 C 134,74 128,74 129,69'} fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM B: CẦN GỖ CỔ ĐIỂN / ĐỒNG CỔ / GỐM MEN NGỌC --- */}
      {(shape === 'wood' || shape === 'bronze_pole' || shape === 'clay_vase' || shape === 'heavy_wood') && (
        <g>
          {/* Tay cầm cổ điển */}
          <path d="M 14,74 L 40,56" stroke={handleCol} strokeWidth="7" strokeLinecap="round" />
          {shape === 'clay_vase' ? (
            /* Bầu bình gốm men ngọc ở gốc cần */
            <g>
              <ellipse cx="38" cy="57" rx="9" ry="6" transform="rotate(-35 38 57)" fill="#f5ebe0" stroke={c0} strokeWidth="2" />
              <path d="M 33,59 Q 38,53 43,55" fill="none" stroke="#0d9488" strokeWidth="1.8" />
            </g>
          ) : (
            /* Guồng quay gỗ / đồng cổ điển */
            <g>
              <circle cx="40" cy="63" r="6.5" fill={reelCol} stroke="#27272a" strokeWidth="1.5" />
              <circle cx="40" cy="63" r="2.5" fill={handleCol} />
              <line x1="36" y1="60" x2="44" y2="66" stroke="#27272a" strokeWidth="1.2" />
            </g>
          )}
          {/* Thân cần đầm chắc có đai kim loại */}
          <path d="M 38,56 L 134,14" stroke={`url(#shaft_${uid})`} strokeWidth={shape === 'heavy_wood' ? '5.5' : '4.5'} strokeLinecap="round" />
          {/* Khuyên đai đồng / sắt */}
          <g stroke={accentCol} strokeWidth="2.5">
            <line x1="58" y1="44" x2="61" y2="50" />
            <line x1="84" y1="33" x2="87" y2="39" />
            <line x1="110" y1="22" x2="112" y2="27" />
          </g>
          {/* Khoen dẫn & Dây câu */}
          <circle cx="62" cy="51" r="2" fill="none" stroke={st.guide} strokeWidth="1.2" />
          <circle cx="88" cy="40" r="1.8" fill="none" stroke={st.guide} strokeWidth="1.2" />
          <circle cx="113" cy="28" r="1.5" fill="none" stroke={st.guide} strokeWidth="1.2" />
          <line x1="134" y1="14" x2="134" y2="68" stroke={st.line} strokeWidth="1.1" />
          <path d="M 134,68 C 134,74 128,74 129,69" fill="none" stroke={accentCol} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM C: CẦN MÁY THỂ THAO HIỆN ĐẠI / CARBON / HỢP KIM --- */}
      {(shape === 'iron_pipe' || shape === 'sport_light' || shape === 'flex_fiber' || shape === 'pro_carbon' || shape === 'chrome_blade' || shape === 'copper_spiral') && (
        <g>
          {/* Cán báng súng tách đôi (Split-Grip EVA) */}
          <path d="M 12,76 L 22,69" stroke={handleCol} strokeWidth="7" strokeLinecap="round" />
          <path d="M 22,69 L 30,63" stroke="#94a3b8" strokeWidth="3" />
          <path d="M 30,63 L 44,53" stroke={handleCol} strokeWidth="6.5" strokeLinecap="round" />
          {/* Chốt cò báng súng */}
          <path d="M 38,57 L 41,63 L 36,61 Z" fill={accentCol} />
          {/* Máy câu Spinning Cơ Khí Hiện Đại */}
          <g>
            <path d="M 42,55 L 47,64" stroke="#64748b" strokeWidth="2.5" />
            <ellipse cx="49" cy="66" rx="7" ry="5" transform="rotate(-30 49 66)" fill={reelCol} stroke={handleCol} strokeWidth="1.5" />
            <circle cx="49" cy="66" r="2.2" fill={accentCol} />
            {/* Tay quay máy câu */}
            <path d="M 49,66 L 56,71 L 59,69" fill="none" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* Thân cần thể thao uốn cong hoặc vát lưỡi kiếm */}
          {shape === 'chrome_blade' ? (
            <polygon points="42,51 45,55 138,14 134,12" fill={`url(#shaft_${uid})`} stroke="#f8fafc" strokeWidth="0.8" />
          ) : (
            <path
              d={shape === 'flex_fiber' ? 'M 43,53 Q 82,20 136,18' : 'M 43,53 Q 88,30 136,14'}
              fill="none"
              stroke={`url(#shaft_${uid})`}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {/* Họa tiết xoắn ốc đồng hoặc vảy Carbon */}
          {(shape === 'pro_carbon' || shape === 'copper_spiral') && (
            <path
              d="M 46,51 Q 88,30 130,16"
              fill="none"
              stroke={accentCol}
              strokeWidth="3.2"
              strokeDasharray={shape === 'copper_spiral' ? '3 3' : '2 4'}
            />
          )}
          {/* Dàn khoen dẫn dây Fuji cao cấp */}
          <g stroke={st.guide} strokeWidth="1.3" fill="none">
            <circle cx="65" cy="45" r="2.6" />
            <circle cx="90" cy="34" r="2.1" />
            <circle cx="114" cy="24" r="1.6" />
          </g>
          {/* Dây cước luồn qua khoen xuống lưỡi câu */}
          <path d="M 49,62 L 65,45 L 90,34 L 114,24 L 136,15 L 136,68" fill="none" stroke={st.line} strokeWidth="0.9" opacity="0.85" />
          <path d="M 136,68 C 136,74 130,74 131,69" fill="none" stroke={st.guide} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM D: CỐT LONG / SAN HÔ / HỔ PHÁCH / ĐÁ VỰC SÂU --- */}
      {(shape === 'bone_spine' || shape === 'coral_branch' || shape === 'amber_gem' || shape === 'abyss_rock') && (
        <g>
          <path d="M 14,75 L 38,57" stroke={handleCol} strokeWidth="7" strokeLinecap="round" />
          {shape === 'bone_spine' && (
            /* CỘT SỐNG GAI XƯƠNG & HỘP SỌ CỰ NGƯ */
            <g>
              {/* Đuôi cán khớp xương */}
              <circle cx="13" cy="76" r="4" fill="#e2e8f0" />
              <circle cx="16" cy="79" r="3.5" fill="#cbd5e1" />
              {/* Trục đốt xương */}
              <path d="M 38,57 Q 82,28 128,16" fill="none" stroke="#f8fafc" strokeWidth="5" strokeDasharray="6 3" />
              {/* Gai xương sườn nhô ra 2 bên */}
              {[
                [52, 47],
                [68, 38],
                [84, 30],
                [100, 23],
                [114, 19],
              ].map(([bx, by], i) => (
                <g key={i} stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round">
                  <line x1={bx} y1={by} x2={bx - 6} y2={by - 7} />
                  <line x1={bx} y1={by} x2={bx + 5} y2={by + 7} />
                </g>
              ))}
              {/* Đầu hộp sọ cá quái thú há miệng ở ngọn cần */}
              <path d="M 124,18 L 138,10 L 134,20 L 140,22 L 126,23 Z" fill="#f1f5f9" stroke="#475569" strokeWidth="1.2" />
              <circle cx="131" cy="15" r="1.8" fill="#ef4444" />
            </g>
          )}

          {shape === 'coral_branch' && (
            /* NHÁNH SAN HÔ ĐỎ ĐẠI DƯƠNG */
            <g>
              <path d="M 38,57 Q 78,36 132,16" fill="none" stroke="#ef4444" strokeWidth="5.5" strokeLinecap="round" />
              {/* Các nhánh san hô mọc rẽ */}
              <path d="M 62,45 Q 54,30 46,26" fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
              <path d="M 54,34 L 60,24" fill="none" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 88,33 Q 96,46 106,46" fill="none" stroke="#f87171" strokeWidth="3.8" strokeLinecap="round" />
              <path d="M 108,24 Q 102,12 96,10" fill="none" stroke="#fca5a5" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="46" cy="26" r="3" fill="#fef08a" />
              <circle cx="106" cy="46" r="2.8" fill="#fef08a" />
              <circle cx="132" cy="16" r="4" fill="#fca5a5" stroke="#fef08a" strokeWidth="1.2" />
            </g>
          )}

          {(shape === 'amber_gem' || shape === 'abyss_rock') && (
            /* HỔ PHÁCH HÓA THẠCH / HUYỀN THẠCH ĐÁY VỰC */
            <g>
              <path d="M 38,57 L 130,16" stroke={c1} strokeWidth="6" strokeLinecap="butt" strokeDasharray="10 2" />
              <path d="M 38,57 L 130,16" stroke={c0} strokeWidth="3.5" />
              <polygon points="126,18 135,10 140,16 131,22" fill={tipCol} stroke="#ffffff" strokeWidth="1" />
              <circle cx="44" cy="62" r="5.5" fill={reelCol} stroke={handleCol} strokeWidth="1.5" />
            </g>
          )}

          <line x1="134" y1="18" x2="134" y2="68" stroke={st.line} strokeWidth="1.1" />
          <path d="M 134,68 C 134,74 128,74 129,69" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM E: KIẾM LIỄU QUÝ TỘC / VƯƠNG TRƯỢNG / NHƯ Ý / HOÀNG KIM --- */}
      {(shape === 'silver_rapier' || shape === 'royal_sceptre' || shape === 'pearl_sceptre' || shape === 'golden_emperor' || shape === 'imperial_jade') && (
        <g>
          {/* Cán trượng có tua rua hoàng gia */}
          <path d="M 16,73 L 40,55" stroke={handleCol} strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="14" cy="75" r="4.5" fill={accentCol} stroke="#ffffff" strokeWidth="1" />
          {/* Tua rua lụa đỏ ở đuôi cán */}
          <path d="M 14,78 Q 10,85 6,84 M 14,78 Q 14,86 11,87" stroke="#ef4444" strokeWidth="1.6" fill="none" />

          {/* Quai kiếm chữ S hoặc Chắn tay Hoàng Gia */}
          {shape === 'silver_rapier' ? (
            <path d="M 32,46 Q 24,58 40,56 Q 52,54 46,68" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <g>
              <polygon points="34,47 46,63 42,66 30,50" fill={guardCol} stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="38" cy="56" r="3.5" fill={tipCol} stroke="#ffffff" strokeWidth="1" />
            </g>
          )}

          {/* Thân kiếm / Vương trượng / Gậy Như Ý */}
          {shape === 'imperial_jade' ? (
            <path d="M 40,55 C 68,42 94,18 124,18 C 134,18 138,10 130,8 C 122,6 118,14 126,18" fill="none" stroke="#22c55e" strokeWidth="5.5" strokeLinecap="round" />
          ) : (
            <path d="M 40,55 L 130,15" stroke={`url(#shaft_${uid})`} strokeWidth="4.5" strokeLinecap="round" />
          )}

          {/* Hạt chuỗi ngọc trai dọc thân */}
          {shape === 'pearl_sceptre' && (
            <g fill="#fef9c3" stroke="#f59e0b" strokeWidth="0.8">
              <circle cx="60" cy="46" r="3" />
              <circle cx="82" cy="36" r="3" />
              <circle cx="104" cy="26" r="3" />
            </g>
          )}

          {/* Đỉnh Vương Miện Hoàng Gia */}
          {(shape === 'royal_sceptre' || shape === 'golden_emperor' || shape === 'pearl_sceptre') && (
            <g filter={`url(#glow_${uid})`}>
              <polygon points="124,16 130,6 134,13 141,8 137,19 126,21" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
              <circle cx="132" cy="15" r="2.2" fill="#ef4444" />
            </g>
          )}

          <line x1="133" y1="18" x2="133" y2="68" stroke={st.line} strokeWidth="1.2" />
          <path d="M 133,68 C 133,74 127,74 128,69" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM F: TINH THỂ PHA LÊ / THẠCH ANH / HOÀNG NGỌC / KIM CƯƠNG VĨNH CỬU --- */}
      {(shape === 'crystal_prism' || shape === 'amethyst_cluster' || shape === 'topaz_spike' || shape === 'diamond_regal') && (
        <g filter={`url(#glow_${uid})`}>
          {/* Cán tinh thể vát cạnh */}
          <polygon points="12,73 17,78 42,58 37,53" fill={handleCol} stroke={accentCol} strokeWidth="1.2" />
          <polygon points="35,50 45,60 49,54 39,46" fill={guardCol} />

          {/* Thân cần ghép từ chuỗi khối Kim Cương / Tinh Thể Đa Diện */}
          {[
            [48, 50],
            [66, 42],
            [84, 34],
            [102, 26],
            [118, 19],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <polygon
                points={`${cx - 8},${cy + 4} ${cx},${cy - 4} ${cx + 10},${cy - 4} ${cx + 2},${cy + 4}`}
                fill={i % 2 === 0 ? c0 : c1}
                stroke="#ffffff"
                strokeWidth="0.9"
              />
              {/* Cụm gai pha lê mọc chĩa sang 2 bên */}
              <polygon points={`${cx},${cy - 3} ${cx - 5},${cy - 12} ${cx + 3},${cy - 5}`} fill={tipCol} opacity="0.9" />
              <polygon points={`${cx + 2},${cy + 3} ${cx + 9},${cy + 11} ${cx + 6},${cy + 1}`} fill={c0} opacity="0.85" />
            </g>
          ))}

          {/* Đỉnh Đại Kim Cương Hoàng Gia */}
          <polygon points="122,17 132,6 144,10 140,22 126,23" fill={tipCol} stroke="#ffffff" strokeWidth="1.5" />
          <polygon points="127,16 133,10 139,13 135,19" fill="#ffffff" opacity="0.85" />

          {/* Tia lấp lánh 4 cánh (Sparkle Stars) */}
          <g fill="#ffffff">
            <polygon points="134,0 135,4 139,5 135,6 134,10 133,6 129,5 133,4">
              {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />}
            </polygon>
            <polygon points="76,18 77,21 80,22 77,23 76,26 75,23 72,22 75,21">
              {animated && <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />}
            </polygon>
          </g>

          <line x1="136" y1="20" x2="136" y2="68" stroke="#e0f2fe" strokeWidth="1.2" strokeDasharray="3 1" />
          <polygon points="136,65 140,70 136,75 132,70" fill={tipCol} stroke="#ffffff" strokeWidth="0.8" />
        </g>
      )}

      {/* --- NHÓM G: LƯỠI HÁI ÁNH TRĂNG / CỰC QUANG / CẦU VỒNG / DÂY LEO NGỌC --- */}
      {(shape === 'silver_crescent' || shape === 'moon_scythe' || shape === 'aurora_wave' || shape === 'rainbow_ribbon' || shape === 'emerald_vine') && (
        <g>
          <path d="M 15,74 L 40,56" stroke={handleCol} strokeWidth="6" strokeLinecap="round" />
          <circle cx="42" cy="61" r="5" fill={reelCol} stroke={accentCol} strokeWidth="1.5" />

          {/* Dải lụa Cực Quang / Cầu Vồng uốn sóng */}
          {(shape === 'aurora_wave' || shape === 'rainbow_ribbon') && (
            <path
              d="M 38,56 C 58,30 78,60 98,28 C 112,10 124,26 136,14"
              fill="none"
              stroke={shape === 'rainbow_ribbon' ? `url(#rainbow_${uid})` : `url(#shaft_${uid})`}
              strokeWidth="6"
              strokeLinecap="round"
              filter={`url(#glow_${uid})`}
            />
          )}

          {/* Thân chính */}
          <path
            d="M 40,56 Q 82,32 126,18"
            fill="none"
            stroke={shape === 'rainbow_ribbon' ? '#ffffff' : `url(#shaft_${uid})`}
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Dây leo ngọc bích xoắn */}
          {shape === 'emerald_vine' && (
            <g>
              <path d="M 42,55 C 56,38 72,50 86,32 C 100,16 114,28 128,16" fill="none" stroke="#10b981" strokeWidth="2.5" />
              <circle cx="66" cy="40" r="3" fill="#6ee7b7" />
              <circle cx="98" cy="24" r="3" fill="#6ee7b7" />
            </g>
          )}

          {/* Đỉnh Lưỡi Hái Trăng Khuyết (Moon Scythe / Silver Crescent) */}
          {(shape === 'moon_scythe' || shape === 'silver_crescent') && (
            <path
              d="M 114,26 C 122,4 146,6 142,26 C 138,40 120,42 114,34 C 124,36 134,30 134,20 C 134,12 122,12 114,26 Z"
              fill={tipCol}
              stroke="#ffffff"
              strokeWidth="1.2"
              filter={`url(#glow_${uid})`}
            />
          )}

          <line x1="134" y1="22" x2="134" y2="68" stroke={st.line} strokeWidth="1.1" />
          <path d="M 134,68 C 134,74 128,74 129,69" fill="none" stroke={tipCol} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM H: TIA CHỚP LÔI ĐÌNH ZIG-ZAG --- */}
      {shape === 'thunder_bolt' && (
        <g filter={`url(#glow_${uid})`}>
          {/* Cán lõi từ Tesla */}
          <path d="M 14,75 L 38,57" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="42" cy="61" r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="42" cy="61" r="2.5" fill="#fef08a" />

          {/* Thân cần gãy khúc ZIG-ZAG như tia sét */}
          <polyline
            points="38,57 62,46 54,36 88,28 80,18 114,16 108,8 138,10"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="5.5"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
          <polyline
            points="38,57 62,46 54,36 88,28 80,18 114,16 108,8 138,10"
            fill="none"
            stroke="#fef08a"
            strokeWidth="2.4"
            strokeLinejoin="miter"
          />

          {/* Tia hồ quang điện phụ phóng quanh thân */}
          <polyline points="62,46 72,52 78,47" fill="none" stroke="#38bdf8" strokeWidth="1.5">
            {animated && <animate attributeName="opacity" values="0;1;0" dur="0.6s" repeatCount="indefinite" />}
          </polyline>
          <polyline points="88,28 96,35 104,30" fill="none" stroke="#38bdf8" strokeWidth="1.5">
            {animated && <animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite" />}
          </polyline>

          {/* Dây câu tia điện & lưỡi câu sét */}
          <polyline points="138,10 135,30 139,46 134,68" fill="none" stroke="#fef08a" strokeWidth="1.3" />
          <polyline points="134,66 138,71 131,74" fill="none" stroke="#38bdf8" strokeWidth="2" />
        </g>
      )}

      {/* --- NHÓM I: DUNG NHAM ĐỊA NGỤC / HẮC DIỆU THẠCH / HUYẾT NGỌC --- */}
      {(shape === 'magma_fissure' || shape === 'obsidian_jagged' || shape === 'ruby_flame') && (
        <g filter={`url(#glow_${uid})`}>
          {/* Cán đá núi lửa */}
          <polygon points="12,73 18,79 42,59 36,52" fill="#1c1917" stroke="#dc2626" strokeWidth="1.5" />
          {/* Thân đá gai góc nứt dung nham */}
          <polygon
            points="36,52 58,36 62,41 86,24 90,29 116,14 136,12 120,25 94,36 88,32 66,47 42,59"
            fill="#27272a"
            stroke="#ef4444"
            strokeWidth="1.4"
          />
          {/* Mạch dung nham nóng chảy bên trong */}
          <path d="M 39,55 L 62,41 L 88,28 L 130,14" fill="none" stroke="#facc15" strokeWidth="2.2" strokeDasharray="5 2" />
          {/* Quả cầu lửa Huyết Ngọc ở đỉnh cần */}
          <circle cx="134" cy="13" r="6" fill="#dc2626" stroke="#fef08a" strokeWidth="1.5" />
          <path d="M 130,9 Q 136,0 142,8 Q 146,14 134,18 Z" fill="#f97316" opacity="0.85" />

          <line x1="134" y1="19" x2="134" y2="68" stroke="#fca5a5" strokeWidth="1.2" />
          <path d="M 134,68 C 134,74 128,74 129,69" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM J: ĐINH BA TAM XOA KÍCH POSEIDON / LAM NGỌC / THÁI DƯƠNG --- */}
      {(shape === 'poseidon_trident' || shape === 'sapphire_trident' || shape === 'sun_glory') && (
        <g filter={`url(#glow_${uid})`}>
          {/* Cán thần binh */}
          <path d="M 14,74 L 118,22" stroke={`url(#shaft_${uid})`} strokeWidth="5" strokeLinecap="round" />
          {/* Dòng nước xoáy hoặc hoa văn vàng quấn quanh trục */}
          <path d="M 32,65 C 48,48 64,62 80,41 C 94,24 106,36 118,22" fill="none" stroke={accentCol} strokeWidth="2.2" />
          {/* Viên ngọc đại dương ở chuôi */}
          <circle cx="38" cy="62" r="5.5" fill={reelCol} stroke="#fef08a" strokeWidth="1.8" />

          {shape === 'sun_glory' ? (
            /* ĐĨA MẶT TRỜI THÁI DƯƠNG XOAY TRÒN */
            <g>
              <circle cx="128" cy="17" r="11" fill="none" stroke="#fde047" strokeWidth="3" strokeDasharray="3 3">
                {animated && (
                  <animateTransform attributeName="transform" type="rotate" from="0 128 17" to="360 128 17" dur="6s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx="128" cy="17" r="6.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          ) : (
            /* ĐẦU ĐINH BA TAM XOA KÍCH 3 MŨI NHỌN UY NGHIÊM */
            <g>
              {/* Ngạnh ngang */}
              <path d="M 112,12 Q 118,24 126,30" fill="none" stroke={tipCol} strokeWidth="3.5" strokeLinecap="round" />
              {/* Mũi kích trái */}
              <path d="M 113,13 L 132,4 L 128,10" fill="none" stroke={tipCol} strokeWidth="2.8" strokeLinecap="round" />
              {/* Mũi kích giữa dài nhất */}
              <path d="M 118,22 L 144,9" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              <polygon points="140,7 148,7 143,14" fill={tipCol} />
              {/* Mũi kích phải */}
              <path d="M 125,29 L 144,20 L 138,26" fill="none" stroke={tipCol} strokeWidth="2.8" strokeLinecap="round" />
              {/* Ngọc thủy triều giữa chạc ba */}
              <circle cx="120" cy="21" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            </g>
          )}

          <line x1="136" y1="20" x2="136" y2="68" stroke={st.line} strokeWidth="1.2" />
          {/* Lưỡi câu mỏ neo vàng */}
          <path d="M 132,68 L 136,74 L 140,68 M 136,64 L 136,74" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM K: NGŨ ĐẠI THẦN THÚ HUYỀN THOẠI (UR) --- */}
      {shape === 'dragon_divine' && (
        /* 1. LONG VƯƠNG TRẤN HẢI: RỒNG VÀNG CUỘN QUANH TRỤ NGỌC ĐỎ, ĐẦU RỒNG NGẬM CHÂU */
        <g filter={`url(#glow_${uid})`}>
          {/* Trụ thần đỏ huyết long */}
          <path d="M 14,74 L 124,18" stroke="#991b1b" strokeWidth="6" strokeLinecap="round" />
          {/* Thân Rồng Vàng 3 khúc uốn lượn quanh trụ */}
          <path
            d="M 22,70 C 32,50 48,72 60,50 C 72,28 88,50 100,28 C 108,16 118,24 126,16"
            fill="none"
            stroke={`url(#gold_${uid})`}
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M 22,70 C 32,50 48,72 60,50 C 72,28 88,50 100,28"
            fill="none"
            stroke="#fef08a"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Đầu Rồng Vàng Uy Nghiêm ở Ngọn Cần */}
          <path d="M 118,20 L 134,8 L 142,12 L 132,18 L 140,22 L 124,24 Z" fill="#facc15" stroke="#b45309" strokeWidth="1.2" />
          {/* Sừng rồng & Râu rồng */}
          <path d="M 124,13 L 116,4 M 128,11 L 123,2" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
          <path d="M 138,12 Q 148,6 152,14" fill="none" stroke="#ef4444" strokeWidth="1.5" />
          {/* Viên Long Châu Đỏ Rực trong miệng rồng */}
          <circle cx="141" cy="17" r="4.5" fill="#ef4444" stroke="#fef08a" strokeWidth="1.5">
            {animated && <animate attributeName="r" values="4;5.2;4" dur="1.5s" repeatCount="indefinite" />}
          </circle>
          <line x1="141" y1="22" x2="141" y2="68" stroke="#fef08a" strokeWidth="1.3" />
          <path d="M 141,68 C 141,75 134,75 135,69" fill="none" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'phoenix_blaze' && (
        /* 2. CHU TƯỚC NIẾT BÀN: ĐÔI CÁNH PHƯỢNG HOÀNG LỬA SẢI RỘNG & MÀO LỬA */
        <g filter={`url(#glow_${uid})`}>
          {/* Đuôi lông vũ phượng hoàng */}
          <path d="M 6,80 Q 16,74 26,64 M 10,84 Q 20,78 28,66" stroke="#f97316" strokeWidth="2.5" fill="none" />
          {/* Đôi Cánh Phượng Hoàng Lửa Khổng Lồ ở Chuôi Cần */}
          <path
            d="M 40,56 C 24,34 18,18 34,14 C 38,26 46,34 54,46 Z"
            fill="#f43f5e"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <path
            d="M 44,58 C 56,74 72,78 78,66 C 66,60 58,54 50,48 Z"
            fill="#fb923c"
            stroke="#fef08a"
            strokeWidth="1.2"
          />
          {/* Thân cần rực lửa */}
          <path d="M 24,66 L 130,16" stroke={`url(#gold_${uid})`} strokeWidth="4.8" strokeLinecap="round" />
          {/* Đầu chim thần Chu Tước ở ngọn */}
          <path d="M 124,18 L 138,8 L 144,15 L 132,21 Z" fill="#f43f5e" stroke="#fef08a" strokeWidth="1.2" />
          <path d="M 128,12 Q 124,2 134,2 Q 138,2 136,10" fill="none" stroke="#fef08a" strokeWidth="2" />
          <line x1="140" y1="15" x2="140" y2="68" stroke="#fda4af" strokeWidth="1.2" />
          <path d="M 140,68 C 140,74 134,74 135,69" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'leviathan_fang' && (
        /* 3. NANH BĂNG CỰ THÚ LEVIATHAN: CHIẾC NANH BĂNG CONG VÚT & GAI BĂNG BẮC CỰC */
        <g filter={`url(#glow_${uid})`}>
          <path d="M 16,74 L 38,58" stroke="#082f49" strokeWidth="7" strokeLinecap="round" />
          {/* Chiếc Nanh Băng Khổng Lồ Uốn Cong */}
          <path
            d="M 36,60 C 66,46 98,28 138,8 C 110,16 74,34 34,54 Z"
            fill="#bae6fd"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          {/* Hàng vây gai băng dọc sống lưng */}
          <polygon points="56,43 52,30 66,38" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.8" />
          <polygon points="78,31 75,18 88,26" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.8" />
          <polygon points="100,20 98,8 110,16" fill="#ffffff" stroke="#0284c7" strokeWidth="0.8" />
          <line x1="136" y1="10" x2="136" y2="68" stroke="#e0f2fe" strokeWidth="1.2" strokeDasharray="3 2" />
          <path d="M 136,68 C 136,74 130,74 131,69" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'kraken_tentacle' && (
        /* 4. XÚC TU HẮC HẢI KRAKEN: XÚC TU BẠCH TUỘC CHỮ S & GIÁC HÚT PHÁT QUANG */
        <g filter={`url(#glow_${uid})`}>
          <path
            d="M 16,74 C 42,68 48,36 78,40 C 104,44 112,12 136,18"
            fill="none"
            stroke="#6d28d9"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <path
            d="M 16,74 C 42,68 48,36 78,40 C 104,44 112,12 136,18"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Hàng giác hút hồng phát sáng dọc bụng xúc tu */}
          {[
            [38, 63],
            [52, 50],
            [68, 43],
            [86, 42],
            [104, 34],
            [120, 22],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r="2.8" fill="#f472b6" stroke="#fdf2f8" strokeWidth="0.9" />
          ))}
          <circle cx="136" cy="18" r="4" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
          <line x1="136" y1="22" x2="136" y2="68" stroke="#f5d0fe" strokeWidth="1.2" />
          <path d="M 136,68 C 136,74 130,74 131,69" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'valkyrie_wings' && (
        /* 5. CHIẾN NỮ VALKYRIE: ĐÔI CÁNH THIÊN THẦN TRẮNG MUỐT & HÀO QUANG HALO */
        <g filter={`url(#glow_${uid})`}>
          <path d="M 16,74 L 130,16" stroke={`url(#gold_${uid})`} strokeWidth="4.8" strokeLinecap="round" />
          {/* Đôi Cánh Thiên Thần Trắng Tuyết Viền Vàng */}
          <path
            d="M 46,54 C 28,36 22,18 38,12 C 44,24 52,36 60,46 Z"
            fill="#ffffff"
            stroke="#facc15"
            strokeWidth="1.5"
          />
          <path
            d="M 50,56 C 62,72 78,76 86,64 C 74,58 64,52 56,48 Z"
            fill="#f8fafc"
            stroke="#facc15"
            strokeWidth="1.5"
          />
          {/* Vòng Halo Thánh Khiết lơ lửng trên ngọn thương */}
          <ellipse cx="132" cy="10" rx="9" ry="4" transform="rotate(-20 132 10)" fill="none" stroke="#fef08a" strokeWidth="2.4" />
          <polygon points="124,19 138,12 131,23" fill="#ffffff" stroke="#eab308" strokeWidth="1" />
          <line x1="135" y1="16" x2="135" y2="68" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M 135,68 C 135,74 129,74 130,69" fill="none" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'divine_lotus' && (
        /* 6. CỬU PHẨM KIM LIÊN: ĐÓA SEN VÀNG 9 CÁNH BUNG NỞ NƠI NGỌN CẦN */
        <g filter={`url(#glow_${uid})`}>
          <path d="M 16,74 Q 72,42 124,18" fill="none" stroke="#10b981" strokeWidth="4.8" strokeLinecap="round" />
          {/* Đài sen nhỏ ở chuôi */}
          <circle cx="38" cy="60" r="6" fill="#f472b6" stroke="#fde047" strokeWidth="1.5" />
          {/* Đóa Cửu Phẩm Kim Liên bung nở rực rỡ ở ngọn */}
          <g transform="translate(128, 16)">
            <ellipse cx="-6" cy="-2" rx="7" ry="3.5" transform="rotate(-35)" fill="#f472b6" stroke="#fef08a" strokeWidth="1" />
            <ellipse cx="6" cy="2" rx="7" ry="3.5" transform="rotate(25)" fill="#f472b6" stroke="#fef08a" strokeWidth="1" />
            <ellipse cx="0" cy="-6" rx="4" ry="8" fill="#fde047" stroke="#ffffff" strokeWidth="1" />
            <circle cx="0" cy="0" r="4" fill="#fef08a" />
          </g>
          <line x1="128" y1="22" x2="128" y2="68" stroke="#fbcfe8" strokeWidth="1.2" />
          <path d="M 128,68 C 128,74 122,74 123,69" fill="none" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* --- NHÓM L: NGŨ ĐẠI THẦN KHÍ VŨ TRỤ (MYTHIC) --- */}
      {shape === 'genesis_creation' && (
        /* 1. CẦN KHỞI NGUYÊN TỐI THƯỢNG: TRƯỢNG ÁNH SÁNG TẠO HÓA & VƯƠNG MIỆN ĐA SẮC */
        <g filter={`url(#glow_${uid})`}>
          {/* Tia năng lượng sáng thế xuyên suốt */}
          <path d="M 14,74 L 132,14" stroke={`url(#rainbow_${uid})`} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 14,74 L 132,14" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 3" />
          {/* Đôi cánh tinh thể lơ lửng */}
          <polygon points="40,56 26,34 38,30 48,50" fill="#00f5d4" stroke="#ffffff" strokeWidth="1" />
          <polygon points="46,60 64,74 68,64 52,54" fill="#ff007f" stroke="#ffffff" strokeWidth="1" />
          {/* Quả cầu Sáng Thế & Vương Miện Khởi Nguyên */}
          <circle cx="132" cy="14" r="8" fill="#ffd700" stroke="#ffffff" strokeWidth="2" />
          <circle cx="132" cy="14" r="4" fill="#00f5d4" />
          <line x1="132" y1="22" x2="132" y2="68" stroke="#00f5d4" strokeWidth="1.4" strokeDasharray="3 1" />
          <polygon points="132,64 137,70 132,76 127,70" fill="#ffd700" stroke="#ffffff" strokeWidth="1" />
        </g>
      )}

      {shape === 'galaxy_orbit' && (
        /* 2. CẦN TINH CẦU NGÂN HÀ: 2 VÀNH ĐAI QUỸ ĐẠO SAO ELIP XOAY QUANH TRỤC VŨ TRỤ */
        <g filter={`url(#glow_${uid})`}>
          <path d="M 14,74 L 130,16" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
          <path d="M 14,74 L 130,16" stroke="#e0e7ff" strokeWidth="1.8" strokeDasharray="4 4" />
          {/* Vành đai Sao Thổ 1 ở giữa thân */}
          <ellipse cx="68" cy="46" rx="18" ry="6" transform="rotate(-28 68 46)" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="52" cy="54" r="2.5" fill="#fef08a" />
          {/* Tinh cầu Ngân Hà & 2 Vành Đai Đan Chéo ở Ngọn */}
          <ellipse cx="126" cy="18" rx="16" ry="5.5" transform="rotate(-25 126 18)" fill="none" stroke="#00f5d4" strokeWidth="2" />
          <ellipse cx="126" cy="18" rx="16" ry="5.5" transform="rotate(35 126 18)" fill="none" stroke="#f43f5e" strokeWidth="1.8" />
          <circle cx="126" cy="18" r="6.5" fill="#312e81" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="126" cy="18" r="2.5" fill="#ffffff" />
          <line x1="126" y1="25" x2="126" y2="68" stroke="#38bdf8" strokeWidth="1.3" strokeDasharray="2 2" />
          <polygon points="126,65 130,70 126,75 122,70" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
        </g>
      )}

      {shape === 'chronos_timewheel' && (
        /* 3. CẦN THỜI KHÔNG CHRONOS: BÁNH RĂNG ĐỒNG HỒ VÀNG XOAY TRÒN & KIM THỜI GIAN */
        <g filter={`url(#glow_${uid})`}>
          {/* Quả lắc đồng hồ ở đuôi cán */}
          <line x1="16" y1="73" x2="10" y2="83" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="10" cy="83" r="3.5" fill="#67e8f9" stroke="#fbbf24" strokeWidth="1.2" />

          <path d="M 16,73 L 132,14" stroke={`url(#gold_${uid})`} strokeWidth="5" strokeLinecap="round" />

          {/* Bánh Răng Đồng Hồ Thời Không Xoay ở Giữa Cần */}
          <g>
            <circle
              cx="56"
              cy="52"
              r="12"
              fill="#451a03"
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeDasharray="4 3"
            >
              {animated && (
                <animateTransform attributeName="transform" type="rotate" from="0 56 52" to="360 56 52" dur="5s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="56" cy="52" r="7" fill="none" stroke="#67e8f9" strokeWidth="1" />
            {/* Kim giờ & kim phút */}
            <line x1="56" y1="52" x2="56" y2="44" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="52" x2="62" y2="52" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Mũi kim Thời Không ở ngọn cần */}
          <polygon points="124,18 142,8 134,20 138,24" fill="#67e8f9" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="136" y1="16" x2="136" y2="68" stroke="#67e8f9" strokeWidth="1.3" />
          <path d="M 136,68 C 136,74 130,74 131,69" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'yggdrasil_tree' && (
        /* 4. CẦN THẾ GIỚI THỤ YGGDRASIL: CỘI RỄ THẦN THỤ ÔM NGỌC SINH MỆNH & TÁN LÁ THẦN */
        <g filter={`url(#glow_${uid})`}>
          {/* 2 nhánh thân gỗ thần thụ đan xoắn vào nhau */}
          <path d="M 14,75 C 40,66 56,36 84,38 C 104,40 116,18 132,14" fill="none" stroke="#047857" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 18,77 C 44,50 64,62 88,32 C 106,12 118,28 132,14" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
          {/* Viên Ngọc Sinh Mệnh Cửu Giới ở nút giao */}
          <circle cx="62" cy="48" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          {/* Tán lá thần Yggdrasil phát sáng ở đỉnh */}
          <circle cx="126" cy="14" r="9" fill="#059669" />
          <circle cx="134" cy="12" r="8" fill="#10b981" />
          <circle cx="130" cy="8" r="6" fill="#6ee7b7" />
          <circle cx="132" cy="13" r="2.5" fill="#fef08a" />
          <line x1="134" y1="20" x2="134" y2="68" stroke="#a7f3d0" strokeWidth="1.3" />
          <path d="M 134,68 C 134,74 128,74 129,69" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {shape === 'singularity_void' && (
        /* 5. CẦN LỖ ĐEN VÔ CỰC (SINGULARITY): LỖ ĐEN VŨ TRỤ & ĐĨA BỒI TỤ XOÁY CUỘN */
        <g filter={`url(#glow_${uid})`}>
          {/* Trục không gian bị bẻ cong */}
          <path d="M 14,74 Q 68,52 126,18" fill="none" stroke="#581c87" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 14,74 Q 68,52 126,18" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 3" />

          {/* Lỗ Đen Phụ ở Máy Câu */}
          <ellipse cx="52" cy="56" rx="11" ry="5" transform="rotate(-25 52 56)" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="52" cy="56" r="5" fill="#020617" stroke="#ec4899" strokeWidth="1.5" />

          {/* ĐẠI LỖ ĐEN VÔ CỰC (EVENT HORIZON) Ở NGỌN CẦN */}
          <g>
            {/* Đĩa bồi tụ xoáy (Accretion Disk) */}
            <ellipse cx="126" cy="18" rx="18" ry="7" transform="rotate(-22 126 18)" fill="none" stroke="#ec4899" strokeWidth="2.8" />
            <ellipse cx="126" cy="18" rx="14" ry="4.5" transform="rotate(-22 126 18)" fill="none" stroke="#06b6d4" strokeWidth="1.8" />
            {/* Tia bức xạ cực (Relativistic Jets) */}
            <line x1="120" y1="4" x2="132" y2="32" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Chân trời sự kiện đen tuyệt đối */}
            <circle cx="126" cy="18" r="7.5" fill="#000000" stroke="#ffffff" strokeWidth="1.5">
              {animated && <animate attributeName="r" values="6.8;8.2;6.8" dur="1.6s" repeatCount="indefinite" />}
            </circle>
          </g>

          <line x1="126" y1="26" x2="126" y2="68" stroke="#ec4899" strokeWidth="1.4" strokeDasharray="3 2" />
          <circle cx="126" cy="70" r="3.5" fill="#000000" stroke="#06b6d4" strokeWidth="1.5" />
        </g>
      )}

      {/* 4. HIỆU ỨNG HẠT NĂNG LƯỢNG BAY LƠ LỬNG CHO CẦN CAO CẤP */}
      {isHighTier && animated && (
        <g fill="#ffffff">
          <circle cx="48" cy="24" r="1.5" fill={tipCol}>
            <animate attributeName="cy" values="28;16;28" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="94" cy="54" r="1.8" fill={accentCol}>
            <animate attributeName="cy" values="58;44;58" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="112" cy="12" r="1.4" fill="#ffffff">
            <animate attributeName=" opacity" values="0.1;1;0.1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
};

export interface BaitVisualProps {
  baitId: string;
  size?: number;
}

/**
 * Component vẽ minh họa mỹ thuật riêng biệt, sắc nét và uy tín cho từng loại trong 10 Mồi Câu Cá
 */
export const BaitVisual: React.FC<BaitVisualProps> = ({ baitId, size = 48 }) => {
  const uid = useId().replace(/:/g, '');

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <filter id={`bglow_${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. MỒI GIUN ĐÀO ĐẤT ĐỎ (bait_worm) */}
      {baitId === 'bait_worm' && (
        <g>
          <circle cx="32" cy="32" r="24" fill="rgba(180, 83, 9, 0.18)" />
          {/* Lưỡi câu thép */}
          <path d="M 32,8 L 32,36 C 32,46 20,46 20,37" fill="none" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
          {/* Thân con giun đỏ uốn cong sống động */}
          <path
            d="M 16,24 C 24,14 38,22 36,34 C 34,46 46,52 50,40"
            fill="none"
            stroke="#dc2626"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 16,24 C 24,14 38,22 36,34 C 34,46 46,52 50,40"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="3"
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* 2. MỒI CÁM THƠM NGŨ CỐC (bait_dough) */}
      {baitId === 'bait_dough' && (
        <g>
          <circle cx="32" cy="34" r="24" fill="rgba(245, 158, 11, 0.2)" />
          {/* Làn hương thơm bốc lên */}
          <path d="M 24,18 Q 20,10 26,6 M 38,16 Q 42,8 36,4" fill="none" stroke="#fde047" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          {/* Viên cám ngũ cốc tròn đầy */}
          <circle cx="32" cy="36" r="16" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
          <circle cx="28" cy="32" r="12" fill="#f59e0b" />
          {/* Hạt bắp & vừng rang lấm tấm */}
          <circle cx="26" cy="30" r="2" fill="#fef08a" />
          <circle cx="36" cy="34" r="2.2" fill="#fef08a" />
          <circle cx="30" cy="40" r="1.8" fill="#fde68a" />
          <circle cx="38" cy="27" r="1.5" fill="#fffbeb" />
        </g>
      )}

      {/* 3. MỒI DẾ CƠM BÉO NGẬY (bait_cricket) */}
      {baitId === 'bait_cricket' && (
        <g>
          <circle cx="32" cy="32" r="24" fill="rgba(101, 163, 13, 0.2)" />
          {/* Càng nhảy khỏe khoắn phía sau */}
          <path d="M 36,34 L 48,18 L 52,42" fill="none" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Thân dế cơm nâu vàng bóng */}
          <ellipse cx="30" cy="36" rx="14" ry="8" transform="rotate(-15 30 36)" fill="#b45309" stroke="#fde047" strokeWidth="1.5" />
          <circle cx="17" cy="38" r="5.5" fill="#78350f" />
          <circle cx="15" cy="36" r="1.8" fill="#fef08a" />
          {/* Râu dế dài */}
          <path d="M 13,36 Q 4,28 6,18 M 14,40 Q 4,42 4,50" fill="none" stroke="#d97706" strokeWidth="1.5" />
        </g>
      )}

      {/* 4. MỒI TÔM BẠC TƯƠI SỐNG (bait_shrimp) */}
      {baitId === 'bait_shrimp' && (
        <g>
          <circle cx="32" cy="32" r="24" fill="rgba(56, 189, 248, 0.22)" />
          {/* Thân tôm bạc uốn cong chữ C */}
          <path
            d="M 44,20 C 22,12 12,34 26,46 C 34,52 44,48 40,40"
            fill="none"
            stroke="#fb7185"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 44,20 C 22,12 12,34 26,46"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="5"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          {/* Đuôi tôm xòe & râu tôm */}
          <polygon points="40,40 48,46 44,52" fill="#f43f5e" />
          <circle cx="45" cy="20" r="2" fill="#0f172a" />
          <path d="M 48,18 Q 58,12 56,6 M 48,22 Q 58,24 58,32" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        </g>
      )}

      {/* 5. MỒI MỰC ỐNG CẮT KHỨA (bait_squid) */}
      {baitId === 'bait_squid' && (
        <g>
          <circle cx="32" cy="32" r="24" fill="rgba(244, 114, 182, 0.22)" />
          {/* Thân mực ống trắng hồng khứa vảy rồng */}
          <polygon points="32,8 48,24 42,40 22,40 16,24" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
          <line x1="22" y1="24" x2="42" y2="24" stroke="#f472b6" strokeWidth="1.5" />
          <line x1="24" y1="31" x2="40" y2="31" stroke="#f472b6" strokeWidth="1.5" />
          {/* Râu mực uốn lượn */}
          <path d="M 24,40 Q 20,52 16,56 M 30,40 Q 30,54 28,58 M 36,40 Q 38,54 42,58 M 40,40 Q 46,50 50,54" fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" />
          <circle cx="26" cy="34" r="2" fill="#0f172a" />
          <circle cx="38" cy="34" r="2" fill="#0f172a" />
        </g>
      )}

      {/* 6. MỒI SỨA DẠ QUANG VỰC THẲM (bait_glow) */}
      {baitId === 'bait_glow' && (
        <g filter={`url(#bglow_${uid})`}>
          <circle cx="32" cy="32" r="25" fill="rgba(139, 92, 246, 0.28)" />
          {/* Mũ sứa phát quang xanh-tím */}
          <path d="M 14,32 C 14,12 50,12 50,32 C 42,28 22,28 14,32 Z" fill="#a855f7" stroke="#67e8f9" strokeWidth="2" />
          <ellipse cx="32" cy="23" rx="10" ry="5" fill="#67e8f9" opacity="0.7" />
          {/* Xúc tu dạ quang phát sáng */}
          <path d="M 22,32 Q 18,46 24,56 M 29,31 Q 32,46 28,58 M 36,31 Q 34,46 40,58 M 42,32 Q 46,46 42,54" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2" fill="#67e8f9" />
          <circle cx="48" cy="42" r="2" fill="#e879f9" />
        </g>
      )}

      {/* 7. MỒI CÁ GIẢ BẠC CƠ KHÍ MINNOW (bait_lure_silver) */}
      {baitId === 'bait_lure_silver' && (
        <g filter={`url(#bglow_${uid})`}>
          <circle cx="32" cy="32" r="25" fill="rgba(59, 130, 246, 0.25)" />
          {/* Thân cá giả kim loại 3D */}
          <path d="M 10,32 Q 28,16 50,28 L 58,22 L 54,32 L 58,42 L 50,36 Q 28,48 10,32 Z" fill="#e2e8f0" stroke="#0284c7" strokeWidth="2" />
          <path d="M 12,31 Q 28,20 48,29" fill="none" stroke="#38bdf8" strokeWidth="4" />
          {/* Mắt đỏ săn mồi & Lưỡi câu ba tiêu (Treble hook) */}
          <circle cx="18" cy="30" r="2.8" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          <path d="M 32,40 L 32,54 M 32,54 C 26,54 26,48 28,48 M 32,54 C 38,54 38,48 36,48" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* 8. MỒI KIM THIỀN HOÀNG KIM 24K (bait_gold) */}
      {baitId === 'bait_gold' && (
        <g filter={`url(#bglow_${uid})`}>
          <circle cx="32" cy="32" r="26" fill="rgba(250, 204, 21, 0.3)" />
          {/* Đôi cánh ve sầu vàng kim óng ánh */}
          <ellipse cx="22" cy="34" rx="8" ry="16" transform="rotate(20 22 34)" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.8" opacity="0.9" />
          <ellipse cx="42" cy="34" rx="8" ry="16" transform="rotate(-20 42 34)" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.8" opacity="0.9" />
          {/* Thân nhộng vàng ròng 24K */}
          <ellipse cx="32" cy="32" rx="9" ry="15" fill="#facc15" stroke="#b45309" strokeWidth="2" />
          <line x1="25" y1="28" x2="39" y2="28" stroke="#b45309" strokeWidth="1.5" />
          <line x1="24" y1="34" x2="40" y2="34" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="28" cy="20" r="2.2" fill="#ef4444" />
          <circle cx="36" cy="20" r="2.2" fill="#ef4444" />
        </g>
      )}

      {/* 9. MỒI HUYẾT TINH HẢI VƯƠNG (bait_dragon_blood) */}
      {baitId === 'bait_dragon_blood' && (
        <g filter={`url(#bglow_${uid})`}>
          <circle cx="32" cy="32" r="26" fill="rgba(220, 38, 38, 0.32)" />
          {/* Vòng xung năng lượng huyết tinh */}
          <circle cx="32" cy="34" r="20" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Giọt Huyết Tinh Cổ Đại */}
          <path d="M 32,8 C 32,8 50,28 50,40 C 50,50 42,56 32,56 C 22,56 14,50 14,40 C 14,28 32,8 32,8 Z" fill="#dc2626" stroke="#fef08a" strokeWidth="2" />
          <path d="M 32,16 C 32,16 42,30 42,39 C 42,45 37,49 32,49" fill="none" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="27" cy="36" r="3.5" fill="#fef08a" />
        </g>
      )}

      {/* 10. MỒI LONG CHÂU THẦN THOẠI (bait_abyss) */}
      {baitId === 'bait_abyss' && (
        <g filter={`url(#bglow_${uid})`}>
          <circle cx="32" cy="32" r="28" fill="rgba(236, 72, 153, 0.32)" />
          {/* 2 Vành đai thần thánh xoay quanh Long Châu */}
          <ellipse cx="32" cy="32" rx="26" ry="9" transform="rotate(-25 32 32)" fill="none" stroke="#00f5d4" strokeWidth="2.2" />
          <ellipse cx="32" cy="32" rx="26" ry="9" transform="rotate(35 32 32)" fill="none" stroke="#facc15" strokeWidth="2" />
          {/* Viên Ngọc Long Châu Ngũ Sắc */}
          <circle cx="32" cy="32" r="15" fill="#7e22ce" stroke="#fef08a" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="11" fill="#ec4899" />
          {/* Bóng Kim Long uốn lượn bên trong viên ngọc */}
          <path d="M 24,36 C 26,24 38,24 38,32 C 38,38 30,40 32,26" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
          <circle cx="27" cy="26" r="2.5" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
};
