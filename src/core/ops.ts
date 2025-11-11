import type {
  OperationResult,
  OrderKey,
  TreeState,
  Node,
  OrderIndexMap,
} from "./types";
import {
  orderGap,
  minOrderGap,
  cloneTreeState,
  findNodeById,
  findParentNode,
  findChildrenNodes,
  findAncestorNodes,
  findDescendantNodes,
  findSiblingNodes,
  findSubtreeNodes,
  findNearestSiblings,
  makeGapKey,
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
  const validNode = assertNodeIsValid(node);
  if (!validNode.success) return validNode;

  const uniqueNode = assertNodeIsUnique(initialState, node.id);
  if (!uniqueNode.success) return uniqueNode;

  const parentNode = assertNodeExists(initialState, parentId);
  if (!parentNode.success) return parentNode;

  const consistentChildren = assertChildrenConsistent(initialState, parentId);
  if (!consistentChildren.success) return consistentChildren;

  const state = cloneTreeState(initialState);

  const nextNode: Node = { ...node, parentId };
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

  const orderCheck = assertOrderKeysStrict(state, parentId);
  if (!orderCheck.success) return orderCheck;

  return { success: true, data: state };
};

export function updateNode(initialState: TreeState, nodeId: string, node: Node): OperationResult<TreeState> {
  const validUpdate = assertUpdateNodeIsValid(initialState, nodeId, node);
  if (!validUpdate.success) return validUpdate;

  const state = cloneTreeState(initialState);

  const updatedNode = { ...validUpdate.data, ...node };
  state.nodesById[nodeId] = updatedNode;

  return { success: true, data: state };
};

export function deleteNode(initialState: TreeState, nodeId: string): OperationResult<TreeState> {
  const existingNode = assertNodeExists(initialState, nodeId);
  if (!existingNode.success) return existingNode;

  const state = cloneTreeState(initialState);
  const nodesToDelete = findDescendantNodes(state, nodeId);
  const parentId = existingNode.data.parentId;

  nodesToDelete.forEach((node) => {
    delete state.nodesById[node.id];
    delete state.childrenById[node.id];
  });
  delete state.nodesById[existingNode.data.id];
  delete state.childrenById[existingNode.data.id];

  if (parentId) {
    state.childrenById[parentId] = (state.childrenById[parentId] ?? []).filter(id => id !== nodeId);
    const validDeletion = assertOrderKeysStrict(state, parentId);
    if (!validDeletion.success) return validDeletion;
  }

  return { success: true, data: state };
};

export function moveNode(initialState: TreeState, nodeId: string, parentId: string): OperationResult<TreeState> {
  const validMove = assertValidMove(initialState, nodeId, parentId);
  if (!validMove.success) return validMove;

  const state = cloneTreeState(initialState);
  const originalParentId = validMove.data.parentId;

  if (originalParentId) {
    state.childrenById[originalParentId] = (state.childrenById[originalParentId] ?? []).filter(id => id !== nodeId);
  }

  const nextNode: Node = { ...validMove.data, parentId };
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
};

export function reorderSibling(initialState: TreeState, nodeId: string, siblingId: string, newIndex: number): OperationResult<TreeState> {
  const state = cloneTreeState(initialState);
  return { success: true, data: state };
};