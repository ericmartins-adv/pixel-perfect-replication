import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { actions, getSocio, useMansoStore } from "@/lib/manso-store";
import {
  Anchor, LogOut, LayoutDashboard, Receipt, Users, Hammer,
  Target, FileText, Vote, BarChart3, Bell, User, Upload, Loader2,
  Menu, X,
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useClientMounted();
  const sessao = useMansoStore((s) => s.sessao);
  const loading = useMansoStore((s) => s.loading);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // SSR: sem chrome
  if (!hydrated) return <>{children}</>;

  // Não autenticado (ou ainda verificando sessão) → mostra a rota de login
  if (!sessao) return <>{children}</>;

  const socio = getSocio(sessao);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-deep-gradient text-sidebar-foreground flex-col sticky top-0 h-screen">
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

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (Sidebar on mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-deep-gradient text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-sidebar-border/40 flex items-center justify-between">
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
            <Anchor className="size-5 text-[var(--gold)]" />
            <span className="font-serif text-2xl tracking-tight">Manso Villa</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
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
                setIsMobileMenuOpen(false);
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-4 h-16 border-b border-border bg-card sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-md"
            aria-label="Abrir menu"
          >
            <Menu className="size-6" />
          </button>

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

        {/* Content main flow */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {/* Loading overlay quando atualiza dados após login */}
          {loading && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Sincronizando dados…
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
