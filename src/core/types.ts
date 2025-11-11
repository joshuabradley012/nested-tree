export type OrderKey = string;

export type Node = {
  id: string;
  name: string;
  parentId: string | null;
  orderKey: OrderKey;
};

export type TreeState = {
  rootId: string;
  nodesById: Record<string, Node>;
  childrenById: Record<string, string[]>;
};

export type OrderIndexMap = Record<string, OrderKey>;

export type OperationError =
  | { kind: "InvalidNode"; node: Node }
  | { kind: "DuplicateNode"; nodeId: string }
  | { kind: "NodeNotFound"; nodeId: string }
  | { kind: "ParentNotFound"; nodeId: string }
  | { kind: "NodeIsParent"; nodeId: string }
  | { kind: "CycleDetected"; path: string[] }
  | { kind: "InvalidOrderKey"; nodeId: string; orderKey: string }
  | { kind: "InvalidOrderSequence"; parentId: string; sequence: string[] }
  | { kind: "InvalidMove"; nodeId: string; parentId: string; reason: string };

export type OperationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: OperationError;
};