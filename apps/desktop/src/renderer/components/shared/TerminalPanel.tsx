import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useTerminalStore } from "../../stores/terminal.store";
import { trpc } from "../../lib/trpc";
import { Button, ScrollArea } from "../ui";
import { XIcon, PlusIcon } from "lucide-react";
import "xterm/css/xterm.css";

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { sessions, activeSessionId, createSession, killSession, setActiveSession, registerDataCallback, unregisterDataCallback } = useTerminalStore();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      theme: {
        background: "#18181b",
        foreground: "#e4e4e7",
        cursor: "#a1a1aa",
        selectionBackground: "#3f3f46",
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
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => {
      if (activeSessionId) {
        trpc.terminal.write({ id: activeSessionId, data });
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (activeSessionId && xtermRef.current) {
        const { cols, rows } = xtermRef.current;
        trpc.terminal.resize({ id: activeSessionId, rows, cols });
      }
    };
    window.addEventListener("resize", handleResize);

    const unsubscribe = window.procode.ipc.on("terminal-event", (data: unknown) => {
      const { id, event } = data as { id: string; event: { type: string; data?: string } };
      if (event.type === "data" && event.data) {
        const term = xtermRef.current;
        if (term && id === activeSessionId) {
          term.write(event.data);
        }
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribe();
      term.dispose();
    };
  }, [activeSessionId]);

  const handleCreateTerminal = useCallback(async () => {
    setIsCreating(true);
    await createSession({ cwd: undefined });
    setIsCreating(false);
  }, [createSession]);

  const handleCloseTerminal = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await killSession(id);
    },
    [killSession]
  );

  return (
    <div className="h-full flex flex-col bg-editor">
      {/* Terminal Tabs */}
      <div className="flex items-center border-b border-border bg-sidebar">
        <ScrollArea className="flex-1">
          <div className="flex items-center">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs border-r border-border transition-colors ${
                  activeSessionId === session.id
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="truncate max-w-24">{session.name}</span>
                <span
                  onClick={(e) => handleCloseTerminal(session.id, e)}
                  className="hover:text-foreground cursor-pointer"
                >
                  <XIcon className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateTerminal}
          disabled={isCreating}
          className="h-8 w-8 rounded-none"
          title="New Terminal"
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Button onClick={handleCreateTerminal}>
              Open Terminal
            </Button>
          </div>
        ) : (
          <div ref={terminalRef} className="h-full" />
        )}
      </div>
    </div>
  );
}
