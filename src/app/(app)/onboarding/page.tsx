import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { OnboardingView } from "@/components/dashboard/OnboardingView";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <OnboardingView />
    </Suspense>
  );
}
