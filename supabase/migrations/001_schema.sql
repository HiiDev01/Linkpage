-- LinkPage schema. Run in Supabase SQL Editor (or `supabase db push`).
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- PROFILES (auth.users is managed by Supabase, so no custom users table)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null,
  full_name text,
  bio text check (char_length(bio) <= 500),
  professional_title text,
  profile_image text,
  location text,
  contact_email text,
  phone text,
  website text,
  theme_id uuid,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$')
);
create unique index profiles_username_key on public.profiles (lower(username));
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- THEMES (one row per profile)
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  preset text not null default 'light'
    check (preset in ('light','dark','minimal','professional','gradient','creative')),
  background_color text not null default '#ffffff',
  text_color text not null default '#14181f',
  button_color text not null default '#3b4bff',
  button_style text not null default 'rounded' check (button_style in ('rounded','pill','square','outline')),
  font_family text not null default 'sans' check (font_family in ('sans','serif','mono','display')),
  layout_style text not null default 'card' check (layout_style in ('card','flat','glass')),
  profile_image_shape text not null default 'circle' check (profile_image_shape in ('circle','rounded','square')),
  link_card_style text not null default 'filled' check (link_card_style in ('filled','outline','shadow'))
);
alter table public.profiles add constraint profiles_theme_fk
  foreign key (theme_id) references public.themes(id) on delete set null;

-- LINKS
create table public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  url text not null check (url ~* '^https?://'),
  description text check (char_length(description) <= 200),
  icon text,
  thumbnail text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index links_profile_order_idx on public.links (profile_id, display_order);

-- SOCIAL LINKS
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in
    ('instagram','facebook','linkedin','x','tiktok','youtube','github','whatsapp','telegram','website')),
  url text not null check (url ~* '^https?://'),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, platform)
);

-- PORTFOLIO
create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text,
  image_url text,
  project_url text check (project_url is null or project_url ~* '^https?://'),
  technologies text[] not null default '{}',
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_profile_order_idx on public.portfolio_projects (profile_id, display_order);

-- ANALYTICS (no IPs, user agents or visitor identifiers stored)
create table public.analytics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  link_id uuid references public.links(id) on delete set null,
  event_type text not null check (event_type in ('view','click')),
  created_at timestamptz not null default now()
);
create index analytics_profile_time_idx on public.analytics (profile_id, created_at desc);
create index analytics_link_idx on public.analytics (link_id);

-- AUTO-CREATE profile + theme on signup (username comes from signUp metadata)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare new_profile uuid; new_theme uuid;
begin
  insert into public.profiles (user_id, username, full_name, contact_email)
  values (new.id, lower(new.raw_user_meta_data->>'username'),
          new.raw_user_meta_data->>'full_name', new.email)
  returning id into new_profile;
  insert into public.themes (profile_id) values (new_profile) returning id into new_theme;
  update public.profiles set theme_id = new_theme where id = new_profile;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.themes enable row level security;
alter table public.links enable row level security;
alter table public.social_links enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.analytics enable row level security;

create policy "profiles owner select" on public.profiles for select using (user_id = auth.uid());
create policy "profiles owner update" on public.profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles public read" on public.profiles for select using (is_published);

do $$
declare t text;
begin
  foreach t in array array['themes','links','social_links','portfolio_projects'] loop
    execute format($f$create policy "%1$s owner all" on public.%1$I for all
      using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))
      with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()))$f$, t);
    execute format($f$create policy "%1$s public read" on public.%1$I for select
      using (exists (select 1 from public.profiles p where p.id = profile_id and p.is_published))$f$, t);
  end loop;
end $$;

-- analytics: owners can read; inserts happen only through the API (service role)
create policy "analytics owner select" on public.analytics for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));

-- STORAGE: public-read buckets; writes only inside your own folder (<user_id>/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']),
       ('portfolio','portfolio',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select
  using (bucket_id in ('avatars','portfolio'));
create policy "owner write images" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','portfolio') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner update images" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','portfolio') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner delete images" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','portfolio') and (storage.foldername(name))[1] = auth.uid()::text);
