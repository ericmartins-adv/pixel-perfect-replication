import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMansoStore, calcularSaldos, formatBRL, SOCIOS, CATEGORIAS } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/relatorios")({
  component: Relatorios,
  head: () => ({ meta: [{ title: "Relatórios — Manso Villa" }] }),
});

function Relatorios() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const lancamentos = useMansoStore((s) => s.lancamentos);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);

  const saldos = useMemo(() => calcularSaldos(lancamentos), [lancamentos]);
  const totalAportado = saldos.reduce((s, x) => s + x.aportado, 0);
  const cotaIdeal = totalAportado / 3;
  const dadosSocios = saldos.map((s) => ({
    nome: s.socio.nome.split(" ")[0],
    Aportado: s.aportado,
    Cota: cotaIdeal,
  }));

  const dre = useMemo(() => {
    const map = new Map<string, { receita: number; despesa: number }>();
    for (const c of CATEGORIAS) map.set(c, { receita: 0, despesa: 0 });
    for (const l of lancamentos) {
      const cur = map.get(l.categoria)!;
      if (l.tipo === "receita") cur.receita += l.valor;
      else cur.despesa += l.valor;
    }
    return Array.from(map.entries())
      .filter(([, v]) => v.receita || v.despesa)
      .map(([categoria, v]) => ({ categoria, ...v, saldo: v.receita - v.despesa }));
  }, [lancamentos]);

  if (!sessao) return null;

  const imprimirPDF = () => {
    const dataStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const totalAport = saldos.reduce((s, x) => s + x.aportado, 0);
    const cotaId = totalAport / 3;
    const linhasEq = saldos.map((s) => {
      const diff = s.aportado - cotaId;
      return `<tr>
        <td>${s.socio.nome.split(" ")[0]} ${s.socio.nome.split(" ").slice(-1)}</td>
        <td class="num">${formatBRL(s.aportado)}</td>
        <td class="num">${formatBRL(cotaId)}</td>
        <td class="num" style="color:${diff > 50 ? "#1a6b72" : diff < -50 ? "#c4654a" : "#888"}">${diff >= 0 ? "+" : ""}${formatBRL(diff)}</td>
        <td class="num">${diff < 0 ? formatBRL(Math.abs(diff)) : "—"}</td>
      </tr>`;
    }).join("");
    const linhasDRE = dre.map((d) => `<tr>
      <td>${d.categoria}</td>
      <td class="num">${d.receita ? formatBRL(d.receita) : "—"}</td>
      <td class="num">${d.despesa ? formatBRL(d.despesa) : "—"}</td>
      <td class="num" style="color:${d.saldo >= 0 ? "#1a6b72" : "#c4654a"}">${d.saldo >= 0 ? "+" : ""}${formatBRL(d.saldo)}</td>
    </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório Manso Villa — ${dataStr}</title>
    <style>
      body { font-family: Georgia, serif; color: #1a1a1a; margin: 40px; font-size: 13px; }
      h1 { font-size: 24px; margin-bottom: 4px; }
      h2 { font-size: 16px; margin: 28px 0 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
      .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #888; padding: 6px 8px; border-bottom: 2px solid #ddd; }
      td { padding: 6px 8px; border-bottom: 1px solid #eee; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    <h1>Manso Villa — Relatório Financeiro</h1>
    <p class="sub">Condomínio Porto do Manso Vila Náutica · Chapada dos Guimarães - MT · Gerado em ${dataStr}</p>
    <h2>Equalização entre sócios</h2>
    <table><thead><tr><th>Sócio</th><th class="num">Aportado</th><th class="num">Cota ideal</th><th class="num">Diferença</th><th class="num">Aporte sugerido</th></tr></thead>
    <tbody>${linhasEq}</tbody></table>
    <h2>DRE por categoria</h2>
    <table><thead><tr><th>Categoria</th><th class="num">Receitas</th><th class="num">Despesas</th><th class="num">Saldo</th></tr></thead>
    <tbody>${linhasDRE}</tbody></table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado — permita popups para este site."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
    toast.success("Relatório aberto para impressão/PDF");
  };

  const exportarCSV = () => {
    const linhas = [["Data", "Tipo", "Descrição", "Categoria", "Responsável", "Valor"].join(",")];
    for (const l of lancamentos) {
      linhas.push([
        l.data, l.tipo, `"${l.descricao.replace(/"/g, '""')}"`, l.categoria, l.responsavel, l.valor.toFixed(2),
      ].join(","));
    }
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manso-villa-extrato-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="p-8 lg:p-12 max-w-[1200px] mx-auto">
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Análises</p>
          <h1 className="font-serif text-4xl mt-2">Relatórios</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={imprimirPDF} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm hover:bg-muted">
            <Printer className="size-4" /> Exportar PDF
          </button>
          <button onClick={exportarCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm hover:bg-muted">
            <Download className="size-4" /> Exportar CSV
          </button>
        </div>
      </header>

      {/* Comparativo sócios */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-1">Equalização entre sócios</h2>
        <p className="text-xs text-muted-foreground mb-4">Linha tracejada = cota proporcional ideal</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dadosSocios}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="nome" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} />
            <ReferenceLine y={cotaIdeal} stroke="var(--mist)" strokeDasharray="4 4" label={{ value: "Cota ideal", fill: "var(--mist)", fontSize: 10, position: "top" }} />
            <Bar dataKey="Aportado" fill="var(--deep)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2">Sócio</th>
                <th className="py-2 text-right">Aportado</th>
                <th className="py-2 text-right">Cota ideal</th>
                <th className="py-2 text-right">Diferença</th>
                <th className="py-2 text-right">Aporte sugerido</th>
              </tr>
            </thead>
            <tbody>
              {saldos.map((s) => {
                const diff = s.aportado - cotaIdeal;
                return (
                  <tr key={s.socio.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ backgroundColor: s.socio.cor }}>
                          {s.socio.iniciais}
                        </div>
                        {s.socio.nome.split(" ")[0]}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{formatBRL(s.aportado)}</td>
                    <td className="text-right tabular-nums text-muted-foreground">{formatBRL(cotaIdeal)}</td>
                    <td className="text-right tabular-nums font-medium" style={{ color: diff > 50 ? "var(--mist)" : diff < -50 ? "#c4654a" : "var(--muted-foreground)" }}>
                      {diff >= 0 ? "+" : ""}{formatBRL(diff)}
                    </td>
                    <td className="text-right tabular-nums">{diff < 0 ? formatBRL(Math.abs(diff)) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* DRE */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="size-5 text-[var(--lagoon)]" />
          <h2 className="font-serif text-xl">DRE por categoria</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2">Categoria</th>
              <th className="py-2 text-right">Receitas</th>
              <th className="py-2 text-right">Despesas</th>
              <th className="py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dre.map((d) => (
              <tr key={d.categoria} className="border-b border-border last:border-0">
                <td className="py-2.5">{d.categoria}</td>
                <td className="text-right tabular-nums text-[var(--mist)]">{d.receita ? formatBRL(d.receita) : "—"}</td>
                <td className="text-right tabular-nums">{d.despesa ? formatBRL(d.despesa) : "—"}</td>
                <td className="text-right tabular-nums font-medium" style={{ color: d.saldo >= 0 ? "var(--mist)" : "#c4654a" }}>
                  {d.saldo >= 0 ? "+" : ""}{formatBRL(d.saldo)}
                </td>
              </tr>
            ))}
            {dre.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Sem dados</td></tr>}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Para fins fiscais, cada sócio também pode baixar o histórico completo de seus aportes em "Minha posição".
        Total geral aportado: <strong className="text-foreground">{formatBRL(totalAportado)}</strong>{" "}
        — {SOCIOS.length} sócios fundadores.
      </p>
    </div>
  );
}
