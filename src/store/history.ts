import {
  applyPatches,
  enablePatches,
  produceWithPatches,
  Patch,
} from "immer";
import {
  Node,
  TreeState,
  OperationResult,
  createTreeState,
  insertNode as insertOp,
  updateNode as updateOp,
  moveNode as moveOp,
  reorderSibling as reorderOp,
  deleteNode as deleteOp,
} from "@core";

type HistoryEntry = {
  patches: Patch[];
  inversePatches: Patch[];
};

type Listener = () => void;

class HistoryStore {
  private state: TreeState = createTreeState();
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get snapshot() {
    return this.state;
  }

  apply(fn: (draft: TreeState) => void) {
    const [next, patches, inversePatches] = produceWithPatches(this.state, fn);
    if (patches.length === 0) return;

    this.state = next;
    this.past.push({ patches: inversePatches, inversePatches: patches });
    this.future = [];
    this.emit();
  }

  undo() {
    const entry = this.past.pop();
    if (!entry) return;

    this.state = applyPatches(this.state, entry.patches);
    this.future.push(entry);
    this.emit();
  }

  redo() {
    const entry = this.future.pop();
    if (!entry) return;

    this.state = applyPatches(this.state, entry.inversePatches);
    this.past.push(entry);
    this.emit();
  }

  insertNode(parentId: string, node: Node): OperationResult<TreeState> {
    const result = insertOp(this.state, parentId, node);
    if (!result.success) return result;

    this.commit(result.data);
    return result;
  }

  updateNode(nodeId: string, node: Node): OperationResult<TreeState> {
    const result = updateOp(this.state, nodeId, node);
    if (!result.success) return result;

    this.commit(result.data);
    return result;
  }

  moveNode(nodeId: string, parentId: string): OperationResult<TreeState> {
    const result = moveOp(this.state, nodeId, parentId);
    if (!result.success) return result;

    this.commit(result.data);
    return result;
  }

  reorderSibling(nodeId: string, newIndex: number): OperationResult<TreeState> {
    const result = reorderOp(this.state, nodeId, newIndex);
    if (!result.success) return result;

    this.commit(result.data);
    return result;
  }

  deleteNode(nodeId: string): OperationResult<TreeState> {
    const result = deleteOp(this.state, nodeId);
    if (!result.success) return result;

    this.commit(result.data);
    return result;
  }

  private commit(nextState: TreeState) {
    this.apply((draft) => {
      Object.assign(draft, nextState);
    });
  }
  
  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}

export const historyStore = new HistoryStore();

enablePatches();