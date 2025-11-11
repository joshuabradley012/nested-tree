import type {
  TreeState,
  Node,
  OperationResult,
  OperationError,
} from "./types";
import {
  findNodeById,
  findParentNode,
} from "./model";

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

export function assertUpdateNodeIsValid(state: TreeState, nodeId: string, node: Node): OperationResult<Node> {
  const existingNode = assertNodeExists(state, nodeId);
  if (!existingNode.success)
    return existingNode;
  if (node.id !== existingNode.data.id)
    return { success: false, error: { kind: "InvalidUpdate", node, reason: "Cannot update node.id" } };
  if (node.parentId !== existingNode.data.parentId)
    return { success: false, error: { kind: "InvalidUpdate", node, reason: "Cannot update node.parentId" } };
  if (node.orderKey !== existingNode.data.orderKey)
    return { success: false, error: { kind: "InvalidUpdate", node, reason: "Cannot update node.orderKey" } };

  return { success: true, data: existingNode.data };
}

export function assertParentExists(state: TreeState, nodeId: string): OperationResult<Node> {
  const parent = findParentNode(state, nodeId);
  if (!parent) {
    return { success: false, error: { kind: "ParentNotFound", nodeId } };
  }
  return { success: true, data: parent };
}

export function assertChildrenConsistent(state: TreeState, parentId: string): OperationResult<Node[]> {
  const childIds = state.childrenById[parentId] ?? [];
  const seenIds = new Set<string>();
  const resolvedChildren: Node[] = [];

  for (const childId of childIds) {
    if (seenIds.has(childId)) {
      return { success: false, error: { kind: "DuplicateNode", nodeId: childId } };
    }
    seenIds.add(childId);

    const node = findNodeById(state, childId);
    if (!node) {
      return { success: false, error: { kind: "NodeNotFound", nodeId: childId } };
    }

    if (node.parentId !== parentId) {
      return { success: false, error: { kind: "ParentNotFound", nodeId: childId } };
    }

    resolvedChildren.push(node);
  }

  return { success: true, data: resolvedChildren };
}

export function assertOrderKeysStrict(state: TreeState, parentId: string): OperationResult<Node[]> {
  const childrenResult = assertChildrenConsistent(state, parentId);
  if (!childrenResult.success) {
    return childrenResult;
  }

  const resolvedChildren = childrenResult.data;
  let previousKey: number | null = null;

  for (const child of resolvedChildren) {
    const key = parseInt(child.orderKey);
    if (Number.isNaN(key)) {
      const error: OperationError = {
        kind: "InvalidOrderKey",
        nodeId: child.id,
        orderKey: child.orderKey,
      };
      return { success: false, error };
    }

    if (previousKey !== null && key <= previousKey) {
      const error: OperationError = {
        kind: "InvalidOrderSequence",
        parentId,
        sequence: resolvedChildren.map(({ id }) => id),
      };
      return { success: false, error };
    }

    previousKey = key;
  }

  return { success: true, data: resolvedChildren };
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

export function assertValidMove(state: TreeState, nodeId: string, parentId: string): OperationResult<Node> {
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
  return { success: true, data: nodeResult.data };
}