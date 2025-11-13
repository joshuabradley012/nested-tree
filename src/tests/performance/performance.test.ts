import { describe, expect, it } from "vitest";

import type { Node } from "@core";
import { createHistoryStore } from "@store/history";

const TOTAL_OPERATIONS = 500;
const TIME_BUDGET_MS = 1_000;

describe("Performance sanity", () => {
  it(`handles ${TOTAL_OPERATIONS} inserts and reorders under ${TIME_BUDGET_MS}ms`, () => {
    const store = createHistoryStore();
    const rootId = store.snapshot.rootId;

    const start = performance.now();

    for (let index = 0; index < TOTAL_OPERATIONS; index += 1) {
      const nodeId = `perf-node-${index}`;
      const node: Node = {
        id: nodeId,
        name: `Perf ${index}`,
        parentId: rootId,
        orderKey: "",
      };
      const result = store.insertNode(rootId, node);
      if (!result.success) {
        throw new Error(`Insert failed for ${nodeId}: ${JSON.stringify(result.error)}`);
      }
    }

    for (let index = 0; index < TOTAL_OPERATIONS; index += 1) {
      const nodeId = `perf-node-${index}`;
      const result = store.reorderSibling(nodeId, 0);
      if (!result.success) {
        throw new Error(`Reorder failed for ${nodeId}: ${JSON.stringify(result.error)}`);
      }
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(TIME_BUDGET_MS);
  });
});

