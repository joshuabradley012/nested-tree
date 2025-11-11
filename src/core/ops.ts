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

  const state = cloneTreeState(initialState);
  state.childrenById[parentId] ??= [];

  const nextNode: Node = { ...node, parentId };
  const { nextOrderKey, normalizedOrderKeys, sortedChildren } = prepareInsertOrderKey(state, parentId, nextNode);
  nextNode.orderKey = nextOrderKey;
  if (normalizedOrderKeys !== null && sortedChildren.length > 0) {
    sortedChildren.forEach(child => {
      child.orderKey = normalizedOrderKeys[child.id];
    });
    state.childrenById[parentId] = sortedChildren.map(child => child.id)
  } else {
    state.childrenById[parentId].push(nextNode.id);
  }

  state.nodesById[nextNode.id] = nextNode;
  return { success: true, data: state };
};

export function updateNode(state: TreeState, nodeId: string, node: Node): OperationResult<TreeState> {
  return { success: true, data: state };
};

export function deleteNode(state: TreeState, nodeId: string): OperationResult<TreeState> {
  return { success: true, data: state };
};

export function moveNode(state: TreeState, nodeId: string, parentId: string): OperationResult<TreeState> {
  return { success: true, data: state };
};

export function reorderSibling(state: TreeState, nodeId: string, siblingId: string, newIndex: number): OperationResult<TreeState> {
  return { success: true, data: state };
};