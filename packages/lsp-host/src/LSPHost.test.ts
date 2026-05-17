import { describe, it, expect, vi, beforeEach } from "vitest";
import { LSPHost } from "./LSPHost";

describe("LSPHost", () => {
  let host: LSPHost;

  beforeEach(() => {
    host = new LSPHost();
  });

  it("should register a server config", () => {
    const config = {
      serverId: "typescript",
      command: "typescript-language-server",
      args: ["--stdio"],
      filePatterns: ["*.ts", "*.tsx"],
    };

    host.registerConfig(config);
    const retrieved = host.getConfig("typescript");

    expect(retrieved).toBeDefined();
    expect(retrieved?.serverId).toBe("typescript");
  });

  it("should return undefined for unknown config", () => {
    const config = host.getConfig("unknown");
    expect(config).toBeUndefined();
  });

  it("should track server states", () => {
    const states = host.getAllServerStates();
    expect(states).toBeInstanceOf(Map);
  });

  it("should handle completion request when no server is running", async () => {
    const result = await host.completion({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
    });

    expect(result).toEqual({ isIncomplete: false, items: [] });
  });

  it("should handle hover request when no server is running", async () => {
    const result = await host.hover({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
    });

    expect(result).toBeNull();
  });

  it("should handle definition request when no server is running", async () => {
    const result = await host.definition({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
    });

    expect(result).toBeNull();
  });

  it("should handle document symbols request when no server is running", async () => {
    const result = await host.documentSymbols({
      textDocument: { uri: "file:///test.ts" },
    });

    expect(result).toBeNull();
  });

  it("should handle workspace symbols request when no server is running", async () => {
    const result = await host.workspaceSymbols({ query: "test" });
    expect(result).toEqual([]);
  });

  it("should handle signature help request when no server is running", async () => {
    const result = await host.signatureHelp({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
    });

    expect(result).toBeNull();
  });

  it("should handle code action request when no server is running", async () => {
    const result = await host.codeAction({
      textDocument: { uri: "file:///test.ts" },
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 10 },
      },
      context: { diagnostics: [] },
    });

    expect(result).toBeNull();
  });

  it("should handle formatting request when no server is running", async () => {
    const result = await host.formatting({
      textDocument: { uri: "file:///test.ts" },
      options: { tabSize: 2, insertSpaces: true },
    });

    expect(result).toBeNull();
  });

  it("should handle rename request when no server is running", async () => {
    const result = await host.rename({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
      newName: "newName",
    });

    expect(result).toBeNull();
  });

  it("should handle references request when no server is running", async () => {
    const result = await host.references({
      textDocument: { uri: "file:///test.ts" },
      position: { line: 0, character: 0 },
      context: { includeDeclaration: true },
    });

    expect(result).toBeNull();
  });
});
