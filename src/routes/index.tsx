import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useMansoStore } from "@/lib/manso-store";
import { Anchor, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const router = useRouter();
  const sessao = useMansoStore((s) => s.sessao);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessao) router.navigate({ to: "/dashboard" });
  }, [sessao, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { socio, erro } = await actions.login(email, senha);
      if (erro) {
        toast.error(erro);
      } else if (socio) {
        toast.success(`Bem-vindo, ${socio.nome.split(" ")[0]}`);
        router.navigate({ to: "/dashboard" });
      }
    } catch (err) {
      console.error("[submit] unexpected error:", err);
      toast.error("Erro ao conectar. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Esquerda — visual */}
      <div className="hidden lg:flex bg-deep-gradient relative overflow-hidden p-12 flex-col justify-between text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <Anchor className="size-5 text-[var(--gold)]" />
          <span className="font-serif text-2xl">Manso Villa</span>
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-white/60 mb-4">
            Porto do Manso Vila Náutica · Chapada dos Guimarães
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] text-balance">
            Três sócios.<br />
            <em className="text-[var(--gold)]">Uma casa</em> à beira do lago.
          </h1>
          <p className="mt-6 max-w-md text-white/70 leading-relaxed">
            Gestão financeira e de obra do Lote 01, Quadra R — 464,14 m² de terreno,
            participação igualitária, transparência total entre os sócios.
          </p>
        </div>
        <div className="relative flex gap-8 text-xs text-white/50">
          <div><span className="text-white text-lg font-serif">464,14</span> m² · terreno</div>
          <div><span className="text-white text-lg font-serif">33,33%</span> · por sócio</div>
          <div><span className="text-white text-lg font-serif">120</span> m² · mín. obra</div>
        </div>
      </div>

      {/* Direita — formulário */}
      <div className="flex items-center justify-center p-5 sm:p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <Anchor className="size-5 text-[var(--lagoon)]" />
            <span className="font-serif text-2xl">Manso Villa</span>
          </div>
          <h2 className="font-serif text-3xl">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso restrito aos sócios do projeto.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                E-mail
              </span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="seu e-mail cadastrado"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Senha
              </span>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60"
            >
              {submitting ? "Entrando…" : "Entrar no projeto"}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Acesso exclusivo para os sócios cadastrados.
            <br />Problemas? Entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
