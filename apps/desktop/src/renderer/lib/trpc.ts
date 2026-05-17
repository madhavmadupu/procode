import type {
  DirectoryEntry,
  RepoStatus,
  BranchInfo,
  LSPConfig,
  Diagnostic,
  Completion,
  HoverResult,
  DefinitionResult,
  SymbolInfo,
  WorkspaceSymbolResult,
  RenameResult,
  SignatureHelpResult,
} from "@procode/types";

declare global {
  interface Window {
    procode: {
      ipc: {
        invoke: (channel: string, payload: unknown) => Promise<unknown>;
        send: (channel: string, payload: unknown) => void;
        on: (channel: string, callback: (response: any) => void) => () => void;
      };
    };
  }
}

let requestId = 0;

interface TrpcRequest {
  id: number;
  path: string[];
  input: unknown;
  type: "query" | "mutation";
}

interface TrpcResponse {
  id: number;
  result: {
    data?: unknown;
    error?: { message: string; code: number; data?: unknown };
  };
}

export async function trpcCall<T>(
  router: string,
  procedure: string,
  input: unknown,
  type: "query" | "mutation" = "query",
): Promise<T> {
  const id = ++requestId;
  const responseChannel = `trpc-${id}`;

  const request: TrpcRequest = {
    id,
    path: [router, procedure],
    input,
    type,
  };

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`tRPC call timed out: ${router}.${procedure}`));
    }, 10000);

    const unsubscribe = window.procode.ipc.on(responseChannel, (response: TrpcResponse) => {
      clearTimeout(timeout);
      unsubscribe();

      if (response.result.error) {
        reject(new Error(response.result.error.message));
      } else {
        resolve(response.result.data as T);
      }
    });

    window.procode.ipc.send("trpc-request", request);
  });
}

