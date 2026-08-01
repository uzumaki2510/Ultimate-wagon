import React, { useState } from 'react';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Settings, Play, ArrowRight, Layers, Workflow, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageConfigurator } from '@/components/workflow/StageConfigurator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function WorkflowBuilder() {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Restrict to admins/managers only
  if (user?.role !== "Admin" && user?.role !== "Manager") {
    return <Navigate to="/dashboard" replace />;
  }

  const header = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <PageHeader 
        title="Workflow Engine Configuration" 
        description="Design, configure, and manage standard operating procedures."
        icon={Workflow}
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm"><Play className="h-4 w-4 mr-2" /> Simulate</Button>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Workflow</Button>
      </div>
    </div>
  );

  // Dummy nodes for demonstration
  const nodes = [
    { id: "registration", label: "Registration & Inward", type: "trigger" },
    { id: "initial-inspection", label: "Initial Inspection", type: "stage" },
    { id: "steam-cleaning", label: "Steam Cleaning", type: "conditional", condition: "If Tank Wagon" },
    { id: "repair", label: "Mechanical Repair", type: "stage" },
    { id: "testing", label: "Testing & QA", type: "stage" },
    { id: "release", label: "Final Release", type: "endpoint" }
  ];

  return (
    <WorkspaceLayout header={header}>
      <div className="flex flex-col lg:flex-row h-full overflow-hidden border rounded-xl bg-muted/10 shadow-sm relative">
        
        {/* Left Toolbar */}
        <div className="w-16 border-r bg-background flex flex-col items-center py-4 space-y-4 shrink-0 z-10">
          <Button variant="ghost" size="icon" title="Workflows" className="bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Global Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 relative min-h-[500px]">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8 flex flex-col items-center pb-20">
            
            <div className="bg-background px-4 py-2 rounded-md shadow-sm border text-sm font-semibold mb-4 w-full text-center">
              Active Template: Standard Freight Wagon
            </div>

            {nodes.map((node, idx) => (
              <React.Fragment key={node.id}>
                
                {/* Visual Connector Line */}
                {idx > 0 && (
                  <div className="h-8 w-px bg-border flex items-center justify-center relative">
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background border rounded-full p-0.5 z-10">
                      <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                    </div>
                  </div>
                )}

                {/* Node Card */}
                <Card 
                  className={`w-64 cursor-pointer transition-all hover:scale-105 hover:shadow-md border-2 
                    ${selectedNode === node.id ? 'border-primary ring-4 ring-primary/20' : 'border-border/50 hover:border-primary/50'}
                  `}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="p-4 flex flex-col items-center text-center space-y-2">
                    <Badge variant="outline" className={`
                      ${node.type === 'trigger' ? 'bg-info/10 text-info border-info/20' : ''}
                      ${node.type === 'conditional' ? 'bg-warning/10 text-warning border-warning/20' : ''}
                      ${node.type === 'endpoint' ? 'bg-success/10 text-success border-success/20' : ''}
                      ${node.type === 'stage' ? 'bg-muted' : ''}
                    `}>
                      {node.type.toUpperCase()}
                    </Badge>
                    <h3 className="font-bold">{node.label}</h3>
                    {node.condition && <p className="text-xs text-muted-foreground italic">{node.condition}</p>}
                  </div>
                </Card>
              </React.Fragment>
            ))}

            <Button variant="outline" className="mt-8 border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Stage
            </Button>
          </div>
        </div>

        {/* Right Configuration Panel (Slide Over) */}
        {selectedNode && (
          <div className="absolute inset-y-0 right-0 z-20 shadow-2xl flex">
            <StageConfigurator nodeId={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
