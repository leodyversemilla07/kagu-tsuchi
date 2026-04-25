import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { Agent3Service } from "./agent3.service";

describe("Agent3Service", () => {
  let service: Agent3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Agent3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (_key: string, defaultValue?: string) => defaultValue ?? null
            ),
          },
        },
      ],
    }).compile();

    service = module.get<Agent3Service>(Agent3Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("synthesize", () => {
    it("should return follow-up report for unclarified queries", async () => {
      const input = {
        queryAnalysis: {
          originalQuery: "AI",
          clarified: false,
          followUpQuestions: ["What specific area?", "What timeframe?"],
          searchPlan: { queries: [], maxSearches: 5, priorityDomains: [] },
          timestamp: new Date(),
        },
        searchResults: null,
      };

      const result = await service.synthesize(input);

      expect(result.report).toContain("Follow-up Needed");
      expect(result.report).toContain("clarifying questions");
    });

    it("should return deterministic report when no LLM configured", async () => {
      const input = {
        queryAnalysis: {
          originalQuery: "What is React",
          clarified: true,
          followUpQuestions: [],
          searchPlan: {
            queries: ["What is React"],
            maxSearches: 5,
            priorityDomains: [],
          },
          timestamp: new Date(),
        },
        searchResults: {
          sufficient: true,
          deepThinkUsed: false,
          results: [
            {
              title: "React Documentation",
              url: "https://react.dev",
              snippet: "React is a JavaScript library",
              score: 0.9,
            },
          ],
          metadata: {
            totalSearches: 1,
            queriesUsed: [],
            deepThinkTriggered: false,
          },
        },
      };

      const result = await service.synthesize(input);

      expect(result.report).toContain("Research Report");
      expect(result.report).toContain("What is React");
      expect(result.citations).toContain("https://react.dev");
    });

    it("should include memory context in report", async () => {
      const input = {
        queryAnalysis: {
          originalQuery: "What is TypeScript",
          clarified: true,
          followUpQuestions: [],
          searchPlan: {
            queries: ["What is TypeScript"],
            maxSearches: 5,
            priorityDomains: [],
          },
          timestamp: new Date(),
        },
        searchResults: {
          sufficient: true,
          deepThinkUsed: false,
          results: [],
          metadata: {
            totalSearches: 0,
            queriesUsed: [],
            deepThinkTriggered: false,
          },
        },
        memories: [
          {
            id: "mem_1",
            query: "Previous search",
            searchPlan: { queries: [], maxSearches: 5, priorityDomains: [] },
            results: [],
            timestamp: new Date("2024-01-01"),
          },
        ],
      };

      const result = await service.synthesize(input);

      expect(result.report).toContain("Related Memory");
      expect(result.report).toContain("Previous search");
    });

    it("should handle empty search results gracefully", async () => {
      const input = {
        queryAnalysis: {
          originalQuery: "Unknown topic xyz",
          clarified: true,
          followUpQuestions: [],
          searchPlan: {
            queries: ["Unknown topic xyz"],
            maxSearches: 5,
            priorityDomains: [],
          },
          timestamp: new Date(),
        },
        searchResults: {
          sufficient: false,
          deepThinkUsed: false,
          results: [],
          metadata: {
            totalSearches: 0,
            queriesUsed: [],
            deepThinkTriggered: false,
          },
        },
      };

      const result = await service.synthesize(input);

      expect(result.report).toContain("No search results were returned");
    });
  });
});
