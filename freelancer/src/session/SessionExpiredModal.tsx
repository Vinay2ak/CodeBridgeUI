import React, { useEffect, useRef } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import { env } from "../lib/env";

export const SessionExpiredModal: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignInAgain = () => {
    window.location.assign(env.signinUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div
        ref={modalRef}
        className="max-w-md w-full rounded-xl border border-line bg-raised p-6 shadow-md text-center"
      >
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-warning-bg border border-warning-border text-warning mb-4">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="session-expired-title" className="text-lg font-bold mb-2 text-ink">
          Session Expired
        </h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Your security session has ended. To continue working on this task and save your workspace progress, please sign in again.
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleSignInAgain}
          className="inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 text-sm font-medium transition-colors bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span>Sign in again</span>
        </button>
      </div>
    </div>
  );
};

