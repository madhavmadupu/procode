import { useEffect, useState } from "react";
import { useFileTreeStore } from "../../stores/file-tree";
import { useWorkspaceStore } from "../../stores/workspace";
import { useTabsStore } from "../../stores/tabs";
import type { FileEntry, DirectoryEntry } from "@procode/types";
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from "../shared/icons";
import { trpc } from "../../lib/trpc";
import { ScrollArea } from "../ui";
import { cn } from "../../lib/utils";

interface FileTreeProps {}

export function FileTree({}: FileTreeProps) {
  const { root, expandedPaths, selectedPath, toggleExpand, selectFile, setRoot, setLoading } =
    useFileTreeStore();
  const { rootPath } = useWorkspaceStore();
  const { openTab } = useTabsStore();
  const [loading, setLoadingState] = useState(false);

  useEffect(() => {
    if (rootPath) {
      loadDirectory(rootPath);
    }
  }, [rootPath]);

  const loadDirectory = async (path: string) => {
    setLoadingState(true);
    try {
      const response = await trpc.fileSystem.readDirectory(path);
      setRoot(response);
    } catch (error) {
      console.error("Failed to load directory:", error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleFileClick = async (entry: FileEntry) => {
    selectFile(entry.path);

    if (!entry.isDirectory) {
      try {
        const content = await trpc.fileSystem.readFile(entry.path);

        openTab(
          {
            id: `tab-${entry.path}`,
            path: entry.path,
            name: entry.name,
            isDirty: false,
            isActive: true,
            pinned: false,
          },
          {
            path: entry.path,
            content,
            originalContent: content,
            languageId: entry.languageId || "plaintext",
            isDirty: false,
            version: 1,
            cursorPosition: { line: 0, column: 0 },
            scrollPosition: { top: 0, left: 0 },
          },
        );
      } catch (error) {
        console.error("Failed to read file:", error);
      }
    } else {
      toggleExpand(entry.path);
    }
  };

  const renderEntry = (entry: FileEntry, depth: number = 0) => {
    const isExpanded = expandedPaths.has(entry.path);
    const isSelected = selectedPath === entry.path;
    const isDirectory = entry.isDirectory;

    return (
      <div key={entry.path}>
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer transition-colors",
            isSelected
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-foreground hover:bg-sidebar-accent/50"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(entry)}
        >
          {isDirectory && (
            <span className="mr-1 w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </span>
          )}
          <span className="mr-2 w-4 h-4 flex items-center justify-center">
            {isDirectory ? (
              <FolderIcon className="w-4 h-4 text-blue-400" />
            ) : (
              <FileIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
          <span className="text-sm truncate">{entry.name}</span>
        </div>
        {isDirectory && isExpanded && "children" in entry && (
          <div>
            {(entry as DirectoryEntry).children.map((child) => renderEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!root) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">No workspace open</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-2">{root.children.map((entry) => renderEntry(entry))}</div>
    </ScrollArea>
  );
}
