import React, { useState } from 'react';
import { useDapStore } from '../../stores/dap.store.js';
import { PlayIcon, PauseIcon, StepOverIcon, StepIntoIcon, StepOutIcon, StopIcon, RestartIcon } from './icons.js';

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

  if (!isDebugging && state !== 'starting') {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <h3 className="text-sm font-semibold text-gray-200">Start Debugging</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Debug Adapter Path</label>
            <input
              type="text"
              value={adapterPath}
              onChange={e => setAdapterPath(e.target.value)}
              placeholder="/path/to/debug-adapter"
              className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Program Path</label>
            <input
              type="text"
              value={programPath}
              onChange={e => setProgramPath(e.target.value)}
              placeholder="/path/to/program"
              className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleStartDebug}
            disabled={!adapterPath || !programPath}
            className="w-full px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            Start Debugging
          </button>
        </div>

        {/* Breakpoints list */}
        {breakpoints.size > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Breakpoints</h4>
            <div className="space-y-1">
              {Array.from(breakpoints.entries()).map(([path, bps]) => (
                <div key={path} className="text-xs">
                  <div className="text-gray-400 truncate">{path.split('/').pop()}</div>
                  {bps.map((bp, i) => (
                    <div key={i} className="flex items-center gap-2 pl-2 text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${bp.verified ? 'bg-red-500' : 'bg-gray-500'}`} />
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
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700 bg-gray-800">
        <button
          onClick={handleContinue}
          disabled={state !== 'stopped-debug'}
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Continue (F5)"
        >
          <PlayIcon className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handlePause}
          disabled={state !== 'running'}
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Pause (F6)"
        >
          <PauseIcon className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleStopDebug}
          className="p-1.5 rounded hover:bg-gray-700"
          title="Stop (Shift+F5)"
        >
          <StopIcon className="w-4 h-4 text-red-400" />
        </button>
        <button
          onClick={handleNext}
          disabled={state !== 'stopped-debug'}
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Step Over (F10)"
        >
          <StepOverIcon className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleStepIn}
          disabled={state !== 'stopped-debug'}
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Step Into (F11)"
        >
          <StepIntoIcon className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleStepOut}
          disabled={state !== 'stopped-debug'}
          className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Step Out (Shift+F11)"
        >
          <StepOutIcon className="w-4 h-4 text-gray-300" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            state === 'running' ? 'bg-green-500' :
            state === 'stopped-debug' ? 'bg-yellow-500' :
            state === 'starting' ? 'bg-blue-500 animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="text-xs text-gray-400">{state}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-700">
        {(['variables', 'callstack', 'output'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs ${
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'variables' && (
          <div className="p-2">
            {scopes.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No variables available</div>
            ) : (
              scopes.map(scope => (
                <div key={scope.name} className="mb-2">
                  <button
                    onClick={() => handleScopeToggle(scope.variablesReference)}
                    className="flex items-center gap-1 w-full text-xs font-semibold text-gray-300 hover:text-white"
                  >
                    <span className={`transform transition-transform ${expandedScopes.has(scope.variablesReference) ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    {scope.name}
                  </button>
                  {expandedScopes.has(scope.variablesReference) && (
                    <div className="pl-4 mt-1">
                      {(variables.get(scope.variablesReference) ?? []).map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                          <span className="text-blue-400">{v.name}</span>
                          <span className="text-gray-500">:</span>
                          <span className="text-green-400 truncate">{v.value}</span>
                          {v.type && <span className="text-gray-500 text-[10px]">{v.type}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'callstack' && (
          <div className="p-2">
            {stackFrames.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No stack frames</div>
            ) : (
              <div className="space-y-0.5">
                {stackFrames.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => handleFrameSelect(frame.id)}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      selectedFrameId === frame.id
                        ? 'bg-blue-600/30 text-white'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="font-medium">{frame.name}</div>
                    {frame.source?.path && (
                      <div className="text-gray-500 truncate">
                        {frame.source.path.split('/').pop()}:{frame.line}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              {output.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No output</div>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    className={`${
                      line.category === 'stderr' ? 'text-red-400' :
                      line.category === 'stdout' ? 'text-gray-200' :
                      'text-gray-400'
                    }`}
                  >
                    {line.output}
                  </div>
                ))
              )}
            </div>
            {/* Debug console input */}
            <div className="flex items-center gap-2 p-2 border-t border-gray-700">
              <span className="text-gray-500 text-xs">{'>'}</span>
              <input
                type="text"
                value={evalExpression}
                onChange={e => setEvalExpression(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleEvaluate();
                  }
                }}
                placeholder="Evaluate expression..."
                className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleEvaluate}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Run
              </button>
            </div>
            {evalResult && (
              <div className="px-2 py-1 text-xs text-green-400 border-t border-gray-700">
                {evalResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
