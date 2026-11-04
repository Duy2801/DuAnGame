import { useEffect, useRef, useState } from 'react';
import { heroLook } from '../art/heroLook';
import { fmt } from '../game/utils';
import { ONLINE, TURNSTILE_SITE_KEY } from '../services/config';
import { login, logout, pushAll, refreshBoards, useOnline } from '../services/online';
import { useGame } from '../store';
import { AvatarView } from './AvatarView';
import { Turnstile, type TurnstileHandle } from './Turnstile';

/** chú thích nguồn dữ liệu dưới mỗi bảng xếp hạng */
export function BoardSource({ offline }: { offline: string }) {
  const syncedAt = useOnline((s) => s.syncedAt);
  const [busy, setBusy] = useState(false);
  if (!ONLINE) return <p className="muted small center">{offline}</p>;
  return (
    <p className="muted small center online-note">
      <i className="online-dot" /> Người chơi thật · cập nhật {syncedAt ? new Date(syncedAt).toLocaleTimeString('vi-VN') : '…'} ·
      <button
        className="link-btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await pushAll();
          await refreshBoards();
          setBusy(false);
        }}
      >
        {busy ? 'đang tải…' : '🔄 làm mới'}
      </button>
    </p>
  );
}

/** Khối tài khoản & đăng xuất sang trọng trong Cài đặt */
export function AccountSection() {
  const username = useOnline((s) => s.username);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (
      !confirm(
        `Đăng xuất khỏi tài khoản "${username || 'Người chơi'}"?\n\nToàn bộ tiến trình chơi của bạn sẽ được lưu an toàn lên đám mây máy chủ. Bạn có thể đăng nhập lại bất kỳ lúc nào để tiếp tục chơi bình thường.`
      )
    ) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout();
      location.reload();
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
      alert('Đã xảy ra lỗi khi đăng xuất, vui lòng thử lại.');
    }
  };

  if (!ONLINE) {
    return (
      <div className="account-card">
        <div className="account-card-header">
          <span className="account-card-user">📦 <b>Bản Offline</b></span>
        </div>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Tiến trình chỉ lưu trên trình duyệt của máy này.
        </p>
      </div>
    );
  }

  return (
    <div className="account-card">
      <div className="account-card-header">
        <div className="account-card-user">
          <span className="account-card-badge">👤 TÀI KHOẢN</span>
          <b className="account-card-name">{username || 'Người chơi'}</b>
        </div>
        <span className="account-card-sync">
          <i className="online-dot" /> Tự lưu đám mây
        </span>
      </div>

      <div className="account-card-note">
        💡 <b>Chơi lại từ đầu?</b> Hãy bấm <b>Đăng xuất</b> rồi chọn <b>Tạo tài khoản</b> mới. Tài khoản hiện tại vẫn được bảo lưu an toàn 100%!
      </div>

      <button
        type="button"
        className="btn danger block account-card-logout-btn"
        disabled={loggingOut}
        onClick={handleLogout}
      >
        {loggingOut ? '⏳ Đang lưu & đăng xuất...' : '🚪 Đăng xuất tài khoản'}
      </button>
    </div>
  );
}

export const AccountLine = AccountSection;

