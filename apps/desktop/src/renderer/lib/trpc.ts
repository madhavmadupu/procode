import { ipcRenderer } from "electron";

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
      ipcRenderer.removeAllListeners(responseChannel);
      reject(new Error(`tRPC call timed out: ${router}.${procedure}`));
    }, 10000);

    ipcRenderer.once(responseChannel, (_event, response: TrpcResponse) => {
      clearTimeout(timeout);

      if (response.result.error) {
        reject(new Error(response.result.error.message));
      } else {
        resolve(response.result.data as T);
      }
    });

    ipcRenderer.send("trpc-request", request);
  });
}

export const trpc = {
  fileSystem: {
    openFolder: (path: string) =>
      trpcCall("fileSystem", "openFolder", { path }, "mutation"),
    readDirectory: (path: string) =>
      trpcCall("fileSystem", "readDirectory", { path }, "query"),
    readFile: (path: string) =>
      trpcCall("fileSystem", "readFile", { path }, "query"),
    writeFile: (path: string, content: string) =>
      trpcCall("fileSystem", "writeFile", { path, content }, "mutation"),
    stat: (path: string) =>
      trpcCall("fileSystem", "stat", { path }, "query"),
    exists: (path: string) =>
      trpcCall("fileSystem", "exists", { path }, "query"),
    deleteFile: (path: string) =>
      trpcCall("fileSystem", "deleteFile", { path }, "mutation"),
    rename: (oldPath: string, newPath: string) =>
      trpcCall("fileSystem", "rename", { oldPath, newPath }, "mutation"),
    getWorkspaceRoot: () =>
      trpcCall("fileSystem", "getWorkspaceRoot", undefined, "query"),
  },
  settings: {
    getSettings: () =>
      trpcCall("settings", "getSettings", undefined, "query"),
    updateSetting: (key: string, value: unknown, scope?: "global" | "workspace") =>
      trpcCall("settings", "updateSetting", { key, value, scope }, "mutation"),
    getGlobalSettings: () =>
      trpcCall("settings", "getGlobalSettings", undefined, "query"),
    getWorkspaceSettings: () =>
      trpcCall("settings", "getWorkspaceSettings", undefined, "query"),
    resetSettings: (scope?: "global" | "workspace") =>
      trpcCall("settings", "resetSettings", { scope }, "mutation"),
  },
  git: {
    status: () =>
      trpcCall("git", "status", undefined, "query"),
    stage: (input: { paths: string[] }) =>
      trpcCall("git", "stage", input, "mutation"),
    unstage: (input: { paths: string[] }) =>
      trpcCall("git", "unstage", input, "mutation"),
    discard: (input: { paths: string[] }) =>
      trpcCall("git", "discard", input, "mutation"),
    diff: (input: { path: string; staged: boolean }) =>
      trpcCall("git", "diff", input, "query"),
    commit: (input: { message: string; signOff?: boolean }) =>
      trpcCall("git", "commit", input, "mutation"),
    amend: (input: { message?: string }) =>
      trpcCall("git", "amend", input, "mutation"),
    branches: () =>
      trpcCall("git", "branches", undefined, "query"),
    currentBranch: () =>
      trpcCall("git", "currentBranch", undefined, "query"),
    createBranch: (input: { name: string; from?: string }) =>
      trpcCall("git", "createBranch", input, "mutation"),
    checkoutBranch: (input: { name: string }) =>
      trpcCall("git", "checkoutBranch", input, "mutation"),
    deleteBranch: (input: { name: string; force?: boolean }) =>
      trpcCall("git", "deleteBranch", input, "mutation"),
    blame: (input: { path: string }) =>
      trpcCall("git", "blame", input, "query"),
    log: (input: { limit?: number; path?: string }) =>
      trpcCall("git", "log", input, "query"),
    fetch: (input: { remote?: string }) =>
      trpcCall("git", "fetch", input, "mutation"),
    pull: () =>
      trpcCall("git", "pull", undefined, "mutation"),
    push: (input: { remote: string; branch: string }) =>
      trpcCall("git", "push", input, "mutation"),
    remotes: () =>
      trpcCall("git", "remotes", undefined, "query"),
    stashPush: (input: { message?: string }) =>
      trpcCall("git", "stashPush", input, "mutation"),
    stashPop: (input: { index?: number }) =>
      trpcCall("git", "stashPop", input, "mutation"),
    stashList: () =>
      trpcCall("git", "stashList", undefined, "query"),
    stashDrop: (input: { index: number }) =>
      trpcCall("git", "stashDrop", input, "mutation"),
  },
  ai: {
    checkHealth: () =>
      trpcCall("ai", "checkHealth", undefined, "query"),
    chat: (input: { messages: Array<{ role: string; content: string }>; model?: string; temperature?: number; maxTokens?: number }) =>
      trpcCall("ai", "chat", input, "mutation"),
    configureProvider: (input: { provider: string; model: string; apiKey?: string; baseUrl?: string; temperature?: number; maxTokens?: number }) =>
      trpcCall("ai", "configureProvider", input, "mutation"),
    configureEmbeddingProvider: (input: { baseUrl?: string }) =>
      trpcCall("ai", "configureEmbeddingProvider", input, "mutation"),
    executeAgentTask: (input: { request: string; context: string[] }) =>
      trpcCall("ai", "executeAgentTask", input, "mutation"),
    searchCodebase: (input: { query: string; topK?: number }) =>
      trpcCall("ai", "searchCodebase", input, "query"),
    indexFile: (input: { filePath: string; content: string; language: string }) =>
      trpcCall("ai", "indexFile", input, "mutation"),
  },
  lsp: {
    startServer: (input: { serverId: string; rootPath: string }) =>
      trpcCall("lsp", "startServer", input, "mutation"),
    stopServer: (input: { serverId: string }) =>
      trpcCall("lsp", "stopServer", input, "mutation"),
    stopAll: () =>
      trpcCall("lsp", "stopAll", {}, "mutation"),
    getServerStates: () =>
      trpcCall("lsp", "getServerStates", {}, "query"),
    completion: (input: { uri: string; line: number; character: number; triggerKind?: number; triggerCharacter?: string }) =>
      trpcCall("lsp", "completion", input, "query"),
    hover: (input: { uri: string; line: number; character: number }) =>
      trpcCall("lsp", "hover", input, "query"),
    definition: (input: { uri: string; line: number; character: number }) =>
      trpcCall("lsp", "definition", input, "query"),
    references: (input: { uri: string; line: number; character: number; includeDeclaration?: boolean }) =>
      trpcCall("lsp", "references", input, "query"),
    documentSymbols: (input: { uri: string }) =>
      trpcCall("lsp", "documentSymbols", input, "query"),
    workspaceSymbols: (input: { query: string }) =>
      trpcCall("lsp", "workspaceSymbols", input, "query"),
    rename: (input: { uri: string; line: number; character: number; newName: string }) =>
      trpcCall("lsp", "rename", input, "mutation"),
    signatureHelp: (input: { uri: string; line: number; character: number }) =>
      trpcCall("lsp", "signatureHelp", input, "query"),
    codeAction: (input: { uri: string; startLine: number; startCharacter: number; endLine: number; endCharacter: number; diagnostics?: unknown[] }) =>
      trpcCall("lsp", "codeAction", input, "query"),
    formatting: (input: { uri: string; tabSize?: number; insertSpaces?: boolean }) =>
      trpcCall("lsp", "formatting", input, "mutation"),
    didOpen: (input: { uri: string; languageId: string; version: number; text: string }) =>
      trpcCall("lsp", "didOpen", input, "mutation"),
    didChange: (input: { uri: string; version: number; changes: { range?: { start: { line: number; character: number }; end: { line: number; character: number } }; text: string }[] }) =>
      trpcCall("lsp", "didChange", input, "mutation"),
    didClose: (input: { uri: string }) =>
      trpcCall("lsp", "didClose", input, "mutation"),
    didSave: (input: { uri: string; text?: string }) =>
      trpcCall("lsp", "didSave", input, "mutation"),
    checkServers: () =>
      trpcCall("lsp", "checkServers", {}, "query"),
    installServer: (input: { serverId: string }) =>
      trpcCall("lsp", "installServer", input, "mutation"),
  },
  dap: {
    startSession: (input: { adapterPath: string; config: unknown }) =>
      trpcCall("dap", "startSession", input, "mutation"),
    stopSession: () =>
      trpcCall("dap", "stopSession", {}, "mutation"),
    getState: () =>
      trpcCall("dap", "getState", {}, "query"),
    setBreakpoints: (input: { path: string; breakpoints: { line: number; column?: number; condition?: string; hitCondition?: string; logMessage?: string }[] }) =>
      trpcCall("dap", "setBreakpoints", input, "mutation"),
    clearBreakpoints: (input: { path: string }) =>
      trpcCall("dap", "clearBreakpoints", input, "mutation"),
    getBreakpoints: () =>
      trpcCall("dap", "getBreakpoints", {}, "query"),
    continue: (input: { threadId?: number }) =>
      trpcCall("dap", "continue", input, "mutation"),
    next: (input: { threadId?: number }) =>
      trpcCall("dap", "next", input, "mutation"),
    stepIn: (input: { threadId?: number }) =>
      trpcCall("dap", "stepIn", input, "mutation"),
    stepOut: (input: { threadId?: number }) =>
      trpcCall("dap", "stepOut", input, "mutation"),
    pause: (input: { threadId?: number }) =>
      trpcCall("dap", "pause", input, "mutation"),
    getThreads: () =>
      trpcCall("dap", "getThreads", {}, "query"),
    getStackTrace: (input: { threadId?: number; startFrame?: number; levels?: number }) =>
      trpcCall("dap", "getStackTrace", input, "query"),
    getScopes: (input: { frameId: number }) =>
      trpcCall("dap", "getScopes", input, "query"),
    getVariables: (input: { variablesReference: number }) =>
      trpcCall("dap", "getVariables", input, "query"),
    evaluate: (input: { expression: string; frameId?: number }) =>
      trpcCall("dap", "evaluate", input, "mutation"),
  },
};
