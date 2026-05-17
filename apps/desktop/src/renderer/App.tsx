import { useEffect, useState } from "react";
import { useWorkspaceStore } from "./stores/workspace";
import { useFileTreeStore } from "./stores/file-tree";
import { useTabsStore } from "./stores/tabs";
import { useEditorStore } from "./stores/editor";
import { useFirstRunStore } from "./stores/first-run";
import { FileTree } from "./components/sidebar/FileTree";
import { SourceControl } from "./components/sidebar/SourceControl";
import { Timeline } from "./components/sidebar/Timeline";
import { TabBar } from "./components/editor/TabBar";
import { EditorPanel } from "./components/editor/EditorPanel";
import { StatusBar } from "./components/shared/StatusBar";
import { Breadcrumbs } from "./components/shared/Breadcrumbs";
import { CommandPalette } from "./components/shared/CommandPalette";
import { FirstRunWizard } from "./components/shared/FirstRunWizard";
import { OpenFolderDialog } from "./components/shared/OpenFolderDialog";
import { FolderIcon, SourceControlIcon, ClockIcon } from "./components/shared/icons";

type SidebarPanel = "explorer" | "source-control" | "timeline";

function App() {
  const { rootPath, setWorkspace, state } = useWorkspaceStore();
  const { isSidebarOpen } = useEditorStore();
  const { hasCompletedOnboarding } = useFirstRunStore();
  const [showOpenDialog, setShowOpenDialog] = useState(!rootPath);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("explorer");

  useEffect(() => {
    if (!rootPath && hasCompletedOnboarding) {
      setShowOpenDialog(true);
    }
  }, [rootPath, hasCompletedOnboarding]);

  const handleOpenFolder = async (folderPath: string) => {
    setWorkspace(folderPath);
    setShowOpenDialog(false);
  };

  if (!hasCompletedOnboarding) {
    return <FirstRunWizard />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="h-8 flex items-center px-4 border-b border-zinc-800 bg-zinc-900 select-none">
        <span className="text-sm font-medium">ProCode</span>
        {rootPath && (
          <span className="ml-4 text-xs text-zinc-500 truncate">
            {rootPath}
          </span>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        {isSidebarOpen && rootPath && (
          <div className="w-12 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-2 gap-1">
            <button
              onClick={() => setActivePanel("explorer")}
              className={`p-2 rounded transition-colors ${
                activePanel === "explorer"
                  ? "text-zinc-100 bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Explorer"
            >
              <FolderIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActivePanel("source-control")}
              className={`p-2 rounded transition-colors ${
                activePanel === "source-control"
                  ? "text-zinc-100 bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Source Control"
            >
              <SourceControlIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActivePanel("timeline")}
              className={`p-2 rounded transition-colors ${
                activePanel === "timeline"
                  ? "text-zinc-100 bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Timeline"
            >
              <ClockIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Sidebar Panel */}
        {isSidebarOpen && rootPath && (
          <aside className="w-64 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
            {activePanel === "explorer" && <FileTree />}
            {activePanel === "source-control" && <SourceControl />}
            {activePanel === "timeline" && <Timeline />}
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {rootPath ? (
            <>
              <TabBar />
              <Breadcrumbs />
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowOpenDialog(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                Open Folder
              </button>
            </div>
          )}
        </div>
      </main>

      <StatusBar />

      {showOpenDialog && (
        <OpenFolderDialog
          onOpen={handleOpenFolder}
          onClose={() => rootPath && setShowOpenDialog(false)}
        />
      )}

      <CommandPalette />
    </div>
  );
}

export default App;
