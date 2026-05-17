import { useEffect, useRef, useState, useMemo } from "react";
import { useCommandPaletteStore } from "../../stores/command-palette";
import { useFileTreeStore } from "../../stores/file-tree";
import { useTabsStore } from "../../stores/tabs";
import { trpc } from "../../lib/trpc";
import { fuzzyFilter } from "../../lib/fuzzy";
import { FileIcon, FolderIcon } from "./icons";
import type { FileEntry, DirectoryEntry } from "@procode/types";

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
        dir.children.forEach(traverse);
      }
    };

    if (root) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50">
      <div className="w-[600px] max-h-[400px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-700">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full bg-transparent text-zinc-100 text-sm outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
              No files found
            </div>
          ) : (
            filteredFiles.map((file, index) => (
              <div
                key={file.entry.path}
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  index === selectedIndex ? "bg-blue-600/20" : "hover:bg-zinc-800"
                }`}
                onClick={() => handleSelect(file.entry)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="mr-3 w-4 h-4 flex items-center justify-center">
                  {file.entry.isDirectory ? (
                    <FolderIcon className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-zinc-400" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-100 truncate">
                    {highlightMatch(file.entry.name, file.indices.slice(-file.entry.name.length))}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {file.entry.path}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-zinc-700 text-xs text-zinc-500 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
          <span>{filteredFiles.length} files</span>
        </div>
      </div>
    </div>
  );
}
