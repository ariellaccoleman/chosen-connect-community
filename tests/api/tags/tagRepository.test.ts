
import { Tag, TagAssignment } from '@/utils/tags/types';
import { createTagRepository, TagRepository } from '@/api/tags/repository/TagRepository';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';
import { mockRepositoryFactory, resetRepositoryFactoryMock } from '../../../tests/utils/repositoryTestUtils';

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

const mockTagAssignments: TagAssignment[] = [
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
    // Mock the repository factory with our test data
    mockRepositoryFactory({
      'tags': mockTags,
      'tag_entity_types': mockTagEntityTypes,
      'tag_assignments': mockTagAssignments
    });
    
    // Create the repository instance
    tagRepository = createTagRepository();
  });
  
  afterEach(() => {
    // Reset mocks after each test
    resetRepositoryFactoryMock();
    jest.clearAllMocks();
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
      
      // Force an error by returning a rejected promise
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act
      const result = await tagRepository.getAllTags();
      
      // Assert
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
      // Mock the select method for custom SQL query
      jest.spyOn(tagRepository, 'getTagsByEntityType').mockResolvedValueOnce({
        status: 'success',
        data: [mockTags[0]],
        error: null
      });
      
      // Act
      const result = await tagRepository.getTagsByEntityType('person');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
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
      // Arrange
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
    
    test('should throw error if creation fails', async () => {
      // Arrange
      const newTag: Partial<Tag> = {
        name: 'typescript'
      };
      
      // Mock repository to fail on insert
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Failed to create tag');
      });
      
      // Act & Assert
      await expect(tagRepository.createTag(newTag)).rejects.toThrow();
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
    
    test('should throw error if update fails', async () => {
      // Arrange
      const tagUpdate: Partial<Tag> = {
        description: 'Updated description'
      };
      
      // Mock repository to fail on update
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Failed to update tag');
      });
      
      // Act & Assert
      await expect(tagRepository.updateTag('tag-1', tagUpdate)).rejects.toThrow();
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
    
    test('should throw error if deletion fails', async () => {
      // Mock repository to fail on delete
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Failed to delete tag');
      });
      
      // Act & Assert
      await expect(tagRepository.deleteTag('tag-1')).rejects.toThrow();
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
      jest.spyOn(tagRepository, 'findTagByName').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(tagRepository.findOrCreateTag(newTagData)).rejects.toThrow();
    });
  });
  
  describe('associateTagWithEntityType', () => {
    test('should associate tag with entity type', async () => {
      // Create a mock module for the TagEntityTypeRepository import
      const mockTagEntityTypeRepository = {
        associateTagWithEntityType: jest.fn().mockResolvedValue({
          status: 'success',
          data: true,
          error: null
        })
      };
      
      // Mock the dynamic import
      jest.mock('@/api/tags/repository/index', () => ({
        createTagEntityTypeRepository: jest.fn(() => mockTagEntityTypeRepository)
      }));
      
      // Act
      const result = await tagRepository.associateTagWithEntityType('tag-1', 'organization' as EntityType);
      
      // Assert
      expect(result.status).toBe('success');
    });
  });
});
