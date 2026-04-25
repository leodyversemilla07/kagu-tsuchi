import { Injectable, Logger } from "@nestjs/common";
import { MemorySearchResult, SearchMemory } from "./memory.interface";

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private memories: Map<string, SearchMemory> = new Map();
  private userMemories: Map<string, Set<string>> = new Map();

  /**
   * Store a search memory
   */
  async store(memory: SearchMemory): Promise<void> {
    this.memories.set(memory.id, memory);

    // Index by user
    if (memory.userId) {
      if (!this.userMemories.has(memory.userId)) {
        this.userMemories.set(memory.userId, new Set());
      }
      const userMemoryIds = this.userMemories.get(memory.userId);
      userMemoryIds?.add(memory.id);
    }

    this.logger.log(`Stored memory ${memory.id} for query: ${memory.query}`);
  }

  /**
   * Retrieve relevant memories for a query (simple keyword match for now)
   * TODO: Upgrade to vector similarity search with Pinecone
   */
  async retrieve(
    query: string,
    userId?: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(" ").filter((k) => k.length > 3);

    // Get candidate memories
    let candidateIds: string[] = [];
    if (userId && this.userMemories.has(userId)) {
      candidateIds = Array.from(this.userMemories.get(userId) ?? []);
    } else {
      candidateIds = Array.from(this.memories.keys());
    }

    // Simple keyword scoring
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      let score = 0;
      const memoryText =
        `${memory.query} ${JSON.stringify(memory.searchPlan)}`.toLowerCase();

      for (const keyword of keywords) {
        if (memoryText.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push({ memories: [memory], relevanceScore: score });
      }
    }

    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get all memories for a user
   */
  async getByUserId(userId: string): Promise<SearchMemory[]> {
    if (!this.userMemories.has(userId)) {
      return [];
    }

    const ids = this.userMemories.get(userId) ?? new Set<string>();
    return Array.from(ids)
      .map((id) => this.memories.get(id))
      .filter((m): m is SearchMemory => m !== undefined)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Clear all memories (for testing)
   */
  async clear(): Promise<void> {
    this.memories.clear();
    this.userMemories.clear();
    this.logger.log("Cleared all memories");
  }
}
