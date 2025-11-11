import { describe, expect, test } from "vitest";

import { insertNode } from "@core/ops";
import { orderGap } from "@core/model";
import type { TreeState, Node } from "@core/types";

describe("insertNode", () => {
  test("inserts a child with a blank orderKey at the end of the sibling list", () => {
    const parentId = "parent";
    const existingChildren: Record<string, Node> = {
      "child-1": { id: "child-1", name: "Child 1", parentId, orderKey: "0" },
      "child-2": { id: "child-2", name: "Child 2", parentId, orderKey: orderGap.toString() },
    };

    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        [parentId]: { id: parentId, name: "Parent", parentId: "root", orderKey: "0" },
        ...existingChildren,
      },
      childrenById: {
        root: [parentId],
        [parentId]: Object.keys(existingChildren),
      },
    };

    const newNode: Node = {
      id: "child-3",
      name: "Child 3",
      parentId,
      orderKey: "",
    };

    const result = insertNode(initialState, parentId, newNode);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.childrenById[parentId]).toEqual(["child-1", "child-2", "child-3"]);
    const insertedNode = state.nodesById["child-3"];
    expect(insertedNode).toBeDefined();
    expect(parseInt(insertedNode.orderKey, 10)).toBeGreaterThan(parseInt(existingChildren["child-2"].orderKey, 10));
    expect(insertedNode.parentId).toBe(parentId);
  });
  test("reassigns the new orderKey when the incoming key collides with an existing sibling", () => {
    const parentId = "parent";
    const firstOrderKey = "0";

    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        [parentId]: { id: parentId, name: "Parent", parentId: "root", orderKey: "0" },
        "child-1": { id: "child-1", name: "Child 1", parentId, orderKey: firstOrderKey },
        "child-2": { id: "child-2", name: "Child 2", parentId, orderKey: (orderGap).toString() },
      },
      childrenById: {
        root: [parentId],
        [parentId]: ["child-1", "child-2"],
      },
    };

    const newNode: Node = {
      id: "child-3",
      name: "Child 3",
      parentId,
      orderKey: firstOrderKey,
    };

    const result = insertNode(initialState, parentId, newNode);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.childrenById[parentId]).toEqual(["child-1", "child-2", "child-3"]);

    const insertedNode = state.nodesById["child-3"];
    expect(insertedNode.orderKey).toBe((orderGap * 2).toString());
  });
  test("normalizes sibling order keys when the gap between neighbors is too small", () => {
    const parentId = "parent";

    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        [parentId]: { id: parentId, name: "Parent", parentId: "root", orderKey: "0" },
        "child-1": { id: "child-1", name: "Child 1", parentId, orderKey: "0" },
        "child-2": { id: "child-2", name: "Child 2", parentId, orderKey: "1" },
      },
      childrenById: {
        root: [parentId],
        [parentId]: ["child-1", "child-2"],
      },
    };

    const newNode: Node = {
      id: "child-3",
      name: "Child 3",
      parentId,
      orderKey: "1",
    };

    const result = insertNode(initialState, parentId, newNode);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.childrenById[parentId]).toEqual(["child-1", "child-3", "child-2"]);

    const expectedOrderKeys = {
      "child-1": "0",
      "child-3": orderGap.toString(),
      "child-2": (orderGap * 2).toString(),
    };

    expect(state.nodesById["child-1"].orderKey).toBe(expectedOrderKeys["child-1"]);
    expect(state.nodesById["child-3"].orderKey).toBe(expectedOrderKeys["child-3"]);
    expect(state.nodesById["child-2"].orderKey).toBe(expectedOrderKeys["child-2"]);
  });
  test("returns an error when the node id already exists", () => {
    const parentId = "parent";

    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        [parentId]: { id: parentId, name: "Parent", parentId: "root", orderKey: "0" },
        "child-1": { id: "child-1", name: "Child 1", parentId, orderKey: "0" },
      },
      childrenById: {
        root: [parentId],
        [parentId]: ["child-1"],
      },
    };

    const newNode: Node = {
      id: "child-1",
      name: "Duplicate Child",
      parentId,
      orderKey: "",
    };

    const result = insertNode(initialState, parentId, newNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("DuplicateNode");
    if (result.error.kind !== "DuplicateNode") return;
    expect(result.error.nodeId).toBe("child-1");
  });
  test("returns an error when the parent does not exist", () => {
    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
      },
      childrenById: {
        root: [],
      },
    };

    const newNode: Node = {
      id: "child-1",
      name: "Child 1",
      parentId: "missing-parent",
      orderKey: "",
    };

    const result = insertNode(initialState, "missing-parent", newNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("NodeNotFound");
    if (result.error.kind !== "NodeNotFound") return;
    expect(result.error.nodeId).toBe("missing-parent");
  });
  test("returns an error when the parent’s child list is inconsistent before insertion", () => {
    const parentId = "parent";

    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        [parentId]: { id: parentId, name: "Parent", parentId: "root", orderKey: "0" },
      },
      childrenById: {
        root: [parentId],
        [parentId]: ["missing-child"],
      },
    };

    const newNode: Node = {
      id: "child-1",
      name: "Child 1",
      parentId,
      orderKey: "",
    };

    const result = insertNode(initialState, parentId, newNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("NodeNotFound");
    if (result.error.kind !== "NodeNotFound") return;
    expect(result.error.nodeId).toBe("missing-child");
  });
});

