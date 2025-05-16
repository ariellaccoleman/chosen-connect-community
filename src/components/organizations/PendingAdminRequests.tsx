
import { useState } from "react";
import { 
  usePendingOrganizationAdmins,
  useUpdateAdminRequest, 
  useDeleteAdminRequest
} from "@/hooks/useOrganizationAdmins";
import { OrganizationAdminWithDetails } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminRequestDetails from "@/components/admin/AdminRequestDetails";

interface PendingAdminRequestsProps {
  organizationId: string;
}

const PendingAdminRequests = ({ organizationId }: PendingAdminRequestsProps) => {
  const { data: pendingRequests = [], isLoading, isError } = usePendingOrganizationAdmins(organizationId);
  const [selectedRequest, setSelectedRequest] = useState<OrganizationAdminWithDetails | null>(null);
  
  const updateRequest = useUpdateAdminRequest();
  const deleteRequest = useDeleteAdminRequest();

  const handleApprove = async (requestId: string) => {
    await updateRequest.mutateAsync({
      requestId,
      updates: {
        is_approved: true,
      }
    });
  };

  const handleReject = async (requestId: string) => {
    await deleteRequest.mutateAsync(requestId);
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Admin Requests</CardTitle>
          <CardDescription>Loading pending requests...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Admin Requests</CardTitle>
          <CardDescription>Error loading pending requests</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Admin Requests</CardTitle>
          <CardDescription>No pending admin requests for this organization</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Admin Requests</CardTitle>
          <CardDescription>Review and respond to admin access requests</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <AvatarImage src={request.profile?.avatar_url || ""} alt={request.profile?.full_name || ""} />
                      <AvatarFallback>
                        {request.profile?.first_name?.[0] || ""}
                        {request.profile?.last_name?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{request.profile?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.created_at ? format(new Date(request.created_at), "PPP") : "-"}
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
        </CardContent>
      </Card>

      {selectedRequest && (
        <AdminRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  );
};

export default PendingAdminRequests;
