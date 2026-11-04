import { useEffect, useState } from 'react';
import {
  clearGiftcodeFail,
  getGiftcodeLockStatus,
  normalizeCode,
  recordGiftcodeFail,
} from '../game/logic/giftcode';
import { ONLINE } from '../services/config';
import { syncWallet } from '../services/fishingApi';
import { db, useOnline } from '../services/online';
import { useGame } from '../store';
import { bus } from '../world/bus';

export function GiftcodeView() {
  const act = useGame((s) => s.act);
  const toast = useGame((s) => s.toast);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockSec, setLockSec] = useState(() => getGiftcodeLockStatus().remainingSec);

  useEffect(() => () => bus.emit('typing', false), []);

  // Đếm ngược thời gian khóa chống dò mã
  useEffect(() => {
    if (lockSec <= 0) return;
    const timer = setInterval(() => {
      const { remainingSec } = getGiftcodeLockStatus();
      setLockSec(remainingSec);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSec]);

  const redeem = async () => {
    if (!code.trim() || loading) return;

    // Kiểm tra khóa chống spam / brute-force
    const lock = getGiftcodeLockStatus();
    if (lock.locked) {
      toast(`🔒 Tạm khóa nhập mã, vui lòng đợi ${lock.remainingSec}s!`, 'err');
      setLockSec(lock.remainingSec);
      return;
    }

    setLoading(true);
    try {
      const isOnline = ONLINE && !!db;
      const isLoggedIn = isOnline && useOnline.getState().status === 'in';
      const clean = normalizeCode(code);

      // Gọi RPC bảo mật trực tiếp trên Database máy chủ
      if (isLoggedIn && db) {
        const { data, error } = await db.rpc('redeem_giftcode', { p_code: clean });
        if (!error && data && data.ok) {
          clearGiftcodeFail();
          setLockSec(0);
          act((g) => {
            if (!g.redeemed.includes(data.code_id)) g.redeemed.push(data.code_id);
            g.gold = (g.gold || 0) + (data.gold || 0);
            g.gems = (g.gems || 0) + (data.gems || 0);
          });
          await syncWallet({ quiet: true });
          setCode('');
          toast(data.message || '🎁 Nhận quà thành công!', 'ok');
          return;
        }

        if (error) {
          const msg = error.message || '';
          if (/1 lần duy nhất/i.test(msg)) {
            toast('❌ Mỗi tài khoản chỉ được sử dụng mã code này 1 lần duy nhất!', 'err');
            return;
          }
          if (/quá nhanh/i.test(msg)) {
            toast('⏳ ' + msg, 'err');
            return;
          }
          if (/khóa|nhập sai/i.test(msg)) {
            recordGiftcodeFail();
            const lk = getGiftcodeLockStatus();
            setLockSec(lk.remainingSec);
            toast('🔒 ' + msg, 'err');
            return;
          }
          if (/không tồn tại|không chính xác|hết hạn|hết lượt/i.test(msg)) {
            recordGiftcodeFail();
            const lk = getGiftcodeLockStatus();
            setLockSec(lk.remainingSec);
            toast('❌ ' + msg, 'err');
            return;
          }
          toast('❌ ' + msg, 'err');
          return;
        }
      } else if (isOnline && !isLoggedIn) {
        toast('⚠️ Mã quà tặng được lưu và bảo vệ trên Database, vui lòng đăng nhập tài khoản để nhận quà!', 'err');
        return;
      }

      // Nếu không có kết nối DB
      toast('❌ Không thể kết nối với máy chủ Database để xác thực mã giftcode!', 'err');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockSec > 0;

  return (
    <div className="giftcode-view" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="muted small" style={{ margin: 0 }}>
          Nhập mã Giftcode quà tặng để nhận vàng, ngọc hoặc trang bị đặc biệt:
        </p>

        {isLocked && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🔒</span>
            <span>
              Bạn đã nhập sai nhiều lần liên tiếp. Hệ thống tạm khóa trong <strong>{lockSec}s</strong> để chống dò mã!
            </span>
          </div>
        )}

        <div className="row" style={{ gap: 8 }}>
          <input
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 15,
              opacity: isLocked ? 0.6 : 1,
              cursor: isLocked ? 'not-allowed' : 'text',
            }}
            value={code}
            disabled={isLocked || loading}
            onChange={(e) => setCode(e.target.value)}
            onFocus={() => bus.emit('typing', true)}
            onBlur={() => bus.emit('typing', false)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter' && !isLocked && !loading) redeem();
            }}
            placeholder={isLocked ? `Đang khóa (${lockSec}s)...` : 'Nhập mã giftcode tại đây...'}
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <button
            className="btn gold"
            style={{
              padding: '0 18px',
              whiteSpace: 'nowrap',
              opacity: isLocked || loading ? 0.6 : 1,
              cursor: isLocked || loading ? 'not-allowed' : 'pointer',
            }}
            disabled={isLocked || loading}
            onClick={redeem}
          >
            {loading ? 'Đang kiểm tra...' : isLocked ? `🔒 ${lockSec}s` : '🎁 Nhận quà'}
          </button>
        </div>
        <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>
          💡 <strong>Bảo mật:</strong> Mỗi tài khoản chỉ được sử dụng mã code đúng 1 lần duy nhất.
          <br />
          🛡️ Hệ thống tự động mã hóa & khóa chống dò mã (Brute-force) nếu nhập sai liên tiếp.
        </p>
      </div>
    </div>
  );
}
