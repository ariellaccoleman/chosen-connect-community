
import { faker } from '@faker-js/faker';

/**
 * MockDataGenerator
 * 
 * Utility to generate mock data for different entity types
 * to be used in tests. Provides consistent and realistic
 * test data without having to manually define it.
 */
export class MockDataGenerator<T = any> {
  private entityType: string;
  private customGenerators: Record<string, () => any>;
  
  /**
   * Create a new mock data generator
   * 
   * @param entityType Type of entity to generate (used for defaults)
   * @param customGenerators Custom field generators
   */
  constructor(
    entityType: string,
    customGenerators: Record<string, () => any> = {}
  ) {
    this.entityType = entityType;
    this.customGenerators = customGenerators;
  }
  
  /**
   * Generate a single mock entity
   * 
   * @param overrides Values to override in the generated entity
   * @returns Generated entity
   */
  generate(overrides: Partial<T> = {}): T {
    const entity = this.generateBase();
    return { ...entity, ...overrides } as T;
  }
  
  /**
   * Generate multiple mock entities
   * 
   * @param count Number of entities to generate
   * @param overrides Values to override in all generated entities
   * @returns Array of generated entities
   */
  generateMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.generate(overrides));
  }
  
  /**
   * Generate the base entity with default fields
   */
  private generateBase(): Record<string, any> {
    const base: Record<string, any> = {
      id: faker.string.uuid(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    };
    
    // Apply entity type specific defaults
    switch (this.entityType) {
      case 'profile':
        return {
          ...base,
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: faker.internet.email(),
          avatar_url: faker.image.avatar(),
          bio: faker.lorem.paragraph(),
          headline: faker.person.jobTitle(),
        };
        
      case 'organization':
        return {
          ...base,
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          website_url: faker.internet.url(),
          logo_url: faker.image.url(),
        };
        
      case 'event':
        const startDate = faker.date.future();
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + faker.number.int({ min: 1, max: 8 }));
        
        return {
          ...base,
          title: faker.company.catchPhrase(),
          description: faker.lorem.paragraphs(2),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          is_virtual: faker.datatype.boolean(),
          is_paid: faker.datatype.boolean(),
          price: faker.datatype.boolean() ? faker.number.float({ min: 5, max: 500 }) : null,
        };
        
      case 'tag':
        return {
          ...base,
          name: faker.helpers.uniqueArray(faker.word.sample, 2).join('-'),
          description: faker.lorem.sentence(),
        };
        
      default:
        // For unknown entity types, just return the base
        return base;
    }
  }
  
  /**
   * Apply a custom generator to a field
   */
  withGenerator(field: string, generator: () => any): MockDataGenerator<T> {
    this.customGenerators[field] = generator;
    return this;
  }
  
  /**
   * Generate related entities that would be returned by a join
   * 
   * @param relationConfig Configuration for generating related entities
   * @returns A function that generates related entities
   */
  withRelations<R>(
    relationConfig: {
      name: string;
      type: string;
      count?: number;
      generator?: MockDataGenerator<R>;
    }
  ): MockDataGenerator<T & { [key: string]: R | R[] }> {
    const relGenerator = relationConfig.generator || 
      new MockDataGenerator<R>(relationConfig.type);
    
    // Add a custom generator for the relation
    this.customGenerators[relationConfig.name] = () => {
      if (relationConfig.count !== undefined) {
        return relGenerator.generateMany(relationConfig.count);
      } else {
        return relGenerator.generate();
      }
    };
    
    return this as unknown as MockDataGenerator<T & { [key: string]: R | R[] }>;
  }
}

/**
 * Create a mock data generator for a specific entity type
 */
export function createMockDataGenerator<T>(
  entityType: string, 
  customGenerators: Record<string, () => any> = {}
): MockDataGenerator<T> {
  return new MockDataGenerator<T>(entityType, customGenerators);
}
