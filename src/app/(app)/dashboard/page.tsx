import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { DashboardView } from "@/components/dashboard/DashboardView";

// useSearchParams (in the filter/tab hooks) requires a Suspense boundary.
export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <DashboardView />
    </Suspense>
  );
}
