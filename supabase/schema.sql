-- Nông Trại Mạo Hiểm — bản online (Supabase)
-- Cách chạy: `npm run db:apply` (đọc DIRECT_URL trong .env.local), hoặc dán toàn bộ file vào
-- Supabase Dashboard → SQL Editor → Run. Chạy lại nhiều lần cũng được (không xoá dữ liệu cũ).

-- ================================================================ BẢNG

-- tiến trình chơi (mỗi tài khoản 1 dòng)
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- người chơi (tên hiển thị, cấp — bảng Cao Thủ). Dòng được tạo tự động khi đăng ký (trigger trên auth.users).
create table if not exists public.players (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null unique,
  name       text not null default '',
  level      int  not null default 1,
  updated_at timestamptz not null default now()
);

-- điểm tuần (Đại Gia, Nông Dân, Thợ Săn, Câu Cá, Thả Diều…)
-- scores: {"gold": 1200, "farm": 30, "hunt": 85, "kite": 140, "fish": 900, "fish_big": 62.5}
create table if not exists public.weekly_scores (
  user_id    uuid not null references auth.users (id) on delete cascade,
  week_key   text not null,             -- ngày thứ Hai đầu tuần, vd 2026-10-26
  name       text not null default '',
  scores     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);
create index if not exists weekly_scores_week_idx on public.weekly_scores (week_key);

-- ================================================================ HÀM PHỤ

-- số khoá của 1 object jsonb (dùng trong CHECK, vì CHECK không cho subquery)
create or replace function public.nt_jsonb_key_count(j jsonb)
returns int language sql immutable strict parallel safe set search_path = ''
as $$ select count(*)::int from pg_catalog.jsonb_object_keys(j) $$;

-- true = lời gọi đến từ người chơi qua API (anon/authenticated) → phải kiểm tra chặt.
-- false = admin (SQL Editor, `npm run db:apply`, service_role) → bỏ qua giới hạn tốc độ / nhảy cấp.
create or replace function public.nt_is_client()
returns boolean language plpgsql stable set search_path = ''
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
  r text;
begin
  if session_user = 'authenticator' then
    r := coalesce(nullif(claims, '')::jsonb ->> 'role', '');
    return r <> 'service_role';
  end if;
  if claims is not null and claims <> '' then
    r := coalesce(claims::jsonb ->> 'role', '');
    return r in ('anon', 'authenticated', '');
  end if;
  return false;
end $$;

-- ================================================================ auth.users: kiểm tra tài khoản mới

create or replace function public.nt_auth_user_check()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  u text := new.raw_user_meta_data ->> 'username';
begin
  if u is null or u !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'Tên đăng nhập không hợp lệ (3–16 ký tự a-z, 0-9, _)'
      using errcode = 'check_violation', hint = 'username';
  end if;
  if u in ('admin', 'root', 'system', 'mod', 'moderator', 'support', 'gm') then
    raise exception 'Tên đăng nhập "%" được giữ lại, hãy chọn tên khác', u
      using errcode = 'check_violation', hint = 'username';
  end if;
  if lower(coalesce(new.email, '')) <> u || '@example.com' then
    raise exception 'Email phải đúng dạng <tên đăng nhập>@example.com'
      using errcode = 'check_violation', hint = 'email';
  end if;
  return new;
end $$;

-- chặn đổi email / username sau khi đã tạo (updateUser từ client) — tên đăng nhập là cố định
create or replace function public.nt_auth_user_lock()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) is distinct from lower(coalesce(old.email, '')) then
    raise exception 'Không được đổi email của tài khoản' using errcode = 'check_violation';
  end if;
  if (new.raw_user_meta_data ->> 'username') is distinct from (old.raw_user_meta_data ->> 'username') then
    raise exception 'Không được đổi tên đăng nhập' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- tự tạo dòng players khi đăng ký → username duy nhất do server quyết định
