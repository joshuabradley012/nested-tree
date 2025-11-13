import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { Node, OperationResult, TreeState } from "@core";
import { historyStore } from "@store/history";

type HistoryActions = {
  insertNode: (parentId: string, node: Node) => OperationResult<TreeState>;
  updateNode: (nodeId: string, node: Node) => OperationResult<TreeState>;
  moveNode: (nodeId: string, parentId: string, targetIndex?: number) => OperationResult<TreeState>;
  reorderSibling: (nodeId: string, newIndex: number) => OperationResult<TreeState>;
  deleteNode: (nodeId: string) => OperationResult<TreeState>;
};

type UseNestedTreeResult = HistoryActions & {
  state: TreeState;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function useNestedTree(): UseNestedTreeResult {
  const subscribe = useCallback(
    (listener: () => void) => historyStore.subscribe(listener),
    []
  );

  const getSnapshot = useCallback(() => historyStore.snapshot, []);

  const state = useSyncExternalStore(subscribe, getSnapshot);

  const undo = useCallback(() => {
    historyStore.undo();
  }, []);

  const redo = useCallback(() => {
    historyStore.redo();
  }, []);

  const actions = useMemo<HistoryActions>(
    () => ({
      insertNode: (parentId, node) => historyStore.insertNode(parentId, node),
      updateNode: (nodeId, node) => historyStore.updateNode(nodeId, node),
      moveNode: (nodeId, parentId, targetIndex) =>
        historyStore.moveNode(nodeId, parentId, targetIndex),
      reorderSibling: (nodeId, newIndex) =>
        historyStore.reorderSibling(nodeId, newIndex),
      deleteNode: (nodeId) => historyStore.deleteNode(nodeId),
    }),
    []
  );

  const canUndo = historyStore.canUndo;
  const canRedo = historyStore.canRedo;

  return {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    ...actions,
  };
}
