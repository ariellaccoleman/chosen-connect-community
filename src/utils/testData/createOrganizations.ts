
import { faker } from "@faker-js/faker";
import { organizationApi } from "@/api/organizations";

/**
 * Creates random organizations using the organization API
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
    const websiteUrl = faker.internet.url({ protocol: 'https' });
    const locationId = locations.length > 0 ? 
      locations[Math.floor(Math.random() * locations.length)].id : 
      null;

    try {
      const response = await organizationApi.create({
        name,
        description,
        websiteUrl,
        locationId
      });

      if (response.error) {
        console.error("Error creating organization:", response.error);
      } else {
        organizations.push(response.data);
        console.log(`Created organization: ${name}`);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  }

  return organizations;
};
