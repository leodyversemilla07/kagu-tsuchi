import { Injectable, Logger } from '@nestjs/common';
import { Agent1Service } from '../agent1/agent1.service';
import { Agent2Service } from '../agent2/agent2.service';
import { MemoryService } from '../memory/memory.service';
import { QueryDto } from '../agent1/dto/query.dto';
import { SearchQueryDto } from '../agent2/dto/search.dto';
import { SearchExecutionResult } from '../agent2/interfaces/search-result.interface';
import { SearchMemory } from '../memory/memory.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly agent1Service: Agent1Service,
    private readonly agent2Service: Agent2Service,
    private readonly memoryService: MemoryService,
  ) {}

  async conductResearch(queryDto: QueryDto): Promise<{
    queryAnalysis: any;
    searchResults: SearchExecutionResult | null;
    memories?: SearchMemory[];
  }> {
    this.logger.log(`Starting research for: ${queryDto.query}`);

    try {
      // Step 0: Retrieve relevant memories (Phase 9: Memory System)
      this.logger.log('Step 0: Retrieving relevant memories...');
      const relevantMemories = await this.memoryService.retrieve(
        queryDto.query,
        queryDto.userId,
        3
      );
      const pastContext = relevantMemories.length > 0 
        ? relevantMemories.map(m => `Past search: ${m.memories[0].query}`).join('; ')
        : undefined;

      // Step 1: Agent1 - Query Analysis
      this.logger.log('Step 1: Analyzing query with Agent1...');
      const queryAnalysis = await this.agent1Service.analyzeQuery(queryDto);

      // If query not clarified, return early with follow-up questions
      if (!queryAnalysis.clarified) {
        this.logger.log('Query not clarified, returning follow-up questions');
        return {
          queryAnalysis,
          searchResults: null,
          memories: relevantMemories.map(m => m.memories[0]),
        };
      }

      // Step 2: Agent2 - Search Execution
      this.logger.log('Step 2: Executing search with Agent2...');
      const searchQueryDto: SearchQueryDto = {
        queries: queryAnalysis.searchPlan.queries,
        maxSearches: queryAnalysis.searchPlan.maxSearches,
        priorityDomains: queryAnalysis.searchPlan.priorityDomains,
        deepThink: queryDto.deepThink,
        pastContext,
      };

      const searchResults = await this.agent2Service.executeSearch(searchQueryDto);

      // Step 3: Store in memory (Phase 9)
      if (searchResults.sufficient && searchResults.results) {
        this.logger.log('Step 3: Storing research in memory...');
        const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.memoryService.store({
          id: memoryId,
          userId: queryDto.userId,
          query: queryDto.query,
          searchPlan: queryAnalysis.searchPlan,
          results: searchResults.results,
          timestamp: new Date(),
        });
      }

      this.logger.log(`Research complete. Found ${searchResults.results?.length || 0} results`);

      return {
        queryAnalysis,
        searchResults,
        memories: relevantMemories.map(m => m.memories[0]),
      };
    } catch (error) {
      this.logger.error(`Research failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
