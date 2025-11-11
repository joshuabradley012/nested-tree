import type {
  OperationResult,
  TreeState,
  Node,
} from "./types";
import {
  cloneTreeState,
  findDescendantNodes,
  normalizeOrderKeys,
  prepareInsertOrderKey,
} from "./model";
import {
  assertNodeIsValid,
  assertNodeIsUnique,
  assertNodeExists,
  assertUpdateNodeIsValid,
  assertChildrenConsistent,
  assertOrderKeysStrict,
  assertParentExists,
  assertCycleFree,
  assertValidMove,
} from "./invariants";

export function insertNode(initialState: TreeState, parentId: string, node: Node): OperationResult<TreeState> {
  const validNodeCheck = assertNodeIsValid(node);
  if (!validNodeCheck.success) return validNodeCheck;

  const uniqueNodeCheck = assertNodeIsUnique(initialState, node.id);
  if (!uniqueNodeCheck.success) return uniqueNodeCheck;

  const parentNodeCheck = assertNodeExists(initialState, parentId);
  if (!parentNodeCheck.success) return parentNodeCheck;

  const consistentChildrenCheck = assertChildrenConsistent(initialState, parentId);
  if (!consistentChildrenCheck.success) return consistentChildrenCheck;

  const state = cloneTreeState(initialState);

  const nextNode: Node = { ...node, parentId };
  const { nextOrderKey, normalizedOrderKeys, sortedChildren } = prepareInsertOrderKey(state, parentId, nextNode);
  nextNode.orderKey = nextOrderKey;
  state.childrenById[parentId] ??= [];
  if (normalizedOrderKeys !== null && sortedChildren.length > 0) {
    sortedChildren.forEach((child) => {
      child.orderKey = normalizedOrderKeys[child.id];
    });
    state.childrenById[parentId] = sortedChildren.map(child => child.id)
  } else {
    state.childrenById[parentId].push(nextNode.id);
  }
  state.nodesById[nextNode.id] = nextNode;

  const orderCheck = assertOrderKeysStrict(state, parentId);
  if (!orderCheck.success) return orderCheck;

  return { success: true, data: state };
}

export function updateNode(initialState: TreeState, nodeId: string, node: Node): OperationResult<TreeState> {
  const validUpdateCheck = assertUpdateNodeIsValid(initialState, nodeId, node);
  if (!validUpdateCheck.success) return validUpdateCheck;

  const state = cloneTreeState(initialState);

  const updatedNode = { ...validUpdateCheck.data, ...node };
  state.nodesById[nodeId] = updatedNode;

  return { success: true, data: state };
}

export function deleteNode(initialState: TreeState, nodeId: string): OperationResult<TreeState> {
  const existingNodeCheck = assertNodeExists(initialState, nodeId);
  if (!existingNodeCheck.success) return existingNodeCheck;

  const state = cloneTreeState(initialState);
  const nodesToDelete = findDescendantNodes(state, nodeId);
  const parentId = existingNodeCheck.data.parentId;

  nodesToDelete.forEach((node) => {
    delete state.nodesById[node.id];
    delete state.childrenById[node.id];
  });
  delete state.nodesById[existingNodeCheck.data.id];
  delete state.childrenById[existingNodeCheck.data.id];

  if (parentId) {
    state.childrenById[parentId] = (state.childrenById[parentId] ?? []).filter(id => id !== nodeId);
    const validDeletion = assertOrderKeysStrict(state, parentId);
    if (!validDeletion.success) return validDeletion;
  }

  return { success: true, data: state };
}

export function moveNode(initialState: TreeState, nodeId: string, parentId: string): OperationResult<TreeState> {
  const validMoveCheck = assertValidMove(initialState, nodeId, parentId);
  if (!validMoveCheck.success) return validMoveCheck;

  const state = cloneTreeState(initialState);
  const originalParentId = validMoveCheck.data.parentId;

  if (originalParentId) {
    state.childrenById[originalParentId] = (state.childrenById[originalParentId] ?? []).filter(id => id !== nodeId);
  }

  const nextNode: Node = { ...validMoveCheck.data, parentId };
  const { nextOrderKey, normalizedOrderKeys, sortedChildren } = prepareInsertOrderKey(state, parentId, nextNode);
  nextNode.orderKey = nextOrderKey;
  state.childrenById[parentId] ??= [];
  if (normalizedOrderKeys !== null && sortedChildren.length > 0) {
    sortedChildren.forEach(child => {
      child.orderKey = normalizedOrderKeys[child.id];
    });
    state.childrenById[parentId] = sortedChildren.map(child => child.id)
  } else {
    state.childrenById[parentId].push(nextNode.id);
  }
  state.nodesById[nextNode.id] = nextNode;

  const destinationOrderCheck = assertOrderKeysStrict(state, parentId);
  if (!destinationOrderCheck.success) return destinationOrderCheck;

  if (originalParentId && originalParentId !== parentId) {
    const originOrderCheck = assertOrderKeysStrict(state, originalParentId);
    if (!originOrderCheck.success) return originOrderCheck;
  }

  const cycleCheck = assertCycleFree(state, nodeId);
  if (!cycleCheck.success) return cycleCheck;

  return { success: true, data: state };
}

export function reorderSibling(initialState: TreeState, nodeId: string, newIndex: number): OperationResult<TreeState> {
  const nodeExistsCheck = assertNodeExists(initialState, nodeId);
  if (!nodeExistsCheck.success) return nodeExistsCheck;

  const parentExistsCheck = assertParentExists(initialState, nodeId);
  if (!parentExistsCheck.success) return parentExistsCheck;

  const state = cloneTreeState(initialState);
  const parentId = parentExistsCheck.data.id;
  const currentChildIds = (state.childrenById[parentId] ?? []).filter(id => id !== nodeId);
  const boundedIndex = Math.max(0, Math.min(newIndex, currentChildIds.length));

  currentChildIds.splice(boundedIndex, 0, nodeId);
  state.childrenById[parentId] = currentChildIds;

  const reorderedChildren = currentChildIds
    .map(childId => state.nodesById[childId])
    .filter((child): child is Node => Boolean(child));

  const normalizedOrderKeys = normalizeOrderKeys(reorderedChildren);
  reorderedChildren.forEach(child => {
    child.orderKey = normalizedOrderKeys[child.id];
  });

  const orderCheck = assertOrderKeysStrict(state, parentId);
  if (!orderCheck.success) return orderCheck;

  return { success: true, data: state };
}