create or replace function public.nt_auth_user_created()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.players (user_id, username, name, level)
  values (new.id, new.raw_user_meta_data ->> 'username', '', 1)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists nt_auth_user_check on auth.users;
create trigger nt_auth_user_check before insert on auth.users
  for each row execute function public.nt_auth_user_check();

drop trigger if exists nt_auth_user_lock on auth.users;
create trigger nt_auth_user_lock before update of email, raw_user_meta_data on auth.users
  for each row execute function public.nt_auth_user_lock();

drop trigger if exists nt_auth_user_created on auth.users;
create trigger nt_auth_user_created after insert on auth.users
  for each row execute function public.nt_auth_user_created();

-- ================================================================ players

create or replace function public.nt_players_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  real_name text;
begin
  if tg_op = 'UPDATE' then
    -- username không bao giờ đổi
    new.username := old.username;
    new.user_id := old.user_id;
    -- nhảy cấp quá nhanh = sửa save. Lần đẩy đầu tiên (name còn trống) được mang cấp từ save offline cũ, nhưng tối đa cấp 50.
    if public.nt_is_client() and (
         (old.name <> '' and new.level > old.level + 20)
      or (old.name = '' and new.level > 50)) then
      raise exception 'Cấp tăng bất thường (% → %)', old.level, new.level using errcode = 'check_violation';
    end if;
  else
    select coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1))
      into real_name from auth.users u where u.id = new.user_id;
    if real_name is not null then
      new.username := real_name;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists nt_players_guard on public.players;
create trigger nt_players_guard before insert or update on public.players
  for each row execute function public.nt_players_guard();

-- ================================================================ saves

