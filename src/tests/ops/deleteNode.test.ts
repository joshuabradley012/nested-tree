import { describe, expect, test } from "vitest";

import { deleteNode } from "@core/ops";
import type { TreeState, Node } from "@core/types";

const makeBaseState = (): TreeState => ({
  rootId: "root",
  nodesById: {
    root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
    parent: { id: "parent", name: "Parent", parentId: "root", orderKey: "0" },
    childA: { id: "childA", name: "Child A", parentId: "parent", orderKey: "0" },
    childB: { id: "childB", name: "Child B", parentId: "parent", orderKey: "10" },
    grandChild: { id: "grandChild", name: "Grand Child", parentId: "childA", orderKey: "0" },
  },
  childrenById: {
    root: ["parent"],
    parent: ["childA", "childB"],
    childA: ["grandChild"],
    childB: [],
    grandChild: [],
  },
});

describe("deleteNode", () => {
  test("removes the node subtree and updates the parent child list", () => {
    const initialState = makeBaseState();

    const result = deleteNode(initialState, "childA");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;

    expect(state.nodesById).not.toHaveProperty("childA");
    expect(state.nodesById).not.toHaveProperty("grandChild");
    expect(state.childrenById).not.toHaveProperty("childA");
    expect(state.childrenById).not.toHaveProperty("grandChild");

    expect(state.childrenById.parent).toEqual(["childB"]);
    expect(state.nodesById.childB.orderKey).toBe("10");
  });

  test("returns an error when the node does not exist", () => {
    const initialState = makeBaseState();
    const result = deleteNode(initialState, "missing");
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("NodeNotFound");
  });

  test("handles deleting a node with no parent by removing only its subtree", () => {
    const initialState: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        orphan: { id: "orphan", name: "Standalone", parentId: null, orderKey: "1" },
      },
      childrenById: {
        root: [],
        orphan: [],
      },
    };

    const result = deleteNode(initialState, "orphan");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.nodesById).not.toHaveProperty("orphan");
    expect(state.childrenById).not.toHaveProperty("orphan");
  });
});

