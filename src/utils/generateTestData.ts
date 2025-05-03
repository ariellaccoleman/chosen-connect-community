
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";
import { toast } from "@/components/ui/sonner";

// Helper function to create random users with profiles
const createUsers = async (count: number) => {
  const users = [];
  const userCredentials = [];

  console.log(`Creating ${count} test users...`);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const password = "Password123!"; // Simple password for test accounts
    
    userCredentials.push({ email, password });

    users.push({
      email,
      first_name: firstName,
      last_name: lastName,
      headline: faker.person.jobTitle(),
      bio: faker.person.bio(),
      avatar_url: faker.image.avatar(),
      linkedin_url: faker.internet.url({ protocol: 'https' }),
      twitter_url: `https://twitter.com/${faker.internet.userName({ firstName })}`,
      website_url: faker.internet.url({ protocol: 'https' }),
    });
  }

  // Create users with Supabase auth
  const createdUsers = [];
  for (const credentials of userCredentials) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: users.find(u => u.email === credentials.email)?.first_name,
            last_name: users.find(u => u.email === credentials.email)?.last_name,
          }
        }
      });
      
      if (error) {
        console.error("Error creating user:", error.message);
      } else {
        createdUsers.push({ 
          ...data.user, 
          ...users.find(u => u.email === credentials.email)
        });
        console.log(`Created user: ${credentials.email}`);
      }
    } catch (err) {
      console.error("Error in user creation:", err);
    }
  }

  return createdUsers;
};

// Helper function to create random locations
const createLocations = async (count: number) => {
  console.log(`Creating ${count} random locations...`);
  const locations = [];

  for (let i = 0; i < count; i++) {
    const city = faker.location.city();
    const region = faker.location.state();
    const country = faker.location.country();
    const full_name = `${city}, ${region}, ${country}`;

    const { data, error } = await supabase
      .from('locations')
      .insert({
        city,
        region,
        country,
        full_name
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating location:", error.message);
    } else {
      locations.push(data);
      console.log(`Created location: ${full_name}`);
    }
  }

  return locations;
};

// Helper function to create random organizations
const createOrganizations = async (count: number, locations: any[]) => {
  console.log(`Creating ${count} test organizations...`);
  const organizations = [];

  for (let i = 0; i < count; i++) {
    const name = faker.company.name();
    const description = faker.company.catchPhrase();
    const website_url = faker.internet.url({ protocol: 'https' });
    const location_id = locations.length > 0 ? 
      locations[Math.floor(Math.random() * locations.length)].id : 
      null;

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        description,
        website_url,
        location_id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating organization:", error.message);
    } else {
      organizations.push(data);
      console.log(`Created organization: ${name}`);
    }
  }

  return organizations;
};

// Helper function to create relationships between users and organizations
const createUserOrganizationRelationships = async (
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
  const connectionTypes: ("current" | "former" | "ally")[] = ["current", "former", "ally"];
  
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

// Main function to generate all test data
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
