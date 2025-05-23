
import { OrganizationAdminWithDetails } from "@/types";
import { CardContent } from "@/components/ui/card";
import AdminListItem from "./AdminListItem";
import { usePendingOrganizationAdmins, useUpdateAdminRequest, useDeleteAdminRequest } from "@/hooks/organizations";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminRequestDetails from "@/components/admin/AdminRequestDetails";

interface AdminsCardContentProps {
  admins: OrganizationAdminWithDetails[];
  organizationId: string;
  isOrgOwner: boolean;
}

const AdminsCardContent = ({ admins, organizationId, isOrgOwner }: AdminsCardContentProps) => {
  const { data: pendingRequests = [], isLoading } = usePendingOrganizationAdmins(organizationId);
  const [selectedRequest, setSelectedRequest] = useState<OrganizationAdminWithDetails | null>(null);
  
  const updateRequest = useUpdateAdminRequest();
  const deleteRequest = useDeleteAdminRequest();

  const handleApprove = async (requestId: string) => {
    await updateRequest.mutateAsync({
      requestId,
      updates: {
        is_approved: true,
      }
    } as any);
  };

  const handleReject = async (requestId: string) => {
    await deleteRequest.mutateAsync(requestId as any);
  };

  return (
    <CardContent>
      {/* Current Admins */}
      <div className="space-y-4">
        {admins.map((admin) => (
          <AdminListItem key={admin.id} admin={admin} />
        ))}
      </div>
      
      {/* Pending Admin Requests - only visible to organization owners */}
      {isOrgOwner && pendingRequests.length > 0 && (
        <>
          <Separator className="my-6" />
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold">Pending Admin Requests</h4>
            <p className="text-xs text-muted-foreground">Review and respond to admin access requests</p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.profile?.avatarUrl || ""} alt={request.profile?.fullName || ""} />
                        <AvatarFallback>
                          {request.profile?.firstName?.[0] || ""}
                          {request.profile?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.profile?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{request.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.createdAt ? format(new Date(request.createdAt), "PPP") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {selectedRequest && (
            <AdminRequestDetails
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </>
      )}
    </CardContent>
  );
};

export default AdminsCardContent;
