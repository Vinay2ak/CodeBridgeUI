import React from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { sessionStore } from "./session";

export const SuspendedScreen: React.FC = () => {
  const handleSignOut = () => {
    sessionStore.logout();
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-line bg-surface p-6 shadow-sm text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-danger-bg border border-danger-border text-danger mb-4">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold mb-2">Account Suspended</h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Your freelancer account has been suspended by an administrator. You cannot access active workspaces or perform submissions at this time.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 text-sm font-medium transition-colors bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

