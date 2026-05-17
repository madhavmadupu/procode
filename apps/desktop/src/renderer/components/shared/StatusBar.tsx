import { useEffect, useState } from "react";
import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";
import { useEditorStore } from "../../stores/editor";
import { useGitStore } from "../../stores/git.store";
import { BranchIcon } from "./icons";
import { BranchPicker } from "./BranchPicker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  Separator,
  Badge,
} from "../ui";
import { cn } from "../../lib/utils";

export function StatusBar() {
  const { activeTabId, tabs } = useTabsStore();
  const { rootPath, state } = useWorkspaceStore();
  const { isSidebarOpen, isTerminalOpen, config } = useEditorStore();
  const { status, currentBranch, refreshStatus } = useGitStore();
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (rootPath) {
      refreshStatus();
    }
  }, [rootPath]);

  const hasChanges = status && status.files.some((f) => !f.staged);
  const hasConflicts = status?.hasConflicts;

  return (
    <footer className="h-6 flex items-center justify-between px-3 bg-statusBar text-status-bar-foreground text-[11px] select-none relative z-statusBar">
      <div className="flex items-center gap-3">
        {rootPath && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-help">
                <span className="relative flex h-2 w-2">
                  {state === "indexing" && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  )}
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      state === "ready" && "bg-green-500",
                      state === "indexing" && "bg-yellow-500",
                      state === "idle" && "bg-muted-foreground"
                    )}
                  ></span>
                </span>
                <span className="font-bold uppercase tracking-tighter">
                  {state === "ready" ? "Ready" : state === "indexing" ? "Indexing" : "Idle"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>Workspace Index Status: {state}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="h-3 bg-white/20" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="compact"
            onClick={() => useEditorStore.getState().toggleSidebar()}
            className="h-5 px-1.5 text-[11px] hover:bg-white/10 font-medium"
          >
            {isSidebarOpen ? "Sidebar" : "Explorer"}
          </Button>
          <Button
            variant="ghost"
            size="compact"
            onClick={() => useEditorStore.getState().toggleTerminal()}
            className="h-5 px-1.5 text-[11px] hover:bg-white/10 font-medium"
          >
            Terminal
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <div className="flex items-center gap-3">
              <span className="hover:bg-white/10 px-1 rounded cursor-pointer transition-colors">
                Ln 1, Col 1
              </span>
              <span className="hover:bg-white/10 px-1 rounded cursor-pointer transition-colors">
                Spaces: {config.tabSize}
              </span>
              <span className="hover:bg-white/10 px-1 rounded cursor-pointer transition-colors">
                UTF-8
              </span>
              <span className="hover:bg-white/10 px-1 rounded cursor-pointer transition-colors uppercase font-bold text-[10px]">
                {useTabsStore.getState().documents.get(activeTab.path)?.languageId || "plaintext"}
              </span>
            </div>
            <Separator orientation="vertical" className="h-3 bg-white/20" />
          </>
        )}

        {/* Git branch with status indicators */}
        {rootPath && currentBranch && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1.5 transition-colors group"
                onClick={() => setShowBranchPicker(!showBranchPicker)}
              >
                <BranchIcon className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                <span className="font-bold">{currentBranch}</span>
                <div className="flex items-center gap-0.5">
                  {hasConflicts && <span className="text-red-400 animate-pulse font-black">!</span>}
                  {hasChanges && !hasConflicts && (
                    <span className="text-white/60">●</span>
                  )}
                </div>
                {status && (status.ahead > 0 || status.behind > 0) && (
                  <Badge
                    variant="outline"
                    className="h-3.5 px-1 py-0 text-[8px] border-white/30 bg-white/10 font-black"
                  >
                    {status.ahead > 0 && `↑${status.ahead}`}
                    {status.behind > 0 && `↓${status.behind}`}
                  </Badge>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>Git Branch: {currentBranch}</p>
              {status && <p className="opacity-70 mt-1">{status.files.length} files changed</p>}
            </TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="h-3 bg-white/20" />
        <span className="font-black tracking-tighter opacity-50">PROCODE</span>
      </div>

      {/* Branch picker */}
      <BranchPicker
        isOpen={showBranchPicker}
        onClose={() => setShowBranchPicker(false)}
      />
    </footer>
  );
}
