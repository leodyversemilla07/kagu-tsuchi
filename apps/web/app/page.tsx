"use client";

import { ClockCounterClockwise } from "@phosphor-icons/react";
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
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentVisualizer } from "@/components/agent-visualizer";
import { ExportButton } from "@/components/export-button";
import { SearchHistorySidebar } from "@/components/search-history-sidebar";
import { useSearchHistory } from "@/hooks/use-search-history";

type AgentStatus = "idle" | "active" | "completed" | "error";

interface AgentState {
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
}

interface SseEvent {
  type: "step" | "data" | "done" | "error";
  source: string;
  data: string;
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

/**
 * Parse an SSE text block into structured events.
 * SSE format: `type: ...\nsource: ...\ndata: ...\n\n`
 */
function parseSseEvents(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = raw.split("\n\n");

  for (const block of blocks) {
    const lines = block.split("\n");
    const event: Partial<SseEvent> = {};

    for (const line of lines) {
      if (line.startsWith("type: "))
        event.type = line.slice(6) as SseEvent["type"];
      else if (line.startsWith("source: ")) event.source = line.slice(8);
      else if (line.startsWith("data: ")) event.data = line.slice(6);
    }

    if (event.type && event.source && event.data !== undefined) {
      events.push(event as SseEvent);
    }
  }

  return events;
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
  const [citations, setCitations] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addToHistory } = useSearchHistory();

  // Refs for values accessed inside callbacks to avoid stale closures
  const trimmedQueryRef = useRef("");
  const finalReportRef = useRef("");
  const citationsRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    finalReportRef.current = finalReport;
  }, [finalReport]);
  useEffect(() => {
    citationsRef.current = citations;
  }, [citations]);

  // Cleanup timer and abort controller on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const resetAgents = useCallback(() => {
    setAgent1(initialAgents.agent1);
    setAgent2(initialAgents.agent2);
    setAgent3(initialAgents.agent3);
    setCurrentAgent(0);
  }, []);

  /**
   * Simulate streaming of the final report text for a typewriter effect.
   * Declared first because handleSseEvent depends on it.
   */
  const streamReportText = useCallback(
    (report: string, query: string, reportCitations: string[]) => {
      // Clear any existing streaming timer
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);

      setAgent3((prev) => ({ ...prev, status: "active", progress: 10 }));
      setStreamingText("");

      let index = 0;
      const chunkSize = 12;
      const intervalMs = 8;

      streamTimerRef.current = setInterval(() => {
        index += chunkSize;
        const nextText = report.substring(0, index);
        setStreamingText(nextText);
        setAgent3((prev) => ({
          ...prev,
          progress: Math.min(99, Math.floor((index / report.length) * 100)),
        }));

        if (index >= report.length) {
          if (streamTimerRef.current) clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
          setAgent3((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
          }));
          setFinalReport(report);
          setStreamingText("");
          // Save to history only after streaming completes
          addToHistory(query, report, reportCitations);
        }
      }, intervalMs);
    },
    [addToHistory]
  );

  /**
   * Handle a single SSE event from the backend stream.
   * Declared after streamReportText (dependency) but before handleSearch.
   */
  const handleSseEvent = useCallback(
    (event: SseEvent) => {
      switch (event.type) {
        case "step": {
          if (event.source === "agent1") {
            setCurrentAgent(1);
            setAgent1((prev) => ({
              ...prev,
              status: "active",
              progress: 30,
            }));
          } else if (event.source === "agent2") {
            setCurrentAgent(2);
            setAgent1((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
            }));
            setAgent2((prev) => ({
              ...prev,
              status: "active",
              progress: 50,
            }));
          } else if (event.source === "agent3") {
            setCurrentAgent(3);
            setAgent1((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
            }));
            setAgent2((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
            }));
            setAgent3((prev) => ({
              ...prev,
              status: "active",
              progress: 10,
            }));
          }
          break;
        }

        case "data": {
          try {
            JSON.parse(event.data);

            if (event.source === "agent1") {
              setAgent1((prev) => ({
                ...prev,
                status: "completed",
                progress: 100,
              }));
            } else if (event.source === "agent2") {
              setAgent2((prev) => ({
                ...prev,
                status: "completed",
                progress: 100,
              }));
            }
          } catch {
            // Non-JSON data — ignore
          }
          break;
        }

        case "done": {
          try {
            const payload = JSON.parse(event.data);

            if (event.source === "agent3" && payload.report) {
              const reportCitations = payload.citations ?? [];
              setCitations(reportCitations);
              streamReportText(
                payload.report,
                trimmedQueryRef.current,
                reportCitations
              );
            } else if (event.source === "follow-up") {
              const questions = Array.isArray(payload) ? payload : [];
              const followUpReport = `# Follow-up Needed\n\n${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`;
              setFinalReport(followUpReport);
              setAgent3((prev) => ({
                ...prev,
                status: "completed",
                progress: 100,
              }));
              addToHistory(trimmedQueryRef.current, followUpReport, []);
            }
          } catch {
            // Non-JSON done — ignore
          }
          break;
        }

        case "error": {
          const errorMessage = event.data || "Unknown error";
          setFinalReport(`# Error from ${event.source}\n\n${errorMessage}`);
          setAgent1((prev) =>
            prev.status === "active" ? { ...prev, status: "error" } : prev
          );
          setAgent2((prev) =>
            prev.status === "active" ? { ...prev, status: "error" } : prev
          );
          setAgent3((prev) =>
            prev.status === "active" ? { ...prev, status: "error" } : prev
          );
          break;
        }
      }
    },
    [streamReportText, addToHistory]
  );

  /**
   * Main search handler. Reads the SSE stream from the backend.
   * Declared last because it depends on handleSseEvent.
   */
  const handleSearch = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isSearching) return;

    setIsSearching(true);
    setStreamingText("");
    setFinalReport("");
    setCitations([]);
    resetAgents();
    trimmedQueryRef.current = trimmedQuery;

    try {
      // Cancel any in-flight request
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch(`${apiBaseUrl}/search/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          maxSearches: 5,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Research request failed with ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE blocks (delimited by double newline)
        while (buffer.includes("\n\n")) {
          const splitIndex = buffer.indexOf("\n\n");
          const block = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);

          const events = parseSseEvents(block);
          for (const event of events) {
            handleSseEvent(event);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const events = parseSseEvents(buffer);
        for (const event of events) {
          handleSseEvent(event);
        }
      }
    } catch (error) {
      // Ignore abort errors (user cancelled)
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      const errorReport = `# Research Error\n\n${message}\n\n## Troubleshooting\n- Confirm the NestJS API is running at ${apiBaseUrl}.\n- Confirm apps/api/.env contains a valid EXA_API_KEY.\n- If the backend is on another URL, set NEXT_PUBLIC_API_URL for the web app.`;

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
      abortControllerRef.current = null;
    }
  }, [query, isSearching, resetAgents, handleSseEvent]);

  const reportText = streamingText || finalReport;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-0"
            aria-label="Open search history"
          >
            <ClockCounterClockwise className="w-5 h-5" />
          </Button>
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  Research Report
                  {streamingText && !finalReport && (
                    <Badge variant="secondary" className="animate-pulse">
                      Streaming...
                    </Badge>
                  )}
                </CardTitle>
                {finalReport && (
                  <ExportButton
                    report={finalReport}
                    citations={citations}
                    query={query}
                  />
                )}
              </div>
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

      <SearchHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectQuery={(q) => {
          setQuery(q);
          setSidebarOpen(false);
        }}
        currentQuery={query}
      />
    </main>
  );
}
