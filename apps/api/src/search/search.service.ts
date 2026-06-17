import { Injectable, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { Agent1Service } from "../agent1/agent1.service";
import type { QueryDto } from "../agent1/dto/query.dto";
import type { QueryAnalysisResult } from "../agent1/interfaces/search-plan.interface";
import { Agent2Service } from "../agent2/agent2.service";
import { SearchQueryDto } from "../agent2/dto/search.dto";
import type { SearchExecutionResult } from "../agent2/interfaces/search-result.interface";
import { Agent3Service } from "../agent3/agent3.service";
import type { SynthesisResult } from "../agent3/interfaces/synthesis.interface";
import type { SearchMemory } from "../memory/memory.interface";
import { MemoryService } from "../memory/memory.service";

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly agent1Service: Agent1Service,
    private readonly agent2Service: Agent2Service,
    private readonly agent3Service: Agent3Service,
    private readonly memoryService: MemoryService
  ) {}

  async conductResearch(queryDto: QueryDto): Promise<{
    queryAnalysis: QueryAnalysisResult;
    searchResults: SearchExecutionResult | null;
    synthesis: SynthesisResult;
    report: string;
    citations: string[];
    memories?: SearchMemory[];
  }> {
    this.logger.log(`Starting research for: ${queryDto.query}`);

    try {
      // Step 0: Retrieve relevant memories (Phase 9: Memory System)
      this.logger.log("Step 0: Retrieving relevant memories...");
      const relevantMemories = await this.memoryService.retrieve(
        queryDto.query,
        queryDto.userId,
        3
      );
      const pastContext =
        relevantMemories.length > 0
          ? relevantMemories
              .map((m) => `Past search: ${m.memories[0].query}`)
              .join("; ")
          : undefined;

      // Step 1: Agent1 - Query Analysis
      this.logger.log("Step 1: Analyzing query with Agent1...");
      const queryAnalysis = await this.agent1Service.analyzeQuery(queryDto);

      // If query not clarified, return early with follow-up questions
      if (!queryAnalysis.clarified) {
        this.logger.log("Query not clarified, returning follow-up questions");
        const memories = relevantMemories.map((m) => m.memories[0]);
        const synthesis = await this.agent3Service.synthesize({
          queryAnalysis,
          searchResults: null,
          memories,
        });

        return {
          queryAnalysis,
          searchResults: null,
          synthesis,
          report: synthesis.report,
          citations: synthesis.citations,
          memories,
        };
      }

      // Step 2: Agent2 - Search Execution
      this.logger.log("Step 2: Executing search with Agent2...");
      const searchQueryDto: SearchQueryDto = {
        queries: queryAnalysis.searchPlan.queries,
        maxSearches: queryAnalysis.searchPlan.maxSearches,
        priorityDomains: queryAnalysis.searchPlan.priorityDomains,
        pastContext,
      };

      const searchResults =
        await this.agent2Service.executeSearch(searchQueryDto);

      const memories = relevantMemories.map((m) => m.memories[0]);

      // Step 3: Agent3 - Synthesis
      this.logger.log("Step 3: Synthesizing report with Agent3...");
      const synthesis = await this.agent3Service.synthesize({
        queryAnalysis,
        searchResults,
        memories,
      });

      // Step 4: Store in memory (Phase 9)
      if (searchResults.sufficient && searchResults.results) {
        this.logger.log("Step 4: Storing research in memory...");
        const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        await this.memoryService.store({
          id: memoryId,
          userId: queryDto.userId,
          query: queryDto.query,
          searchPlan: queryAnalysis.searchPlan,
          results: searchResults.results,
          report: synthesis.report,
          timestamp: new Date(),
        });
      }

      this.logger.log(
        `Research complete. Found ${searchResults.results?.length || 0} results`
      );

      return {
        queryAnalysis,
        searchResults,
        synthesis,
        report: synthesis.report,
        citations: synthesis.citations,
        memories,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Research failed: ${message}`, stack);
      throw error;
    }
  }

  conductResearchStream(queryDto: QueryDto): Observable<string> {
    return new Observable((subscriber) => {
      this.logger.log(`Starting streaming research for: ${queryDto.query}`);

      const emit = (type: string, source: string, data: string) => {
        subscriber.next(this.createSseEvent(type, source, data));
      };

      const runPipeline = async () => {
        try {
          emit("step", "memory", "Retrieving relevant memories...");

          // Step 0: Retrieve memories
          const relevantMemories = await this.memoryService.retrieve(
            queryDto.query,
            queryDto.userId,
            3
          );
          const memories = relevantMemories.map((m) => m.memories[0]);

          // Step 1: Agent1 — Query Analysis
          emit("step", "agent1", "Analyzing query...");
          const queryAnalysis = await this.agent1Service.analyzeQuery(queryDto);
          emit("data", "agent1", JSON.stringify(queryAnalysis));

          if (!queryAnalysis.clarified) {
            emit(
              "done",
              "follow-up",
              JSON.stringify(queryAnalysis.followUpQuestions)
            );
            subscriber.complete();
            return;
          }

          // Step 2: Agent2 — Search Execution
          emit("step", "agent2", "Searching...");
          const searchQueryDto: SearchQueryDto = {
            queries: queryAnalysis.searchPlan.queries,
            maxSearches: queryAnalysis.searchPlan.maxSearches,
            priorityDomains: queryAnalysis.searchPlan.priorityDomains,
          };
          const searchResults =
            await this.agent2Service.executeSearch(searchQueryDto);
          emit("data", "agent2", JSON.stringify(searchResults));

          // Step 3: Agent3 — Synthesis
          emit(
            "step",
            "agent3",
            `Found ${searchResults.results?.length || 0} results. Synthesizing...`
          );
          const synthesis = await this.agent3Service.synthesize({
            queryAnalysis,
            searchResults,
            memories,
          });
          emit("done", "agent3", JSON.stringify(synthesis));

          // Step 4: Store in memory if results are sufficient
          if (searchResults.sufficient && searchResults.results) {
            const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            await this.memoryService.store({
              id: memoryId,
              userId: queryDto.userId,
              query: queryDto.query,
              searchPlan: queryAnalysis.searchPlan,
              results: searchResults.results,
              report: synthesis.report,
              timestamp: new Date(),
            });
          }

          subscriber.complete();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Streaming pipeline error: ${message}`);
          emit("error", "pipeline", message);
          subscriber.complete();
        }
      };

      runPipeline();
    });
  }

  private createSseEvent(type: string, source: string, data: string): string {
    return `type: ${type}\nsource: ${source}\ndata: ${data}\n\n`;
  }
}
