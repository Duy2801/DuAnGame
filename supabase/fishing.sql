-- Hồ Câu Cá · Thả Diều · Rương Đồ — phần server-authoritative (xem docs/fishing-api.md)
-- Chạy SAU schema.sql: `npm run db:apply`. Chạy lại nhiều lần được (không mất dữ liệu người chơi).
-- Mọi phép quay ngẫu nhiên đều ở đây; client chỉ hiển thị + chơi minigame.

-- ================================================================ CATALOG

create table if not exists public.fish_species (
  id         text primary key,
  name       text not null,
  emoji      text not null default '🐟',
  rarity     text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  price      int  not null check (price >= 0),
  cm_min     numeric(7,1) not null,
  cm_max     numeric(7,1) not null,
  difficulty numeric(4,3) not null check (difficulty between 0 and 1),
  night      boolean not null default false,
  rain       boolean not null default false,
  sort       int not null default 0,
  check (cm_min > 0 and cm_max >= cm_min)
);

create table if not exists public.rod_defs (
  id     text primary key,
  name   text not null,
  emoji  text not null,
  rarity text not null check (rarity in ('N', 'R', 'SR', 'SSR', 'UR')),
  zone   numeric not null default 0,
  size   numeric not null default 0,
  slow   numeric not null default 1,
  bite   numeric not null default 1,
  miss   numeric not null default 1,
  descr  text not null default '',
  sort   int not null default 0
);

create table if not exists public.rod_fish_rates (
  rod_id  text not null references public.rod_defs (id) on delete cascade,
  fish_id text not null references public.fish_species (id) on delete cascade,
  weight  numeric(14,4) not null check (weight >= 0),
  primary key (rod_id, fish_id)
);

create table if not exists public.kite_defs (
  id      text primary key,
  name    text not null,
  emoji   text not null,
  rarity  text not null check (rarity in ('N', 'R', 'SR', 'SSR', 'UR')),
  mult    numeric not null default 1,
  minutes int not null default 4,
  descr   text not null default '',
  sort    int not null default 0
);

create table if not exists public.box_defs (
  id         text primary key,
  kind       text not null check (kind in ('rod', 'kite')),
  name       text not null,
  emoji      text not null,
  price_gold int not null default 0 check (price_gold >= 0),
  price_gems int not null default 0 check (price_gems >= 0),
  odds       jsonb not null,
  sort       int not null default 0
);

create table if not exists public.shop_items (
  id         text primary key,
  name       text not null,
  emoji      text not null,
  price_gold int not null check (price_gold >= 0),
  qty        int not null check (qty between 1 and 9999),
  sort       int not null default 0
);

-- (bổ sung ngoài hợp đồng) hệ số của mồi — fish_start đọc ở đây
create table if not exists public.bait_defs (
  id    text primary key,
  name  text not null,
  emoji text not null,
  rare  numeric not null default 1,   -- nhân trọng số mọi cá KHÔNG phải common
  bite  numeric not null default 1,   -- nhân thời gian chờ cắn
  size  numeric not null default 0    -- cộng vào độ lệch kích thước
);

-- ---------------------------------------------------------------- seed (upsert)

insert into public.fish_species (id, name, emoji, rarity, price, cm_min, cm_max, difficulty, night, rain, sort) values
  ('fish_goby',      'Cá bống',              '🐟', 'common',     15,    5,  18, 0.10, false, false, 1),
  ('fish_crucian',   'Cá diếc',              '🐟', 'common',     20,    8,  25, 0.15, false, false, 2),
  ('fish_perch',     'Cá rô',                '🐠', 'common',     35,   10,  30, 0.30, false, false, 3),
  ('fish_tilapia',   'Cá rô phi',            '🐟', 'common',     50,   15,  42, 0.35, false, false, 4),
  ('fish_carp',      'Cá chép',              '🎏', 'uncommon',   85,   25,  85, 0.45, false, false, 5),
  ('fish_snakehead', 'Cá lóc',               '🐟', 'uncommon',  110,   25,  90, 0.50, true,  false, 6),
  ('fish_catfish',   'Cá trê',               '🐡', 'uncommon',  140,   30, 110, 0.55, true,  false, 7),
  ('fish_salmon',    'Cá hồi',               '🍣', 'rare',      200,   40, 120, 0.60, false, false, 8),
  ('fish_gourami',   'Cá tai tượng',         '🐠', 'rare',      240,   20,  70, 0.62, false, false, 9),
  ('fish_shark',     'Cá mập con',           '🦈', 'rare',      320,   60, 200, 0.70, false, true,  10),
  ('fish_koi',       'Cá Koi hoàng kim',     '🏮', 'epic',      600,   30,  95, 0.78, false, false, 11),
  ('fish_stingray',  'Cá đuối sông',         '🌊', 'epic',      750,   40, 180, 0.80, false, false, 12),
  ('fish_sturgeon',  'Cá tầm',               '🥚', 'epic',      950,   80, 300, 0.82, false, false, 13),
  ('fish_dragon',    'Cá rồng',              '🐲', 'legendary', 1200,  80, 260, 0.88, false, false, 14),
  ('fish_mekong',    'Cá tra dầu khổng lồ',  '🐋', 'legendary', 2200, 100, 300, 0.90, false, false, 15),
  ('fish_leviathan', 'Thủy Quái Hồ Sâu',     '🦑', 'mythic',    8000, 200, 600, 0.95, false, false, 16),
  ('fish_kimlong',   'Kim Long Ngư Thần',    '🐉', 'mythic',   20000, 150, 500, 0.97, false, false, 17)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, rarity = excluded.rarity, price = excluded.price,
  cm_min = excluded.cm_min, cm_max = excluded.cm_max, difficulty = excluded.difficulty,
  night = excluded.night, rain = excluded.rain, sort = excluded.sort;

insert into public.rod_defs (id, name, emoji, rarity, zone, size, slow, bite, miss, descr, sort) values
  ('rod_bamboo',   'Cần tre',           '🎋', 'N',   0,    0,    1,    1,    1,    'Cần câu cơ bản ai cũng có', 1),
  ('rod_reed',     'Cần trúc',          '🎋', 'N',   0.02, 0.1,  0.98, 0.95, 0.95, 'Dẻo, nhẹ tay', 2),
  ('rod_wood',     'Cần gỗ lim',        '🪵', 'N',   0.03, 0.15, 0.97, 0.92, 0.9,  'Chắc chắn, bền bỉ', 3),
  ('rod_iron',     'Cần sắt',           '🎣', 'R',   0.05, 0.25, 0.94, 0.88, 0.85, 'Kéo cá nặng tốt hơn', 4),
  ('rod_alu',      'Cần nhôm nhẹ',      '🎣', 'R',   0.06, 0.3,  0.9,  0.85, 0.8,  'Nhẹ như lông vũ', 5),
  ('rod_fiber',    'Cần sợi thủy tinh', '🎣', 'R',   0.07, 0.4,  0.9,  0.8,  0.75, 'Nhạy với từng cú rỉa', 6),
  ('rod_carbon',   'Cần carbon',        '🎣', 'SR',  0.09, 0.55, 0.86, 0.72, 0.65, 'Hàng thi đấu chuyên nghiệp', 7),
  ('rod_silver',   'Cần bạc',           '🥈', 'SR',  0.1,  0.65, 0.84, 0.68, 0.6,  'Ánh bạc thu hút cá lớn', 8),
  ('rod_gold',     'Cần Hoàng Kim',     '🏆', 'SSR', 0.12, 0.85, 0.8,  0.6,  0.5,  'Cá to tìm tới như nam châm', 9),
  ('rod_jade',     'Cần Ngọc Bích',     '💚', 'SSR', 0.13, 0.95, 0.78, 0.55, 0.45, 'Báu vật của ngư phủ', 10),
  ('rod_dragon',   'Cần Long Vương',    '🐉', 'UR',  0.16, 1.2,  0.7,  0.45, 0.35, 'Vua của các loài cần', 11),
  ('rod_poseidon', 'Cần Thần Biển',     '🔱', 'UR',  0.18, 1.5,  0.65, 0.4,  0.25, 'Thần biển ban tặng — huyền thoại', 12)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, rarity = excluded.rarity, zone = excluded.zone, size = excluded.size,
  slow = excluded.slow, bite = excluded.bite, miss = excluded.miss, descr = excluded.descr, sort = excluded.sort;

