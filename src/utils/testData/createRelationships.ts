
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

/**
 * Creates relationships between users and organizations
 * @param users Array of users
 * @param organizations Array of organizations
 * @param ownedCount Number of organizations to be owned by users
 * @param relatedCount Number of organizations to be related to users
 */
export const createUserOrganizationRelationships = async (
  users: any[], 
  organizations: any[], 
  ownedCount: number, 
  relatedCount: number
) => {
  console.log("Creating organization relationships...");
  
  // First set of organizations: Owned by users (with admin relationship)
  for (let i = 0; i < ownedCount && i < users.length && i < organizations.length; i++) {
    const user = users[i];
    const organization = organizations[i];
    
    // Create admin relationship
    const { error: adminError } = await supabase
      .from('organization_admins')
      .insert({
        organization_id: organization.id,
        profile_id: user.id,
        role: 'owner',
        is_approved: true,
      });
    
    if (adminError) {
      console.error("Error creating admin relationship:", adminError.message);
    } else {
      console.log(`Made ${user.email} an admin of ${organization.name}`);
    }
    
    // Create org relationship
    const { error: relationshipError } = await supabase
      .from('org_relationships')
      .insert({
        organization_id: organization.id,
        profile_id: user.id,
        connection_type: 'current',
        department: faker.person.jobArea()
      });
    
    if (relationshipError) {
      console.error("Error creating org relationship:", relationshipError.message);
    } else {
      console.log(`Created current relationship between ${user.email} and ${organization.name}`);
    }
  }
  
  // Second set of organizations: Related to users but not owned
  const connectionTypes: ("current" | "former" | "connected_insider")[] = ["current", "former", "connected_insider"];
  
  for (let i = ownedCount; i < ownedCount + relatedCount && i < organizations.length; i++) {
    // Use a different user for each relationship to spread the connections
    const userIndex = i % users.length;
    const user = users[userIndex];
    const organization = organizations[i];
    const connectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
    
    const { error } = await supabase
      .from('org_relationships')
      .insert({
        organization_id: organization.id,
        profile_id: user.id,
        connection_type: connectionType,
        department: faker.person.jobArea(),
        notes: faker.company.catchPhrase()
      });
    
    if (error) {
      console.error("Error creating org relationship:", error.message);
    } else {
      console.log(`Created ${connectionType} relationship between ${user.email} and ${organization.name}`);
    }
  }
  
  // Third set of organizations: No relationships or administrators
  console.log(`Left ${organizations.length - ownedCount - relatedCount} organizations with no relationships`);
};
