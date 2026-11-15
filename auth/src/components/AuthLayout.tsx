import type { ReactNode } from "react";
import { Code2 } from "lucide-react";
import { Card } from "./ui/Card";
import { ThemeToggle } from "./ThemeToggle";

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-text flex flex-col">
      <header className="border-b border-border bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base tracking-tight">CodeBridge</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <Card className="w-full max-w-md min-w-0">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
          {children}
        </Card>
      </main>
    </div>
  );
}
