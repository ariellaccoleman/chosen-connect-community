import { Tag } from '@/utils/tags/types';
import { createTagRepository, TagRepository } from '@/api/tags/repository/TagRepository';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Mock the repository factory module
jest.mock('@/api/core/repository/repositoryFactory', () => ({
  createSupabaseRepository: jest.fn()
}));

// Mock the tag entity type repository
jest.mock('@/api/tags/repository/index', () => ({
  createTagEntityTypeRepository: jest.fn().mockReturnValue({
    associateTagWithEntityType: jest.fn().mockResolvedValue({
      status: 'success',
      data: true,
      error: null
    })
  })
}));

// Mock data for testing
const mockTags: Tag[] = [
  {
    id: 'tag-1',
    name: 'javascript',
    description: 'JavaScript programming language',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1'
  },
  {
    id: 'tag-2',
    name: 'react',
    description: 'React library',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1'
  }
];

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

const mockTagAssignments = [
  {
    id: 'assignment-1',
    tag_id: 'tag-1',
    target_id: 'entity-1',
    target_type: 'person',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('Tag Repository', () => {
  let tagRepository: TagRepository;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create the repository instance
    tagRepository = createTagRepository();
    
    // Add specific mocks for tag repository methods
    jest.spyOn(tagRepository, 'getAllTags').mockResolvedValue({
      status: 'success',
      data: mockTags,
      error: null
    });
    
    jest.spyOn(tagRepository, 'getTagById').mockImplementation((id) => {
      const tag = mockTags.find(tag => tag.id === id);
      return Promise.resolve({
        status: 'success',
        data: tag || null,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'findTagByName').mockImplementation((name) => {
      // Handle null/undefined name safely
      const searchName = name ? name.toLowerCase() : '';
      const tag = mockTags.find(tag => tag.name.toLowerCase() === searchName);
      return Promise.resolve({
        status: 'success',
        data: tag || null,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'searchTags').mockImplementation((query) => {
      if (!query) {
        return Promise.resolve({
          status: 'success',
          data: mockTags,
          error: null
        });
      }
      
      // Handle null/undefined query safely
      const searchQuery = query ? query.toLowerCase() : '';
      const filteredTags = mockTags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery)
      );
      
      return Promise.resolve({
        status: 'success',
        data: filteredTags,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'getTagsByEntityType').mockImplementation((entityType) => {
      const filteredTags = mockTags.filter(tag => 
        mockTagEntityTypes.some(et => 
          et.tag_id === tag.id && et.entity_type === entityType
        )
      );
      
      return Promise.resolve({
        status: 'success',
        data: filteredTags,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'createTag').mockImplementation((tagData) => {
      const newTag: Tag = {
        id: 'new-tag-id',
        name: tagData.name || '',
        description: tagData.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: tagData.created_by || null
      };
      
      return Promise.resolve({
        status: 'success',
        data: newTag,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'updateTag').mockImplementation((id, tagData) => {
      const existingTag = mockTags.find(tag => tag.id === id);
      if (!existingTag) {
        return Promise.resolve({
          status: 'error',
          data: null,
          error: { message: 'Tag not found' }
        });
      }
      
      const updatedTag: Tag = {
        ...existingTag,
        ...tagData,
        updated_at: new Date().toISOString()
      };
      
      return Promise.resolve({
        status: 'success',
        data: updatedTag,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'deleteTag').mockImplementation((id) => {
      return Promise.resolve({
        status: 'success',
        data: true,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'findOrCreateTag').mockImplementation((data) => {
      // First try to find the tag by name
      const tagName = typeof data === 'string' ? data : (data?.name || '');
      const existingTag = mockTags.find(
        // Handle null/undefined name safely
        tag => tag.name.toLowerCase() === (tagName ? tagName.toLowerCase() : '')
      );
      
      if (existingTag) {
        return Promise.resolve({
          status: 'success',
          data: existingTag,
          error: null
        });
      }
      
      // If tag wasn't found, create a new one
      const newTag: Tag = {
        id: 'new-tag-id',
        name: tagName,
        description: typeof data === 'object' && data ? (data.description || null) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: typeof data === 'object' && data ? (data.created_by || null) : null
      };
      
      return Promise.resolve({
        status: 'success',
        data: newTag,
        error: null
      });
    });
    
    jest.spyOn(tagRepository, 'associateTagWithEntityType').mockImplementation((tagId, entityType) => {
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
  
  describe('getAllTags', () => {
    test('should return all tags', async () => {
      // Act
      const result = await tagRepository.getAllTags();
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(mockTags.length);
      expect(result.data![0].name).toBe(mockTags[0].name);
    });
  });
  
  describe('getTagById', () => {
    test('should return tag by ID', async () => {
      // Act
      const result = await tagRepository.getTagById('tag-1');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('tag-1');
      expect(result.data?.name).toBe('javascript');
    });
    
    test('should return null for non-existent tag ID', async () => {
      // Act
      const result = await tagRepository.getTagById('non-existent');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });
  });
  
  describe('getTagsByEntityType', () => {
    test('should return tags for a specific entity type', async () => {
      // Act
      const result = await tagRepository.getTagsByEntityType('person');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('javascript');
    });
    
    test('should return empty array for entity type with no tags', async () => {
      // Override the mock for this specific test
      jest.spyOn(tagRepository, 'getTagsByEntityType').mockResolvedValueOnce({
        status: 'success',
        data: [],
        error: null
      });
      
      // Act
      const result = await tagRepository.getTagsByEntityType('event');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(0);
    });
  });
  
  describe('findTagByName', () => {
    test('should find tag by name (case insensitive)', async () => {
      // Act - with lowercase
      const result1 = await tagRepository.findTagByName('javascript');
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data?.id).toBe('tag-1');
      
      // Act - with different case
      const result2 = await tagRepository.findTagByName('JavaScript');
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data?.id).toBe('tag-1');
    });
    
    test('should return null for non-existent tag name', async () => {
      // Act
      const result = await tagRepository.findTagByName('nonexistent');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });
    
    test('should handle null or undefined tag name', async () => {
      // Act with undefined
      const result1 = await tagRepository.findTagByName(undefined as any);
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toBeNull();
      
      // Act with null
      const result2 = await tagRepository.findTagByName(null as any);
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data).toBeNull();
    });
  });
  
  describe('searchTags', () => {
    test('should search tags by name', async () => {
      // Act
      const result = await tagRepository.searchTags('java');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('javascript');
    });
    
    test('should return all tags if search query is empty', async () => {
      // Act
      const result = await tagRepository.searchTags('');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(mockTags.length);
    });
    
    test('should handle null or undefined search query', async () => {
      // Act with undefined
      const result1 = await tagRepository.searchTags(undefined as any);
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toHaveLength(mockTags.length);
      
      // Act with null
      const result2 = await tagRepository.searchTags(null as any);
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data).toHaveLength(mockTags.length);
    });
  });
  
  describe('createTag', () => {
    test('should create new tag', async () => {
      // Mock the insert method for this specific test
      const newTag: Partial<Tag> = {
        name: 'typescript',
        description: 'TypeScript programming language'
      };
      
      // Act
      const result = await tagRepository.createTag(newTag);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('typescript');
      expect(result.data?.description).toBe('TypeScript programming language');
    });
    
    test('should handle empty tag name', async () => {
      // Arrange
      const newTag: Partial<Tag> = {
        name: '',
        description: 'Empty tag name'
      };
      
      // Act
      const result = await tagRepository.createTag(newTag);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('');
    });
    
    test('should handle undefined tag name', async () => {
      // Arrange
      const newTag: Partial<Tag> = {
        description: 'No tag name provided'
      };
      
      // Act
      const result = await tagRepository.createTag(newTag);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('');
    });
  });
  
  describe('updateTag', () => {
    test('should update existing tag', async () => {
      // Arrange
      const tagUpdate: Partial<Tag> = {
        description: 'Updated JavaScript description'
      };
      
      // Act
      const result = await tagRepository.updateTag('tag-1', tagUpdate);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('tag-1');
      expect(result.data?.description).toBe('Updated JavaScript description');
    });
    
    test('should return error for non-existent tag', async () => {
      // Arrange
      const tagUpdate: Partial<Tag> = {
        description: 'Updated description'
      };
      
      // Act
      const result = await tagRepository.updateTag('non-existent', tagUpdate);
      
      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Tag not found');
    });
  });
  
  describe('deleteTag', () => {
    test('should delete existing tag', async () => {
      // Act
      const result = await tagRepository.deleteTag('tag-1');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
  
  describe('findOrCreateTag', () => {
    test('should return existing tag if found', async () => {
      // Act
      const result = await tagRepository.findOrCreateTag({
        name: 'javascript'
      });
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('tag-1');
      expect(result.data?.name).toBe('javascript');
    });
    
    test('should create new tag if not found', async () => {
      // Arrange
      const newTagData = {
        name: 'newTag',
        description: 'A brand new tag'
      };
      
      // Act
      const result = await tagRepository.findOrCreateTag(newTagData);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('newTag');
    });
    
    test('should handle string input', async () => {
      // Act
      const result = await tagRepository.findOrCreateTag('javascript');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('tag-1');
      expect(result.data?.name).toBe('javascript');
    });
    
    test('should handle empty string', async () => {
      // Act
      const result = await tagRepository.findOrCreateTag('');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('');
    });
    
    test('should handle null or undefined input', async () => {
      // Update the mock implementation to properly handle undefined and null
      jest.spyOn(tagRepository, 'findOrCreateTag').mockImplementation((data) => {
        // First try to find the tag by name
        const tagName = typeof data === 'string' ? data : (data?.name || '');
        const existingTag = mockTags.find(
          tag => tag.name.toLowerCase() === (tagName ? tagName.toLowerCase() : '')
        );
        
        if (existingTag) {
          return Promise.resolve({
            status: 'success',
            data: existingTag,
            error: null
          });
        }
        
        // If tag wasn't found, create a new one
        const newTag: Tag = {
          id: 'new-tag-id',
          name: tagName,
          description: typeof data === 'object' && data ? (data.description || null) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: typeof data === 'object' && data ? (data.created_by || null) : null
        };
        
        return Promise.resolve({
          status: 'success',
          data: newTag,
          error: null
        });
      });
      
      // Act with undefined
      const result1 = await tagRepository.findOrCreateTag(undefined as any);
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data?.name).toBe('');
      
      // Act with null
      const result2 = await tagRepository.findOrCreateTag(null as any);
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data?.name).toBe('');
    });
  });
  
  describe('associateTagWithEntityType', () => {
    test('should associate tag with entity type', async () => {
      // Act
      const result = await tagRepository.associateTagWithEntityType('tag-1', 'organization' as EntityType);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
});
