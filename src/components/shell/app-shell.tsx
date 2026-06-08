import { Wallet } from "lucide-react";

import { SidebarNav, BottomNav } from "@/components/shell/nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { MobileDrawer } from "@/components/shell/mobile-drawer";
import { UserMenu } from "@/components/shell/user-menu";

export function AppShell({
  user,
  isAdmin = false,
  children,
}: {
  user: { name: string; email: string };
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh w-[280px] border-r border-border bg-background md:flex md:flex-col lg:w-[296px]">
          <div className="flex items-center gap-2 px-5 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground shadow-sm">
              <Wallet className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Expenses</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          </div>
          <div className="flex-1 px-3">
            <SidebarNav isAdmin={isAdmin} />
          </div>
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <UserMenu name={user.name} email={user.email} />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <MobileDrawer isAdmin={isAdmin} />
                <span className="text-sm font-semibold">Daily Expense</span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <UserMenu name={user.name} email={user.email} />
              </div>
            </div>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

