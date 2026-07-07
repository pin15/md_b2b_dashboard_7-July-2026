import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { ParticipationView } from "@/components/dashboard/ParticipationView";

export default function ParticipationPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ParticipationView />
    </Suspense>
  );
}
