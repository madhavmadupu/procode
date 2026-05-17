import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { useTerminalStore } from "../../stores/terminal.store";
import { useWorkspaceStore } from "../../stores/workspace";
import { trpc } from "../../lib/trpc";
import { Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Tabs, TabsList, TabsTrigger, TabsContent } from "../ui";
import { XIcon, PlusIcon, SearchIcon } from "../shared/icons";
import { cn } from "../../lib/utils";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstance {
  term: Terminal;
  fitAddon: FitAddon;
  webLinksAddon: WebLinksAddon;
  searchAddon: SearchAddon;
  unicodeAddon: Unicode11Addon;
  container: HTMLDivElement;
}

function getTerminalTheme() {
  const cs = getComputedStyle(document.documentElement);
  const get = (v: string) => cs.getPropertyValue(v).trim() || "#000";
  return {
    background: `hsl(${get("--editor-background") || get("--background")})`,
    foreground: `hsl(${get("--editor-foreground") || get("--foreground")})`,
    cursor: `hsl(${get("--primary")})`,
    selectionBackground: `hsl(${get("--primary")} / 0.3)`,
    black: "#18181b",
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#eab308",
    blue: "#3b82f6",
    magenta: "#a855f7",
    cyan: "#06b6d4",
    white: "#e4e4e7",
    brightBlack: "#71717a",
    brightRed: "#f87171",
    brightGreen: "#4ade80",
    brightYellow: "#facc15",
    brightBlue: "#60a5fa",
    brightMagenta: "#c084fc",
    brightCyan: "#22d3ee",
    brightWhite: "#fafafa",
  };
}

