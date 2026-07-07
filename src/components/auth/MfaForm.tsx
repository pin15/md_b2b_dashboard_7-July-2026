"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Card, Button } from "@/components/ui/primitives";
import { LOGIN_PAGE } from "@/lib/auth/mfa";
import { safeRedirectPath } from "@/lib/utils";

type Mode = "loading" | "enroll" | "verify" | "done";

/**
 * TOTP MFA — reuses Supabase Auth MFA (same mechanism md-admin uses). Handles
 * BOTH first-login enrollment (no factor yet → enroll, show QR) and verification
 * (factor exists → challenge+verify). On success the session becomes AAL2.
 * Modelled on md-admin `AdminMfaChallengeForm`, extended with the enroll path.
 */
export function MfaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectPath = safeRedirectPath(params.get("redirect"));

  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(
          `${LOGIN_PAGE}?redirect=${encodeURIComponent(redirectPath)}`,
        );
        return;
      }

      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        router.replace(redirectPath);
        return;
      }

      const { data: factors, error: fErr } =
        await supabase.auth.mfa.listFactors();
      if (fErr) {
        if (!cancelled) setError(fErr.message);
        return;
      }

      const verified = factors.totp.find((f) => f.status === "verified");
      if (verified) {
        if (!cancelled) {
          setFactorId(verified.id);
          setMode("verify");
        }
        return;
      }

      // First login, no factor → enroll one now (MFA is mandatory).
      const { data: enroll, error: eErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (eErr) {
        if (!cancelled) setError(eErr.message);
        return;
      }
      if (!cancelled) {
        setFactorId(enroll.id);
        setQr(enroll.totp.qr_code);
        setSecret(enroll.totp.secret);
        setMode("enroll");
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [router, redirectPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    try {
      const normalized = code.replace(/\D/g, "").slice(0, 6);
      if (normalized.length !== 6) {
        throw new Error("Enter the 6-digit code from your authenticator app.");
      }
      const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: normalized,
      });
      if (vErr) throw new Error(vErr.message);

      toast.success("Two-factor verified");
      setMode("done");
      router.replace(redirectPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
      setBusy(false);
    }
  }

  if (mode === "loading" || mode === "done") {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-brand-muted" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
            <ShieldCheck className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
          </div>
          <h2 className="text-lg font-semibold text-brand-text">
            {mode === "enroll" ? "Set up two-factor" : "Two-factor verification"}
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            {mode === "enroll"
              ? "Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit code."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        {mode === "enroll" && qr && (
          <div className="flex flex-col items-center gap-2">
            {qr.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="TOTP QR code" className="h-44 w-44" />
            ) : (
              <div
                className="h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
                // Supabase returns an SVG markup string for the QR code.
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            )}
            {secret && (
              <p className="text-xs text-brand-muted">
                Or enter this key manually:{" "}
                <code className="rounded bg-brand-bg px-1 py-0.5">{secret}</code>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-severity-red/30 bg-severity-red/10 px-3 py-2 text-sm text-severity-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-12 w-full rounded-lg border border-brand-border bg-brand-surface text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={busy || code.length !== 6}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify & continue"
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
