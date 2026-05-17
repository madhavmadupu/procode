import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExtensionHost } from "./ExtensionHost";

describe("ExtensionHost", () => {
  let host: ExtensionHost;

  beforeEach(() => {
    host = new ExtensionHost();
  });

  it("should register an extension", async () => {
    const manifest = {
      name: "test-ext",
      displayName: "Test Extension",
      version: "1.0.0",
      main: "index.js",
    };

    await host.registerExtension(manifest, "/path/to/ext");

    const ext = host.getExtension("test-ext");
    expect(ext).toBeDefined();
    expect(ext?.manifest.name).toBe("test-ext");
    expect(ext?.isActive).toBe(false);
  });

  it("should activate an extension", async () => {
    const manifest = {
      name: "test-ext",
      displayName: "Test Extension",
      version: "1.0.0",
      main: "index.js",
    };

    await host.registerExtension(manifest, "/path/to/ext");

    const activateFn = vi.fn().mockResolvedValue(undefined);
    await host.activateExtension("test-ext", activateFn);

    const ext = host.getExtension("test-ext");
    expect(ext?.isActive).toBe(true);
    expect(activateFn).toHaveBeenCalled();
  });

  it("should register and execute commands", async () => {
    const handler = vi.fn().mockReturnValue("result");
    host.registerCommand("test.command", handler);

    const result = await host.executeCommand("test.command", "arg1", "arg2");

    expect(result).toBe("result");
    expect(handler).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should throw error for unknown command", async () => {
    expect(() => host.executeCommand("unknown.command")).toThrow(
      "Command 'unknown.command' not found"
    );
  });

  it("should list registered commands", () => {
    host.registerCommand("cmd1", vi.fn());
    host.registerCommand("cmd2", vi.fn());

    const commands = host.getCommands();
    expect(commands).toContain("cmd1");
    expect(commands).toContain("cmd2");
  });

  it("should create output channel", () => {
    const channel = host.createOutputChannel("Test Channel");

    expect(channel.name).toBe("Test Channel");
    expect(typeof channel.append).toBe("function");
    expect(typeof channel.appendLine).toBe("function");
  });

  it("should create status bar item", () => {
    const item = host.createStatusBarItem(1);

    expect(item.alignment).toBe(1);
    expect(item.text).toBe("");
  });

  it("should deactivate extension and dispose subscriptions", async () => {
    const disposeFn = vi.fn();
    const manifest = {
      name: "test-ext",
      displayName: "Test Extension",
      version: "1.0.0",
      main: "index.js",
    };

    await host.registerExtension(manifest, "/path/to/ext");
    await host.activateExtension("test-ext", async (context) => {
      context.subscriptions.push({ dispose: disposeFn });
    });

    host.deactivateExtension("test-ext");

    expect(disposeFn).toHaveBeenCalled();
  });

  it("should deactivate all extensions", async () => {
    const disposeFn1 = vi.fn();
    const disposeFn2 = vi.fn();

    await host.registerExtension(
      { name: "ext1", displayName: "Ext 1", version: "1.0.0", main: "index.js" },
      "/path1"
    );
    await host.registerExtension(
      { name: "ext2", displayName: "Ext 2", version: "1.0.0", main: "index.js" },
      "/path2"
    );

    await host.activateExtension("ext1", async (ctx) => {
      ctx.subscriptions.push({ dispose: disposeFn1 });
    });
    await host.activateExtension("ext2", async (ctx) => {
      ctx.subscriptions.push({ dispose: disposeFn2 });
    });

    host.deactivateAll();

    expect(disposeFn1).toHaveBeenCalled();
    expect(disposeFn2).toHaveBeenCalled();
    expect(host.getAllExtensions()).toHaveLength(0);
  });

  it("should fire document events", () => {
    const openListener = vi.fn();
    const changeListener = vi.fn();
    const closeListener = vi.fn();

    host.onDidOpenTextDocument(openListener);
    host.onDidChangeTextDocument(changeListener);
    host.onDidCloseTextDocument(closeListener);

    const mockDoc = { uri: "file:///test.ts", fileName: "test.ts", languageId: "typescript", version: 1, isDirty: false, isUntitled: false, lineCount: 10, getText: () => "", lineAt: () => ({ lineNumber: 0, text: "", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, rangeExcludingWhitespace: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, isEmptyOrWhitespace: true }), offsetAt: () => 0, positionAt: () => ({ line: 0, character: 0 }) };

    host.fireOnDidOpenTextDocument(mockDoc);
    host.fireOnDidChangeTextDocument(mockDoc);
    host.fireOnDidCloseTextDocument(mockDoc);

    expect(openListener).toHaveBeenCalledWith(mockDoc);
    expect(changeListener).toHaveBeenCalledWith(mockDoc);
    expect(closeListener).toHaveBeenCalledWith(mockDoc);
  });
});
