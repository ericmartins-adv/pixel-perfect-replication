import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMansoStore, actions, caixaTotal, calcularSaldos, formatBRL } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { Target, ShieldCheck, Calculator } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orcamento")({
  component: OrcamentoPage,
  head: () => ({ meta: [{ title: "Orçamento — Manso Villa" }] }),
});

function OrcamentoPage() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);
  const config = useMansoStore((s) => s.config);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);

  const [meta, setMeta] = useState(config.metaObra.toString());
  const [reserva, setReserva] = useState(config.percReserva.toString());
  const [aportePorSocio, setAportePorSocio] = useState("3000");

  const caixa = useMemo(() => caixaTotal(lancamentos), [lancamentos]);
  const totalAportado = useMemo(() => calcularSaldos(lancamentos).reduce((s, x) => s + x.aportado, 0), [lancamentos]);
  const totalGasto = useMemo(() => lancamentos.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0), [lancamentos]);

  const faltam = Math.max(0, config.metaObra - totalAportado);
  const reservaAlvo = config.metaObra * (config.percReserva / 100);
  const reservaAtual = lancamentos.filter(l => l.categoria === "Fundo Reserva" && l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const reservaOk = reservaAtual >= reservaAlvo;

  const aporteMensal = parseFloat(aportePorSocio.replace(",", ".")) || 0;
  const mensalTotal = aporteMensal * 3;
  const meses = mensalTotal > 0 ? Math.ceil(faltam / mensalTotal) : 0;
  const dataPrevista = mensalTotal > 0 ? new Date(Date.now() + meses * 30 * 86400000) : null;

  if (!sessao) return null;

  const salvar = () => {
    actions.updateConfig({
      metaObra: parseFloat(meta.replace(",", ".")) || config.metaObra,
      percReserva: Math.max(0, Math.min(100, parseFloat(reserva) || 0)),
    });
    toast.success("Orçamento atualizado");
  };

  return (
    <div className="p-8 lg:p-12 max-w-[1100px] mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Planejamento financeiro</p>
        <h1 className="font-serif text-4xl mt-2">Orçamento global</h1>
      </header>

      {/* Meta */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="size-5 text-[var(--lagoon)]" />
          <h2 className="font-serif text-xl">Meta da obra</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta total</p>
            <p className="font-serif text-3xl mt-1 tabular-nums">{formatBRL(config.metaObra)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Já aportado</p>
            <p className="font-serif text-3xl mt-1 tabular-nums text-[var(--mist)]">{formatBRL(totalAportado)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Falta</p>
            <p className="font-serif text-3xl mt-1 tabular-nums">{formatBRL(faltam)}</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (totalAportado / config.metaObra) * 100)}%`, background: "linear-gradient(90deg, var(--deep), var(--mist), var(--gold))" }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {((totalAportado / config.metaObra) * 100).toFixed(1)}% da meta · Caixa atual em mãos: <strong className="text-foreground">{formatBRL(caixa)}</strong>
        </p>
      </section>

      {/* Simulador */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-[var(--lagoon)]" />
          <h2 className="font-serif text-xl">Simulador de aportes</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Aporte mensal por sócio (R$)</span>
              <input value={aportePorSocio} onChange={(e) => setAportePorSocio(e.target.value)} inputMode="decimal"
                className="w-full mt-2 px-4 py-3 text-2xl font-serif tabular-nums border border-input rounded-md" />
            </label>
            <p className="text-xs text-muted-foreground mt-2">Total mensal injetado: <strong className="text-foreground tabular-nums">{formatBRL(mensalTotal)}</strong></p>
          </div>
          <div className="bg-deep-gradient text-white p-5 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-white/60">Atingiremos a meta em</p>
            <p className="font-serif text-5xl tabular-nums mt-1">{meses || "—"}</p>
            <p className="text-sm text-white/70">{meses ? "meses" : "informe um valor"}</p>
            {dataPrevista && (
              <p className="text-xs text-white/60 mt-3">
                Previsão de atingir a meta: <strong className="text-[var(--gold)]">
                  {dataPrevista.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </strong>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Reserva */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="size-5 text-[var(--lagoon)]" />
          <h2 className="font-serif text-xl">Fundo de reserva</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta de reserva ({config.percReserva}%)</p>
            <p className="font-serif text-2xl mt-1 tabular-nums">{formatBRL(reservaAlvo)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Reserva atual</p>
            <p className="font-serif text-2xl mt-1 tabular-nums">{formatBRL(reservaAtual)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <p className="font-serif text-2xl mt-1" style={{ color: reservaOk ? "var(--mist)" : "#c4654a" }}>
              {reservaOk ? "OK" : "Abaixo"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Use a categoria <code className="bg-muted px-1.5 rounded">Fundo Reserva</code> em receitas para alimentar.</p>
      </section>

      {/* Configurações */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-serif text-xl mb-4">Configurações</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Meta total da obra (R$)</span>
            <input value={meta} onChange={(e) => setMeta(e.target.value)} inputMode="decimal"
              className="w-full mt-2 px-3 py-2 border border-input rounded-md tabular-nums" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">% reserva de contingência</span>
            <input value={reserva} onChange={(e) => setReserva(e.target.value)} inputMode="decimal"
              className="w-full mt-2 px-3 py-2 border border-input rounded-md tabular-nums" />
          </label>
        </div>
        <button onClick={salvar} className="mt-4 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          Salvar configurações
        </button>
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Total já gasto na obra: <strong className="text-foreground">{formatBRL(totalGasto)}</strong>
      </p>
    </div>
  );
}
