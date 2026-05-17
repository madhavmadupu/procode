import { useTabsStore } from "../../stores/tabs";
import { useWorkspaceStore } from "../../stores/workspace";

export function StatusBar() {
  const { activeTabId, tabs } = useTabsStore();
  const { rootPath, state } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <footer className="h-6 flex items-center justify-between px-4 bg-blue-600 text-white text-xs select-none">
      <div className="flex items-center space-x-4">
        {rootPath && (
          <span>
            {state === "ready" ? "✓ Ready" : state === "indexing" ? "⟳ Indexing..." : "○ Idle"}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {activeTab && (
          <>
            <span>{activeTab.languageId || "plaintext"}</span>
            <span>UTF-8</span>
            <span>LF</span>
          </>
        )}
        <span>ProCode</span>
      </div>
    </footer>
  );
}
