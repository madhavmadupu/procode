import { useEffect, useState, lazy, Suspense } from "react";
import { useWorkspaceStore } from "./stores/workspace";
import { useFileTreeStore } from "./stores/file-tree";
import { useTabsStore } from "./stores/tabs";
import { useEditorStore } from "./stores/editor";
import { useFirstRunStore } from "./stores/first-run";
import { useLspStore } from "./stores/lsp.store";
import { useDapStore } from "./stores/dap.store";
import { FileTree } from "./components/sidebar/FileTree";
import { SourceControl } from "./components/sidebar/SourceControl";
import { Timeline } from "./components/sidebar/Timeline";
import { AgentPanel } from "./components/sidebar/AgentPanel";
import { TabBar } from "./components/editor/TabBar";
import { EditorPanel } from "./components/editor/EditorPanel";
import { StatusBar } from "./components/shared/StatusBar";
import { Breadcrumbs } from "./components/shared/Breadcrumbs";
import { CommandPalette } from "./components/shared/CommandPalette";
import { FirstRunWizard } from "./components/shared/FirstRunWizard";
import { OpenFolderDialog } from "./components/shared/OpenFolderDialog";
import { ProblemPanel } from "./components/shared/ProblemPanel";
import { DebugPanel } from "./components/shared/DebugPanel";
import { TerminalPanel } from "./components/shared/TerminalPanel";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { NotificationToast } from "./components/shared/NotificationToast";
import {
  FolderIcon,
  SourceControlIcon,
  ClockIcon,
  SparkleIcon,
  BugIcon,
  AlertIcon,
  TerminalIcon,
  ExtensionsIcon,
} from "./components/shared/icons";
import { Button, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, ScrollArea } from "./components/ui";
import { cn } from "./lib/utils";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";

const ExtensionPanel = lazy(() => import("./components/sidebar/ExtensionPanel"));

type SidebarPanelType = "explorer" | "source-control" | "timeline" | "agent" | "debug" | "problems" | "extensions";

function createLocalStoragePanelStorage(): Pick<Storage, "getItem" | "setItem"> {
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(`procode-layout-${key}`);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(`procode-layout-${key}`, value);
      } catch {
        // Storage full or disabled
      }
    },
  };
}

interface ResizableGroupProps {
  id: string;
  orientation: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
}

function ResizableGroup({ id, orientation, className, children }: ResizableGroupProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id,
    storage: createLocalStoragePanelStorage(),
  });

  return (
    <Group
      id={id}
      orientation={orientation}
      className={className}
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
    >
      {children}
    </Group>
  );
}

type SidebarPanel = "explorer" | "source-control" | "timeline" | "agent" | "debug" | "problems" | "extensions";

