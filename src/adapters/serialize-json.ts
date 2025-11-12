import {
  TreeState,
  Node,
} from "@core";
import {
  assertOrderKeysStrict,
} from "@core/invariants";

export type SerializedTree = { version: 1; tree: string };

export function serializeTreeState(state: TreeState): SerializedTree {
  return { version: 1, tree: JSON.stringify(state) };
}

export function deserializeTreeState(payload: SerializedTree): TreeState {
  const tree: TreeState = {
    rootId: "",
    nodesById: {},
    childrenById: {}
  };
  const parsedPayload = JSON.parse(payload.tree);

  if (typeof parsedPayload.rootId !== "string" || parsedPayload.rootId.trim() === "")
    throw new Error(`Invalid tree: expected rootId to be a non-empty string, received ${JSON.stringify(parsedPayload.rootId)}`);
  if (typeof parsedPayload.nodesById !== "object" || parsedPayload.nodesById === null)
    throw new Error("Invalid tree: expected nodesById to be a plain object keyed by node id");
  if (typeof parsedPayload.childrenById !== "object" || parsedPayload.childrenById === null)
    throw new Error("Invalid tree: expected childrenById to be a plain object keyed by parent id");

  tree.rootId = parsedPayload.rootId.trim();

  Object.entries(parsedPayload.nodesById).forEach(([id, node]) => {
    if (typeof id !== "string" || id.trim() === "")
      throw new Error(`Invalid tree: nodesById keys must be non-empty strings, received ${JSON.stringify(id)}`);
    if (typeof node !== "object" || node === null)
      throw new Error(`Invalid tree: nodesById["${id}"] must be a plain object value`);

    const trimmedId = id.trim();

    const validatedNode: Node = {
      id: "",
      name: "",
      parentId: null,
      orderKey: "",
    };

    const seen = new Set<string>();

    Object.entries(node).forEach(([key, value]) => {
      if (typeof key !== "string" || key.trim() === "")
        throw new Error(`Invalid tree: node "${trimmedId}" has a property key that is not a non-empty string`);

      const trimmedKey = key.trim();
      seen.add(trimmedKey);

      if (trimmedKey === "id") {
        if (typeof value !== "string" || value.trim() === "")
          throw new Error(`Invalid tree: node "${trimmedId}" has an id value that is not a non-empty string`);
        validatedNode.id = value.trim();
      }

      if (trimmedKey === "name") {
        if (typeof value !== "string" || value.trim() === "")
          throw new Error(`Invalid tree: node "${trimmedId}" has a name value that is not a non-empty string`);
        validatedNode.name = value;
      }      

      if (trimmedKey === "parentId") {
        if (
          !["string", "object"].includes(typeof value)
          || (typeof value === "string" && value.trim() === "")
          || (typeof value === "object" && value !== null)
        ) {
          throw new Error(`Invalid tree: node "${trimmedId}" has a parentId value that must be a non-empty string or null`);
        }
        if (typeof value === "string") {
          validatedNode.parentId = value.trim();
        } else {
          validatedNode.parentId = value;
        }
      }

      if (trimmedKey === "orderKey") {
        if (typeof value !== "string" || value.trim() === "")
          throw new Error(`Invalid tree: node "${trimmedId}" has an orderKey value that is not a non-empty string`);
        validatedNode.orderKey = value.trim();
      }
    });

    ["id", "name", "parentId", "orderKey"].forEach((key) => {
      if (!seen.has(key))
        throw new Error(`Invalid tree: node "${trimmedId}" is missing required property "${key}"`);
    });

    if (trimmedId !== validatedNode.id)
      throw new Error(`Invalid tree: nodesById key "${trimmedId}" does not match nested node id "${validatedNode.id}"`);

    tree.nodesById[trimmedId] = validatedNode;
  });

  if (!tree.nodesById[tree.rootId])
    throw new Error(`Invalid tree: rootId "${tree.rootId}" is not present in nodesById`);
  if (tree.nodesById[tree.rootId].parentId !== null)
    throw new Error(`Invalid tree: root node "${tree.rootId}" must have parentId null`);

  Object.entries(parsedPayload.childrenById).forEach(([parentId, childrenIds]) => {
    if (typeof parentId !== "string" || parentId.trim() === "")
      throw new Error(`Invalid tree: childrenById keys must be non-empty strings, received ${JSON.stringify(parentId)}`);
    if (!Array.isArray(childrenIds))
      throw new Error(`Invalid tree: childrenById["${parentId}"] must be an array of child ids`);

    const trimmedParentId = parentId.trim();

    if (!tree.nodesById[trimmedParentId])
      throw new Error(`Invalid tree: parent id "${trimmedParentId}" in childrenById has no matching node`);

    const validatedChildren: string[] = [];
    const seenChildren = new Set<string>();

    childrenIds.forEach((childId) => {
      if (typeof childId !== "string" || childId.trim() === "")
        throw new Error(`Invalid tree: children array for parent "${trimmedParentId}" contains a value that is not a non-empty string id`);

      const trimmedChildId = childId.trim();

      if (!tree.nodesById[trimmedChildId])
        throw new Error(`Invalid tree: child id "${trimmedChildId}" under parent "${trimmedParentId}" has no matching node`);

      if (seenChildren.has(trimmedChildId))
        throw new Error(`Invalid tree: parent "${trimmedParentId}" lists duplicate child id "${trimmedChildId}"`);
      seenChildren.add(trimmedChildId);

      validatedChildren.push(trimmedChildId);
    });

    tree.childrenById[trimmedParentId] = validatedChildren;
  });

  Object.entries(tree.nodesById).forEach(([id, node]) => {
    if (!node.parentId) return;
    const siblings = tree.childrenById[node.parentId];
    if (!Array.isArray(siblings)) {
      throw new Error(`Invalid tree: parent "${node.parentId}" is missing an array entry in childrenById`);
    }
    if (!siblings.includes(id)) {
      throw new Error(`Invalid tree: node "${id}" is not listed under its parent "${node.parentId}" in childrenById`);
    }
  });

  Object.keys(tree.childrenById).forEach((parentId) => {
    const orderCheck = assertOrderKeysStrict(tree, parentId);
    if (!orderCheck.success) {
      throw new Error(`Invalid tree: ${orderCheck.error.kind} for parent "${parentId}"`);
    }
  });

  return tree;
}