insert into public.kite_defs (id, name, emoji, rarity, mult, minutes, descr, sort) values
  ('kite_paper',     'Diều giấy',          '🪁', 'N',   1.15, 4,  'Chiếc diều đầu tiên của mọi đứa trẻ', 1),
  ('kite_fish',      'Diều cá chép',       '🎏', 'N',   1.15, 4,  'Cá chép vượt vũ môn — hút xu quanh mình', 2),
  ('kite_star',      'Diều ngôi sao',      '⭐', 'N',   1.15, 5,  'Sao may mắn — trời rơi nhiều túi quà hơn', 3),
  ('kite_butterfly', 'Diều cánh bướm',     '🦋', 'R',   1.2,  6,  'Lượn uyển chuyển, đón gió lâu hơn', 4),
  ('kite_owl',       'Diều cú mèo',        '🦉', 'R',   1.2,  6,  'Cú canh đêm — có khiên đỡ 1 cú va', 5),
  ('kite_box',       'Diều hộp',           '📦', 'R',   1.2,  6,  'Khung hộp chắc chắn — xu nhặt được giá trị hơn', 6),
  ('kite_eagle',     'Diều đại bàng',      '🦅', 'SR',  1.25, 8,  'Chúa tể bầu trời — chim nhỏ tránh xa', 7),
  ('kite_flute',     'Diều sáo',           '🎶', 'SR',  1.25, 8,  'Diều sáo đồng quê — gió đẩy mạnh và lâu', 8),
  ('kite_cloud',     'Diều mây trắng',     '☁️', 'SR',  1.25, 8,  'Hòa vào mây giông — sét đánh không trúng', 9),
  ('kite_phoenix',   'Diều phượng hoàng',  '🔥', 'SSR', 1.3,  10, 'Lửa thiêng hộ thân — 2 lớp khiên, xu sáng hơn', 10),
  ('kite_rainbow',   'Diều cầu vồng',      '🌈', 'SSR', 1.3,  10, 'Cuối cầu vồng là kho báu — quà ×2, hút xu xa', 11),
  ('kite_dragon',    'Diều rồng VIP',      '🐉', 'UR',  1.35, 12, 'Rồng cưỡi mây — miễn sét, có khiên, hút xu', 12),
  ('kite_galaxy',    'Diều ngân hà',       '🌌', 'UR',  1.4,  12, 'Huyền thoại sao trời — mọi chỉ số đều đỉnh', 13)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, rarity = excluded.rarity, mult = excluded.mult,
  minutes = excluded.minutes, descr = excluded.descr, sort = excluded.sort;

-- ODDS_1/2/3 trong src/game/config/shops.ts
insert into public.box_defs (id, kind, name, emoji, price_gold, price_gems, odds, sort) values
  ('box_wood',   'rod',  'Hộp Cần Câu Gỗ',            '📦', 600,  0,  '{"N":0.80,"R":0.18,"SR":0.018,"SSR":0.002}', 1),
  ('box_silver', 'rod',  'Hộp Cần Câu Bạc',           '🎁', 4000, 0,  '{"N":0.48,"R":0.38,"SR":0.12,"SSR":0.017,"UR":0.003}', 2),
  ('box_gold',   'rod',  'Hộp Cần Câu Hoàng Kim VIP', '💝', 0,    60, '{"N":0.18,"R":0.50,"SR":0.27,"SSR":0.04,"UR":0.01}', 3),
  ('kbox_1',     'kite', 'Túi Diều May Mắn',          '🎐', 800,  0,  '{"N":0.78,"R":0.19,"SR":0.026,"SSR":0.0035,"UR":0.0005}', 4),
  ('kbox_2',     'kite', 'Hộp Diều Bạc',              '🎁', 5000, 0,  '{"N":0.48,"R":0.38,"SR":0.12,"SSR":0.017,"UR":0.003}', 5),
  ('kbox_3',     'kite', 'Rương Diều Rồng VIP',       '🏮', 0,    50, '{"N":0.18,"R":0.50,"SR":0.27,"SSR":0.04,"UR":0.01}', 6)
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, emoji = excluded.emoji, price_gold = excluded.price_gold,
  price_gems = excluded.price_gems, odds = excluded.odds, sort = excluded.sort;

insert into public.shop_items (id, name, emoji, price_gold, qty, sort) values
  ('bait_worm',   'Mồi giun', '🪱', 40,  10, 1),
  ('bait_shrimp', 'Mồi tôm',  '🦐', 120, 5,  2)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, price_gold = excluded.price_gold, qty = excluded.qty, sort = excluded.sort;

insert into public.bait_defs (id, name, emoji, rare, bite, size) values
  ('bait_worm',   'Mồi giun', '🪱', 1,   1,    0),
  ('bait_shrimp', 'Mồi tôm',  '🦐', 1.6, 0.85, 0.15),
  ('bait_gold',   'Mồi vàng', '✨', 3,   0.7,  0.35)
on conflict (id) do update set
  name = excluded.name, emoji = excluded.emoji, rare = excluded.rare, bite = excluded.bite, size = excluded.size;

-- ---------------------------------------------------------------- rod_fish_rates
-- weight = (tỉ lệ % của bậc hiếm theo cần) × (tỉ phần của loài trong bậc) × 10000.
-- Tổng weight mỗi cần = 1 000 000 → weight / 10 000 = % mỗi lần cá cắn (ban ngày, mồi giun / không mồi).
-- Ban đêm (19h–5h giờ VN) cá `night` ×2; mồi tôm/vàng nhân mọi cá không-common ×1.6 / ×3 (rồi chuẩn hoá lại).
--
-- Kết quả % mỗi lần cá cắn (đo lại từ DB sau khi áp, ban ngày, không mồi):
-- | cần           | common  | uncommon | rare  | epic  | legendary | mythic  | Thủy Quái | Kim Long |
-- |---------------|---------|----------|-------|-------|-----------|---------|-----------|----------|
-- | rod_bamboo N  | 69.9895 | 22.0     | 6.5   | 1.5   | 0.010     | 0.0005  | 0.00035   | 0.00015  |
-- | rod_reed N    | 67.9843 | 23.0     | 7.2   | 1.8   | 0.015     | 0.0007  | 0.00049   | 0.00021  |
-- | rod_wood N    | 66.6792 | 23.5     | 7.8   | 2.0   | 0.020     | 0.0008  | 0.00056   | 0.00024  |
-- | rod_iron R    | 62.8638 | 25.0     | 9.5   | 2.6   | 0.035     | 0.0012  | 0.00084   | 0.00036  |
-- | rod_alu R     | 61.3535 | 25.5     | 10.2  | 2.9   | 0.045     | 0.0015  | 0.00105   | 0.00045  |
-- | rod_fiber R   | 59.6382 | 26.0     | 11.0  | 3.3   | 0.060     | 0.0018  | 0.00126   | 0.00054  |
-- | rod_carbon SR | 55.7075 | 27.0     | 13.0  | 4.2   | 0.090     | 0.0025  | 0.00175   | 0.00075  |
-- | rod_silver SR | 53.5870 | 27.5     | 14.0  | 4.8   | 0.110     | 0.0030  | 0.00210   | 0.00090  |
-- | rod_gold SSR  | 49.1355 | 28.5     | 16.0  | 6.2   | 0.160     | 0.0045  | 0.00315   | 0.00135  |
-- | rod_jade SSR  | 46.8045 | 29.0     | 17.0  | 7.0   | 0.190     | 0.0055  | 0.00385   | 0.00165  |
-- | rod_dragon UR | 42.2525 | 30.0     | 19.0  | 8.5   | 0.240     | 0.0075  | 0.00525   | 0.00225  |
-- | rod_poseidon UR| 37.6900| 31.0     | 21.0  | 10.0  | 0.300     | 0.0100  | 0.00700   | 0.00300  |
-- Tỉ phần trong bậc: common bống 14 / diếc 40 / rô 28 / rô phi 18 · uncommon chép 45 / lóc 30 / trê 25 ·
-- rare hồi 45 / tai tượng 33 / mập 22 · epic koi 45 / đuối 33 / tầm 22 · legendary rồng 60 / tra dầu 40 ·
-- mythic Thủy Quái 70 / Kim Long 30.

