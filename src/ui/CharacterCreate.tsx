import { useState } from 'react';
import {
  CLOTH_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  lookOf,
  type Dir,
  type HairStyle,
} from '../art/avatar';
import { createProfile } from '../game/logic/player';
import { ONLINE } from '../services/config';
import { pushAll, useOnline } from '../services/online';
import { useGame } from '../store';
import { AvatarView } from './AvatarView';

const SUGGEST = {
  m: ['Lâm Phong', 'Khôi Nguyên', 'Bảo Long', 'Minh Quân', 'Tuấn Kiệt', 'Thiên Vũ', 'Hải Đăng', 'Gia Huy'],
  f: ['Mai Anh', 'Ngọc Lan', 'Hạ Vy', 'Thảo Nhi', 'Linh Đan', 'Tuyết Mai', 'Khánh An', 'Phương Linh'],
};

const COLOR_NAMES = {
  hair: ['Nâu hạt dẻ', 'Đen tuyền', 'Vàng kim', 'Đỏ rực', 'Bạch kim', 'Xanh lam', 'Hồng đào', 'Lục bảo'],
  skin: ['Sáng hồng', 'Tự nhiên', 'Bánh mật', 'Nắng vàng', 'Rám nắng'],
  eyes: ['Nâu hổ phách', 'Lam ngọc', 'Lục bảo', 'Tím thạch anh', 'Hồng ngọc'],
  cloth: ['Lam mạo hiểm', 'Đỏ nhiệt huyết', 'Lục thảo nguyên', 'Tím huyền bí', 'Vàng hoàng kim', 'Hắc hiệp sĩ'],
};

