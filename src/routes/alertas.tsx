import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMansoStore, calcularSaldos, getSocio, formatBRL } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { AlertTriangle, Bell, Vote, FileText, TrendingDown, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/alertas")({
  component: Alertas,
  head: () => ({ meta: [{ title: "Alertas — Manso Villa" }] }),
});

interface Alerta {
  id: string;
  tipo: "votacao" | "documento" | "desequilibrio" | "condominio";
  severidade: "info" | "atencao" | "critico";
  titulo: string;
  descricao: string;
}

function Alertas() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const votacoes = useMansoStore((s) => s.votacoes);
  const documentos = useMansoStore((s) => s.documentos);
  const lancamentos = useMansoStore((s) => s.lancamentos);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);

  const alertas = useMemo<Alerta[]>(() => {
    const arr: Alerta[] = [];
    // Votações pendentes para o usuário
    for (const v of votacoes) {
      if (v.decisao === "pendente" && sessao && v.votos[sessao as "eric"].status === "pendente") {
        arr.push({
          id: `vot-${v.id}`,
          tipo: "votacao",
          severidade: "atencao",
          titulo: `Votação pendente: ${v.titulo}`,
          descricao: `Sua decisão é necessária. Proposta por ${getSocio(v.criadoPor).nome.split(" ")[0]}.`,
        });
      }
    }
    // Documentos vencendo
    for (const d of documentos) {
      if (!d.validadeEm) continue;
      const dias = Math.ceil((new Date(d.validadeEm).getTime() - Date.now()) / 86400000);
      if (dias <= 30 && dias >= 0) {
        arr.push({
          id: `doc-${d.id}`,
          tipo: "documento",
          severidade: dias <= 7 ? "critico" : "atencao",
          titulo: `${d.nome} vence em ${dias} ${dias === 1 ? "dia" : "dias"}`,
          descricao: `Categoria: ${d.categoria}`,
        });
      }
    }
    // Desequilíbrio > 10%
    const saldos = calcularSaldos(lancamentos);
    const totalAportado = saldos.reduce((s, x) => s + x.aportado, 0);
    const cota = totalAportado / 3;
    for (const s of saldos) {
      const diff = s.aportado - cota;
      if (totalAportado > 0 && Math.abs(diff) / cota > 0.1) {
        arr.push({
          id: `deseq-${s.socio.id}`,
          tipo: "desequilibrio",
          severidade: "atencao",
          titulo: diff < 0 ? `${s.socio.nome.split(" ")[0]} está em atraso` : `${s.socio.nome.split(" ")[0]} está adiantado`,
          descricao: `Diferença de ${formatBRL(Math.abs(diff))} em relação à cota proporcional.`,
        });
      }
    }
    // Condomínio: alerta dia 25+ se não houve pagamento no mês
    const hoje = new Date();
    if (hoje.getDate() >= 25) {
      const mesAtual = hoje.toISOString().slice(0, 7);
      const pago = lancamentos.some(l => l.categoria === "Taxa de Condomínio" && l.data.startsWith(mesAtual));
      if (!pago) {
        arr.push({
          id: "cond",
          tipo: "condominio",
          severidade: "info",
          titulo: "Taxa de condomínio do mês ainda não registrada",
          descricao: "Lembre-se de lançar o pagamento até o último dia útil.",
        });
      }
    }
    return arr;
  }, [votacoes, documentos, lancamentos, sessao]);

  if (!sessao) return null;

  const iconFor = (a: Alerta) => {
    if (a.tipo === "votacao") return Vote;
    if (a.tipo === "documento") return FileText;
    if (a.tipo === "desequilibrio") return TrendingDown;
    return Bell;
  };
  const corFor = (s: Alerta["severidade"]) =>
    s === "critico" ? "#c4654a" : s === "atencao" ? "var(--gold)" : "var(--lagoon)";

  return (
    <div className="p-8 lg:p-12 max-w-[900px] mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notificações</p>
        <h1 className="font-serif text-4xl mt-2">Alertas</h1>
        <p className="text-muted-foreground mt-1">Itens que pedem sua atenção agora.</p>
      </header>

      {alertas.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <CheckCircle2 className="size-10 text-[var(--mist)] mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Tudo em ordem. Nenhum alerta no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => {
            const Icon = iconFor(a);
            const cor = corFor(a.severidade);
            return (
              <article key={a.id} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: cor }} />
                <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in oklab, ${cor} 15%, transparent)` }}>
                  <Icon className="size-5" style={{ color: cor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{a.titulo}</h3>
                    {a.severidade === "critico" && <AlertTriangle className="size-3.5" style={{ color: cor }} />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.descricao}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
