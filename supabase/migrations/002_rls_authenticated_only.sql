do $$
declare
  table_name text;
  protected_tables text[] := array[
    'clients',
    'characters',
    'designs',
    'colors',
    'sizes',
    'sales',
    'payments',
    'expenses',
    'inventory'
  ];
begin
  foreach table_name in array protected_tables loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_authenticated_select',
      table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.role() = ''authenticated'')',
      table_name || '_authenticated_select',
      table_name
    );

    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_authenticated_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.role() = ''authenticated'')',
      table_name || '_authenticated_insert',
      table_name
    );

    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_authenticated_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      table_name || '_authenticated_update',
      table_name
    );

    execute format(
      'drop policy if exists %I on public.%I',
      table_name || '_authenticated_delete',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.role() = ''authenticated'')',
      table_name || '_authenticated_delete',
      table_name
    );

    execute format('revoke all on table public.%I from anon', table_name);
    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      table_name
    );
  end loop;
end
$$;
