import { Injectable, Logger } from "@nestjs/common";
import { QueryDto } from "./dto/query.dto";
import { QueryAnalysisResult } from "./interfaces/search-plan.interface";

@Injectable()
export class Agent1Service {
  private readonly logger = new Logger(Agent1Service.name);

  async analyzeQuery(queryDto: QueryDto): Promise<QueryAnalysisResult> {
    const { query, maxSearches = 5 } = queryDto;

    this.logger.log(`Analyzing query: ${query}`);

    // Simple logic for now (replace with OpenAI later when API key is available)
    const words = query.trim().split(/\s+/);
    const clarified = words.length >= 3; // Simple heuristic

    const result: QueryAnalysisResult = {
      originalQuery: query,
      clarified,
      followUpQuestions: clarified
        ? []
        : [
            "Can you be more specific?",
            "What aspects are you most interested in?",
          ],
      searchPlan: {
        queries: [query, `${query} guide`, `${query} tutorial`].slice(
          0,
          maxSearches
        ),
        maxSearches,
        priorityDomains: ["github.com", "stackoverflow.com", "docs.org"],
      },
      timestamp: new Date(),
    };

    this.logger.log(`Query analyzed. Clarified: ${clarified}`);
    return result;
  }
}
