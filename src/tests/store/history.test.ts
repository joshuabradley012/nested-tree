import { describe, expect, it } from "vitest";

import type { Node } from "@core";
import { HistoryStore } from "@store/history";

const createStore = () => new HistoryStore();

const createNode = (parentId: string, id: string, name: string): Node => ({
  id,
  name,
  parentId,
  orderKey: "",
});

describe("HistoryStore undo/redo", () => {
  it("undo removes the last committed change and redo reapplies it", () => {
    const store = createStore();
    const rootId = store.snapshot.rootId;
    const node = createNode(rootId, "child-1", "First child");

    const insertResult = store.insertNode(rootId, node);
    expect(insertResult.success).toBe(true);
    expect(store.snapshot.childrenById[rootId]).toContain(node.id);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);

    store.undo();

    const childrenAfterUndo = store.snapshot.childrenById[rootId] ?? [];
    expect(childrenAfterUndo).not.toContain(node.id);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);

    store.redo();

    expect(store.snapshot.childrenById[rootId]).toContain(node.id);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);
  });

  it("undo stacks multiple operations and redo walks them forward", () => {
    const store = createStore();
    const rootId = store.snapshot.rootId;
    const firstNode = createNode(rootId, "child-1", "First");
    const secondNode = createNode(rootId, "child-2", "Second");

    expect(store.insertNode(rootId, firstNode).success).toBe(true);
    expect(store.insertNode(rootId, secondNode).success).toBe(true);
    expect(store.snapshot.childrenById[rootId]).toEqual([firstNode.id, secondNode.id]);

    store.undo(); // remove second
    expect(store.snapshot.childrenById[rootId]).toEqual([firstNode.id]);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(true);

    store.undo(); // remove first
    expect(store.snapshot.childrenById[rootId]).toEqual([]);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);

    store.redo(); // add first back
    expect(store.snapshot.childrenById[rootId]).toEqual([firstNode.id]);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(true);

    store.redo(); // add second back
    expect(store.snapshot.childrenById[rootId]).toEqual([firstNode.id, secondNode.id]);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);
  });
});

