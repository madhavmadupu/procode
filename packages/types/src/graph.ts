export type EdgeType = "depends_on" | "calls" | "imports" | "defines" | "references" | "extends";

export interface KnowledgeGraphNode {
  id: string;
  type: "file" | "function" | "class" | "interface" | "variable" | "module";
  name: string;
  path: string;
  range?: { start: { line: number; col: number }; end: { line: number; col: number } };
  metadata?: Record<string, unknown>;
}
