import { createClient, type User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { myWeeklyScores, remote, type RemoteRow } from '../game/logic/remote';
import { syncTopTitles } from '../game/logic/ranks';
import { weekKey } from '../game/utils';
import { useGame } from '../store';
import { EMAIL_DOMAIN, ONLINE, SUPABASE_KEY, SUPABASE_URL } from './config';
import { refreshChest, resetChest, syncWallet } from './fishingApi';

// Bản online (Supabase): đăng nhập bằng tên + mật khẩu, lưu tiến trình lên mây, đẩy điểm lên BXH chung
// và tải điểm của mọi người về. Người chơi không thấy nhau trong thế giới — chỉ đua top với nhau.
// Bảng dữ liệu & quyền: supabase/schema.sql. Cách dựng: ONLINE.md.

export const db = ONLINE ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/** chủ của save đang nằm trong máy — để 2 tài khoản dùng chung 1 máy không lấy nhầm tiến trình của nhau */
const OWNER_KEY = 'nong-trai-mao-hiem:owner';
/** lưu số lần đăng nhập sai liên tiếp để chống dò mật khẩu */
const FAIL_KEY = 'nong-trai-mao-hiem:auth-fail';
/** đồng bộ điểm + save mỗi chừng này */
const SYNC_MS = 30_000;
const PASS_MAX = 72;

export const USERNAME_RE = /^[a-z0-9_]{3,16}$/;
const RESERVED_NAMES = new Set(['admin', 'root', 'system', 'mod', 'moderator', 'support', 'gm']);
const emailOf = (username: string) => `${username}@${EMAIL_DOMAIN}`;
const usernameOf = (u: User) => (u.user_metadata?.username as string | undefined) ?? u.email?.split('@')[0] ?? '';

interface FailRecord {
  count: number;
  until: number;
}

function readFail(): FailRecord {
  try {
    const raw = localStorage.getItem(FAIL_KEY);
    if (!raw) return { count: 0, until: 0 };
    const parsed = JSON.parse(raw) as Partial<FailRecord>;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      until: typeof parsed.until === 'number' ? parsed.until : 0,
    };
  } catch {
    return { count: 0, until: 0 };
  }
}

function writeFail(rec: FailRecord) {
  try {
    if (rec.count === 0 && rec.until === 0) localStorage.removeItem(FAIL_KEY);
    else localStorage.setItem(FAIL_KEY, JSON.stringify(rec));
  } catch {
    // bỏ qua lỗi localStorage (ẩn danh / đầy bộ nhớ)
  }
}

/** ghi nhận 1 lần thất bại; từ lần thứ 5 khóa 30s, mỗi lần sau nhân đôi tối đa 15 phút */
export function recordAuthFail(): number {
  const cur = readFail();
  const count = cur.count + 1;
  const lockMs = count < 5 ? 0 : Math.min(15 * 60_000, 30_000 * 2 ** (count - 5));
  const until = lockMs > 0 ? Date.now() + lockMs : 0;
  writeFail({ count, until });
  useOnline.setState({ lockedUntil: until });
  return until;
}

function clearAuthFail() {
  writeFail({ count: 0, until: 0 });
  useOnline.setState({ lockedUntil: 0 });
}

type Status = 'offline' | 'checking' | 'out' | 'loading' | 'in';

interface OnlineState {
  status: Status;
  username: string;
  error: string;
  /** lần cuối tải BXH thành công (Date.now) */
  syncedAt: number;
  /** thời điểm mở khóa đăng nhập (Date.now) */
  lockedUntil: number;
}

export const useOnline = create<OnlineState>()(() => ({
  status: ONLINE ? 'checking' : 'offline',
  username: '',
  error: '',
  syncedAt: 0,
  lockedUntil: readFail().until,
}));

const ERRORS: [RegExp, string][] = [
  [/captcha/i, 'Xác minh chống bot thất bại, thử lại'],
  [/invalid login credentials/i, 'Sai tên đăng nhập hoặc mật khẩu'],
  [/already registered|already exists/i, 'Tên đăng nhập này đã có người dùng'],
  [/at least \d+|password should/i, 'Mật khẩu chưa đủ mạnh (≥ 8 ký tự, gồm chữ & số)'],
  // trigger trong database từ chối (tên giữ chỗ / sai định dạng) — Supabase chỉ trả câu chung chung
  [/database error saving new user/i, 'Tên đăng nhập không hợp lệ hoặc đã bị giữ chỗ'],
  [/email not confirmed/i, 'Máy chủ đang bật xác nhận email — chủ server cần tắt "Confirm email" (xem ONLINE.md)'],
  [/signups not allowed|signup.*disabled/i, 'Máy chủ đang khóa đăng ký tài khoản mới'],
  [/rate limit|too many/i, 'Thử lại quá nhiều lần, đợi một lát nhé'],
  [/failed to fetch|network/i, 'Không kết nối được máy chủ — kiểm tra mạng'],
];
const viError = (msg: string) => ERRORS.find(([re]) => re.test(msg))?.[1] ?? msg;

