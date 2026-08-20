// Store Manso Villa — Supabase-backed
// Auth: Supabase Auth (email/senha + Google OAuth)
// Dados: Supabase Postgres com RLS
// Cache local: localStorage para leitura síncrona e offline
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export type SocioId = "eric" | "michael" | "heryk";

export interface Socio {
  id: SocioId;
  nome: string;
  email: string;
  iniciais: string;
  cor: string;
  apelidos: string[];
}

export const SOCIOS: Socio[] = [
  {
    id: "eric",
    nome: "Eric Fernando de Souza Martins",
    email: "ericfsmartins@gmail.com",
    iniciais: "EM",
    cor: "#1A6B72",
    apelidos: ["ERIC", "FERNANDO", "MARTINS"],
  },
  {
    id: "michael",
    nome: "Michael Kazuo Furuta",
    email: "michael.kazuo@gmail.com",
    iniciais: "MF",
    cor: "#8E44AD",
    apelidos: ["MICHAEL", "KAZUO", "FURUTA"],
  },
  {
    id: "heryk",
    nome: "Heryk de Deus Pereira",
    email: "herykdedeus@outlook.com",
    iniciais: "HP",
    cor: "#E67E22",
    apelidos: ["HERYK", "PEREIRA"],
  },
];

export type LancamentoTipo = "receita" | "despesa";