with share (rod_id, uncommon, rare, epic, legendary, mythic) as (values
  ('rod_bamboo',   22.0, 6.5,  1.5,  0.010, 0.0005),
  ('rod_reed',     23.0, 7.2,  1.8,  0.015, 0.0007),
  ('rod_wood',     23.5, 7.8,  2.0,  0.020, 0.0008),
  ('rod_iron',     25.0, 9.5,  2.6,  0.035, 0.0012),
  ('rod_alu',      25.5, 10.2, 2.9,  0.045, 0.0015),
  ('rod_fiber',    26.0, 11.0, 3.3,  0.060, 0.0018),
  ('rod_carbon',   27.0, 13.0, 4.2,  0.090, 0.0025),
  ('rod_silver',   27.5, 14.0, 4.8,  0.110, 0.0030),
  ('rod_gold',     28.5, 16.0, 6.2,  0.160, 0.0045),
  ('rod_jade',     29.0, 17.0, 7.0,  0.190, 0.0055),
  ('rod_dragon',   30.0, 19.0, 8.5,  0.240, 0.0075),
  ('rod_poseidon', 31.0, 21.0, 10.0, 0.300, 0.0100)
), frac (fish_id, part) as (values
  ('fish_goby', 0.14), ('fish_crucian', 0.40), ('fish_perch', 0.28), ('fish_tilapia', 0.18),
  ('fish_carp', 0.45), ('fish_snakehead', 0.30), ('fish_catfish', 0.25),
  ('fish_salmon', 0.45), ('fish_gourami', 0.33), ('fish_shark', 0.22),
  ('fish_koi', 0.45), ('fish_stingray', 0.33), ('fish_sturgeon', 0.22),
  ('fish_dragon', 0.60), ('fish_mekong', 0.40),
  ('fish_leviathan', 0.70), ('fish_kimlong', 0.30)
)
insert into public.rod_fish_rates (rod_id, fish_id, weight)
select s.rod_id, f.id,
       round(fr.part * 10000 * case f.rarity
         when 'common'    then 100 - s.uncommon - s.rare - s.epic - s.legendary - s.mythic
         when 'uncommon'  then s.uncommon
         when 'rare'      then s.rare
         when 'epic'      then s.epic
         when 'legendary' then s.legendary
         else s.mythic end, 4)
from share s
cross join public.fish_species f
join frac fr on fr.fish_id = f.id
on conflict (rod_id, fish_id) do update set weight = excluded.weight;

-- ================================================================ DỮ LIỆU NGƯỜI CHƠI

create table if not exists public.inventory_slots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  slot        int  not null,
  item_id     text not null,
  kind        text not null,
  qty         int  not null default 1,
  expires_at  timestamptz,
  equipped    boolean not null default false,
  acquired_at timestamptz not null default now(),
  constraint inventory_slot_range check (slot between 0 and 29),
  constraint inventory_kind check (kind in ('stack', 'rod', 'kite')),
  constraint inventory_qty_range check (qty between 1 and 9999),
  constraint inventory_gear_single check (kind = 'stack' or qty = 1),
  constraint inventory_equip_gear check (not equipped or kind in ('rod', 'kite')),
  constraint inventory_stack_no_expiry check (kind <> 'stack' or expires_at is null),
  constraint inventory_user_slot unique (user_id, slot)
);
create unique index if not exists inventory_stack_unique on public.inventory_slots (user_id, item_id) where kind = 'stack';
create unique index if not exists inventory_one_equipped on public.inventory_slots (user_id, kind) where equipped;
create index if not exists inventory_expiry_idx on public.inventory_slots (user_id, expires_at) where expires_at is not null;

create table if not exists public.wallets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  gold       bigint not null default 0,
  gems       int    not null default 0,
  synced_at  timestamptz not null default now(),
  constraint wallets_gold_range check (gold between 0 and 1000000000000),
  constraint wallets_gems_range check (gems >= 0)
);
-- (bổ sung) đồng hồ "xô token" cho trần tăng vàng/kim cương của sync_wallet
alter table public.wallets add column if not exists gold_clock timestamptz not null default now() - interval '5 minutes';
alter table public.wallets add column if not exists gems_clock timestamptz not null default now() - interval '1 hour';

create table if not exists public.fishing_casts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  rod_id      text not null,
  bait_id     text,
  fish_id     text not null,
  cm          numeric(7,1) not null,
  pct         double precision not null,
  wait_ms     int not null,
  miss        numeric not null,
  empty_bite  boolean not null default false,
  started_at  timestamptz not null default now(),
  used        boolean not null default false,
  finished_at timestamptz,
  result      text
);
create index if not exists fishing_casts_user_idx on public.fishing_casts (user_id, started_at desc);

create table if not exists public.catch_log (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users (id) on delete cascade,
  fish_id   text not null,
  cm        numeric(7,1) not null,
  kg        numeric(10,2) not null,
  points    int not null,
  rod_id    text not null,
  week_key  text not null,
  caught_at timestamptz not null default now()
);
create index if not exists catch_log_week_idx on public.catch_log (week_key, user_id);
create index if not exists catch_log_user_fish_idx on public.catch_log (user_id, fish_id, cm desc);

-- ================================================================ BẢNG QUẢN LÝ GIFTCODE TRÊN DATABASE
-- Lưu toàn bộ mã quà tặng và lịch sử nhận quà trực tiếp trên DB, không lưu trên giao diện hay bundle frontend.

create table if not exists public.gift_codes (
  id               text primary key,
  code_hash        text not null unique,
  salt             text not null,
  reward_gold      bigint not null default 0 check (reward_gold >= 0),
  reward_gems      int not null default 0 check (reward_gems >= 0),
  reward_items     jsonb not null default '{}'::jsonb,
  reward_titles    jsonb not null default '[]'::jsonb,
  once_per_account boolean not null default true,
  max_uses         int default null,
  used_count       int not null default 0 check (used_count >= 0),
  active           boolean not null default true,
  expires_at       timestamptz default null,
  note             text not null default '',
  created_at       timestamptz not null default now()
);

