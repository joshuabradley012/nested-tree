import { describe, expect, test } from "vitest";

import { reorderSibling } from "@core/ops";
import { orderGap } from "@core/model";
import type { TreeState, Node } from "@core/types";

const baseState: TreeState = {
  rootId: "root",
  nodesById: {
    root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
    parent: { id: "parent", name: "Parent", parentId: "root", orderKey: "0" },
    child1: { id: "child1", name: "Child 1", parentId: "parent", orderKey: "0" },
    child2: { id: "child2", name: "Child 2", parentId: "parent", orderKey: orderGap.toString() },
    child3: { id: "child3", name: "Child 3", parentId: "parent", orderKey: (orderGap * 2).toString() },
  },
  childrenById: {
    root: ["parent"],
    parent: ["child1", "child2", "child3"],
    child1: [],
    child2: [],
    child3: [],
  },
};

describe("reorderSibling", () => {
  test("moves a node to the requested index and renormalizes order keys", () => {
    const result = reorderSibling(baseState, "child3", 0);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.childrenById.parent).toEqual(["child3", "child1", "child2"]);
    expect(state.nodesById.child3.orderKey).toBe("0");
    expect(state.nodesById.child1.orderKey).toBe(orderGap.toString());
    expect(state.nodesById.child2.orderKey).toBe((orderGap * 2).toString());
  });

  test("clamps the index when it is out of bounds", () => {
    const result = reorderSibling(baseState, "child1", 99);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.childrenById.parent).toEqual(["child2", "child3", "child1"]);
    expect(state.nodesById.child1.orderKey).toBe((orderGap * 2).toString());
  });

  test("rejects reorders when the node does not exist", () => {
    const result = reorderSibling(baseState, "missing", 1);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("NodeNotFound");
  });

  test("rejects reorders when the node has no parent", () => {
    const rootNode: Node = { id: "root", name: "Root", parentId: null, orderKey: "0" };
    const state: TreeState = {
      rootId: "root",
      nodesById: { root: rootNode },
      childrenById: { root: [] },
    };

    const result = reorderSibling(state, "root", 1);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("ParentNotFound");
  });
});

