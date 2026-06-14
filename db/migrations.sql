-- ============================================================================
-- FindU / Career OS — employer-side migrations (AS APPLIED to project poytyvkbbagrexhsaong)
-- This file mirrors the live database, in applied order.
-- ============================================================================

-- 1. hr_seats_roles_owner_seat_backfill
alter table public.hr_seats drop constraint if exists hr_seats_role_check;
update public.hr_seats set role = 'admin' where role = 'hr';
alter table public.hr_seats add constraint hr_seats_role_check check (role in ('owner','admin','member'));
alter table public.hr_seats alter column role set default 'member';
alter table public.hr_seats add constraint hr_seats_company_profile_unique unique (company_id, profile_id);
insert into public.hr_seats (company_id, profile_id, role, granted_by)
select c.id, c.owner_id, 'owner', c.owner_id from public.companies c where c.owner_id is not null
on conflict (company_id, profile_id) do nothing;

-- 2. company_profile_columns_and_code (functions shown with hardened search_path)
alter table public.companies
  add column if not exists cover_url    text,
  add column if not exists location     text,
  add column if not exists website      text,
  add column if not exists tagline      text,
  add column if not exists founded      text,
  add column if not exists specialties  text[] not null default '{}',
  add column if not exists markets      text[] not null default '{}',
  add column if not exists company_code text;

create or replace function public.gen_company_code(p_name text)
returns text language plpgsql set search_path = public as $$
declare
  prefix text := upper(left(regexp_replace(coalesce(p_name,'CO'),'[^A-Za-z]','','g') || 'CO', 4));
  code text;
begin
  loop
    code := prefix || '-' || upper(substr(md5(random()::text),1,4));
    exit when not exists (select 1 from public.companies where company_code = code);
  end loop;
  return code;
end $$;

create or replace function public.set_company_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.company_code is null then new.company_code := public.gen_company_code(new.name); end if;
  return new;
end $$;
drop trigger if exists trg_set_company_code on public.companies;
create trigger trg_set_company_code before insert on public.companies for each row execute function public.set_company_code();
update public.companies set company_code = public.gen_company_code(name) where company_code is null;
create unique index if not exists companies_company_code_key on public.companies (company_code);

-- 3. join_company_by_code_rpc (authenticated only)
create or replace function public.join_company_by_code(p_code text)
returns table (company_id uuid, company_name text)
language plpgsql security definer set search_path = public as $$
declare c public.companies;
begin
  select * into c from public.companies where company_code = upper(trim(p_code));
  if not found then raise exception 'invalid_code'; end if;
  insert into public.hr_seats (company_id, profile_id, role, granted_by)
  values (c.id, auth.uid(), 'member', auth.uid()) on conflict (company_id, profile_id) do nothing;
  return query select c.id, c.name;
end $$;
revoke execute on function public.join_company_by_code(text) from public;
grant execute on function public.join_company_by_code(text) to authenticated;

-- 4. notifications_table_and_triggers
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('join','applicant','message','status','system')),
  body text not null, link text, read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);
alter table public.notifications enable row level security;
create policy notif_select_own on public.notifications for select using (user_id = auth.uid());
create policy notif_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_delete_own on public.notifications for delete using (user_id = auth.uid());

create or replace function public.notify_on_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid; joiner text; cname text;
begin
  if new.role <> 'owner' then
    select c.owner_id, c.name into owner_id, cname from public.companies c where c.id = new.company_id;
    select full_name into joiner from public.profiles where id = new.profile_id;
    if owner_id is not null and owner_id <> new.profile_id then
      insert into public.notifications(user_id, type, body, link)
      values (owner_id, 'join', coalesce(joiner,'Someone')||' joined '||coalesce(cname,'your company')||' as a '||new.role||'.', '/team');
    end if;
  end if; return new;
end $$;
drop trigger if exists trg_notify_on_join on public.hr_seats;
create trigger trg_notify_on_join after insert on public.hr_seats for each row execute function public.notify_on_join();

create or replace function public.notify_on_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare jt text; poster uuid; aname text;
begin
  select title, posted_by into jt, poster from public.jobs where id = new.job_id;
  select full_name into aname from public.profiles where id = new.candidate_id;
  if poster is not null then
    insert into public.notifications(user_id, type, body, link)
    values (poster, 'applicant', coalesce(aname,'A candidate')||' applied to '||coalesce(jt,'your job')||'.', null);
  end if; return new;
end $$;
drop trigger if exists trg_notify_on_application on public.applications;
create trigger trg_notify_on_application after insert on public.applications for each row execute function public.notify_on_application();

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare cand uuid; emp uuid; recip uuid; sname text;
begin
  select m.candidate_id, m.employer_id into cand, emp
  from public.message_threads t join public.matches m on m.id = t.match_id where t.id = new.thread_id;
  recip := case when new.sender_id = cand then emp else cand end;
  select full_name into sname from public.profiles where id = new.sender_id;
  if recip is not null and recip <> new.sender_id then
    insert into public.notifications(user_id, type, body, link)
    values (recip, 'message', 'New message from '||coalesce(sname,'someone')||'.', '/messaging');
  end if; return new;
end $$;
drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message after insert on public.messages for each row execute function public.notify_on_message();

revoke execute on function public.notify_on_join() from public;
revoke execute on function public.notify_on_application() from public;
revoke execute on function public.notify_on_message() from public;

-- 5. company_storage_buckets (company-reports is public for downloads)
insert into storage.buckets (id, name, public) values
  ('company-covers','company-covers', true),
  ('company-logos','company-logos', true),
  ('leadership-photos','leadership-photos', true),
  ('company-reports','company-reports', true)
