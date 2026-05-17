import { describe, it, expect, vi, beforeEach } from "vitest";
import { TerminalHost } from "./TerminalHost";
import { TerminalSession } from "./TerminalSession";

vi.mock("node-pty", () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    onData: vi.fn(),
    onExit: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  })),
}));

describe("TerminalHost", () => {
  let host: TerminalHost;

  beforeEach(() => {
    host = new TerminalHost();
  });

  it("should create a new terminal session", () => {
    const info = host.createSession({ name: "Test Terminal" });
    expect(info.id).toBeDefined();
    expect(info.name).toBe("Test Terminal");
    expect(info.isRunning).toBe(true);
  });

  it("should return all session info", () => {
    host.createSession({ name: "Terminal 1" });
    host.createSession({ name: "Terminal 2" });

    const sessions = host.getAllSessionInfo();
    expect(sessions).toHaveLength(2);
    expect(sessions.map(s => s.name)).toContain("Terminal 1");
    expect(sessions.map(s => s.name)).toContain("Terminal 2");
  });

  it("should kill a specific session", () => {
    const info = host.createSession({ name: "Test" });
    host.killSession(info.id);

    const sessions = host.getAllSessionInfo();
    expect(sessions).toHaveLength(0);
  });

  it("should kill all sessions", () => {
    host.createSession({ name: "Terminal 1" });
    host.createSession({ name: "Terminal 2" });

    host.killAll();

    expect(host.getAllSessionInfo()).toHaveLength(0);
  });

  it("should rename a session", () => {
    const info = host.createSession({ name: "Old Name" });
    host.renameSession(info.id, "New Name");

    const session = host.getSessionInfo(info.id);
    expect(session?.name).toBe("New Name");
  });

  it("should register event listener", () => {
    const info = host.createSession();
    const callback = vi.fn();

    host.onEvent(info.id, callback);

    expect(host["listeners"].has(info.id)).toBe(true);
  });

  it("should remove event listener", () => {
    const info = host.createSession();
    host.onEvent(info.id, vi.fn());

    host.removeListener(info.id);

    expect(host["listeners"].has(info.id)).toBe(false);
  });
});

describe("TerminalSession", () => {
  it("should have correct initial state", () => {
    const session = new TerminalSession("test-id", "Test", { rows: 24, cols: 80 });
    expect(session.id).toBe("test-id");
    expect(session.name).toBe("Test");
    expect(session.isRunning).toBe(false);
  });

  it("should get session info", () => {
    const session = new TerminalSession("test-id", "Test", { rows: 30, cols: 100 });
    const info = session.getInfo();

    expect(info.id).toBe("test-id");
    expect(info.name).toBe("Test");
    expect(info.rows).toBe(30);
    expect(info.cols).toBe(100);
  });
});
