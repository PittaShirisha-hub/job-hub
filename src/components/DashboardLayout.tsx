import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Briefcase, Heart, LogOut, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Jobs", icon: Briefcase, exact: true },
  { to: "/dashboard/saved", label: "Saved Jobs", icon: Heart, exact: false },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">JobBoard</p>
            <p className="text-xs text-muted-foreground truncate" title={user?.email ?? ""}>
              {user?.email ?? "Admin"}
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">JobBoard Admin</p>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
