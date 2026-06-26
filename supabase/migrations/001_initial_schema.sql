-- Adam Finance — initial schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_currency text not null default 'GBP',
  created_at timestamptz not null default now()
);

create table public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('trading212', 'nest', 'moneybox', 'bank')),
  label text not null,
  environment text not null default 'live' check (environment in ('live', 'demo')),
  credentials_ciphertext text not null,
  subtype text check (subtype in ('isa', 'invest', 'cfd', 'sipp')),
  last_synced_at timestamptz,
  last_sync_status text check (last_sync_status in ('success', 'error', 'pending')),
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, label)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (category in ('trading212', 'pensions', 'cash', 'property', 'other')),
  subtype text not null,
  source text not null default 'manual' check (source in ('manual', 'trading212', 'nest', 'moneybox', 'bank')),
  provider_connection_id uuid references public.provider_connections (id) on delete set null,
  external_id text,
  currency text not null default 'GBP',
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);
create index accounts_provider_connection_id_idx on public.accounts (provider_connection_id);

create table public.account_balances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  balance numeric not null default 0,
  source text not null default 'manual' check (source in ('manual', 'sync'))
);

create index account_balances_account_id_idx on public.account_balances (account_id);

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  symbol text not null,
  name text not null,
  isin text,
  quantity numeric not null default 0,
  average_cost numeric,
  current_price numeric,
  market_value numeric not null default 0,
  currency text not null default 'GBP',
  unrealized_pnl numeric,
  synced_at timestamptz not null default now(),
  unique (account_id, symbol)
);

create index holdings_account_id_idx on public.holdings (account_id);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  liability_type text not null check (liability_type in ('car_loan', 'credit_card', 'student_loan', 'mortgage', 'other')),
  current_balance numeric not null default 0,
  interest_rate numeric,
  minimum_payment numeric,
  currency text not null default 'GBP',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index liabilities_user_id_idx on public.liabilities (user_id);

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date date,
  category text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  external_id text,
  transaction_date date not null,
  type text not null,
  amount numeric not null,
  currency text not null default 'GBP',
  description text,
  created_at timestamptz not null default now(),
  unique (account_id, external_id)
);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  net_worth numeric not null default 0,
  assets_by_category jsonb not null default '{}',
  assets_by_subtype jsonb not null default '{}',
  assets_by_account jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index net_worth_snapshots_user_date_idx on public.net_worth_snapshots (user_id, snapshot_date desc);

create table public.user_financial_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  annual_expenses numeric,
  annual_savings numeric,
  target_retirement_age integer,
  safe_withdrawal_rate numeric,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.provider_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.account_balances enable row level security;
alter table public.holdings enable row level security;
alter table public.liabilities enable row level security;
alter table public.financial_goals enable row level security;
alter table public.transactions enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.user_financial_profile enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users manage own connections" on public.provider_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own balances" on public.account_balances
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "Users manage own holdings" on public.holdings
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "Users manage own liabilities" on public.liabilities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own goals" on public.financial_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own transactions" on public.transactions
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "Users manage own snapshots" on public.net_worth_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own financial profile" on public.user_financial_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