function Swatches({
  colors,
  labels,
  value,
  onPick,
}: {
  colors: string[];
  labels?: string[];
  value: number;
  onPick: (i: number) => void;
}) {
  return (
    <div className="cc-swatch-list">
      {colors.map((c, i) => {
        const title = labels?.[i] ?? `Màu ${i + 1}`;
        const isSelected = value === i;
        return (
          <button
            key={c + i}
            type="button"
            className={`cc-swatch-btn ${isSelected ? 'on' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onPick(i)}
            title={title}
            aria-label={title}
          />
        );
      })}
    </div>
  );
}

export function CharacterCreate({ onDone }: { onDone: () => void }) {
  const act = useGame((s) => s.act);
  const old = useGame((s) => s.game.profile);
  const [gender, setGender] = useState<'m' | 'f'>(old.gender);
  const [hairStyle, setHairStyle] = useState<HairStyle>((old.hairStyle as HairStyle) || 'short');
  const [hair, setHair] = useState(old.hair);
  const [skin, setSkin] = useState(old.skin);
  const [eyes, setEyes] = useState(old.eyes);
  const [cloth, setCloth] = useState(old.cloth);
  const [name, setName] = useState(old.name);
  const [dir, setDir] = useState<Dir | 'left'>('down');
  const valid = name.trim().length >= 2 && name.trim().length <= 16;

  const look = lookOf({ gender, skin, hair, hairStyle, eyes, cloth, armor: null, cosmetics: {} });

  const pickGender = (g: 'm' | 'f') => {
    setGender(g);
    // Gợi ý kiểu tóc hợp giới tính, người chơi vẫn tự do chọn lại
    if (g === 'f' && ['short', 'spiky', 'swept'].includes(hairStyle)) setHairStyle('long');
    if (g === 'm' && ['long', 'twintails', 'ponytail', 'bun'].includes(hairStyle)) setHairStyle('short');
  };

  const DIRS: (Dir | 'left')[] = ['down', 'left', 'up', 'side'];
  const turn = (k: number) => setDir(DIRS[(DIRS.indexOf(dir) + k + 4) % 4]);

  const randomizeAll = () => {
    const g: 'm' | 'f' = Math.random() < 0.5 ? 'm' : 'f';
    setGender(g);
    const validStyles =
      g === 'f'
        ? HAIR_STYLES.filter((h) => ['long', 'twintails', 'ponytail', 'bun', 'bob'].includes(h.id))
        : HAIR_STYLES.filter((h) => ['short', 'spiky', 'swept', 'bob'].includes(h.id));
    const randomStyle = validStyles[Math.floor(Math.random() * validStyles.length)]?.id ?? 'short';
    setHairStyle(randomStyle);
    setHair(Math.floor(Math.random() * HAIR_COLORS.length));
    setSkin(Math.floor(Math.random() * SKIN_TONES.length));
    setEyes(Math.floor(Math.random() * EYE_COLORS.length));
    setCloth(Math.floor(Math.random() * CLOTH_COLORS.length));
    const names = SUGGEST[g];
    setName(names[Math.floor(Math.random() * names.length)]);
  };

  const pickRandomName = () => {
    const names = SUGGEST[gender];
    const curIdx = names.indexOf(name);
    let nextIdx = Math.floor(Math.random() * names.length);
    if (nextIdx === curIdx) nextIdx = (curIdx + 1) % names.length;
    setName(names[nextIdx]);
  };

  const start = async () => {
    const success = act((g) => {
      const msg = createProfile(g, { name, gender, hair, hairStyle, skin, eyes, cloth });
      g.lastTick = Date.now();
      return msg;
    });
    if (success) {
      useGame.getState().saveNow();
      if (ONLINE && useOnline.getState().status === 'in') {
        try {
          await pushAll();
        } catch (e) {
          console.warn('[CharacterCreate] Lỗi đẩy dữ liệu:', e);
        }
      }
      onDone();
    }
  };

  return (
    <div className="title-screen cc">
      <div className="title-stars" />
      <div className="cc-box wide compact">
        <div className="cc-header">
          <div className="cc-title-badge">
            <span className="cc-badge-icon">⚔️</span>
            <h2>TẠO NHÂN VẬT</h2>
            <span className="cc-badge-icon">⚔️</span>
          </div>
        </div>

        <div className="cc-layout">
          {/* Cột trái: Sân khấu xem trước */}
          <div className="cc-stage-panel">
            <div className="cc-stage-viewport">
              <div className="cc-pedestal-glow" />
              <div className="cc-pedestal-base" />
              <AvatarView look={look} scale={5} dir={dir} walk />
            </div>

            <div className="cc-stage-actions">
              <button type="button" className="cc-turn-btn" onClick={() => turn(-1)} title="Xoay trái">
                ⟲
              </button>
              <button type="button" className="cc-random-btn" onClick={randomizeAll} title="Ngẫu nhiên diện mạo">
                🎲 Ngẫu nhiên
              </button>
              <button type="button" className="cc-turn-btn" onClick={() => turn(1)} title="Xoay phải">
                ⟳
              </button>
            </div>
          </div>

          {/* Cột phải: Biểu mẫu tùy biến */}
          <div className="cc-form-panel">
            {/* Giới tính */}
            <div className="cc-section">
              <div className="cc-gender-selector">
                <button
                  type="button"
                  className={`cc-gender-btn male ${gender === 'm' ? 'on' : ''}`}
                  onClick={() => pickGender('m')}
                >
                  <span className="cc-gender-icon">👦</span>
                  <span className="cc-gender-text">Nam</span>
                  {gender === 'm' && <span className="cc-check-dot">✓</span>}
                </button>
                <button
                  type="button"
                  className={`cc-gender-btn female ${gender === 'f' ? 'on' : ''}`}
                  onClick={() => pickGender('f')}
                >
                  <span className="cc-gender-icon">👧</span>
                  <span className="cc-gender-text">Nữ</span>
                  {gender === 'f' && <span className="cc-check-dot">✓</span>}
                </button>
              </div>
            </div>

            {/* Kiểu tóc */}
            <div className="cc-section">
              <div className="cc-section-header">
                <span className="cc-section-title">Kiểu tóc</span>
                <span className="cc-section-current">
                  {HAIR_STYLES.find((h) => h.id === hairStyle)?.name}
                </span>
              </div>
              <div className="cc-styles-grid">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`cc-style-btn ${hairStyle === h.id ? 'on' : ''}`}
                    onClick={() => setHairStyle(h.id)}
                  >
                    <div className="cc-style-avatar">
                      <AvatarView
                        look={lookOf({
                          gender,
                          skin,
                          hair,
                          hairStyle: h.id,
                          eyes,
                          cloth,
                          armor: null,
                          cosmetics: {},
                        })}
                        scale={1.9}
                        head
                      />
                    </div>
                    <span className="cc-style-name">{h.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng màu */}
            <div className="cc-section">
              <div className="cc-palette-card">
                <div className="cc-palette-row">
                  <div className="cc-palette-label">
                    <span className="cc-palette-icon">💇</span>
                    <span>Màu tóc</span>
                  </div>
                  <Swatches colors={HAIR_COLORS} labels={COLOR_NAMES.hair} value={hair} onPick={setHair} />
                </div>

                <div className="cc-palette-row">
                  <div className="cc-palette-label">
                    <span className="cc-palette-icon">👤</span>
                    <span>Màu da</span>
                  </div>
                  <Swatches colors={SKIN_TONES} labels={COLOR_NAMES.skin} value={skin} onPick={setSkin} />
                </div>

                <div className="cc-palette-row">
                  <div className="cc-palette-label">
                    <span className="cc-palette-icon">👁️</span>
                    <span>Màu mắt</span>
                  </div>
                  <Swatches colors={EYE_COLORS} labels={COLOR_NAMES.eyes} value={eyes} onPick={setEyes} />
                </div>

                <div className="cc-palette-row">
                  <div className="cc-palette-label">
                    <span className="cc-palette-icon">👕</span>
                    <span>Trang phục</span>
                  </div>
                  <Swatches colors={CLOTH_COLORS} labels={COLOR_NAMES.cloth} value={cloth} onPick={setCloth} />
                </div>
              </div>
            </div>

            {/* Đặt tên nhân vật */}
            <div className="cc-section">
              <div className="cc-section-header">
                <span className="cc-section-title">Tên nhân vật</span>
                <span className={`cc-char-count ${valid ? 'valid' : 'invalid'}`}>
                  {name.trim().length} / 16 ký tự
                </span>
              </div>
              <div className="cc-name-input-group">
                <input
                  type="text"
                  className="cc-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && valid && start()}
                  maxLength={16}
                  placeholder="Nhập tên nhân vật (2 – 16 ký tự)..."
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="cc-name-dice"
                  onClick={pickRandomName}
                  title="Chọn tên ngẫu nhiên"
                >
                  🎲
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Nút bắt đầu & Ghi chú */}
        <div className="cc-footer">
          <button
            type="button"
            className="cc-start-btn"
            disabled={!valid}
            onClick={start}
          >
            <span className="cc-start-icon">⚔️</span>
            <span>BẮT ĐẦU PHIÊU LƯU</span>
            <span className="cc-start-icon">⚔️</span>
          </button>
          <div className="cc-hint">
            <span className="cc-hint-icon">💡</span>
            <span>Sau này có thể tự do thay đổi trang phục, kiểu tóc tại Khu Mua Sắm.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