interface ActivityButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ActivityButton({ icon, label, isActive, onClick }: ActivityButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "ghost-active" : "ghost"}
          size="icon"
          onClick={onClick}
          aria-label={label}
          aria-pressed={isActive}
          className={cn(
            "h-12 w-12 rounded-none",
            isActive ? "text-activity-bar-foreground-active" : "text-activity-bar-foreground"
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function App() {
  const { rootPath, workspaceName, setWorkspace, rehydrate, state } = useWorkspaceStore();
  const { isSidebarOpen, toggleSidebar, toggleTerminal } = useEditorStore();
  const { hasCompletedOnboarding, initialize: initializeFirstRun } = useFirstRunStore();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanelType>("explorer");
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const lspStore = useLspStore();
  const dapStore = useDapStore();

  useEffect(() => {
    async function init() {
      await initializeFirstRun();

      const lastWorkspace = await window.procode.ipc.invoke("get-last-workspace", {}) as { rootPath: string; name: string } | null;
      if (lastWorkspace) {
        rehydrate(lastWorkspace.rootPath, lastWorkspace.name);
      }

      setIsInitializing(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!rootPath && hasCompletedOnboarding && !isInitializing) {
      setShowOpenDialog(true);
    }
  }, [rootPath, hasCompletedOnboarding, isInitializing]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setBottomPanelOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenFolder = async (folderPath: string) => {
    setWorkspace(folderPath);
    setShowOpenDialog(false);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading ProCode...</div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <FirstRunWizard />;
  }

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <div className="h-screen w-screen flex flex-col bg-background text-foreground">
          {/* Title Bar */}
          <header className="h-8 flex items-center px-4 border-b border-sidebar-border bg-title-bar text-title-bar-foreground select-none" role="banner">
            <span className="text-sm font-medium">ProCode</span>
            {workspaceName && (
              <span className="ml-4 text-xs text-muted-foreground truncate">
                {workspaceName}
              </span>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 flex overflow-hidden">
            {rootPath ? (
              <ResizableGroup id="root-layout" orientation="horizontal" className="flex-1">
                {/* Activity Bar + Sidebar */}
                {isSidebarOpen && (
                  <>
                    <Panel id="activity-bar" defaultSize={3} minSize={3} maxSize={3} className="flex">
                      <nav className="w-full border-r border-sidebar-border bg-activity-bar flex flex-col items-center py-2 gap-1" role="navigation" aria-label="Activity Bar">
                        <ActivityButton
                          icon={<FolderIcon className="w-5 h-5" />}
                          label="Explorer"
                          isActive={activePanel === "explorer"}
                          onClick={() => setActivePanel("explorer")}
                        />
                        <ActivityButton
                          icon={<SourceControlIcon className="w-5 h-5" />}
                          label="Source Control"
                          isActive={activePanel === "source-control"}
                          onClick={() => setActivePanel("source-control")}
                        />
                        <ActivityButton
                          icon={<BugIcon className="w-5 h-5" />}
                          label="Run & Debug"
                          isActive={activePanel === "debug"}
                          onClick={() => setActivePanel("debug")}
                        />
                        <ActivityButton
                          icon={<AlertIcon className="w-5 h-5" />}
                          label="Problems"
                          isActive={activePanel === "problems"}
                          onClick={() => setActivePanel("problems")}
                        />
                        <ActivityButton
                          icon={<ClockIcon className="w-5 h-5" />}
                          label="Timeline"
                          isActive={activePanel === "timeline"}
                          onClick={() => setActivePanel("timeline")}
                        />
                        <ActivityButton
                          icon={<SparkleIcon className="w-5 h-5" />}
                          label="AI Agent"
                          isActive={activePanel === "agent"}
                          onClick={() => setActivePanel("agent")}
                        />
                        <div className="flex-1" />
                        <ActivityButton
                          icon={<TerminalIcon className="w-5 h-5" />}
                          label="Terminal"
                          isActive={bottomPanelOpen}
                          onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
                        />
                        <ActivityButton
                          icon={<ExtensionsIcon className="w-5 h-5" />}
                          label="Extensions"
                          isActive={activePanel === "extensions"}
                          onClick={() => setActivePanel("extensions")}
                        />
                      </nav>
                    </Panel>

                    <Separator className="w-px bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />

                    <Panel id="sidebar" defaultSize={17} minSize={12} maxSize={40} collapsible collapsedSize={0}>
                      <aside className="h-full border-r border-sidebar-border bg-sidebar flex flex-col" role="complementary" aria-label="Sidebar Panel">
                        <ScrollArea className="flex-1">
                          {activePanel === "explorer" && <FileTree />}
                          {activePanel === "source-control" && <SourceControl />}
                          {activePanel === "timeline" && <Timeline />}
                          {activePanel === "agent" && <AgentPanel />}
                          {activePanel === "debug" && (
                            <DebugPanel
                              onBreakpointToggle={(path, line) => {
                                const existing = dapStore.breakpoints.get(path) ?? [];
                                const exists = existing.some(bp => bp.line === line);
                                if (exists) {
                                  const filtered = existing.filter(bp => bp.line !== line);
                                  dapStore.setBreakpoints(path, filtered);
                                } else {
                                  dapStore.setBreakpoints(path, [...existing, { line, verified: false }]);
                                }
                              }}
                              breakpoints={dapStore.breakpoints}
                            />
                          )}
                          {activePanel === "problems" && (
                            <ProblemPanel
                              diagnostics={lspStore.diagnostics}
                              onDiagnosticClick={(diagnostic) => {
                                console.log("Diagnostic clicked:", diagnostic);
                              }}
                            />
                          )}
                          {activePanel === "extensions" && (
                            <Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Loading extensions...</div>}>
                              <ExtensionPanel />
                            </Suspense>
                          )}
                        </ScrollArea>
                      </aside>
                    </Panel>

                    <Separator className="w-px bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
                  </>
                )}

                {/* Main content area */}
                <Panel id="main-content" defaultSize={isSidebarOpen ? 80 : 100}>
                  <ResizableGroup id="editor-panel-group" orientation="vertical">
                    {/* Editor area */}
                    <Panel id="editor-area" defaultSize={bottomPanelOpen ? 70 : 100} minSize={30}>
                      <div className="flex flex-col h-full">
                        <TabBar />
                        <Breadcrumbs />
                        <div className="flex-1 overflow-hidden">
                          <EditorPanel />
                        </div>
                      </div>
                    </Panel>

                    {bottomPanelOpen && (
                      <>
                        <Separator className="h-px bg-border hover:bg-primary/50 transition-colors cursor-row-resize" />

                        {/* Bottom panels */}
                        <Panel id="bottom-panel" defaultSize={30} minSize={15} maxSize={60} collapsible collapsedSize={0}>
                          <TerminalPanel />
                        </Panel>
                      </>
                    )}
                  </ResizableGroup>
                </Panel>
              </ResizableGroup>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Button onClick={() => setShowOpenDialog(true)} size="lg">
                  Open Folder
                </Button>
              </div>
            )}
          </main>

          {/* Status Bar */}
          <StatusBar />

          {/* Overlays */}
          {showOpenDialog && (
            <OpenFolderDialog
              onOpen={handleOpenFolder}
              onClose={() => rootPath && setShowOpenDialog(false)}
            />
          )}

          <CommandPalette />
          <NotificationToast />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
