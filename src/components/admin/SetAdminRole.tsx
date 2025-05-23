
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Valid site admin roles
const VALID_SITE_ADMIN_ROLES = [
  { value: 'admin', label: 'Site Admin' }
];

export const SetAdminRole = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetAdmin = async () => {
    if (!user || user.user_metadata?.role !== "admin") {
      toast.error("You must be a site admin to perform this action");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("set_admin_role", {
        body: { email, role }
      });

      if (error) {
        console.error("Error invoking function:", error);
        toast.error(`Failed to set admin role: ${error.message}`);
        return;
      }

      toast.success(data.message || `Successfully set ${email} as ${role}`);
      
      // Log the full response to help with debugging
      console.log("Set admin response:", data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">Set Site Admin Role</h3>
      <p className="text-sm text-muted-foreground">
        Grant site-wide administrative privileges to a user. This is different from organization admin roles.
      </p>
      
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select 
            value={role} 
            onValueChange={setRole}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {VALID_SITE_ADMIN_ROLES.map(roleOption => (
                <SelectItem key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Note: This assigns site-wide admin privileges, not organization-specific roles
          </p>
        </div>

        <Button 
          onClick={handleSetAdmin}
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? "Processing..." : "Set as Site Admin"}
        </Button>
      </div>
    </div>
  );
};
