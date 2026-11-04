import { useEffect, useState } from 'react';
import { NPC_LOOKS, lookOf } from './art/avatar';
import { armorIconURL, weaponIconURL } from './art/rodArt';
import { ONLINE } from './services/config';
import { initOnline, useOnline } from './services/online';
import { loginState } from './game/logic/meta';
import { fmt, fmtTime } from './game/utils';
import { useGame } from './store';
import { AvatarView } from './ui/AvatarView';
import { Modal, Toasts } from './ui/common';
import { Controls } from './ui/Controls';
import { AuthPanel } from './ui/AuthPanel';
import { CharacterCreate } from './ui/CharacterCreate';
import { Hotbar } from './ui/Hotbar';
import { Hud } from './ui/Hud';
import { PanelHost } from './ui/PanelHost';
import { LoginModal } from './ui/QuestsView';
import { PhaserGame } from './world/PhaserGame';
import { unlockAudio } from './world/sfx';

export default function App() {
  const [started, setStarted] = useState(false);
  const welcome = useGame((s) => s.welcome);
  const dismissWelcome = useGame((s) => s.dismissWelcome);
  // tính lúc vào game (bản online có thể vừa tải save khác từ máy chủ)
  const [showLogin, setShowLogin] = useState(false);
  const begin = () => {
    setShowLogin(loginState(useGame.getState().game, Date.now()).canClaim);
    setStarted(true);
  };

  useEffect(() => {
    const id = setInterval(() => useGame.getState().tick(), 1000);
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      clearInterval(id);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);
  useEffect(() => void initOnline(), []);

  const created = useGame((s) => s.game.profile.created);
  const [creating, setCreating] = useState(false);
  // bản online: đăng nhập xong (hoặc còn phiên cũ) → có nhân vật thì vào thẳng thế giới, chưa có thì sang màn tạo nhân vật
  const signedIn = useOnline((s) => s.status === 'in');
  useEffect(() => {
    if (!ONLINE || !signedIn || started) return;
    if (created) begin();
    else setCreating(true);
  }, [signedIn, created, started]);
  if (creating && !started) return <CharacterCreate onDone={begin} />;
  if (!started) return <TitleScreen onStart={() => (created ? begin() : setCreating(true))} />;

  return (
    <div className="app">
      <PhaserGame />
      <Hud />
      <Controls />
      <Hotbar />
      <PanelHost />
      <Toasts />

      {welcome ? (
        <Modal title="Chào mừng trở lại! 👋" onClose={dismissWelcome}>
          <p>
            Bạn đã vắng mặt <b>{fmtTime(welcome.away)}</b>.
          </p>
          <ul className="plain-list">
            {welcome.gold >= 1 && (
              <li>
                ⚙️ Cối xay gió đã làm ra <b>🪙 {fmt(welcome.gold)}</b>
              </li>
            )}
            {welcome.crops > 0 && (
              <li>
                🌾 <b>{welcome.crops}</b> ô ruộng đã chín
              </li>
            )}
            {welcome.missions > 0 && (
              <li>
                ⚔️ <b>{welcome.missions}</b> đội đã trở về
              </li>
            )}
            {welcome.gold < 1 && <li>💡 Xây Cối xay gió để kiếm vàng cả khi tắt game!</li>}
          </ul>
          <button className="btn block" onClick={dismissWelcome}>
            Vào làng
          </button>
        </Modal>
      ) : (
        showLogin && <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

const HERO_DRAGON_LOOK = lookOf({
  gender: 'm',
  skin: 0,
  hair: 4,
  hairStyle: 'spiky',
  eyes: 4,
  cloth: 1,
  armor: 'dragon_armor',
  cosmetics: {},
});

const HERO_VALKYRIE_LOOK = lookOf({
  gender: 'f',
  skin: 0,
  hair: 2,
  hairStyle: 'long',
  eyes: 1,
  cloth: 0,
  armor: 'valkyrie_armor',
  cosmetics: {},
});

function TitleScreen({ onStart }: { onStart: () => void }) {
  const hasSave = useGame((s) => s.game.stats.goldEarned > 0 || s.game.player.level > 1);
  // bản online: phải đăng nhập (và tải xong tiến trình) mới vào được
  const ready = useOnline((s) => !ONLINE || s.status === 'in');
  return (
    <div className="title-screen" onClick={() => ready && onStart()}>
      {/* ---- Lớp bầu trời đêm hoàng hôn, trăng rằm, sao lấp lánh & đom đóm */}
      <div className="title-sky-glow" />
      <div className="title-stars" />
      <div className="title-moon">
        <div className="title-moon-crater c1" />
        <div className="title-moon-crater c2" />
      </div>
      <div className="title-cloud c1" />
      <div className="title-cloud c2" />
      <div className="title-cloud c3" />
      <div className="title-fireflies">
        <i className="ff f1" />
        <i className="ff f2" />
        <i className="ff f3" />
        <i className="ff f4" />
        <i className="ff f5" />
        <i className="ff f6" />
        <i className="ff f7" />
        <i className="ff f8" />
      </div>

      {/* ---- Lớp phong cảnh nông trại & đỉnh núi rồng phía chân trời */}
      <div className="title-landscape" aria-hidden="true">
        <div className="title-mountains" />
        <div className="title-hills" />
        <div className="title-farm-sil">
          <div className="title-windmill">
            <div className="wm-tower" />
            <div className="wm-blades">
              <span />
              <span />
            </div>
          </div>
          <div className="title-barn">
            <div className="barn-roof" />
            <div className="barn-body">
              <i className="barn-win" />
              <i className="barn-win" />
            </div>
          </div>
        </div>
        <div className="title-foreground" />
      </div>

      {/* ---- Bố cục trung tâm 2 cột (Hero Showcase + Cổng Đăng Nhập) */}
      <div className="title-layout" onClick={(e) => e.stopPropagation()}>
        <div className="title-hero-col">
          <div className="title-crest-row">
            <div className="title-medallion">
              <img src={weaponIconURL('holy_sword')} alt="" />
            </div>
            <div className="title-medallion main">
              <img src={armorIconURL('dragon_armor')} alt="" />
            </div>
            <div className="title-medallion">
              <img src={weaponIconURL('galaxy_emperor')} alt="" />
            </div>
          </div>

          <span className="title-genre-pill">✨ PIXEL RPG · NÔNG TRẠI & SĂN BOSS</span>

          <h1 className="title-main-heading">
            NÔNG TRẠI
            <br />
            <span>MẠO HIỂM</span>
          </h1>

          <p className="title-tagline">🌾 Cày ruộng · ⚔️ Chém quái · 🛡️ Rèn thần binh · 🏆 Đua top</p>

          {/* Sân khấu nhân vật Pixel chuyển động trực tiếp */}
          <div className="title-diorama">
            <div className="diorama-char side">
              <AvatarView look={NPC_LOOKS.folk_farmer} scale={3} walk />
              <span>🌾 Điền Chủ</span>
            </div>
            <div className="diorama-char main">
              <div className="diorama-aura" />
              <AvatarView look={HERO_DRAGON_LOOK} scale={4} walk />
              <img className="diorama-weapon" src={weaponIconURL('dragon_blade')} alt="" />
              <span>🐲 Long Hoàng Chiến Sĩ</span>
            </div>
            <div className="diorama-char side">
              <AvatarView look={HERO_VALKYRIE_LOOK} scale={3} walk />
              <span>👼 Thánh Nữ Valkyrie</span>
            </div>
          </div>
        </div>

        <div className="title-auth-col">
          {ONLINE && <AuthPanel onStartGame={onStart} />}
          {ready && (
            <button
              className="btn gold title-btn"
              onClick={(e) => {
                e.stopPropagation();
                unlockAudio();
                onStart();
              }}
            >
              ▶ {hasSave ? 'Tiếp Tục Hành Trình' : 'Bắt Đầu Phiêu Lưu'}
            </button>
          )}
          <div className="title-footer-meta">
            <span>{ONLINE ? '☁️ Bản Online · Đua Top Cùng Bạn Bè · v0.4' : '📦 Bản Offline · v0.4'}</span>
          </div>
        </div>
          {/* 4 điểm nhấn tính năng game */}
          <div className="title-features">
            <div className="t-feat">
              <b>🍓 Nông Trại Thực Tế</b>
              <small>Tưới nước, bón phân, 10 loại quả ngọt</small>
            </div>
            <div className="t-feat">
              <b>🐄 Chăn Nuôi & Thú Y</b>
              <small>Cho ăn, tiêm phòng, thu hoạch sữa & lông</small>
            </div>
            <div className="t-feat">
              <b>🛡️ Chiến Giáp & Thần Binh</b>
              <small>Mở rương Gacha, săn Boss Cấm Địa</small>
            </div>
            <div className="t-feat">
              <b>🏆 BXH Liên Server</b>
              <small>Lưu đám mây tự động, đua top thời gian thực</small>
            </div>
          </div>
      </div>
    </div>
  );
}
