import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useMansoStore, actions, SOCIOS, CATEGORIAS, formatBRL, getSocio,
  type SocioId, type Categoria, type LancamentoTipo,
} from "@/lib/manso-store";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/lancamentos")({
  component: Lancamentos,
  head: () => ({ meta: [{ title: "Lançamentos — Manso Villa" }] }),
});

function Lancamentos() {
  const router = useRouter();
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | LancamentoTipo>("todos");

  useEffect(() => { if (!sessao) router.navigate({ to: "/" }); }, [sessao, router]);

  const lista = useMemo(() => {
    const arr = [...lancamentos].sort((a, b) => b.data.localeCompare(a.data));
    if (filtro === "todos") return arr;
    return arr.filter((l) => l.tipo === filtro);
  }, [lancamentos, filtro]);

  if (!sessao) return null;

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[1400px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Financeiro</p>
          <h1 className="font-serif text-4xl mt-2">Lançamentos</h1>
          <p className="text-muted-foreground mt-1">Todas as receitas e despesas do projeto.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 w-full sm:w-auto"
        >
          <Plus className="size-4" /> Novo lançamento
        </button>
      </header>

      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-md w-fit">
        {(["todos", "receita", "despesa"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={`px-4 py-1.5 text-sm rounded transition ${
              filtro === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {lista.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento. Clique em "Novo lançamento" para começar.
          </div>
        ) : (
          lista.map((l) => {
            const s = getSocio(l.responsavel);
            return (
              <div key={l.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {l.tipo === "receita" ? (
                        <ArrowUpRight className="size-4 text-[var(--mist)]" />
                      ) : (
                        <ArrowDownRight className="size-4 text-[#c4654a]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{l.descricao}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(l.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: l.tipo === "receita" ? "var(--mist)" : "var(--foreground)" }}
                    >
                      {l.tipo === "receita" ? "+" : "−"} {formatBRL(l.valor)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {l.categoria}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: s.cor }}
                      >
                        {s.iniciais}
                      </div>
                      <span className="text-xs text-muted-foreground">{s.nome.split(" ")[0]}</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await actions.removeLancamento(l.id);
                        toast.success("Lançamento removido");
                      } catch {
                        toast.error("Erro ao remover lançamento.");
                      }
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Data</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Categoria</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Responsável</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Valor</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                Nenhum lançamento. Clique em "Novo lançamento" para começar.
              </td></tr>
            )}
            {lista.map((l) => {
              const s = getSocio(l.responsavel);
              return (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">
                    {new Date(l.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {l.tipo === "receita"
                        ? <ArrowUpRight className="size-3.5 text-[var(--mist)]" />
                        : <ArrowDownRight className="size-3.5 text-[#c4654a]" />}
                      <span className="text-sm">{l.descricao}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{l.categoria}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ backgroundColor: s.cor }}>{s.iniciais}</div>
                      <span className="text-sm text-muted-foreground">{s.nome.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium tabular-nums"
                    style={{ color: l.tipo === "receita" ? "var(--mist)" : "var(--foreground)" }}>
                    {l.tipo === "receita" ? "+" : "−"} {formatBRL(l.valor)}
                  </td>
                  <td className="px-3">
                    <button
                      onClick={async () => { try { await actions.removeLancamento(l.id); toast.success("Lançamento removido"); } catch { toast.error("Erro ao remover lançamento."); } }}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Remover"
                    ><Trash2 className="size-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && <NovoLancamentoModal currentUser={sessao} onClose={() => setOpen(false)} />}
    </div>
  );
}

function NovoLancamentoModal({ currentUser, onClose }: { currentUser: SocioId; onClose: () => void }) {
  const [tipo, setTipo] = useState<LancamentoTipo>("despesa");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Outras despesas");
  const [valor, setValor] = useState("");
  const [responsavel, setResponsavel] = useState<SocioId>(currentUser);
  const [rateioModo, setRateioModo] = useState<"igual" | "individual">("igual");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor.replace(",", "."));
    if (isNaN(v) || v <= 0) return toast.error("Informe um valor válido");

    let rateio: Record<SocioId, number>;
    if (tipo === "receita") {
      rateio = { eric: 0, michael: 0, heryk: 0 };
      rateio[responsavel] = v;
    } else if (rateioModo === "igual") {
      const parte = Math.round((v / 3) * 100) / 100;
      const resto = Math.round((v - parte * 2) * 100) / 100;
      rateio = { eric: parte, michael: parte, heryk: resto };
    } else {
      rateio = { eric: 0, michael: 0, heryk: 0 };
      rateio[responsavel] = v;
    }

    setSaving(true);
    try {
      await actions.addLancamento({
        data, tipo, descricao: descricao.trim(), categoria, valor: v, responsavel, rateio,
        criadoPor: currentUser,
      });
      toast.success("Lançamento registrado");
      onClose();
    } catch (err) {
      toast.error(`Erro ao salvar: ${err instanceof Error ? err.message : "Tente novamente"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-2xl">Novo lançamento</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["despesa", "receita"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`py-3 rounded-md border text-sm font-medium transition ${
                  tipo === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}>
                {t === "despesa" ? "Despesa" : "Aporte / Receita"}
              </button>
            ))}
          </div>

          <Field label="Descrição">
            <input required value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder={tipo === "receita" ? "Ex: Aporte mensal junho" : "Ex: Pagamento de pedreiro"}
              className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data">
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm" />
            </Field>
            <Field label="Valor (R$)">
              <input required value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal"
                placeholder="0,00"
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm tabular-nums" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoria">
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm">
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={tipo === "receita" ? "Sócio que aportou" : "Quem pagou"}>
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value as SocioId)}
                className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm">
                {SOCIOS.map((s) => <option key={s.id} value={s.id}>{s.nome.split(" ")[0]}</option>)}
              </select>
            </Field>
          </div>

          {tipo === "despesa" && (
            <Field label="Rateio">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRateioModo("igual")}
                  className={`py-2 rounded-md border text-sm ${rateioModo === "igual" ? "border-primary bg-primary/5" : "border-border"}`}>
                  Igual (1/3 cada)
                </button>
                <button type="button" onClick={() => setRateioModo("individual")}
                  className={`py-2 rounded-md border text-sm ${rateioModo === "individual" ? "border-primary bg-primary/5" : "border-border"}`}>
                  Só o pagador
                </button>
              </div>
            </Field>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-md border border-border text-sm hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
