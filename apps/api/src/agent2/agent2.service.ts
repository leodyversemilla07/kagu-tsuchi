import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Exa } from "exa-js";
import { SearchQueryDto } from "./dto/search.dto";
import {
  SearchExecutionResult,
  SearchResult,
} from "./interfaces/search-result.interface";

@Injectable()
export class Agent2Service {
  private readonly logger = new Logger(Agent2Service.name);
  private exa: Exa;

  constructor(private configService: ConfigService) {
    const exaApiKey = this.configService.get<string>("EXA_API_KEY");

    if (!exaApiKey) {
      throw new Error("EXA_API_KEY is required to initialize Agent2Service");
    }

    this.exa = new Exa(exaApiKey);
  }

  async executeSearch(
    searchDto: SearchQueryDto
  ): Promise<SearchExecutionResult> {
    const { queries, maxSearches, priorityDomains, pastContext } = searchDto;

    this.logger.log(
      `Executing search for ${queries.length} queries, context: ${pastContext ? "YES" : "NO"}`
    );

    let allResults: SearchResult[] = [];
    let searchesUsed = 0;

    // Log past context from memory (Phase 9)
    if (pastContext) {
      this.logger.log(`Using past context: ${pastContext.slice(0, 100)}...`);
    }

    // Execute searches
    for (const query of queries.slice(0, maxSearches)) {
      // Enhance query with past context if available
      const enhancedQuery = pastContext
        ? `${query} (Previous context: ${pastContext.slice(0, 200)})`
        : query;

      const results = await this.searchExa(enhancedQuery, priorityDomains);
      allResults = [...allResults, ...results];
      searchesUsed++;
    }

    // Simple evaluation (no OpenAI for now)
    const isSufficient = this.evaluateResults(allResults);

    // Remove duplicates and sort by score
    const uniqueResults = this.deduplicateResults(allResults);

    return {
      sufficient: isSufficient,
      deepThinkUsed: false, // Disabled until OpenAI key is available
      results: uniqueResults.slice(0, 10),
      metadata: {
        totalSearches: searchesUsed,
        queriesUsed: queries,
        deepThinkTriggered: false,
      },
    };
  }

  private async searchExa(
    query: string,
    _priorityDomains?: string[]
  ): Promise<SearchResult[]> {
    try {
      const response = await this.exa.search(query, {
        numResults: 10,
        useAutoprompt: true,
        contents: {
          text: true,
        },
      });

      return response.results.map((r) => ({
        title: r.title || "",
        url: r.url,
        snippet: r.text?.slice(0, 500) || "",
        publishedDate: r.publishedDate,
        score: r.score,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Exa API error: ${message}`);
      throw error;
    }
  }

  private evaluateResults(results: SearchResult[]): boolean {
    if (results.length < 3) return false;

    const hasAuthSources = results.some(
      (r) =>
        r.url.includes("github.com") ||
        r.url.includes("stackoverflow.com") ||
        r.url.includes("docs.") ||
        r.url.includes("wikipedia.org")
    );

    return hasAuthSources;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results
      .filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
