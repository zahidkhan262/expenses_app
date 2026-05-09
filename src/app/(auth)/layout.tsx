import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_55%)]" />
      <div className="absolute left-1/2 top-6 z-10 flex -translate-x-1/2 items-center gap-2 text-sm font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground shadow-sm">
          <Wallet className="h-5 w-5" />
        </span>
        Daily Expense Dashboard
      </div>
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

