/* biome-ignore-all lint/suspicious/noExplicitAny: Testing private methods requires `as any` casts */
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { Agent2Service } from "./agent2.service";

describe("Agent2Service", () => {
  let service: Agent2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Agent2Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "EXA_API_KEY") return "test-key";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<Agent2Service>(Agent2Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("evaluateResults", () => {
    it("should return false for fewer than 3 results", () => {
      const results = [
        { url: "https://example.com", title: "A", snippet: "a" },
        { url: "https://example.com/2", title: "B", snippet: "b" },
      ];
      expect((service as any).evaluateResults(results)).toBe(false);
    });

    it("should return false when no authoritative sources exist", () => {
      const results = [
        { url: "https://random-blog.com/post", title: "A", snippet: "a" },
        { url: "https://another-site.com/page", title: "B", snippet: "b" },
        { url: "https://random-blog.com/post2", title: "C", snippet: "c" },
      ];
      expect((service as any).evaluateResults(results)).toBe(false);
    });

    it("should return true when github.com source exists", () => {
      const results = [
        { url: "https://example.com", title: "A", snippet: "a" },
        { url: "https://example.com/2", title: "B", snippet: "b" },
        { url: "https://github.com/user/repo", title: "C", snippet: "c" },
      ];
      expect((service as any).evaluateResults(results)).toBe(true);
    });

    it("should return true when stackoverflow.com source exists", () => {
      const results = [
        { url: "https://example.com", title: "A", snippet: "a" },
        { url: "https://example.com/2", title: "B", snippet: "b" },
        {
          url: "https://stackoverflow.com/questions/12345",
          title: "C",
          snippet: "c",
        },
      ];
      expect((service as any).evaluateResults(results)).toBe(true);
    });

    it("should return true when docs. source exists", () => {
      const results = [
        { url: "https://example.com", title: "A", snippet: "a" },
        { url: "https://example.com/2", title: "B", snippet: "b" },
        { url: "https://docs.python.org/3/", title: "C", snippet: "c" },
      ];
      expect((service as any).evaluateResults(results)).toBe(true);
    });

    it("should return true when wikipedia.org source exists", () => {
      const results = [
        { url: "https://example.com", title: "A", snippet: "a" },
        { url: "https://example.com/2", title: "B", snippet: "b" },
        {
          url: "https://en.wikipedia.org/wiki/React",
          title: "C",
          snippet: "c",
        },
      ];
      expect((service as any).evaluateResults(results)).toBe(true);
    });

    it("should return true when both count and authoritative sources are met", () => {
      const results = [
        { url: "https://blog.example.com/post", title: "A", snippet: "a" },
        { url: "https://medium.com/article", title: "B", snippet: "b" },
        { url: "https://github.com/org/project", title: "C", snippet: "c" },
        { url: "https://dev.to/tutorial", title: "D", snippet: "d" },
      ];
      expect((service as any).evaluateResults(results)).toBe(true);
    });
  });

  describe("deduplicateResults", () => {
    it("should remove duplicate URLs", () => {
      const results = [
        { url: "https://example.com/a", title: "A", snippet: "a", score: 0.9 },
        { url: "https://example.com/b", title: "B", snippet: "b", score: 0.7 },
        {
          url: "https://example.com/a",
          title: "A dup",
          snippet: "a2",
          score: 0.5,
        },
      ];
      const deduped = (service as any).deduplicateResults(results);
      expect(deduped).toHaveLength(2);
      expect(deduped.map((r: any) => r.url)).toEqual([
        "https://example.com/a",
        "https://example.com/b",
      ]);
    });

    it("should sort by score descending", () => {
      const results = [
        { url: "https://a.com", title: "Low", snippet: "", score: 0.3 },
        { url: "https://b.com", title: "High", snippet: "", score: 0.9 },
        { url: "https://c.com", title: "Mid", snippet: "", score: 0.6 },
      ];
      const deduped = (service as any).deduplicateResults(results);
      expect(deduped.map((r: any) => r.url)).toEqual([
        "https://b.com",
        "https://c.com",
        "https://a.com",
      ]);
    });

    it("should handle results without scores", () => {
      const results = [
        { url: "https://a.com", title: "A", snippet: "" },
        { url: "https://b.com", title: "B", snippet: "" },
      ];
      const deduped = (service as any).deduplicateResults(results);
      expect(deduped).toHaveLength(2);
    });

    it("should return empty array for empty input", () => {
      const deduped = (service as any).deduplicateResults([]);
      expect(deduped).toHaveLength(0);
    });
  });
});
