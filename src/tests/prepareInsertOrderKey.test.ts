import { describe, expect, it } from "vitest";

import { minOrderGap, orderGap, prepareInsertOrderKey } from "@core/model";
import type { Node, TreeState } from "@core/types";

describe("prepareInsertOrderKey", () => {
  it("assigns a new order key at the end when the incoming key is blank", () => {
    const rootId = "root";

    const firstChild: Node = {
      id: "child-1",
      name: "Child 1",
      parentId: rootId,
      orderKey: "0",
    };

    const secondChild: Node = {
      id: "child-2",
      name: "Child 2",
      parentId: rootId,
      orderKey: (0 + orderGap).toString(),
    };

    const state: TreeState = {
      rootId,
      nodesById: {
        [rootId]: {
          id: rootId,
          name: "Root",
          parentId: null,
          orderKey: "0",
        },
        [firstChild.id]: firstChild,
        [secondChild.id]: secondChild,
      },
      childrenById: {
        [rootId]: [firstChild.id, secondChild.id],
      },
    };

    const newNode: Node = {
      id: "child-3",
      name: "Child 3",
      parentId: rootId,
      orderKey: "",
    };

    const result = prepareInsertOrderKey(state, rootId, newNode);

    const expectedOrderKey = (
      parseInt(secondChild.orderKey) + orderGap
    ).toString();

    expect(result.nextOrderKey).toBe(expectedOrderKey);
    expect(result.normalizedOrderKeys).toBeNull();
    expect(result.sortedChildren).toHaveLength(0);
  });

  it("bumps a colliding order key forward when a gap exists", () => {
    const rootId = "root";

    const leftSibling: Node = {
      id: "left",
      name: "Left",
      parentId: rootId,
      orderKey: "0",
    };

    const rightSibling: Node = {
      id: "right",
      name: "Right",
      parentId: rootId,
      orderKey: (0 + orderGap).toString(),
    };

    const state: TreeState = {
      rootId,
      nodesById: {
        [rootId]: {
          id: rootId,
          name: "Root",
          parentId: null,
          orderKey: "0",
        },
        [leftSibling.id]: leftSibling,
        [rightSibling.id]: rightSibling,
      },
      childrenById: {
        [rootId]: [leftSibling.id, rightSibling.id],
      },
    };

    const newNode: Node = {
      id: "incoming",
      name: "Incoming",
      parentId: rootId,
      orderKey: leftSibling.orderKey,
    };

    const result = prepareInsertOrderKey(state, rootId, newNode);

    expect(result.nextOrderKey).toBe((parseInt(leftSibling.orderKey) + orderGap).toString());
    expect(result.normalizedOrderKeys).toBeNull();
    expect(result.sortedChildren).toHaveLength(0);
  });

  it("normalizes sibling keys when the gap between neighbors is too small", () => {
    const rootId = "root";

    const leftSibling: Node = {
      id: "left",
      name: "Left",
      parentId: rootId,
      orderKey: "0",
    };

    const rightSibling: Node = {
      id: "right",
      name: "Right",
      parentId: rootId,
      orderKey: (parseInt(leftSibling.orderKey) + minOrderGap).toString(),
    };

    const state: TreeState = {
      rootId,
      nodesById: {
        [rootId]: {
          id: rootId,
          name: "Root",
          parentId: null,
          orderKey: "0",
        },
        [leftSibling.id]: leftSibling,
        [rightSibling.id]: rightSibling,
      },
      childrenById: {
        [rootId]: [leftSibling.id, rightSibling.id],
      },
    };

    const newNode: Node = {
      id: "incoming",
      name: "Incoming",
      parentId: rootId,
      orderKey: rightSibling.orderKey,
    };

    const result = prepareInsertOrderKey(state, rootId, newNode);

    expect(result.normalizedOrderKeys).not.toBeNull();
    expect(result.sortedChildren).toHaveLength(3);

    const normalizedKeys = result.normalizedOrderKeys!;
    expect(normalizedKeys[leftSibling.id]).toBe("0");
    expect(normalizedKeys[newNode.id]).toBe(orderGap.toString());
    expect(normalizedKeys[rightSibling.id]).toBe((orderGap * 2).toString());
    expect(result.nextOrderKey).toBe(normalizedKeys[newNode.id]);
  });
});

