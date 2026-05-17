import path from "node:path";

export function uriToPath(uri: string): string {
  if (uri.startsWith("file://")) {
    const parsed = new URL(uri);
    let pathname = parsed.pathname;
    if (process.platform === "win32" && pathname.startsWith("/")) {
      pathname = pathname.slice(1);
    }
    return path.normalize(pathname);
  }
  return path.normalize(uri);
}

export function isGitRepo(rootPath: string): boolean {
  const fs = require("node:fs");
  let current = rootPath;
  while (current !== path.parse(current).root) {
    const gitDir = path.join(current, ".git");
    if (fs.existsSync(gitDir)) {
      return true;
    }
    current = path.dirname(current);
  }
  return false;
}
