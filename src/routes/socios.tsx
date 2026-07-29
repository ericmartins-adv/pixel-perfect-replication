import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMansoStore, calcularSaldos, formatBRL, SOCIOS } from "@/lib/manso-store";

export const Route = createFileRoute("/socios")({
  component: SociosPage,
  head: () => ({ meta: [{ title: "Sócios — Manso Villa" }] }),
});

function SociosPage() {
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);

  const saldos = useMemo(() => calcularSaldos(lancamentos), [lancamentos]);

  if (!sessao) return null;

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[1100px] mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sociedade</p>
        <h1 className="font-serif text-4xl mt-2">Três sócios, partes iguais.</h1>
        <p className="text-muted-foreground mt-1 max-w-xl">
          Cada sócio detém <strong>33,33%</strong> do projeto. O saldo abaixo mostra quem está adiantado ou devedor frente à cota proporcional.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {saldos.map((s) => {
          const eu = s.socio.id === sessao;
          const status = s.saldo > 1 ? "Adiantado" : s.saldo < -1 ? "Devedor" : "Equilibrado";
          const minhasMovs = lancamentos.filter((l) => l.responsavel === s.socio.id).length;
          return (
            <article key={s.socio.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${s.socio.cor}, var(--deep))` }}>
                {eu && (
                  <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded">
                    Você
                  </span>
                )}
              </div>
              <div className="px-5 pb-5 -mt-10 relative">
                <div className="size-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white border-4 border-card"
                  style={{ backgroundColor: s.socio.cor }}>
                  {s.socio.iniciais}
                </div>
                <h2 className="font-serif text-xl mt-3 leading-tight">{s.socio.nome}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{s.socio.email}</p>

                <dl className="mt-5 space-y-2.5 text-sm border-t border-border pt-4">
                  <Row label="Participação" value="33,33%" />
                  <Row label="Total aportado" value={formatBRL(s.aportado)} />
                  <Row label="Cota devida" value={formatBRL(s.cotaDevida)} />
                  <Row label="Lançamentos" value={String(minhasMovs)} />
                </dl>

                <div className="mt-5 p-3 rounded-md" style={{
                  backgroundColor: s.saldo > 1 ? "color-mix(in oklab, var(--mist) 12%, transparent)"
                    : s.saldo < -1 ? "color-mix(in oklab, #c4654a 12%, transparent)"
                    : "var(--muted)",
                }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{status}</p>
                  <p className="font-serif text-2xl mt-0.5 tabular-nums"
                    style={{ color: s.saldo > 1 ? "var(--mist)" : s.saldo < -1 ? "#c4654a" : "var(--foreground)" }}>
                    {s.saldo >= 0 ? "+" : ""}{formatBRL(s.saldo)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-12 bg-card border border-border rounded-xl p-6">
        <h2 className="font-serif text-2xl mb-1">Sobre o projeto</h2>
        <p className="text-sm text-muted-foreground mb-6">Lote 01, Quadra R · Porto do Manso Vila Náutica · Chapada dos Guimarães/MT</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="Área do terreno" value="464,14 m²" />
          <Stat label="Valor referência" value="R$ 280.054,55" />
          <Stat label="Área mín. obra" value="120 m²" />
          <Stat label="Taxa ocupação máx." value="55%" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-6">Sócios fundadores: {SOCIOS.map(s => s.nome).join(" · ")}</p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-[var(--mist)] pl-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-serif text-lg mt-0.5">{value}</p>
    </div>
  );
}
