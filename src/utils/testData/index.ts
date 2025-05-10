
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { createLocations } from "./createLocations";
import { createOrganizations } from "./createOrganizations";
import { createUsers } from "./createUsers";
import { createUserOrganizationRelationships } from "./createRelationships";

/**
 * Main function to generate all test data
 * @returns Object containing created users and organizations
 */
export const generateTestData = async () => {
  try {
    toast.info("Starting test data generation...");
    
    // Create locations first (reuse for both users and orgs)
    const locations = await createLocations(10);
    
    // Create users with profiles
    const users = await createUsers(15);
    
    // Update user profiles with location data
    for (const user of users) {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      await supabase
        .from('profiles')
        .update({ location_id: randomLocation.id })
        .eq('id', user.id);
    }
    
    // Create organizations
    const organizations = await createOrganizations(15, locations);
    
    // Create relationships between users and organizations
    // 5 orgs owned by users, 5 with other relationships, 5 with no relationships
    await createUserOrganizationRelationships(users, organizations, 5, 5);
    
    toast.success("Test data generation completed!");
    return { users, organizations };
  } catch (error) {
    console.error("Error generating test data:", error);
    toast.error("Error generating test data");
    return { users: [], organizations: [] };
  }
};
