
import { faker } from "@faker-js/faker";
import { locationsApi } from "@/api/locations";

/**
 * Creates random locations using the locations API
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

    try {
      const response = await locationsApi.create({
        city,
        region,
        country,
        full_name
      });

      if (response.error) {
        console.error("Error creating location:", response.error);
      } else {
        locations.push(response.data);
        console.log(`Created location: ${full_name}`);
      }
    } catch (error) {
      console.error("Error creating location:", error);
    }
  }

  return locations;
};
