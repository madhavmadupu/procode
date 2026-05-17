import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useTerminalStore } from "../../stores/terminal.store";
import { trpc } from "../../lib/trpc";
import "xterm/css/xterm.css";

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { sessions, activeSessionId, createSession, killSession, setActiveSession } = useTerminalStore();
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

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!activeSessionId || !xtermRef.current) return;

    xtermRef.current.clear();
    xtermRef.current.writeln(`\x1b[32mTerminal session started\x1b[0m`);
    xtermRef.current.write("$ ");
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
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Terminal Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900">
        <div className="flex-1 flex overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border-r border-zinc-800 transition-colors ${
                activeSessionId === session.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <span className="truncate max-w-24">{session.name}</span>
              <span
                onClick={(e) => handleCloseTerminal(session.id, e)}
                className="hover:text-zinc-100 cursor-pointer"
              >
                ×
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={handleCreateTerminal}
          disabled={isCreating}
          className="px-2 py-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
          title="New Terminal"
        >
          +
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={handleCreateTerminal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              Open Terminal
            </button>
          </div>
        ) : (
          <div ref={terminalRef} className="h-full" />
        )}
      </div>
    </div>
  );
}
