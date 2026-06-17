import { Injectable, Logger } from "@nestjs/common";
import type { MemorySearchResult, SearchMemory } from "./memory.interface";

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private memories: Map<string, SearchMemory> = new Map();
  private userMemories: Map<string, Set<string>> = new Map();

  /** Maximum number of memories to retain (oldest evicted first) */
  private readonly maxMemories = Number(process.env.MEMORY_MAX_ENTRIES) || 500;

  /**
   * Store a search memory. Evicts oldest entries when the cap is reached.
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

    // Evict oldest memories if over cap
    if (this.memories.size > this.maxMemories) {
      this.evictOldest(this.memories.size - this.maxMemories);
    }

    this.logger.log(`Stored memory ${memory.id} for query: ${memory.query}`);
  }

  /**
   * Retrieve relevant memories for a query.
   *
   * Uses a lightweight TF-IDF-inspired scoring approach:
   *  - Exact phrase match gets highest weight
   *  - Individual keyword matches are weighted by inverse document frequency
   *  - Recency is factored in as a small bonus
   */
  async retrieve(
    query: string,
    userId?: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((k) => k.length > 2);

    if (queryTerms.length === 0) return results;

    // Get candidate memories
    let candidateIds: string[] = [];
    if (userId && this.userMemories.has(userId)) {
      candidateIds = Array.from(this.userMemories.get(userId) ?? []);
    } else {
      candidateIds = Array.from(this.memories.keys());
    }

    if (candidateIds.length === 0) return results;

    // Pre-compute document frequency (how many memories contain each term)
    const docFrequency = new Map<string, number>();
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;
      const memoryText =
        `${memory.query} ${JSON.stringify(memory.searchPlan)}`.toLowerCase();
      const uniqueTerms = new Set(
        queryTerms.filter((t) => memoryText.includes(t))
      );
      for (const term of uniqueTerms) {
        docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
      }
    }

    const totalDocs = candidateIds.length;

    // Score each candidate
    for (const id of candidateIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      const memoryText =
        `${memory.query} ${JSON.stringify(memory.searchPlan)}`.toLowerCase();

      // TF-IDF-like scoring
      let score = 0;
      for (const term of queryTerms) {
        if (memoryText.includes(term)) {
          // Term frequency: 1 if present (binary)
          const tf = 1;
          // Inverse document frequency: rare terms score higher
          const df = docFrequency.get(term) ?? 1;
          const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
          score += tf * idf;
        }
      }

      // Exact phrase match bonus (highest signal)
      if (memoryText.includes(queryLower)) {
        score += queryTerms.length * 2;
      }

      // Recency bonus: memories from the last 24h get a small boost
      const ageMs = Date.now() - new Date(memory.timestamp).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      if (ageMs < dayMs) {
        score += 0.5 * (1 - ageMs / dayMs);
      }

      if (score > 0) {
        results.push({ memories: [memory], relevanceScore: score });
      }
    }

    // Sort by relevance (descending) and limit
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

  /**
   * Evict the oldest N memories by timestamp.
   */
  private evictOldest(count: number): void {
    const sorted = Array.from(this.memories.entries())
      .sort(
        ([, a], [, b]) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(0, count);

    for (const [id, memory] of sorted) {
      this.memories.delete(id);
      if (memory.userId) {
        this.userMemories.get(memory.userId)?.delete(id);
      }
    }

    this.logger.debug(`Evicted ${sorted.length} oldest memories`);
  }
}
