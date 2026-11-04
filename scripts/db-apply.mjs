// Áp supabase/schema.sql rồi supabase/fishing.sql lên database thật (mỗi file 1 transaction),
// rồi in bảng/quyền/trigger/RPC/tỉ lệ cá để kiểm tra.
// Dùng: npm run db:apply   (đọc DIRECT_URL, không có thì DATABASE_URL, trong .env.local)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    env[m[1]] = v;
  }
  return env;
}

const env = { ...readEnv(join(root, '.env.local')), ...process.env };
const url = env.DIRECT_URL || env.DATABASE_URL;
if (!url) {
  console.error('Thiếu DIRECT_URL (hoặc DATABASE_URL) trong .env.local');
  process.exit(1);
}
/** không bao giờ in mật khẩu / chuỗi kết nối */
const redact = (s) => String(s).split(url).join('<db-url>').replace(/postgres(ql)?:\/\/[^\s@]+@/gi, 'postgres://***@');

const FILES = ['schema.sql', 'fishing.sql', 'titles.sql'];
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
client.on('notice', (n) => console.log(`NOTICE: ${n.message}`));

try {
  await client.connect();
  const host = new URL(url).hostname;
  console.log(`Kết nối: ${host}`);
  for (const file of FILES) {
    const sql = readFileSync(join(root, 'supabase', file), 'utf8');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('commit');
      console.log(`✔ Đã áp ${file} (1 transaction)`);
    } catch (e) {
      await client.query('rollback').catch(() => {});
      if (e && typeof e === 'object') e.message = `[${file}] ${e.message}`;
      throw e;
    }
  }
  console.log('');

  const tables = await client.query(`
    select c.relname as table, c.relrowsecurity as rls,
           (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)::int as policies,
           coalesce((select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants g
                     where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'authenticated'), '-') as authenticated,
           coalesce((select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants g
                     where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'anon'), '-') as anon
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by 1`);
  console.log('== Bảng (public)');
  console.table(tables.rows);

  const policies = await client.query(`
    select tablename as table, policyname as policy, cmd, roles::text as roles
    from pg_policies where schemaname = 'public' order by 1, 3, 2`);
  console.log('== Policies');
  console.table(policies.rows);

  const triggers = await client.query(`
    select n.nspname || '.' || c.relname as table, t.tgname as trigger, p.proname as function,
           case when t.tgtype & 2 = 2 then 'BEFORE' else 'AFTER' end as timing,
           concat_ws('/', case when t.tgtype & 4 = 4 then 'INSERT' end,
                          case when t.tgtype & 8 = 8 then 'DELETE' end,
                          case when t.tgtype & 16 = 16 then 'UPDATE' end) as events,
           t.tgenabled as enabled
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
    order by 1, 2`);
  console.log('== Triggers');
  console.table(triggers.rows);

  const checks = await client.query(`
    select conrelid::regclass::text as table, conname as constraint, convalidated as validated
    from pg_constraint where connamespace = 'public'::regnamespace and contype = 'c' order by 1, 2`);
  console.log('== CHECK constraints');
  console.table(checks.rows);

  const counts = await client.query(`
    select (select count(*) from auth.users)::int as auth_users, (select count(*) from public.players)::int as players,
           (select count(*) from public.saves)::int as saves, (select count(*) from public.weekly_scores)::int as weekly_scores,
           (select count(*) from public.gift_codes)::int as gift_codes,
           (select count(*) from public.redeemed_giftcodes)::int as redeemed_giftcodes`);
  console.log('== Số dòng');
  console.table(counts.rows);

  const rpcs = await client.query(`
    select p.proname as function, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer,
           coalesce(array_to_string(p.proconfig, ','), '-') as config,
           has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
           has_function_privilege('anon', p.oid, 'execute') as anon
    from pg_proc p where p.pronamespace = 'public'::regnamespace
      and p.proname in ('get_chest', 'sync_wallet', 'buy_item', 'open_box', 'equip', 'discard_item', 'sell_item',
                        'fish_start', 'fish_finish', 'fishing_top', 'redeem_giftcode')
    order by 1`);
  console.log('== RPC câu cá');
  console.table(rpcs.rows);

  const leaked = await client.query(`
    select p.proname from pg_proc p
    where p.pronamespace = 'public'::regnamespace and left(p.proname, 3) = 'nt_'
      and p.proname <> 'nt_jsonb_key_count' -- hàm thuần dùng trong CHECK (schema.sql), gọi được cũng vô hại
      and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'))`);
  console.log(leaked.rows.length
    ? `✘ Hàm phụ client gọi được: ${leaked.rows.map((r) => r.proname).join(', ')}`
    : '✔ Không hàm phụ nt_* nào lộ ra /rpc');

  const fishCounts = await client.query(`
    select (select count(*) from public.fish_species)::int as fish, (select count(*) from public.rod_defs)::int as rods,
           (select count(*) from public.rod_fish_rates)::int as rates, (select count(*) from public.kite_defs)::int as kites,
           (select count(*) from public.box_defs)::int as boxes, (select count(*) from public.shop_items)::int as shop,
           (select count(*) from public.wallets)::int as wallets, (select count(*) from public.inventory_slots)::int as slots,
           (select count(*) from public.catch_log)::int as catches, (select count(*) from public.fishing_casts)::int as casts`);
  console.log('== Câu cá: số dòng');
  console.table(fishCounts.rows);

  const rates = await client.query(`
    select r.rod_id, d.rarity as rod,
      round(100 * sum(r.weight) filter (where f.rarity = 'common') / sum(r.weight), 4)::float8 as common,
      round(100 * sum(r.weight) filter (where f.rarity = 'uncommon') / sum(r.weight), 4)::float8 as uncommon,
      round(100 * sum(r.weight) filter (where f.rarity = 'rare') / sum(r.weight), 4)::float8 as rare,
      round(100 * sum(r.weight) filter (where f.rarity = 'epic') / sum(r.weight), 4)::float8 as epic,
      round(100 * sum(r.weight) filter (where f.rarity = 'legendary') / sum(r.weight), 4)::float8 as legendary,
      round(100 * sum(r.weight) filter (where f.rarity = 'mythic') / sum(r.weight), 6)::float8 as mythic
    from public.rod_fish_rates r join public.fish_species f on f.id = r.fish_id join public.rod_defs d on d.id = r.rod_id
    group by r.rod_id, d.rarity, d.sort order by d.sort`);
  console.log('== % mỗi lần cá cắn theo cần (ban ngày, không mồi)');
  console.table(rates.rows);
} catch (e) {
  console.error('✘ Lỗi:', redact(e?.message ?? e));
  if (e?.detail) console.error('  detail:', redact(e.detail));
  if (e?.where) console.error('  where:', redact(e.where));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
