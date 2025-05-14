
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationWithLocation } from "@/types";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { useAuth } from "@/hooks/useAuth";
import LogoUpload from "@/components/organizations/LogoUpload";
import OrganizationTags from "@/components/organizations/OrganizationTags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganizationQueries";

// Define form schema
const organizationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  website_url: z.string().url({ message: "Please enter a valid URL" }).optional().nullable(),
  logo_url: z.string().optional().nullable(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const OrganizationEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  
  // Redirect to organizations page if id is undefined or invalid
  useEffect(() => {
    if (!id || id === "undefined") {
      toast({
        title: "Invalid Organization",
        description: "Please select a valid organization to edit",
        variant: "destructive",
      });
      navigate("/organizations");
    }
  }, [id, navigate, toast]);
  
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, id);
  const { data: organization, isLoading: loading, error } = useOrganization(id);
  
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      website_url: "",
      logo_url: "",
    },
  });

  // Set form values when organization data is loaded
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description || "",
        website_url: organization.website_url || "",
        logo_url: organization.logo_url || "",
      });
    }
  }, [organization, form]);

  // Check if user is admin and redirect if not
  useEffect(() => {
    // Only check admin status if we have a valid organization ID and loading is complete
    if (!loading && !isOrgAdmin && id && id !== "undefined") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this organization",
        variant: "destructive",
      });
      navigate(`/organizations/${id}`);
    }
  }, [isOrgAdmin, loading, navigate, id, toast]);

  const handleLogoChange = (url: string) => {
    form.setValue("logo_url", url, { shouldValidate: true });
  };

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!id || id === "undefined") {
      toast({
        title: "Error",
        description: "Invalid organization ID",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          description: data.description,
          website_url: data.website_url,
          logo_url: data.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      navigate(`/organizations/${id}`);
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  // Skip rendering the form if ID is invalid - early return
  if (!id || id === "undefined") {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Redirecting to organizations page...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Loading organization...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Error loading organization: {error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Organization not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(`/organizations/${id}`)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organization
        </Button>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Edit Organization</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="mb-6">
                    <FormLabel className="block mb-2">Organization Logo</FormLabel>
                    <LogoUpload
                      logoUrl={form.watch("logo_url") || ""}
                      organizationName={form.watch("name")}
                      onLogoChange={handleLogoChange}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                            value={field.value || ""}
                            rows={4} 
                            placeholder="Describe the organization"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about what the organization does.
                        </FormDescription>
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
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            type="url" 
                            placeholder="https://example.org" 
                          />
                        </FormControl>
                        <FormDescription>
                          The organization's website address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location is displayed but not editable in this version */}
                  {organization.location && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.location.formatted_location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Location editing is not available in this version.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="ml-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="tags">
              {id && (
                <OrganizationTags
                  organizationId={id}
                  isAdmin={isOrgAdmin}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default OrganizationEdit;
