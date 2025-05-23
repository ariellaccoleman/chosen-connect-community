
import { DataRepository } from '../repository/DataRepository';
import { createTestRepository } from './repositoryTestUtils';
import { MockDataGenerator } from './mockDataGenerator';

/**
 * Configuration for relationship testing
 */
export interface RelationshipConfig<T, R> {
  /**
   * Name of the relationship
   */
  name: string;
  
  /**
   * Foreign key field in the source entity
   */
  sourceField: keyof T;
  
  /**
   * Primary key field in the target entity (default: 'id')
   */
  targetField?: keyof R;
  
  /**
   * Whether the relationship is one-to-many (default: false)
   */
  isOneToMany?: boolean;
  
  /**
   * Whether the relationship is optional (default: false)
   */
  isOptional?: boolean;
  
  /**
   * Repository for the related entity
   */
  targetRepository: DataRepository<R>;
}

/**
 * RelationshipTester class for testing entity relationships
 */
export class RelationshipTester<T> {
  private sourceRepository: DataRepository<T>;
  private relationships: Array<RelationshipConfig<T, any>> = [];
  
  constructor(sourceRepository: DataRepository<T>) {
    this.sourceRepository = sourceRepository;
  }
  
  /**
   * Add a relationship to test
   */
  addRelationship<R>(config: RelationshipConfig<T, R>): this {
    this.relationships.push({
      ...config,
      targetField: config.targetField || 'id' as keyof R,
      isOneToMany: config.isOneToMany || false,
      isOptional: config.isOptional || false
    });
    
    return this;
  }
  
  /**
   * Test if an entity's relationships are valid
   */
  async testEntityRelationships(entity: T): Promise<boolean> {
    const invalidRelationships: string[] = [];
    
    for (const relationship of this.relationships) {
      const { 
        name, 
        sourceField, 
        targetField, 
        isOptional,
        targetRepository 
      } = relationship;
      
      const foreignKey = entity[sourceField];
      
      // Skip check if relationship is optional and foreign key is null
      if (isOptional && (foreignKey === null || foreignKey === undefined)) {
        continue;
      }
      
      // Check that the foreign key exists in target repository
      const result = await targetRepository
        .select()
        .eq(targetField as string, foreignKey)
        .maybeSingle();
      
      if (result.isError() || result.data === null) {
        invalidRelationships.push(name);
      }
    }
    
    return invalidRelationships.length === 0;
  }
  
  /**
   * Get all relationships defined for this tester
   */
  getRelationships(): Array<{ name: string; config: RelationshipConfig<T, any> }> {
    return this.relationships.map(config => ({
      name: config.name,
      config
    }));
  }
}

/**
 * RelationshipTestContext for easily setting up relationship tests
 */
export interface RelationshipTestContext<T, R> {
  /**
   * Source entity repository
   */
  sourceRepo: DataRepository<T>;
  
  /**
   * Target entity repository
   */
  targetRepo: DataRepository<R>;
  
  /**
   * Relationship tester instance
   */
  tester: RelationshipTester<T>;
  
  /**
   * Generate a source entity with a valid relationship to a target entity
   */
  generateRelatedEntity: (sourceOverrides?: Partial<T>, targetOverrides?: Partial<R>) => Promise<{
    source: T;
    target: R;
  }>;
  
  /**
   * Generate a source entity with an invalid relationship
   */
  generateInvalidRelationship: (sourceOverrides?: Partial<T>) => Promise<T>;
  
  /**
   * Clean up test data and reset repositories
   */
  cleanup: () => void;
}

/**
 * Options for creating a relationship test context
 */
export interface RelationshipTestContextOptions<T, R> {
  /**
   * Source entity tableName
   */
  sourceTableName: string;
  
  /**
   * Target entity tableName
   */
  targetTableName: string;
  
  /**
   * Foreign key field in source entity
   */
  foreignKeyField: keyof T;
  
  /**
   * Primary key field in target entity
   */
  primaryKeyField?: keyof R;
  
  /**
   * Whether the relationship is optional
   */
  optional?: boolean;
  
