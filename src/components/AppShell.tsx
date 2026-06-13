import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { actions, getSocio, useMansoStore } from "@/lib/manso-store";
import {
  Anchor, LogOut, LayoutDashboard, Receipt, Users, Hammer,
  Target, FileText, Vote, BarChart3, Bell, User, Upload, Loader2,
  MoreHorizontal, X,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/minha-posicao", label: "Minha posição", icon: User },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { to: "/importar", label: "Importar extrato", icon: Upload },
  { to: "/obra", label: "Plano de obra", icon: Hammer },
  { to: "/orcamento", label: "Orçamento", icon: Target },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/reunioes", label: "Reuniões & Votações", icon: Vote },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/socios", label: "Sócios", icon: Users },
] as const;

// 4 primary items in the mobile bottom bar
const BOTTOM_NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/lancamentos", label: "Finanças", icon: Receipt },
  { to: "/obra", label: "Obra", icon: Hammer },
  { to: "/reunioes", label: "Reuniões", icon: Vote },
] as const;

// Remaining items in "Mais" drawer
const MORE_NAV = [
  { to: "/minha-posicao", label: "Minha posição", icon: User },
  { to: "/importar", label: "Importar extrato", icon: Upload },
  { to: "/orcamento", label: "Orçamento", icon: Target },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/socios", label: "Sócios", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const loading = useMansoStore((s) => s.loading);
  const authChecked = useMansoStore((s) => s.authChecked);
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!hydrated) return <>{children}</>;

  // Aguarda verificação inicial de auth para evitar flash do login antes de saber se há sessão
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Verificando acesso…</span>
        </div>
      </div>
    );
  }

  if (!sessao) return <>{children}</>;

  const socio = getSocio(sessao);

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop Sidebar (lg+) ─────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-deep-gradient text-sidebar-foreground flex-col sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-sidebar-border/40">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Anchor className="size-5 text-[var(--gold)]" />
            <span className="font-serif text-2xl tracking-tight">Manso Villa</span>
          </Link>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            Porto do Manso · Lote 01
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
                activeProps={{
                  className: "flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-sidebar-accent text-sidebar-foreground",
                }}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border/40">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="size-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
              style={{ backgroundColor: socio.cor }}
            >
              {socio.iniciais}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{socio.nome.split(" ")[0]}</p>
              <p className="text-[10px] text-sidebar-foreground/55 truncate">{socio.email}</p>
            </div>
            <button
              onClick={async () => {
                await actions.logout();
                router.navigate({ to: "/" });
              }}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded hover:bg-sidebar-accent"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-30 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Anchor className="size-5 text-[var(--deep)]" />
            <span className="font-serif text-xl tracking-tight text-foreground">Manso Villa</span>
          </Link>
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: socio.cor }}
          >
            {socio.iniciais}
          </div>
        </header>

        {/* Sync indicator */}
        {loading && (
          <div className="fixed top-[58px] right-4 lg:top-4 z-50 flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Sincronizando dados…
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation (below lg) ──────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-deep-gradient text-sidebar-foreground border-t border-sidebar-border/40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-sidebar-foreground/55 text-[10px] font-medium"
                activeProps={{
                  className: "flex-1 flex flex-col items-center justify-center gap-1 text-[var(--gold)] text-[10px] font-medium",
                }}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Mais button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-sidebar-foreground/55 text-[10px] font-medium"
          >
            <MoreHorizontal className="size-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* ── "Mais" Bottom Sheet ───────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-2xl shadow-xl lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* User info + close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="size-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ backgroundColor: socio.cor }}
                >
                  {socio.iniciais}
                </div>
                <div>
                  <p className="text-sm font-medium">{socio.nome.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{socio.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Grid of secondary items */}
            <div className="p-3 grid grid-cols-4 gap-1">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-foreground/65 text-[10px] text-center font-medium hover:bg-muted"
                    activeProps={{
                      className: "flex flex-col items-center gap-1.5 p-3 rounded-xl text-primary text-[10px] text-center font-medium bg-primary/10",
                    }}
                  >
                    <Icon className="size-5" />
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="px-4 pb-3 pt-1 border-t border-border">
              <button
                onClick={async () => {
                  setMoreOpen(false);
                  await actions.logout();
                  router.navigate({ to: "/" });
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="size-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