-- Bảng ghi nhận lịch sử tài khoản đã nhận mã (khóa chính (user_id, code_id) chặn nhận trùng cấp Database)
create table if not exists public.redeemed_giftcodes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  code_id     text not null references public.gift_codes (id) on delete cascade,
  reward_gold bigint not null default 0,
  reward_gems int not null default 0,
  redeemed_at timestamptz not null default now(),
  primary key (user_id, code_id)
);

-- Bảng chống spam & chống hack dò mã (Brute-force) cấp Database cho từng tài khoản
create table if not exists public.giftcode_attempts (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  fail_count   int not null default 0 check (fail_count >= 0),
  locked_until timestamptz not null default now() - interval '1 second',
  last_attempt timestamptz not null default now()
);

-- Khởi tạo mã quà tặng 10.000 Vàng & 10.000 Kim cương trên Database (Mã hóa SHA-256 có Salt, mỗi tài khoản 1 lần)
insert into public.gift_codes (id, code_hash, salt, reward_gold, reward_gems, once_per_account, note)
values (
  'gift_trian_10k_gold_gems',
  'ad743cb11a69f4b36a1287712883bbb0e67cb09545fb091fac44755e51eedb60',
  'ntmh_salt_giftcode_v1_secure_2026_x9k',
  10000,
  10000,
  true,
  'Quà tri ân đặc biệt 10.000 Vàng + 10.000 Kim Cương (Lưu DB, mỗi tài khoản 1 lần duy nhất)'
)
on conflict (id) do update
set code_hash = excluded.code_hash,
    salt = excluded.salt,
    reward_gold = excluded.reward_gold,
    reward_gems = excluded.reward_gems,
    once_per_account = excluded.once_per_account,
    note = excluded.note;

-- Khởi tạo mã quà tặng sinhvienngheo: 20.000 Vàng & 20.000 Kim cương trên Database
insert into public.gift_codes (id, code_hash, salt, reward_gold, reward_gems, once_per_account, note)
values (
  'gift_sinhvienngheo',
  'f9a8f1e8269a4be5a214c112b631d071157f5b8e235c0aa272d5aa41a1949eec',
  'ntmh_salt_giftcode_v1_secure_2026_x9k',
  20000,
  20000,
  true,
  'Quà tặng Sinh Viên Nghèo: 20.000 Vàng + 20.000 Kim Cương (Lưu DB, mỗi tài khoản 1 lần duy nhất)'
)
on conflict (id) do update
set code_hash = excluded.code_hash,
    salt = excluded.salt,
    reward_gold = excluded.reward_gold,
    reward_gems = excluded.reward_gems,
    once_per_account = excluded.once_per_account,
    note = excluded.note;

-- ví cho tài khoản đã có (lấy số dư từ save gần nhất — chỉ 1 lần, dòng đã có giữ nguyên)
insert into public.wallets (user_id, gold, gems)
select u.id,
       case when jsonb_typeof(s.data -> 'gold') = 'number'
            then least(1000000000000, greatest(0, floor((s.data ->> 'gold')::numeric)))::bigint else 0 end,
       case when jsonb_typeof(s.data -> 'gems') = 'number'
            then least(2000000000, greatest(0, floor((s.data ->> 'gems')::numeric)))::int else 0 end
from auth.users u
left join public.saves s on s.user_id = u.id
on conflict (user_id) do nothing;

-- ================================================================ HÀM PHỤ (không cho client gọi)

create or replace function public.nt_uid()
returns uuid language plpgsql stable security definer set search_path = ''
as $$
declare u uuid := auth.uid();
begin
  if u is null then
    raise exception 'Bạn cần đăng nhập' using errcode = '28000';
  end if;
  return u;
end $$;

create or replace function public.nt_rarity_rank(p text)
returns int language sql immutable set search_path = ''
as $$ select case p when 'N' then 0 when 'R' then 1 when 'SR' then 2 when 'SSR' then 3 when 'UR' then 4 else -1 end $$;

