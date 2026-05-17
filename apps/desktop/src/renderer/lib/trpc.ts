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
};
