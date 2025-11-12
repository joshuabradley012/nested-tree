import { describe, expect, test } from "vitest";

import { moveNode } from "@core/ops";
import { orderGap } from "@core/model";
import type { TreeState, Node } from "@core/types";

const makeBaseState = (): TreeState => ({
  rootId: "root",
  nodesById: {
    root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
    parentA: { id: "parentA", name: "Parent A", parentId: "root", orderKey: "0" },
    parentB: { id: "parentB", name: "Parent B", parentId: "root", orderKey: "10" },
    child1: { id: "child1", name: "Child 1", parentId: "parentA", orderKey: "0" },
    child2: { id: "child2", name: "Child 2", parentId: "parentA", orderKey: orderGap.toString() },
  },
  childrenById: {
    root: ["parentA", "parentB"],
    parentA: ["child1", "child2"],
    parentB: [],
    child1: [],
    child2: [],
  },
});

describe("moveNode", () => {
  test("moves a node to a new parent and recalculates order keys", () => {
    const initialState = makeBaseState();

    const result = moveNode(initialState, "child2", "parentB");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;

    expect(state.childrenById.parentA).toEqual(["child1"]);
    expect(state.childrenById.parentB).toEqual(["child2"]);

    expect(state.nodesById.child2.parentId).toBe("parentB");
    expect(parseInt(state.nodesById.child2.orderKey, 10)).toBeGreaterThanOrEqual(0);

    expect(state.nodesById.child1.orderKey).toBe("0");
  });

  test("handles moves within the same parent and updates sibling order", () => {
    const initialState: TreeState = {
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

    const result = moveNode(initialState, "child3", "parent");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;

    expect(state.childrenById.parent).toEqual(["child1", "child2", "child3"]);
    expect(state.nodesById.child3.orderKey).toBe((orderGap * 2).toString());
  });

  test("rejects moves that target a descendant (cycle detection)", () => {
    const initialState = makeBaseState();

    const result = moveNode(initialState, "parentA", "child1");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("CycleDetected");
  });

  test("rejects moves when the source node does not exist", () => {
    const initialState = makeBaseState();
    const result = moveNode(initialState, "missing", "parentB");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("InvalidMove");
  });

  test("rejects moves when the destination parent does not exist", () => {
    const initialState = makeBaseState();
    const result = moveNode(initialState, "child1", "missing-parent");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("InvalidMove");
  });
});

