-- ════════════════════════════════════════════════════════════════
-- Manso Villa — Schema completo + RLS + Seed
-- Cole este SQL no Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ── Profiles (mapeia auth.users → sócio) ─────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  socio_id text not null check (socio_id in ('eric', 'michael', 'heryk')),
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "users_own_profile" on profiles;
create policy "users_own_profile" on profiles for all using (auth.uid() = id);

-- Permite que a função trigger (security definer) leia a tabela
drop policy if exists "service_role_profiles" on profiles;
create policy "service_role_profiles" on profiles for all to service_role using (true);

-- Trigger: mapeia email → sócio automaticamente ao criar usuário
-- Adicione aqui os e-mails reais de cada sócio (Gmail, etc.)
create or replace function handle_new_user()
returns trigger as $$
declare
  v_socio_id text;
begin
  v_socio_id := case lower(new.email)
    -- E-mails @mansovilla.app (login padrão)
    when 'eric@mansovilla.app'    then 'eric'
    when 'michael@mansovilla.app' then 'michael'
    when 'heryk@mansovilla.app'   then 'heryk'
    -- E-mails pessoais dos sócios (Google OAuth ou cadastro manual)
    when 'ericfsmartins@gmail.com' then 'eric'
    -- Adicione abaixo os e-mails pessoais de Michael e Heryk:
    -- when 'email.do.michael@gmail.com' then 'michael'
    -- when 'email.do.heryk@gmail.com'   then 'heryk'
    else null
  end;

  if v_socio_id is not null then
    insert into profiles (id, socio_id)
    values (new.id, v_socio_id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Lancamentos ──────────────────────────────────────────────────
create table if not exists lancamentos (
  id text primary key,
  data date not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  categoria text not null,
  valor numeric not null,
  responsavel text not null check (responsavel in ('eric', 'michael', 'heryk')),
  rateio jsonb not null default '{}',
  criado_por text not null check (criado_por in ('eric', 'michael', 'heryk')),
  criado_em timestamptz not null default now(),
  fase_id text
);
alter table lancamentos enable row level security;
drop policy if exists "auth_lancamentos" on lancamentos;
create policy "auth_lancamentos" on lancamentos for all using (auth.role() = 'authenticated');

-- ── Fases ────────────────────────────────────────────────────────
create table if not exists fases (
  id text primary key,
  numero text not null,
  titulo text not null,
  ordem integer not null
);
alter table fases enable row level security;
drop policy if exists "auth_fases" on fases;
create policy "auth_fases" on fases for all using (auth.role() = 'authenticated');

-- ── Tarefas ──────────────────────────────────────────────────────
create table if not exists tarefas (
  id text primary key,
  fase_id text not null references fases(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  data_prevista date,
  data_realizada date,
  custo_orcado numeric,
  custo_real numeric,
  responsavel text check (responsavel in ('eric', 'michael', 'heryk')),
  observacao text
);
alter table tarefas enable row level security;
drop policy if exists "auth_tarefas" on tarefas;
create policy "auth_tarefas" on tarefas for all using (auth.role() = 'authenticated');

-- ── Documentos ───────────────────────────────────────────────────
create table if not exists documentos (
  id text primary key,
  nome text not null,
  categoria text not null,
  tamanho_kb numeric not null,
  upload_em timestamptz not null default now(),
  upload_por text not null check (upload_por in ('eric', 'michael', 'heryk')),
  validade_em date,
  tags text[] not null default '{}',
  notas text
);
alter table documentos enable row level security;
drop policy if exists "auth_documentos" on documentos;
create policy "auth_documentos" on documentos for all using (auth.role() = 'authenticated');

-- ── Votacoes ─────────────────────────────────────────────────────
create table if not exists votacoes (
  id text primary key,
  titulo text not null,
  descricao text not null,
  valor numeric,
  criado_por text not null check (criado_por in ('eric', 'michael', 'heryk')),
  criado_em timestamptz not null default now(),
  prazo timestamptz not null,
  votos jsonb not null default '{}',
  decisao text not null check (decisao in ('pendente', 'aprovada', 'rejeitada')) default 'pendente'
);
alter table votacoes enable row level security;
drop policy if exists "auth_votacoes" on votacoes;
create policy "auth_votacoes" on votacoes for all using (auth.role() = 'authenticated');

-- ── Reunioes ─────────────────────────────────────────────────────
create table if not exists reunioes (
  id text primary key,
  data date not null,
  titulo text not null,
  participantes text[] not null default '{}',
  pauta text not null,
  deliberacoes text not null
);
alter table reunioes enable row level security;
drop policy if exists "auth_reunioes" on reunioes;
create policy "auth_reunioes" on reunioes for all using (auth.role() = 'authenticated');

-- ── Configuracoes (linha única) ──────────────────────────────────
create table if not exists configuracoes (
  id integer primary key default 1 check (id = 1),
  meta_obra numeric not null default 850000,
  perc_reserva numeric not null default 15,
  modelo_financeiro text not null
    check (modelo_financeiro in ('fundo-comum', 'reembolso-direto'))
    default 'fundo-comum'
);
alter table configuracoes enable row level security;
drop policy if exists "auth_config" on configuracoes;
create policy "auth_config" on configuracoes for all using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════
-- SEED
-- ═══════════════════════════════════════════════

insert into configuracoes (id) values (1) on conflict (id) do nothing;

insert into fases (id, numero, titulo, ordem) values
  ('f0', '0', 'Pré-projeto', 0),
  ('f1', '1', 'Estudos e Levantamentos', 1),
  ('f2', '2', 'Aprovações e Licenças', 2),
  ('f3', '3', 'Projetos Técnicos', 3),
  ('f4', '4', 'Preparação para Obra', 4),
  ('f5', '5', 'Execução da Obra', 5),
  ('f6', '6', 'Finalização', 6),
  ('f7', '7', 'Implantação e Mobiliamento', 7)
on conflict (id) do nothing;

insert into tarefas (id, fase_id, titulo) values
  ('t-f0-1','f0','Regularização documental (escritura, matrícula, convenção)'),
  ('t-f0-2','f0','Pesquisa e escolha do escritório de arquitetura'),
  ('t-f0-3','f0','Definição do programa de necessidades (briefing da casa)'),
  ('t-f0-4','f0','Estudo de viabilidade financeira da obra'),
  ('t-f1-1','f1','Sondagem e estudo do solo (SPT / ensaio de carga)'),
  ('t-f1-2','f1','Levantamento planialtimétrico e topográfico'),
  ('t-f1-3','f1','Levantamento da situação atual do terreno'),
  ('t-f1-4','f1','Estudo de insolação e ventos predominantes'),
  ('t-f2-1','f2','Aprovação do anteprojeto pelo condomínio'),
  ('t-f2-2','f2','Aprovação do projeto pela Prefeitura de Chapada dos Guimarães'),
  ('t-f2-3','f2','Alvará de construção'),
  ('t-f2-4','f2','ART / RRT do arquiteto e engenheiros'),
  ('t-f2-5','f2','Licença ambiental (APP do lago do Manso)'),
  ('t-f3-1','f3','Projeto Arquitetônico (anteprojeto + executivo)'),
  ('t-f3-2','f3','Projeto Estrutural'),
  ('t-f3-3','f3','Projeto Elétrico e Automação'),
  ('t-f3-4','f3','Projeto Hidrossanitário'),
  ('t-f3-5','f3','Projeto de Climatização'),
  ('t-f3-6','f3','Projeto de Cobertura e Impermeabilização'),
  ('t-f3-7','f3','Projeto Luminotécnico'),
  ('t-f3-8','f3','Projeto Paisagístico'),
  ('t-f3-9','f3','Projeto de Segurança'),
  ('t-f3-10','f3','Projeto de Piscina (a decidir)'),
  ('t-f3-11','f3','Memorial descritivo e especificações'),
  ('t-f3-12','f3','Planilha orçamentária (SINAPI)'),
  ('t-f4-1','f4','Escolha e contratação da construtora'),
  ('t-f4-2','f4','Contratação de seguro da obra'),
  ('t-f4-3','f4','Aprovação do cronograma físico-financeiro'),
  ('t-f4-4','f4','Contratação de gerenciadora ou fiscal de obras'),
  ('t-f4-5','f4','Instalação do canteiro de obras'),
  ('t-f5-1','f5','Terraplanagem e preparação do terreno'),
  ('t-f5-2','f5','Locação da edificação'),
  ('t-f5-3','f5','Fundações'),
  ('t-f5-4','f5','Estrutura (pilares, vigas, lajes)'),
  ('t-f5-5','f5','Alvenaria e vedação'),
  ('t-f5-6','f5','Cobertura e telhado'),
  ('t-f5-7','f5','Instalações elétricas e lógica'),
  ('t-f5-8','f5','Instalações hidráulicas e sanitárias'),
  ('t-f5-9','f5','Impermeabilização'),
  ('t-f5-10','f5','Revestimentos internos'),
  ('t-f5-11','f5','Revestimentos externos'),
  ('t-f5-12','f5','Esquadrias (portas, janelas, vidros)'),
  ('t-f5-13','f5','Área de lazer / pergolado'),
  ('t-f5-14','f5','Instalação de ar-condicionado'),
  ('t-f5-15','f5','Sistema de energia solar (a decidir)'),
  ('t-f5-16','f5','Pintura interna e externa'),
  ('t-f5-17','f5','Louças, metais e bancadas'),
  ('t-f5-18','f5','Paisagismo e jardinagem'),
  ('t-f6-1','f6','Limpeza final e entrega da obra'),
  ('t-f6-2','f6','Vistoria técnica e punch list'),
  ('t-f6-3','f6','Emissão do Habite-se'),
  ('t-f6-4','f6','Carta de Liberação do Condomínio'),
  ('t-f6-5','f6','Averbação da construção na matrícula'),
  ('t-f6-6','f6','Atualização do IPTU com nova área construída'),
  ('t-f7-1','f7','Móveis planejados (cozinha, dormitórios, área de serviço)'),
  ('t-f7-2','f7','Móveis soltos e decoração'),
  ('t-f7-3','f7','Eletrodomésticos e equipamentos'),
  ('t-f7-4','f7','Itens de lazer (churrasqueira, equipamentos náuticos)'),
  ('t-f7-5','f7','Casa pronta para uso')
on conflict (id) do nothing;

insert into lancamentos (id, data, tipo, descricao, categoria, valor, responsavel, rateio, criado_por, criado_em) values
  ('s1','2026-01-15','receita','Aporte inicial — compra do lote','Aporte',93351.52,'eric',
   '{"eric":93351.52,"michael":0,"heryk":0}','eric','2026-01-15T10:00:00Z'),
  ('s2','2026-01-15','receita','Aporte inicial — compra do lote','Aporte',93351.52,'michael',
   '{"eric":0,"michael":93351.52,"heryk":0}','michael','2026-01-15T10:00:00Z'),
  ('s3','2026-01-15','receita','Aporte inicial — compra do lote','Aporte',93351.51,'heryk',
   '{"eric":0,"michael":0,"heryk":93351.51}','heryk','2026-01-15T10:00:00Z'),
  ('s4','2026-01-20','despesa','Aquisição do Lote 01 - Quadra R','Outras despesas',280054.55,'eric',
   '{"eric":93351.52,"michael":93351.52,"heryk":93351.51}','eric','2026-01-20T14:00:00Z'),
  ('s5','2026-03-10','despesa','Taxa de condomínio - Março','Taxa de Condomínio',890,'michael',
   '{"eric":296.67,"michael":296.67,"heryk":296.66}','michael','2026-03-10T09:00:00Z'),
  ('s6','2026-04-05','receita','Aporte mensal - Abril','Aporte',5000,'heryk',
   '{"eric":0,"michael":0,"heryk":5000}','heryk','2026-04-05T08:00:00Z')
on conflict (id) do nothing;
