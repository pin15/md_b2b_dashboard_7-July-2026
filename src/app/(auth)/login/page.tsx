import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
      <LoginForm />
    </Suspense>
  );
}
