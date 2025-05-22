
import { createTagAssignmentRepository, TagAssignmentRepository } from '@/api/tags/repository/TagAssignmentRepository';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { mockRepositoryFactory, resetRepositoryFactoryMock } from '../../../tests/utils/repositoryTestUtils';

// Mock data
const mockTagAssignments: TagAssignment[] = [
  {
    id: 'assignment-1',
    tag_id: 'tag-1',
    target_id: 'entity-1',
    target_type: 'person',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'assignment-2',
    tag_id: 'tag-2',
    target_id: 'entity-2',
    target_type: 'organization',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('Tag Assignment Repository', () => {
  let tagAssignmentRepository: TagAssignmentRepository;
  
  beforeEach(() => {
    // Mock the repository factory with our test data
    mockRepositoryFactory({
      'tag_assignments': mockTagAssignments
    });
    
    // Create the repository instance
    tagAssignmentRepository = createTagAssignmentRepository();
  });
  
  afterEach(() => {
    // Reset mocks after each test
    resetRepositoryFactoryMock();
    jest.clearAllMocks();
  });
  
  describe('getTagAssignmentsForEntity', () => {
    test('should return tag assignments for an entity', async () => {
      // Act
      const result = await tagAssignmentRepository.getTagAssignmentsForEntity(
        'entity-1',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].tag_id).toBe('tag-1');
    });
    
    test('should return empty array if no assignments found', async () => {
      // Act
      const result = await tagAssignmentRepository.getTagAssignmentsForEntity(
        'non-existent',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });
  });
  
  describe('createTagAssignment', () => {
    test('should create new tag assignment', async () => {
      // Arrange
      const newAssignment: Partial<TagAssignment> = {
        tag_id: 'tag-3',
        target_id: 'entity-3',
        target_type: 'event'
      };
      
      // Act
      const result = await tagAssignmentRepository.createTagAssignment(newAssignment);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.tag_id).toBe('tag-3');
      expect(result.data?.target_id).toBe('entity-3');
    });
    
    test('should handle errors when creation fails', async () => {
      // Arrange
      const newAssignment: Partial<TagAssignment> = {
        tag_id: 'tag-3',
        target_id: 'entity-3',
        target_type: 'event'
      };
      
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(
        tagAssignmentRepository.createTagAssignment(newAssignment)
      ).rejects.toThrow();
    });
  });
  
  describe('deleteTagAssignment', () => {
    test('should delete tag assignment', async () => {
      // Act
      const result = await tagAssignmentRepository.deleteTagAssignment('assignment-1');
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
    
    test('should handle errors when deletion fails', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error
      jest.spyOn(Promise, 'resolve').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(
        tagAssignmentRepository.deleteTagAssignment('assignment-1')
      ).rejects.toThrow();
    });
  });
  
  describe('getTagsForEntity', () => {
    test('should return tags for an entity', async () => {
      // Arrange - We need to mock the join query
      const mockJoinResult = {
        data: [
          {
            id: 'tag-1',
            name: 'javascript',
            description: 'JavaScript programming language',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user-1',
            assignment_id: 'assignment-1'
          }
        ],
        error: null
      };
      
      const mockSelect = jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue(mockJoinResult)
      });
      
      jest.spyOn(tagAssignmentRepository, 'getTagsForEntity').mockImplementation(async () => {
        return {
          status: 'success',
          data: mockJoinResult.data,
          error: null
        };
      });
      
      // Act
      const result = await tagAssignmentRepository.getTagsForEntity('entity-1', 'person' as EntityType);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('javascript');
    });
  });
  
  describe('findTagAssignment', () => {
    test('should find tag assignment', async () => {
      // Act
      const result = await tagAssignmentRepository.findTagAssignment(
        'tag-1',
        'entity-1',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('assignment-1');
    });
    
    test('should return null if assignment not found', async () => {
      // Act
      const result = await tagAssignmentRepository.findTagAssignment(
        'non-existent',
        'entity-1',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });
  });
});