/** mở game: còn phiên đăng nhập cũ thì vào thẳng */
export async function initOnline() {
  if (!db) return;
  const { data } = await db.auth.getSession();
  if (data.session) await startSession(data.session.user);
  else useOnline.setState({ status: 'out' });
}

/** đăng nhập hoặc tạo tài khoản; lỗi thì ghi vào useOnline.error */
export async function login(usernameRaw: string, passwordRaw: string, create: boolean, captchaToken?: string): Promise<boolean> {
  if (!db) return false;
  const now = Date.now();
  const { until } = readFail();
  if (until > now) {
    const sec = Math.ceil((until - now) / 1000);
    useOnline.setState({ lockedUntil: until, error: `Thử sai quá nhiều lần, vui lòng đợi ${sec}s` });
    return false;
  }

  const username = usernameRaw.trim().toLowerCase().slice(0, 16);
  const password = passwordRaw.slice(0, PASS_MAX);

  if (!USERNAME_RE.test(username)) {
    useOnline.setState({ error: 'Tên đăng nhập 3–16 ký tự: chữ thường không dấu, số hoặc _' });
    return false;
  }
  if (create && RESERVED_NAMES.has(username)) {
    useOnline.setState({ error: 'Tên đăng nhập này đã được hệ thống giữ chỗ' });
    return false;
  }
  if (passwordRaw.length > PASS_MAX) {
    useOnline.setState({ error: `Mật khẩu tối đa ${PASS_MAX} ký tự` });
    return false;
  }
  if (password.length < 6) {
    useOnline.setState({ error: 'Mật khẩu cần ít nhất 6 ký tự' });
    return false;
  }

  useOnline.setState({ status: 'loading', error: '' });
  const token = captchaToken || undefined;

  if (create) {
    const res = await db.auth.signUp({
      email: emailOf(username),
      password,
      options: { data: { username }, captchaToken: token },
    });
    const alreadyExists =
      res.data.user && Array.isArray(res.data.user.identities) && res.data.user.identities.length === 0;
    if (res.error || !res.data.user || alreadyExists) {
      recordAuthFail();
      const raw = alreadyExists ? 'already registered' : res.error?.message ?? 'Đăng ký không thành công';
      useOnline.setState({ status: 'out', error: viError(raw) });
      return false;
    }
    clearAuthFail();
    // Đăng ký thành công: Đăng xuất phiên tạm thời để người dùng tự đăng nhập lại
    await db.auth.signOut();
    useOnline.setState({ status: 'out', error: '' });
    return true;
  }

  const res = await db.auth.signInWithPassword({
    email: emailOf(username),
    password,
    options: { captchaToken: token },
  });
  if (res.error || !res.data.user || !res.data.session) {
    recordAuthFail();
    useOnline.setState({ status: 'out', error: viError(res.error?.message ?? 'email not confirmed') });
    return false;
  }
  clearAuthFail();
  await startSession(res.data.user);
  return true;
}

export async function logout() {
  if (!db) return;
  if (pushDebounceTimer !== undefined) {
    window.clearTimeout(pushDebounceTimer);
    pushDebounceTimer = undefined;
  }
  try {
    await pushAll();
  } catch (e) {
    console.error('Lỗi lưu tiến trình trước khi đăng xuất:', e);
  }
  stopSync();
  await db.auth.signOut();
  remote.me = '';
  remote.weeks = {};
  remote.levels = null;
  resetChest();
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    // bỏ qua
  }
  useGame.getState().resetGame();
  useOnline.setState({ status: 'out', username: '', error: '' });
}

let user: User | null = null;

