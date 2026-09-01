import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions } from "@/lib/manso-store";
import { supabase } from "@/lib/supabase";
import { Anchor, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/redefinir-senha")({
  component: RedefinirSenha,
  head: () => ({ meta: [{ title: "Redefinir senha — Manso Villa" }] }),
});

function RedefinirSenha() {
  const router = useRouter();
  const [checando, setChecando] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLinkValido(!!data.session);
      setChecando(false);
    });
  }, []);

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
        toast.success("Senha atualizada! Entre com a nova senha.");
        router.navigate({ to: "/" });
      }
    } catch (err) {
      console.error("[redefinir-senha] unexpected error:", err);
      toast.error("Erro ao conectar. Verifique sua internet e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 sm:p-8 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Anchor className="size-5 text-[var(--lagoon)]" />
          <span className="font-serif text-2xl">Manso Villa</span>
        </div>

        {checando ? (
          <p className="text-center text-sm text-muted-foreground">Verificando link…</p>
        ) : !linkValido ? (
          <div className="text-center">
            <h2 className="font-serif text-2xl">Link inválido ou expirado</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Peça um novo link em "Esqueci minha senha" na tela de login.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-3xl text-center">Nova senha</h2>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Escolha uma nova senha para sua conta.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nova senha
                </span>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="mín. 6 caracteres"
                    autoComplete="new-password"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirmar senha
                </span>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60"
              >
                {salvando ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
