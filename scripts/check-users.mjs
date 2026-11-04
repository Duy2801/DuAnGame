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
const env = readEnv(join(root, '.env.local'));
const url = env.DIRECT_URL || env.DATABASE_URL;
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const u = await client.query('select id, email from auth.users');
console.log('auth.users:', u.rows);
const p = await client.query('select count(*) from public.players');
const s = await client.query('select count(*) from public.saves');
const w = await client.query('select count(*) from public.weekly_scores');
const c = await client.query('select count(*) from public.catch_log');
console.log('counts:', { players: p.rows[0].count, saves: s.rows[0].count, weekly_scores: w.rows[0].count, catch_log: c.rows[0].count });
await client.end();
