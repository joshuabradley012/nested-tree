import {
  TreeState,
  Node,
} from "@core";

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

  if (typeof parsedPayload.rootId !== "string" || parsedPayload.rootId === "") {
    throw new Error("Invalid tree: rootId must be a string with text");
  }
  tree.rootId = parsedPayload.rootId.trim();

  if (typeof parsedPayload.nodesById !== "object" || parsedPayload.nodesById === null)
    throw new Error("Invalid tree: nodesById must be an object with the type signature Record<string, Node>");

  Object.entries(parsedPayload.nodesById).forEach(([id, node]) => {
    if (typeof id !== "string" || id === "")
      throw new Error("Invalid tree: nodesById must be an object with the type signature Record<string, Node>");

    const trimmedId = id.trim();

    const validatedNode: Node = {
      id: "",
      name: "",
      parentId: null,
      orderKey: "",
    };

    if (typeof node !== "object" || node === null)
      throw new Error("Invalid tree: nodesById must be an object with the type signature Record<string, Node>");

    const seen = new Set<string>();

    Object.entries(node).forEach(([key, value]) => {
      if (typeof key !== "string" || key === "")
        throw new Error("Invalid tree: nodesById must be an object with the type signature Record<string, Node>");

      const trimmedKey = key.trim();
      seen.add(trimmedKey);

      if (trimmedKey === "id") {
        if (typeof value !== "string" || value === "")
          throw new Error("Invalid tree: nodes must match the type signature of Node, id invalid");
        validatedNode.id = value.trim();
      }

      if (trimmedKey === "name") {
        if (typeof value !== "string" || value === "")
          throw new Error("Invalid tree: nodes must match the type signature of Node, name invalid");
        validatedNode.name = value;
      }      

      if (trimmedKey === "parentId") {
        if (
          !["string", "object"].includes(typeof value)
          || (typeof value === "string" && value === "")
          || (typeof value === "object" && value !== null)
        ) {
          throw new Error("Invalid tree: nodes must match the type signature of Node, parentId invalid");
        }
        if (typeof value === "string") {
          validatedNode.parentId = value.trim();
        } else {
          validatedNode.parentId = value;
        }
      }

      if (trimmedKey === "orderKey") {
        if (typeof value !== "string" || value === "")
          throw new Error("Invalid tree: nodes must match the type signature of Node, orderKey invalid");
        validatedNode.orderKey = value.trim();
      }
    });

    ["id", "name", "parentId", "orderKey"].forEach((key) => {
      if (!seen.has(key))
        throw new Error(`Invalid tree: nodes must match the type signature of Node, ${key} missing`);
    });

    if (trimmedId !== validatedNode.id)
      throw new Error("Invalid tree: nodes in nodesById must be indexed by an id that matches their internal key");

    tree.nodesById[trimmedId] = validatedNode;
  });

  return tree;
}