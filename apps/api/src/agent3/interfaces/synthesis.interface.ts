import { QueryAnalysisResult } from "../../agent1/interfaces/search-plan.interface";
import { SearchExecutionResult } from "../../agent2/interfaces/search-result.interface";
import { SearchMemory } from "../../memory/memory.interface";

export interface SynthesisInput {
  queryAnalysis: QueryAnalysisResult;
  searchResults: SearchExecutionResult | null;
  memories?: SearchMemory[];
}

export interface SynthesisResult {
  report: string;
  citations: string[];
  generatedAt: Date;
}
