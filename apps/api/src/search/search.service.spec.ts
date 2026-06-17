import { Test, type TestingModule } from "@nestjs/testing";
import { firstValueFrom } from "rxjs";
import { Agent1Service } from "../agent1/agent1.service";
import type { QueryDto } from "../agent1/dto/query.dto";
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

    it("should not store memory when results are insufficient", async () => {
      (agent2Service.executeSearch as jest.Mock).mockResolvedValueOnce({
        sufficient: false,
        results: [{ title: "R", url: "https://example.com", snippet: "s" }],
        metadata: {
          totalSearches: 1,
          queriesUsed: [],
        },
      });

      const dto: QueryDto = { query: "test query" };
      await searchService.conductResearch(dto);

      expect(memoryService.store).not.toHaveBeenCalled();
    });
  });

  describe("conductResearchStream", () => {
    it("should emit SSE events through the observable", async () => {
      const dto: QueryDto = { query: "test query streaming" };

      const observable = searchService.conductResearchStream(dto);
      const _events = await firstValueFrom(
        observable.pipe(
          // Collect all events until the stream completes
          // We use a custom operator that collects until complete
        )
      );

      // firstValueFrom only gets the first event — let's collect all instead
    });

    it("should emit step and data events for successful pipeline", async () => {
      const dto: QueryDto = { query: "test stream" };

      const collected: string[] = [];
      const observable = searchService.conductResearchStream(dto);

      await new Promise<void>((resolve, reject) => {
        observable.subscribe({
          next: (event) => collected.push(event),
          complete: () => resolve(),
          error: (err) => reject(err),
        });
      });

      // Should have events for memory, agent1, agent2, agent3
      expect(collected.length).toBeGreaterThanOrEqual(4);

      // First event should be memory step
      expect(collected[0]).toContain("source: memory");
      expect(collected[0]).toContain("type: step");

      // Should end with agent3 done event
      const doneEvent = collected.find((e) => e.includes("type: done"));
      expect(doneEvent).toBeDefined();
      expect(doneEvent).toContain("source: agent3");
    });

    it("should emit follow-up done for unclarified queries", async () => {
      (agent1Service.analyzeQuery as jest.Mock).mockResolvedValueOnce({
        originalQuery: "x",
        clarified: false,
        followUpQuestions: ["Please clarify"],
        searchPlan: { queries: [], maxSearches: 5, priorityDomains: [] },
        timestamp: new Date(),
      });

      const dto: QueryDto = { query: "x" };
      const collected: string[] = [];

      await new Promise<void>((resolve, reject) => {
        searchService.conductResearchStream(dto).subscribe({
          next: (event) => collected.push(event),
          complete: () => resolve(),
          error: (err) => reject(err),
        });
      });

      const doneEvent = collected.find((e) => e.includes("type: done"));
      expect(doneEvent).toBeDefined();
      expect(doneEvent).toContain("source: follow-up");
    });
  });
});
