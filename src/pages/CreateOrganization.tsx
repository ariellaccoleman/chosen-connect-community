
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateOrganizationWithRelationships } from "@/hooks/organizations";
import { logger } from "@/utils/logger";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/common/ErrorBoundary";

const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

/**
 * Component for creating a new organization
 * Uses a simpler authentication approach similar to CreateEvent
 */
const CreateOrganization = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const createOrganization = useCreateOrganizationWithRelationships();
  const [formError, setFormError] = useState<Error | null>(null);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      website_url: "",
    },
  });
  
  // Log authentication state for debugging
  logger.info("CreateOrganization page rendering", { 
    userAuthenticated: !!user, 
    loading,
    hasFormError: !!formError
  });
  
  // If still loading auth state, show loading state
  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/4 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }
  
  // If not authenticated, redirect to auth page
  if (!user) {
    logger.warn("Unauthenticated user attempted to access CreateOrganization page");
    return <Navigate to="/auth" state={{ from: '/organizations/new' }} replace />;
  }

  const onSubmit = async (values: OrganizationFormValues) => {
    try {
      // Get current authentication state at submission time
      const currentUser = user;
      
      // Double-check authentication at submission time
      if (!currentUser) {
        logger.error("Form submission attempted without authentication");
        return;
      }
      
      logger.info("Creating organization", values);
      const result = await createOrganization.mutateAsync({
        name: values.name,
        description: values.description,
        website_url: values.website_url,
        userId: currentUser.id
      });

      // If successful and we have an organization ID from the result
      if (result && typeof result === 'string') {
        navigate(`/organizations/${result}`);
      }
    } catch (error) {
      logger.error("Error creating organization", error);
      setFormError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <Layout>
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
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-6"
                role="form"
                data-testid="org-create-form"
              >
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
                
                {formError && (
                  <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-600">
                    Error: {formError.message}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createOrganization.isPending}
                    className="bg-chosen-blue hover:bg-chosen-navy"
                  >
                    {createOrganization.isPending ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateOrganization;

