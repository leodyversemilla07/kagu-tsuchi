export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchExecutionResult {
  sufficient: boolean;
  results: SearchResult[];
  metadata: {
    totalSearches: number;
    queriesUsed: string[];
  };
}

export interface SearchOptions {
  maxSearches: number;
  priorityDomains?: string[];
}
