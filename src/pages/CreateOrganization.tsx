
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const CreateOrganization = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      website_url: "",
    },
  });

  const onSubmit = async (values: OrganizationFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create an organization");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert organization
      const { data: organizationData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: values.name,
          description: values.description || null,
          website_url: values.website_url || null,
        })
        .select()
        .single();
        
      if (orgError) throw orgError;
      
      // Make the creator an admin of the organization
      if (organizationData) {
        const { error: adminError } = await supabase
          .from("organization_admins")
          .insert({
            organization_id: organizationData.id,
            profile_id: user.id,
            role: "owner",
            is_approved: true,
          });
          
        if (adminError) throw adminError;
        
        // Also create a relationship between the user and the org
        const { error: relationshipError } = await supabase
          .from("org_relationships")
          .insert({
            organization_id: organizationData.id,
            profile_id: user.id,
            connection_type: "current",
          });
          
        if (relationshipError) throw relationshipError;

        toast.success("Organization created successfully!");
        navigate(`/organizations/${organizationData.id}`);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
            <CardDescription>
              Add your organization to the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter organization name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Brief description of the organization"
                          className="min-h-[100px]" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-chosen-blue hover:bg-chosen-navy"
                  >
                    {isSubmitting ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrganization;
