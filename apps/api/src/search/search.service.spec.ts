import { Test, type TestingModule } from "@nestjs/testing";
import { Agent1Service } from "../agent1/agent1.service";
import { QueryDto } from "../agent1/dto/query.dto";
import { Agent2Service } from "../agent2/agent2.service";
import { Agent3Service } from "../agent3/agent3.service";
import { MemoryService } from "../memory/memory.service";
import { SearchService } from "./search.service";

describe("SearchService", () => {
  let searchService: SearchService;
  let agent1Service: Agent1Service;
  let agent2Service: Agent2Service;
  let agent3Service: Agent3Service;
  let memoryService: MemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: Agent1Service,
          useValue: {
            analyzeQuery: jest.fn().mockResolvedValue({
              originalQuery: "test query",
              clarified: true,
              followUpQuestions: [],
              searchPlan: {
                queries: ["test query"],
                maxSearches: 5,
                priorityDomains: ["github.com"],
              },
              timestamp: new Date(),
            }),
          },
        },
        {
          provide: Agent2Service,
          useValue: {
            executeSearch: jest.fn().mockResolvedValue({
              sufficient: true,
              deepThinkUsed: false,
              results: [
                {
                  title: "Result",
                  url: "https://example.com",
                  snippet: "Test result",
                },
              ],
              metadata: {
                totalSearches: 1,
                queriesUsed: [],
                deepThinkTriggered: false,
              },
            }),
          },
        },
        {
          provide: Agent3Service,
          useValue: {
            synthesize: jest.fn().mockResolvedValue({
              report: "# Research Report\n\nTest report content",
              citations: ["https://example.com"],
              generatedAt: new Date(),
            }),
          },
        },
        {
          provide: MemoryService,
          useValue: {
            retrieve: jest.fn().mockResolvedValue([]),
            store: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    searchService = module.get<SearchService>(SearchService);
    agent1Service = module.get<Agent1Service>(Agent1Service);
    agent2Service = module.get<Agent2Service>(Agent2Service);
    agent3Service = module.get<Agent3Service>(Agent3Service);
    memoryService = module.get<MemoryService>(MemoryService);
  });

  it("should be defined", () => {
    expect(searchService).toBeDefined();
  });

  describe("conductResearch", () => {
    it("should orchestrate the full pipeline", async () => {
      const dto: QueryDto = { query: "test query" };

      const result = await searchService.conductResearch(dto);

      expect(agent1Service.analyzeQuery).toHaveBeenCalledWith(dto);
      expect(agent2Service.executeSearch).toHaveBeenCalled();
      expect(agent3Service.synthesize).toHaveBeenCalled();
      expect(result.queryAnalysis).toBeDefined();
      expect(result.report).toContain("Research Report");
      expect(result.searchResults).toBeDefined();
    });

    it("should retrieve memories before search", async () => {
      const dto: QueryDto = { query: "test", userId: "user1" };

      await searchService.conductResearch(dto);

      expect(memoryService.retrieve).toHaveBeenCalledWith("test", "user1", 3);
    });

    it("should store research in memory when sufficient", async () => {
      const dto: QueryDto = { query: "test query" };

      await searchService.conductResearch(dto);

      expect(memoryService.store).toHaveBeenCalled();
    });

    it("should return report from Agent3", async () => {
      const dto: QueryDto = { query: "test query" };

      const result = await searchService.conductResearch(dto);

      expect(result.report).toBe("# Research Report\n\nTest report content");
    });

    it("should return citations from Agent3", async () => {
      const dto: QueryDto = { query: "test query" };

      const result = await searchService.conductResearch(dto);

      expect(result.citations).toContain("https://example.com");
    });

    it("should handle unclarified queries without searching", async () => {
      (agent1Service.analyzeQuery as jest.Mock).mockResolvedValueOnce({
        originalQuery: "AI",
        clarified: false,
        followUpQuestions: ["What specific area?"],
        searchPlan: { queries: [], maxSearches: 5, priorityDomains: [] },
        timestamp: new Date(),
      });

      (agent3Service.synthesize as jest.Mock).mockResolvedValueOnce({
        report: "# Follow-up Needed\n\nPlease clarify your query",
        citations: [],
        generatedAt: new Date(),
      });

      const dto: QueryDto = { query: "AI" };

      const result = await searchService.conductResearch(dto);

      expect(agent2Service.executeSearch).not.toHaveBeenCalled();
      expect(result.searchResults).toBeNull();
      expect(result.report).toContain("Follow-up Needed");
    });
  });
});
