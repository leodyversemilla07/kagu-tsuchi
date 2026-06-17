import { Test, type TestingModule } from "@nestjs/testing";
import { Agent1Service } from "./agent1.service";
import type { QueryDto } from "./dto/query.dto";

describe("Agent1Service", () => {
  let service: Agent1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Agent1Service],
    }).compile();

    service = module.get<Agent1Service>(Agent1Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("analyzeQuery", () => {
    it("should return clarified=true for meaningful multi-word queries", async () => {
      const dto: QueryDto = { query: "What are the latest AI frameworks?" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(true);
      expect(result.originalQuery).toBe(dto.query);
      expect(result.searchPlan).toBeDefined();
      expect(result.searchPlan.queries.length).toBeGreaterThanOrEqual(1);
      expect(result.searchPlan.queries[0]).toBe(dto.query);
    });

    it("should return clarified=false for single stop-word queries", async () => {
      const dto: QueryDto = { query: "the" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(false);
      expect(result.followUpQuestions).toBeDefined();
      expect(result.followUpQuestions?.length).toBeGreaterThan(0);
    });

    it("should return clarified=false for single non-descriptive word", async () => {
      const dto: QueryDto = { query: "AI" };
      const result = await service.analyzeQuery(dto);

      // "AI" is 1 meaningful word (< 2), so not clarified
      expect(result.clarified).toBe(false);
    });

    it("should return clarified=true for 3+ word queries even without question mark", async () => {
      const dto: QueryDto = { query: "React hooks tutorial basics" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(true);
    });

    it("should respect maxSearches parameter", async () => {
      const dto: QueryDto = {
        query: "What are the latest AI agent frameworks?",
        maxSearches: 2,
      };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.queries.length).toBeLessThanOrEqual(2);
      expect(result.searchPlan.maxSearches).toBe(2);
    });

    it("should include github.com and stackoverflow.com as default priority domains", async () => {
      const dto: QueryDto = { query: "How to use React hooks" };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.priorityDomains).toContain("github.com");
      expect(result.searchPlan.priorityDomains).toContain("stackoverflow.com");
    });

    it("should include the original query as the first search query", async () => {
      const dto: QueryDto = { query: "What is TypeScript" };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.queries[0]).toBe("What is TypeScript");
    });

    it("should generate how-to variations for how-to queries", async () => {
      const dto: QueryDto = { query: "How to use React hooks" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(true);
      // Should include best practices or example variant
      const hasVariant = result.searchPlan.queries.some(
        (q) => q.includes("best practices") || q.includes("example")
      );
      expect(hasVariant).toBe(true);
    });

    it("should generate comparison variations for what-is queries", async () => {
      const dto: QueryDto = { query: "What is React" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(true);
      const hasVariant = result.searchPlan.queries.some(
        (q) => q.includes("vs alternatives") || q.includes("pros and cons")
      );
      expect(hasVariant).toBe(true);
    });

    it("should detect domain-specific priority sources for known technologies", async () => {
      const dto: QueryDto = { query: "How to use TypeScript generics" };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.priorityDomains).toContain("typescriptlang.org");
    });

    it("should generate domain-specific follow-up for single-word queries", async () => {
      const dto: QueryDto = { query: "React" };
      const result = await service.analyzeQuery(dto);

      // Single meaningful word → not clarified, with contextual follow-up
      expect(result.clarified).toBe(false);
      expect(result.followUpQuestions?.some((q) => q.includes("React"))).toBe(
        true
      );
    });

    it("should include a timestamp", async () => {
      const dto: QueryDto = { query: "test query here" };
      const result = await service.analyzeQuery(dto);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
