
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

/**
 * Creates random organizations in the database
 * @param count Number of organizations to create
 * @param locations Array of locations to associate with organizations
 * @returns Array of created organizations
 */
export const createOrganizations = async (count: number, locations: any[]) => {
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
