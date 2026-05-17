import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";
import { useEditorStore } from "../../stores/editor";

export function StatusBar() {
  const { activeTabId, tabs } = useTabsStore();
  const { rootPath, state } = useWorkspaceStore();
  const { isSidebarOpen, isTerminalOpen, config } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <footer className="h-6 flex items-center justify-between px-3 bg-blue-600 text-white text-xs select-none">
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
        <span className="hover:bg-blue-700 px-1.5 py-0.5 rounded cursor-pointer">
          main
        </span>
        <span className="font-medium">ProCode</span>
      </div>
    </footer>
  );
}
