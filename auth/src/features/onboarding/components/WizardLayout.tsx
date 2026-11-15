import type { ReactNode } from "react";
import { Code2 } from "lucide-react";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import type { UserRole } from "../types";
import { Stepper } from "./Stepper";

export interface WizardLayoutProps {
  role: UserRole | null;
  currentStep: number;
  onStepClick?: (step: number) => void;
  isSignedIn: boolean;
  onSignOut?: () => void;
  preview: ReactNode;
  children: ReactNode;
}

export function WizardLayout({
  role,
  currentStep,
  onStepClick,
  isSignedIn,
  onSignOut,
  preview,
  children,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-text flex flex-col">
      <header className="border-b border-border bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base tracking-tight">CodeBridge</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isSignedIn && (
              <Button variant="ghost" onClick={onSignOut} className="text-xs">
                Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex-1">
        <div className="lg:grid lg:grid-cols-[55fr_45fr] lg:gap-10 lg:items-start">
          <div className="min-w-0">
            <Stepper currentStep={currentStep} role={role} onStepClick={onStepClick} />
            <Card className="max-w-xl min-w-0">{children}</Card>

            <div className="lg:hidden mt-6 max-w-xl">
              <details className="rounded-lg border border-border bg-surface p-4">
                <summary className="cursor-pointer text-sm font-medium text-text">
                  Preview your card
                </summary>
                <div className="mt-4">{preview}</div>
              </details>
            </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-6 min-w-0">{preview}</aside>
        </div>
      </main>
    </div>
  );
}