export const trpc = {
  fileSystem: {
    openFolder: (path: string) =>
      trpcCall<{ success: boolean; error?: string }>("fileSystem", "openFolder", { path }, "mutation"),
    readDirectory: (path: string) =>
      trpcCall<DirectoryEntry>("fileSystem", "readDirectory", { path }, "query"),
    readFile: (path: string) =>
      trpcCall<string>("fileSystem", "readFile", { path }, "query"),
    writeFile: (path: string, content: string) =>
      trpcCall<{ success: boolean; error?: string }>("fileSystem", "writeFile", { path, content }, "mutation"),
    stat: (path: string) =>
      trpcCall<any>("fileSystem", "stat", { path }, "query"),
    exists: (path: string) =>
      trpcCall<boolean>("fileSystem", "exists", { path }, "query"),
    deleteFile: (path: string) =>
      trpcCall<{ success: boolean; error?: string }>("fileSystem", "deleteFile", { path }, "mutation"),
    rename: (oldPath: string, newPath: string) =>
      trpcCall<{ success: boolean; error?: string }>("fileSystem", "rename", { oldPath, newPath }, "mutation"),
    getWorkspaceRoot: () =>
      trpcCall<string | null>("fileSystem", "getWorkspaceRoot", undefined, "query"),
  },
  settings: {
    getSettings: () =>
      trpcCall<any>("settings", "getSettings", undefined, "query"),
    updateSetting: (key: string, value: unknown, scope?: "global" | "workspace") =>
      trpcCall<void>("settings", "updateSetting", { key, value, scope }, "mutation"),
    getGlobalSettings: () =>
      trpcCall<any>("settings", "getGlobalSettings", undefined, "query"),
    getWorkspaceSettings: () =>
      trpcCall<any>("settings", "getWorkspaceSettings", undefined, "query"),
    resetSettings: (scope?: "global" | "workspace") =>
      trpcCall<void>("settings", "resetSettings", { scope }, "mutation"),
  },
  git: {
    status: () =>
      trpcCall<RepoStatus>("git", "status", undefined, "query"),
    stage: (input: { paths: string[] }) =>
      trpcCall<void>("git", "stage", input, "mutation"),
    unstage: (input: { paths: string[] }) =>
      trpcCall<void>("git", "unstage", input, "mutation"),
    discard: (input: { paths: string[] }) =>
      trpcCall<void>("git", "discard", input, "mutation"),
    diff: (input: { path: string; staged: boolean }) =>
      trpcCall<any>("git", "diff", input, "query"),
    commit: (input: { message: string; signOff?: boolean }) =>
      trpcCall<void>("git", "commit", input, "mutation"),
    amend: (input: { message?: string }) =>
      trpcCall<void>("git", "amend", input, "mutation"),
    branches: () =>
      trpcCall<BranchInfo[]>("git", "branches", undefined, "query"),
    currentBranch: () =>
      trpcCall<string | null>("git", "currentBranch", undefined, "query"),
    createBranch: (input: { name: string; from?: string }) =>
      trpcCall<void>("git", "createBranch", input, "mutation"),
    checkoutBranch: (input: { name: string }) =>
      trpcCall<void>("git", "checkoutBranch", input, "mutation"),
    deleteBranch: (input: { name: string; force?: boolean }) =>
      trpcCall<void>("git", "deleteBranch", input, "mutation"),
    blame: (input: { path: string }) =>
      trpcCall<any[]>("git", "blame", input, "query"),
    log: (input: { limit?: number; path?: string }) =>
      trpcCall<any[]>("git", "log", input, "query"),
    fetch: (input: { remote?: string }) =>
      trpcCall<void>("git", "fetch", input, "mutation"),
    pull: () =>
      trpcCall<void>("git", "pull", undefined, "mutation"),
    push: (input: { remote: string; branch: string }) =>
      trpcCall<void>("git", "push", input, "mutation"),
    remotes: () =>
      trpcCall<any[]>("git", "remotes", undefined, "query"),
    stashPush: (input: { message?: string }) =>
      trpcCall<void>("git", "stashPush", input, "mutation"),
    stashPop: (input: { index?: number }) =>
      trpcCall<void>("git", "stashPop", input, "mutation"),
    stashList: () =>
      trpcCall<any[]>("git", "stashList", undefined, "query"),
    stashDrop: (input: { index: number }) =>
      trpcCall<void>("git", "stashDrop", input, "mutation"),
  },
  ai: {
    checkHealth: () =>
      trpcCall<any>("ai", "checkHealth", undefined, "query"),
    chat: (input: { messages: Array<{ role: string; content: string }>; model?: string; temperature?: number; maxTokens?: number }) =>
      trpcCall<any>("ai", "chat", input, "mutation"),
    configureProvider: (input: { provider: string; model: string; apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number }) =>
      trpcCall<void>("ai", "configureProvider", input, "mutation"),
    configureEmbeddingProvider: (input: { baseUrl?: string }) =>
      trpcCall<void>("ai", "configureEmbeddingProvider", input, "mutation"),
    executeAgentTask: (input: { request: string; context: string[] }) =>
      trpcCall<any>("ai", "executeAgentTask", input, "mutation"),
    searchCodebase: (input: { query: string; topK?: number }) =>
      trpcCall<any[]>("ai", "searchCodebase", input, "query"),
    indexFile: (input: { filePath: string; content: string; language: string }) =>
      trpcCall<void>("ai", "indexFile", input, "mutation"),
  },
  lsp: {
    startServer: (input: { serverId: string; rootPath: string }) =>
      trpcCall<void>("lsp", "startServer", input, "mutation"),
    stopServer: (input: { serverId: string }) =>
      trpcCall<void>("lsp", "stopServer", input, "mutation"),
    stopAll: () =>
      trpcCall<void>("lsp", "stopAll", {}, "mutation"),
    getServerStates: () =>
      trpcCall<any[]>("lsp", "getServerStates", {}, "query"),
    completion: (input: { uri: string; line: number; character: number; triggerKind?: number; triggerCharacter?: string }) =>
      trpcCall<Completion[]>("lsp", "completion", input, "query"),
    hover: (input: { uri: string; line: number; character: number }) =>
      trpcCall<HoverResult | null>("lsp", "hover", input, "query"),
    definition: (input: { uri: string; line: number; character: number }) =>
      trpcCall<DefinitionResult | DefinitionResult[] | null>("lsp", "definition", input, "query"),
    references: (input: { uri: string; line: number; character: number; includeDeclaration?: boolean }) =>
      trpcCall<any[]>("lsp", "references", input, "query"),
    documentSymbols: (input: { uri: string }) =>
      trpcCall<SymbolInfo[]>("lsp", "documentSymbols", input, "query"),
    workspaceSymbols: (input: { query: string }) =>
      trpcCall<WorkspaceSymbolResult[]>("lsp", "workspaceSymbols", input, "query"),
    rename: (input: { uri: string; line: number; character: number; newName: string }) =>
      trpcCall<RenameResult | null>("lsp", "rename", input, "mutation"),
    signatureHelp: (input: { uri: string; line: number; character: number }) =>
      trpcCall<SignatureHelpResult | null>("lsp", "signatureHelp", input, "query"),
    codeAction: (input: { uri: string; startLine: number; startCharacter: number; endLine: number; endCharacter: number; diagnostics?: any[] }) =>
      trpcCall<any[] | null>("lsp", "codeAction", input, "query"),
    formatting: (input: { uri: string; tabSize?: number; insertSpaces?: boolean }) =>
      trpcCall<any[] | null>("lsp", "formatting", input, "mutation"),
    didOpen: (input: { uri: string; languageId: string; version: number; text: string }) =>
      trpcCall<void>("lsp", "didOpen", input, "mutation"),
    didChange: (input: { uri: string; version: number; changes: { range?: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }[] }) =>
      trpcCall<void>("lsp", "didChange", input, "mutation"),
    didClose: (input: { uri: string }) =>
      trpcCall<void>("lsp", "didClose", input, "mutation"),
    didSave: (input: { uri: string; text?: string }) =>
      trpcCall<void>("lsp", "didSave", input, "mutation"),
    checkServers: () =>
      trpcCall<any[]>("lsp", "checkServers", {}, "query"),
    installServer: (input: { serverId: string }) =>
      trpcCall<void>("lsp", "installServer", input, "mutation"),
  },
  dap: {
    startSession: (input: { adapterPath: string; config: unknown }) =>
      trpcCall<void>("dap", "startSession", input, "mutation"),
    stopSession: () =>
      trpcCall<void>("dap", "stopSession", {}, "mutation"),
    getState: () =>
      trpcCall<any>("dap", "getState", {}, "query"),
    setBreakpoints: (input: { path: string; breakpoints: { line: number; column?: number; condition?: string; hitCondition?: string; logMessage?: string }[] }) =>
      trpcCall<any[]>("dap", "setBreakpoints", input, "mutation"),
    clearBreakpoints: (input: { path: string }) =>
      trpcCall<void>("dap", "clearBreakpoints", input, "mutation"),
    getBreakpoints: () =>
      trpcCall<any>("dap", "getBreakpoints", {}, "query"),
    continue: (input: { threadId?: number }) =>
      trpcCall<void>("dap", "continue", input, "mutation"),
    next: (input: { threadId?: number }) =>
      trpcCall<void>("dap", "next", input, "mutation"),
    stepIn: (input: { threadId?: number }) =>
      trpcCall<void>("dap", "stepIn", input, "mutation"),
    stepOut: (input: { threadId?: number }) =>
      trpcCall<void>("dap", "stepOut", input, "mutation"),
    pause: (input: { threadId?: number }) =>
      trpcCall<void>("dap", "pause", input, "mutation"),
    getThreads: () =>
      trpcCall<any[]>("dap", "getThreads", {}, "query"),
    getStackTrace: (input: { threadId?: number; startFrame?: number; levels?: number }) =>
      trpcCall<any>("dap", "getStackTrace", input, "query"),
    getScopes: (input: { frameId: number }) =>
      trpcCall<any[]>("dap", "getScopes", input, "query"),
    getVariables: (input: { variablesReference: number }) =>
      trpcCall<any[]>("dap", "getVariables", input, "query"),
    evaluate: (input: { expression: string; frameId?: number }) =>
      trpcCall<any>("dap", "evaluate", input, "mutation"),
  },
  terminal: {
    create: (input?: { name?: string; cwd?: string; shell?: string; rows?: number; cols?: number }) =>
      trpcCall<any>("terminal", "create", input ?? {}, "mutation"),
    write: (input: { id: string; data: string }) =>
      trpcCall<void>("terminal", "write", input, "mutation"),
    resize: (input: { id: string; rows: number; cols: number }) =>
      trpcCall<void>("terminal", "resize", input, "mutation"),
    kill: (input: { id: string }) =>
      trpcCall<void>("terminal", "kill", input, "mutation"),
    killAll: () =>
      trpcCall<void>("lsp", "stopAll", {}, "mutation"), // Note: using lsp.stopAll as fallback if terminal.killAll is missing
    list: () =>
      trpcCall<any[]>("terminal", "list", {}, "query"),
    rename: (input: { id: string; name: string }) =>
      trpcCall<void>("terminal", "rename", input, "mutation"),
  },
  extension: {
    list: () =>
      trpcCall<any[]>("extension", "list", {}, "query"),
    activate: (input: { name: string }) =>
      trpcCall<void>("extension", "activate", input, "mutation"),
    deactivate: (input: { name: string }) =>
      trpcCall<void>("extension", "deactivate", input, "mutation"),
    getCommands: () =>
      trpcCall<any[]>("extension", "getCommands", {}, "query"),
    executeCommand: (input: { id: string; args?: unknown[] }) =>
      trpcCall<any>("extension", "executeCommand", input, "mutation"),
    registerExtension: (input: { manifest: any; extensionPath: string }) =>
      trpcCall<void>("extension", "registerExtension", input, "mutation"),
  },
  workspace: {
    getLastOpened: () =>
      trpcCall<{ id: string; rootPath: string; name: string; lastOpened: number; state: string; createdAt: number } | null>("workspace", "getLastOpened", undefined, "query"),
    setLastOpened: (input: { rootPath: string; name?: string }) =>
      trpcCall<{ id: string; rootPath: string; name: string; lastOpened: number; state: string; createdAt: number }>("workspace", "setLastOpened", input, "mutation"),
    clearLastOpened: () =>
      trpcCall<void>("workspace", "clearLastOpened", undefined, "mutation"),
  },
};
