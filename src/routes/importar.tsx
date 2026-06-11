import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  useMansoStore,
  parseOFX,
  sugerirSocio,
  SOCIOS,
  CATEGORIAS,
  actions,
} from "@/lib/manso-store";
import type { Categoria, SocioId, OfxTx } from "@/lib/manso-store";
import { Upload, CheckCircle2, SkipForward, AlertCircle, FileUp, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/importar")({
  component: Importar,
  head: () => ({ meta: [{ title: "Importar Extrato — Manso Villa" }] }),
});

interface TxClassificada extends OfxTx {
  _id: string;
  socioAporte: SocioId | null;
  categoria: Categoria | null;
  pular: boolean;
}

function Importar() {
  const router = useRouter();
  const sessao = useMansoStore((s) => s.sessao);
  const [txs, setTxs] = useState<TxClassificada[]>([]);
  const [importando, setImportando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sessao) router.navigate({ to: "/" });
  }, [sessao, router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseOFX(content);
      if (parsed.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo OFX.");
        return;
      }
      const classificadas: TxClassificada[] = parsed.map((tx, i) => {
        const socioSugerido = tx.tipo === "credito" ? sugerirSocio(tx.descricao) : null;
        return {
          ...tx,
          _id: `ofx-${Date.now()}-${i}`,
          socioAporte: socioSugerido,
          categoria: null,
          pular: false,
        };
      });
      setTxs(classificadas);
      toast.success(`${parsed.length} transações encontradas. Classifique cada uma antes de importar.`);
    };
    reader.readAsText(file, "ISO-8859-1");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith(".ofx")) { toast.error("Apenas arquivos .ofx são suportados"); return; }
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFile(fakeEvent);
  };

  const pendentes = txs.filter((t) => !t.pular && (t.tipo === "credito" ? !t.socioAporte : !t.categoria));

  const confirmarImportacao = async () => {
    if (pendentes.length > 0) {
      toast.error(`${pendentes.length} transação(ões) ainda sem classificação.`);
      return;
    }
    setImportando(true);
    const itens: Omit<import("@/lib/manso-store").Lancamento, "id" | "criadoEm">[] = [];
    for (const tx of txs) {
      if (tx.pular) continue;
      if (tx.tipo === "credito") {
        const sid = tx.socioAporte!;
        itens.push({
          data: tx.data, tipo: "receita", descricao: tx.descricao, categoria: "Aporte",
          valor: tx.valor, responsavel: sid,
          rateio: { eric: sid === "eric" ? tx.valor : 0, michael: sid === "michael" ? tx.valor : 0, heryk: sid === "heryk" ? tx.valor : 0 },
          criadoPor: sessao!, faseId: undefined,
        });
      } else {
        const split = tx.valor / 3;
        itens.push({
          data: tx.data, tipo: "despesa", descricao: tx.descricao, categoria: tx.categoria!,
          valor: tx.valor, responsavel: sessao!,
          rateio: { eric: split, michael: split, heryk: split },
          criadoPor: sessao!, faseId: undefined,
        });
      }
    }
    try {
      await actions.addLancamentosBulk(itens);
      toast.success(`${itens.length} lançamento(s) importado(s) com sucesso!`);
      router.navigate({ to: "/lancamentos" });
    } catch (err) {
      toast.error(`Erro ao salvar: ${err instanceof Error ? err.message : "Tente novamente"}`);
    } finally {
      setImportando(false);
    }
  };

  const resetar = () => {
    setTxs([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!sessao) return null;

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[960px] mx-auto">
      <header className="mb-8">
        <Link to="/lancamentos" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-3" /> Voltar para lançamentos
        </Link>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Financeiro</p>
        <h1 className="font-serif text-4xl mt-2">Importar extrato OFX</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-lg">
          Importe um extrato bancário no formato OFX. Classifique cada transação antes de confirmar — créditos são identificados como aportes de sócios.
        </p>
      </header>

      {/* Upload área */}
      {txs.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 sm:p-16 text-center cursor-pointer hover:border-[var(--lagoon)] hover:bg-muted/20 transition group"
        >
          <FileUp className="size-12 mx-auto text-muted-foreground group-hover:text-[var(--lagoon)] transition mb-4" />
          <p className="text-base font-medium mb-1">Arraste ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">Formato Open Financial Exchange (.ofx) — exportado do seu internet banking</p>
          <input ref={fileRef} type="file" accept=".ofx" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* Triagem */}
      {txs.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{txs.filter((t) => !t.pular).length} para importar</span>
              {txs.filter((t) => t.pular).length > 0 && <span>{txs.filter((t) => t.pular).length} puladas</span>}
              {pendentes.length > 0 && (
                <span className="text-yellow-500 flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> {pendentes.length} sem classificação
                </span>
              )}
            </div>
            <button onClick={resetar} className="text-xs text-muted-foreground hover:text-foreground underline">
              Trocar arquivo
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {txs.map((tx, i) => (
              <TxCard
                key={tx._id}
                tx={tx}
                onChange={(patch) =>
                  setTxs((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)))
                }
              />
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={resetar}
              className="px-4 py-2.5 rounded-md border border-border text-sm hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarImportacao}
              disabled={importando || pendentes.length > 0}
              className="px-6 py-2.5 rounded-md bg-[var(--deep)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            >
              <Upload className="size-4" />
              Confirmar importação
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TxCard({
  tx,
  onChange,
}: {
  tx: TxClassificada;
  onChange: (patch: Partial<TxClassificada>) => void;
}) {
  const isCred = tx.tipo === "credito";
  const classificado = isCred ? !!tx.socioAporte : !!tx.categoria;

  return (
    <div
      className={`border rounded-xl p-4 transition ${
        tx.pular
          ? "opacity-40 bg-muted/20 border-border"
          : classificado
          ? "border-border bg-card"
          : "border-yellow-500/40 bg-yellow-500/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Indicador tipo */}
        <div
          className={`mt-1.5 size-2.5 rounded-full shrink-0 ${
            isCred ? "bg-[var(--mist)]" : "bg-[#c4654a]"
          }`}
        />

        <div className="flex-1 min-w-0">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <p className="font-medium text-sm">{tx.descricao}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(tx.data + "T12:00:00").toLocaleDateString("pt-BR")} ·{" "}
                <span className={isCred ? "text-[var(--mist)]" : "text-[#c4654a]"}>
                  {isCred ? "Crédito (entrada)" : "Débito (saída)"}
                </span>
              </p>
            </div>
            <p
              className={`font-serif text-xl tabular-nums font-semibold shrink-0 ${
                isCred ? "text-[var(--mist)]" : ""
              }`}
            >
              {isCred ? "+" : "−"} R${" "}
              {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Classificação */}
          {!tx.pular && (
            <div>
              {isCred ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    {tx.socioAporte ? "Aporte identificado automaticamente — confirme ou altere:" : "Identificar aporte de qual sócio?"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SOCIOS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onChange({ socioAporte: s.id })}
                        className={`px-3 py-1.5 rounded-full text-xs border font-medium transition ${
                          tx.socioAporte === s.id
                            ? "border-transparent text-white"
                            : "border-border hover:border-[var(--lagoon)]"
                        }`}
                        style={
                          tx.socioAporte === s.id ? { backgroundColor: s.cor } : {}
                        }
                      >
                        {s.nome.split(" ")[0]}
                      </button>
                    ))}
                    <button
                      onClick={() => onChange({ socioAporte: null })}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        !tx.socioAporte
                          ? "bg-muted border-muted-foreground text-foreground"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      Outra receita
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Categoria da despesa:
                  </p>
                  <select
                    value={tx.categoria ?? ""}
                    onChange={(e) => onChange({ categoria: e.target.value as Categoria })}
                    className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground max-w-xs"
                  >
                    <option value="">Selecionar categoria...</option>
                    {CATEGORIAS.filter((c) => c !== "Aporte").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {tx.pular && (
            <p className="text-xs text-muted-foreground italic">Esta transação será ignorada na importação.</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!tx.pular && classificado && (
            <CheckCircle2 className="size-5 text-[var(--mist)]" />
          )}
          {!tx.pular && !classificado && (
            <AlertCircle className="size-5 text-yellow-500" />
          )}
          <button
            onClick={() => onChange({ pular: !tx.pular })}
            title={tx.pular ? "Incluir transação" : "Pular transação"}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
