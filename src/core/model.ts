import type {
  TreeState,
  Node,
  OrderKey,
  OrderIndexMap,
  OperationResult,
} from "./types";

const orderGap = 10;

export function createTreeState(): TreeState {
  const rootId = crypto.randomUUID();
  return {
    rootId,
    nodesById: {
      [rootId]: {
        id: rootId,
        name: "Root",
        parentId: null,
        orderKey: "0"
      }
    },
    childrenById: { 
      [rootId]: []
    }
  };
}

export function cloneTreeState(state: TreeState): TreeState {
  return {
    ...state,
    nodesById: { ...state.nodesById },
    childrenById: Object.fromEntries(
      Object.entries(state.childrenById)
        .map(([parentId, children]) => [parentId, children.map(childId => childId)])
    )
  };
}

export function findNodeById(state: TreeState, nodeId: string): Node | null {
  return state.nodesById[nodeId] ?? null;
}

export function findParentNode(state: TreeState, nodeId: string): Node | null {
  const node = findNodeById(state, nodeId);
  return node?.parentId ? findNodeById(state, node.parentId) : null;
}

export function findChildrenNodes(state: TreeState, nodeId: string): Node[] {
  const childrenIds = state.childrenById[nodeId] ?? [];
  return childrenIds
    .map(childId => findNodeById(state, childId))
    .filter((node): node is NonNullable<typeof node> => node !== null);
}

export function findAncestorNodes(state: TreeState, nodeId: string): Node[] {
  const parent = findParentNode(state, nodeId);
  return parent ? [parent, ...findAncestorNodes(state, parent.id)] : [];
}

export function findDescendantNodes(state: TreeState, nodeId: string): Node[] {
  const children = findChildrenNodes(state, nodeId);
  return children.flatMap(child => [child, ...findDescendantNodes(state, child.id)]);
}

export function findSiblingNodes(state: TreeState, nodeId: string): Node[] {
  const parent = findParentNode(state, nodeId);
  return parent
    ? findChildrenNodes(state, parent.id).filter(child => child.id !== nodeId)
    : [];
}

export function findSubtreeNodes(state: TreeState, nodeId: string): Node[] {
  const node = findNodeById(state, nodeId);
  if (!node) return [];
  const children = findChildrenNodes(state, nodeId);
  return [node, ...children.flatMap(child => findSubtreeNodes(state, child.id))];
}

export function makeGapKey(nodeA: Node, nodeB: Node): OrderKey {
  const nodeAKey = parseInt(nodeA.orderKey);
  const nodeBKey = parseInt(nodeB.orderKey);
  const gap = (nodeBKey - nodeAKey) / 2;
  return gap.toString();
}

export function normalizeOrderKeys(children: Node[]): OrderIndexMap {
  const orderIndexMap: OrderIndexMap = {};
  children.forEach((child, index) => {
    orderIndexMap[child.id] = (index * orderGap).toString();
  });
  return orderIndexMap;
} 

export function assertNodeExists(state: TreeState, nodeId: string): OperationResult<Node> {
  const node = findNodeById(state, nodeId);
  if (!node) {
    return { success: false, error: { kind: "NodeNotFound", nodeId } };
  }
  return { success: true, data: node };
}

export function assertParentExists(state: TreeState, nodeId: string): OperationResult<Node> {
  const parent = findParentNode(state, nodeId);
  if (!parent) {
    return { success: false, error: { kind: "ParentNotFound", nodeId } };
  }
  return { success: true, data: parent };
}

export function assertCycleFree(state: TreeState, nodeId: string): OperationResult<void> {
  const visited = new Set<string>();
  const path: string[] = [];
  let currentId: string | null = nodeId;

  while (currentId !== null) {
    if (visited.has(currentId)) {
      const cycleStartIndex = path.indexOf(currentId);
      const cyclePath =
        cycleStartIndex >= 0 ? [...path.slice(cycleStartIndex), currentId] : [currentId, currentId];
      return { success: false, error: { kind: "CycleDetected", path: cyclePath } };
    }

    visited.add(currentId);
    path.push(currentId);

    const node = findNodeById(state, currentId);
    if (!node) {
      break;
    }

    currentId = node.parentId;
  }

  return { success: true, data: undefined };
}

export function assertValidMove(state: TreeState, nodeId: string, parentId: string): OperationResult<void> {
  if (parentId === nodeId) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: "Parent ID is the same as the node ID" } }
  }
  const nodeResult = assertNodeExists(state, nodeId);
  if (!nodeResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: "Node does not exist" } };
  }
  const parentResult = assertNodeExists(state, parentId);
  if (!parentResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: "Parent does not exist" } };
  }
  const cycleResult = assertCycleFree(state, nodeId);
  if (!cycleResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: "A cycle would be created" } };
  }
  return { success: true, data: undefined };
}