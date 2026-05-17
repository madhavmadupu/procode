import React, { useState } from "react";
import type { Diagnostic } from "@procode/types";
import { Badge, ScrollArea, Button } from "../ui";
import { ChevronRightIcon, ChevronDownIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, LightbulbIcon } from "lucide-react";

interface ProblemPanelProps {
  diagnostics: Map<string, Diagnostic[]>;
  onDiagnosticClick: (diagnostic: Diagnostic) => void;
}

const severityIcons: Record<number, React.ReactNode> = {
  1: <AlertCircleIcon className="w-3.5 h-3.5" />,
  2: <AlertTriangleIcon className="w-3.5 h-3.5" />,
  3: <InfoIcon className="w-3.5 h-3.5" />,
  4: <LightbulbIcon className="w-3.5 h-3.5" />,
};

export const ProblemPanel: React.FC<ProblemPanelProps> = ({
  diagnostics,
  onDiagnosticClick,
}) => {
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info" | "hint">("all");
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const allDiagnostics = Array.from(diagnostics.entries()).flatMap(([uri, diags]) =>
    diags.map((d) => ({ ...d, uri })),
  );

  const filteredDiagnostics = allDiagnostics.filter((d) => {
    switch (filter) {
      case "error":
        return d.severity === 1;
      case "warning":
        return d.severity === 2;
      case "info":
        return d.severity === 3;
      case "hint":
        return d.severity === 4;
      default:
        return true;
    }
  });

  const groupedByFile = filteredDiagnostics.reduce((acc, diag) => {
    const fileName = diag.uri.split("/").pop() ?? diag.uri;
    if (!acc.has(fileName)) {
      acc.set(fileName, []);
    }
    acc.get(fileName)!.push(diag);
    return acc;
  }, new Map<string, typeof filteredDiagnostics>());

  const errorCount = allDiagnostics.filter((d) => d.severity === 1).length;
  const warningCount = allDiagnostics.filter((d) => d.severity === 2).length;
  const infoCount = allDiagnostics.filter((d) => d.severity === 3).length;

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-2">
        <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground">
          Zero Problems
        </Badge>
        <p className="text-xs italic">Your codebase is crystal clear.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-t border-border">
      {/* Header with counts */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <AlertCircleIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-tight">{errorCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangleIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-tight">{warningCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <InfoIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-tight">{infoCount}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {(["all", "error", "warning"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
              className="h-6 px-2 text-[9px] font-black uppercase"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      <ScrollArea className="flex-1">
        {Array.from(groupedByFile.entries()).map(([fileName, diags]) => (
          <div key={fileName} className="border-b border-border/50">
            <button
              onClick={() => toggleFile(fileName)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              {expandedFiles.has(fileName) ? (
                <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="truncate">{fileName}</span>
              <Badge variant="secondary" className="ml-auto h-4 px-1 text-[9px] font-bold">
                {diags.length}
              </Badge>
            </button>

            {expandedFiles.has(fileName) && (
              <div className="bg-muted/10 pb-1">
                {diags.map((diag, i) => (
                  <button
                    key={i}
                    onClick={() => onDiagnosticClick(diag)}
                    className="w-full flex items-start gap-3 px-8 py-1.5 text-[11px] hover:bg-accent/50 text-left transition-colors border-l-2 border-transparent hover:border-border"
                  >
                    <span className="mt-0.5 flex-shrink-0">{severityIcons[diag.severity]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground leading-tight">{diag.message}</div>
                      <div className="text-muted-foreground mt-1 text-[10px] font-medium flex items-center gap-2">
                        <span className="bg-muted px-1 rounded">
                          {diag.range.start.line + 1}:{diag.range.start.character + 1}
                        </span>
                        {diag.source && (
                          <Badge variant="outline" className="h-3.5 px-1 py-0 text-[8px] border-border/50">
                            {diag.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
