-- Supabase SQL Editorで一度だけ実行してください。
-- このプロトタイプでは部屋の状態を1行にJSONで保存し、
-- Realtimeで変更を4人へ配信します。

create table if not exists public.mahjong_rooms (
  room_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.mahjong_rooms enable row level security;

drop policy if exists "rooms_select" on public.mahjong_rooms;
drop policy if exists "rooms_insert" on public.mahjong_rooms;
drop policy if exists "rooms_update" on public.mahjong_rooms;

create policy "rooms_select"
on public.mahjong_rooms for select
to anon, authenticated
using (true);

create policy "rooms_insert"
on public.mahjong_rooms for insert
to anon, authenticated
with check (true);

create policy "rooms_update"
on public.mahjong_rooms for update
to anon, authenticated
using (true)
with check (true);

alter table public.mahjong_rooms replica identity full;

-- Dashboard > Database > Replication で mahjong_rooms を
-- Realtime対象に追加してください。
