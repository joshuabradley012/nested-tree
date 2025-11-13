import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Node } from "@core";
import { TreeNode } from "@components/TreeNode";

const noopInsert = vi.fn();
const noopDelete = vi.fn();
const noopUpdate = vi.fn();
const noopMove = vi.fn();
const noopReorder = vi.fn();

describe("TreeNode", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the node label and any nested descendants", () => {
    const rootId = "root-node";
    const parentId = "parent-node";
    const childId = "child-node";

    const nodesById: Record<string, Node> = {
      [rootId]: {
        id: rootId,
        name: "Root",
        orderKey: "0",
        parentId: null,
      },
      [parentId]: {
        id: parentId,
        name: "Parent node",
        orderKey: "10",
        parentId: rootId,
      },
      [childId]: {
        id: childId,
        name: "Deep child",
        orderKey: "20",
        parentId,
      },
    };

    const childrenById: Record<string, string[]> = {
      [rootId]: [parentId],
      [parentId]: [childId],
      [childId]: [],
    };

    render(
      <TreeNode
        nodeId={parentId}
        nodesById={nodesById}
        childrenById={childrenById}
        onInsert={noopInsert}
        onDelete={noopDelete}
        onUpdate={noopUpdate}
        onMove={noopMove}
        onReorder={noopReorder}
      />
    );

    expect(screen.getByText("Parent node")).toBeInTheDocument();
    expect(screen.getByText("Deep child")).toBeInTheDocument();
  });

  it("returns null when the referenced node does not exist", () => {
    const { container } = render(
      <TreeNode
        nodeId="missing"
        nodesById={{}}
        childrenById={{}}
        onInsert={noopInsert}
        onDelete={noopDelete}
        onUpdate={noopUpdate}
        onMove={noopMove}
        onReorder={noopReorder}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

