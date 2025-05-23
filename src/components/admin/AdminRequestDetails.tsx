
import { OrganizationAdminWithDetails } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, ExternalLink, Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUpdateAdminRequest } from "@/hooks/organizations";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AdminRequestDetailsProps {
  request: OrganizationAdminWithDetails;
  onClose: () => void;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

const AdminRequestDetails = ({
  request,
  onClose,
  onApprove,
  onReject
}: AdminRequestDetailsProps) => {
  const [selectedRole, setSelectedRole] = useState(request.role || "editor");
  const updateRequest = useUpdateAdminRequest();
  
  const handleApproveWithRole = async () => {
    await updateRequest.mutateAsync({
      requestId: request.id,
      updates: {
        is_approved: true,
        role: selectedRole
      }
    } as any);
    onClose();
  };

  return (
    <Dialog open={!!request} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Request Details</DialogTitle>
          <DialogDescription>
            Review request for organization admin access
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* User info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.profile?.avatarUrl || ""} alt={request.profile?.fullName || ""} />
              <AvatarFallback>
                {request.profile?.firstName?.[0] || ""}
                {request.profile?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{request.profile?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Organization info placeholder (since we don't have organization data here) */}
          <div>
            <p className="text-sm font-medium mb-1">Organization</p>
            <div className="flex items-center justify-between">
              <p className="text-base">Organization: {request.organizationId}</p>
            </div>
          </div>
          
          {/* Request details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <Badge variant={request.isApproved ? "success" : "secondary"}>
                {request.isApproved ? "Approved" : "Pending"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Requested</p>
              <p className="text-sm">
                {request.createdAt ? format(new Date(request.createdAt), 'MMM d, yyyy') : '-'}
              </p>
            </div>
          </div>
          
          <Separator />
          
          {/* Role selection */}
          {!request.isApproved && (
            <div>
              <p className="text-sm font-medium mb-3">Select role to assign</p>
              <RadioGroup
                value={selectedRole}
                onValueChange={setSelectedRole}
                className="space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="editor" id="editor" />
                  <div className="grid gap-1">
                    <Label htmlFor="editor" className="font-medium">Editor</Label>
                    <p className="text-xs text-muted-foreground">
                      Can edit organization details
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <div className="grid gap-1">
                    <Label htmlFor="admin" className="font-medium">Admin</Label>
                    <p className="text-xs text-muted-foreground">
                      Full administrative access to the organization
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="owner" id="owner" />
                  <div className="grid gap-1">
                    <Label htmlFor="owner" className="font-medium">Owner</Label>
                    <p className="text-xs text-muted-foreground">
                      Highest level access, can manage other admins
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => onReject(request.id)}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            {request.isApproved ? "Remove Access" : "Reject"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            {!request.isApproved && (
              <Button
                onClick={handleApproveWithRole}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRequestDetails;
