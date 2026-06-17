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
      results: uniqueResults.slice(0, 10),
      metadata: {
        totalSearches: searchesUsed,
        queriesUsed: queries,
      },
    };
  }

  private async searchExa(
    query: string,
    priorityDomains?: string[]
  ): Promise<SearchResult[]> {
    const maxRetries = 2;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const includeDomains =
          priorityDomains && priorityDomains.length > 0
            ? priorityDomains
            : undefined;

        const response = await this.exa.search(query, {
          numResults: 10,
          useAutoprompt: true,
          includeDomains,
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
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);

        // Don't retry on auth errors (401/403) or client errors (4xx)
        const isClientError =
          error instanceof Error && /\b(40[0-3]|401|403|400)\b/.test(message);
        if (isClientError || attempt === maxRetries) {
          this.logger.error(
            `Exa API error (attempt ${attempt + 1}): ${message}`
          );
          throw error;
        }

        // Exponential backoff: 500ms, 1000ms
        const delayMs = 500 * 2 ** attempt;
        this.logger.warn(
          `Exa API error (attempt ${attempt + 1}), retrying in ${delayMs}ms: ${message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
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
