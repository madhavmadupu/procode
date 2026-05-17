import React, { useState } from 'react';
import { useDapStore } from '../../stores/dap.store.js';
import { PlayIcon, PauseIcon, StepOverIcon, StepIntoIcon, StepOutIcon, StopIcon, RestartIcon } from './icons.js';
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Badge, Separator, Label } from '../ui';
import { cn } from '../../lib/utils';

interface DebugPanelProps {
  onBreakpointToggle: (path: string, line: number) => void;
  breakpoints: Map<string, { line: number; column?: number; condition?: string; verified: boolean }[]>;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onBreakpointToggle, breakpoints }) => {
  const {
    state,
    isDebugging,
    threads,
    currentThreadId,
    stackFrames,
    selectedFrameId,
    scopes,
    variables,
    output,
    startSession,
    stopSession,
    continue: continueExecution,
    next,
    stepIn,
    stepOut,
    pause,
    getThreads,
    getStackTrace,
    getScopes,
    getVariables,
    evaluate,
    clearOutput,
  } = useDapStore();

  const [adapterPath, setAdapterPath] = useState('');
  const [programPath, setProgramPath] = useState('');
  const [evalExpression, setEvalExpression] = useState('');
  const [evalResult, setEvalResult] = useState('');
  const [activeTab, setActiveTab] = useState<'variables' | 'watch' | 'callstack' | 'output'>('variables');
  const [expandedScopes, setExpandedScopes] = useState<Set<number>>(new Set());

  const handleStartDebug = async () => {
    if (!adapterPath || !programPath) return;
    await startSession(adapterPath, {
      type: 'launch',
      program: programPath,
      cwd: programPath.split('/').slice(0, -1).join('/'),
    });
  };

  const handleStopDebug = async () => {
    await stopSession();
  };

  const handleContinue = async () => {
    await continueExecution(currentThreadId ?? undefined);
  };

  const handleNext = async () => {
    await next(currentThreadId ?? undefined);
  };

  const handleStepIn = async () => {
    await stepIn(currentThreadId ?? undefined);
  };

  const handleStepOut = async () => {
    await stepOut(currentThreadId ?? undefined);
  };

  const handlePause = async () => {
    await pause(currentThreadId ?? undefined);
  };

  const handleFrameSelect = async (frameId: number) => {
    await getScopes(frameId);
    setExpandedScopes(new Set());
  };

  const handleScopeToggle = async (variablesReference: number) => {
    const newExpanded = new Set(expandedScopes);
    if (newExpanded.has(variablesReference)) {
      newExpanded.delete(variablesReference);
    } else {
      newExpanded.add(variablesReference);
      await getVariables(variablesReference);
    }
    setExpandedScopes(newExpanded);
  };

  const handleEvaluate = async () => {
    if (!evalExpression) return;
    const result = await evaluate(evalExpression, selectedFrameId ?? undefined);
    setEvalResult(result.result);
  };

  const stateColorMap = {
    running: 'bg-green-500',
    'stopped-debug': 'bg-yellow-500',
    stopped: 'bg-yellow-500',
    starting: 'bg-blue-500 animate-pulse',
  };
  const stateColor = stateColorMap[state as keyof typeof stateColorMap] || 'bg-muted-foreground';

  if (!isDebugging && state !== 'starting') {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <h3 className="text-sm font-semibold text-foreground">Start Debugging</h3>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Debug Adapter Path</Label>
            <Input
              value={adapterPath}
              onChange={e => setAdapterPath(e.target.value)}
              placeholder="/path/to/debug-adapter"
              className="text-xs bg-sidebar-accent/50 border-border"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Program Path</Label>
            <Input
              value={programPath}
              onChange={e => setProgramPath(e.target.value)}
              placeholder="/path/to/program"
              className="text-xs bg-sidebar-accent/50 border-border"
            />
          </div>

          <Button
            onClick={handleStartDebug}
            disabled={!adapterPath || !programPath}
            className="w-full"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start Debugging
          </Button>
        </div>

        {/* Breakpoints list */}
        {breakpoints.size > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Breakpoints</h4>
            <div className="space-y-1">
              {Array.from(breakpoints.entries()).map(([path, bps]) => (
                <div key={path} className="text-xs">
                  <div className="text-muted-foreground truncate">{path.split('/').pop()}</div>
                  {bps.map((bp, i) => (
                    <div key={i} className="flex items-center gap-2 pl-2 text-muted-foreground/70">
                      <span className={`w-2 h-2 rounded-full ${bp.verified ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                      <span>Line {bp.line}</span>
                      {bp.condition && <span className="text-yellow-500">({bp.condition})</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Debug toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-sidebar-border bg-sidebar-accent/30">
        <Button variant="ghost" size="icon" onClick={handleContinue} disabled={state !== 'stopped-debug'} className="h-7 w-7" title="Continue (F5)">
          <PlayIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePause} disabled={state !== 'running'} className="h-7 w-7" title="Pause (F6)">
          <PauseIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleStopDebug} className="h-7 w-7 text-red-400" title="Stop (Shift+F5)">
          <StopIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNext} disabled={state !== 'stopped-debug'} className="h-7 w-7" title="Step Over (F10)">
          <StepOverIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleStepIn} disabled={state !== 'stopped-debug'} className="h-7 w-7" title="Step Into (F11)">
          <StepIntoIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleStepOut} disabled={state !== 'stopped-debug'} className="h-7 w-7" title="Step Out (Shift+F11)">
          <StepOutIcon className="w-4 h-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", stateColor)} />
          <span className="text-xs text-muted-foreground">{state}</span>
        </div>
      </div>

      {/* Tab bar */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-2 border-b border-sidebar-border">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="variables" className="text-xs">Variables</TabsTrigger>
            <TabsTrigger value="callstack" className="text-xs">Call Stack</TabsTrigger>
            <TabsTrigger value="output" className="text-xs">Output</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Variables Tab */}
          <TabsContent value="variables" className="m-0 p-0">
            <div className="p-2">
              {scopes.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No variables available</div>
              ) : (
                scopes.map(scope => (
                  <div key={scope.name} className="mb-2">
                    <Button
                      variant="ghost"
                      size="compact"
                      onClick={() => handleScopeToggle(scope.variablesReference)}
                      className="w-full justify-start text-xs font-semibold"
                    >
                      <span className={cn("mr-1 transform transition-transform", expandedScopes.has(scope.variablesReference) ? 'rotate-90' : '')}>
                        ▶
                      </span>
                      {scope.name}
                    </Button>
                    {expandedScopes.has(scope.variablesReference) && (
                      <div className="pl-4 mt-1">
                        {(variables.get(scope.variablesReference) ?? []).map((v, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                            <span className="text-blue-400">{v.name}</span>
                            <span className="text-muted-foreground">:</span>
                            <span className="text-green-400 truncate">{v.value}</span>
                            {v.type && <span className="text-muted-foreground/60 text-[10px]">{v.type}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Call Stack Tab */}
          <TabsContent value="callstack" className="m-0 p-0">
            <div className="p-2">
              {stackFrames.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No stack frames</div>
              ) : (
                <div className="space-y-0.5">
                  {stackFrames.map(frame => (
                    <Button
                      key={frame.id}
                      variant={selectedFrameId === frame.id ? "secondary" : "ghost"}
                      size="compact"
                      onClick={() => handleFrameSelect(frame.id)}
                      className="w-full justify-start text-xs"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{frame.name}</span>
                        {frame.source?.path && (
                          <span className="text-muted-foreground truncate text-[10px]">
                            {frame.source.path.split('/').pop()}:{frame.line}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="m-0 p-0 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              {output.length === 0 ? (
                <div className="text-muted-foreground text-center py-4">No output</div>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      line.category === 'stderr' && 'text-red-400',
                      line.category === 'stdout' && 'text-foreground',
                      !line.category && 'text-muted-foreground'
                    )}
                  >
                    {line.output}
                  </div>
                ))
              )}
            </div>
            {/* Debug console input */}
            <div className="flex items-center gap-2 p-2 border-t border-sidebar-border">
              <span className="text-muted-foreground text-xs">{'>'}</span>
              <Input
                value={evalExpression}
                onChange={e => setEvalExpression(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleEvaluate();
                  }
                }}
                placeholder="Evaluate expression..."
                className="flex-1 text-xs bg-sidebar-accent/50 border-border"
              />
              <Button onClick={handleEvaluate} size="compact">
                Run
              </Button>
            </div>
            {evalResult && (
              <div className="px-2 py-1 text-xs text-green-400 border-t border-sidebar-border">
                {evalResult}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
