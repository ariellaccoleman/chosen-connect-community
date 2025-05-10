import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationAdmins, useUpdateAdminRequest, useDeleteAdminRequest } from "@/hooks/useOrganizationAdmins";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Search, ShieldCheck, Trash } from "lucide-react";
import { OrganizationAdminWithDetails } from "@/types";
import { format } from "date-fns";
import AdminRequestDetails from "@/components/admin/AdminRequestDetails";
import { SetAdminRole } from "@/components/admin/SetAdminRole";
import LocationImporter from "@/components/admin/LocationImporter";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"pending" | "approved" | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<OrganizationAdminWithDetails | null>(null);
  
  const { data: admins = [], isLoading } = useOrganizationAdmins({ status: selectedTab });
  const updateRequest = useUpdateAdminRequest();
  const deleteRequest = useDeleteAdminRequest();
  
  // Filter admins based on search query
  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchQuery.toLowerCase();
    return (
      admin.profile?.full_name?.toLowerCase().includes(searchLower) ||
      admin.organization?.name.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    // Check if the user is a site admin, otherwise redirect
    if (!loading && user) {
      if (user.user_metadata?.role !== "admin") {
        navigate("/dashboard");
      }
    } else if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleApproveRequest = async (requestId: string) => {
    await updateRequest.mutateAsync({ 
      requestId, 
      updates: { is_approved: true } 
    });
    setSelectedRequest(null);
  };

  const handleRejectRequest = async (requestId: string) => {
    await deleteRequest.mutateAsync(requestId);
    setSelectedRequest(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage organization access requests</p>
          </div>
        </div>

        {/* Admin Tools Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>Special administrative functions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <SetAdminRole />
            </div>
            <div>
              <LocationImporter />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Organization Admin Requests</CardTitle>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search organizations or users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>Review and manage requests for organization admin access</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="pending" 
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as "pending" | "approved" | "all")}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              
              <TabsContent value={selectedTab} className="mt-0">
                {isLoading ? (
                  <div className="text-center py-8">Loading requests...</div>
                ) : filteredAdmins.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requester</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Requested Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmins.map((admin) => (
                          <TableRow key={admin.id} onClick={() => setSelectedRequest(admin)} className="cursor-pointer">
                            <TableCell>
                              <div className="font-medium">{admin.profile?.full_name}</div>
                              <div className="text-xs text-muted-foreground">{admin.profile?.email}</div>
                            </TableCell>
                            <TableCell>{admin.organization?.name}</TableCell>
                            <TableCell className="capitalize">{admin.role || "editor"}</TableCell>
                            <TableCell>
                              <Badge variant={admin.is_approved ? "success" : "secondary"}>
                                {admin.is_approved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {admin.created_at ? format(new Date(admin.created_at), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!admin.is_approved && (
                                  <Button 
                                    size="icon" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveRequest(admin.id);
                                    }}
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4 text-green-500" />
                                  </Button>
                                )}
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectRequest(admin.id);
                                  }}
                                  title={admin.is_approved ? "Remove" : "Reject"}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No requests found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {selectedRequest && (
        <AdminRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
