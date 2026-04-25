import { SearchPlan } from "../agent1/interfaces/search-plan.interface";
import { SearchResult } from "../agent2/interfaces/search-result.interface";

export interface SearchMemory {
  id: string;
  userId?: string;
  query: string;
  searchPlan: SearchPlan["searchPlan"];
  results: SearchResult[];
  report?: string;
  timestamp: Date;
  tags?: string[];
}

export interface MemorySearchResult {
  memories: SearchMemory[];
  relevanceScore: number;
}
