import { TerminalSession } from "./TerminalSession";
import { TerminalOptions, TerminalEvent, TerminalSessionInfo } from "./TerminalProtocol";

export class TerminalHost {
  private sessions = new Map<string, TerminalSession>();
  private listeners = new Map<string, (event: TerminalEvent) => void>();
  private globalListeners: Array<(id: string, event: TerminalEvent) => void> = [];

  createSession(options?: TerminalOptions & { name?: string }): TerminalSessionInfo {
    const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = options?.name ?? "Terminal";

    const session = new TerminalSession(id, name, {
      cwd: options?.cwd,
      env: options?.env,
      shell: options?.shell,
      rows: options?.rows ?? 24,
      cols: options?.cols ?? 80,
    });

    session.on("event", (event: TerminalEvent) => {
      const listener = this.listeners.get(id);
      if (listener) {
        listener(event);
      }
      for (const globalListener of this.globalListeners) {
        globalListener(id, event);
      }
    });

    session.start();
    this.sessions.set(id, session);

    return session.getInfo();
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  getSessionInfo(id: string): TerminalSessionInfo | undefined {
    return this.sessions.get(id)?.getInfo();
  }

  getAllSessionInfo(): TerminalSessionInfo[] {
    return Array.from(this.sessions.values()).map(s => s.getInfo());
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.write(data);
  }

  resize(id: string, rows: number, cols: number): void {
    this.sessions.get(id)?.resize(rows, cols);
  }

  killSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.kill();
      this.sessions.delete(id);
      this.listeners.delete(id);
    }
  }

  killAll(): void {
    for (const session of this.sessions.values()) {
      session.kill();
    }
    this.sessions.clear();
    this.listeners.clear();
    this.globalListeners.length = 0;
  }

  onEvent(id: string, callback: (event: TerminalEvent) => void): void {
    this.listeners.set(id, callback);
  }

  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  onEventAll(callback: (id: string, event: TerminalEvent) => void): void {
    this.globalListeners.push(callback);
  }

  removeGlobalListener(callback: (id: string, event: TerminalEvent) => void): void {
    const index = this.globalListeners.indexOf(callback);
    if (index !== -1) {
      this.globalListeners.splice(index, 1);
    }
  }

  renameSession(id: string, name: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.name = name;
    }
  }
}
