import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, SOCIOS, useMansoStore } from "@/lib/manso-store";
import { Anchor, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const router = useRouter();
  const sessao = useMansoStore((s) => s.sessao);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    if (sessao) router.navigate({ to: "/dashboard" });
  }, [sessao, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = actions.login(email, senha);
    if (!s) return toast.error("E-mail ou senha inválidos");
    toast.success(`Bem-vindo, ${s.nome.split(" ")[0]}`);
    router.navigate({ to: "/dashboard" });
  };

  const quick = (id: string) => {
    const s = SOCIOS.find((x) => x.id === id)!;
    setEmail(s.email);
    setSenha(s.senha);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* esquerda — visual */}
      <div className="hidden lg:flex bg-deep-gradient relative overflow-hidden p-12 flex-col justify-between text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
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

      {/* direita — form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Anchor className="size-5 text-[var(--lagoon)]" />
            <span className="font-serif text-2xl">Manso Villa</span>
          </div>
          <h2 className="font-serif text-3xl">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso restrito aos três sócios do projeto.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">E-mail</span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="eric@mansovilla.app"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Senha</span>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              Entrar no projeto
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              Acesso rápido (demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SOCIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => quick(s.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-border hover:border-ring transition"
                >
                  <div
                    className="size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: s.cor }}
                  >
                    {s.iniciais}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {s.nome.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Senha demo: <code className="bg-muted px-1.5 py-0.5 rounded">manso123</code>
            </p>
          </div>

          <Link to="/dashboard" className="hidden" />
        </div>
      </div>
    </div>
  );
}
