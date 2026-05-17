export interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string | null>;
  shell?: string;
  rows?: number;
  cols?: number;
}

export interface TerminalSessionInfo {
  id: string;
  name: string;
  pid: number;
  rows: number;
  cols: number;
  isRunning: boolean;
}

export interface TerminalResizeEvent {
  sessionId: string;
  rows: number;
  cols: number;
}

export type TerminalEventType = "data" | "exit" | "resize";

export interface TerminalEvent {
  type: TerminalEventType;
  sessionId: string;
  data?: string;
  exitCode?: number;
  rows?: number;
  cols?: number;
}
