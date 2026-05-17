import React, { useState } from 'react';
import { CheckIcon, XIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon } from './icons.js';

interface DiffHunk {
  id: string;
  header: string;
  lines: Array<{ type: 'added' | 'removed' | 'context'; content: string; lineNum: number }>;
}

interface FileDiff {
  path: string;
  hunks: DiffHunk[];
}

interface HitlApprovalProps {
  taskId: string;
  diffs: FileDiff[];
  onApprove: (diffId: string) => void;
  onReject: (diffId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onApproveHunk: (hunkId: string) => void;
}

export const HitlApprovalPanel: React.FC<HitlApprovalProps> = ({
  taskId,
  diffs,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  onApproveHunk,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-medium mb-1">Review Changes</h3>
        <p className="text-xs text-zinc-500">Task: {taskId}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onApproveAll}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-medium"
          >
            <CheckCircleIcon className="w-3 h-3" />
            Accept All
          </button>
          <button
            onClick={onRejectAll}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-medium"
          >
            <XCircleIcon className="w-3 h-3" />
            Reject All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {diffs.map((diff) => (
          <div key={diff.path} className="border-b border-zinc-800">
            <div
              className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800/50 cursor-pointer"
              onClick={() => toggleFile(diff.path)}
            >
              <div className="flex items-center gap-2">
                <ChevronRightIcon
                  className={`w-3 h-3 transition-transform ${
                    expandedFiles.has(diff.path) ? 'rotate-90' : ''
                  }`}
                />
                <span className="text-xs font-mono text-zinc-300">{diff.path}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(diff.path);
                  }}
                  className="p-1 hover:bg-green-900/50 rounded"
                  title="Accept file"
                >
                  <CheckIcon className="w-3 h-3 text-green-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(diff.path);
                  }}
                  className="p-1 hover:bg-red-900/50 rounded"
                  title="Reject file"
                >
                  <XIcon className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>

            {expandedFiles.has(diff.path) && (
              <div className="px-4 pb-3">
                {diff.hunks.map((hunk) => (
                  <div key={hunk.id} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-zinc-500">{hunk.header}</span>
                      <button
                        onClick={() => onApproveHunk(hunk.id)}
                        className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                      >
                        Accept Hunk
                      </button>
                    </div>
                    <div className="bg-zinc-950 rounded border border-zinc-800 overflow-auto max-h-64">
                      <pre className="text-xs font-mono">
                        {hunk.lines.map((line, index) => (
                          <div
                            key={index}
                            className={`px-2 py-0.5 ${
                              line.type === 'added'
                                ? 'bg-green-900/20 text-green-300'
                                : line.type === 'removed'
                                ? 'bg-red-900/20 text-red-300'
                                : 'text-zinc-400'
                            }`}
                          >
                            <span className="inline-block w-8 text-zinc-600 select-none">
                              {line.lineNum}
                            </span>
                            <span className="ml-2">
                              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                              {line.content}
                            </span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
