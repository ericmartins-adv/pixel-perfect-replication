import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, getSocio, useMansoStore, type PerfilCadastral } from "@/lib/manso-store";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { IdCard, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  component: PerfilPage,
  head: () => ({ meta: [{ title: "Meu perfil — Manso Villa" }] }),
});

function PerfilPage() {
  const router = useRouter();
  const mounted = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const perfil = useMansoStore((s) => s.perfil);

  useEffect(() => { if (mounted && !sessao) router.navigate({ to: "/" }); }, [mounted, sessao, router]);
  if (!sessao) return null;

  const socio = getSocio(sessao);

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[720px] mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{socio.nome}</p>
        <h1 className="font-serif text-4xl mt-2">Meu perfil</h1>
        <p className="text-muted-foreground mt-1">Dados cadastrais e acesso — visíveis só para você.</p>
      </header>

      <DadosCadastraisForm perfil={perfil} />
      <SenhaForm />
    </div>
  );
}

function DadosCadastraisForm({ perfil }: { perfil: PerfilCadastral }) {
  const [form, setForm] = useState<PerfilCadastral>(perfil);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setForm(perfil), [perfil]);

  const set = (k: keyof PerfilCadastral) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const { ok, erro } = await actions.updatePerfil(form);
      if (!ok) toast.error(erro ?? "Erro ao salvar dados cadastrais.");
      else toast.success("Dados cadastrais atualizados");
    } catch (err) {
      console.error("[perfil] unexpected error:", err);
      toast.error("Erro ao conectar. Verifique sua internet e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <IdCard className="size-5 text-[var(--lagoon)]" />
        <h2 className="font-serif text-xl">Dados cadastrais</h2>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome completo">
          <input value={form.nome} onChange={set("nome")} placeholder="Nome completo para documentos"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CPF">
            <input value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </Field>
          <Field label="Telefone">
            <input value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Banco">
            <input value={form.banco} onChange={set("banco")} placeholder="Ex: Itaú"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </Field>
          <Field label="Agência">
            <input value={form.agencia} onChange={set("agencia")} placeholder="0000"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </Field>
          <Field label="Conta corrente">
            <input value={form.conta} onChange={set("conta")} placeholder="00000-0"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
          </Field>
        </div>
        <Field label="Chave PIX">
          <input value={form.chavePix} onChange={set("chavePix")} placeholder="e-mail, telefone, CPF ou chave aleatória"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </Field>
        <button type="submit" disabled={salvando}
          className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {salvando ? "Salvando…" : "Salvar dados cadastrais"}
        </button>
      </form>
    </section>
  );
}

function SenhaForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirmar) return toast.error("As senhas não coincidem.");
    setSalvando(true);
    try {
      const { ok, erro } = await actions.updatePassword(senha);
      if (!ok) {
        toast.error(erro ?? "Erro ao atualizar a senha.");
      } else {
        toast.success("Senha atualizada! Entre novamente com a nova senha.");
        router.navigate({ to: "/" });
      }
    } catch (err) {
      console.error("[perfil] unexpected error:", err);
      toast.error("Erro ao conectar. Verifique sua internet e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lock className="size-5 text-[var(--lagoon)]" />
        <h2 className="font-serif text-xl">Alterar senha de acesso</h2>
      </div>
      <form onSubmit={submit} className="space-y-4 max-w-sm">
        <Field label="Nova senha">
          <input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)}
            placeholder="mín. 6 caracteres" autoComplete="new-password"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </Field>
        <Field label="Confirmar nova senha">
          <input type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
            placeholder="••••••••" autoComplete="new-password"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </Field>
        <button type="submit" disabled={salvando}
          className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {salvando ? "Salvando…" : "Atualizar senha"}
        </button>
        <p className="text-[11px] text-muted-foreground">Você será desconectado após trocar a senha, para entrar de novo com a nova.</p>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
