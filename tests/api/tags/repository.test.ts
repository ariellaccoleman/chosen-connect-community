
import { Tag, TagAssignment, TagEntityType } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { createTagRepository, createTagAssignmentRepository, createTagEntityTypeRepository } from "@/api/tags/repository";
import { createMockRepository } from "@/api/core/repository/MockRepository";
import { createSuccessResponse } from "@/api/core/repository/repositoryUtils";

// Mock data for tests
const mockTag: Tag = {
  id: "tag-1",
  name: "test-tag",
  description: "Test tag for unit tests",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: "user-1"
};

const mockTags: Tag[] = [
  mockTag,
  {
    id: "tag-2",
    name: "another-tag",
    description: "Another test tag",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "user-1"
  }
];

const mockAssignments: TagAssignment[] = [
  {
    id: "assignment-1",
    tag_id: "tag-1",
    target_id: "entity-1",
    target_type: EntityType.PERSON,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "assignment-2",
    tag_id: "tag-2",
    target_id: "entity-2",
    target_type: EntityType.ORGANIZATION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockEntityTypes: TagEntityType[] = [
  {
    id: "tet-1",
    tag_id: "tag-1",
    entity_type: EntityType.PERSON,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "tet-2",
    tag_id: "tag-1",
    entity_type: EntityType.ORGANIZATION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "tet-3",
    tag_id: "tag-2",
    entity_type: EntityType.EVENT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Fix the circular dependency by directly defining mock functions first
const mockRepositories: Record<string, any> = {};

// Create the mock repositories before initializing them with data
mockRepositories["tags"] = createMockRepository("tags");
mockRepositories["tag_assignments"] = createMockRepository("tag_assignments");
mockRepositories["tag_entity_types"] = createMockRepository("tag_entity_types");

// Now populate the repositories with mock data
jest.mock("@/api/core/repository/repositoryFactory", () => {
  // Return the factory mock
  return {
    createSupabaseRepository: jest.fn((tableName) => {
      // Return the mock repository for the requested table or create a new empty one
      if (!mockRepositories[tableName]) {
        mockRepositories[tableName] = createMockRepository(tableName);
      }
      
      // Initialize with test data if needed
      if (tableName === "tags" && mockRepositories[tableName].getAll().length === 0) {
        mockRepositories[tableName].setMockData(mockTags);
      } else if (tableName === "tag_assignments" && mockRepositories[tableName].getAll().length === 0) {
        mockRepositories[tableName].setMockData(mockAssignments);
      } else if (tableName === "tag_entity_types" && mockRepositories[tableName].getAll().length === 0) {
        mockRepositories[tableName].setMockData(mockEntityTypes);
      }
      
      return mockRepositories[tableName];
    })
  };
});

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {}
}));

describe("TagsRepository Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TagRepository", () => {
    let tagRepo: ReturnType<typeof createTagRepository>;

    beforeEach(() => {
      tagRepo = createTagRepository();
    });

    test("getAllTags returns all tags", async () => {
      // Prepare mock data and response
      const orderResult = createSuccessResponse(mockTags);
      
      // Mock implementation using setMockResponse for the underlying repository
      const repository = (tagRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup the mock chain response
      const orderMock = jest.fn().mockResolvedValue(orderResult);
      selectMock.mockReturnValue({
        order: jest.fn().mockReturnValue({
          execute: orderMock
        })
      });

      // Execute the test
      const result = await tagRepo.getAllTags();
      
      // Assert the results
      expect(selectMock).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe("test-tag");
      expect(result.error).toBeNull();
    });

    test("getTagById returns a specific tag", async () => {
      // Prepare mock data and response
      const singleResult = createSuccessResponse(mockTag);
      
      // Mock implementation
      const repository = (tagRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup mock chain
      selectMock.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue(singleResult)
        })
      });

      // Execute test
      const result = await tagRepo.getTagById("tag-1");
      
      // Assert results
      expect(selectMock).toHaveBeenCalled();
      expect(result.data?.id).toBe("tag-1");
      expect(result.data?.name).toBe("test-tag");
    });

    test("findTagByName finds a tag by name", async () => {
      // Prepare mock data and response
      const singleResult = createSuccessResponse(mockTag);
      
      // Mock implementation
      const repository = (tagRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup mock chain
      selectMock.mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue(singleResult)
        })
      });

      // Execute test
      const result = await tagRepo.findTagByName("test-tag");
      
      // Assert results
      expect(selectMock).toHaveBeenCalled();
      expect(result.data?.name).toBe("test-tag");
    });
  });

  describe("TagAssignmentRepository", () => {
    let tagAssignmentRepo: ReturnType<typeof createTagAssignmentRepository>;
    
    beforeEach(() => {
      tagAssignmentRepo = createTagAssignmentRepository();
    });

    test("getTagAssignmentsForEntity returns assignments for entity", async () => {
      // Prepare mock data and response
      const assignmentsResult = createSuccessResponse([mockAssignments[0]]);
      
      // Mock implementation
      const repository = (tagAssignmentRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup mock chain
      selectMock.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(assignmentsResult)
          })
        })
      });

      // Execute test
      const entityId = "entity-1";
      const entityType = EntityType.PERSON;
      const result = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
      
      // Assert results
      expect(selectMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].target_id).toBe("entity-1");
      expect(result[0].target_type).toBe(EntityType.PERSON);
    });

    test("createTagAssignment creates a new tag assignment", async () => {
      const newAssignment: Partial<TagAssignment> = {
        tag_id: "tag-3",
        target_id: "entity-3",
        target_type: EntityType.PERSON
      };
      
      const createdAssignment = {
        ...newAssignment,
        id: "new-assignment",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Prepare mock response
      const insertResult = createSuccessResponse([createdAssignment]);
      
      // Mock implementation
      const repository = (tagAssignmentRepo as any).repository;
      const insertMock = jest.spyOn(repository, "insert");
      
      // Setup mock chain
      insertMock.mockReturnValue({
        execute: jest.fn().mockResolvedValue(insertResult)
      });

      // Execute test
      const result = await tagAssignmentRepo.createTagAssignment(newAssignment);
      
      // Assert results
      expect(insertMock).toHaveBeenCalledWith(newAssignment);
      expect(result.id).toBe("new-assignment");
      expect(result.tag_id).toBe("tag-3");
    });
  });

  describe("TagEntityTypeRepository", () => {
    let tagEntityTypeRepo: ReturnType<typeof createTagEntityTypeRepository>;
    
    beforeEach(() => {
      tagEntityTypeRepo = createTagEntityTypeRepository();
    });

    test("isTagAllowedForEntityType checks if tag is allowed for entity type", async () => {
      // Prepare mock data and response
      const entityTypesResult = createSuccessResponse([mockEntityTypes[0]]);
      
      // Mock implementation
      const repository = (tagEntityTypeRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup mock chain
      selectMock.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(entityTypesResult)
          })
        })
      });

      // Execute test
      const result = await tagEntityTypeRepo.isTagAllowedForEntityType("tag-1", EntityType.PERSON);
      
      // Assert results
      expect(selectMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("getTagEntityTypesByTagId returns entity types for a tag", async () => {
      // Prepare mock data and response
      const entityTypesResult = createSuccessResponse([mockEntityTypes[0], mockEntityTypes[1]]);
      
      // Mock implementation
      const repository = (tagEntityTypeRepo as any).repository;
      const selectMock = jest.spyOn(repository, "select");
      
      // Setup mock chain
      selectMock.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue(entityTypesResult)
        })
      });

      // Execute test
      const result = await tagEntityTypeRepo.getTagEntityTypesByTagId("tag-1");
      
      // Assert results
      expect(selectMock).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].entity_type).toBe(EntityType.PERSON);
      expect(result[1].entity_type).toBe(EntityType.ORGANIZATION);
    });
  });
});
