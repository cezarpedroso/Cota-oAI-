create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'pt-BR' check (preferred_locale in ('pt-BR', 'en')),
  created_at timestamptz not null default now()
);

create table public.rfq_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft', 'open', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfq_sessions(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  quantity numeric(18,4) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) > 0),
  specifications jsonb,
  unique (id, rfq_id)
);

create table public.vendor_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfq_sessions(id) on delete cascade,
  vendor_name text not null check (length(trim(vendor_name)) > 0),
  raw_text text,
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  freight_cost numeric(18,4) check (freight_cost is null or freight_cost >= 0),
  tax_amount numeric(18,4) check (tax_amount is null or tax_amount >= 0),
  discount_amount numeric(18,4) check (discount_amount is null or discount_amount >= 0),
  delivery_days integer check (delivery_days is null or delivery_days >= 0),
  payment_terms text,
  status text not null default 'pending' check (status in ('pending', 'received', 'archived')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  unique (id, rfq_id)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null,
  quote_id uuid not null,
  rfq_item_id uuid not null,
  description text,
  quantity numeric(18,4) check (quantity is null or quantity > 0),
  unit_price numeric(18,4) check (unit_price is null or unit_price >= 0),
  unit text,
  line_total numeric(18,4) check (line_total is null or line_total >= 0),
  foreign key (rfq_id) references public.rfq_sessions(id) on delete cascade,
  foreign key (quote_id, rfq_id) references public.vendor_quotes(id, rfq_id) on delete cascade,
  foreign key (rfq_item_id, rfq_id) references public.rfq_items(id, rfq_id) on delete cascade
);

create index rfq_sessions_user_id_idx on public.rfq_sessions(user_id);
create index rfq_items_rfq_id_idx on public.rfq_items(rfq_id);
create index vendor_quotes_rfq_id_idx on public.vendor_quotes(rfq_id);
create index quote_items_rfq_id_idx on public.quote_items(rfq_id);
create index quote_items_quote_id_idx on public.quote_items(quote_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = pg_catalog as $$ begin new.updated_at = now(); return new; end; $$;
create trigger rfq_sessions_set_updated_at before update on public.rfq_sessions for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data ->> 'display_name'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;
do $$ begin if to_regprocedure('public.rls_auto_enable()') is not null then execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated'; end if; end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.rfq_sessions, public.rfq_items, public.vendor_quotes, public.quote_items to authenticated;

alter table public.profiles enable row level security;
alter table public.rfq_sessions enable row level security;
alter table public.rfq_items enable row level security;
alter table public.vendor_quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "profiles own record" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "rfqs own records" on public.rfq_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rfq items own rfqs" on public.rfq_items for all to authenticated using (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid())));
create policy "quotes own rfqs" on public.vendor_quotes for all to authenticated using (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid())));
create policy "quote items own rfqs" on public.quote_items for all to authenticated using (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.rfq_sessions r where r.id = rfq_id and r.user_id = (select auth.uid())));
