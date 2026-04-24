export interface SearchMemory {
  id: string;
  userId?: string;
  query: string;
  searchPlan: any;
  results: any[];
  report?: string;
  timestamp: Date;
  tags?: string[];
}

export interface MemorySearchResult {
  memories: SearchMemory[];
  relevanceScore: number;
}
