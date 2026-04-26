import { Test, type TestingModule } from "@nestjs/testing";
import { MemoryService } from "./memory.service";

describe("MemoryService", () => {
  let service: MemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryService],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  afterEach(async () => {
    await service.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("store", () => {
    it("should store a memory", async () => {
      const memory = {
        id: "mem_1",
        userId: "user1",
        query: "What is React",
        searchPlan: { queries: ["React"], maxSearches: 5, priorityDomains: [] },
        results: [],
        report: "# React Report",
        timestamp: new Date(),
      };

      await service.store(memory);

      const results = await service.getByUserId("user1");
      expect(results).toHaveLength(1);
      expect(results[0].query).toBe("What is React");
    });

    it("should store memory without userId", async () => {
      const memory = {
        id: "mem_2",
        query: "What is TypeScript",
        searchPlan: {
          queries: ["TypeScript"],
          maxSearches: 5,
          priorityDomains: [],
        },
        results: [],
        report: "# TypeScript Report",
        timestamp: new Date(),
      };

      await service.store(memory);

      const results = await service.retrieve("TypeScript");
      expect(results).toHaveLength(1);
    });
  });

  describe("retrieve", () => {
    it("should retrieve memories by keyword", async () => {
      await service.store({
        id: "mem_1",
        userId: "user1",
        query: "What is React hooks",
        searchPlan: {
          queries: ["React hooks"],
          maxSearches: 5,
          priorityDomains: [],
        },
        results: [],
        report: "# React Report",
        timestamp: new Date(),
      });

      const results = await service.retrieve("React");
      expect(results).toHaveLength(1);
      expect(results[0].memories[0].query).toContain("React");
    });

    it("should respect limit parameter", async () => {
      for (let i = 0; i < 10; i++) {
        await service.store({
          id: `mem_${i}`,
          userId: "user1",
          query: `Query ${i}`,
          searchPlan: {
            queries: [`Query ${i}`],
            maxSearches: 5,
            priorityDomains: [],
          },
          results: [],
          report: "# Report",
          timestamp: new Date(),
        });
      }

      const results = await service.retrieve("Query", "user1", 3);
      expect(results).toHaveLength(3);
    });

    it("should return empty for no matches", async () => {
      const results = await service.retrieve("nonexistent");
      expect(results).toHaveLength(0);
    });

    it("should filter by userId when user exists", async () => {
      await service.store({
        id: "mem_1",
        userId: "user1",
        query: "User1 query",
        searchPlan: { queries: ["User1"], maxSearches: 5, priorityDomains: [] },
        results: [],
        report: "# Report",
        timestamp: new Date(),
      });

      await service.store({
        id: "mem_2",
        userId: "user2",
        query: "User2 query",
        searchPlan: { queries: ["User2"], maxSearches: 5, priorityDomains: [] },
        results: [],
        report: "# Report",
        timestamp: new Date(),
      });

      const results = await service.retrieve("query", "user1");
      expect(results).toHaveLength(1);
      expect(results[0].memories[0].userId).toBe("user1");
    });
  });

  describe("getByUserId", () => {
    it("should return memories for user", async () => {
      await service.store({
        id: "mem_1",
        userId: "user1",
        query: "React",
        searchPlan: { queries: ["React"], maxSearches: 5, priorityDomains: [] },
        results: [],
        report: "# React",
        timestamp: new Date(),
      });

      const results = await service.getByUserId("user1");
      expect(results).toHaveLength(1);
    });

    it("should return empty for unknown user", async () => {
      const results = await service.getByUserId("unknown");
      expect(results).toHaveLength(0);
    });
  });

  describe("clear", () => {
    it("should clear all memories", async () => {
      await service.store({
        id: "mem_1",
        query: "Test",
        searchPlan: { queries: ["Test"], maxSearches: 5, priorityDomains: [] },
        results: [],
        report: "# Test",
        timestamp: new Date(),
      });

      await service.clear();

      const results = await service.retrieve("Test");
      expect(results).toHaveLength(0);
    });
  });
});
