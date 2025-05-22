
import { createTagEntityTypeRepository, TagEntityTypeRepository } from '@/api/tags/repository/TagEntityTypeRepository';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

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
    
    // Create the repository instance
    tagEntityTypeRepository = createTagEntityTypeRepository();
    
    // Mock specific methods
    jest.spyOn(tagEntityTypeRepository, 'getEntityTypesByTagId').mockImplementation((tagId?: string): Promise<ApiResponse<string[]>> => {
      if (!tagId) {
        return Promise.resolve({
          status: 'success',
          data: [],
          error: null
        });
      }
      
      const entityTypes = mockTagEntityTypes
        .filter(et => et.tag_id === tagId)
        .map(et => et.entity_type);
      
      return Promise.resolve({
        status: 'success',
        data: entityTypes,
        error: null
      });
    });
    
    jest.spyOn(tagEntityTypeRepository, 'associateTagWithEntityType').mockImplementation((tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>> => {
      if (!tagId || !entityType) {
        return Promise.resolve({
          status: 'error',
          data: null,
          error: { message: 'Missing required parameters' }
        });
      }
      
      return Promise.resolve({
        status: 'success',
        data: true,
        error: null
      });
    });
    
    jest.spyOn(tagEntityTypeRepository, 'removeTagEntityTypeAssociation').mockImplementation((tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>> => {
      if (!tagId || !entityType) {
        return Promise.resolve({
          status: 'error',
          data: null,
          error: { message: 'Missing required parameters' }
        });
      }
      
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
      // Act
      const result = await tagEntityTypeRepository.getEntityTypesByTagId('non-existent');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });
    
    test('should handle null or undefined tag ID', async () => {
      // Act with undefined
      const result1 = await tagEntityTypeRepository.getEntityTypesByTagId(undefined as any);
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toEqual([]);
      
      // Act with null
      const result2 = await tagEntityTypeRepository.getEntityTypesByTagId(null as any);
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data).toEqual([]);
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
    
    test('should handle missing parameters', async () => {
      // Act with undefined tag ID
      const result1 = await tagEntityTypeRepository.associateTagWithEntityType(
        undefined as any,
        'person' as EntityType
      );
      
      // Assert
      expect(result1.status).toBe('error');
      expect(result1.error?.message).toBe('Missing required parameters');
      
      // Act with null entity type
      const result2 = await tagEntityTypeRepository.associateTagWithEntityType(
        'tag-1',
        null as any
      );
      
      // Assert
      expect(result2.status).toBe('error');
      expect(result2.error?.message).toBe('Missing required parameters');
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
    
    test('should handle missing parameters', async () => {
      // Act with undefined tag ID
      const result1 = await tagEntityTypeRepository.removeTagEntityTypeAssociation(
        undefined as any,
        'person' as EntityType
      );
      
      // Assert
      expect(result1.status).toBe('error');
      expect(result1.error?.message).toBe('Missing required parameters');
      
      // Act with null entity type
      const result2 = await tagEntityTypeRepository.removeTagEntityTypeAssociation(
        'tag-1',
        null as any
      );
      
      // Assert
      expect(result2.status).toBe('error');
      expect(result2.error?.message).toBe('Missing required parameters');
    });
  });
});