/** sau khi đăng nhập: lấy tiến trình trên mây, tải BXH, bắt đầu đồng bộ định kỳ */
async function startSession(u: User) {
  if (!db) return;
  user = u;
  const username = usernameOf(u);
  useOnline.setState({ username, error: '' });
  try {
    const store = useGame.getState();
    const userSaveKey = `nong-trai-mao-hiem:save:${u.id}`;
    let userLocalSave: any = null;
    try {
      const rawUserSave = localStorage.getItem(userSaveKey);
      if (rawUserSave) userLocalSave = JSON.parse(rawUserSave);
    } catch {}

    // Lấy bản lưu từ Supabase (nếu lỗi mạng thì dùng bản lưu trên máy, tuyệt đối không đăng xuất người chơi)
    let cloud: any = null;
    try {
      const { data: row } = await db.from('saves').select('data').eq('user_id', u.id).maybeSingle();
      cloud = row?.data;
    } catch (err) {
      console.warn('[online] không tải được save từ mây, sử dụng save trên máy:', err);
    }

    remote.me = u.id;

    // Nạp save ưu tiên:
    // 1. Bản trên mây đã có nhân vật
    if (cloud && cloud.profile?.created) {
      const localTick = userLocalSave?.lastTick ?? 0;
      const cloudTick = cloud.lastTick ?? 0;
      if (userLocalSave && userLocalSave.profile?.created && localTick > cloudTick) {
        store.loadGame(userLocalSave);
      } else {
        if (!store.loadGame(cloud)) {
          console.warn('[online] Save mây lỗi, thử load save local');
          if (userLocalSave) store.loadGame(userLocalSave);
        }
      }
    }
    // 2. Mây chưa có nhưng bản lưu riêng của tài khoản này trên máy đã có nhân vật
    else if (userLocalSave && userLocalSave.profile?.created) {
      store.loadGame(userLocalSave);
    }
    // 3. Tài khoản mới chưa có nhân vật trên mây: reset để vào màn tạo nhân vật
    else {
      store.resetGame();
    }

    try {
      localStorage.setItem(OWNER_KEY, u.id);
      localStorage.setItem(userSaveKey, JSON.stringify(store.game));
      localStorage.setItem('nong-trai-mao-hiem:save', JSON.stringify(store.game));
    } catch {
      // bỏ qua
    }

    // Vào thẳng game ngay lập tức!
    useOnline.setState({ status: 'in', username, error: '' });
    startSync();

    // Tải BXH từ server trước để đồng bộ điểm mới nhất, sau đó mới đẩy save
    void refreshBoards().then(() => {
      void pushAll();
    });
    void refreshChest({ quiet: true });
  } catch (e) {
    console.error('[online] Lỗi trong startSession:', e);
    // Nếu vẫn có user/phiên hợp lệ, cho vào game bằng save cục bộ thay vì tự động đá văng ra màn đăng nhập
    if (user) {
      useOnline.setState({ status: 'in', username, error: '' });
      startSync();
    } else {
      useOnline.setState({ status: 'out', error: viError(e instanceof Error ? e.message : String(e)) });
    }
  }
}

// ---------------------------------------------------------------- đồng bộ

let timer: number | undefined;
let lastScores = '';
let pushDebounceTimer: number | undefined;
let pushDeadline = 0;

/**
 * Đẩy save lên DB Supabase:
 * - Lưu ngay lập tức vào localStorage (0ms)
 * - Tự động debounce đẩy lên mây (mặc định 600ms) gom các thao tác thay đồ / mua đồ nhanh
 */
export function pushAllDebounced(delayMs = 600) {
  useGame.getState().saveNow();
  if (!user || !db) return;
  const targetTime = Date.now() + delayMs;
  if (pushDebounceTimer !== undefined && pushDeadline > 0 && pushDeadline <= targetTime) {
    return;
  }
  if (pushDebounceTimer !== undefined) {
    window.clearTimeout(pushDebounceTimer);
  }
  pushDeadline = targetTime;
  pushDebounceTimer = window.setTimeout(() => {
    pushDebounceTimer = undefined;
    pushDeadline = 0;
    void pushAll();
  }, Math.max(50, targetTime - Date.now()));
}

// Tự động đẩy save lên Supabase sau 4s khi có thay đổi trạng thái game
useGame.subscribe((s, prev) => {
  if (s.game === prev.game) return;
  if (user && db && s.game.profile.created) {
    pushAllDebounced(4000);
  }
});

function startSync() {
  stopSync();
  timer = window.setInterval(() => {
    void pushAll().then(refreshBoards);
  }, SYNC_MS);
}

