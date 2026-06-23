create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  contact_method text check (contact_method in ('instagram', 'whatsapp')),
  instagram_user text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  franchise text,
  status text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  finish_type text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id),
  name text not null,
  design_type text,
  suggested_price_plain numeric default 0,
  suggested_price_washed numeric default 0,
  estimated_dtf_cost numeric default 0,
  image_url text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text unique,
  client_id uuid references public.clients(id),
  character_id uuid references public.characters(id),
  design_id uuid references public.designs(id),
  color_id uuid references public.colors(id),
  size_id uuid references public.sizes(id),
  finish_type text,
  quantity numeric default 1,
  sale_price numeric default 0,
  shirt_cost numeric default 0,
  dtf_cost numeric default 0,
  packaging_cost numeric default 0,
  other_costs numeric default 0,
  production_status text default 'pedido_recibido',
  payment_status text default 'pendiente',
  order_date date,
  estimated_delivery_date date,
  real_delivery_date date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  payment_date date default current_date,
  amount numeric not null,
  payment_method text,
  reference text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date default current_date,
  category text,
  description text not null,
  amount numeric default 0,
  payment_method text,
  supplier text,
  sale_id uuid references public.sales(id),
  receipt_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  finish_type text,
  color_id uuid references public.colors(id),
  size_id uuid references public.sizes(id),
  stock_actual numeric default 0,
  stock_minimo numeric default 0,
  unit_cost numeric default 0,
  supplier text,
  notes text,
  created_at timestamptz default now()
);

-- Additive compatibility for databases where the tables already exist.
alter table public.clients
  add column if not exists phone text,
  add column if not exists contact_method text,
  add column if not exists instagram_user text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.characters
  add column if not exists franchise text,
  add column if not exists status text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.colors
  add column if not exists finish_type text,
  add column if not exists status text,
  add column if not exists created_at timestamptz default now();

alter table public.sizes
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default now();

alter table public.designs
  add column if not exists character_id uuid,
  add column if not exists design_type text,
  add column if not exists suggested_price_plain numeric default 0,
  add column if not exists suggested_price_washed numeric default 0,
  add column if not exists estimated_dtf_cost numeric default 0,
  add column if not exists image_url text,
  add column if not exists status text,
  add column if not exists created_at timestamptz default now();

alter table public.sales
  add column if not exists sale_number text,
  add column if not exists client_id uuid,
  add column if not exists character_id uuid,
  add column if not exists design_id uuid,
  add column if not exists color_id uuid,
  add column if not exists size_id uuid,
  add column if not exists finish_type text,
  add column if not exists quantity numeric default 1,
  add column if not exists sale_price numeric default 0,
  add column if not exists shirt_cost numeric default 0,
  add column if not exists dtf_cost numeric default 0,
  add column if not exists packaging_cost numeric default 0,
  add column if not exists other_costs numeric default 0,
  add column if not exists production_status text default 'pedido_recibido',
  add column if not exists payment_status text default 'pendiente',
  add column if not exists order_date date,
  add column if not exists estimated_delivery_date date,
  add column if not exists real_delivery_date date,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.payments
  add column if not exists sale_id uuid,
  add column if not exists payment_date date default current_date,
  add column if not exists amount numeric,
  add column if not exists payment_method text,
  add column if not exists reference text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.expenses
  add column if not exists expense_date date default current_date,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists amount numeric default 0,
  add column if not exists payment_method text,
  add column if not exists supplier text,
  add column if not exists sale_id uuid,
  add column if not exists receipt_url text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.inventory
  add column if not exists item_type text,
  add column if not exists finish_type text,
  add column if not exists color_id uuid,
  add column if not exists size_id uuid,
  add column if not exists stock_actual numeric default 0,
  add column if not exists stock_minimo numeric default 0,
  add column if not exists unit_cost numeric default 0,
  add column if not exists supplier text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

create unique index if not exists sales_sale_number_key
  on public.sales (sale_number)
  where sale_number is not null;

create index if not exists designs_character_id_idx on public.designs (character_id);
create index if not exists sales_client_id_idx on public.sales (client_id);
create index if not exists sales_character_id_idx on public.sales (character_id);
create index if not exists sales_design_id_idx on public.sales (design_id);
create index if not exists sales_order_date_idx on public.sales (order_date);
create index if not exists sales_production_status_idx on public.sales (production_status);
create index if not exists sales_payment_status_idx on public.sales (payment_status);
create index if not exists payments_sale_id_idx on public.payments (sale_id);
create index if not exists payments_payment_date_idx on public.payments (payment_date);
create index if not exists expenses_sale_id_idx on public.expenses (sale_id);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date);
create index if not exists inventory_color_size_idx on public.inventory (color_id, size_id);
create index if not exists inventory_item_type_idx on public.inventory (item_type);
