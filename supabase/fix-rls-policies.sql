-- ════════════════════════════════════════════════════════════════
-- FIX: Políticas RLS — usa auth.uid() is not null (mais confiável)
-- Cole no Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ── 1. Diagnóstico: ver políticas atuais ────────────────────────
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('lancamentos','documentos','fases','tarefas','votacoes','reunioes','configuracoes')
order by tablename;

-- ── 2. Corrige políticas (auth.uid() is not null + WITH CHECK explícito) ──
drop policy if exists "auth_lancamentos" on lancamentos;
create policy "auth_lancamentos" on lancamentos
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_fases" on fases;
create policy "auth_fases" on fases
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_tarefas" on tarefas;
create policy "auth_tarefas" on tarefas
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_documentos" on documentos;
create policy "auth_documentos" on documentos
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_votacoes" on votacoes;
create policy "auth_votacoes" on votacoes
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_reunioes" on reunioes;
create policy "auth_reunioes" on reunioes
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "auth_config" on configuracoes;
create policy "auth_config" on configuracoes
  for all
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

-- ── 3. Teste: insert direto como superuser (bypass RLS) ─────────
-- Confirma que a tabela aceita dados
insert into lancamentos (id, data, tipo, descricao, categoria, valor, responsavel, rateio, criado_por)
values (
  'test-rls-check',
  current_date,
  'despesa',
  'Teste RLS — pode apagar',
  'Outras despesas',
  1,
  'eric',
  '{"eric":1,"michael":0,"heryk":0}',
  'eric'
) on conflict (id) do nothing;

select id, descricao from lancamentos where id = 'test-rls-check';

delete from lancamentos where id = 'test-rls-check';

select 'RLS corrigida com sucesso!' as resultado;
