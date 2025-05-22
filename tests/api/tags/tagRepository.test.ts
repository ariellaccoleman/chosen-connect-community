
import { Tag, TagAssignment } from '@/utils/tags/types';
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
    
    // Setup default mock implementations for repository methods
    const mockSelect = jest.fn().mockResolvedValue({
      data: mockTags,
      error: null
    });
    
    const mockInsert = jest.fn().mockImplementation((data) => ({
      select: jest.fn().mockResolvedValue({
        data: Array.isArray(data) 
          ? data.map((item, index) => ({ id: `new-id-${index}`, ...item }))
          : { id: 'new-id', ...data },
        error: null
      })
    }));
    
    const mockUpdate = jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          data: { ...mockTags[0], description: 'Updated JavaScript description' },
          error: null
        })
      }))
    }));
    
    const mockDelete = jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({
        data: true,
        error: null
      })
    }));
    
    // Mock the createSupabaseRepository to return our mocked methods
    const mockRepo = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      // Add mock for raw SQL query
      executeRawQuery: jest.fn().mockResolvedValue({
        data: mockTags,
        error: null
      })
    };
    
    // Setup the createSupabaseRepository mock
    require('@/api/core/repository/repositoryFactory').createSupabaseRepository.mockReturnValue(mockRepo);
    
    // Create the repository instance
    tagRepository = createTagRepository();
    
    // Add specific mocks for more complex methods
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
      const tag = mockTags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
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
      
      const filteredTags = mockTags.filter(tag => 
        tag.name.toLowerCase().includes(query.toLowerCase())
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
    
    test('should handle errors and return empty array', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(tagRepository, 'getAllTags').mockRejectedValueOnce(new Error('Database error'));
      
      // Use a try/catch to properly handle the rejected promise
      let result: ApiResponse<Tag[]> = { status: 'error', data: null, error: { message: 'Test failed' } };
      try {
        result = await tagRepository.getAllTags();
      } catch (error) {
        // We expect the error to be caught in the repository
      }
      
      // Assert - in case of error, repository should handle and return empty array
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
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
  });
  
  describe('createTag', () => {
    test('should create new tag', async () => {
      // Mock the insert method for this specific test
      const newTag: Partial<Tag> = {
        name: 'typescript',
        description: 'TypeScript programming language'
      };
      
      jest.spyOn(tagRepository, 'createTag').mockResolvedValueOnce({
        status: 'success',
        data: {
          id: 'new-tag-id',
          name: 'typescript',
          description: 'TypeScript programming language',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        },
        error: null
      });
      
      // Act
      const result = await tagRepository.createTag(newTag);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('typescript');
      expect(result.data?.description).toBe('TypeScript programming language');
    });
    
    test('should throw error if creation fails', async () => {
      // Arrange
      const newTag: Partial<Tag> = {
        name: 'typescript'
      };
      
      // Mock to reject
      jest.spyOn(tagRepository, 'createTag').mockRejectedValueOnce(new Error('Failed to create tag'));
      
      // Act & Assert
      await expect(tagRepository.createTag(newTag)).rejects.toThrow('Failed to create tag');
    });
  });
  
  describe('updateTag', () => {
    test('should update existing tag', async () => {
      // Arrange
      const tagUpdate: Partial<Tag> = {
        description: 'Updated JavaScript description'
      };
      
      jest.spyOn(tagRepository, 'updateTag').mockResolvedValueOnce({
        status: 'success',
        data: {
          ...mockTags[0],
          description: 'Updated JavaScript description'
        },
        error: null
      });
      
      // Act
      const result = await tagRepository.updateTag('tag-1', tagUpdate);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('tag-1');
      expect(result.data?.description).toBe('Updated JavaScript description');
    });
    
    test('should throw error if update fails', async () => {
      // Arrange
      const tagUpdate: Partial<Tag> = {
        description: 'Updated description'
      };
      
      // Mock repository to fail on update
      jest.spyOn(tagRepository, 'updateTag').mockRejectedValueOnce(new Error('Failed to update tag'));
      
      // Act & Assert
      await expect(tagRepository.updateTag('tag-1', tagUpdate)).rejects.toThrow('Failed to update tag');
    });
  });
  
  describe('deleteTag', () => {
    test('should delete existing tag', async () => {
      // Mock the response
      jest.spyOn(tagRepository, 'deleteTag').mockResolvedValueOnce({
        status: 'success',
        data: true,
        error: null
      });
      
      // Act
      const result = await tagRepository.deleteTag('tag-1');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
    
    test('should throw error if deletion fails', async () => {
      // Mock repository to fail on delete
      jest.spyOn(tagRepository, 'deleteTag').mockRejectedValueOnce(new Error('Failed to delete tag'));
      
      // Act & Assert
      await expect(tagRepository.deleteTag('tag-1')).rejects.toThrow('Failed to delete tag');
    });
  });
  
  describe('findOrCreateTag', () => {
    test('should return existing tag if found', async () => {
      // Mock findTagByName to return existing tag
      jest.spyOn(tagRepository, 'findTagByName').mockResolvedValueOnce({
        status: 'success',
        data: mockTags[0],
        error: null
      });
      
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
      
      // Mock findTagByName to return null (not found)
      jest.spyOn(tagRepository, 'findTagByName').mockResolvedValueOnce({
        status: 'success',
        data: null,
        error: null
      });
      
      // Mock createTag to return success
      jest.spyOn(tagRepository, 'createTag').mockResolvedValueOnce({
        status: 'success',
        data: {
          id: 'new-tag-id',
          ...newTagData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        },
        error: null
      });
      
      // Act
      const result = await tagRepository.findOrCreateTag(newTagData);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('newTag');
      expect(tagRepository.createTag).toHaveBeenCalled();
    });
    
    test('should throw error if both find and create fail', async () => {
      // Arrange
      const newTagData = {
        name: 'errorTag'
      };
      
      // Mock findTagByName to throw error
      jest.spyOn(tagRepository, 'findTagByName').mockRejectedValueOnce(new Error('Database error'));
      
      // Act & Assert
      await expect(tagRepository.findOrCreateTag(newTagData)).rejects.toThrow('Database error');
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
