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
};
