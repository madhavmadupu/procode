import { useEffect, useRef, useState, useMemo } from "react";
import { useCommandPaletteStore } from "../../stores/command-palette";
import { useFileTreeStore } from "../../stores/file-tree";
import { useTabsStore } from "../../stores/tabs";
import { trpc } from "../../lib/trpc";
import { fuzzyFilter } from "../../lib/fuzzy";
import { FileIcon, FolderIcon } from "./icons";
import type { FileEntry, DirectoryEntry } from "@procode/types";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "../ui";
import { cn } from "../../lib/utils";

interface FileResult {
  entry: FileEntry;
  score: number;
  indices: number[];
}

export function CommandPalette() {
  const { isOpen, query, setQuery, close } = useCommandPaletteStore();
  const { root } = useFileTreeStore();
  const { openTab } = useTabsStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allFiles = useMemo(() => {
    const files: FileEntry[] = [];

    const traverse = (entry: FileEntry) => {
      if (!entry.isDirectory) {
        files.push(entry);
      } else {
        const dir = entry as DirectoryEntry;
        if (dir.children) {
          dir.children.forEach(traverse);
        }
      }
    };

    if (root?.children) {
      root.children.forEach(traverse);
    }

    return files;
  }, [root]);

  const filteredFiles = useMemo(() => {
    const results = fuzzyFilter(query, allFiles, (file) => file.path);
    return results.slice(0, 20).map((r) => ({
      entry: r.item,
      score: r.score,
      indices: r.indices,
    }));
  }, [query, allFiles]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setSelectedIndex(0);
  }, [isOpen, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          useCommandPaletteStore.getState().open();
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredFiles.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredFiles[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredFiles[selectedIndex].entry);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex]);

  const handleSelect = async (entry: FileEntry) => {
    if (entry.isDirectory) return;

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
      close();
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const highlightMatch = (text: string, indices: number[]) => {
    if (!indices.length) return <span>{text}</span>;

    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < indices.length; i++) {
      const matchIndex = indices[i];
      if (matchIndex === undefined) continue;

      if (matchIndex > currentIndex) {
        parts.push(<span key={`text-${currentIndex}`}>{text.slice(currentIndex, matchIndex)}</span>);
      }

      parts.push(
        <span key={`match-${matchIndex}`} className="text-blue-400 font-semibold">
          {text[matchIndex]}
        </span>,
      );

      currentIndex = matchIndex + 1;
    }

    if (currentIndex < text.length) {
      parts.push(<span key={`text-end-${currentIndex}`}>{text.slice(currentIndex)}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput
        ref={inputRef}
        placeholder="Search files by name..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No files found</CommandEmpty>
        <CommandGroup heading="Files">
          {filteredFiles.map((file, index) => (
            <CommandItem
              key={file.entry.path}
              onSelect={() => handleSelect(file.entry)}
              className={cn(
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
            >
              {file.entry.isDirectory ? (
                <FolderIcon className="w-4 h-4 mr-3 text-blue-400" />
              ) : (
                <FileIcon className="w-4 h-4 mr-3 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">
                  {highlightMatch(file.entry.name, file.indices.slice(-file.entry.name.length))}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {file.entry.path}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
        <span>{filteredFiles.length} files</span>
      </div>
    </CommandDialog>
  );
}
