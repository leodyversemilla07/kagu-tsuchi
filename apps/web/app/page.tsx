"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentVisualizer } from "@/components/agent-visualizer";

type AgentStatus = "idle" | "active" | "completed" | "error";

interface AgentState {
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

interface ResearchResponse {
  queryAnalysis: {
    originalQuery: string;
    clarified: boolean;
    followUpQuestions?: string[];
    searchPlan: {
      queries: string[];
      maxSearches: number;
      priorityDomains: string[];
    };
    timestamp: string;
  };
  searchResults: {
    sufficient: boolean;
    deepThinkUsed: boolean;
    results: SearchResult[];
    metadata: {
      totalSearches: number;
      queriesUsed: string[];
      deepThinkTriggered: boolean;
    };
  } | null;
  synthesis: {
    report: string;
    citations: string[];
    generatedAt: string;
  };
  report: string;
  citations: string[];
  memories?: Array<{
    id: string;
    query: string;
    timestamp: string;
  }>;
}

const initialAgents = {
  agent1: {
    name: "Query Analyzer",
    description: "Analyzing your query and creating search plan...",
    status: "idle",
    progress: 0,
  } satisfies AgentState,
  agent2: {
    name: "Search Executor",
    description: "Searching the web with Exa API...",
    status: "idle",
    progress: 0,
  } satisfies AgentState,
  agent3: {
    name: "Synthesizer",
    description: "Generating comprehensive report...",
    status: "idle",
    progress: 0,
  } satisfies AgentState,
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function streamReport(
  report: string,
  setStreamingText: (value: string) => void,
  setAgent3: React.Dispatch<React.SetStateAction<AgentState>>
) {
  const chunkSize = 12;

  for (let index = 0; index < report.length; index += chunkSize) {
    await new Promise((resolve) => setTimeout(resolve, 8));
    const nextText = report.substring(0, index + chunkSize);
    setStreamingText(nextText);
    setAgent3((prev) => ({
      ...prev,
      progress: Math.min(
        99,
        Math.floor((nextText.length / report.length) * 100)
      ),
    }));
  }
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(0);
  const [agent1, setAgent1] = useState<AgentState>(initialAgents.agent1);
  const [agent2, setAgent2] = useState<AgentState>(initialAgents.agent2);
  const [agent3, setAgent3] = useState<AgentState>(initialAgents.agent3);
  const [streamingText, setStreamingText] = useState("");
  const [finalReport, setFinalReport] = useState("");

  const resetAgents = () => {
    setAgent1(initialAgents.agent1);
    setAgent2(initialAgents.agent2);
    setAgent3(initialAgents.agent3);
    setCurrentAgent(0);
  };

  const handleSearch = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isSearching) return;

    setIsSearching(true);
    setStreamingText("");
    setFinalReport("");
    resetAgents();

    try {
      setCurrentAgent(1);
      setAgent1((prev) => ({ ...prev, status: "active", progress: 30 }));

      const response = await fetch(`${apiBaseUrl}/search/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: trimmedQuery,
          maxSearches: 5,
          deepThink: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Research request failed with ${response.status}`
        );
      }

      const researchResponse = (await response.json()) as ResearchResponse;

      // Agent1 completed
      setAgent1((prev) => ({ ...prev, status: "completed", progress: 100 }));
      setCurrentAgent(2);

      // Agent2 status
      setAgent2((prev) => ({
        ...prev,
        status: researchResponse.searchResults ? "completed" : "idle",
        progress: researchResponse.searchResults ? 100 : 0,
      }));
      setCurrentAgent(3);

      const report = researchResponse.report;
      setAgent3((prev) => ({ ...prev, status: "active", progress: 0 }));

      await streamReport(report, setStreamingText, setAgent3);

      setAgent3((prev) => ({ ...prev, status: "completed", progress: 100 }));
      setFinalReport(report);
      setStreamingText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorReport = `# Research Error

${message}

## Troubleshooting
- Confirm the NestJS API is running at ${apiBaseUrl}.
- Confirm apps/api/.env contains a valid EXA_API_KEY.
- If the backend is on another URL, set NEXT_PUBLIC_API_URL for the web app.`;

      setFinalReport(errorReport);
      setAgent1((prev) =>
        prev.status === "active" ? { ...prev, status: "error" } : prev
      );
      setAgent2((prev) =>
        prev.status === "active" ? { ...prev, status: "error" } : prev
      );
      setAgent3((prev) =>
        prev.status === "active" ? { ...prev, status: "error" } : prev
      );
    } finally {
      setIsSearching(false);
    }
  };

  const reportText = streamingText || finalReport;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            🔥 Kagu-tsuchi
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Multi-Agent AI Research Assistant
          </p>
        </div>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Input
                placeholder="Ask a research question..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                disabled={isSearching}
                className="text-base md:text-lg flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isSearching ? "Researching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(agent1.status !== "idle" ||
          agent2.status !== "idle" ||
          agent3.status !== "idle") && (
          <AgentVisualizer
            currentAgent={currentAgent}
            agent1Status={agent1}
            agent2Status={agent2}
            agent3Status={agent3}
          />
        )}

        {reportText && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                Research Report
                {streamingText && !finalReport && (
                  <Badge variant="secondary" className="animate-pulse">
                    Streaming...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] md:h-[500px] w-full rounded-md border p-3 md:p-4">
                <div
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none
                  prose-headings:mt-4 prose-headings:mb-2
                  prose-p:mb-2 prose-p:leading-relaxed
                  prose-li:my-1
                  prose-a:text-blue-600 prose-a:underline
                  prose-code:before:content-none prose-code:after:content-none
                  prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                "
                >
                  {streamingText ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingText}
                      </ReactMarkdown>
                      <span className="animate-pulse">|</span>
                    </>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finalReport}
                    </ReactMarkdown>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
