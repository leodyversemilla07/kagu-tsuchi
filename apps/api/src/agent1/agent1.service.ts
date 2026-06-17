import { Injectable, Logger } from "@nestjs/common";
import type { QueryDto } from "./dto/query.dto";
import type { QueryAnalysisResult } from "./interfaces/search-plan.interface";

/** Common "noise" words that don't help with search differentiation */
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "about",
  "between",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "and",
  "but",
  "or",
  "nor",
  "not",
  "so",
  "yet",
  "both",
  "either",
  "neither",
  "each",
  "every",
  "all",
  "any",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "only",
  "own",
  "same",
  "than",
  "too",
  "very",
  "just",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
]);

/** Domain-specific priority mappings */
const DOMAIN_HINTS: Record<string, string[]> = {
  react: ["react.dev", "github.com/facebook/react"],
  vue: ["vuejs.org", "github.com/vuejs"],
  angular: ["angular.dev", "github.com/angular"],
  typescript: ["typescriptlang.org", "github.com/microsoft/TypeScript"],
  python: ["python.org", "docs.python.org", "github.com/python"],
  rust: ["rust-lang.org", "github.com/rust-lang"],
  go: ["go.dev", "github.com/golang"],
  docker: ["docs.docker.com", "github.com/docker"],
  kubernetes: ["kubernetes.io", "github.com/kubernetes"],
  nextjs: ["nextjs.org", "github.com/vercel/next.js"],
  nestjs: ["docs.nestjs.com", "github.com/nestjs/nest"],
  openai: ["platform.openai.com", "github.com/openai"],
  anthropic: ["docs.anthropic.com", "github.com/anthropics"],
};

@Injectable()
export class Agent1Service {
  private readonly logger = new Logger(Agent1Service.name);

  async analyzeQuery(queryDto: QueryDto): Promise<QueryAnalysisResult> {
    const { query, maxSearches = 5 } = queryDto;

    this.logger.log(`Analyzing query: ${query}`);

    const words = query.trim().split(/\s+/);

    // Count meaningful words (excluding stop words)
    const meaningfulWords = words.filter(
      (w) => !STOP_WORDS.has(w.toLowerCase()) && w.length > 1
    );

    // A query is "clarified" if it has enough meaningful content
    // Heuristic: at least 2 meaningful words, or 3+ total words with a question mark
    const hasQuestionIndicator = /[?!]$/.test(query.trim());
    const clarified =
      meaningfulWords.length >= 2 ||
      (words.length >= 3 && hasQuestionIndicator);

    // Generate smart query variations
    const queries = this.generateQueryVariations(query, meaningfulWords);

    // Detect domain-specific priority sources
    const priorityDomains = this.detectPriorityDomains(query, meaningfulWords);

    const result: QueryAnalysisResult = {
      originalQuery: query,
      clarified,
      followUpQuestions: clarified
        ? []
        : this.generateFollowUpQuestions(query, meaningfulWords),
      searchPlan: {
        queries: queries.slice(0, maxSearches),
        maxSearches,
        priorityDomains,
      },
      timestamp: new Date(),
    };

    this.logger.log(
      `Query analyzed. Clarified: ${clarified}, variations: ${queries.length}, domains: ${priorityDomains.length}`
    );
    return result;
  }

  /**
   * Generate meaningful query variations based on query structure.
   * Avoids generic suffixes like "guide" / "tutorial" in favour of
   * context-aware rewrites.
   */
  private generateQueryVariations(
    original: string,
    meaningfulWords: string[]
  ): string[] {
    const lower = original.toLowerCase();
    const variations: string[] = [original];

    // If the query already contains "how to", add a practical variant
    if (lower.startsWith("how to") || lower.startsWith("how do")) {
      const rest = original.replace(/^how (to|do\s+I)/i, "").trim();
      if (rest.length > 2) {
        variations.push(`${rest} best practices`);
        variations.push(`${rest} example`);
      }
    }
    // If the query is a "what is" question, add comparison/alternatives
    else if (lower.startsWith("what is") || lower.startsWith("what are")) {
      const subject = original.replace(/^what (is|are)\s+/i, "").trim();
      if (subject.length > 2) {
        variations.push(`${subject} vs alternatives`);
        variations.push(`${subject} pros and cons`);
      }
    }
    // If the query is a "why" question, add explanation variants
    else if (lower.startsWith("why")) {
      variations.push(`${original} explained`);
      variations.push(`${original} advantages disadvantages`);
    }
    // If the query is a "when" question, add timeline context
    else if (lower.startsWith("when")) {
      variations.push(`${original} latest 2025`);
    }
    // Generic: add context-aware suffixes based on word count
    else if (meaningfulWords.length >= 2) {
      const core = meaningfulWords.slice(0, 4).join(" ");
      variations.push(`${core} overview`);
      if (meaningfulWords.length >= 3) {
        variations.push(`${core} comparison`);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return variations.filter((v) => {
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Detect domain-specific priority sources from query keywords.
   */
  private detectPriorityDomains(
    _original: string,
    meaningfulWords: string[]
  ): string[] {
    const detected = new Set<string>(["github.com", "stackoverflow.com"]);

    for (const word of meaningfulWords) {
      const lower = word.toLowerCase();
      const hints = DOMAIN_HINTS[lower];
      if (hints) {
        for (const domain of hints) {
          detected.add(domain);
        }
      }
    }

    return Array.from(detected);
  }

  /**
   * Generate context-aware follow-up questions for short/ambiguous queries.
   */
  private generateFollowUpQuestions(
    _query: string,
    meaningfulWords: string[]
  ): string[] {
    const questions: string[] = [];

    if (meaningfulWords.length === 0) {
      questions.push(
        "Could you describe what you're looking for in a sentence?"
      );
    } else if (meaningfulWords.length === 1) {
      questions.push(
        `What specifically about "${meaningfulWords[0]}" would you like to research?`
      );
      questions.push(
        "For example: comparisons, tutorials, best practices, or recent news?"
      );
    } else {
      questions.push("Could you add a bit more context to your query?");
      questions.push(
        "Including timeframe, use case, or specific aspects helps narrow results."
      );
    }

    return questions;
  }
}
