
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationEditSkeleton() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-2/3 mx-auto" />
      </div>
    </div>
  );
}
