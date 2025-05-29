
import { createRepository } from "./repositoryFactory";

/**
 * Example showing how to create and use repositories with client injection
 */
export async function createExampleRepository(client: any) {
  const profileRepository = createRepository<any>('profiles', client);
  
  // Use the repository
  const profiles = await profileRepository.select('*').execute();
  return profiles;
}
