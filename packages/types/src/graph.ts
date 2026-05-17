export type EdgeType = "depends_on" | "calls" | "imports" | "defines" | "references" | "extends";

export interface KnowledgeGraphNode {
  id: string;
  type: "file" | "function" | "class" | "interface" | "variable" | "module";
  name: string;
  path: string;
  range?: { start: { line: number; col: number }; end: { line: number; col: number } };
  metadata?: Record<string, unknown>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeGraphNode>;
  edges: Map<string, KnowledgeGraphEdge>;
  addNode(node: KnowledgeGraphNode): void;
  addEdge(edge: KnowledgeGraphEdge): void;
  removeNode(id: string): void;
  removeEdge(source: string, target: string): void;
  getIncomingEdges(nodeId: string, edgeType?: EdgeType): KnowledgeGraphEdge[];
  getOutgoingEdges(nodeId: string, edgeType?: EdgeType): KnowledgeGraphEdge[];
  getConnectedNodes(nodeId: string, depth: number): KnowledgeGraphNode[];
  query(pattern: GraphQuery): KnowledgeGraphNode[];
}

export interface GraphQuery {
  nodeType?: KnowledgeGraphNode["type"];
  edgeType?: EdgeType;
  pathPattern?: string;
  namePattern?: string;
  maxDepth?: number;
}
