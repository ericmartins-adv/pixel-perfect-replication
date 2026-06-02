import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMansoStore, actions, getSocio, type DocCategoria } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { FileText, Upload, Trash2, Search, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS_DOC: DocCategoria[] = [
  "Imóvel", "Projetos Técnicos", "Contratos", "ARTs e RRTs",
  "Alvarás e Licenças", "Notas Fiscais", "Comprovantes", "Atas de Reunião", "Fotos",
];

export const Route = createFileRoute("/documentos")({
  component: DocumentosPage,
  head: () => ({ meta: [{ title: "Documentos — Manso Villa" }] }),
});

function DocumentosPage() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const documentos = useMansoStore((s) => s.documentos);
  const [busca, setBusca] = useState("");
  const [catFiltro, setCatFiltro] = useState<"todas" | DocCategoria>("todas");
  const [open, setOpen] = useState(false);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);
  if (!sessao) return null;

  const docs = documentos.filter((d) => {
    if (catFiltro !== "todas" && d.categoria !== catFiltro) return false;
    if (busca && !`${d.nome} ${d.tags.join(" ")}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 lg:p-12 max-w-[1200px] mx-auto">
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acervo do projeto</p>
          <h1 className="font-serif text-4xl mt-2">Documentos</h1>
          <p className="text-muted-foreground mt-1">Repositório de arquivos, contratos e licenças.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Upload className="size-4" /> Anexar documento
        </button>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou tag…"
            className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm" />
        </div>
        <select value={catFiltro} onChange={(e) => setCatFiltro(e.target.value as typeof catFiltro)}
          className="px-3 py-2.5 rounded-md border border-input bg-card text-sm">
          <option value="todas">Todas as categorias</option>
          {CATEGORIAS_DOC.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum documento ainda. Comece anexando matrículas, contratos e projetos.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => {
            const venc = d.validadeEm ? new Date(d.validadeEm) : null;
            const dias = venc ? Math.ceil((venc.getTime() - Date.now()) / 86400000) : null;
            const vencendo = dias != null && dias <= 30;
            const s = getSocio(d.uploadPor);
            return (
              <article key={d.id} className="bg-card border border-border rounded-xl p-5 group relative">
                <button onClick={async () => { try { await actions.removeDocumento(d.id); toast.success("Documento removido"); } catch { toast.error("Erro ao remover documento."); } }}
                  className="absolute top-3 right-3 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="size-3.5" />
                </button>
                <div className="size-10 rounded bg-secondary flex items-center justify-center mb-3">
                  <FileText className="size-5 text-[var(--lagoon)]" />
                </div>
                <h3 className="font-medium text-sm leading-snug break-words">{d.nome}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{d.categoria} · {(d.tamanhoKb / 1024).toFixed(1)} MB</p>
                {d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{t}</span>)}
                  </div>
                )}
                {vencendo && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#c4654a]">
                    <AlertTriangle className="size-3" /> Vence em {dias} {dias === 1 ? "dia" : "dias"}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white" style={{ backgroundColor: s.cor }}>
                    {s.iniciais}
                  </div>
                  por {s.nome.split(" ")[0]} · {new Date(d.uploadEm).toLocaleDateString("pt-BR")}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && <UploadModal sessao={sessao} onClose={() => setOpen(false)} />}
    </div>
  );
}

function UploadModal({ sessao, onClose }: { sessao: string; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<DocCategoria>("Imóvel");
  const [validade, setValidade] = useState("");
  const [tags, setTags] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalNome = nome.trim() || arquivo?.name || "documento.pdf";
      await actions.addDocumento({
        nome: finalNome,
        categoria,
        tamanhoKb: arquivo ? Math.round(arquivo.size / 1024) : 0,
        uploadPor: sessao as "eric",
        validadeEm: validade || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      toast.success("Documento adicionado");
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar documento. Verifique sua conexão e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-2xl">Novo documento</h2>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Arquivo</span>
            <input type="file" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="w-full mt-1 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Matrícula 17.191"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as DocCategoria)}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm">
              {CATEGORIAS_DOC.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Validade (opcional)</span>
              <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tags (vírgulas)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="lote, escritura"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" />
            </label>
          </div>
          <p className="text-[10px] text-muted-foreground">
            ⓘ Versão MVP: armazena apenas os metadados do documento (sem upload físico do arquivo).
          </p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
              {saving ? "Salvando…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
