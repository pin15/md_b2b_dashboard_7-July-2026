import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4">
      <div className="max-w-md rounded-xl bg-brand-surface p-8 text-center shadow-card">
        <ShieldAlert className="mx-auto h-10 w-10 text-severity-amber" />
        <h1 className="mt-4 text-xl font-semibold text-brand-text">
          No employer access
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          This dashboard is for HR &amp; leadership of a member organization. Your
          account isn&apos;t an employer/leadership member, or your session needs
          to be re-established.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
