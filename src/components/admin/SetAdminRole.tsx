
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const SetAdminRole = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("drcoleman@gmail.com");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetAdmin = async () => {
    if (!user || user.user_metadata?.role !== "admin") {
      toast.error("You must be an admin to perform this action");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("set_admin_role", {
        body: { email }
      });

      if (error) {
        console.error("Error invoking function:", error);
        toast.error(`Failed to set admin role: ${error.message}`);
        return;
      }

      toast.success(data.message || `Successfully set ${email} as admin`);
      
      // Log the full response to help with debugging
      console.log("Set admin response:", data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute automatically for drcoleman@gmail.com
  if (user && user.user_metadata?.role === "admin" && !isLoading) {
    setTimeout(() => {
      handleSetAdmin();
    }, 500);
  }

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">Set Admin Role</h3>
      <div className="flex gap-2">
        <Input 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
        />
        <Button 
          onClick={handleSetAdmin}
          disabled={isLoading || !email}
        >
          {isLoading ? "Processing..." : "Set as Admin"}
        </Button>
      </div>
    </div>
  );
};
