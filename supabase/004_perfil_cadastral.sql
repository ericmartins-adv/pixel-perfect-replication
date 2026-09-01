-- ════════════════════════════════════════════════════════════════
-- Manso Villa — Dados cadastrais do sócio (nome, CPF, conta corrente...)
-- Cole no Supabase Dashboard → SQL Editor → Run, no projeto "Manso Villa"
-- (oldpbfkuymexbxwhfcmz).
--
-- Usa a tabela `profiles` que já existe e já tem RLS restrita a
-- auth.uid() = id (política "users_own_profile") — cada sócio só
-- enxerga/edita a própria linha. Nenhuma mudança de RLS necessária.
-- ════════════════════════════════════════════════════════════════

alter table profiles add column if not exists nome text;
alter table profiles add column if not exists cpf text;
alter table profiles add column if not exists telefone text;
alter table profiles add column if not exists banco text;
alter table profiles add column if not exists agencia text;
alter table profiles add column if not exists conta text;
alter table profiles add column if not exists chave_pix text;

select 'Colunas de perfil cadastral adicionadas com sucesso!' as resultado;
