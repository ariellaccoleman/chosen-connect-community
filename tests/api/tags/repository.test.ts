
import { Tag, TagAssignment, TagEntityType } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { 
  createTagRepository, 
  createTagAssignmentRepository, 
  createTagEntityTypeRepository 
} from "@/api/tags/repository";
import { createMockRepository } from "@/api/core/repository/MockRepository";

jest.mock("@/api/core/repository/repositoryFactory", () => ({
  createSupabaseRepository: jest.fn(() => createMockRepository("mock_table"))
}));

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {}
}));

describe("Tag Repository Tests", () => {
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

  describe("TagRepository", () => {
    const tagRepo = createTagRepository();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("getAllTags returns all tags", async () => {
      // Mock the repository to return our test data
      const mockRepo = createMockRepository<Tag>("tags", mockTags);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        order: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue({ data: mockTags, error: null })
        })
      } as any);

      // Replace the tagRepo's repository with our mock
      (tagRepo as any).repository = mockRepo;

      const result = await tagRepo.getAllTags();
      
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe("test-tag");
      expect(result.error).toBeNull();
    });

    test("getTagById returns a specific tag", async () => {
      const mockRepo = createMockRepository<Tag>("tags", mockTags);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: mockTag, error: null })
        })
      } as any);

      (tagRepo as any).repository = mockRepo;

      const result = await tagRepo.getTagById("tag-1");
      
      expect(result.data?.id).toBe("tag-1");
      expect(result.data?.name).toBe("test-tag");
    });

    test("findTagByName finds a tag by name", async () => {
      const mockRepo = createMockRepository<Tag>("tags", mockTags);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: mockTag, error: null })
        })
      } as any);

      (tagRepo as any).repository = mockRepo;

      const result = await tagRepo.findTagByName("test-tag");
      
      expect(result.data?.name).toBe("test-tag");
    });
  });

  describe("TagAssignmentRepository", () => {
    const tagAssignmentRepo = createTagAssignmentRepository();
    
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("getTagAssignmentsForEntity returns assignments for entity", async () => {
      const mockRepo = createMockRepository<TagAssignment>("tag_assignments", mockAssignments);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ data: [mockAssignments[0]], error: null })
      } as any);

      (tagAssignmentRepo as any).repository = mockRepo;

      const entityId = "entity-1";
      const entityType = EntityType.PERSON;
      const result = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
      
      expect(result).toHaveLength(1);
      expect(result[0].target_id).toBe("entity-1");
      expect(result[0].target_type).toBe(EntityType.PERSON);
    });

    test("createTagAssignment creates a new tag assignment", async () => {
      const mockRepo = createMockRepository<TagAssignment>("tag_assignments");
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

      jest.spyOn(mockRepo, "insert").mockReturnValue({
        execute: jest.fn().mockResolvedValue({ data: [createdAssignment], error: null })
      } as any);

      (tagAssignmentRepo as any).repository = mockRepo;

      const result = await tagAssignmentRepo.createTagAssignment(newAssignment);
      
      expect(result.id).toBe("new-assignment");
      expect(result.tag_id).toBe("tag-3");
    });
  });

  describe("TagEntityTypeRepository", () => {
    const tagEntityTypeRepo = createTagEntityTypeRepository();
    
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("isTagAllowedForEntityType checks if tag is allowed for entity type", async () => {
      const mockRepo = createMockRepository<TagEntityType>("tag_entity_types", mockEntityTypes);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ data: [mockEntityTypes[0]], error: null })
      } as any);

      (tagEntityTypeRepo as any).repository = mockRepo;

      const result = await tagEntityTypeRepo.isTagAllowedForEntityType("tag-1", EntityType.PERSON);
      
      expect(result).toBe(true);
    });

    test("getTagEntityTypesByTagId returns entity types for a tag", async () => {
      const mockRepo = createMockRepository<TagEntityType>("tag_entity_types", mockEntityTypes);
      jest.spyOn(mockRepo, "select").mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ 
          data: [mockEntityTypes[0], mockEntityTypes[1]], 
          error: null 
        })
      } as any);

      (tagEntityTypeRepo as any).repository = mockRepo;

      const result = await tagEntityTypeRepo.getTagEntityTypesByTagId("tag-1");
      
      expect(result).toHaveLength(2);
      expect(result[0].entity_type).toBe(EntityType.PERSON);
      expect(result[1].entity_type).toBe(EntityType.ORGANIZATION);
    });
  });
});
