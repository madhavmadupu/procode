import * as pty from "node-pty";
import { EventEmitter } from "events";
import { TerminalOptions, TerminalEvent } from "./TerminalProtocol";

export class TerminalSession extends EventEmitter {
  private ptyProcess: pty.IPty | null = null;
  private _isRunning = false;

  constructor(
    public readonly id: string,
    public name: string,
    private options: TerminalOptions
  ) {
    super();
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get pid(): number {
    return this.ptyProcess?.pid ?? 0;
  }

  start(): void {
    if (this.ptyProcess) return;

    const shell = process.platform === "win32"
      ? this.options.shell ?? "powershell.exe"
      : this.options.shell ?? process.env.SHELL ?? "/bin/bash";

    const env: Record<string, string | undefined> = {};
    if (this.options.env) {
      for (const [key, value] of Object.entries(this.options.env)) {
        if (value !== null) {
          env[key] = value;
        }
      }
    }

    this.ptyProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols: this.options.cols ?? 80,
      rows: this.options.rows ?? 24,
      cwd: this.options.cwd ?? process.cwd(),
      env: Object.keys(env).length > 0 ? env : (process.env as Record<string, string>),
    });

    this._isRunning = true;

    this.ptyProcess.onData((data) => {
      this.emit("event", {
        type: "data",
        sessionId: this.id,
        data,
      } as TerminalEvent);
    });

    this.ptyProcess.onExit(({ exitCode }) => {
      this._isRunning = false;
      this.emit("event", {
        type: "exit",
        sessionId: this.id,
        exitCode,
      } as TerminalEvent);
    });
  }

  write(data: string): void {
    this.ptyProcess?.write(data);
  }

  resize(rows: number, cols: number): void {
    this.ptyProcess?.resize(cols, rows);
    this.emit("event", {
      type: "resize",
      sessionId: this.id,
      rows,
      cols,
    } as TerminalEvent);
  }

  kill(): void {
    this.ptyProcess?.kill();
    this._isRunning = false;
    this.ptyProcess = null;
  }

  getInfo(): { id: string; name: string; pid: number; rows: number; cols: number; isRunning: boolean } {
    return {
      id: this.id,
      name: this.name,
      pid: this.pid,
      rows: this.options.rows ?? 24,
      cols: this.options.cols ?? 80,
      isRunning: this.isRunning,
    };
  }
}
