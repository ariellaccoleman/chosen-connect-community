
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { ImportLocations } from "@/components/admin/ImportLocations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // For now, we don't have a proper admin role check, 
  // so we'll just assume the user is an admin if they're logged in
  // In a real app, you would check if the user has admin privileges
  const isAdmin = !!user;

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Locations Management</CardTitle>
              <CardDescription>
                Import and manage location data for your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportLocations />
            </CardContent>
          </Card>
          
          {/* Add more admin cards/sections here as needed */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
