'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';

type AgentStatus = 'idle' | 'active' | 'completed' | 'error';

interface AgentState {
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
}

interface AgentVisualizerProps {
  currentAgent: number;
  agent1Status: AgentState;
  agent2Status: AgentState;
  agent3Status: AgentState;
}

export function AgentVisualizer({ currentAgent, agent1Status, agent2Status, agent3Status }: AgentVisualizerProps) {
  const agents = [
    { ...agent1Status, id: 1 },
    { ...agent2Status, id: 2 },
    { ...agent3Status, id: 3 },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Agent Pipeline Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    agent.status === 'active' ? 'bg-blue-500 animate-pulse' :
                    agent.status === 'completed' ? 'bg-green-500' :
                    agent.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <span className={`font-medium ${
                    agent.id === currentAgent ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    Agent {agent.id}: {agent.name}
                  </span>
                </div>
                <Badge variant={
                  agent.status === 'active' ? 'default' :
                  agent.status === 'completed' ? 'secondary' :
                  agent.status === 'error' ? 'destructive' : 'outline'
                }>
                  {agent.status === 'active' ? 'Processing...' :
                   agent.status === 'completed' ? 'Complete' :
                   agent.status === 'error' ? 'Error' : 'Waiting'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              {agent.status === 'active' && (
                <Progress value={agent.progress} className="h-2" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
