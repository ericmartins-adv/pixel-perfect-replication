// Store local (MVP frontend-only) para Manso Villa
import { useSyncExternalStore } from "react";

export type SocioId = "eric" | "michael" | "heryk";

export interface Socio {
  id: SocioId;
  nome: string;
  email: string;
  senha: string;
  iniciais: string;
  cor: string; // hex (avatar)
}

export const SOCIOS: Socio[] = [
  {
    id: "eric",
    nome: "Eric Fernando de Souza Martins",
    email: "eric@mansovilla.app",
    senha: "manso123",
    iniciais: "EM",
    cor: "#2d8a9e",
  },
  {
    id: "michael",
    nome: "Michael Kazuo Furuta",
    email: "michael@mansovilla.app",
    senha: "manso123",
    iniciais: "MF",
    cor: "#c9a84c",
  },
  {
    id: "heryk",
    nome: "Heryk de Deus Pereira",
    email: "heryk@mansovilla.app",
    senha: "manso123",
    iniciais: "HP",
    cor: "#5cbdb9",
  },
];

export type LancamentoTipo = "receita" | "despesa";
export const CATEGORIAS = [
  "Aporte",
  "Terreno",
  "Condomínio",
  "IPTU",
  "Projeto",
  "Obra",
  "Materiais",
  "Mão de obra",
  "Documentação",
  "Outros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Lancamento {
  id: string;
  data: string; // ISO
  tipo: LancamentoTipo;
  descricao: string;
  categoria: Categoria;
  valor: number; // BRL
  responsavel: SocioId; // quem pagou / aportou
  rateio: Record<SocioId, number>; // soma = valor
  criadoPor: SocioId;
  criadoEm: string;
}

interface State {
  sessao: SocioId | null;
  lancamentos: Lancamento[];
}

const KEY = "manso-villa-state-v1";

const seed: Lancamento[] = [
  {
    id: "seed-1",
    data: "2026-01-15",
    tipo: "receita",
    descricao: "Aporte inicial — compra do lote",
    categoria: "Aporte",
    valor: 93351.52,
    responsavel: "eric",
    rateio: { eric: 93351.52, michael: 0, heryk: 0 },
    criadoPor: "eric",
    criadoEm: "2026-01-15T10:00:00Z",
  },
  {
    id: "seed-2",
    data: "2026-01-15",
    tipo: "receita",
    descricao: "Aporte inicial — compra do lote",
    categoria: "Aporte",
    valor: 93351.52,
    responsavel: "michael",
    rateio: { eric: 0, michael: 93351.52, heryk: 0 },
    criadoPor: "michael",
    criadoEm: "2026-01-15T10:00:00Z",
  },
  {
    id: "seed-3",
    data: "2026-01-15",
    tipo: "receita",
    descricao: "Aporte inicial — compra do lote",
    categoria: "Aporte",
    valor: 93351.51,
    responsavel: "heryk",
    rateio: { eric: 0, michael: 0, heryk: 93351.51 },
    criadoPor: "heryk",
    criadoEm: "2026-01-15T10:00:00Z",
  },
  {
    id: "seed-4",
    data: "2026-01-20",
    tipo: "despesa",
    descricao: "Aquisição do Lote 01 - Quadra R",
    categoria: "Terreno",
    valor: 280054.55,
    responsavel: "eric",
    rateio: {
      eric: 93351.52,
      michael: 93351.52,
      heryk: 93351.51,
    },
    criadoPor: "eric",
    criadoEm: "2026-01-20T14:00:00Z",
  },
  {
    id: "seed-5",
    data: "2026-03-10",
    tipo: "despesa",
    descricao: "Taxa de condomínio - Março",
    categoria: "Condomínio",
    valor: 890.0,
    responsavel: "michael",
    rateio: { eric: 296.67, michael: 296.67, heryk: 296.66 },
    criadoPor: "michael",
    criadoEm: "2026-03-10T09:00:00Z",
  },
  {
    id: "seed-6",
    data: "2026-04-05",
    tipo: "receita",
    descricao: "Aporte mensal - Abril",
    categoria: "Aporte",
    valor: 5000,
    responsavel: "heryk",
    rateio: { eric: 0, michael: 0, heryk: 5000 },
    criadoPor: "heryk",
    criadoEm: "2026-04-05T08:00:00Z",
  },
];

function load(): State {
  if (typeof window === "undefined") return { sessao: null, lancamentos: seed };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { sessao: null, lancamentos: seed };
    return JSON.parse(raw);
  } catch {
    return { sessao: null, lancamentos: seed };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMansoStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const actions = {
  login(email: string, senha: string): Socio | null {
    const s = SOCIOS.find(
      (x) => x.email.toLowerCase() === email.toLowerCase() && x.senha === senha,
    );
    if (!s) return null;
    state = { ...state, sessao: s.id };
    persist();
    return s;
  },
  logout() {
    state = { ...state, sessao: null };
    persist();
  },
  addLancamento(l: Omit<Lancamento, "id" | "criadoEm">) {
    const novo: Lancamento = {
      ...l,
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
    };
    state = { ...state, lancamentos: [novo, ...state.lancamentos] };
    persist();
  },
  removeLancamento(id: string) {
    state = {
      ...state,
      lancamentos: state.lancamentos.filter((x) => x.id !== id),
    };
    persist();
  },
};

export function getSocio(id: SocioId): Socio {
  return SOCIOS.find((s) => s.id === id)!;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Cálculos consolidados
export interface SaldoSocio {
  socio: Socio;
  aportado: number; // soma das receitas onde foi responsavel
  cotaDevida: number; // soma do rateio devido a ele nas despesas
  saldo: number; // aportado - cotaDevida (positivo = adiantado)
}

export function calcularSaldos(lancamentos: Lancamento[]): SaldoSocio[] {
  return SOCIOS.map((socio) => {
    let aportado = 0;
    let cotaDevida = 0;
    for (const l of lancamentos) {
      if (l.tipo === "receita" && l.responsavel === socio.id) {
        aportado += l.valor;
      }
      if (l.tipo === "despesa") {
        cotaDevida += l.rateio[socio.id] ?? 0;
      }
    }
    return {
      socio,
      aportado,
      cotaDevida,
      saldo: aportado - cotaDevida,
    };
  });
}

export function caixaTotal(lancamentos: Lancamento[]): number {
  return lancamentos.reduce(
    (acc, l) => acc + (l.tipo === "receita" ? l.valor : -l.valor),
    0,
  );
}
