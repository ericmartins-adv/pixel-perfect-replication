import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  useMansoStore,
  calcularSaldos,
  caixaTotal,
  formatBRL,
  getSocio,
  CATEGORIAS,
  progressoGeral,
} from "@/lib/manso-store";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Target, CalendarClock, Flag } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — Manso Villa" }] }),
});

const META_OBRA = 850000; // estimativa de construção
const COLORS = ["#0c2340", "#1a4a6e", "#2d8a9e", "#5cbdb9", "#c9a84c", "#8b7355", "#87a878", "#c4654a", "#4a6741", "#94a3b8"];

function Dashboard() {
  const router = useRouter();
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);
  const fases = useMansoStore((s) => s.fases);

  useEffect(() => {
    if (!sessao) router.navigate({ to: "/" });
  }, [sessao, router]);

  const caixa = useMemo(() => caixaTotal(lancamentos), [lancamentos]);
  const saldos = useMemo(() => calcularSaldos(lancamentos), [lancamentos]);
  const totalAportado = saldos.reduce((s, x) => s + x.aportado, 0);
  const totalGasto = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const progresso = Math.min(100, (totalAportado / META_OBRA) * 100);
  const progressoObra = useMemo(() => progressoGeral(fases), [fases]);

  // Próximo marco: primeira tarefa com dataPrevista futura não concluída
  const proximoMarco = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    for (const f of fases) {
      for (const t of f.tarefas) {
        if (!t.concluida && t.dataPrevista && t.dataPrevista >= hoje) {
          return { fase: f.titulo, tarefa: t.titulo, data: t.dataPrevista };
        }
      }
    }
    return null;
  }, [fases]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lancamentos) {
      if (l.tipo === "despesa") map.set(l.categoria, (map.get(l.categoria) ?? 0) + l.valor);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [lancamentos]);

  const evolucao = useMemo(() => {
    const map = new Map<string, { receitas: number; despesas: number }>();
    [...lancamentos].sort((a, b) => a.data.localeCompare(b.data)).forEach((l) => {
      const mes = l.data.slice(0, 7);
      const cur = map.get(mes) ?? { receitas: 0, despesas: 0 };
      if (l.tipo === "receita") cur.receitas += l.valor;
      else cur.despesas += l.valor;
      map.set(mes, cur);
    });
    let acc = 0;
    return Array.from(map.entries()).map(([mes, v]) => {
      acc += v.receitas - v.despesas;
      return {
        mes: new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        caixa: acc,
        despesas: v.despesas,
      };
    });
  }, [lancamentos]);

  if (!sessao) return null;
  const socio = getSocio(sessao);
  const meuSaldo = saldos.find((s) => s.socio.id === sessao)!;

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[1400px] mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
        <h1 className="font-serif text-4xl mt-2">
          Olá, <em>{socio.nome.split(" ")[0]}</em>.
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão consolidada do projeto Manso Villa.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Caixa do projeto"
          value={formatBRL(caixa)}
          hint={`${formatBRL(totalAportado)} aportados`}
          icon={Wallet}
          accent="var(--deep)"
        />
        <KpiCard
          label="Total investido"
          value={formatBRL(totalGasto)}
          hint={`${lancamentos.filter(l => l.tipo === "despesa").length} despesas`}
          icon={ArrowDownRight}
          accent="var(--lagoon)"
        />
        <KpiCard
          label="Sua posição"
          value={formatBRL(meuSaldo.saldo)}
          hint={meuSaldo.saldo > 1 ? "Adiantado" : meuSaldo.saldo < -1 ? "Devedor" : "Equilibrado"}
          icon={meuSaldo.saldo >= 0 ? ArrowUpRight : ArrowDownRight}
          accent={meuSaldo.saldo >= 0 ? "var(--mist)" : "#c4654a"}
        />
        <KpiCard
          label="Meta da obra"
          value={`${progresso.toFixed(1)}%`}
          hint={`${formatBRL(META_OBRA)} estimados`}
          icon={Target}
          accent="var(--gold)"
        />
      </div>

      {/* Próxima despesa + Próximo marco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
          <div className="size-9 rounded-full bg-[var(--gold)]/15 flex items-center justify-center shrink-0">
            <CalendarClock className="size-4 text-[var(--gold)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Próxima despesa prevista</p>
            <p className="font-medium mt-1">Taxa de Condomínio</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vence no início do próximo mês · {formatBRL(890)}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
          <div className="size-9 rounded-full bg-[var(--mist)]/15 flex items-center justify-center shrink-0">
            <Flag className="size-4 text-[var(--mist)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso da obra</p>
            {proximoMarco ? (
              <>
                <p className="font-medium mt-1">{proximoMarco.tarefa}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {proximoMarco.fase} · {new Date(proximoMarco.data + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium mt-1">{progressoObra.toFixed(0)}% concluído</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sem marcos com data definida</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progresso */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-xl">Termômetro da obra</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatBRL(totalAportado)} de {formatBRL(META_OBRA)}
            </p>
          </div>
          <TrendingUp className="size-5 text-muted-foreground" />
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progresso}%`,
              background: "linear-gradient(90deg, var(--deep), var(--mist), var(--gold))",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Início</span><span>50%</span><span>Pronto p/ veranear</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sócios */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-xl mb-4">Posição dos sócios</h2>
          <div className="space-y-4">
            {saldos.map((s) => {
              const status = s.saldo > 1 ? "Adiantado" : s.saldo < -1 ? "Devedor" : "Equilibrado";
              const cor = s.saldo > 1 ? "var(--mist)" : s.saldo < -1 ? "#c4654a" : "var(--muted-foreground)";
              return (
                <div key={s.socio.id} className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                    style={{ backgroundColor: s.socio.cor }}
                  >
                    {s.socio.iniciais}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.socio.nome.split(" ")[0]} {s.socio.nome.split(" ").slice(-1)}</p>
                    <p className="text-[11px] text-muted-foreground">Aportou {formatBRL(s.aportado)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: cor }}>
                      {s.saldo >= 0 ? "+" : ""}{formatBRL(s.saldo)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pizza categorias */}
        <section className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
          <h2 className="font-serif text-xl mb-4">Gastos por categoria</h2>
          {porCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nenhuma despesa registrada.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porCategoria} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {porCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5">
                {porCategoria.sort((a,b)=>b.value-a.value).map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatBRL(c.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Linha evolução */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-serif text-xl mb-4">Evolução do caixa</h2>
        {evolucao.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Sem histórico ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="caixa" stroke="var(--deep)" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="despesas" stroke="var(--mist)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="mt-8 text-center">
        <Link to="/lancamentos" className="text-sm text-[var(--lagoon)] hover:underline">
          Ver todos os lançamentos →
        </Link>
      </div>

      <p className="hidden">{CATEGORIAS.length}</p>
    </div>
  );
}

function KpiCard({
  label, value, hint, icon: Icon, accent,
}: {
  label: string; value: string; hint: string; icon: React.ComponentType<{ className?: string }>; accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="font-serif text-3xl mt-3 tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
