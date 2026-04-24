'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Badge } from '@workspace/ui/components/badge';
import { AgentVisualizer } from '@/components/agent-visualizer';

type AgentStatus = 'idle' | 'active' | 'completed' | 'error';

interface AgentState {
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(0);
  const [agent1, setAgent1] = useState<AgentState>({
    name: 'Query Analyzer',
    description: 'Analyzing your query and creating search plan...',
    status: 'idle',
    progress: 0,
  });
  const [agent2, setAgent2] = useState<AgentState>({
    name: 'Search Executor',
    description: 'Searching the web with Exa API...',
    status: 'idle',
    progress: 0,
  });
  const [agent3, setAgent3] = useState<AgentState>({
    name: 'Synthesizer',
    description: 'Generating comprehensive report...',
    status: 'idle',
    progress: 0,
  });
  const [streamingText, setStreamingText] = useState('');
  const [finalReport, setFinalReport] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setStreamingText('');
    setFinalReport('');
    
    // Reset agents
    setAgent1({ ...agent1, status: 'idle', progress: 0 });
    setAgent2({ ...agent2, status: 'idle', progress: 0 });
    setAgent3({ ...agent3, status: 'idle', progress: 0 });
    setCurrentAgent(0);

    // Simulate Agent1
    setCurrentAgent(1);
    setAgent1({ ...agent1, status: 'active', progress: 0 });
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAgent1(prev => ({ ...prev, progress: i }));
    }
    setAgent1({ ...agent1, status: 'completed', progress: 100 });

    // Simulate Agent2
    setCurrentAgent(2);
    setAgent2({ ...agent2, status: 'active', progress: 0 });
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAgent2(prev => ({ ...prev, progress: i }));
    }
    setAgent2({ ...agent2, status: 'completed', progress: 100 });

    // Simulate Agent3 (streaming)
    setCurrentAgent(3);
    setAgent3({ ...agent3, status: 'active', progress: 0 });
    
    const mockReport = `# Research Report: ${query}

## Introduction
This is a comprehensive research report about "${query}". Our multi-agent system analyzed your query, searched the web, and synthesized the findings.

## Key Findings

### 1. Overview
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### 2. Analysis
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### 3. Comparison Table
| Feature | Option A | Option B |
|---------|----------|----------|
| Speed   | Fast     | Medium   |
| Cost    | High     | Low      |

## Sources
[1] https://example.com/source1
[2] https://example.com/source2
[3] https://example.com/source3`;

    // Stream the text character by character
    for (let i = 0; i < mockReport.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      setStreamingText(mockReport.substring(0, i + 1));
      setAgent3(prev => ({ ...prev, progress: Math.floor((i / mockReport.length) * 100) }));
    }
    
    setAgent3({ ...agent3, status: 'completed', progress: 100 });
    setFinalReport(mockReport);
    setStreamingText('');
    setIsSearching(false);
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            🔥 Kagu-tsuchi
          </h1>
          <p className="text-xl text-muted-foreground">
            Multi-Agent AI Research Assistant
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Ask a research question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
                className="text-lg"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !query.trim()}
                size="lg"
              >
                {isSearching ? 'Researching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agent Visualizer */}
        {(agent1.status !== 'idle' || agent2.status !== 'idle' || agent3.status !== 'idle') && (
          <AgentVisualizer
            currentAgent={currentAgent}
            agent1Status={agent1}
            agent2Status={agent2}
            agent3Status={agent3}
          />
        )}

        {/* Streaming Response */}
        {(streamingText || finalReport) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Research Report
                {!finalReport && <Badge>Streaming...</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {(streamingText || finalReport).split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-semibold mt-4 mb-2">{line.substring(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-medium mt-3 mb-2">{line.substring(4)}</h3>;
                    } else if (line.startsWith('|')) {
                      return <code key={i} className="block text-sm bg-muted p-2 rounded my-1">{line}</code>;
                    } else if (line.startsWith('[')) {
                      return <p key={i} className="text-sm text-muted-foreground">📎 {line}</p>;
                    } else if (line.trim() === '') {
                      return <br key={i} />;
                    } else {
                      return <p key={i} className="mb-2">{line}</p>;
                    }
                  })}
                  {streamingText && !finalReport && (
                    <span className="animate-pulse">|</span>
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
