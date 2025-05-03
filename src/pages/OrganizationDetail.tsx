
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAddOrganizationRelationship, useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Link, Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationWithLocation } from "@/types";

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<"current" | "former" | "ally">("current");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Format location if available
      if (data.location) {
        const location = data.location;
        return {
          ...data,
          location: {
            ...location,
            formatted_location: [location.city, location.region, location.country]
              .filter(Boolean)
              .join(', ')
          }
        } as OrganizationWithLocation;
      }
      
      return data as OrganizationWithLocation;
    },
    enabled: !!id,
  });
  
  const { data: userRelationships = [] } = useUserOrganizationRelationships(user?.id);
  const addRelationship = useAddOrganizationRelationship();
  
  // Check if user already has a relationship with this organization
  const existingRelationship = userRelationships.find(
    (rel) => rel.organization?.id === id
  );

  const handleAddRelationship = async () => {
    if (!user?.id || !id) return;
    
    try {
      await addRelationship.mutateAsync({
        profile_id: user.id,
        organization_id: id,
        connection_type: connectionType,
        department: department || null,
        notes: notes || null
      });
      
      setIsConnectionDialogOpen(false);
      // Clear form
      setConnectionType("current");
      setDepartment("");
      setNotes("");
    } catch (error) {
      console.error("Error adding relationship:", error);
    }
  };

  const orgInitials = organization?.name
    ? organization.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : "??";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading organization details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Button variant="ghost" onClick={() => navigate("/organizations")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Organization not found</p>
            <Button 
              onClick={() => navigate("/organizations")} 
              className="mt-4 bg-chosen-blue"
            >
              View All Organizations
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/organizations")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={organization.logo_url || organization.logo_api_url || ""} />
                    <AvatarFallback className="bg-chosen-blue text-white text-3xl">
                      {orgInitials}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold text-center">{organization.name}</h1>
                  {organization.location && (
                    <p className="text-gray-500 text-center mt-1">
                      {organization.location.formatted_location}
                    </p>
                  )}
                  
                  {!existingRelationship && user && (
                    <Button 
                      className="mt-6 w-full bg-chosen-blue"
                      onClick={() => setIsConnectionDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Connect with this Organization
                    </Button>
                  )}
                  
                  {existingRelationship && (
                    <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200 w-full">
                      <p className="text-green-800 text-sm font-medium flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" />
                        You're connected to this organization
                      </p>
                      <p className="text-green-700 text-xs mt-1">
                        {existingRelationship.connection_type === 'current' && 'Current member'}
                        {existingRelationship.connection_type === 'former' && 'Former member'}
                        {existingRelationship.connection_type === 'ally' && 'Allied organization'}
                      </p>
                      <Button 
                        className="mt-3 w-full" 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate('/organizations/manage')}
                      >
                        Manage Connection
                      </Button>
                    </div>
                  )}
                  
                  {organization.website_url && (
                    <a 
                      href={organization.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center text-chosen-blue hover:text-chosen-navy"
                    >
                      <Link className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>About {organization.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {organization.description ? (
                  <p className="whitespace-pre-wrap">{organization.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </CardContent>
            </Card>
            
            {/* We could add more sections here like related organizations, members, etc. */}
          </div>
        </div>
      </div>
      
      {/* Connection Dialog */}
      <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with {organization.name}</DialogTitle>
            <DialogDescription>
              Establish your relationship with this organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select 
                value={connectionType} 
                onValueChange={(value: "current" | "former" | "ally") => setConnectionType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Member</SelectItem>
                  <SelectItem value="former">Former Member</SelectItem>
                  <SelectItem value="ally">Allied Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input 
                id="department" 
                placeholder="e.g., Marketing, Engineering" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional details about your connection"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-chosen-blue" 
              onClick={handleAddRelationship}
              disabled={addRelationship.isPending}
            >
              {addRelationship.isPending ? "Saving..." : "Save Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OrganizationDetail;
