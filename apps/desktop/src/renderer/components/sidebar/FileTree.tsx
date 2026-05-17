import React, { useEffect, useState, useRef, useCallback } from "react";
import { useFileTreeStore } from "../../stores/file-tree";
import { useWorkspaceStore } from "../../stores/workspace";
import { useTabsStore } from "../../stores/tabs";
import type { FileEntry, DirectoryEntry } from "@procode/types";
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, TrashIcon, PencilIcon, CopyIcon, FolderPlusIcon, FilePlusIcon } from "../shared/icons";
import { trpc } from "../../lib/trpc";
import { ScrollArea, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, Input, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "../ui";
import { FileIcon } from "./FileIcon";
import { cn } from "../../lib/utils";

const EXCLUDED_PATTERNS = ["node_modules", ".git", "dist", "build", "target", ".turbo"];

function isExcluded(name: string): boolean {
  return EXCLUDED_PATTERNS.includes(name);
}

function splitNameAndExt(name: string): [string, string] {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return [name, ""];
  return [name.slice(0, idx), name.slice(idx)];
}

interface ContextMenuState {
  x: number;
  y: number;
  entry: FileEntry;
}

interface InlineCreateState {
  parentPath: string;
  type: "file" | "folder";
}

export function FileTree() {
  const { root, expandedPaths, selectedPath, toggleExpand, selectFile, setRoot, setLoading } = useFileTreeStore();
  const { rootPath } = useWorkspaceStore();
  const { openTab } = useTabsStore();
  const [loading, setLoadingState] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [inlineCreate, setInlineCreate] = useState<InlineCreateState | null>(null);
  const [renamePath, setRenamePath] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const treeRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rootPath) {
      loadDirectory(rootPath);
    }
  }, [rootPath]);

  useEffect(() => {
    if (inlineCreate || renamePath) {
      inlineInputRef.current?.focus();
    }
  }, [inlineCreate, renamePath]);

  useEffect(() => {
    function handleClick() {
      setContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (renamePath || inlineCreate) return;
      if (!rootPath) return;

      const allEntries = flattenTree(root);
      const currentIdx = allEntries.findIndex(e => e.path === selectedPath);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = allEntries[Math.min(currentIdx + 1, allEntries.length - 1)];
        if (next) selectFile(next.path);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = allEntries[Math.max(currentIdx - 1, 0)];
        if (prev) selectFile(prev.path);
      } else if (e.key === "ArrowRight" && selectedPath) {
        const entry = allEntries.find(e => e.path === selectedPath);
        if (entry?.isDirectory && !expandedPaths.has(selectedPath)) {
          toggleExpand(selectedPath);
        }
      } else if (e.key === "ArrowLeft" && selectedPath) {
        const entry = allEntries.find(e => e.path === selectedPath);
        if (entry?.isDirectory && expandedPaths.has(selectedPath)) {
          toggleExpand(selectedPath);
        }
      } else if (e.key === "Enter" && selectedPath) {
        const entry = allEntries.find(e => e.path === selectedPath);
        if (entry && !entry.isDirectory) {
          handleFileOpen(entry);
        }
      } else if (e.key === "F2" && selectedPath) {
        setRenamePath(selectedPath);
      } else if (e.key === "Delete" && selectedPath) {
        const entry = allEntries.find(e => e.path === selectedPath);
        if (entry) setDeleteTarget(entry);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [root, selectedPath, expandedPaths, rootPath]);

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

  const handleFileOpen = async (entry: FileEntry) => {
    if (entry.isDirectory) return;
    selectFile(entry.path);
    try {
      const content = await trpc.fileSystem.readFile(entry.path);
      openTab(
        { id: `tab-${entry.path}`, path: entry.path, name: entry.name, isDirty: false, isActive: true, pinned: false },
        { path: entry.path, content, originalContent: content, languageId: entry.languageId || "plaintext", isDirty: false, version: 1, cursorPosition: { line: 0, column: 0 }, scrollPosition: { top: 0, left: 0 } }
      );
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const handleEntryClick = (entry: FileEntry, index: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const newSet = new Set(selectedPaths);
      if (newSet.has(entry.path)) {
        newSet.delete(entry.path);
      } else {
        newSet.add(entry.path);
      }
      setSelectedPaths(newSet);
      selectFile(entry.path);
      setLastSelectedIndex(index);
    } else if (e.shiftKey && lastSelectedIndex >= 0) {
      const allEntries = flattenTree(root);
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSet = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSet.add(allEntries[i]!.path);
      }
      setSelectedPaths(newSet);
      selectFile(entry.path);
    } else {
      setSelectedPaths(new Set([entry.path]));
      selectFile(entry.path);
      setLastSelectedIndex(index);
      if (entry.isDirectory) {
        toggleExpand(entry.path);
      } else {
        handleFileOpen(entry);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const handleNewFile = (parentPath: string) => {
    setInlineCreate({ parentPath, type: "file" });
    setContextMenu(null);
  };

  const handleNewFolder = (parentPath: string) => {
    setInlineCreate({ parentPath, type: "folder" });
    setContextMenu(null);
  };

  const handleRename = (entry: FileEntry) => {
    setRenamePath(entry.path);
    setContextMenu(null);
  };

  const handleDelete = (entry: FileEntry) => {
    setDeleteTarget(entry);
    setContextMenu(null);
  };

  const handleCopyPath = async (entry: FileEntry) => {
    try {
      const absPath = await trpc.fileSystem.copyPath(entry.path);
      await navigator.clipboard.writeText(absPath);
    } catch (error) {
      console.error("Failed to copy path:", error);
    }
    setContextMenu(null);
  };

  const handleRevealInFinder = async (entry: FileEntry) => {
    try {
      await trpc.fileSystem.revealInFinder(entry.path);
    } catch (error) {
      console.error("Failed to reveal in finder:", error);
    }
    setContextMenu(null);
  };

  const handleOpenInTerminal = (entry: FileEntry) => {
    console.log("Open in terminal:", entry.path);
    setContextMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await trpc.fileSystem.deletePath(deleteTarget.path, deleteTarget.isDirectory);
      await refreshParent(deleteTarget.path);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
    setDeleteTarget(null);
  };

  const refreshParent = async (targetPath: string) => {
    const parentPath = targetPath.split(/[\\/]/).slice(0, -1).join("/") || rootPath;
    if (parentPath) {
      await loadDirectory(parentPath);
    }
  };

  const handleInlineCreateSubmit = async (name: string) => {
    if (!inlineCreate || !name.trim()) {
      setInlineCreate(null);
      return;
    }
    if (name.includes("/") || name.includes("\\")) {
      setInlineCreate(null);
      return;
    }
    try {
      if (inlineCreate.type === "file") {
        await trpc.fileSystem.createFile(inlineCreate.parentPath, name.trim());
      } else {
        await trpc.fileSystem.createFolder(inlineCreate.parentPath, name.trim());
      }
      await refreshParent(inlineCreate.parentPath);
      if (inlineCreate.type === "file") {
        const fullPath = `${inlineCreate.parentPath}/${name.trim()}`;
        const content = "";
        openTab(
          { id: `tab-${fullPath}`, path: fullPath, name: name.trim(), isDirty: false, isActive: true, pinned: false },
          { path: fullPath, content, originalContent: content, languageId: "plaintext", isDirty: false, version: 1, cursorPosition: { line: 0, column: 0 }, scrollPosition: { top: 0, left: 0 } }
        );
      }
    } catch (error) {
      console.error("Failed to create:", error);
    }
    setInlineCreate(null);
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!renamePath || !newName.trim()) {
      setRenamePath(null);
      return;
    }
    const [oldName, ext] = splitNameAndExt(newName);
    const finalName = newName.includes(".") ? newName : `${oldName}${ext}`;
    if (finalName.includes("/") || finalName.includes("\\")) {
      setRenamePath(null);
      return;
    }
    try {
      const parentPath = renamePath.split(/[\\/]/).slice(0, -1).join("/") || rootPath;
      const newPath = `${parentPath}/${finalName}`;
      await trpc.fileSystem.rename(renamePath, newPath);
      await refreshParent(renamePath);
    } catch (error) {
      console.error("Failed to rename:", error);
    }
    setRenamePath(null);
  };

  const flattenTree = (entry: FileEntry | null): FileEntry[] => {
    if (!entry) return [];
    const result = [entry];
    if (entry.isDirectory && "children" in entry && expandedPaths.has(entry.path)) {
      for (const child of (entry as DirectoryEntry).children) {
        if (!isExcluded(child.name)) {
          result.push(...flattenTree(child));
        }
      }
    }
    return result;
  };

  const renderEntry = (entry: FileEntry, depth: number = 0, index: number = 0) => {
    if (isExcluded(entry.name)) return null;

    const isExpanded = expandedPaths.has(entry.path);
    const isSelected = selectedPath === entry.path || selectedPaths.has(entry.path);
    const isDirectory = entry.isDirectory;
    const isRenaming = renamePath === entry.path;

    return (
      <div key={entry.path}>
        <div
          className={cn(
            "flex items-center py-0.5 px-2 cursor-pointer text-xs transition-colors group",
            isSelected
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-foreground hover:bg-sidebar-accent/50"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={(e) => handleEntryClick(entry, index, e)}
          onContextMenu={(e) => handleContextMenu(e, entry)}
        >
          <span className="mr-1 w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isDirectory ? (
              isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )
            ) : (
              <span className="w-3" />
            )}
          </span>
          <span className="mr-1.5 w-4 h-4 flex items-center justify-center flex-shrink-0">
            <FileIcon filename={entry.name} isDirectory={isDirectory} isOpen={isExpanded} />
          </span>
          {isRenaming ? (
            <InlineRenameInput
              ref={inlineInputRef}
              initialName={entry.name}
              onSubmit={handleRenameSubmit}
              onCancel={() => setRenamePath(null)}
            />
          ) : (
            <span className="truncate">{entry.name}</span>
          )}
        </div>
        {isDirectory && isExpanded && "children" in entry && (
          <div>
            {(entry as DirectoryEntry).children
              .filter(child => !isExcluded(child.name))
              .map((child, childIdx) => renderEntry(child, depth + 1, index + childIdx + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!root) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
        <div className="text-xs text-muted-foreground mb-3">No workspace open</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
            onClick={() => handleNewFile(root.path)}
            title="New File"
          >
            <FilePlusIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
            onClick={() => handleNewFolder(root.path)}
            title="New Folder"
          >
            <FolderPlusIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
            onClick={() => loadDirectory(rootPath!)}
            title="Refresh"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 2.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 010-1h1.793L10.146 3.854a.5.5 0 01.708-.708l2.5 2.5a.5.5 0 01.146.354zM2.5 13.5a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 010 1H3.707l2.146 2.146a.5.5 0 01-.708.708l-2.5-2.5A.5.5 0 012.5 13.5z" />
            </svg>
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1" ref={treeRef}>
          {root.children
            .filter(child => !isExcluded(child.name))
            .map((entry, idx) => renderEntry(entry, 0, idx))}
        </div>
      </ScrollArea>

      {inlineCreate && (
        <InlineCreateInput
          ref={inlineInputRef}
          type={inlineCreate.type}
          onSubmit={handleInlineCreateSubmit}
          onCancel={() => setInlineCreate(null)}
        />
      )}

      {contextMenu && (
        <ContextMenuRenderer
          contextMenu={contextMenu}
          onNewFile={() => handleNewFile(contextMenu.entry.isDirectory ? contextMenu.entry.path : contextMenu.entry.path.split(/[\\/]/).slice(0, -1).join("/"))}
          onNewFolder={() => handleNewFolder(contextMenu.entry.isDirectory ? contextMenu.entry.path : contextMenu.entry.path.split(/[\\/]/).slice(0, -1).join("/"))}
          onRename={() => handleRename(contextMenu.entry)}
          onDelete={() => handleDelete(contextMenu.entry)}
          onCopyPath={() => handleCopyPath(contextMenu.entry)}
          onRevealInFinder={() => handleRevealInFinder(contextMenu.entry)}
          onOpenInTerminal={() => handleOpenInTerminal(contextMenu.entry)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.isDirectory ? "folder" : "file"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface InlineRenameInputProps {
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const InlineRenameInput = React.forwardRef<HTMLInputElement, InlineRenameInputProps>(({ initialName, onSubmit, onCancel }, ref) => {
  const [value, setValue] = useState(initialName);

  return (
    <Input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit(value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSubmit(value)}
      className="h-5 px-1 py-0 text-xs bg-background border-border"
      onClick={(e) => e.stopPropagation()}
    />
  );
});
InlineRenameInput.displayName = "InlineRenameInput";

interface InlineCreateInputProps {
  type: "file" | "folder";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const InlineCreateInput = React.forwardRef<HTMLInputElement, InlineCreateInputProps>(({ type, onSubmit, onCancel }, ref) => {
  const [value, setValue] = useState("");

  return (
    <div className="px-2 py-1">
      <Input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit(value);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onSubmit(value)}
        placeholder={`${type === "file" ? "File" : "Folder"} name`}
        className="h-6 px-2 text-xs bg-background border-border"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
});
InlineCreateInput.displayName = "InlineCreateInput";

interface ContextMenuRendererProps {
  contextMenu: ContextMenuState;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCopyPath: () => void;
  onRevealInFinder: () => void;
  onOpenInTerminal: () => void;
}

function ContextMenuRenderer({
  contextMenu,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopyPath,
  onRevealInFinder,
  onOpenInTerminal,
}: ContextMenuRendererProps) {
  return (
    <div
      className="fixed z-50 min-w-[200px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger asChild>
          <div className="w-0 h-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={onNewFile}>
            <FilePlusIcon className="mr-2 h-4 w-4" />
            <span>New File</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onNewFolder}>
            <FolderPlusIcon className="mr-2 h-4 w-4" />
            <span>New Folder</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onRename}>
            <PencilIcon className="mr-2 h-4 w-4" />
            <span>Rename</span>
            <DropdownMenuShortcut>F2</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <TrashIcon className="mr-2 h-4 w-4" />
            <span>Delete</span>
            <DropdownMenuShortcut>Del</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCopyPath}>
            <CopyIcon className="mr-2 h-4 w-4" />
            <span>Copy Path</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRevealInFinder}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9zM2.5 3a.5.5 0 00-.5.5v6a.5.5 0 00.5.5h3.854a.5.5 0 00.47-.332l.5-1.5a.5.5 0 00-.47-.668H3.5a.5.5 0 010-1h2.854a.5.5 0 00.47-.332l.5-1.5A.5.5 0 006.854 4H2.5zM10 6a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1A.5.5 0 0110 6zm2 0a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zm2 2a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5z" />
            </svg>
            <span>Reveal in Explorer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenInTerminal}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm14 0v12a1 1 0 001-1V2a1 1 0 00-1-1H2a1 1 0 00-1 1h12zM2 14l4-4-4-4 1.5-1.5L9 10l-5.5 5.5L2 14zm6 0h6v-1H8v1z" />
            </svg>
            <span>Open in Integrated Terminal</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
