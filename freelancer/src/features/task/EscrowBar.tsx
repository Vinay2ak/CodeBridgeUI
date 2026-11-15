import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  FileCheck2,
  Coins,
  RefreshCw,
} from "lucide-react";
import { paymentApi } from "../../services/payment/api";
import { PaymentState } from "../../services/payment/types";
import { formatCurrencyINR } from "../../lib/format";
import { ApiError } from "../../lib/errors";
import { eventStore } from "../../realtime/store";
import { useQueryClient } from "@tanstack/react-query";

interface EscrowBarProps {
  taskId: string;
}

interface StepDef {
  key: PaymentState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isMoneyTone: boolean;
}

const ESCROW_STEPS: StepDef[] = [
  { key: "authorized", label: "Authorized", icon: ShieldCheck, isMoneyTone: false },
  { key: "held", label: "Held", icon: Lock, isMoneyTone: true },
  { key: "tested", label: "Tested", icon: CheckCircle2, isMoneyTone: false },
  { key: "approved", label: "Approved", icon: FileCheck2, isMoneyTone: false },
  { key: "released", label: "Released", icon: Coins, isMoneyTone: true },
];

export const EscrowBar: React.FC<EscrowBarProps> = ({ taskId }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["escrow", taskId],
    queryFn: () => paymentApi.getEscrow(taskId),
    enabled: Boolean(taskId),
  });

  // Listen for realtime payment state transitions
  React.useEffect(() => {
    const unsub = eventStore.subscribe("payment.state_changed", (event) => {
      const pData = event.data as { taskId: string; state: PaymentState };
      if (pData && pData.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ["escrow", taskId] });
      }
    });
    return unsub;
  }, [taskId, queryClient]);

  if (isLoading) {
    return (
      <div className="w-full bg-surface border-b border-line px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-raised rounded animate-pulse" />
          <div className="h-6 w-96 bg-raised rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    const correlationId = apiError?.correlationId || "err_escrow";

    return (
      <aside
        aria-label="Escrow Status"
        className="w-full bg-surface border-b border-line px-6 py-2.5 flex items-center justify-between gap-4 text-xs"
      >
        <div className="flex items-center gap-3 text-muted">
          <span>Escrow status is unavailable right now.</span>
          <span className="font-mono text-ink">Reference: {correlationId}</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1 font-medium text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </aside>
    );
  }

  const currentState = data?.state || "held";
  const amount = data?.amount || 0;

  const currentStepIndex = ESCROW_STEPS.findIndex((s) => s.key === currentState);

  const getEscrowLabel = (state: PaymentState) => {
    switch (state) {
      case "authorized":
        return "authorized for deposit";
      case "held":
        return "held in escrow";
      case "tested":
        return "verified by test suite";
      case "approved":
        return "approved by client";
      case "released":
        return "released to freelancer";
      default:
        return "in escrow";
    }
  };

  return (
    <aside
      aria-label="Escrow Protection Status"
      className="w-full bg-surface border-b border-line px-6 py-2.5 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-money-text">
          {formatCurrencyINR(amount)}
        </span>
        <span className="text-xs font-medium text-muted">
          {getEscrowLabel(currentState)}
        </span>
      </div>

      <nav aria-label="Escrow verification gate" className="flex items-center">
        <ol className="flex items-center gap-1 sm:gap-2">
          {ESCROW_STEPS.map((step, idx) => {
            const isReached = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            let nodeStyles = "";
            if (isCurrent) {
              if (step.isMoneyTone) {
                nodeStyles = "bg-money-bg border-money text-money-text ring-2 ring-money ring-offset-1 ring-offset-surface font-semibold";
              } else {
                nodeStyles = "bg-selected border-primary text-primary ring-2 ring-primary ring-offset-1 ring-offset-surface font-semibold";
              }
            } else if (isReached) {
              if (step.isMoneyTone) {
                nodeStyles = "bg-money-bg border-money-border text-money-text";
              } else {
                nodeStyles = "bg-raised border-line text-ink";
              }
            } else {
              nodeStyles = "bg-surface border-line text-muted opacity-60";
            }

            return (
              <li key={step.key} className="flex items-center">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${nodeStyles}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline">{step.label}</span>
                </div>
                {idx < ESCROW_STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`h-0.5 w-3 sm:w-5 mx-0.5 transition-colors ${
                      idx < currentStepIndex ? "bg-line-strong" : "bg-line"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
};
