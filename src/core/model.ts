import type {
  TreeState,
  Node,
  OrderKey,
  OrderIndexMap,
  OperationResult,
} from "./types";

export const orderGap = 10;
export const minOrderGap = 1;

export function createTreeState(): TreeState {
  // crypto is availabe in the browser API: https://developer.mozilla.org/en-US/docs/Web/API/Crypto
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
    nodesById: Object.fromEntries(
      Object.entries(state.nodesById)
        .map(([id, node]) => [id, { ...node }])
    ),
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

export function findNearestSiblings(state: TreeState, node: Node): Node[] {
  if (!node.parentId) return [];

  const siblings = findChildrenNodes(state, node.parentId)
    .filter(sibling => sibling.id !== node.id)
    .sort((a, b) => parseInt(a.orderKey) - parseInt(b.orderKey));

  if (siblings.length === 0 || !node.orderKey) {
    return siblings.slice(-1);
  }

  const targetKey = parseInt(node.orderKey);
  let leftSibling: Node | null = null;
  let rightSibling: Node | null = null;

  for (const sibling of siblings) {
    const siblingKey = parseInt(sibling.orderKey);
    if (siblingKey < targetKey) {
      leftSibling = sibling;
      continue;
    }

    if (siblingKey === targetKey) {
      const index = siblings.findIndex(({ id }) => id === sibling.id);
      leftSibling = index > 0 ? siblings[index - 1] : leftSibling;
      rightSibling = sibling;
      break;
    }

    rightSibling = sibling;
    break;
  }

  const nearest: Node[] = [];
  if (leftSibling) nearest.push(leftSibling);
  if (rightSibling) nearest.push(rightSibling);
  return nearest;
}

export function makeGapKey(nodeA: Node, nodeB: Node): OrderKey {
  const nodeAKey = parseInt(nodeA.orderKey);
  const nodeBKey = parseInt(nodeB.orderKey);
  const gap = nodeAKey + (nodeBKey - nodeAKey) / 2;
  return gap.toString();
}

export function normalizeOrderKeys(children: Node[]): OrderIndexMap {
  const orderIndexMap: OrderIndexMap = {};
  children.forEach((child, index) => {
    orderIndexMap[child.id] = (index * orderGap).toString();
  });
  return orderIndexMap;
} 

export function assertNodeIsUnique(state: TreeState, nodeId: string): OperationResult<void> {
  const existingNode = findNodeById(state, nodeId);
  if (existingNode) {
    return { success: false, error: { kind: "DuplicateNode", nodeId } };
  }
  return { success: true, data: undefined }
}

export function assertNodeIsValid(node: Node): OperationResult<Node> {
  if (!node.id) {
    return { success: false, error: { kind: "InvalidNode", node } }
  }
  return { success: true, data: node }
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
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: "NodeIsParent" } }
  }
  const nodeResult = assertNodeExists(state, nodeId);
  if (!nodeResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: nodeResult.error.kind } };
  }
  const parentResult = assertNodeExists(state, parentId);
  if (!parentResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: parentResult.error.kind } };
  }
  const cycleResult = assertCycleFree(state, nodeId);
  if (!cycleResult.success) {
    return { success: false, error: { kind: "InvalidMove", nodeId, parentId, reason: cycleResult.error.kind } };
  }
  return { success: true, data: undefined };
}