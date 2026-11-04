-- Danh hiệu — lưu thật trên Database (chạy SAU schema.sql + fishing.sql: `npm run db:apply`)
-- • title_defs   : danh mục danh hiệu (do scripts/db-apply.mjs nạp từ src/game/config/titles.ts). Không còn danh hiệu Giftcode.
-- • player_titles: danh hiệu từng tài khoản đang sở hữu — client KHÔNG ghi trực tiếp được.
-- • Danh hiệu Top 1–5 do server tự tính từ BXH thật (players.level, weekly_scores), rớt hạng là bị gỡ.
-- • Mỗi lần lưu save, trigger ghi đè data.titles + data.redeemed bằng dữ liệu thật trong DB.
-- Chạy lại nhiều lần được.

create table if not exists public.title_defs (
  id         text primary key,
  name       text not null,
  tier       text not null check (tier in ('common', 'rare', 'epic', 'legend', 'mythic')),
  board      text,
  rank       int,
  legacy     boolean not null default false,
  descr      text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.player_titles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  title_id   text not null references public.title_defs (id) on delete cascade,
  source     text not null default 'achievement' check (source in ('achievement', 'board', 'admin')),
  granted_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

-- danh hiệu đang đeo (người khác đọc được qua bảng players)
alter table public.players add column if not exists active_title text;
alter table public.players drop constraint if exists players_active_title_fk;
alter table public.players add constraint players_active_title_fk
  foreign key (active_title) references public.title_defs (id) on delete set null;

-- ================================================================ client không tự đặt active_title được

create or replace function public.nt_players_title_lock()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(current_setting('nt.title_write', true), '') <> '1' then
    if tg_op = 'UPDATE' then
      new.active_title := old.active_title;
    else
      new.active_title := null;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists nt_players_title_lock on public.players;
create trigger nt_players_title_lock before insert or update on public.players
  for each row execute function public.nt_players_title_lock();

-- ================================================================ Top 1–5 tính trên server

create or replace function public.nt_board_titles(p_uid uuid)
returns text[] language plpgsql stable security definer set search_path = ''
as $$
declare
  held text[] := '{}';
  b    text;
  wk   text;
  my   numeric;
  lvl  int;
  r    int;
  t    text;
begin
  -- Cao Thủ (cấp độ, toàn thời gian)
  select p.level into lvl from public.players p where p.user_id = p_uid;
  if lvl is not null and lvl > 0 then
    select 1 + count(*) into r from public.players p where p.user_id <> p_uid and p.level > lvl;
    if r <= 5 then held := held || ('top_level_' || r); end if;
  end if;

  -- bảng tuần: tuần này + tuần trước (giữ danh hiệu thêm 1 tuần như trong game)
  foreach wk in array array[public.nt_week_key(now()), public.nt_week_key(now() - interval '7 days')] loop
    foreach b in array array['gold', 'farm', 'hunt', 'kite', 'fish'] loop
      my := null;
      select case when jsonb_typeof(s.scores -> b) = 'number' then (s.scores ->> b)::numeric end
        into my from public.weekly_scores s where s.user_id = p_uid and s.week_key = wk;
      if my is not null and my > 0 then
        select 1 + count(*) into r from public.weekly_scores s
        where s.week_key = wk and s.user_id <> p_uid
          and jsonb_typeof(s.scores -> b) = 'number' and (s.scores ->> b)::numeric > my;
        t := 'top_' || b || '_' || r;
        if r <= 5 and not (t = any(held)) then held := held || t; end if;
      end if;
    end loop;
  end loop;
  return held;
end $$;

-- ================================================================ đối chiếu danh hiệu của 1 tài khoản

create or replace function public.nt_titles_reconcile(p_uid uuid, p_owned text[], p_active text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  held  text[];
  owned text[];
  act   text;
begin
  held := public.nt_board_titles(p_uid);

  -- Top: chỉ giữ đúng những gì server tính ra
  delete from public.player_titles pt
  using public.title_defs d
  where pt.user_id = p_uid and d.id = pt.title_id and d.board is not null and not (pt.title_id = any(held));

  insert into public.player_titles (user_id, title_id, source)
  select p_uid, d.id, 'board' from public.title_defs d where d.id = any(held)
  on conflict do nothing;

  -- thành tích: chỉ nhận id có trong danh mục, không phải danh hiệu Top, không phải danh hiệu cũ đã ngừng phát
  if p_owned is not null then
    insert into public.player_titles (user_id, title_id, source)
    select p_uid, d.id, 'achievement' from public.title_defs d
    where d.id = any(p_owned[1:500]) and d.board is null and not d.legacy
    on conflict do nothing;
  end if;

  select coalesce(array_agg(pt.title_id order by pt.granted_at, pt.title_id), '{}')
    into owned from public.player_titles pt where pt.user_id = p_uid;

  if p_active is not null and p_active = any(owned) then
    act := p_active;
  elsif p_active is not null then
    -- đang đeo danh hiệu không còn hợp lệ → đổi sang danh hiệu cao nhất đang có
    select pt.title_id into act
    from public.player_titles pt join public.title_defs d on d.id = pt.title_id
    where pt.user_id = p_uid
    order by array_position(array['common', 'rare', 'epic', 'legend', 'mythic'], d.tier) desc, pt.title_id
    limit 1;
  end if;

  perform set_config('nt.title_write', '1', true);
  update public.players set active_title = act where user_id = p_uid and active_title is distinct from act;
  perform set_config('nt.title_write', '', true);

  return jsonb_build_object('owned', to_jsonb(owned), 'active', to_jsonb(act));
end $$;

-- ================================================================ saves: dữ liệu danh hiệu / mã quà luôn lấy từ DB

create or replace function public.nt_saves_titles()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owned text[];
  res   jsonb;
  red   jsonb;
begin
  if jsonb_typeof(new.data -> 'titles' -> 'owned') = 'array' then
    select array_agg(x) into owned from jsonb_array_elements_text(new.data -> 'titles' -> 'owned') x;
  end if;
  res := public.nt_titles_reconcile(new.user_id, owned, new.data -> 'titles' ->> 'active');
  new.data := jsonb_set(new.data, '{titles}', res, true);

  select coalesce(jsonb_agg(r.code_id order by r.redeemed_at), '[]'::jsonb)
    into red from public.redeemed_giftcodes r where r.user_id = new.user_id;
  new.data := jsonb_set(new.data, '{redeemed}', red, true);
  return new;
end $$;

-- chạy sau nt_saves_guard (tên xếp theo chữ cái)
drop trigger if exists nt_saves_titles on public.saves;
create trigger nt_saves_titles before insert or update on public.saves
  for each row execute function public.nt_saves_titles();

-- ================================================================ QUYỀN

alter table public.title_defs    enable row level security;
alter table public.player_titles enable row level security;

revoke all on table public.title_defs, public.player_titles from public, anon, authenticated;
grant select on table public.title_defs, public.player_titles to authenticated;

drop policy if exists "catalog: xem tất cả" on public.title_defs;
create policy "catalog: xem tất cả" on public.title_defs for select to authenticated using (true);
drop policy if exists "của mình: chỉ đọc" on public.player_titles;
create policy "của mình: chỉ đọc" on public.player_titles for select to authenticated using (auth.uid() = user_id);

revoke all on function public.nt_players_title_lock() from public, anon, authenticated;
revoke all on function public.nt_board_titles(uuid) from public, anon, authenticated;
revoke all on function public.nt_titles_reconcile(uuid, text[], text) from public, anon, authenticated;
revoke all on function public.nt_saves_titles() from public, anon, authenticated;
