import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMansoStore, actions, progressoFase, progressoGeral, formatBRL } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { Check, ChevronDown, ChevronRight, Calendar, DollarSign } from "lucide-react";

export const Route = createFileRoute("/obra")({
  component: ObraPage,
  head: () => ({ meta: [{ title: "Plano de obra — Manso Villa" }] }),
});

function ObraPage() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const fases = useMansoStore((s) => s.fases);
  const lancamentos = useMansoStore((s) => s.lancamentos);
  const [aberta, setAberta] = useState<string | null>("f0");

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);

  const progresso = useMemo(() => progressoGeral(fases), [fases]);
  const totalOrcado = useMemo(
    () => fases.reduce((s, f) => s + f.tarefas.reduce((a, t) => a + (t.custoOrcado ?? 0), 0), 0),
    [fases],
  );
  const totalRealizado = useMemo(
    () => fases.reduce((s, f) => s + f.tarefas.reduce((a, t) => a + (t.custoReal ?? 0), 0), 0)
        + lancamentos.filter((l) => l.tipo === "despesa" && l.faseId).reduce((s, l) => s + l.valor, 0),
    [fases, lancamentos],
  );

  if (!sessao) return null;

  return (
    <div className="p-8 lg:p-12 max-w-[1200px] mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Roadmap</p>
        <h1 className="font-serif text-4xl mt-2">Plano da construção</h1>
        <p className="text-muted-foreground mt-1">Da regularização documental ao mobiliário final.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <KPI label="Progresso geral" value={`${progresso.toFixed(1)}%`} />
        <KPI label="Total orçado nas fases" value={formatBRL(totalOrcado)} />
        <KPI label="Total realizado" value={formatBRL(totalRealizado)} accent="var(--mist)" />
      </div>

      {/* Gantt simplificado */}
      <section className="mb-8 bg-card border border-border rounded-xl p-6">
        <h2 className="font-serif text-xl mb-4">Linha do tempo</h2>
        <div className="space-y-2">
          {fases.map((f) => {
            const p = progressoFase(f);
            return (
              <div key={f.id} className="flex items-center gap-4">
                <div className="w-32 text-xs text-muted-foreground shrink-0">{f.numero}. {f.titulo}</div>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                  <div className="h-full transition-all" style={{
                    width: `${p}%`,
                    background: p === 100 ? "var(--mist)" : "linear-gradient(90deg, var(--deep), var(--lagoon))",
                  }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-medium text-foreground/70">
                    {p.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fases detalhadas */}
      <div className="space-y-3">
        {fases.map((fase) => {
          const open = aberta === fase.id;
          const prog = progressoFase(fase);
          return (
            <article key={fase.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setAberta(open ? null : fase.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition"
              >
                {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <div className="flex items-center justify-center size-9 rounded-full font-serif text-sm shrink-0"
                  style={{ background: prog === 100 ? "var(--mist)" : "var(--secondary)", color: prog === 100 ? "white" : "var(--foreground)" }}>
                  {fase.numero}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-serif text-lg">{fase.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{fase.tarefas.filter((t) => t.concluida).length} de {fase.tarefas.length} concluídas</p>
                </div>
                <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--lagoon)]" style={{ width: `${prog}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{prog.toFixed(0)}%</span>
              </button>

              {open && (
                <ul className="border-t border-border divide-y divide-border">
                  {fase.tarefas.map((t) => (
                    <li key={t.id} className="px-5 py-3 flex items-start gap-3 group">
                      <button
                        onClick={() => actions.toggleTarefa(fase.id, t.id)}
                        className={`mt-0.5 size-5 rounded border flex items-center justify-center shrink-0 transition ${
                          t.concluida ? "bg-[var(--mist)] border-[var(--mist)] text-white" : "border-input hover:border-ring"
                        }`}
                      >
                        {t.concluida && <Check className="size-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          {t.dataPrevista && <span className="inline-flex items-center gap-1"><Calendar className="size-3" />Prev. {new Date(t.dataPrevista).toLocaleDateString("pt-BR")}</span>}
                          {t.custoOrcado != null && <span className="inline-flex items-center gap-1"><DollarSign className="size-3" />Orç. {formatBRL(t.custoOrcado)}</span>}
                          {t.custoReal != null && <span className="text-[var(--mist)]">Real {formatBRL(t.custoReal)}</span>}
                        </div>
                      </div>
                      <TarefaEditor faseId={fase.id} tarefaId={t.id} tarefa={t} />
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TarefaEditor({ faseId, tarefaId, tarefa }: { faseId: string; tarefaId: string; tarefa: { custoOrcado?: number; custoReal?: number; dataPrevista?: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[11px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition">
        editar
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-popover border border-border rounded-md shadow-lg space-y-2">
          <Mini label="Data prevista" type="date" value={tarefa.dataPrevista ?? ""}
            onChange={(v) => actions.updateTarefa(faseId, tarefaId, { dataPrevista: v || undefined })} />
          <Mini label="Custo orçado" type="number" value={tarefa.custoOrcado?.toString() ?? ""}
            onChange={(v) => actions.updateTarefa(faseId, tarefaId, { custoOrcado: v ? parseFloat(v) : undefined })} />
          <Mini label="Custo real" type="number" value={tarefa.custoReal?.toString() ?? ""}
            onChange={(v) => actions.updateTarefa(faseId, tarefaId, { custoReal: v ? parseFloat(v) : undefined })} />
          <button onClick={() => setOpen(false)} className="w-full text-xs py-1.5 rounded bg-primary text-primary-foreground">Fechar</button>
        </div>
      )}
    </div>
  );
}

function Mini({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-0.5 px-2 py-1 text-sm border border-input rounded" />
    </label>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-serif text-3xl mt-2 tabular-nums" style={{ color: accent }}>{value}</p>
    </div>
  );
}
