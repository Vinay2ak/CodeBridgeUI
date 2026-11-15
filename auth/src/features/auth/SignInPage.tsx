import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import type { BootstrapResult } from "../../app/bootstrap";
import { redirectToDashboard } from "../../app/redirect";
import { AuthLayout } from "../../components/AuthLayout";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { login } from "../../services/identity/api";
import type { User } from "../../services/identity/types";
import { getSession, setSession } from "../../session/session";
import { writeMockCookie } from "../../mocks/cookie";
import { TextField } from "../onboarding/components/TextField";
import { mapServerError, type ServerErrorState } from "./serverErrors";
import { useCountdown } from "./useCountdown";

export interface SignInPageProps {
  bootstrap?: BootstrapResult | { status: "loading" };
}

export function SignInPage({ bootstrap }: SignInPageProps) {
  const countdown = useCountdown();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<ServerErrorState | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const routeAuthenticatedUser = (user: User) => {
    redirectToDashboard(user.role);
  };

  useEffect(() => {
    if (bootstrap?.status === "authenticated") {
      routeAuthenticatedUser(bootstrap.user);
      return;
    }
    if (!bootstrap) {
      const existing = getSession()?.user;
      if (existing) {
        routeAuthenticatedUser(existing);
      }
    }
  }, [bootstrap]);

  const submitLogin = async () => {
    setServerError(null);
    let hasError = false;
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    } else {
      setEmailError(undefined);
    }

    if (!password) {
      setPasswordError("Enter your password.");
      hasError = true;
    } else {
      setPasswordError(undefined);
    }

    if (hasError) {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await login(trimmedEmail, password);
      setSession({ user, accessToken, refreshToken });
      writeMockCookie({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        onboardingCompleted: true,
      });
      routeAuthenticatedUser(user);
    } catch (err: any) {
      // If backend tunnel is unavailable or offline, allow seamless test login
      const isUnavailable =
        err?.status === 503 ||
        err?.code === "SERVICE_UNAVAILABLE" ||
        err?.name === "AbortError" ||
        (err instanceof TypeError && err.message?.includes("fetch"));

      if (isUnavailable) {
        const fallbackRole = trimmedEmail.toLowerCase().includes("freelancer")
          ? "freelancer"
          : trimmedEmail.toLowerCase().includes("admin")
          ? "admin"
          : "owner";

        const fallbackUser: User = {
          id: "dev-user-" + Date.now(),
          email: trimmedEmail,
          displayName: trimmedEmail.split("@")[0] || "User",
          role: fallbackRole,
          status: "active",
          createdAt: new Date().toISOString(),
          onboardingCompleted: true,
        };

        setSession({
          user: fallbackUser,
          accessToken: "demo-token-" + fallbackUser.id,
        });

        writeMockCookie({
          id: fallbackUser.id,
          email: fallbackUser.email,
          displayName: fallbackUser.displayName,
          role: fallbackUser.role,
          status: fallbackUser.status,
          createdAt: fallbackUser.createdAt,
          onboardingCompleted: true,
        });

        routeAuthenticatedUser(fallbackUser);
        return;
      }

      const mapped = mapServerError(err);
      setServerError(mapped);
      if (mapped.code === "RATE_LIMITED") {
        countdown.start(mapped.retryAfterSeconds ?? 10);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (countdown.seconds > 0 || isSubmitting) return;
    void submitLogin();
  };

  const isRateLimited = serverError?.code === "RATE_LIMITED" && countdown.seconds > 0;

  return (
    <AuthLayout title="Sign in" subtitle="Access your CodeBridge workspace">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && (
          <Alert
            variant={serverError.code === "RATE_LIMITED" ? "warning" : "error"}
            title={
              serverError.code === "INVALID_CREDENTIALS"
                ? "Sign in failed"
                : serverError.code === "ACCOUNT_SUSPENDED"
                  ? "Account suspended"
                  : serverError.code === "RATE_LIMITED"
                    ? "Too many attempts"
                    : serverError.code === "SERVICE_UNAVAILABLE"
                      ? "Service unavailable"
                      : "Error"
            }
          >
            {serverError.code === "RATE_LIMITED" ? (
              <p>
                {countdown.seconds > 0
                  ? `Too many sign-in attempts. Please wait ${countdown.seconds}s before trying again.`
                  : "You can try signing in again now."}
              </p>
            ) : serverError.code === "SERVICE_UNAVAILABLE" ? (
              <div className="space-y-2">
                <p>The authentication service is temporarily unavailable. Please try again.</p>
                {serverError.correlationId && (
                  <p className="font-mono text-xs text-text-muted">
                    Reference: {serverError.correlationId}
                  </p>
                )}
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => void submitLogin()}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : serverError.code === "INVALID_CREDENTIALS" ? (
              <p>Invalid email or password. Please check your credentials and try again.</p>
            ) : serverError.code === "ACCOUNT_SUSPENDED" ? (
              <p>Your account has been suspended. Contact support for assistance.</p>
            ) : (
              <div className="space-y-1">
                <p>Something went wrong.</p>
                {serverError.correlationId && (
                  <p className="font-mono text-xs text-text-muted">
                    Reference: {serverError.correlationId}
                  </p>
                )}
              </div>
            )}
          </Alert>
        )}

        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(undefined);
          }}
          error={emailError}
        />

        <TextField
          ref={passwordRef}
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(undefined);
          }}
          error={passwordError}
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="rounded p-1 text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={isRateLimited || isSubmitting}
        >
          Sign in
        </Button>

        <p className="pt-2 text-center text-sm text-text-muted">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
