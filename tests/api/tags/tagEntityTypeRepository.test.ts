
import { createTagEntityTypeRepository, TagEntityTypeRepository } from '@/api/tags/repository/TagEntityTypeRepository';
import { EntityType } from '@/types/entityTypes';
import { mockRepositoryFactory, resetRepositoryFactoryMock } from '@/tests/utils/repositoryTestUtils';

// Mock data
const mockTagEntityTypes = [
  {
    id: 'entity-type-1',
    tag_id: 'tag-1',
    entity_type: 'person',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'entity-type-2',
    tag_id: 'tag-2',
    entity_type: 'organization',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('Tag Entity Type Repository', () => {
  let tagEntityTypeRepository: TagEntityTypeRepository;
  
  beforeEach(() => {
    // Mock the repository factory with our test data
    mockRepositoryFactory({
      'tag_entity_types': mockTagEntityTypes
    });
    
    // Create the repository instance
    tagEntityTypeRepository = createTagEntityTypeRepository();
  });
  
  afterEach(() => {
    // Reset mocks after each test
    resetRepositoryFactoryMock();
    jest.clearAllMocks();
  });
  
  describe('getEntityTypesByTagId', () => {
    test('should return entity types for a tag', async () => {
      // Act
      const result = await tagEntityTypeRepository.getEntityTypesByTagId('tag-1');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toContain('person');
    });
    
    test('should return empty array if no entity types found', async () => {
      // Act
      const result = await tagEntityTypeRepository.getEntityTypesByTagId('non-existent');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });
  });
  
  describe('associateTagWithEntityType', () => {
    test('should associate tag with entity type', async () => {
      // Act
      const result = await tagEntityTypeRepository.associateTagWithEntityType(
        'tag-3',
        'event' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
    });
    
    test('should handle errors when association fails', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(
        tagEntityTypeRepository.associateTagWithEntityType('tag-1', 'person' as EntityType)
      ).rejects.toThrow();
    });
  });
  
  describe('removeTagEntityTypeAssociation', () => {
    test('should remove tag entity type association', async () => {
      // Act
      const result = await tagEntityTypeRepository.removeTagEntityTypeAssociation(
        'tag-1',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
    
    test('should handle errors when removal fails', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(
        tagEntityTypeRepository.removeTagEntityTypeAssociation('tag-1', 'person' as EntityType)
      ).rejects.toThrow();
    });
  });
});
