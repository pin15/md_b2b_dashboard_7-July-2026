import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { MfaForm } from "@/components/auth/MfaForm";

export default function MfaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
      <MfaForm />
    </Suspense>
  );
}
