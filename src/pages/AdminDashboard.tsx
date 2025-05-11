
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4 font-heading">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Manage users, organizations, and other administrative tasks.
      </p>
      
      <nav className="space-y-2">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link to="/admin/tags" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            Manage Tags
          </Link>
        </Button>
      </nav>
    </div>
  );
};

export default AdminDashboard;
