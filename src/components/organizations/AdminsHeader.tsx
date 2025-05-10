
import { ShieldCheck } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminsHeader = () => {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-lg">Organization Admins</CardTitle>
      </div>
      <CardDescription>People who manage this organization</CardDescription>
    </CardHeader>
  );
};

export default AdminsHeader;
