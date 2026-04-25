import { Test, type TestingModule } from "@nestjs/testing";
import { Agent1Service } from "./agent1.service";
import { QueryDto } from "./dto/query.dto";

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
    it("should return clarified=true for queries with 3+ words", async () => {
      const dto: QueryDto = { query: "What are the latest AI frameworks?" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(true);
      expect(result.originalQuery).toBe(dto.query);
      expect(result.searchPlan).toBeDefined();
      expect(result.searchPlan.queries).toHaveLength(3);
    });

    it("should return clarified=false for short queries", async () => {
      const dto: QueryDto = { query: "AI" };
      const result = await service.analyzeQuery(dto);

      expect(result.clarified).toBe(false);
      expect(result.followUpQuestions).toBeDefined();
      expect(result.followUpQuestions).toHaveLength(2);
    });

    it("should respect maxSearches parameter", async () => {
      const dto: QueryDto = {
        query: "What are the latest AI agent frameworks?",
        maxSearches: 2,
      };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.queries).toHaveLength(2);
      expect(result.searchPlan.maxSearches).toBe(2);
    });

    it("should include priority domains", async () => {
      const dto: QueryDto = { query: "How to use React hooks" };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.priorityDomains).toContain("github.com");
      expect(result.searchPlan.priorityDomains).toContain("stackoverflow.com");
      expect(result.searchPlan.priorityDomains).toContain("docs.org");
    });

    it("should limit queries to maxSearches", async () => {
      const dto: QueryDto = { query: "Learn React hooks", maxSearches: 1 };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.queries).toHaveLength(1);
    });

    it("should include original query in queries", async () => {
      const dto: QueryDto = { query: "What is TypeScript" };
      const result = await service.analyzeQuery(dto);

      expect(result.searchPlan.queries).toContain("What is TypeScript");
    });
  });
});
