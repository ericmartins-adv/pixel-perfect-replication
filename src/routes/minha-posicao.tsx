import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMansoStore, calcularSaldos, caixaTotal, formatBRL, getSocio } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { ArrowUpRight, ArrowDownRight, Wallet, Target } from "lucide-react";

export const Route = createFileRoute("/minha-posicao")({
  component: MinhaPosicao,
  head: () => ({ meta: [{ title: "Minha posição — Manso Villa" }] }),
});

function MinhaPosicao() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);

  const saldos = useMemo(() => calcularSaldos(lancamentos), [lancamentos]);
  const caixa = useMemo(() => caixaTotal(lancamentos), [lancamentos]);
  if (!sessao) return null;

  const eu = saldos.find((s) => s.socio.id === sessao)!;
  const cotaIdeal = caixa > 0 ? (saldos.reduce((s, x) => s + x.aportado, 0)) / 3 : 0;
  const diff = eu.aportado - cotaIdeal;
  const status = diff > 50 ? "ADIANTADO" : diff < -50 ? "DEVEDOR" : "EQUILIBRADO";
  const statusCor = diff > 50 ? "var(--mist)" : diff < -50 ? "#c4654a" : "var(--lagoon)";
  const proxAporte = diff < 0 ? Math.abs(diff) : 0;

  const meusLancamentos = lancamentos
    .filter((l) => l.responsavel === sessao || l.tipo === "despesa")
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="p-8 lg:p-12 max-w-[1100px] mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getSocio(sessao).nome}</p>
        <h1 className="font-serif text-4xl mt-2">Minha carteira no projeto</h1>
        <p className="text-muted-foreground mt-1">Sua participação financeira em tempo real.</p>
      </header>

      <section className="rounded-2xl overflow-hidden border border-border bg-card">
        <div className="px-8 py-10 bg-deep-gradient text-white relative">
          <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider"
            style={{ backgroundColor: "color-mix(in oklab, white 18%, transparent)" }}>
            {status}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Saldo individual</p>
          <p className="font-serif text-6xl mt-2 tabular-nums" style={{ color: diff >= 0 ? "var(--gold)" : "#ffb4a0" }}>
            {diff >= 0 ? "+" : ""}{formatBRL(diff)}
          </p>
          <p className="text-white/70 mt-3 max-w-md text-sm">
            {diff > 50 ? `Você está adiantado em ${formatBRL(diff)} frente à sua cota proporcional.` :
             diff < -50 ? `Você precisa aportar ${formatBRL(Math.abs(diff))} para equilibrar.` :
             "Sua contribuição está alinhada com os demais sócios."}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 divide-x divide-border">
          <Stat icon={Wallet} label="Total aportado" value={formatBRL(eu.aportado)} />
          <Stat icon={Target} label="Cota proporcional" value={formatBRL(cotaIdeal)} />
          <Stat icon={diff >= 0 ? ArrowUpRight : ArrowDownRight} label="Próximo aporte sugerido" value={formatBRL(proxAporte)} accent={statusCor} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl mb-4">Meu histórico de aportes</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {meusLancamentos.filter((l) => l.tipo === "receita" && l.responsavel === sessao).length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">Você ainda não realizou aportes.</p>
          )}
          {meusLancamentos.filter((l) => l.tipo === "receita" && l.responsavel === sessao).map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm">{l.descricao}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.data).toLocaleDateString("pt-BR")} · {l.categoria}</p>
              </div>
              <p className="text-sm font-medium tabular-nums" style={{ color: "var(--mist)" }}>+ {formatBRL(l.valor)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: string }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="font-serif text-2xl mt-2 tabular-nums" style={{ color: accent ?? "var(--foreground)" }}>{value}</p>
    </div>
  );
}