/** Khung đăng nhập / tạo tài khoản trên màn hình tiêu đề (chỉ hiện ở bản online) */
export function AuthPanel({ onStartGame }: { onStartGame?: () => void }) {
  const { status, username, error, lockedUntil } = useOnline();
  const game = useGame((s) => s.game);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [localErr, setLocalErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    setNow(Date.now());
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  if (status === 'checking') {
    return (
      <div className="auth-box auth-loading-card">
        <div className="auth-spinner" />
        <b>Đang kết nối cổng máy chủ…</b>
        <small>Đang đồng bộ dữ liệu mạo hiểm giả từ đám mây</small>
      </div>
    );
  }

  if (status === 'in') {
    return (
      <div className="auth-box auth-pass-card" onClick={(e) => e.stopPropagation()}>
        <span className="auth-corner tl" />
        <span className="auth-corner tr" />
        <span className="auth-corner bl" />
        <span className="auth-corner br" />
        <div className="auth-server-pill">
          <i className="online-dot" /> Đã Kết Nối Máy Chủ · Lưu Đám Mây
        </div>
        <div className="auth-pass-body">
          <div className="auth-pass-avatar">
            <AvatarView look={heroLook(game)} scale={3} walk />
          </div>
          <div className="auth-pass-info">
            <small className="auth-pass-tag">🪪 THẺ MẠO HIỂM GIẢ</small>
            <b>{game.profile.name || username}</b>
            <span>Tài khoản: @{username}</span>
            <div className="auth-pass-stats">
              <span>⭐ Lv {game.player.level}</span>
              <span>🪙 {fmt(game.gold)}</span>
              <span>💎 {fmt(game.gems)}</span>
            </div>
          </div>
        </div>
        <div className="auth-pass-actions">
          {onStartGame && (
            <button type="button" className="btn gold block auth-submit-btn" onClick={onStartGame}>
              ⚔️ Vào Thế Giới Ngay
            </button>
          )}
          <button
            type="button"
            className="auth-logout-btn"
            onClick={(e) => {
              e.stopPropagation();
              void logout().then(() => location.reload());
            }}
          >
            🚪 Đổi tài khoản / Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  const busy = status === 'loading';
  const remainSec = lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
  const needCaptcha = Boolean(TURNSTILE_SITE_KEY);
  const minPassLen = 6;

  const submit = async () => {
    setLocalErr('');
    setSuccessMsg('');
    if (remainSec > 0) return;

    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return setLocalErr('Vui lòng nhập tên tài khoản');
    if (pass.length < minPassLen) return setLocalErr('Mật khẩu cần ít nhất 6 ký tự');

    if (needCaptcha && !captchaToken) {
      return setLocalErr('Vui lòng hoàn thành xác minh chống bot');
    }
    const tok = captchaToken;
    try {
      if (mode === 'signup') {
        const ok = await login(cleanName, pass, true, tok);
        if (ok) {
          setMode('login');
          setPass('');
          setSuccessMsg('🎉 Tạo tài khoản thành công! Hãy đăng nhập để bắt đầu.');
        }
      } else {
        await login(cleanName, pass, false, tok);
      }
    } finally {
      turnstileRef.current?.reset();
    }
  };

  return (
    <form
      className="auth-box"
      autoComplete="off"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <span className="auth-corner tl" />
      <span className="auth-corner tr" />
      <span className="auth-corner bl" />
      <span className="auth-corner br" />

      <div className="auth-header">
        <h3>🏰 Cổng Hội Mạo Hiểm Giả</h3>
        <p>{mode === 'login' ? 'Đăng nhập để tải lại nông trại & nhân vật của bạn' : 'Khởi tạo hồ sơ mạo hiểm giả mới trong 10 giây'}</p>
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'on' : ''}
          onClick={() => {
            setMode('login');
            setLocalErr('');
            setSuccessMsg('');
          }}
        >
          🔑 Đăng nhập
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'on' : ''}
          onClick={() => {
            setMode('signup');
            setLocalErr('');
            setSuccessMsg('');
          }}
        >
          ✨ Tạo tài khoản
        </button>
      </div>

      <label className="auth-field">
        <span className="auth-label">
          <span>👤 Tên tài khoản</span>
          <small>{name.length}/16</small>
        </span>
        <div className="auth-input-wrap">
          <i className="auth-field-ico">🪪</i>
          <input
            placeholder="Nhập tên tài khoản…"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().slice(0, 16))}
            maxLength={16}
          />
        </div>
      </label>

      <label className="auth-field">
        <span className="auth-label">
          <span>🔒 Mật khẩu bảo mật</span>
          <small>Tối thiểu 6 ký tự</small>
        </span>
        <div className="auth-input-wrap">
          <i className="auth-field-ico">🗝️</i>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Nhập mật khẩu…"
            autoComplete="new-password"
            value={pass}
            onChange={(e) => setPass(e.target.value.slice(0, 72))}
            maxLength={72}
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPass((v) => !v)}
            title={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            {showPass ? '🙈' : '👁'}
          </button>
        </div>
      </label>

      <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />

      <div className="auth-feedback-slot">
        {remainSec > 0 ? (
          <p className="auth-feedback-msg err">⏳ Thử sai quá nhiều lần, đợi {remainSec}s</p>
        ) : localErr || error ? (
          <p className="auth-feedback-msg err">⚠️ {localErr || error}</p>
        ) : successMsg ? (
          <p className="auth-feedback-msg ok">{successMsg}</p>
        ) : null}
      </div>

      <button
        className="btn gold block auth-submit-btn"
        disabled={busy || remainSec > 0 || !name.trim() || pass.length < minPassLen || (needCaptcha && !captchaToken)}
      >
        {busy
          ? '⏳ Đang xử lý…'
          : remainSec > 0
            ? `🔒 Tạm khóa ${remainSec}s…`
            : mode === 'login'
              ? '⚔️ Đăng Nhập Vào Game'
              : '✨ Đăng Ký Tài Khoản'}
      </button>

      <div className="auth-perks">
        <span>☁️ Lưu đám mây</span>
        <span>🔄 Đổi máy không mất đồ</span>
        <span>🏆 Đua BXH toàn server</span>
      </div>
    </form>
  );
}
