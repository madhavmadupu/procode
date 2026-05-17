import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "../ui/sidebar"
import {
  FolderIcon,
  SourceControlIcon,
  BugIcon,
  AlertIcon,
  ExtensionsIcon,
  ClockIcon,
  SparkleIcon,
} from "../shared/icons"
import { useWorkspaceStore } from "../../stores/workspace"
import { useLspStore } from "../../stores/lsp.store"
import { useDapStore } from "../../stores/dap.store"
import { useTabsStore } from "../../stores/tabs"
import { trpc } from "../../lib/trpc"
import { FileTree } from "./FileTree"
import { SourceControl } from "./SourceControl"
import { Timeline } from "./Timeline"
import { AgentPanel } from "./AgentPanel"
import { ExtensionPanel } from "./ExtensionPanel"
import { ProblemPanel } from "../shared/ProblemPanel"
import { DebugPanel } from "../shared/DebugPanel"

export type SidebarPanelType =
  | "explorer"
  | "source-control"
  | "timeline"
  | "agent"
  | "debug"
  | "problems"
  | "extensions"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activePanel: SidebarPanelType
  setActivePanel: (panel: SidebarPanelType) => void
}

export function AppSidebar({ activePanel, setActivePanel, ...props }: AppSidebarProps) {
  const { rootPath } = useWorkspaceStore()
  const { setOpen } = useSidebar()
  const { diagnostics } = useLspStore()
  const { breakpoints, setBreakpoints } = useDapStore()
  const { openTab } = useTabsStore()

  const handleDiagnosticClick = async (diagnostic: any) => {
    if (diagnostic.uri) {
      try {
        const path = diagnostic.uri.replace("file://", "")
        const content = await trpc.fileSystem.readFile(path)
        openTab(
          {
            id: `tab-${path}`,
            path: path,
            name: path.split(/[\\/]/).pop() || path,
            isDirty: false,
            isActive: true,
            pinned: false,
          },
          {
            path: path,
            content,
            originalContent: content,
            languageId: "plaintext",
            isDirty: false,
            version: 1,
            cursorPosition: { line: diagnostic.range.start.line, column: diagnostic.range.start.character },
            scrollPosition: { top: 0, left: 0 },
          }
        )
      } catch (e) {
        console.error("Failed to open file from diagnostic", e)
      }
    }
  }

  const handleBreakpointToggle = (path: string, line: number) => {
    const existing = breakpoints.get(path) || [];
    const isSet = existing.some(bp => bp.line === line);
    if (isSet) {
      setBreakpoints(path, existing.filter(bp => bp.line !== line));
    } else {
      setBreakpoints(path, [...existing, { line, verified: false }]);
    }
  }

  const navItems = [
    { id: "explorer", icon: FolderIcon, label: "Explorer" },
    { id: "source-control", icon: SourceControlIcon, label: "Source Control" },
    { id: "debug", icon: BugIcon, label: "Run & Debug" },
    { id: "problems", icon: AlertIcon, label: "Problems" },
    { id: "extensions", icon: ExtensionsIcon, label: "Extensions" },
    { id: "timeline", icon: ClockIcon, label: "Timeline" },
    { id: "agent", icon: SparkleIcon, label: "AI Agent" },
  ] as const

  if (!rootPath) return null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="font-bold">PC</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">ProCode IDE</span>
                <span className="truncate text-xs">{rootPath.split(/[\\/]/).pop()}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Navigation / Activity Bar items (visible when collapsed) */}
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                tooltip={item.label}
                isActive={activePanel === item.id}
                onClick={() => {
                  setActivePanel(item.id)
                  setOpen(true)
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Panel Content (Visible when expanded) */}
        <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden mt-4 border-t border-border pt-2">
          {activePanel === "explorer" && <FileTree />}
          {activePanel === "source-control" && <SourceControl />}
          {activePanel === "timeline" && <Timeline />}
          {activePanel === "agent" && <AgentPanel />}
          {activePanel === "debug" && (
            <div className="h-full overflow-y-auto">
              <DebugPanel 
                breakpoints={breakpoints} 
                onBreakpointToggle={handleBreakpointToggle} 
              />
            </div>
          )}
          {activePanel === "problems" && (
            <div className="h-full overflow-y-auto">
              <ProblemPanel 
                diagnostics={diagnostics} 
                onDiagnosticClick={handleDiagnosticClick} 
              />
            </div>
          )}
          {activePanel === "extensions" && (
            <React.Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Loading...</div>}>
              <ExtensionPanel />
            </React.Suspense>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <ExtensionsIcon className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
