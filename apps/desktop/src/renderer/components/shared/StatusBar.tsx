import { useEffect, useState } from "react";
import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";
import { useEditorStore } from "../../stores/editor";
import { useGitStore } from "../../stores/git.store";
import { BranchIcon } from "./icons";
import { BranchPicker } from "./BranchPicker";

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
    <footer className="h-6 flex items-center justify-between px-3 bg-blue-600 text-white text-xs select-none relative">
      <div className="flex items-center space-x-3">
        {rootPath && (
          <span className="flex items-center space-x-1">
            <span className={state === "ready" ? "text-green-300" : state === "indexing" ? "text-yellow-300" : ""}>
              {state === "ready" ? "✓" : state === "indexing" ? "⟳" : "○"}
            </span>
            <span>{state === "ready" ? "Ready" : state === "indexing" ? "Indexing..." : "Idle"}</span>
          </span>
        )}
        <button
          className="hover:bg-blue-700 px-1.5 py-0.5 rounded transition-colors"
          onClick={() => useEditorStore.getState().toggleSidebar()}
        >
          {isSidebarOpen ? "Sidebar" : "Explorer"}
        </button>
        <button
          className="hover:bg-blue-700 px-1.5 py-0.5 rounded transition-colors"
          onClick={() => useEditorStore.getState().toggleTerminal()}
        >
          Terminal
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {activeTab && (
          <>
            <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
              Ln 1, Col 1
            </span>
            <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
              Spaces: {config.tabSize}
            </span>
            <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
              UTF-8
            </span>
            <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
              LF
            </span>
            <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
              {activeTab.languageId || "plaintext"}
            </span>
          </>
        )}

        {/* Git branch with status indicators */}
        {rootPath && currentBranch && (
          <button
            className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1"
            onClick={() => setShowBranchPicker(!showBranchPicker)}
          >
            <BranchIcon className="w-3 h-3" />
            <span>{currentBranch}</span>
            {hasConflicts && (
              <span className="text-red-300">✗</span>
            )}
            {hasChanges && !hasConflicts && (
              <span className="text-yellow-300">●</span>
            )}
            {status && (status.ahead > 0 || status.behind > 0) && (
              <span className="text-zinc-300">
                {status.ahead > 0 && `↑${status.ahead}`}
                {status.behind > 0 && `↓${status.behind}`}
              </span>
            )}
          </button>
        )}

        <span className="font-medium">ProCode</span>
      </div>

      {/* Branch picker */}
      <BranchPicker
        isOpen={showBranchPicker}
        onClose={() => setShowBranchPicker(false)}
      />
    </footer>
  );
}
