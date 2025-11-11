import type {
  OperationResult,
  OrderKey,
  TreeState,
  Node,
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
  assertNodeIsValid,
  assertNodeIsUnique,
  assertNodeExists,
  assertParentExists,
  assertCycleFree,
  assertValidMove,
} from "./model";

// Keep this in ops because it mutates state
function prepareInsertOrderKey(state: TreeState, parentId: string, node: Node): OrderKey {
  const trimmedOrderKey = node.orderKey.trim();
  const existingChildren = findChildrenNodes(state, parentId);
  let nextOrderKey = trimmedOrderKey;

  if (trimmedOrderKey.length === 0) {
    const maxOrderKey = existingChildren.reduce((max, child) => {
      const key = parseInt(child.orderKey);
      return Number.isNaN(key) ? max : Math.max(max, key);
    }, 0);
    nextOrderKey = (maxOrderKey + orderGap).toString();
    node.orderKey = nextOrderKey;
    return nextOrderKey;
  }

  node.orderKey = trimmedOrderKey;
  const siblings = findNearestSiblings(state, node);

  if (siblings.length === 0) {
    nextOrderKey = node.orderKey;
  } else if (siblings.length === 1) {
    const sibling = siblings[0];
    nextOrderKey =
      sibling.orderKey === node.orderKey
        ? (parseInt(sibling.orderKey) + orderGap).toString()
        : node.orderKey;
  } else {
    const [leftSibling, rightSibling] = siblings;
    const leftKey = parseInt(leftSibling.orderKey);
    const rightKey = parseInt(rightSibling.orderKey);

    if (rightKey - leftKey <= minOrderGap) {
      const sortedChildren = existingChildren
        .slice()
        .sort((a, b) => parseInt(a.orderKey) - parseInt(b.orderKey));

      const rightIndex = sortedChildren.findIndex(child => child.id === rightSibling.id);
      const insertIndex = rightIndex >= 0 ? rightIndex : sortedChildren.length;

      const mergedChildren = [...sortedChildren];
      mergedChildren.splice(insertIndex, 0, node);

      const normalizedOrderKeys = normalizeOrderKeys(mergedChildren);
      mergedChildren.forEach(child => {
        child.orderKey = normalizedOrderKeys[child.id];
      });
      nextOrderKey = normalizedOrderKeys[node.id];
    } else {
      nextOrderKey = makeGapKey(leftSibling, rightSibling);
    }
  }

  node.orderKey = nextOrderKey;
  return nextOrderKey;
}

export function insertNode(initialState: TreeState, parentId: string, node: Node): OperationResult<TreeState> {
  const validNode = assertNodeIsValid(node);
  if (!validNode.success) return validNode;

  const isUniqueNode = assertNodeIsUnique(initialState, node.id);
  if (!isUniqueNode.success) return isUniqueNode;

  const parentNode = assertNodeExists(initialState, parentId);
  if (!parentNode.success) return parentNode;

  const state = cloneTreeState(initialState);
  state.childrenById[parentId] ??= [];

  const nextNode: Node = { ...node, parentId };
  const orderKey = prepareInsertOrderKey(state, parentId, nextNode);
  nextNode.orderKey = orderKey;

  state.nodesById[nextNode.id] = nextNode;
  state.childrenById[parentId].push(nextNode.id);
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