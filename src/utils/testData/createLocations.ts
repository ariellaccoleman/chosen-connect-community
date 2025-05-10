
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

/**
 * Creates random locations in the database
 * @param count Number of locations to create
 * @returns Array of created locations
 */
export const createLocations = async (count: number) => {
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
