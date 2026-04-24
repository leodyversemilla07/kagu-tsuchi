export interface SearchPlan {
  clarified: boolean;
  followUpQuestions?: string[];
  searchPlan: {
    queries: string[];
    maxSearches: number;
    priorityDomains: string[];
  };
}

export interface QueryAnalysisResult extends SearchPlan {
  originalQuery: string;
  timestamp: Date;
}
