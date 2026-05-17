import { useEffect, useState } from "react";
import { useWorkspaceStore } from "./stores/workspace";
import { useFileTreeStore } from "./stores/file-tree";
import { useTabsStore } from "./stores/tabs";
import { useEditorStore } from "./stores/editor";
import { useFirstRunStore } from "./stores/first-run";
import { FileTree } from "./components/sidebar/FileTree";
import { TabBar } from "./components/editor/TabBar";
import { EditorPanel } from "./components/editor/EditorPanel";
import { StatusBar } from "./components/shared/StatusBar";
import { Breadcrumbs } from "./components/shared/Breadcrumbs";
import { CommandPalette } from "./components/shared/CommandPalette";
import { FirstRunWizard } from "./components/shared/FirstRunWizard";
import { OpenFolderDialog } from "./components/shared/OpenFolderDialog";

function App() {
  const { rootPath, setWorkspace, state } = useWorkspaceStore();
  const { isSidebarOpen } = useEditorStore();
  const { hasCompletedOnboarding } = useFirstRunStore();
  const [showOpenDialog, setShowOpenDialog] = useState(!rootPath);

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
        {isSidebarOpen && rootPath && (
          <aside className="w-64 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
            <FileTree />
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