export const CATEGORIAS = [
  "Aporte",
  "Taxa de Condomínio",
  "IPTU",
  "Estudos e Levantamentos",
  "Projetos Técnicos",
  "Aprovações e Taxas Municipais",
  "Construção — Fundação",
  "Construção — Estrutura",
  "Construção — Alvenaria",
  "Construção — Cobertura",
  "Construção — Revestimentos",
  "Instalações Elétricas",
  "Instalações Hidrossanitárias",
  "Climatização",
  "Paisagismo",
  "Mobiliário e Decoração",
  "Equipamentos e Eletrodomésticos",
  "Seguros",
  "Honorários Profissionais",
  "Taxas Cartoriais e Registros",
  "Fundo Reserva",
  "Outras despesas",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Lancamento {
  id: string;
  data: string;
  tipo: LancamentoTipo;
  descricao: string;
  categoria: Categoria;
  valor: number;
  responsavel: SocioId;
  rateio: Record<SocioId, number>;
  criadoPor: SocioId;
  criadoEm: string;
  faseId?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  concluida: boolean;
  dataPrevista?: string;
  dataRealizada?: string;
  custoOrcado?: number;
  custoReal?: number;
  responsavel?: SocioId;
  observacao?: string;
}

export interface FaseObra {
  id: string;
  numero: string;
  titulo: string;
  tarefas: Tarefa[];
}

export const FASES_INICIAIS: FaseObra[] = [
  { id: "f0", numero: "0", titulo: "Pré-projeto", tarefas: [] },
  { id: "f1", numero: "1", titulo: "Estudos e Levantamentos", tarefas: [] },
  { id: "f2", numero: "2", titulo: "Aprovações e Licenças", tarefas: [] },
  { id: "f3", numero: "3", titulo: "Projetos Técnicos", tarefas: [] },
  { id: "f4", numero: "4", titulo: "Preparação para Obra", tarefas: [] },
  { id: "f5", numero: "5", titulo: "Execução da Obra", tarefas: [] },
  { id: "f6", numero: "6", titulo: "Finalização", tarefas: [] },
  { id: "f7", numero: "7", titulo: "Implantação e Mobiliamento", tarefas: [] },
];

export type DocCategoria =
  | "Imóvel"
  | "Projetos Técnicos"
  | "Contratos"
  | "ARTs e RRTs"
  | "Alvarás e Licenças"
  | "Notas Fiscais"
  | "Comprovantes"
  | "Atas de Reunião"
  | "Fotos";

export interface Documento {
  id: string;
  nome: string;
  categoria: DocCategoria;
  tamanhoKb: number;
  uploadEm: string;
  uploadPor: SocioId;
  validadeEm?: string;
  tags: string[];
  notas?: string;
}

export type VotoStatus = "pendente" | "aprovado" | "rejeitado" | "abstido";

export interface Votacao {
  id: string;
  titulo: string;
  descricao: string;
  valor?: number;
  criadoPor: SocioId;
  criadoEm: string;
  prazo: string;
  votos: Record<SocioId, { status: VotoStatus; justificativa?: string; em?: string }>;
  decisao: "pendente" | "aprovada" | "rejeitada";
}

export interface Reuniao {
  id: string;
  data: string;
  titulo: string;
  participantes: SocioId[];
  pauta: string;
  deliberacoes: string;
}

export interface Configuracoes {
  metaObra: number;
  percReserva: number;
  modeloFinanceiro: "fundo-comum" | "reembolso-direto";
}

interface State {
  sessao: SocioId | null;
  loading: boolean;
  authChecked: boolean;
  lancamentos: Lancamento[];
  fases: FaseObra[];
  documentos: Documento[];
  votacoes: Votacao[];
  reunioes: Reuniao[];
  config: Configuracoes;
}

// ── Mappers DB → App ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLancamento(r: any): Lancamento {
  return {
    id: r.id,
    data: r.data,
    tipo: r.tipo,
    descricao: r.descricao,
    categoria: r.categoria,
    valor: Number(r.valor),
    responsavel: r.responsavel,
    rateio: r.rateio ?? {},
    criadoPor: r.criado_por,
    criadoEm: r.criado_em,
    faseId: r.fase_id ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTarefa(r: any): Tarefa {
  return {
    id: r.id,
    titulo: r.titulo,
    concluida: r.concluida,
    dataPrevista: r.data_prevista ?? undefined,
    dataRealizada: r.data_realizada ?? undefined,
    custoOrcado: r.custo_orcado != null ? Number(r.custo_orcado) : undefined,
    custoReal: r.custo_real != null ? Number(r.custo_real) : undefined,
    responsavel: r.responsavel ?? undefined,
    observacao: r.observacao ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocumento(r: any): Documento {
  return {
    id: r.id,
    nome: r.nome,
    categoria: r.categoria,
    tamanhoKb: Number(r.tamanho_kb),
    uploadEm: r.upload_em,
    uploadPor: r.upload_por,
    validadeEm: r.validade_em ?? undefined,
    tags: r.tags ?? [],
    notas: r.notas ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVotacao(r: any): Votacao {
  return {
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao,
    valor: r.valor != null ? Number(r.valor) : undefined,
    criadoPor: r.criado_por,
    criadoEm: r.criado_em,
    prazo: r.prazo,
    votos: r.votos ?? {},
    decisao: r.decisao,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReuniao(r: any): Reuniao {
  return {
    id: r.id,
    data: r.data,
    titulo: r.titulo,
    participantes: r.participantes ?? [],
    pauta: r.pauta,
    deliberacoes: r.deliberacoes,
  };
}

// ── Estado ───────────────────────────────────────────────────────
const KEY = "manso-villa-state-v3";

const defaultConfig: Configuracoes = { metaObra: 850000, percReserva: 15, modeloFinanceiro: "fundo-comum" };

const initialState: State = {
  sessao: null,
  loading: true,
  authChecked: false,
  lancamentos: [],
  fases: FASES_INICIAIS,
  documentos: [],
  votacoes: [],
  reunioes: [],
  config: defaultConfig,
};

function loadCache(): Partial<State> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let state: State = { ...initialState, ...loadCache(), sessao: null, loading: true, authChecked: false };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  const { loading: _l, authChecked: _a, ...rest } = state;
  localStorage.setItem(KEY, JSON.stringify(rest));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMansoStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

// ── Carga de dados do Supabase ───────────────────────────────────
async function loadAllData() {
  try {
    const [
      { data: lancamentos, error: e1 },
      { data: fases, error: e2 },
      { data: tarefas, error: e3 },
      { data: documentos, error: e4 },
      { data: votacoes, error: e5 },
      { data: reunioes, error: e6 },
      { data: config, error: e7 },
    ] = await Promise.all([
      supabase.from("lancamentos").select("*").order("data", { ascending: false }),
      supabase.from("fases").select("*").order("ordem"),
      supabase.from("tarefas").select("*"),
      supabase.from("documentos").select("*").order("upload_em", { ascending: false }),
      supabase.from("votacoes").select("*").order("criado_em", { ascending: false }),
      supabase.from("reunioes").select("*").order("data", { ascending: false }),
      supabase.from("configuracoes").select("*").eq("id", 1).single(),
    ]);

    const erros = [e1, e2, e3, e4, e5, e6, e7].filter(Boolean);
    if (erros.length > 0) {
      console.error("[Store] Erros nas queries:", erros);
    }

    console.log("[Store] Dados carregados — lancamentos:", lancamentos?.length ?? 0, "| documentos:", documentos?.length ?? 0);

    const fasesComTarefas: FaseObra[] = (fases ?? []).map((f) => ({
      id: f.id,
      numero: f.numero,
      titulo: f.titulo,
      tarefas: (tarefas ?? []).filter((t) => t.fase_id === f.id).map(mapTarefa),
    }));

    state = {
      ...state,
      loading: false,
      lancamentos: (lancamentos ?? []).map(mapLancamento),
      fases: fasesComTarefas.length > 0 ? fasesComTarefas : FASES_INICIAIS,
      documentos: (documentos ?? []).map(mapDocumento),
      votacoes: (votacoes ?? []).map(mapVotacao),
      reunioes: (reunioes ?? []).map(mapReuniao),
      config: config
        ? { metaObra: Number(config.meta_obra), percReserva: Number(config.perc_reserva), modeloFinanceiro: config.modelo_financeiro }
        : defaultConfig,
    };
    persist();
    notify();
  } catch (err) {
    console.error("[Store] Erro ao carregar dados:", err);
    state = { ...state, loading: false };
    notify();
  }
}

// ── Mapa canônico de emails reais → socio_id ─────────────────────
// Inclui tanto os emails @mansovilla.app quanto os emails pessoais
// dos sócios, para que o login funcione independente do profiles table.
const EMAIL_SOCIO_MAP: Record<string, SocioId> = {
  "eric@mansovilla.app":     "eric",
  "michael@mansovilla.app":  "michael",
  "heryk@mansovilla.app":    "heryk",
  "ericfsmartins@gmail.com": "eric",
  "michael.kazuo@gmail.com": "michael",
  "herykdedeus@outlook.com": "heryk",
};

// ── Resolução de sócio a partir de sessão Supabase ───────────────
// 1. Tenta match direto por email (mapa canônico)
// 2. Se não encontrar, consulta tabela `profiles` (fallback para OAuth)
async function resolverSocio(user: { id: string; email?: string | null }): Promise<SocioId | null> {
  const email = (user.email ?? "").toLowerCase();

  // Match direto por email
  if (EMAIL_SOCIO_MAP[email]) return EMAIL_SOCIO_MAP[email];

  // Fallback: consulta tabela profiles (Google OAuth, emails não mapeados)
  const { data } = await supabase
    .from("profiles")
    .select("socio_id")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.socio_id) return data.socio_id as SocioId;
  return null;
}

// ── Auth — onAuthStateChange como única fonte de verdade ─────────
if (typeof window !== "undefined") {
  // Timeout de segurança: se INITIAL_SESSION não disparar em 8s
  // (Supabase inacessível, token refresh travado), libera a tela de login.
  const authTimeout = setTimeout(() => {
    if (!state.authChecked) {
      console.warn("[auth] timeout — Supabase não respondeu, liberando tela de login");
      state = { ...state, sessao: null, authChecked: true, loading: false };
      notify();
    }
  }, 8000);

  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        clearTimeout(authTimeout);
        if (session?.user) {
          const socioId = await resolverSocio(session.user);
          if (socioId) {
            state = { ...state, sessao: socioId, authChecked: true, loading: true };
            notify();
            loadAllData();
          } else {
            console.error("[auth] resolverSocio null para:", session.user.email);
            state = { ...state, sessao: null, authChecked: true, loading: false };
            notify();
            await supabase.auth.signOut();
          }
        } else {
          state = { ...state, sessao: null, authChecked: true, loading: false };
          notify();
        }
      } else if (event === "TOKEN_REFRESHED") {
        if (session?.user && !state.sessao) {
          const socioId = await resolverSocio(session.user);
          if (socioId) {
            state = { ...state, sessao: socioId, authChecked: true };
            notify();
          }
        }
      } else if (event === "SIGNED_OUT") {
        clearTimeout(authTimeout);
        state = { ...initialState, authChecked: true, loading: false };
        persist();
        notify();
      }
    } catch (err) {
      console.error("[auth] erro no handler:", err);
      if (!state.authChecked) {
        state = { ...state, sessao: null, authChecked: true, loading: false };
        notify();
      }
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────────
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ── Actions ──────────────────────────────────────────────────────
export const actions = {
  // Auth
  async login(email: string, senha: string): Promise<{ socio: Socio | null; erro: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) return { socio: null, erro: "E-mail não confirmado. Verifique sua caixa de entrada ou peça ao administrador para confirmar a conta." };
      if (msg.includes("invalid login") || msg.includes("invalid credentials")) return { socio: null, erro: "E-mail ou senha incorretos." };
      if (msg.includes("too many requests") || error.status === 429) return { socio: null, erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
      return { socio: null, erro: `Erro ao entrar: ${error.message}` };
    }
    if (!data.user) return { socio: null, erro: "Usuário não retornado pelo servidor." };
    const socioId = await resolverSocio(data.user);
    if (!socioId) {
      console.error("[login] resolverSocio returned null for email:", data.user.email);
      await supabase.auth.signOut();
      return { socio: null, erro: "E-mail não cadastrado como sócio. Entre em contato com o administrador." };
    }
    // Seta estado ANTES de retornar — garante que sessao já está definida
    // quando o componente de login chamar router.navigate, evitando race condition.
    state = { ...state, sessao: socioId, authChecked: true, loading: true };
    notify();
    loadAllData();
    return { socio: SOCIOS.find((s) => s.id === socioId) ?? null, erro: null };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  // Lançamentos
  async addLancamento(l: Omit<Lancamento, "id" | "criadoEm">) {
    const novo: Lancamento = { ...l, id: uid(), criadoEm: new Date().toISOString() };
    state = { ...state, lancamentos: [novo, ...state.lancamentos] };
    persist();
    notify();
    const { error } = await supabase.from("lancamentos").insert({
      id: novo.id, data: novo.data, tipo: novo.tipo, descricao: novo.descricao,
      categoria: novo.categoria, valor: novo.valor, responsavel: novo.responsavel,
      rateio: novo.rateio, criado_por: novo.criadoPor, criado_em: novo.criadoEm,
      fase_id: novo.faseId ?? null,
    });
    if (error) {
      console.error("[Supabase] addLancamento:", error);
      state = { ...state, lancamentos: state.lancamentos.filter((x) => x.id !== novo.id) };
      persist();
      notify();
      throw new Error(error.message);
    }
  },

  async removeLancamento(id: string) {
    const backup = state.lancamentos;
    state = { ...state, lancamentos: state.lancamentos.filter((x) => x.id !== id) };
    persist();
    notify();
    const { error } = await supabase.from("lancamentos").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] removeLancamento:", error);
      state = { ...state, lancamentos: backup };
      persist();
      notify();
      throw new Error(error.message);
    }
  },

  async addLancamentosBulk(arr: Omit<Lancamento, "id" | "criadoEm">[]) {
    const novos = arr.map((l) => ({ ...l, id: uid(), criadoEm: new Date().toISOString() }));
    state = { ...state, lancamentos: [...novos, ...state.lancamentos] };
    persist();
    notify();
    const rows = novos.map((novo) => ({
      id: novo.id, data: novo.data, tipo: novo.tipo, descricao: novo.descricao,
      categoria: novo.categoria, valor: novo.valor, responsavel: novo.responsavel,
      rateio: novo.rateio, criado_por: novo.criadoPor, criado_em: novo.criadoEm,
      fase_id: novo.faseId ?? null,
    }));
    const { error } = await supabase.from("lancamentos").insert(rows);
    if (error) {
      console.error("[Supabase] addLancamentosBulk:", error);
      const ids = new Set(novos.map((n) => n.id));
      state = { ...state, lancamentos: state.lancamentos.filter((x) => !ids.has(x.id)) };
      persist();
      notify();
      throw new Error(error.message);
    }
  },

  // Tarefas
  toggleTarefa(faseId: string, tarefaId: string) {
    let novoStatus = false;
    state = {
      ...state,
      fases: state.fases.map((f) =>
        f.id !== faseId ? f : {
          ...f,
          tarefas: f.tarefas.map((t) => {
            if (t.id !== tarefaId) return t;
            novoStatus = !t.concluida;
            return { ...t, concluida: novoStatus, dataRealizada: novoStatus ? new Date().toISOString().slice(0, 10) : undefined };
          }),
        }
      ),
    };
    persist();
    notify();
    supabase.from("tarefas").update({
      concluida: novoStatus,
      data_realizada: novoStatus ? new Date().toISOString().slice(0, 10) : null,
    }).eq("id", tarefaId)
      .then(({ error }) => { if (error) console.error("[Supabase] toggleTarefa:", error); });
  },

  updateTarefa(faseId: string, tarefaId: string, patch: Partial<Tarefa>) {
    state = {
      ...state,
      fases: state.fases.map((f) =>
        f.id !== faseId ? f : { ...f, tarefas: f.tarefas.map((t) => (t.id !== tarefaId ? t : { ...t, ...patch })) }
      ),
    };
    persist();
    notify();
    const dbPatch: Record<string, unknown> = {};
    if (patch.concluida !== undefined) dbPatch.concluida = patch.concluida;
    if (patch.dataPrevista !== undefined) dbPatch.data_prevista = patch.dataPrevista;
    if (patch.dataRealizada !== undefined) dbPatch.data_realizada = patch.dataRealizada;
    if (patch.custoOrcado !== undefined) dbPatch.custo_orcado = patch.custoOrcado;
    if (patch.custoReal !== undefined) dbPatch.custo_real = patch.custoReal;
    if (patch.responsavel !== undefined) dbPatch.responsavel = patch.responsavel;
    if (patch.observacao !== undefined) dbPatch.observacao = patch.observacao;
    supabase.from("tarefas").update(dbPatch).eq("id", tarefaId)
      .then(({ error }) => { if (error) console.error("[Supabase] updateTarefa:", error); });
  },

  // Documentos
  async addDocumento(d: Omit<Documento, "id" | "uploadEm">) {
    const novo: Documento = { ...d, id: uid(), uploadEm: new Date().toISOString() };
    state = { ...state, documentos: [novo, ...state.documentos] };
    persist();
    notify();
    const { error } = await supabase.from("documentos").insert({
      id: novo.id, nome: novo.nome, categoria: novo.categoria,
      tamanho_kb: novo.tamanhoKb, upload_em: novo.uploadEm,
      upload_por: novo.uploadPor, validade_em: novo.validadeEm ?? null,
      tags: novo.tags, notas: novo.notas ?? null,
    });
    if (error) {
      console.error("[Supabase] addDocumento:", error);
      state = { ...state, documentos: state.documentos.filter((x) => x.id !== novo.id) };
      persist();
      notify();
      throw new Error(error.message);
    }
  },

  async removeDocumento(id: string) {
    const backup = state.documentos;
    state = { ...state, documentos: state.documentos.filter((d) => d.id !== id) };
    persist();
    notify();
    const { error } = await supabase.from("documentos").delete().eq("id", id);
    if (error) {
      console.error("[Supabase] removeDocumento:", error);
      state = { ...state, documentos: backup };
      persist();
      notify();
      throw new Error(error.message);
    }
  },

  // Votações
  addVotacao(v: Omit<Votacao, "id" | "criadoEm" | "votos" | "decisao">) {
    const votos = Object.fromEntries(SOCIOS.map((s) => [s.id, { status: "pendente" as VotoStatus }])) as Votacao["votos"];
    votos[v.criadoPor] = { status: "aprovado", em: new Date().toISOString() };
    const novo: Votacao = { ...v, id: uid(), criadoEm: new Date().toISOString(), votos, decisao: "pendente" };
    state = { ...state, votacoes: [novo, ...state.votacoes] };
    persist();
    notify();
    supabase.from("votacoes").insert({
      id: novo.id, titulo: novo.titulo, descricao: novo.descricao,
      valor: novo.valor ?? null, criado_por: novo.criadoPor,
      criado_em: novo.criadoEm, prazo: novo.prazo, votos: novo.votos, decisao: novo.decisao,
    }).then(({ error }) => { if (error) console.error("[Supabase] addVotacao:", error); });
  },

  votar(votacaoId: string, socio: SocioId, status: VotoStatus, justificativa?: string) {
    let updatedVotacao: Votacao | null = null;
    state = {
      ...state,
      votacoes: state.votacoes.map((v) => {
        if (v.id !== votacaoId) return v;
        const votos = { ...v.votos, [socio]: { status, justificativa, em: new Date().toISOString() } };
        const aprov = Object.values(votos).filter((x) => x.status === "aprovado").length;
        const rejei = Object.values(votos).filter((x) => x.status === "rejeitado").length;
        const decisao: Votacao["decisao"] = aprov >= 2 ? "aprovada" : rejei >= 2 ? "rejeitada" : "pendente";
        updatedVotacao = { ...v, votos, decisao };
        return updatedVotacao;
      }),
    };
    persist();
    notify();
    const updated = updatedVotacao as Votacao | null;
    if (updated) {
      supabase.from("votacoes").update({ votos: updated.votos, decisao: updated.decisao }).eq("id", votacaoId)
        .then(({ error }) => { if (error) console.error("[Supabase] votar:", error); });
    }
  },

  // Reuniões
  addReuniao(r: Omit<Reuniao, "id">) {
    const novo: Reuniao = { ...r, id: uid() };
    state = { ...state, reunioes: [novo, ...state.reunioes] };
    persist();
    notify();
    supabase.from("reunioes").insert({
      id: novo.id, data: novo.data, titulo: novo.titulo,
      participantes: novo.participantes, pauta: novo.pauta, deliberacoes: novo.deliberacoes,
    }).then(({ error }) => { if (error) console.error("[Supabase] addReuniao:", error); });
  },

  // Configurações
  updateConfig(patch: Partial<Configuracoes>) {
    state = { ...state, config: { ...state.config, ...patch } };
    persist();
    notify();
    const dbPatch: Record<string, unknown> = {};
    if (patch.metaObra !== undefined) dbPatch.meta_obra = patch.metaObra;
    if (patch.percReserva !== undefined) dbPatch.perc_reserva = patch.percReserva;
    if (patch.modeloFinanceiro !== undefined) dbPatch.modelo_financeiro = patch.modeloFinanceiro;
    supabase.from("configuracoes").update(dbPatch).eq("id", 1)
      .then(({ error }) => { if (error) console.error("[Supabase] updateConfig:", error); });
  },

  resetarTudo() {
    state = { ...initialState, loading: false };
    persist();
    notify();
  },
};

// ── Helpers exportados ───────────────────────────────────────────
export function getSocio(id: SocioId): Socio {
  return SOCIOS.find((s) => s.id === id)!;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface SaldoSocio {
  socio: Socio;
  aportado: number;
  cotaDevida: number;
  saldo: number;
}

export function calcularSaldos(lancamentos: Lancamento[]): SaldoSocio[] {
  return SOCIOS.map((socio) => {
    let aportado = 0, cotaDevida = 0;
    for (const l of lancamentos) {
      if (l.tipo === "receita" && l.responsavel === socio.id) aportado += l.valor;
      if (l.tipo === "despesa") cotaDevida += l.rateio[socio.id] ?? 0;
    }
    return { socio, aportado, cotaDevida, saldo: aportado - cotaDevida };
  });
}

export function caixaTotal(lancamentos: Lancamento[]): number {
  return lancamentos.reduce((acc, l) => acc + (l.tipo === "receita" ? l.valor : -l.valor), 0);
}

export function progressoFase(f: FaseObra): number {
  if (f.tarefas.length === 0) return 0;
  return (f.tarefas.filter((t) => t.concluida).length / f.tarefas.length) * 100;
}

export function progressoGeral(fases: FaseObra[]): number {
  const total = fases.reduce((s, f) => s + f.tarefas.length, 0);
  const feitas = fases.reduce((s, f) => s + f.tarefas.filter((t) => t.concluida).length, 0);
  return total ? (feitas / total) * 100 : 0;
}

export function sugerirSocio(descricao: string): SocioId | null {
  const up = descricao.toUpperCase();
  for (const s of SOCIOS) {
    if (s.apelidos.some((a) => up.includes(a))) return s.id;
  }
  return null;
}

export interface OfxTx {
  data: string;
  valor: number;
  tipo: "credito" | "debito";
  descricao: string;
  fitId?: string;
}

export function parseOFX(content: string): OfxTx[] {
  const txs: OfxTx[] = [];
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  for (const b of blocks) {
    const get = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
      return m ? m[1].trim() : "";
    };
    const valor = parseFloat(get("TRNAMT").replace(",", "."));
    const dtRaw = get("DTPOSTED").slice(0, 8);
    const data =
      dtRaw.length === 8
        ? `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}`
        : new Date().toISOString().slice(0, 10);
    const memo = get("MEMO") || get("NAME") || "Transação";
    if (isNaN(valor)) continue;
    txs.push({ data, valor: Math.abs(valor), tipo: valor >= 0 ? "credito" : "debito", descricao: memo, fitId: get("FITID") });
  }
  return txs;
}
