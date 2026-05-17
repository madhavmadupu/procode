import React, { useState } from 'react';
import type { Diagnostic } from '@procode/types';

interface ProblemPanelProps {
  diagnostics: Map<string, Diagnostic[]>;
  onDiagnosticClick: (diagnostic: Diagnostic) => void;
}

const severityIcons: Record<number, string> = {
  1: '🔴',
  2: '🟡',
  3: 'ℹ️',
  4: '💡',
};

const severityLabels: Record<number, string> = {
  1: 'Error',
  2: 'Warning',
  3: 'Info',
  4: 'Hint',
};

export const ProblemPanel: React.FC<ProblemPanelProps> = ({ diagnostics, onDiagnosticClick }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'hint'>('all');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const allDiagnostics = Array.from(diagnostics.entries()).flatMap(([uri, diags]) =>
    diags.map(d => ({ ...d, uri }))
  );

  const filteredDiagnostics = allDiagnostics.filter(d => {
    switch (filter) {
      case 'error': return d.severity === 1;
      case 'warning': return d.severity === 2;
      case 'info': return d.severity === 3;
      case 'hint': return d.severity === 4;
      default: return true;
    }
  });

  const groupedByFile = filteredDiagnostics.reduce((acc, diag) => {
    const fileName = diag.uri.split('/').pop() ?? diag.uri;
    if (!acc.has(fileName)) {
      acc.set(fileName, []);
    }
    acc.get(fileName)!.push(diag);
    return acc;
  }, new Map<string, typeof filteredDiagnostics>());

  const errorCount = allDiagnostics.filter(d => d.severity === 1).length;
  const warningCount = allDiagnostics.filter(d => d.severity === 2).length;
  const infoCount = allDiagnostics.filter(d => d.severity === 3).length;

  const toggleFile = (fileName: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName);
    } else {
      newExpanded.add(fileName);
    }
    setExpandedFiles(newExpanded);
  };

  if (allDiagnostics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No problems detected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with counts */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-700 text-xs">
        <span className="text-red-400">{errorCount} errors</span>
        <span className="text-yellow-400">{warningCount} warnings</span>
        <span className="text-blue-400">{infoCount} infos</span>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-700">
        {(['all', 'error', 'warning', 'info'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs rounded ${
              filter === f
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Problem list */}
      <div className="flex-1 overflow-y-auto">
        {Array.from(groupedByFile.entries()).map(([fileName, diags]) => (
          <div key={fileName} className="border-b border-gray-700/50">
            <button
              onClick={() => toggleFile(fileName)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700/50"
            >
              <span className={`transform transition-transform ${expandedFiles.has(fileName) ? 'rotate-90' : ''}`}>
                ▶
              </span>
              <span className="truncate">{fileName}</span>
              <span className="ml-auto text-gray-500">{diags.length}</span>
            </button>

            {expandedFiles.has(fileName) && (
              <div className="pl-6">
                {diags.map((diag, i) => (
                  <button
                    key={i}
                    onClick={() => onDiagnosticClick(diag)}
                    className="w-full flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-gray-700/50 text-left"
                  >
                    <span className="mt-0.5">{severityIcons[diag.severity]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-300 truncate">{diag.message}</div>
                      <div className="text-gray-500">
                        [{diag.range.start.line + 1}:{diag.range.start.character + 1}]
                        {diag.source && ` (${diag.source})`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
