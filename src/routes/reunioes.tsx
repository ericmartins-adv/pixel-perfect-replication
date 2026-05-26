import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMansoStore, actions, SOCIOS, getSocio, formatBRL, type SocioId, type VotoStatus } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { Plus, Check, X, Clock, FileSignature, Vote as VoteIcon, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reunioes")({
  component: Reunioes,
  head: () => ({ meta: [{ title: "Reuniões & Votações — Manso Villa" }] }),
});

function Reunioes() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const votacoes = useMansoStore((s) => s.votacoes);
  const reunioes = useMansoStore((s) => s.reunioes);
  const [tab, setTab] = useState<"votacoes" | "reunioes">("votacoes");
  const [openVot, setOpenVot] = useState(false);
  const [openReu, setOpenReu] = useState(false);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);
  if (!sessao) return null;

  return (
    <div className="p-8 lg:p-12 max-w-[1100px] mx-auto">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Governança</p>
        <h1 className="font-serif text-4xl mt-2">Reuniões & votações</h1>
        <p className="text-muted-foreground mt-1">Decisões precisam de 2 dos 3 sócios. Prazo padrão: 72h.</p>
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 p-1 bg-muted rounded-md w-fit">
          <button onClick={() => setTab("votacoes")}
            className={`px-4 py-1.5 text-sm rounded ${tab === "votacoes" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Votações
          </button>
          <button onClick={() => setTab("reunioes")}
            className={`px-4 py-1.5 text-sm rounded ${tab === "reunioes" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Atas de reunião
          </button>
        </div>
        <button onClick={() => tab === "votacoes" ? setOpenVot(true) : setOpenReu(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="size-4" /> {tab === "votacoes" ? "Nova votação" : "Nova reunião"}
        </button>
      </div>

      {tab === "votacoes" ? (
        <div className="space-y-4">
          {votacoes.length === 0 && <Empty texto="Nenhuma votação em curso." />}
          {votacoes.map((v) => {
            const meuVoto = v.votos[sessao];
            const aprov = Object.values(v.votos).filter(x => x.status === "aprovado").length;
            const rejei = Object.values(v.votos).filter(x => x.status === "rejeitado").length;
            const prazoMs = new Date(v.prazo).getTime() - Date.now();
            const horas = Math.max(0, Math.round(prazoMs / 3600000));
            return (
              <article key={v.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      v.decisao === "aprovada" ? "bg-[var(--mist)]/15 text-[var(--mist)]" :
                      v.decisao === "rejeitada" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {v.decisao === "aprovada" ? "Aprovada" : v.decisao === "rejeitada" ? "Rejeitada" : "Pendente"}
                    </span>
                    <h3 className="font-serif text-xl mt-2">{v.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{v.descricao}</p>
                    {v.valor && <p className="text-sm font-medium mt-2 tabular-nums">Valor: {formatBRL(v.valor)}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {horas}h restantes
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Proposta por {getSocio(v.criadoPor).nome.split(" ")[0]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5">
                  {SOCIOS.map((s) => {
                    const voto = v.votos[s.id];
                    const icon = voto.status === "aprovado" ? <Check className="size-3" /> :
                                 voto.status === "rejeitado" ? <X className="size-3" /> :
                                 <Clock className="size-3" />;
                    return (
                      <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                        <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ backgroundColor: s.cor }}>
                          {s.iniciais}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] truncate">{s.nome.split(" ")[0]}</p>
                          <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">{icon}{voto.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {v.decisao === "pendente" && meuVoto.status === "pendente" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => actions.votar(v.id, sessao as SocioId, "aprovado")}
                      className="flex-1 py-2 rounded-md bg-[var(--mist)] text-white text-sm font-medium hover:opacity-90">
                      <Check className="size-4 inline -mt-0.5 mr-1" /> Aprovar
                    </button>
                    <button onClick={() => {
                      const j = prompt("Justificativa para rejeitar:") ?? "";
                      actions.votar(v.id, sessao as SocioId, "rejeitado", j);
                    }} className="flex-1 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90">
                      <X className="size-4 inline -mt-0.5 mr-1" /> Rejeitar
                    </button>
                    <button onClick={() => actions.votar(v.id, sessao as SocioId, "abstido" as VotoStatus)}
                      className="flex-1 py-2 rounded-md border border-border text-sm">
                      Abster-me
                    </button>
                  </div>
                )}
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Aprovações: <strong className="text-[var(--mist)]">{aprov}/2</strong></span>
                  <span>Rejeições: <strong className="text-destructive">{rejei}/2</strong></span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {reunioes.length === 0 && <Empty texto="Nenhuma reunião registrada ainda." />}
          {reunioes.map((r) => {
            const imprimirAta = () => {
              const dataFmt = new Date(r.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
              const participantesNomes = r.participantes.map((id) => SOCIOS.find((s) => s.id === id)?.nome ?? id).join(", ");
              const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
              <title>Ata — ${r.titulo}</title>
              <style>
                body { font-family: Georgia, serif; color: #1a1a1a; margin: 60px; font-size: 14px; line-height: 1.7; }
                h1 { font-size: 22px; border-bottom: 2px solid #1a6b72; padding-bottom: 8px; margin-bottom: 4px; }
                .meta { color: #666; font-size: 12px; margin-bottom: 32px; }
                h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .1em; color: #888; margin: 28px 0 8px; }
                .assinaturas { margin-top: 60px; display: flex; gap: 40px; }
                .assin { flex: 1; border-top: 1px solid #ccc; padding-top: 8px; font-size: 12px; color: #666; }
                @media print { body { margin: 30px; } }
              </style></head><body>
              <h1>${r.titulo}</h1>
              <p class="meta">${dataFmt} · Participantes: ${participantesNomes}</p>
              <h2>Pauta</h2><p>${r.pauta.replace(/\n/g, "<br>")}</p>
              <h2>Deliberações</h2><p>${r.deliberacoes.replace(/\n/g, "<br>")}</p>
              <div class="assinaturas">${r.participantes.map((id) => {
                const s = SOCIOS.find((x) => x.id === id);
                return `<div class="assin">${s?.nome ?? id}<br>Sócio Fundador — 33,33%</div>`;
              }).join("")}</div>
              </body></html>`;
              const win = window.open("", "_blank");
              if (!win) return;
              win.document.write(html);
              win.document.close();
              win.focus();
              setTimeout(() => win.print(), 400);
            };
            return (
            <article key={r.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSignature className="size-3.5" />
                  {new Date(r.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <button onClick={imprimirAta} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1 hover:bg-muted">
                  <Printer className="size-3.5" /> Imprimir ata
                </button>
              </div>
              <h3 className="font-serif text-xl">{r.titulo}</h3>
              <div className="flex gap-1 mt-2">
                {r.participantes.map((id) => {
                  const s = getSocio(id);
                  return <div key={id} className="size-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ backgroundColor: s.cor }}>{s.iniciais}</div>;
                })}
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Pauta</p>
                  <p className="whitespace-pre-wrap">{r.pauta}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Deliberações</p>
                  <p className="whitespace-pre-wrap">{r.deliberacoes}</p>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {openVot && <NovaVotacao sessao={sessao as SocioId} onClose={() => setOpenVot(false)} />}
      {openReu && <NovaReuniao sessao={sessao as SocioId} onClose={() => setOpenReu(false)} />}
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
      <VoteIcon className="size-10 text-muted-foreground mx-auto" />
      <p className="mt-3 text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}

function NovaVotacao({ sessao, onClose }: { sessao: SocioId; onClose: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.addVotacao({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      valor: valor ? parseFloat(valor.replace(",", ".")) : undefined,
      criadoPor: sessao,
      prazo: new Date(Date.now() + 72 * 3600000).toISOString(),
    });
    toast.success("Votação aberta — você já votou favorável.");
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Nova votação">
      <form onSubmit={submit} className="space-y-3">
        <Input label="Título" value={titulo} onChange={setTitulo} required />
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</span>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" required />
        </label>
        <Input label="Valor envolvido (opcional)" value={valor} onChange={setValor} inputMode="decimal" />
        <button type="submit" className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">Abrir votação</button>
      </form>
    </Modal>
  );
}

function NovaReuniao({ sessao, onClose }: { sessao: SocioId; onClose: () => void }) {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [titulo, setTitulo] = useState("");
  const [pauta, setPauta] = useState("");
  const [delib, setDelib] = useState("");
  const [parts, setParts] = useState<SocioId[]>([sessao]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.addReuniao({ data, titulo: titulo.trim(), pauta, deliberacoes: delib, participantes: parts });
    toast.success("Ata registrada");
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Nova reunião">
      <form onSubmit={submit} className="space-y-3">
        <Input label="Título" value={titulo} onChange={setTitulo} required />
        <Input label="Data" type="date" value={data} onChange={setData} required />
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Participantes</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {SOCIOS.map((s) => (
              <button key={s.id} type="button"
                onClick={() => setParts(parts.includes(s.id) ? parts.filter(p => p !== s.id) : [...parts, s.id])}
                className={`px-2 py-2 rounded border text-xs ${parts.includes(s.id) ? "border-primary bg-primary/5" : "border-border"}`}>
                {s.nome.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Pauta" value={pauta} onChange={setPauta} />
        <Textarea label="Deliberações" value={delib} onChange={setDelib} />
        <button type="submit" className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">Registrar ata</button>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={onClose}><X className="size-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; inputMode?: "decimal";
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} inputMode={inputMode}
        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" />
    </label>
  );
}
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm" />
    </label>
  );
}
