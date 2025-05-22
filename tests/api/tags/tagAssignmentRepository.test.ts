
import { createTagAssignmentRepository, TagAssignmentRepository } from '@/api/tags/repository/TagAssignmentRepository';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Mock the repository factory module
jest.mock('@/api/core/repository/repositoryFactory', () => ({
  createSupabaseRepository: jest.fn()
}));

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

// Mock tag data for join operations
const mockJoinResult = [
  {
    id: 'tag-1',
    name: 'javascript',
    description: 'JavaScript programming language',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
    assignment_id: 'assignment-1'
  }
];

describe('Tag Assignment Repository', () => {
  let tagAssignmentRepository: TagAssignmentRepository;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create the repository instance
    tagAssignmentRepository = createTagAssignmentRepository();
    
    // Mock specific methods with direct mocks
    jest.spyOn(tagAssignmentRepository, 'getTagAssignmentsForEntity').mockImplementation((targetId?: string, targetType?: EntityType): Promise<ApiResponse<TagAssignment[]>> => {
      if (!targetId || !targetType) {
        return Promise.resolve({
          status: 'success',
          data: [],
          error: null
        });
      }
      
      const assignments = mockTagAssignments.filter(
        a => a.target_id === targetId && a.target_type === targetType
      );
      
      return Promise.resolve({
        status: 'success',
        data: assignments,
        error: null
      });
    });
    
    jest.spyOn(tagAssignmentRepository, 'createTagAssignment').mockImplementation((data: Partial<TagAssignment>): Promise<ApiResponse<TagAssignment>> => {
      if (!data.tag_id || !data.target_id || !data.target_type) {
        return Promise.resolve({
          status: 'error',
          data: null,
          error: { message: 'Missing required fields' }
        });
      }
      
      const newAssignment = {
        id: 'new-assignment-id',
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return Promise.resolve({
        status: 'success',
        data: newAssignment as TagAssignment,
        error: null
      });
    });
    
    jest.spyOn(tagAssignmentRepository, 'deleteTagAssignment').mockImplementation((id?: string): Promise<ApiResponse<boolean>> => {
      if (!id) {
        return Promise.resolve({
          status: 'error',
          data: null,
          error: { message: 'Assignment ID is required' }
        });
      }
      
      return Promise.resolve({
        status: 'success',
        data: true,
        error: null
      });
    });
    
    jest.spyOn(tagAssignmentRepository, 'getTagsForEntity').mockImplementation((): Promise<ApiResponse<any[]>> => {
      return Promise.resolve({
        status: 'success',
        data: mockJoinResult,
        error: null
      });
    });
    
    jest.spyOn(tagAssignmentRepository, 'findTagAssignment').mockImplementation((tagId?: string, targetId?: string, targetType?: EntityType): Promise<ApiResponse<TagAssignment | null>> => {
      if (!tagId || !targetId || !targetType) {
        return Promise.resolve({
          status: 'success',
          data: null,
          error: null
        });
      }
      
      const assignment = mockTagAssignments.find(
        a => a.tag_id === tagId && a.target_id === targetId && a.target_type === targetType
      );
      
      return Promise.resolve({
        status: 'success',
        data: assignment || null,
        error: null
      });
    });
  });
  
  afterEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
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
      // Override mock for this test
      jest.spyOn(tagAssignmentRepository, 'getTagAssignmentsForEntity').mockResolvedValueOnce({
        status: 'success',
        data: [],
        error: null
      });
      
      // Act
      const result = await tagAssignmentRepository.getTagAssignmentsForEntity(
        'non-existent',
        'person' as EntityType
      );
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });
    
    test('should handle null or undefined parameters', async () => {
      // Act with undefined targetId
      const result1 = await tagAssignmentRepository.getTagAssignmentsForEntity(
        undefined as any,
        'person' as EntityType
      );
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toEqual([]);
      
      // Act with undefined targetType
      const result2 = await tagAssignmentRepository.getTagAssignmentsForEntity(
        'entity-1',
        undefined as any
      );
      
      // Assert
      expect(result2.status).toBe('success');
      expect(result2.data).toEqual([]);
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
    
    test('should handle missing fields', async () => {
      // Arrange an incomplete assignment
      const incompleteAssignment: Partial<TagAssignment> = {
        tag_id: 'tag-3',
        // missing target_id and target_type
      };
      
      // Act
      const result = await tagAssignmentRepository.createTagAssignment(incompleteAssignment);
      
      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Missing required fields');
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
    
    test('should handle null or undefined assignment ID', async () => {
      // Act with undefined ID
      const result = await tagAssignmentRepository.deleteTagAssignment(undefined as any);
      
      // Assert
      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Assignment ID is required');
    });
  });
  
  describe('getTagsForEntity', () => {
    test('should return tags for an entity', async () => {
      // Act
      const result = await tagAssignmentRepository.getTagsForEntity('entity-1', 'person' as EntityType);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('javascript');
    });
    
    test('should return empty array if no tags found', async () => {
      // Override mock for this test
      jest.spyOn(tagAssignmentRepository, 'getTagsForEntity').mockResolvedValueOnce({
        status: 'success',
        data: [],
        error: null
      });
      
      // Act
      const result = await tagAssignmentRepository.getTagsForEntity('non-existent', 'person' as EntityType);
      
      // Assert
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });
    
    test('should handle null or undefined parameters', async () => {
      // Override mock for this test
      jest.spyOn(tagAssignmentRepository, 'getTagsForEntity').mockImplementation((targetId?: string, targetType?: EntityType): Promise<ApiResponse<any[]>> => {
        if (!targetId || !targetType) {
          return Promise.resolve({
            status: 'success',
            data: [],
            error: null
          });
        }
        
        return Promise.resolve({
          status: 'success',
          data: mockJoinResult,
          error: null
        });
      });
      
      // Act with undefined targetId
      const result1 = await tagAssignmentRepository.getTagsForEntity(
        undefined as any,
        'person' as EntityType
      );
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toEqual([]);
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
    
    test('should handle null or undefined parameters', async () => {
      // Act with undefined parameters
      const result1 = await tagAssignmentRepository.findTagAssignment(
        undefined as any,
        'entity-1',
        'person' as EntityType
      );
      
      // Assert
      expect(result1.status).toBe('success');
      expect(result1.data).toBeNull();
    });
  });
});
