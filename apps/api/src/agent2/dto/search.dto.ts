export class SearchQueryDto {
  queries: string[];
  maxSearches: number;
  priorityDomains?: string[];
  deepThink?: boolean;
  pastContext?: string; // From memory system (Phase 9)
}

export class SearchResultDto {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}
