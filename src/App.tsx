import { useCallback, type FormEvent } from "react";
import { Node } from "@core";
import { useNestedTree } from "@hooks/useNestedTree";
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@ui/dialog";
import { TreeNode } from "@components/TreeNode";

function App() {
  const {
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    insertNode,
    updateNode,
    moveNode,
    reorderSibling,
    deleteNode,
  } = useNestedTree();

  const handleAddNode = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parentId = event.currentTarget.id;
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    if (typeof parentId !== "string" || parentId === "" || typeof formData.name !== "string") return;
    const newNode: Node = {
      id: crypto.randomUUID(),
      name: formData.name,
      parentId, 
      orderKey: "",
    };
    insertNode(parentId, newNode);
  }, []);

  return (
    <main className="mx-auto max-w-2xl py-8">
      <h1 className="text-4xl font-semibold">Nested Tree</h1>

      <div className="my-6 space-y-2">
        {(state.childrenById[state.rootId] ?? []).map((childId) => (
          <TreeNode
            key={childId}
            nodeId={childId}
            nodesById={state.nodesById}
            childrenById={state.childrenById}
            onAddSubnode={handleAddNode}
          />
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button>Add node</Button>
        </DialogTrigger>
        <DialogContent>
          <form id={state.rootId} onSubmit={handleAddNode} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                Create new node
              </DialogTitle>
              <DialogDescription>
                This will insert a new node at the end of the nested tree.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="node-name">Name</Label>
              <Input id="node-name" name="name" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="submit">Save</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default App;

