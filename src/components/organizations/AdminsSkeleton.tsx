
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const AdminsSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-60 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default AdminsSkeleton;