on conflict (id) do nothing;
update storage.buckets set public = true where id = 'company-reports';
create policy "read public company assets" on storage.objects for select
  using (bucket_id in ('company-covers','company-logos','leadership-photos','company-reports'));
create policy "write company assets" on storage.objects for insert to authenticated
  with check (bucket_id in ('company-covers','company-logos','leadership-photos','company-reports'));
create policy "update company assets" on storage.objects for update to authenticated
  using (bucket_id in ('company-covers','company-logos','leadership-photos','company-reports'));
create policy "delete company assets" on storage.objects for delete to authenticated
  using (bucket_id in ('company-covers','company-logos','leadership-photos','company-reports'));

-- 6. rls_policies_revised + members_can_read_company_seats
create or replace function public.company_role(p_company uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.hr_seats where company_id = p_company and profile_id = auth.uid() limit 1;
$$;
revoke execute on function public.company_role(uuid) from public;
grant execute on function public.company_role(uuid) to authenticated;
create or replace function public.is_company_member(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.hr_seats where company_id = p_company and profile_id = auth.uid());
$$;
revoke execute on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;

alter table public.jobs  enable row level security;   -- existing policies kept
alter table public.posts enable row level security;   -- existing policies kept

create policy uf_read  on public.user_follows for select to authenticated using (true);
create policy uf_write on public.user_follows for all to authenticated using (follower_id = auth.uid()) with check (follower_id = auth.uid());
alter table public.user_follows enable row level security;
create policy pr_read  on public.post_reactions for select to authenticated using (true);
create policy pr_write on public.post_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.post_reactions enable row level security;
create policy rp_read  on public.reposts for select to authenticated using (true);
create policy rp_write on public.reposts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.reposts enable row level security;
create policy cm_read   on public.comments for select to authenticated using (true);
create policy cm_insert on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy cm_update on public.comments for update to authenticated using (user_id = auth.uid());
create policy cm_delete on public.comments for delete to authenticated using (user_id = auth.uid());
alter table public.comments enable row level security;
create policy cr_read  on public.comment_reactions for select to authenticated using (true);
create policy cr_write on public.comment_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.comment_reactions enable row level security;
create policy pv_read  on public.poll_votes for select to authenticated using (true);
create policy pv_write on public.poll_votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.poll_votes enable row level security;
create policy bm_all on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.bookmarks enable row level security;
create policy bc_all on public.bookmark_collections for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.bookmark_collections enable row level security;
create policy poll_read  on public.polls for select to authenticated using (true);
create policy poll_write on public.polls for all to authenticated
  using (exists (select 1 from public.posts p where p.id = polls.post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = polls.post_id and p.author_id = auth.uid()));
alter table public.polls enable row level security;
create policy popt_read  on public.poll_options for select to authenticated using (true);
create policy popt_write on public.poll_options for all to authenticated
  using (exists (select 1 from public.polls pl join public.posts p on p.id = pl.post_id where pl.id = poll_options.poll_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.polls pl join public.posts p on p.id = pl.post_id where pl.id = poll_options.poll_id and p.author_id = auth.uid()));
alter table public.poll_options enable row level security;
create policy rep_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy rep_select on public.reports for select to authenticated using (reporter_id = auth.uid());
alter table public.reports enable row level security;

create policy seats_owner_update on public.hr_seats for update to authenticated using (public.company_role(hr_seats.company_id) = 'owner');
create policy seats_owner_delete on public.hr_seats for delete to authenticated using (public.company_role(hr_seats.company_id) = 'owner');
create policy seats_member_read  on public.hr_seats for select to authenticated using (public.is_company_member(hr_seats.company_id));
create policy companies_admin_update on public.companies for update to authenticated
  using (public.company_role(companies.id) in ('owner','admin'))
  with check (public.company_role(companies.id) in ('owner','admin'));

-- 7. auto_owner_seat_on_company_insert
create or replace function public.create_owner_seat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.hr_seats (company_id, profile_id, role, granted_by)
    values (new.id, new.owner_id, 'owner', new.owner_id) on conflict (company_id, profile_id) do nothing;
  end if; return new;
end $$;
drop trigger if exists trg_create_owner_seat on public.companies;
create trigger trg_create_owner_seat after insert on public.companies for each row execute function public.create_owner_seat();
revoke execute on function public.create_owner_seat() from public;

-- 8. company_leadership_and_reports
create table if not exists public.company_leadership (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, role text, avatar_url text, position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists company_leadership_company_idx on public.company_leadership(company_id);
alter table public.company_leadership enable row level security;
create policy cl_read  on public.company_leadership for select to authenticated using (true);
create policy cl_write on public.company_leadership for all to authenticated
  using (public.company_role(company_id) in ('owner','admin')) with check (public.company_role(company_id) in ('owner','admin'));

create table if not exists public.company_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  label text, file_name text, file_url text, created_at timestamptz not null default now()
);
create index if not exists company_reports_company_idx on public.company_reports(company_id);
alter table public.company_reports enable row level security;
create policy rpt_read  on public.company_reports for select to authenticated using (true);
create policy rpt_write on public.company_reports for all to authenticated
  using (public.company_role(company_id) in ('owner','admin')) with check (public.company_role(company_id) in ('owner','admin'));

-- ============================================================================
-- Known follow-ups (not applied): company_code readable via open companies SELECT;
-- pre-existing advisor WARNs (increment_view_count search_path; old public buckets
-- listing; not_interested/user_blocks RLS-without-policy); enable Auth leaked-password
-- protection in the dashboard.
-- ============================================================================
