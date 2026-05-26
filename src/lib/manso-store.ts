// Store local (MVP frontend-only) para Manso Villa
import { useSyncExternalStore } from "react";

export type SocioId = "eric" | "michael" | "heryk";

export interface Socio {
  id: SocioId;
  nome: string;
  email: string;
  senha: string;
  iniciais: string;
  cor: string;
  cpf?: string;
  apelidos: string[]; // para reconhecimento em extratos
}

export const SOCIOS: Socio[] = [
  {
    id: "eric",
    nome: "Eric Fernando de Souza Martins",
    email: "eric@mansovilla.app",
    senha: "manso123",
    iniciais: "EM",
    cor: "#1A6B72",
    apelidos: ["ERIC", "FERNANDO", "MARTINS"],
  },
  {
    id: "michael",
    nome: "Michael Kazuo Furuta",
    email: "michael@mansovilla.app",
    senha: "manso123",
    iniciais: "MF",
    cor: "#8E44AD",
    apelidos: ["MICHAEL", "KAZUO", "FURUTA"],
  },
  {
    id: "heryk",
    nome: "Heryk de Deus Pereira",
    email: "heryk@mansovilla.app",
    senha: "manso123",
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
  faseId?: string; // vincula a etapa da obra
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
  {
    id: "f0",
    numero: "0",
    titulo: "Pré-projeto",
    tarefas: [
      "Regularização documental (escritura, matrícula, convenção)",
      "Pesquisa e escolha do escritório de arquitetura",
      "Definição do programa de necessidades (briefing da casa)",
      "Estudo de viabilidade financeira da obra",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f1",
    numero: "1",
    titulo: "Estudos e Levantamentos",
    tarefas: [
      "Sondagem e estudo do solo (SPT / ensaio de carga)",
      "Levantamento planialtimétrico e topográfico",
      "Levantamento da situação atual do terreno",
      "Estudo de insolação e ventos predominantes",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f2",
    numero: "2",
    titulo: "Aprovações e Licenças",
    tarefas: [
      "Aprovação do anteprojeto pelo condomínio",
      "Aprovação do projeto pela Prefeitura de Chapada dos Guimarães",
      "Alvará de construção",
      "ART / RRT do arquiteto e engenheiros",
      "Licença ambiental (APP do lago do Manso)",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f3",
    numero: "3",
    titulo: "Projetos Técnicos",
    tarefas: [
      "Projeto Arquitetônico (anteprojeto + executivo)",
      "Projeto Estrutural",
      "Projeto Elétrico e Automação",
      "Projeto Hidrossanitário",
      "Projeto de Climatização",
      "Projeto de Cobertura e Impermeabilização",
      "Projeto Luminotécnico",
      "Projeto Paisagístico",
      "Projeto de Segurança",
      "Projeto de Piscina (a decidir)",
      "Memorial descritivo e especificações",
      "Planilha orçamentária (SINAPI)",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f4",
    numero: "4",
    titulo: "Preparação para Obra",
    tarefas: [
      "Escolha e contratação da construtora",
      "Contratação de seguro da obra",
      "Aprovação do cronograma físico-financeiro",
      "Contratação de gerenciadora ou fiscal de obras",
      "Instalação do canteiro de obras",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f5",
    numero: "5",
    titulo: "Execução da Obra",
    tarefas: [
      "Terraplanagem e preparação do terreno",
      "Locação da edificação",
      "Fundações",
      "Estrutura (pilares, vigas, lajes)",
      "Alvenaria e vedação",
      "Cobertura e telhado",
      "Instalações elétricas e lógica",
      "Instalações hidráulicas e sanitárias",
      "Impermeabilização",
      "Revestimentos internos",
      "Revestimentos externos",
      "Esquadrias (portas, janelas, vidros)",
      "Área de lazer / pergolado",
      "Instalação de ar-condicionado",
      "Sistema de energia solar (a decidir)",
      "Pintura interna e externa",
      "Louças, metais e bancadas",
      "Paisagismo e jardinagem",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f6",
    numero: "6",
    titulo: "Finalização",
    tarefas: [
      "Limpeza final e entrega da obra",
      "Vistoria técnica e punch list",
      "Emissão do Habite-se",
      "Carta de Liberação do Condomínio",
      "Averbação da construção na matrícula",
      "Atualização do IPTU com nova área construída",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
  {
    id: "f7",
    numero: "7",
    titulo: "Implantação e Mobiliamento",
    tarefas: [
      "Móveis planejados (cozinha, dormitórios, área de serviço)",
      "Móveis soltos e decoração",
      "Eletrodomésticos e equipamentos",
      "Itens de lazer (churrasqueira, equipamentos náuticos)",
      "Casa pronta para uso 🏖️",
    ].map(t => ({ id: crypto.randomUUID?.() ?? Math.random().toString(36), titulo: t, concluida: false })),
  },
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
  prazo: string; // ISO
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
  percReserva: number; // 0..100
  modeloFinanceiro: "fundo-comum" | "reembolso-direto";
}

interface State {
  sessao: SocioId | null;
  lancamentos: Lancamento[];
  fases: FaseObra[];
  documentos: Documento[];
  votacoes: Votacao[];
  reunioes: Reuniao[];
  config: Configuracoes;
}

const KEY = "manso-villa-state-v2";

const seedLancamentos: Lancamento[] = [
  { id: "s1", data: "2026-01-15", tipo: "receita", descricao: "Aporte inicial — compra do lote", categoria: "Aporte", valor: 93351.52, responsavel: "eric", rateio: { eric: 93351.52, michael: 0, heryk: 0 }, criadoPor: "eric", criadoEm: "2026-01-15T10:00:00Z" },
  { id: "s2", data: "2026-01-15", tipo: "receita", descricao: "Aporte inicial — compra do lote", categoria: "Aporte", valor: 93351.52, responsavel: "michael", rateio: { eric: 0, michael: 93351.52, heryk: 0 }, criadoPor: "michael", criadoEm: "2026-01-15T10:00:00Z" },
  { id: "s3", data: "2026-01-15", tipo: "receita", descricao: "Aporte inicial — compra do lote", categoria: "Aporte", valor: 93351.51, responsavel: "heryk", rateio: { eric: 0, michael: 0, heryk: 93351.51 }, criadoPor: "heryk", criadoEm: "2026-01-15T10:00:00Z" },
  { id: "s4", data: "2026-01-20", tipo: "despesa", descricao: "Aquisição do Lote 01 - Quadra R", categoria: "Outras despesas", valor: 280054.55, responsavel: "eric", rateio: { eric: 93351.52, michael: 93351.52, heryk: 93351.51 }, criadoPor: "eric", criadoEm: "2026-01-20T14:00:00Z" },
  { id: "s5", data: "2026-03-10", tipo: "despesa", descricao: "Taxa de condomínio - Março", categoria: "Taxa de Condomínio", valor: 890, responsavel: "michael", rateio: { eric: 296.67, michael: 296.67, heryk: 296.66 }, criadoPor: "michael", criadoEm: "2026-03-10T09:00:00Z" },
  { id: "s6", data: "2026-04-05", tipo: "receita", descricao: "Aporte mensal - Abril", categoria: "Aporte", valor: 5000, responsavel: "heryk", rateio: { eric: 0, michael: 0, heryk: 5000 }, criadoPor: "heryk", criadoEm: "2026-04-05T08:00:00Z" },
];

const seedVotacoes: Votacao[] = [
  {
    id: "v1",
    titulo: "Incluir piscina no projeto?",
    descricao: "Acréscimo estimado de R$ 85.000 na obra. Decisão impacta o projeto arquitetônico.",
    valor: 85000,
    criadoPor: "eric",
    criadoEm: new Date(Date.now() - 1 * 86400000).toISOString(),
    prazo: new Date(Date.now() + 2 * 86400000).toISOString(),
    votos: {
      eric: { status: "aprovado", em: new Date().toISOString() },
      michael: { status: "pendente" },
      heryk: { status: "pendente" },
    },
    decisao: "pendente",
  },
];

const initialState: State = {
  sessao: null,
  lancamentos: seedLancamentos,
  fases: FASES_INICIAIS,
  documentos: [],
  votacoes: seedVotacoes,
  reunioes: [],
  config: { metaObra: 850000, percReserva: 15, modeloFinanceiro: "fundo-comum" },
};

function load(): State {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

let state: State = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  hydrate();
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

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const actions = {
  login(email: string, senha: string): Socio | null {
    const s = SOCIOS.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.senha === senha);
    if (!s) return null;
    state = { ...state, sessao: s.id };
    persist();
    return s;
  },
  logout() { state = { ...state, sessao: null }; persist(); },

  addLancamento(l: Omit<Lancamento, "id" | "criadoEm">) {
    const novo: Lancamento = { ...l, id: uid(), criadoEm: new Date().toISOString() };
    state = { ...state, lancamentos: [novo, ...state.lancamentos] };
    persist();
  },
  removeLancamento(id: string) {
    state = { ...state, lancamentos: state.lancamentos.filter((x) => x.id !== id) };
    persist();
  },
  addLancamentosBulk(arr: Omit<Lancamento, "id" | "criadoEm">[]) {
    const novos = arr.map((l) => ({ ...l, id: uid(), criadoEm: new Date().toISOString() }));
    state = { ...state, lancamentos: [...novos, ...state.lancamentos] };
    persist();
  },

  toggleTarefa(faseId: string, tarefaId: string) {
    state = {
      ...state,
      fases: state.fases.map((f) =>
        f.id !== faseId ? f : {
          ...f,
          tarefas: f.tarefas.map((t) =>
            t.id !== tarefaId ? t : { ...t, concluida: !t.concluida, dataRealizada: !t.concluida ? new Date().toISOString().slice(0, 10) : undefined },
          ),
        },
      ),
    };
    persist();
  },
  updateTarefa(faseId: string, tarefaId: string, patch: Partial<Tarefa>) {
    state = {
      ...state,
      fases: state.fases.map((f) =>
        f.id !== faseId ? f : { ...f, tarefas: f.tarefas.map((t) => (t.id !== tarefaId ? t : { ...t, ...patch })) },
      ),
    };
    persist();
  },

  addDocumento(d: Omit<Documento, "id" | "uploadEm">) {
    const novo: Documento = { ...d, id: uid(), uploadEm: new Date().toISOString() };
    state = { ...state, documentos: [novo, ...state.documentos] };
    persist();
  },
  removeDocumento(id: string) {
    state = { ...state, documentos: state.documentos.filter((d) => d.id !== id) };
    persist();
  },

  addVotacao(v: Omit<Votacao, "id" | "criadoEm" | "votos" | "decisao">) {
    const votos = Object.fromEntries(SOCIOS.map((s) => [s.id, { status: "pendente" as VotoStatus }])) as Votacao["votos"];
    votos[v.criadoPor] = { status: "aprovado", em: new Date().toISOString() };
    const novo: Votacao = { ...v, id: uid(), criadoEm: new Date().toISOString(), votos, decisao: "pendente" };
    state = { ...state, votacoes: [novo, ...state.votacoes] };
    persist();
  },
  votar(votacaoId: string, socio: SocioId, status: VotoStatus, justificativa?: string) {
    state = {
      ...state,
      votacoes: state.votacoes.map((v) => {
        if (v.id !== votacaoId) return v;
        const votos = { ...v.votos, [socio]: { status, justificativa, em: new Date().toISOString() } };
        const aprov = Object.values(votos).filter((x) => x.status === "aprovado").length;
        const rejei = Object.values(votos).filter((x) => x.status === "rejeitado").length;
        const decisao: Votacao["decisao"] = aprov >= 2 ? "aprovada" : rejei >= 2 ? "rejeitada" : "pendente";
        return { ...v, votos, decisao };
      }),
    };
    persist();
  },

  addReuniao(r: Omit<Reuniao, "id">) {
    state = { ...state, reunioes: [{ ...r, id: uid() }, ...state.reunioes] };
    persist();
  },

  updateConfig(patch: Partial<Configuracoes>) {
    state = { ...state, config: { ...state.config, ...patch } };
    persist();
  },

  resetarTudo() {
    state = initialState;
    persist();
  },
};

export function getSocio(id: SocioId): Socio { return SOCIOS.find((s) => s.id === id)!; }
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

// Heurística simples de detecção de aporte por descrição OFX
export function sugerirSocio(descricao: string): SocioId | null {
  const up = descricao.toUpperCase();
  for (const s of SOCIOS) {
    if (s.apelidos.some((a) => up.includes(a))) return s.id;
  }
  return null;
}

// Parser OFX simples
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
    const data = dtRaw.length === 8 ? `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}` : new Date().toISOString().slice(0, 10);
    const memo = get("MEMO") || get("NAME") || "Transação";
    if (isNaN(valor)) continue;
    txs.push({
      data,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? "credito" : "debito",
      descricao: memo,
      fitId: get("FITID"),
    });
  }
  return txs;
}