export function TerminalPanel() {
  const { rootPath } = useWorkspaceStore();
  const { sessions, activeSessionId, createSession, killSession, setActiveSession, refreshSessions } = useTerminalStore();
  const instancesRef = useRef<Map<string, TerminalInstance>>(new Map());
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"terminal" | "problems" | "output">("terminal");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshSessions();
  }, []);

  useEffect(() => {
    if (sessions.length === 0 && rootPath) {
      createSession({ cwd: rootPath });
    }
  }, [sessions.length, rootPath]);

  useEffect(() => {
    const handleIpc = (data: unknown) => {
      const { id, event } = data as { id: string; event: { type: string; data?: string } };
      if (event.type === "data" && event.data) {
        const inst = instancesRef.current.get(id);
        if (inst && inst.term) {
          inst.term.write(event.data);
        }
      }
    };
    const unsub = window.procode.ipc.on("terminal-event", handleIpc);
    return unsub;
  }, []);

  useEffect(() => {
    instancesRef.current.forEach((inst, id) => {
      if (id === activeSessionId) {
        inst.container.style.display = "block";
        setTimeout(() => inst.fitAddon.fit(), 50);
      } else {
        inst.container.style.display = "none";
      }
    });
  }, [activeSessionId]);

  const getTerminalContainer = useCallback((sessionId: string): TerminalInstance => {
    let inst = instancesRef.current.get(sessionId);
    if (!inst) {
      const container = document.createElement("div");
      container.className = "h-full w-full";
      container.style.display = sessionId === activeSessionId ? "block" : "none";

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        fontSize: 13,
        lineHeight: 1.2,
        fontFamily: "'Geist Mono', 'Cascadia Code', monospace",
        scrollback: 10000,
        allowProposedApi: true,
        theme: getTerminalTheme(),
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon((event, uri) => {
        event.preventDefault();
        window.open(uri, "_blank", "noopener,noreferrer");
      });
      const searchAddon = new SearchAddon();
      const unicodeAddon = new Unicode11Addon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(unicodeAddon);
      term.unicode.activeVersion = "11";
      term.open(container);

      term.onData((data) => {
        trpc.terminal.write({ id: sessionId, data });
      });

      const ro = new ResizeObserver(() => {
        fitAddon.fit();
        if (term.cols && term.rows) {
          trpc.terminal.resize({ id: sessionId, rows: term.rows, cols: term.cols });
        }
      });
      ro.observe(container);

      inst = { term, fitAddon, webLinksAddon, searchAddon, unicodeAddon, container };
      instancesRef.current.set(sessionId, inst);
    }
    return inst;
  }, [activeSessionId]);

  const handleCreateTerminal = async () => {
    await createSession({ cwd: rootPath ?? undefined });
  };

  const handleCloseTerminal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const inst = instancesRef.current.get(id);
    if (inst) {
      inst.term.dispose();
      inst.container.remove();
      instancesRef.current.delete(id);
    }
    await killSession(id);
  };

  const handleCopy = () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    if (inst?.term.hasSelection()) {
      navigator.clipboard.writeText(inst.term.getSelection());
      inst.term.focus();
    }
  };

  const handlePaste = async () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    if (inst?.term) {
      const text = await navigator.clipboard.readText();
      inst.term.paste(text);
    }
  };

  const handleClear = () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    inst?.term.clear();
  };

  const handleSelectAll = () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    inst?.term.selectAll();
  };

  const handleFind = () => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSearchNext = () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    inst?.searchAddon.findNext(searchTerm, { regex: false, wholeWord: false, caseSensitive: false });
  };

  const handleSearchPrev = () => {
    const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
    inst?.searchAddon.findPrevious(searchTerm, { regex: false, wholeWord: false, caseSensitive: false });
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeTab !== "terminal") return;
      const inst = activeSessionId ? instancesRef.current.get(activeSessionId) : null;
      if (!inst?.term) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (!inst.term.hasSelection()) return;
        e.preventDefault();
        handleCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        handlePaste();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleClear();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        handleFind();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSessionId, activeTab, searchTerm]);

  useEffect(() => {
    function handleClick() {
      setContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    instancesRef.current.forEach((inst) => {
      inst.term.options.theme = getTerminalTheme();
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-editor">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "terminal" | "problems" | "output")} className="h-full flex flex-col">
        <div className="flex items-center border-b border-border bg-sidebar">
          <TabsList className="h-8 rounded-none bg-transparent p-0">
            <TabsTrigger value="terminal" className="rounded-none text-xs data-[state=active]:bg-sidebar-accent data-[state=active]:text-foreground">Terminal</TabsTrigger>
            <TabsTrigger value="problems" className="rounded-none text-xs data-[state=active]:bg-sidebar-accent data-[state=active]:text-foreground">Problems</TabsTrigger>
            <TabsTrigger value="output" className="rounded-none text-xs data-[state=active]:bg-sidebar-accent data-[state=active]:text-foreground">Output</TabsTrigger>
          </TabsList>
          <div className="flex-1" />
          {activeTab === "terminal" && (
            <Button variant="ghost" size="icon" onClick={handleCreateTerminal} className="h-7 w-7 rounded-none" title="New Terminal">
              <PlusIcon className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <TabsContent value="terminal" className="flex-1 flex flex-col m-0 overflow-hidden">
          {/* Terminal Tabs */}
          {sessions.length > 1 && (
            <div className="flex items-center border-b border-border bg-sidebar/50">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 text-xs border-r border-border transition-colors",
                    activeSessionId === session.id
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <span className="truncate max-w-24">{session.name}</span>
                  <span onClick={(e) => handleCloseTerminal(session.id, e)} className="hover:text-foreground cursor-pointer ml-1">
                    <XIcon className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search Bar */}
          {showSearch && (
            <div className="flex items-center gap-2 px-2 py-1 bg-sidebar border-b border-border">
              <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchNext();
                  if (e.key === "Escape") setShowSearch(false);
                }}
                placeholder="Search"
                className="h-6 px-2 text-xs bg-background border-border"
              />
              <Button variant="ghost" size="compact" onClick={handleSearchPrev} className="h-6 px-2 text-xs">↑</Button>
              <Button variant="ghost" size="compact" onClick={handleSearchNext} className="h-6 px-2 text-xs">↓</Button>
              <Button variant="ghost" size="compact" onClick={() => setShowSearch(false)} className="h-6 px-2 text-xs">
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Terminal Content */}
          <div
            className="flex-1 overflow-hidden relative"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            {sessions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Button onClick={handleCreateTerminal}>Open Terminal</Button>
              </div>
            ) : (
              <>
                {sessions.map((session) => {
                  const inst = getTerminalContainer(session.id);
                  return (
                    <div
                      key={session.id}
                      ref={(el) => {
                        if (el && !el.contains(inst.container)) {
                          el.appendChild(inst.container);
                        }
                      }}
                      className="absolute inset-0"
                      style={{ display: session.id === activeSessionId ? "block" : "none" }}
                    />
                  );
                })}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="problems" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="text-sm text-muted-foreground">No problems detected.</div>
          </div>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="text-sm text-muted-foreground">No output.</div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 min-w-[180px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <DropdownMenu open onOpenChange={() => {}}>
            <DropdownMenuTrigger asChild><div className="w-0 h-0" /></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleCopy}>Copy</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePaste}>Paste</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSelectAll}>Select All</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear}>Clear</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFind}>
                <span>Find</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+F</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateTerminal}>New Terminal</DropdownMenuItem>
              {activeSessionId && (
                <DropdownMenuItem onClick={() => activeSessionId && killSession(activeSessionId)}>Kill Terminal</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
