import { describe, expect, test } from "vitest";

import { updateNode } from "@core/ops";
import type { TreeState, Node } from "@core/types";

describe("updateNode", () => {
  const baseState: TreeState = {
    rootId: "root",
    nodesById: {
      root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
      parent: { id: "parent", name: "Parent", parentId: "root", orderKey: "0" },
      child: { id: "child", name: "Original Name", parentId: "parent", orderKey: "10" },
    },
    childrenById: {
      root: ["parent"],
      parent: ["child"],
    },
  };

  test("updates mutable fields (e.g., name) while preserving structural properties", () => {
    const updatedNode: Node = {
      id: "child",
      name: "Updated Name",
      parentId: "parent",
      orderKey: "10",
    };

    const result = updateNode(baseState, "child", updatedNode);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = result.data;
    expect(state.nodesById.child.name).toBe("Updated Name");
    expect(state.nodesById.child.parentId).toBe("parent");
    expect(state.nodesById.child.orderKey).toBe("10");
    expect(state.childrenById.parent).toEqual(["child"]);
  });

  test("rejects updates that attempt to change the node id", () => {
    const updatedNode: Node = {
      id: "other-id",
      name: "Updated Name",
      parentId: "parent",
      orderKey: "10",
    };

    const result = updateNode(baseState, "child", updatedNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("InvalidUpdate");
  });

  test("rejects updates that attempt to change the parentId", () => {
    const updatedNode: Node = {
      id: "child",
      name: "Updated Name",
      parentId: "other-parent",
      orderKey: "10",
    };

    const result = updateNode(baseState, "child", updatedNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("InvalidUpdate");
  });

  test("rejects updates that attempt to change the orderKey", () => {
    const updatedNode: Node = {
      id: "child",
      name: "Updated Name",
      parentId: "parent",
      orderKey: "999",
    };

    const result = updateNode(baseState, "child", updatedNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("InvalidUpdate");
  });

  test("returns an error when the node does not exist", () => {
    const updatedNode: Node = {
      id: "missing",
      name: "Updated Name",
      parentId: "parent",
      orderKey: "10",
    };

    const result = updateNode(baseState, "missing", updatedNode);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.kind).toBe("NodeNotFound");
  });
});

