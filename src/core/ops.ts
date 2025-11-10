import { OperationResult, TreeState, Node } from "./types";

export function insertNode(state: TreeState, parentId: string, node: Node): OperationResult<TreeState> {
};

export function updateNode(state: TreeState, nodeId: string, node: Node): OperationResult<TreeState> {
};

export function deleteNode(state: TreeState, nodeId: string): OperationResult<TreeState> {
};

export function moveNode(state: TreeState, nodeId: string, parentId: string): OperationResult<TreeState> {
};

export function reorderSibling(state: TreeState, nodeId: string, siblingId: string, newIndex: number): OperationResult<TreeState> {
};