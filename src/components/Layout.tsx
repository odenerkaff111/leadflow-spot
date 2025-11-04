import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, ChevronLeft, ChevronRight, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, company } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: TrendingUp, label: "Funil de Vendas", path: "/funil" },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && company && (
            <span className="font-semibold text-sidebar-foreground truncate">{company.name}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-2",
                    isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              "w-full justify-start gap-3 text-destructive hover:bg-destructive/10",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};
