
import React, { useState } from 'react';
import { Helmet } from 'react-helmet'; // Now properly imported
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HubGrid from '@/components/hubs/HubGrid';
import AdminHubForm from '@/components/admin/hubs/AdminHubForm';
import { useToast } from "@/hooks/use-toast";

const AdminHubs: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Manage Hubs | Admin | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Hubs</h1>
            <p className="text-muted-foreground">
              Create, edit and manage hubs on the platform
            </p>
          </div>
          
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            Create New Hub
          </Button>
        </div>
        
        {isCreating && (
          <div className="mb-8 p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-bold mb-4">Create New Hub</h2>
            <AdminHubForm 
              onSuccess={() => {
                setIsCreating(false);
                toast({
                  title: "Hub created",
                  description: "The hub was created successfully."
                });
              }} 
              onCancel={() => setIsCreating(false)} 
            />
          </div>
        )}
        
        <HubGrid isAdmin={true} />
      </div>
    </>
  );
};

export default AdminHubs;
