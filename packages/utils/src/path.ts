import path from "node:path";

export function normalizePath(p: string): string {
  return path.posix.normalize(p.replace(/\\/g, "/"));
}

export function isSubPath(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}
