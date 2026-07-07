"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Card, Button } from "@/components/ui/primitives";
import { HAS_SUPABASE } from "@/lib/env";
import { hasEmployerAccess } from "@/lib/auth/claims";
import { isAal2, buildMfaRedirectUrl } from "@/lib/auth/mfa";
import { safeRedirectPath } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectPath = safeRedirectPath(params.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock/demo mode (no Supabase configured) — let the reviewer into the demo.
  if (!HAS_SUPABASE) {
    return (
      <Card>
        <div className="space-y-4 text-center">
          <Lock className="mx-auto h-8 w-8 text-brand-muted" />
          <h2 className="text-lg font-semibold">Demo mode</h2>
          <p className="text-sm text-brand-muted">
            Supabase Auth is not configured, so login is bypassed. The dashboard
            renders against mock GraphQL data. Set{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> /{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable real login + MFA.
          </p>
          <Button className="w-full" onClick={() => router.replace(redirectPath)}>
            Enter demo dashboard
          </Button>
        </div>
      </Card>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error(signInError.message);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Must be an employer member of an org to use this app.
      if (!hasEmployerAccess(user)) {
        await supabase.auth.signOut();
        throw new Error(
          "This account is not an employer/leadership member. Use the employee app instead.",
        );
      }

      // Mandatory MFA: AAL2 or go enroll/verify a TOTP factor.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (isAal2(aal)) {
        router.replace(redirectPath);
        return;
      }
      router.replace(buildMfaRedirectUrl(redirectPath));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Sign in</h2>
          <p className="mt-1 text-sm text-brand-muted">
            HR &amp; leadership access · MFA required.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-severity-red/30 bg-severity-red/10 px-3 py-2 text-sm text-severity-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-brand-text">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-lg border border-brand-border bg-brand-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-brand-text">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-lg border border-brand-border bg-brand-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </Card>
  );
}