create or replace function public.nt_week_key(p_ts timestamptz default now())
returns text language sql stable set search_path = ''
as $$ select to_char(date_trunc('week', p_ts at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD') $$;

-- khoá ví của người chơi (tạo nếu chưa có) — dùng làm khoá theo người cho mọi RPC ghi
create or replace function public.nt_wallet_lock(p_uid uuid)
returns public.wallets language plpgsql security definer set search_path = ''
as $$
declare
  w public.wallets;
  sd jsonb;
begin
  select * into w from public.wallets where user_id = p_uid for update;
  if found then
    return w;
  end if;
  -- tài khoản mới sau khi áp file: lấy từ save nhưng giới hạn (save do client ghi)
  select s.data into sd from public.saves s where s.user_id = p_uid;
  insert into public.wallets (user_id, gold, gems)
  values (p_uid,
          case when jsonb_typeof(sd -> 'gold') = 'number'
               then least(20000, greatest(0, floor((sd ->> 'gold')::numeric)))::bigint else 0 end,
          case when jsonb_typeof(sd -> 'gems') = 'number'
               then least(50, greatest(0, floor((sd ->> 'gems')::numeric)))::int else 0 end)
  on conflict (user_id) do nothing;
  select * into w from public.wallets where user_id = p_uid for update;
  return w;
end $$;

-- xoá cần/diều hết hạn
create or replace function public.nt_inv_purge(p_uid uuid)
returns int language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  delete from public.inventory_slots
  where user_id = p_uid and kind in ('rod', 'kite') and expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.nt_inv_free_slots(p_uid uuid)
returns int[] language sql stable security definer set search_path = ''
as $$
  select coalesce(array_agg(g order by g), '{}'::int[])
  from generate_series(0, 29) g
  where not exists (select 1 from public.inventory_slots s where s.user_id = p_uid and s.slot = g)
$$;

-- cộng dồn vật phẩm thường; trả về số ô, hoặc null nếu không còn chỗ (không raise)
create or replace function public.nt_inv_add_stack(p_uid uuid, p_item text, p_qty int)
returns int language plpgsql security definer set search_path = ''
as $$
declare
  r public.inventory_slots;
  free int[];
  s int;
begin
  select * into r from public.inventory_slots
  where user_id = p_uid and kind = 'stack' and item_id = p_item for update;
  if found then
    if r.qty + p_qty > 9999 then
      return null;
    end if;
    update public.inventory_slots set qty = qty + p_qty where id = r.id;
    return r.slot;
  end if;
  if p_qty > 9999 then
    return null;
  end if;
  free := public.nt_inv_free_slots(p_uid);
  if coalesce(array_length(free, 1), 0) = 0 then
    return null;
  end if;
  s := free[1];
  insert into public.inventory_slots (user_id, slot, item_id, kind, qty) values (p_uid, s, p_item, 'stack', p_qty);
  return s;
end $$;

create or replace function public.nt_chest_slots(p_uid uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(s) - 'user_id' order by s.slot), '[]'::jsonb)
  from public.inventory_slots s where s.user_id = p_uid
$$;

-- hạn sử dụng: perm đúng 1e-6, 1d 60%, 3d 30%, 7d phần còn lại (~9.9999%)
create or replace function public.nt_roll_duration()
returns text language plpgsql volatile set search_path = ''
as $$
declare r double precision := random();
begin
  if r < 0.000001 then return 'perm'; end if;
  if r < 0.600001 then return '1d'; end if;
  if r < 0.900001 then return '3d'; end if;
  return '7d';
end $$;

-- bốc bậc hiếm theo odds jsonb (chỉ tính các bậc rank >= p_min_rank, chuẩn hoá lại)
create or replace function public.nt_roll_rarity(p_odds jsonb, p_min_rank int default 0)
returns text language plpgsql volatile set search_path = ''
as $$
declare
  tot numeric;
  acc numeric := 0;
  r numeric;
  k text;
  v numeric;
  last_k text;
begin
  select sum(e.value::numeric) into tot
  from jsonb_each_text(p_odds) e where public.nt_rarity_rank(e.key) >= p_min_rank;
  if tot is null or tot <= 0 then
    return null;
  end if;
  r := random()::numeric * tot;
  for k, v in
    select e.key, e.value::numeric from jsonb_each_text(p_odds) e
    where public.nt_rarity_rank(e.key) >= p_min_rank order by public.nt_rarity_rank(e.key)
  loop
    acc := acc + v;
    last_k := k;
    if r < acc then
      return k;
    end if;
  end loop;
  return last_k;
end $$;

-- bốc 1 loài cá theo rod_fish_rates × mồi (cá không-common) × đêm (cá night ×2)
create or replace function public.nt_roll_fish(p_rod text, p_rare numeric default 1, p_night boolean default false)
returns text language plpgsql volatile security definer set search_path = ''
as $$
declare
  r double precision := random();
  res text;
begin
  with w as (
    select f.id, f.sort,
           (rf.weight * case when f.rarity <> 'common' then p_rare else 1 end
                      * case when p_night and f.night then 2 else 1 end)::double precision as w
    from public.rod_fish_rates rf join public.fish_species f on f.id = rf.fish_id
    where rf.rod_id = p_rod and rf.weight > 0
  ), c as (
    select id, sum(w) over (order by sort, id) as cum, sum(w) over () as tot from w
  )
  select id into res from c where cum > r * tot order by cum limit 1;
  if res is null then
    select f.id into res from public.fish_species f order by f.sort limit 1;
  end if;
  return res;
end $$;

-- ================================================================ RPC

create or replace function public.get_chest()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  w public.wallets;
begin
  w := public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  return jsonb_build_object('slots', public.nt_chest_slots(uid),
                            'wallet', jsonb_build_object('gold', w.gold, 'gems', w.gems));
end $$;

-- Đồng bộ ví vàng / kim cương chính xác từ client lên DB
create or replace function public.sync_wallet(p_gold bigint, p_gems int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  w public.wallets;
  g bigint;
  e int;
begin
  if (p_gold is not null and p_gold < 0) or (p_gems is not null and p_gems < 0) then
    raise exception 'Số dư không hợp lệ' using errcode = 'check_violation';
  end if;
  w := public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  g := coalesce(p_gold, w.gold);
  e := coalesce(p_gems, w.gems);

  update public.wallets
  set gold = least(greatest(g, 0), 1000000000000), gems = greatest(e, 0), synced_at = now()
  where user_id = uid;
  return jsonb_build_object('gold', least(greatest(g, 0), 1000000000000), 'gems', greatest(e, 0), 'capped', false);
end $$;

-- mua mồi: p_qty = số GÓI (mỗi gói = shop_items.qty con mồi, giá price_gold)
create or replace function public.buy_item(p_item_id text, p_qty int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  w public.wallets;
  it public.shop_items;
  n int := coalesce(p_qty, 1);
  cost bigint;
  s int;
begin
  if n < 1 or n > 100 then
    raise exception 'Số lượng không hợp lệ (1–100 gói)' using errcode = 'check_violation';
  end if;
  select * into it from public.shop_items where id = p_item_id;
  if not found then
    raise exception 'Tiệm không bán món này' using errcode = 'check_violation';
  end if;
  w := public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  cost := it.price_gold::bigint * n;
  if w.gold < cost then
    raise exception 'Không đủ vàng (cần % 🪙)', cost using errcode = 'check_violation';
  end if;
  s := public.nt_inv_add_stack(uid, it.id, it.qty * n);
  if s is null then
    raise exception 'Rương đầy' using errcode = 'check_violation';
  end if;
  update public.wallets set gold = gold - cost where user_id = uid returning * into w;
  return jsonb_build_object('slot', s, 'item_id', it.id, 'qty_added', it.qty * n,
                            'wallet', jsonb_build_object('gold', w.gold, 'gems', w.gems));
end $$;

create or replace function public.open_box(p_box_id text, p_count int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  w public.wallets;
  b public.box_defs;
  n int := coalesce(p_count, 1);
  free int[];
  rars text[] := '{}';
  i int;
  rar text;
  item text;
  iname text;
  iemoji text;
  dur text;
  v_exp timestamptz;
  cost_g bigint;
  cost_e bigint;
  results jsonb := '[]'::jsonb;
begin
  if n not in (1, 10) then
    raise exception 'Chỉ mở được 1 hoặc 10 hộp mỗi lần' using errcode = 'check_violation';
  end if;
  select * into b from public.box_defs where id = p_box_id;
  if not found then
    raise exception 'Không có hộp này' using errcode = 'check_violation';
  end if;
  w := public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);

  free := public.nt_inv_free_slots(uid);
  if coalesce(array_length(free, 1), 0) < n then
    raise exception 'Rương đầy — cần % ô trống (còn % ô)', n, coalesce(array_length(free, 1), 0)
      using errcode = 'check_violation';
  end if;
  cost_g := b.price_gold::bigint * n;
  cost_e := b.price_gems::bigint * n;
  if w.gold < cost_g then
    raise exception 'Không đủ vàng (cần % 🪙)', cost_g using errcode = 'check_violation';
  end if;
  if w.gems < cost_e then
    raise exception 'Không đủ kim cương (cần % 💎)', cost_e using errcode = 'check_violation';
  end if;

  for i in 1..n loop
    rars := rars || public.nt_roll_rarity(b.odds, 0);
  end loop;
  -- mở ×10: chắc chắn ít nhất 1 món SR trở lên
  if n >= 10 and not exists (select 1 from unnest(rars) x where public.nt_rarity_rank(x) >= 2) then
    rar := public.nt_roll_rarity(b.odds, 2);
    if rar is not null then
      rars[n] := rar;
    end if;
  end if;

  for i in 1..n loop
    rar := rars[i];
    item := null;
    if b.kind = 'rod' then
      select d.id, d.name, d.emoji into item, iname, iemoji from public.rod_defs d
      where d.rarity = rar and d.id <> 'rod_bamboo' order by random() limit 1;
    else
      select d.id, d.name, d.emoji into item, iname, iemoji from public.kite_defs d
      where d.rarity = rar order by random() limit 1;
    end if;
    if item is null then
      raise exception 'Lỗi cấu hình hộp % (không có món bậc %)', b.id, rar;
    end if;
    dur := public.nt_roll_duration();
    v_exp := case dur when '1d' then now() + interval '1 day'
                    when '3d' then now() + interval '3 days'
                    when '7d' then now() + interval '7 days'
                    else null end;
    insert into public.inventory_slots (user_id, slot, item_id, kind, qty, expires_at)
    values (uid, free[i], item, b.kind, 1, v_exp);
    results := results || jsonb_build_array(jsonb_build_object(
      'item_id', item, 'kind', b.kind, 'rarity', rar, 'duration', dur, 'expires_at', v_exp, 'slot', free[i],
      'name', iname, 'emoji', iemoji));
  end loop;

  update public.wallets set gold = gold - cost_g, gems = gems - cost_e::int where user_id = uid returning * into w;
  return jsonb_build_object('results', results, 'wallet', jsonb_build_object('gold', w.gold, 'gems', w.gems));
end $$;

create or replace function public.equip(p_slot int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  r public.inventory_slots;
begin
  perform public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  select * into r from public.inventory_slots where user_id = uid and slot = p_slot for update;
  if not found then
    raise exception 'Ô này đang trống (hoặc đồ đã hết hạn)' using errcode = 'check_violation';
  end if;
  if r.kind not in ('rod', 'kite') then
    raise exception 'Chỉ trang bị được cần câu hoặc diều' using errcode = 'check_violation';
  end if;
  update public.inventory_slots set equipped = false
  where user_id = uid and kind = r.kind and equipped and id <> r.id;
  update public.inventory_slots set equipped = true where id = r.id;
  return jsonb_build_object('ok', true, 'item_id', r.item_id, 'kind', r.kind);
end $$;

create or replace function public.discard_item(p_slot int, p_qty int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  r public.inventory_slots;
begin
  if p_qty is not null and p_qty < 1 then
    raise exception 'Số lượng không hợp lệ' using errcode = 'check_violation';
  end if;
  perform public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  select * into r from public.inventory_slots where user_id = uid and slot = p_slot for update;
  if not found then
    raise exception 'Ô này đang trống' using errcode = 'check_violation';
  end if;
  if p_qty is null or p_qty >= r.qty then
    delete from public.inventory_slots where id = r.id;
  else
    update public.inventory_slots set qty = qty - p_qty where id = r.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- bán cá: giá = fish_species.price × số con (p_qty null = cả ô)
create or replace function public.sell_item(p_slot int, p_qty int)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  w public.wallets;
  r public.inventory_slots;
  price int;
  n int;
  gained bigint;
begin
  w := public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  select * into r from public.inventory_slots where user_id = uid and slot = p_slot for update;
  if not found then
    raise exception 'Ô này đang trống' using errcode = 'check_violation';
  end if;
  select f.price into price from public.fish_species f where f.id = r.item_id;
  if r.kind <> 'stack' or price is null then
    raise exception 'Chỉ bán được cá' using errcode = 'check_violation';
  end if;
  n := coalesce(p_qty, r.qty);
  if n < 1 then
    raise exception 'Số lượng không hợp lệ' using errcode = 'check_violation';
  end if;
  if n > r.qty then
    raise exception 'Không đủ cá để bán (có %)', r.qty using errcode = 'check_violation';
  end if;
  gained := price::bigint * n;
  if n = r.qty then
    delete from public.inventory_slots where id = r.id;
  else
    update public.inventory_slots set qty = qty - n where id = r.id;
  end if;
  update public.wallets set gold = least(1000000000000, gold + gained) where user_id = uid returning * into w;
  return jsonb_build_object('gold_gained', gained, 'wallet', jsonb_build_object('gold', w.gold, 'gems', w.gems));
end $$;

create or replace function public.fish_start(p_bait_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  bt public.bait_defs;
  b_rare numeric := 1;
  b_bite numeric := 1;
  b_size numeric := 0;
  bs public.inventory_slots;
  rod public.rod_defs;
  rod_id text;
  f public.fish_species;
  fish_pick text;
  is_night boolean;
  pct double precision;
  cm numeric;
  raw double precision;
  wait int;
  last_start timestamptz;
  cid uuid;
  empty boolean;
begin
  perform public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);

  select max(c.started_at) into last_start from public.fishing_casts c where c.user_id = uid;
  if public.nt_is_client() and last_start is not null and last_start > now() - interval '3 seconds' then
    raise exception 'Thả câu quá nhanh, đợi vài giây' using errcode = 'P0429';
  end if;

  if p_bait_id is not null then
    select * into bt from public.bait_defs where id = p_bait_id;
    if not found then
      raise exception 'Mồi không hợp lệ' using errcode = 'check_violation';
    end if;
    select * into bs from public.inventory_slots
    where user_id = uid and kind = 'stack' and item_id = p_bait_id for update;
    if not found then
      raise exception 'Hết mồi rồi — mua ở Tiệm Câu Cá' using errcode = 'check_violation';
    end if;
    if bs.qty <= 1 then
      delete from public.inventory_slots where id = bs.id;
    else
      update public.inventory_slots set qty = qty - 1 where id = bs.id;
    end if;
    b_rare := bt.rare; b_bite := bt.bite; b_size := bt.size;
  end if;

  select s.item_id into rod_id from public.inventory_slots s
  where s.user_id = uid and s.kind = 'rod' and s.equipped and (s.expires_at is null or s.expires_at > now())
  limit 1;
  select * into rod from public.rod_defs where id = coalesce(rod_id, 'rod_bamboo');
  if not found then
    select * into rod from public.rod_defs where id = 'rod_bamboo';
  end if;

  is_night := extract(hour from now() at time zone 'Asia/Ho_Chi_Minh') >= 19
           or extract(hour from now() at time zone 'Asia/Ho_Chi_Minh') < 5;
  -- quay vào biến trước (hàm volatile trong WHERE sẽ bị gọi lại cho từng dòng)
  fish_pick := public.nt_roll_fish(rod.id, b_rare, is_night);
  select * into f from public.fish_species where id = fish_pick;

  pct := power(random(), 1.0 / (1 + rod.size::double precision + b_size::double precision));
  cm := round((f.cm_min + (f.cm_max - f.cm_min) * pct::numeric) * 10) / 10;
  raw := 4 + random() * 56;
  wait := round(least(60.0, greatest(4.0, raw * rod.bite::double precision * b_bite::double precision)) * 1000)::int;
  empty := random() < 0.12 * rod.miss::double precision;

  -- 1 lượt câu đang chờ mỗi người: huỷ lượt cũ; dọn lượt quá 2 ngày
  update public.fishing_casts set used = true, finished_at = now(), result = 'cancelled'
  where user_id = uid and not used;
  delete from public.fishing_casts where user_id = uid and started_at < now() - interval '2 days';

  insert into public.fishing_casts (user_id, rod_id, bait_id, fish_id, cm, pct, wait_ms, miss, empty_bite)
  values (uid, rod.id, p_bait_id, f.id, cm, pct, wait, rod.miss, empty)
  returning id into cid;

  return jsonb_build_object('cast_id', cid, 'wait_ms', wait, 'difficulty', f.difficulty,
                            'zone', rod.zone, 'slow', rod.slow,
                            'rod_id', rod.id, 'bait_id', p_bait_id);
end $$;

create or replace function public.fish_finish(p_cast_id uuid, p_success boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  c public.fishing_casts;
  f public.fish_species;
  bite_at timestamptz;
  s int;
  mult numeric;
  pts int;
  kg numeric;
  best numeric;
begin
  perform public.nt_wallet_lock(uid);
  perform public.nt_inv_purge(uid);
  select * into c from public.fishing_casts where id = p_cast_id and user_id = uid for update;
  if not found then
    raise exception 'Không tìm thấy lượt câu' using errcode = 'check_violation';
  end if;
  if c.used then
    raise exception 'Lượt câu này đã kết thúc' using errcode = 'check_violation';
  end if;
  bite_at := c.started_at + make_interval(secs => c.wait_ms / 1000.0);
  if now() < bite_at - interval '300 milliseconds' then
    raise exception 'Cá chưa cắn câu — giật cần quá sớm' using errcode = 'check_violation';
  end if;

  if now() > bite_at + interval '90 seconds' then
    update public.fishing_casts set used = true, finished_at = now(), result = 'timeout' where id = c.id;
    return jsonb_build_object('caught', false, 'reason', 'Cá đã bỏ đi vì chờ quá lâu');
  end if;
  if c.empty_bite then
    update public.fishing_casts set used = true, finished_at = now(), result = 'empty' where id = c.id;
    return jsonb_build_object('caught', false, 'reason', 'Cá rỉa mồi rồi bỏ chạy');
  end if;
  if not coalesce(p_success, false) then
    update public.fishing_casts set used = true, finished_at = now(), result = 'escaped' where id = c.id;
    return jsonb_build_object('caught', false, 'reason', 'Cá đã giãy thoát');
  end if;
  if random() < 0.1 * c.miss::double precision * (0.4 + c.pct * 1.6) then
    update public.fishing_casts set used = true, finished_at = now(), result = 'snap' where id = c.id;
    return jsonb_build_object('caught', false, 'reason', 'Đứt dây! Cá khỏe quá');
  end if;

  select * into f from public.fish_species where id = c.fish_id;
  s := public.nt_inv_add_stack(uid, c.fish_id, 1);

  -- SIZE_TIERS: Bé 0.7 · Vừa ≥0.35 1 · To ≥0.7 1.5 · Khổng lồ ≥0.92 2.5
  mult := case when c.pct >= 0.92 then 2.5 when c.pct >= 0.7 then 1.5 when c.pct >= 0.35 then 1 else 0.7 end;
  pts := round(f.price * mult * (0.5 + c.pct::numeric))::int;
  kg := greatest(0.05, round(power(c.cm / 100.0, 3) * 12, 2));
  select max(l.cm) into best from public.catch_log l where l.user_id = uid and l.fish_id = c.fish_id;

  insert into public.catch_log (user_id, fish_id, cm, kg, points, rod_id, week_key)
  values (uid, c.fish_id, c.cm, kg, pts, c.rod_id, public.nt_week_key(now()));
  update public.fishing_casts set used = true, finished_at = now(), result = 'caught' where id = c.id;

  -- Tự động cập nhật điểm tuần vào weekly_scores để đồng bộ tuyệt đối với Bảng Vinh Danh
  insert into public.weekly_scores (user_id, week_key, name, scores, updated_at)
  values (
    uid,
    public.nt_week_key(now()),
    coalesce((select coalesce(nullif(name, ''), username, 'Ẩn danh') from public.players where user_id = uid), 'Ẩn danh'),
    jsonb_build_object('fish', pts, 'fish_big', c.cm),
    now()
  )
  on conflict (user_id, week_key) do update
  set scores = public.weekly_scores.scores || jsonb_build_object(
        'fish', coalesce((public.weekly_scores.scores->>'fish')::int, 0) + pts,
        'fish_big', greatest(coalesce((public.weekly_scores.scores->>'fish_big')::numeric, 0), c.cm)
      ),
      name = coalesce(nullif(public.weekly_scores.name, ''), (select coalesce(nullif(name, ''), username, 'Ẩn danh') from public.players where user_id = uid), 'Ẩn danh'),
      updated_at = now();

  return jsonb_build_object('caught', true, 'fish_id', f.id, 'name', f.name, 'emoji', f.emoji, 'rarity', f.rarity,
                            'cm', c.cm, 'kg', kg, 'points', pts, 'record', c.cm > coalesce(best, 0), 'slot', s,
                            'pct', round(c.pct::numeric, 4),
                            'tier', case when c.pct >= 0.92 then 3 when c.pct >= 0.7 then 2 when c.pct >= 0.35 then 1 else 0 end);
end $$;

create or replace function public.fishing_top(p_week text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  wk text := coalesce(p_week, public.nt_week_key(now()));
begin
  perform public.nt_inv_purge(uid);
  if wk !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'week_key phải dạng YYYY-MM-DD: %', wk using errcode = 'check_violation';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.points desc, x.biggest_cm desc)
    from (
      select l.user_id,
             coalesce(nullif(p.name, ''), p.username, 'Ẩn danh') as name,
             sum(l.points)::bigint as points,
             max(l.cm) as biggest_cm,
             (select l2.fish_id from public.catch_log l2
              where l2.user_id = l.user_id and l2.week_key = wk
              order by l2.cm desc, l2.caught_at limit 1) as biggest_fish,
             count(*)::int as fish_count
      from public.catch_log l
      left join public.players p on p.user_id = l.user_id
      where l.week_key = wk
      group by l.user_id, p.name, p.username
      order by sum(l.points) desc, max(l.cm) desc
      limit 50
    ) x), '[]'::jsonb);
end $$;

-- đổi mã quà tặng an toàn: Tra cứu từ bảng public.gift_codes trên Database, chống hack & chống spam tự động
create or replace function public.redeem_giftcode(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.nt_uid();
  clean text;
  gc public.gift_codes;
  att public.giftcode_attempts;
  cur_data jsonb;
  lock_sec int;
  new_lock timestamptz;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'Hãy nhập mã giftcode' using errcode = 'check_violation';
  end if;

  -- 1. Chống Spam / Brute-force cấp Database: Khóa và kiểm tra lịch sử thử của tài khoản
  select * into att from public.giftcode_attempts where user_id = uid for update;
  if not found then
    insert into public.giftcode_attempts (user_id, fail_count, locked_until, last_attempt)
    values (uid, 0, now() - interval '1 second', now() - interval '2 seconds')
    returning * into att;
  end if;

  -- Nếu đang trong thời gian bị phạt khóa do nhập sai nhiều lần
  if now() < att.locked_until then
    lock_sec := ceil(extract(epoch from (att.locked_until - now())))::int;
    raise exception 'Tài khoản đang bị khóa tạm thời trong % giây do nhập sai nhiều lần liên tiếp!', lock_sec
      using errcode = 'P0429';
  end if;

  -- Chặn spam click quá nhanh (< 1.5 giây giữa các lần bấm)
  if now() < att.last_attempt + interval '1.5 seconds' then
    raise exception 'Bạn đang thao tác quá nhanh, vui lòng đợi 2 giây!'
      using errcode = 'P0429';
  end if;

  -- Ghi nhận thời điểm thử gần nhất
  update public.giftcode_attempts set last_attempt = now() where user_id = uid;

  -- 2. Chuẩn hóa mã: bỏ dấu tiếng Việt, gạch nối, gạch dưới, khoảng trắng, chuyển chữ thường
  clean := lower(regexp_replace(
    translate(p_code, 'ÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴáàảãạâấầẩẫậăắằẳẵặđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ',
                      'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyaaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyy'),
    '[\s\-_]', '', 'g'
  ));

  -- 3. Tra cứu trong bảng public.gift_codes lưu trên Database bằng hash salted SHA-256
  select * into gc from public.gift_codes
  where code_hash = encode(sha256((salt || ':' || clean)::bytea), 'hex')
    and active = true;

  -- Nếu mã KHÔNG TỒN TẠI HOẶC SAI: Phạt tăng dần chống dò mã (Anti-Brute-Force)
  if not found then
    att.fail_count := att.fail_count + 1;
    if att.fail_count = 3 then
      new_lock := now() + interval '30 seconds';
    elsif att.fail_count = 4 then
      new_lock := now() + interval '60 seconds';
    elsif att.fail_count >= 5 then
      new_lock := now() + interval '300 seconds';
    else
      new_lock := now() - interval '1 second';
    end if;

    update public.giftcode_attempts
    set fail_count = att.fail_count, locked_until = new_lock
    where user_id = uid;

    if att.fail_count >= 3 then
      lock_sec := ceil(extract(epoch from (new_lock - now())))::int;
      raise exception 'Mã giftcode không chính xác! Bạn đã nhập sai % lần. Tạm khóa trong % giây!', att.fail_count, lock_sec
        using errcode = 'check_violation';
    end if;

    raise exception 'Mã giftcode không tồn tại hoặc đã hết hạn' using errcode = 'check_violation';
  end if;

  -- 4. Kiểm tra thời hạn nếu có
  if gc.expires_at is not null and now() > gc.expires_at then
    raise exception 'Mã giftcode đã hết hạn sử dụng' using errcode = 'check_violation';
  end if;

  -- 5. Kiểm tra giới hạn số lượt dùng toàn server nếu có
  if gc.max_uses is not null and gc.used_count >= gc.max_uses then
    raise exception 'Mã giftcode đã hết lượt sử dụng' using errcode = 'check_violation';
  end if;

  -- 6. Kiểm tra: mỗi tài khoản chỉ được sử dụng mã code đó 1 lần duy nhất trong DB
  if gc.once_per_account and exists (select 1 from public.redeemed_giftcodes where user_id = uid and code_id = gc.id) then
    raise exception 'Mỗi tài khoản chỉ được sử dụng mã code này 1 lần duy nhất!' using errcode = 'check_violation';
  end if;

  -- 7. Nhập đúng -> Reset bộ đếm lỗi của tài khoản
  update public.giftcode_attempts set fail_count = 0, locked_until = now() - interval '1 second' where user_id = uid;

  -- 8. Ghi nhận lịch sử nhận quà vào bảng redeemed_giftcodes trong Database
  insert into public.redeemed_giftcodes (user_id, code_id, reward_gold, reward_gems)
  values (uid, gc.id, gc.reward_gold, gc.reward_gems);

  -- 9. Tăng số lần sử dụng trong DB
  update public.gift_codes set used_count = used_count + 1 where id = gc.id;

  -- 10. Khóa ví và cộng thẳng vào ví người chơi trong DB
  perform public.nt_wallet_lock(uid);
  update public.wallets
  set gold = least(gold + gc.reward_gold, 1000000000000),
      gems = gems + gc.reward_gems,
      gold_clock = now(),
      gems_clock = now(),
      synced_at = now()
  where user_id = uid;

  -- 11. Đồng bộ ngay vào bản lưu (saves) để không bị lệch tiến trình
  select data into cur_data from public.saves where user_id = uid;
  if cur_data is not null then
    update public.saves
    set data = jsonb_set(
      jsonb_set(
        jsonb_set(
          cur_data,
          '{gold}',
          to_jsonb(coalesce((cur_data->>'gold')::numeric, 0) + gc.reward_gold)
        ),
        '{gems}',
        to_jsonb(coalesce((cur_data->>'gems')::numeric, 0) + gc.reward_gems)
      ),
      '{redeemed}',
      case
        when jsonb_typeof(cur_data->'redeemed') = 'array'
        then cur_data->'redeemed' || to_jsonb(gc.id)
        else jsonb_build_array(gc.id)
      end
    ),
    updated_at = now()
    where user_id = uid;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code_id', gc.id,
    'gold', gc.reward_gold,
    'gems', gc.reward_gems,
    'message', format('🎁 Nhận quà thành công: +%s 🪙 Vàng, +%s 💎 Kim cương!',
                      to_char(gc.reward_gold, 'FM999,999,999'),
                      to_char(gc.reward_gems, 'FM999,999,999'))
  );
end $$;

-- ================================================================ QUYỀN

alter table public.fish_species       enable row level security;
alter table public.rod_defs           enable row level security;
alter table public.rod_fish_rates     enable row level security;
alter table public.kite_defs          enable row level security;
alter table public.box_defs           enable row level security;
alter table public.shop_items         enable row level security;
alter table public.bait_defs          enable row level security;
alter table public.inventory_slots    enable row level security;
alter table public.wallets            enable row level security;
alter table public.fishing_casts      enable row level security;
alter table public.catch_log          enable row level security;
alter table public.gift_codes         enable row level security;
alter table public.redeemed_giftcodes enable row level security;
alter table public.giftcode_attempts  enable row level security;

-- gift_codes & giftcode_attempts: bí mật tuyệt đối trên server, không cấp quyền select cho client/user nào
revoke all on table public.gift_codes, public.giftcode_attempts from public, anon, authenticated;

revoke all on table public.fish_species, public.rod_defs, public.rod_fish_rates, public.kite_defs, public.box_defs,
  public.shop_items, public.bait_defs, public.inventory_slots, public.wallets, public.fishing_casts, public.catch_log,
  public.redeemed_giftcodes
  from public, anon, authenticated;
-- catalog: ai đăng nhập cũng đọc được; dữ liệu người chơi: chỉ đọc của mình; fishing_casts: bí mật hoàn toàn
grant select on table public.fish_species, public.rod_defs, public.rod_fish_rates, public.kite_defs, public.box_defs,
  public.shop_items, public.bait_defs, public.inventory_slots, public.wallets, public.catch_log, public.redeemed_giftcodes
  to authenticated;

do $$
declare t text;
begin
  foreach t in array array['fish_species', 'rod_defs', 'rod_fish_rates', 'kite_defs', 'box_defs', 'shop_items', 'bait_defs'] loop
    execute format('drop policy if exists %I on public.%I', 'catalog: xem tất cả', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'catalog: xem tất cả', t);
  end loop;
  foreach t in array array['inventory_slots', 'wallets', 'catch_log', 'redeemed_giftcodes'] loop
    execute format('drop policy if exists %I on public.%I', 'của mình: chỉ đọc', t);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', 'của mình: chỉ đọc', t);
  end loop;
end $$;

-- hàm phụ: không ai gọi được qua /rpc
revoke all on function public.nt_uid() from public, anon, authenticated;
revoke all on function public.nt_rarity_rank(text) from public, anon, authenticated;
revoke all on function public.nt_week_key(timestamptz) from public, anon, authenticated;
revoke all on function public.nt_wallet_lock(uuid) from public, anon, authenticated;
revoke all on function public.nt_inv_purge(uuid) from public, anon, authenticated;
revoke all on function public.nt_inv_free_slots(uuid) from public, anon, authenticated;
revoke all on function public.nt_inv_add_stack(uuid, text, int) from public, anon, authenticated;
revoke all on function public.nt_chest_slots(uuid) from public, anon, authenticated;
revoke all on function public.nt_roll_duration() from public, anon, authenticated;
revoke all on function public.nt_roll_rarity(jsonb, int) from public, anon, authenticated;
revoke all on function public.nt_roll_fish(text, numeric, boolean) from public, anon, authenticated;

-- RPC: chỉ người đã đăng nhập
revoke all on function public.get_chest() from public, anon;
revoke all on function public.sync_wallet(bigint, int) from public, anon;
revoke all on function public.buy_item(text, int) from public, anon;
revoke all on function public.open_box(text, int) from public, anon;
revoke all on function public.equip(int) from public, anon;
revoke all on function public.discard_item(int, int) from public, anon;
revoke all on function public.sell_item(int, int) from public, anon;
revoke all on function public.fish_start(text) from public, anon;
revoke all on function public.fish_finish(uuid, boolean) from public, anon;
revoke all on function public.fishing_top(text) from public, anon;
revoke all on function public.redeem_giftcode(text) from public, anon;
grant execute on function public.get_chest() to authenticated;
grant execute on function public.sync_wallet(bigint, int) to authenticated;
grant execute on function public.buy_item(text, int) to authenticated;
grant execute on function public.open_box(text, int) to authenticated;
grant execute on function public.equip(int) to authenticated;
grant execute on function public.discard_item(int, int) to authenticated;
grant execute on function public.sell_item(int, int) to authenticated;
grant execute on function public.fish_start(text) to authenticated;
grant execute on function public.fish_finish(uuid, boolean) to authenticated;
grant execute on function public.fishing_top(text) to authenticated;
grant execute on function public.redeem_giftcode(text) to authenticated;