  /**
   * Source entity generator
   */
  sourceGenerator?: MockDataGenerator<T>;
  
  /**
   * Target entity generator
   */
  targetGenerator?: MockDataGenerator<R>;
  
  /**
   * Source entity type for default generator
   */
  sourceEntityType?: string;
  
  /**
   * Target entity type for default generator
   */
  targetEntityType?: string;
}

/**
 * Create a relationship test context
 */
export function createRelationshipTestContext<T, R>(
  options: RelationshipTestContextOptions<T, R>
): RelationshipTestContext<T, R> {
  const {
    sourceTableName,
    targetTableName,
    foreignKeyField,
    primaryKeyField = 'id' as keyof R,
    optional = false,
    sourceGenerator,
    targetGenerator,
    sourceEntityType,
    targetEntityType
  } = options;
  
  // Create repositories
  const sourceRepo = createTestRepository<T>({
    tableName: sourceTableName,
    entityType: sourceEntityType,
    dataGenerator: sourceGenerator
  });
  
  const targetRepo = createTestRepository<R>({
    tableName: targetTableName,
    entityType: targetEntityType,
    dataGenerator: targetGenerator
  });
  
  // Create relationship tester
  const tester = new RelationshipTester<T>(sourceRepo);
  
  tester.addRelationship({
    name: `${sourceTableName}_${targetTableName}`,
    sourceField: foreignKeyField,
    targetField: primaryKeyField,
    isOptional: optional,
    targetRepository: targetRepo
  });
  
  // Generate related entities
  const generateRelatedEntity = async (
    sourceOverrides: Partial<T> = {},
    targetOverrides: Partial<R> = {}
  ) => {
    // Generate and add target entity
    let target: R;
    
    if ((targetRepo as any).generateTestData) {
      target = (targetRepo as any).generateTestData(1, targetOverrides)[0];
    } else if (targetGenerator) {
      target = targetGenerator.generate(targetOverrides);
    } else if (targetEntityType) {
      const generator = new MockDataGenerator<R>(targetEntityType);
      target = generator.generate(targetOverrides);
    } else {
      target = { 
        [primaryKeyField]: `target-${Date.now()}` 
      } as unknown as R;
      
      Object.assign(target, targetOverrides);
    }
    
    targetRepo.addItems(target);
    
    // Generate source entity with relationship
    let source: T;
    
    if ((sourceRepo as any).generateTestData) {
      source = (sourceRepo as any).generateTestData(1)[0];
    } else if (sourceGenerator) {
      source = sourceGenerator.generate();
    } else if (sourceEntityType) {
      const generator = new MockDataGenerator<T>(sourceEntityType);
      source = generator.generate();
    } else {
      source = { id: `source-${Date.now()}` } as unknown as T;
    }
    
    // Set relationship and apply overrides
    (source as any)[foreignKeyField] = target[primaryKeyField];
    Object.assign(source, sourceOverrides);
    
    sourceRepo.addItems(source);
    
    return { source, target };
  };
  
  // Generate invalid relationship
  const generateInvalidRelationship = async (sourceOverrides: Partial<T> = {}) => {
    let source: T;
    
    if ((sourceRepo as any).generateTestData) {
      source = (sourceRepo as any).generateTestData(1)[0];
    } else if (sourceGenerator) {
      source = sourceGenerator.generate();
    } else if (sourceEntityType) {
      const generator = new MockDataGenerator<T>(sourceEntityType);
      source = generator.generate();
    } else {
      source = { id: `source-${Date.now()}` } as unknown as T;
    }
    
    // Set invalid foreign key
    (source as any)[foreignKeyField] = `invalid-${Date.now()}`;
    Object.assign(source, sourceOverrides);
    
    sourceRepo.addItems(source);
    
    return source;
  };
  
  // Clean up function
  const cleanup = () => {
    (sourceRepo as any).clearItems();
    (targetRepo as any).resetSpies();
    (targetRepo as any).clearItems();
    (targetRepo as any).resetSpies();
  };
  
  return {
    sourceRepo,
    targetRepo,
    tester,
    generateRelatedEntity,
    generateInvalidRelationship,
    cleanup
  };
}