function stopSync() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

/** đẩy save + điểm của mình lên máy chủ */
export async function pushAll() {
  if (!db || !user) return;
  const uid = user.id;
  const now = new Date().toISOString();
  const g = useGame.getState().game;
  g.lastTick = Math.max(g.lastTick || 0, Date.now());

  // Luôn sao lưu vào localStorage riêng của tài khoản này để phòng ngừa rớt mạng
  try {
    localStorage.setItem(`nong-trai-mao-hiem:save:${uid}`, JSON.stringify(g));
    localStorage.setItem('nong-trai-mao-hiem:save', JSON.stringify(g));
    localStorage.setItem(OWNER_KEY, uid);
  } catch {}

  // Chưa tạo nhân vật thì không đẩy save lên mây để tránh đè save trắng
  if (!g.profile.created) return;

  try {
    const res = await db.from('saves').upsert({ user_id: uid, data: g, updated_at: now });
    if (res.error) {
      console.warn('[online] lỗi lưu saves lên Supabase:', res.error);
    }
  } catch (e) {
    console.warn('[online] lỗi lưu saves lên Supabase:', e);
  }

  // Đồng bộ ví server & bảng xếp hạng điểm
  try {
    await syncWallet({ quiet: true });
    const name = g.profile.name;
    const weeks = myWeeklyScores(g);
    const sig = JSON.stringify([name, g.player.level, weeks]);
    if (sig === lastScores) return;
    const p1 = db.from('players').upsert({ user_id: uid, username: usernameOf(user), name, level: g.player.level, updated_at: now });
    const p2 = db
      .from('weekly_scores')
      .upsert(Object.entries(weeks).map(([wk, scores]) => ({ user_id: uid, week_key: wk, name, scores, updated_at: now })), { onConflict: 'user_id,week_key' });
    const [r1, r2] = await Promise.all([p1, p2]);
    if (r1.error || r2.error) throw r1.error ?? r2.error;
    lastScores = sig;
  } catch (e) {
    console.warn('[online] đẩy ví/điểm lỗi', e);
  }
}

/** tải điểm mọi người: tuần hiện tại + các tuần cũ mà save còn chưa chốt */
export async function refreshBoards() {
  if (!db || !user) return;
  const uid = user.id;
  const g = useGame.getState().game;
  const keys = [...new Set([weekKey(Date.now()), g.week.key, g.weekStats.key, g.fishing.week.key])];
  try {
    const [w, p] = await Promise.all([
      db.from('weekly_scores').select('user_id,week_key,name,scores').in('week_key', keys).limit(2000),
      db.from('players').select('user_id,name,level').order('level', { ascending: false }).limit(500),
    ]);
    if (w.error || p.error) throw w.error ?? p.error;
    const weeks: Record<string, RemoteRow[]> = Object.fromEntries(keys.map((k) => [k, []]));
    for (const r of w.data) weeks[r.week_key]?.push({ id: r.user_id, name: r.name, scores: r.scores ?? {} });
    remote.weeks = weeks;
    remote.levels = p.data.map((r) => ({ id: r.user_id, name: r.name, scores: { level: r.level } }));

    // Tự động đồng bộ điểm câu cá tuần từ server về state máy nếu điểm trên server cao hơn
    const myFishRow = weeks[g.fishing.week.key]?.find((r) => r.id === uid);
    if (myFishRow?.scores?.fish !== undefined && myFishRow.scores.fish > g.fishing.week.points) {
      g.fishing.week.points = myFishRow.scores.fish;
    }
    if (myFishRow?.scores?.fish_big !== undefined && myFishRow.scores.fish_big > (g.fishing.biggest?.cm ?? 0)) {
      if (!g.fishing.biggest) g.fishing.biggest = { id: 'fish_perch', cm: myFishRow.scores.fish_big };
      else g.fishing.biggest.cm = myFishRow.scores.fish_big;
    }
    syncTopTitles(g, Date.now());

    useOnline.setState({ syncedAt: Date.now() });
  } catch (e) {
    console.warn('[online] tải BXH lỗi', e);
  }
}

if (db) {
  const flushSync = () => {
    if (pushDebounceTimer !== undefined) {
      window.clearTimeout(pushDebounceTimer);
      pushDebounceTimer = undefined;
    }
    void pushAll();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSync();
  });
  window.addEventListener('pagehide', flushSync);
  window.addEventListener('beforeunload', flushSync);
}