create or replace function public.nt_saves_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_gold numeric;
  new_gems numeric;
  new_level int;
  old_gold numeric;
  old_gems numeric;
  old_level int;
  sec_diff numeric;
  max_gold_gain numeric;
  max_gems_gain numeric;
  inv_k text;
  inv_v jsonb;
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
  end if;

  if jsonb_typeof(new.data) <> 'object' then
    raise exception 'data phải là object JSON' using errcode = 'check_violation';
  end if;

  -- Chỉ kiểm tra chặt chẽ khi gọi từ client (người chơi qua REST API/Supabase Client)
  if public.nt_is_client() then
    -- Chống spam / bot gửi save quá nhanh (dưới 400ms)
    if tg_op = 'UPDATE' and old.updated_at > now() - interval '400 milliseconds' then
      raise exception 'Lưu tiến trình quá nhanh, vui lòng đợi giây lát' using errcode = 'P0429';
    end if;

    -- Kiểm tra cấu trúc cơ bản
    new_gold := coalesce((new.data ->> 'gold')::numeric, 0);
    new_gems := coalesce((new.data ->> 'gems')::numeric, 0);
    new_level := coalesce((new.data -> 'player' ->> 'level')::int, 1);

    if new_gold < 0 or new_gold > 1000000000000 then
      raise exception 'Số dư vàng không hợp lệ (%): vượt ngưỡng cho phép', new_gold using errcode = 'check_violation';
    end if;
    if new_gems < 0 or new_gems > 10000000 then
      raise exception 'Số dư kim cương không hợp lệ (%): vượt ngưỡng cho phép', new_gems using errcode = 'check_violation';
    end if;
    if new_level < 1 or new_level > 100 then
      raise exception 'Cấp độ không hợp lệ (%): chỉ từ 1 đến 100', new_level using errcode = 'check_violation';
    end if;

    -- Kiểm tra đột biến khi cập nhật
    if tg_op = 'UPDATE' then
      old_gold := coalesce((old.data ->> 'gold')::numeric, 0);
      old_gems := coalesce((old.data ->> 'gems')::numeric, 0);
      old_level := coalesce((old.data -> 'player' ->> 'level')::int, 1);

      -- Cấp độ không được giảm
      if new_level < old_level then
        raise exception 'Cấp độ nhân vật không thể giảm (% -> %)', old_level, new_level using errcode = 'check_violation';
      end if;

      -- Cấp độ không được nhảy vọt quá 5 cấp trong 1 lần lưu
      if new_level > old_level + 5 then
        raise exception 'Cấp độ tăng bất thường (% -> %)', old_level, new_level using errcode = 'check_violation';
      end if;

      -- Chống tiêm vàng ảo (tăng quá nhanh)
      sec_diff := greatest(1, extract(epoch from (now() - old.updated_at)));
      max_gold_gain := 10000000 + (sec_diff * 50000);
      if new_gold > old_gold and (new_gold - old_gold) > max_gold_gain then
        raise exception 'Phát hiện can thiệp số dư vàng bất thường (+% vàng trong %s)', (new_gold - old_gold), round(sec_diff)
          using errcode = 'check_violation';
      end if;

      -- Chống tiêm kim cương ảo (kim cương chỉ nhận từ nhiệm vụ/quà, tối đa 500 viên/lần)
      max_gems_gain := 500 + round(sec_diff * 1.5);
      if new_gems > old_gems and (new_gems - old_gems) > max_gems_gain then
        raise exception 'Phát hiện can thiệp kim cương bất thường (+% kc)', (new_gems - old_gems)
          using errcode = 'check_violation';
      end if;
    end if;

    -- Kiểm tra kho đồ không chứa số lượng âm hoặc quá 99.999
    if jsonb_typeof(new.data -> 'inventory') = 'object' then
      for inv_k, inv_v in select * from jsonb_each(new.data -> 'inventory') loop
        if inv_k !~ '^[a-z0-9_]{1,40}$' then
          raise exception 'Mã vật phẩm trong kho không hợp lệ: %', inv_k using errcode = 'check_violation';
        end if;
        if jsonb_typeof(inv_v) <> 'number' or (inv_v #>> '{}')::numeric < 0 or (inv_v #>> '{}')::numeric > 99999 then
          raise exception 'Số lượng vật phẩm % không hợp lệ: %', inv_k, inv_v using errcode = 'check_violation';
        end if;
      end loop;
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists nt_saves_guard on public.saves;
create trigger nt_saves_guard before insert or update on public.saves
  for each row execute function public.nt_saves_guard();

-- ================================================================ weekly_scores

create or replace function public.nt_weekly_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  wk date;
  k text;
  v jsonb;
  v_fish_pts bigint;
  v_fish_cm numeric;
begin
  if new.week_key !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'week_key phải dạng YYYY-MM-DD: %', new.week_key using errcode = 'check_violation';
  end if;
  begin
    wk := new.week_key::date;
  exception when others then
    raise exception 'week_key không phải ngày hợp lệ: %', new.week_key using errcode = 'check_violation';
  end;
  if extract(isodow from wk) <> 1 then
    raise exception 'week_key phải là thứ Hai: %', new.week_key using errcode = 'check_violation';
  end if;

  if public.nt_is_client() then
    -- tuần tương lai = gian lận / đồng hồ sai
    if wk > current_date + 1 then
      raise exception 'week_key ở tương lai: %', new.week_key using errcode = 'check_violation';
    end if;
    -- tuần quá cũ: bỏ qua lặng lẽ (save lâu không chơi vẫn còn khoá tuần cũ; không làm hỏng cả lô upsert)
    if wk < current_date - 14 then
      return null;
    end if;
  end if;

  if jsonb_typeof(new.scores) <> 'object' then
    raise exception 'scores phải là object' using errcode = 'check_violation';
  end if;
  for k, v in select * from jsonb_each(new.scores) loop
    if k !~ '^[a-z0-9_]{1,24}$' then
      raise exception 'Tên bảng điểm không hợp lệ: %', k using errcode = 'check_violation';
    end if;
    if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric < 0 or (v #>> '{}')::numeric >= 1e12 then
      raise exception 'Điểm "%" không hợp lệ: %', k, v using errcode = 'check_violation';
    end if;

    -- Trần giới hạn điểm hợp lý hàng tuần chống hack bảng xếp hạng
    if public.nt_is_client() then
      if k = 'farm' and (v #>> '{}')::numeric > 100000 then
        raise exception 'Điểm Nông Dân tuần vượt ngưỡng hợp lệ (% > 100.000)', v using errcode = 'check_violation';
      elsif k = 'hunt' and (v #>> '{}')::numeric > 100000 then
        raise exception 'Điểm Thợ Săn tuần vượt ngưỡng hợp lệ (% > 100.000)', v using errcode = 'check_violation';
      elsif k = 'fish' and (v #>> '{}')::numeric > 50000 then
        raise exception 'Điểm Câu Cá tuần vượt ngưỡng hợp lệ (% > 50.000)', v using errcode = 'check_violation';
      elsif k = 'kite' and (v #>> '{}')::numeric > 20000 then
        raise exception 'Điểm Thả Diều tuần vượt ngưỡng hợp lệ (% > 20.000)', v using errcode = 'check_violation';
      elsif k = 'fish_big' and (v #>> '{}')::numeric > 10000 then
        raise exception 'Điểm Kích Thước Cá tuần vượt ngưỡng hợp lệ (% > 10.000)', v using errcode = 'check_violation';
      elsif k = 'gold' and (v #>> '{}')::numeric > 1000000000 then
        raise exception 'Điểm Đại Gia tuần vượt ngưỡng hợp lệ (% > 1.000.000.000)', v using errcode = 'check_violation';
      end if;
    end if;
  end loop;

  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.week_key := old.week_key;
  end if;

  -- Tự động đồng bộ điểm câu cá tuần từ catch_log (chống việc client đẩy 0 đè mất điểm thực)
  select coalesce(sum(points), 0)::bigint, coalesce(max(cm), 0)::numeric
    into v_fish_pts, v_fish_cm
    from public.catch_log
   where user_id = new.user_id and week_key = new.week_key;

  if v_fish_pts > 0 then
    new.scores := new.scores || jsonb_build_object(
      'fish', greatest(coalesce((new.scores->>'fish')::bigint, 0), coalesce(case when tg_op = 'UPDATE' then (old.scores->>'fish')::bigint else 0 end, 0), v_fish_pts),
      'fish_big', greatest(coalesce((new.scores->>'fish_big')::numeric, 0), coalesce(case when tg_op = 'UPDATE' then (old.scores->>'fish_big')::numeric else 0 end, 0), v_fish_cm)
    );
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists nt_weekly_guard on public.weekly_scores;
create trigger nt_weekly_guard before insert or update on public.weekly_scores
  for each row execute function public.nt_weekly_guard();

-- hàm trigger/hàm phụ không cho client gọi qua /rpc (trigger vẫn chạy bình thường)
revoke all on function public.nt_is_client() from public, anon, authenticated;
revoke all on function public.nt_auth_user_check() from public, anon, authenticated;
revoke all on function public.nt_auth_user_lock() from public, anon, authenticated;
revoke all on function public.nt_auth_user_created() from public, anon, authenticated;
revoke all on function public.nt_players_guard() from public, anon, authenticated;
revoke all on function public.nt_saves_guard() from public, anon, authenticated;
revoke all on function public.nt_weekly_guard() from public, anon, authenticated;

-- ================================================================ CHECK (NOT VALID rồi thử VALIDATE → dữ liệu cũ sai không làm hỏng lần chạy)

alter table public.players drop constraint if exists players_username_format;
alter table public.players add constraint players_username_format check (username ~ '^[a-z0-9_]{3,16}$') not valid;
alter table public.players drop constraint if exists players_name_len;
alter table public.players add constraint players_name_len check (char_length(name) <= 24) not valid;
alter table public.players drop constraint if exists players_level_range;
alter table public.players add constraint players_level_range check (level between 1 and 999) not valid;

alter table public.saves drop constraint if exists saves_data_object;
alter table public.saves add constraint saves_data_object check (jsonb_typeof(data) = 'object') not valid;
alter table public.saves drop constraint if exists saves_data_size;
alter table public.saves add constraint saves_data_size check (pg_column_size(data) < 512 * 1024) not valid;

alter table public.weekly_scores drop constraint if exists weekly_week_key_format;
alter table public.weekly_scores add constraint weekly_week_key_format check (week_key ~ '^\d{4}-\d{2}-\d{2}$') not valid;
alter table public.weekly_scores drop constraint if exists weekly_scores_shape;
alter table public.weekly_scores add constraint weekly_scores_shape
  check (jsonb_typeof(scores) = 'object' and public.nt_jsonb_key_count(scores) <= 20) not valid;
alter table public.weekly_scores drop constraint if exists weekly_name_len;
alter table public.weekly_scores add constraint weekly_name_len check (char_length(name) <= 24) not valid;

do $$
declare c record;
begin
  for c in
    select conrelid::regclass::text as tbl, conname from pg_constraint
    where conrelid in ('public.players'::regclass, 'public.saves'::regclass, 'public.weekly_scores'::regclass)
      and contype = 'c' and not convalidated
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tbl, c.conname);
    exception when check_violation then
      raise notice 'Giữ NOT VALID: %.% (dữ liệu cũ vi phạm, dòng mới vẫn bị kiểm tra)', c.tbl, c.conname;
    end;
  end loop;
end $$;

-- ================================================================ BACKFILL: tài khoản tạo trước khi có trigger chưa có dòng players

insert into public.players (user_id, username, name, level)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
       left(coalesce(s.data #>> '{profile,name}', ''), 24),
       least(999, greatest(1, coalesce(case when s.data #>> '{player,level}' ~ '^\d{1,6}$'
                                            then (s.data #>> '{player,level}')::int end, 1)))
from auth.users u
left join public.saves s on s.user_id = u.id
where not exists (select 1 from public.players p where p.user_id = u.id)
  and coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)) ~ '^[a-z0-9_]{3,16}$'
on conflict do nothing;

-- ================================================================ QUYỀN: ai đăng nhập cũng xem được BXH, chỉ sửa được dòng của mình

alter table public.saves enable row level security;
alter table public.players enable row level security;
alter table public.weekly_scores enable row level security;

-- chưa đăng nhập (anon) không được gì; đã đăng nhập chỉ select/insert/update — không xoá được
revoke all on table public.saves, public.players, public.weekly_scores from public, anon;
revoke all on table public.saves, public.players, public.weekly_scores from authenticated;
grant select, insert, update on table public.saves, public.players, public.weekly_scores to authenticated;

drop policy if exists "save: đọc của mình" on public.saves;
drop policy if exists "save: ghi của mình" on public.saves;
drop policy if exists "save: sửa của mình" on public.saves;
create policy "save: đọc của mình" on public.saves for select to authenticated using (auth.uid() = user_id);
create policy "save: ghi của mình" on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "save: sửa của mình" on public.saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "player: xem tất cả" on public.players;
drop policy if exists "player: ghi của mình" on public.players;
drop policy if exists "player: sửa của mình" on public.players;
create policy "player: xem tất cả" on public.players for select to authenticated using (true);
create policy "player: ghi của mình" on public.players for insert to authenticated with check (auth.uid() = user_id);
create policy "player: sửa của mình" on public.players for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "week: xem tất cả" on public.weekly_scores;
drop policy if exists "week: ghi của mình" on public.weekly_scores;
drop policy if exists "week: sửa của mình" on public.weekly_scores;
create policy "week: xem tất cả" on public.weekly_scores for select to authenticated using (true);
create policy "week: ghi của mình" on public.weekly_scores for insert to authenticated with check (auth.uid() = user_id);
create policy "week: sửa của mình" on public.weekly_scores for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- (cố ý KHÔNG có policy delete nào)
