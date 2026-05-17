import React, { useState } from 'react';
import { CheckIcon, XIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon } from './icons.js';
import { Button, ScrollArea, Badge, Separator } from '../ui';
import { cn } from '../../lib/utils';

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
    <div className="flex flex-col h-full bg-sidebar">
      <div className="px-4 py-3 border-b border-sidebar-border">
        <h3 className="text-sm font-medium mb-1">Review Changes</h3>
        <p className="text-xs text-muted-foreground">Task: {taskId}</p>
        <div className="flex gap-2 mt-3">
          <Button onClick={onApproveAll} size="compact" className="bg-green-600 hover:bg-green-700">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Accept All
          </Button>
          <Button onClick={onRejectAll} size="compact" variant="destructive">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Reject All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {diffs.map((diff) => (
          <div key={diff.path} className="border-b border-sidebar-border">
            <div
              className="flex items-center justify-between px-4 py-2 hover:bg-sidebar-accent/50 cursor-pointer"
              onClick={() => toggleFile(diff.path)}
            >
              <div className="flex items-center gap-2">
                <ChevronRightIcon
                  className={cn(
                    "w-3 h-3 transition-transform",
                    expandedFiles.has(diff.path) && 'rotate-90'
                  )}
                />
                <span className="text-xs font-mono text-foreground">{diff.path}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(diff.path);
                  }}
                  className="h-6 w-6 hover:bg-green-900/50"
                  title="Accept file"
                >
                  <CheckIcon className="w-3 h-3 text-green-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(diff.path);
                  }}
                  className="h-6 w-6 hover:bg-red-900/50"
                  title="Reject file"
                >
                  <XIcon className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            </div>

            {expandedFiles.has(diff.path) && (
              <div className="px-4 pb-3">
                {diff.hunks.map((hunk) => (
                  <div key={hunk.id} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{hunk.header}</span>
                      <Button
                        variant="outline"
                        size="compact"
                        onClick={() => onApproveHunk(hunk.id)}
                      >
                        Accept Hunk
                      </Button>
                    </div>
                    <div className="bg-editor rounded border border-sidebar-border overflow-auto max-h-64">
                      <pre className="text-xs font-mono">
                        {hunk.lines.map((line, index) => (
                          <div
                            key={index}
                            className={cn(
                              "px-2 py-0.5",
                              line.type === 'added' && 'bg-green-900/20 text-green-300',
                              line.type === 'removed' && 'bg-red-900/20 text-red-300',
                              line.type === 'context' && 'text-muted-foreground'
                            )}
                          >
                            <span className="inline-block w-8 text-muted-foreground/40 select-none">
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
      </ScrollArea>
    </div>
  );
};
