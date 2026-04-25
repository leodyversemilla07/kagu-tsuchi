import { Injectable, Logger } from "@nestjs/common";
import { Agent1Service } from "../agent1/agent1.service";
import { QueryDto } from "../agent1/dto/query.dto";
import { QueryAnalysisResult } from "../agent1/interfaces/search-plan.interface";
import { Agent2Service } from "../agent2/agent2.service";
import { SearchQueryDto } from "../agent2/dto/search.dto";
import { SearchExecutionResult } from "../agent2/interfaces/search-result.interface";
import { Agent3Service } from "../agent3/agent3.service";
import { SynthesisResult } from "../agent3/interfaces/synthesis.interface";
import { SearchMemory } from "../memory/memory.interface";
import { MemoryService } from "../memory/memory.service";
import { Observable } from "rxjs";

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
        deepThink: queryDto.deepThink,
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

  conductResearchStream(
    queryDto: QueryDto
  ): Observable<string> {
    return new Observable((subscriber) => {
      this.logger.log(`Starting streaming research for: ${queryDto.query}`);

      const emit = (type: string, source: string, data: string) => {
        subscriber.next(this.createSseEvent(type, source, data));
      };

      emit("step", "memory", "Retrieving relevant memories...");

      this.agent1Service
        .analyzeQuery(queryDto)
        .then((queryAnalysis) => {
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

          const searchQueryDto: SearchQueryDto = {
            queries: queryAnalysis.searchPlan.queries,
            maxSearches: queryAnalysis.searchPlan.maxSearches,
            priorityDomains: queryAnalysis.searchPlan.priorityDomains,
            deepThink: queryDto.deepThink,
          };

          emit("step", "agent1", "Query analyzed");
          emit("step", "agent2", "Searching...");


          this.agent2Service
            .executeSearch(searchQueryDto)
            .then((searchResults) => {
              emit("data", "agent2", JSON.stringify(searchResults));

              emit(
                "step",
                "agent3",
                `Found ${searchResults.results?.length || 0} results`
              );


              this.agent3Service
                .synthesize({
                  queryAnalysis,
                  searchResults,
                  memories: [],
                })
                .then((synthesis) => {
                  emit("done", "agent3", JSON.stringify(synthesis));
                  subscriber.complete();
                })
                .catch((error) => {
                  emit("error", "agent3", error.message);
                  subscriber.complete();
                });
            })
            .catch((error) => {
              emit("error", "agent2", error.message);
              subscriber.complete();
            });
        })
        .catch((error) => {
          emit("error", "agent1", error.message);
          subscriber.complete();
        });
    });
  }

  private createSseEvent(
    type: string,
    source: string,
    data: string
  ): string {
    return `type: ${type}\nsource: ${source}\ndata: ${data}\n\n`;
  }
}
