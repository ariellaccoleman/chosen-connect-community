
import { Tag, TagAssignment, TagEntityType } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { 
  createTagRepository, 
  createTagAssignmentRepository, 
  createTagEntityTypeRepository 
} from "@/api/tags/repository";
import { createMockRepository } from "@/api/core/repository/MockRepository";
import { createSuccessResponse } from "@/api/core/errorHandler";
import { DataRepository } from "@/api/core/repository/DataRepository";

// Mock the repository factory
jest.mock("@/api/core/repository/repositoryFactory", () => ({
  createSupabaseRepository: jest.fn((tableName) => {
    // Return specific mock repositories based on table name
    switch (tableName) {
      case "tags":
        return createMockRepository("tags", mockTags);
      case "tag_assignments":
        return createMockRepository("tag_assignments", mockAssignments);
      case "tag_entity_types":
        return createMockRepository("tag_entity_types", mockEntityTypes);
      default:
        return createMockRepository(tableName);
    }
  })
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {}
}));

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

describe("Tag Repository Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TagRepository", () => {
    let tagRepo: ReturnType<typeof createTagRepository>;

    beforeEach(() => {
      tagRepo = createTagRepository();
    });

    test("getAllTags returns all tags", async () => {
      // Setup mock execution chain
      const executeMock = jest.fn().mockResolvedValue({ data: mockTags, error: null });
      const orderMock = jest.fn().mockReturnValue({ execute: executeMock });
      
      // Use the actual repository from the created instance
      const repository = (tagRepo as any).repository as DataRepository<Tag>;
      
      // Mock the chain of method calls
      jest.spyOn(repository, "select").mockReturnValue({
        order: orderMock
      } as any);

      const result = await tagRepo.getAllTags();
      
      expect(repository.select).toHaveBeenCalled();
      expect(orderMock).toHaveBeenCalledWith('name', { ascending: true });
      expect(executeMock).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe("test-tag");
      expect(result.error).toBeNull();
    });

    test("getTagById returns a specific tag", async () => {
      // Setup mock execution chain
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockTag, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      
      // Use the actual repository from the created instance
      const repository = (tagRepo as any).repository as DataRepository<Tag>;
      
      // Mock the chain of method calls
      jest.spyOn(repository, "select").mockReturnValue({
        eq: eqMock
      } as any);

      const result = await tagRepo.getTagById("tag-1");
      
      expect(repository.select).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'tag-1');
      expect(maybeSingleMock).toHaveBeenCalled();
      expect(result.data?.id).toBe("tag-1");
      expect(result.data?.name).toBe("test-tag");
    });

    test("findTagByName finds a tag by name", async () => {
      // Setup mock execution chain
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockTag, error: null });
      const ilikeMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      
      // Use the actual repository from the created instance
      const repository = (tagRepo as any).repository as DataRepository<Tag>;
      
      // Mock the chain of method calls
      jest.spyOn(repository, "select").mockReturnValue({
        ilike: ilikeMock
      } as any);

      const result = await tagRepo.findTagByName("test-tag");
      
      expect(repository.select).toHaveBeenCalled();
      expect(ilikeMock).toHaveBeenCalledWith('name', "test-tag");
      expect(maybeSingleMock).toHaveBeenCalled();
      expect(result.data?.name).toBe("test-tag");
    });
  });

  describe("TagAssignmentRepository", () => {
    let tagAssignmentRepo: ReturnType<typeof createTagAssignmentRepository>;
    
    beforeEach(() => {
      tagAssignmentRepo = createTagAssignmentRepository();
    });

    test("getTagAssignmentsForEntity returns assignments for entity", async () => {
      // Setup mock execution chain
      const executeMock = jest.fn().mockResolvedValue({ 
        data: [mockAssignments[0]], 
        error: null 
      });
      
      // Use the actual repository from the created instance
      const repository = (tagAssignmentRepo as any).repository as DataRepository<TagAssignment>;
      
      // Mock the chain of method calls with proper this context chaining
      const eqReturnValue = {
        eq: jest.fn().mockReturnValue({
          execute: executeMock
        }),
        execute: executeMock
      };
      
      jest.spyOn(repository, "select").mockReturnValue(eqReturnValue as any);

      const entityId = "entity-1";
      const entityType = EntityType.PERSON;
      const result = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
      
      expect(repository.select).toHaveBeenCalled();
      expect(eqReturnValue.eq).toHaveBeenCalledWith('target_type', entityType);
      expect(executeMock).toHaveBeenCalled();
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

      // Setup mock execution chain
      const executeMock = jest.fn().mockResolvedValue({ 
        data: [createdAssignment], 
        error: null 
      });
      
      // Use the actual repository from the created instance
      const repository = (tagAssignmentRepo as any).repository as DataRepository<TagAssignment>;
      
      // Mock insert with proper execute function
      jest.spyOn(repository, "insert").mockReturnValue({
        execute: executeMock
      } as any);

      const result = await tagAssignmentRepo.createTagAssignment(newAssignment);
      
      expect(repository.insert).toHaveBeenCalledWith(newAssignment);
      expect(executeMock).toHaveBeenCalled();
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
      // Setup mock execution chain
      const executeMock = jest.fn().mockResolvedValue({ 
        data: [mockEntityTypes[0]], 
        error: null 
      });
      
      // Use the actual repository from the created instance
      const repository = (tagEntityTypeRepo as any).repository as DataRepository<TagEntityType>;
      
      // Mock the chain of method calls with proper this context chaining
      const eqReturnValue = {
        eq: jest.fn().mockReturnValue({
          execute: executeMock
        }),
        execute: executeMock
      };
      
      jest.spyOn(repository, "select").mockReturnValue(eqReturnValue as any);

      const result = await tagEntityTypeRepo.isTagAllowedForEntityType("tag-1", EntityType.PERSON);
      
      expect(repository.select).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(executeMock).toHaveBeenCalled();
    });

    test("getTagEntityTypesByTagId returns entity types for a tag", async () => {
      // Setup mock execution chain
      const executeMock = jest.fn().mockResolvedValue({ 
        data: [mockEntityTypes[0], mockEntityTypes[1]], 
        error: null 
      });
      
      // Use the actual repository from the created instance
      const repository = (tagEntityTypeRepo as any).repository as DataRepository<TagEntityType>;
      
      // Mock the chain of method calls with proper this context chaining
      const eqReturnValue = {
        eq: jest.fn().mockReturnValue({
          execute: executeMock
        }),
        execute: executeMock
      };
      
      jest.spyOn(repository, "select").mockReturnValue(eqReturnValue as any);

      const result = await tagEntityTypeRepo.getTagEntityTypesByTagId("tag-1");
      
      expect(repository.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].entity_type).toBe(EntityType.PERSON);
      expect(result[1].entity_type).toBe(EntityType.ORGANIZATION);
      expect(executeMock).toHaveBeenCalled();
    });
  });
});
