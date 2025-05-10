
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

/**
 * Creates random test users with profiles in the database
 * @param count Number of users to create
 * @returns Array of created users
 */
export const createUsers = async (count: number) => {
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
