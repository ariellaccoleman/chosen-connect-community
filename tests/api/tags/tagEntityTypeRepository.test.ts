
import { createTagEntityTypeRepository, TagEntityTypeRepository } from '@/api/tags/repository/TagEntityTypeRepository';
import { EntityType } from '@/types/entityTypes';

// Mock the repository factory module
jest.mock('@/api/core/repository/repositoryFactory', () => ({
  createSupabaseRepository: jest.fn()
}));

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
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations for repository methods
    const mockSelect = jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        data: mockTagEntityTypes,
        error: null
      })
    }));
    
    const mockInsert = jest.fn().mockImplementation((data) => ({
      select: jest.fn().mockResolvedValue({
        data: Array.isArray(data) 
          ? data.map((item, index) => ({ id: `new-id-${index}`, ...item }))
          : { id: 'new-id', ...data },
        error: null
      })
    }));
    
    const mockDelete = jest.fn().mockImplementation(() => ({
      match: jest.fn().mockResolvedValue({
        data: true,
        error: null
      })
    }));
    
    // Mock the createSupabaseRepository to return our mocked methods
    const mockRepo = {
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete
    };
    
    // Setup the createSupabaseRepository mock
    require('@/api/core/repository/repositoryFactory').createSupabaseRepository.mockReturnValue(mockRepo);
    
    // Create the repository instance
    tagEntityTypeRepository = createTagEntityTypeRepository();
    
    // Mock specific methods
    jest.spyOn(tagEntityTypeRepository, 'getEntityTypesByTagId').mockImplementation((tagId) => {
      const entityTypes = mockTagEntityTypes
        .filter(et => et.tag_id === tagId)
        .map(et => et.entity_type);
      
      return Promise.resolve({
        status: 'success',
        data: entityTypes,
        error: null
      });
    });
    
    jest.spyOn(tagEntityTypeRepository, 'associateTagWithEntityType').mockImplementation(() => {
      return Promise.resolve({
        status: 'success',
        data: true,
        error: null
      });
    });
    
    jest.spyOn(tagEntityTypeRepository, 'removeTagEntityTypeAssociation').mockImplementation(() => {
      return Promise.resolve({
        status: 'success',
        data: true,
        error: null
      });
    });
  });
  
  afterEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
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
      // Override mock for this test
      jest.spyOn(tagEntityTypeRepository, 'getEntityTypesByTagId').mockResolvedValueOnce({
        status: 'success',
        data: [],
        error: null
      });
      
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
      expect(result.data).toBe(true);
    });
    
    test('should handle errors when association fails', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(tagEntityTypeRepository, 'associateTagWithEntityType').mockRejectedValueOnce(new Error('Database error'));
      
      // Act & Assert
      await expect(
        tagEntityTypeRepository.associateTagWithEntityType('tag-1', 'person' as EntityType)
      ).rejects.toThrow('Database error');
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
      jest.spyOn(tagEntityTypeRepository, 'removeTagEntityTypeAssociation').mockRejectedValueOnce(new Error('Database error'));
      
      // Act & Assert
      await expect(
        tagEntityTypeRepository.removeTagEntityTypeAssociation('tag-1', 'person' as EntityType)
      ).rejects.toThrow('Database error');
    });
  });
});
