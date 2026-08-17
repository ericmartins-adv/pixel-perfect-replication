-- ════════════════════════════════════════════════════════════════
-- Manso Villa — Restaura RLS autenticada (reverte anon-rls-policies.sql)
-- Cole no Supabase Dashboard → SQL Editor → Run, no projeto "Manso Villa"
-- (oldpbfkuymexbxwhfcmz), NÃO em outro projeto/org.
--
-- Contexto: anon-rls-policies.sql deixou todas as tabelas com
-- `using (true) with check (true)` — qualquer pessoa com a anon key
-- (pública, embutida no bundle do app) conseguia ler/editar/apagar
-- 100% dos dados financeiros sem login. Este script exige uma sessão
-- autenticada (auth.uid() válido) para qualquer leitura ou escrita,
-- alinhado com o login que foi restaurado no app.
-- ════════════════════════════════════════════════════════════════

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

-- ── Conferência: lista as políticas ativas em cada tabela ─────────
-- Se aparecer `true` puro em `qual`/`with_check` (em vez de uma
-- expressão com auth.uid()), a tabela ainda está aberta.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('lancamentos','documentos','fases','tarefas','votacoes','reunioes','configuracoes')
order by tablename;

select 'RLS autenticada restaurada com sucesso!' as resultado;
