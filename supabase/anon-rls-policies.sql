-- ⚠️ OBSOLETO / NÃO EXECUTE — mantido só como histórico.
-- Este script deixa todas as tabelas abertas para qualquer pessoa com a
-- anon key (pública), sem exigir login. Foi substituído por
-- 003_restaurar_rls_autenticada.sql, que exige auth.uid() válido.
--
-- Permite acesso anônimo para todas as tabelas (RLS = true, mas políticas abertas)

drop policy if exists "auth_lancamentos" on lancamentos;
create policy "auth_lancamentos" on lancamentos
  for all
  using (true)
  with check (true);

drop policy if exists "auth_fases" on fases;
create policy "auth_fases" on fases
  for all
  using (true)
  with check (true);

drop policy if exists "auth_tarefas" on tarefas;
create policy "auth_tarefas" on tarefas
  for all
  using (true)
  with check (true);

drop policy if exists "auth_documentos" on documentos;
create policy "auth_documentos" on documentos
  for all
  using (true)
  with check (true);

drop policy if exists "auth_votacoes" on votacoes;
create policy "auth_votacoes" on votacoes
  for all
  using (true)
  with check (true);

drop policy if exists "auth_reunioes" on reunioes;
create policy "auth_reunioes" on reunioes
  for all
  using (true)
  with check (true);

drop policy if exists "auth_config" on configuracoes;
create policy "auth_config" on configuracoes
  for all
  using (true)
  with check (true);
