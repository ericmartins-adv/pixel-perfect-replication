import { Link, useRouter } from "@tanstack/react-router";
import { actions, getSocio, useMansoStore } from "@/lib/manso-store";
import { Anchor, LogOut, LayoutDashboard, Receipt, Users } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { to: "/socios", label: "Sócios", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const sessao = useMansoStore((s) => s.sessao);
  const router = useRouter();

  if (!sessao) return <>{children}</>;
  const socio = getSocio(sessao);

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-deep-gradient text-sidebar-foreground flex flex-col">
        <div className="px-6 py-7 border-b border-sidebar-border/40">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <Anchor className="size-5 text-[var(--gold)]" />
            <span className="font-serif text-2xl tracking-tight">Manso Villa</span>
          </Link>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            Porto do Manso · Lote 01
          </p>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
                activeProps={{
                  className:
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm bg-sidebar-accent text-sidebar-foreground",
                }}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border/40">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="size-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
              style={{ backgroundColor: socio.cor }}
            >
              {socio.iniciais}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{socio.nome.split(" ")[0]} {socio.nome.split(" ").slice(-1)}</p>
              <p className="text-[10px] text-sidebar-foreground/55 truncate">{socio.email}</p>
            </div>
            <button
              onClick={() => {
                actions.logout();
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

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
