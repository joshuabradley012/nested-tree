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
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    if (typeof formData.name !== "string") return;
    const newNode: Node = {
      id: crypto.randomUUID(),
      name: formData.name,
      parentId: state.rootId, 
      orderKey: "",
    };
    insertNode(state.rootId, newNode);
  }, []);

  return (
    <main className="mx-auto max-w-2xl py-8">
      <h1 className="text-4xl font-semibold">Nested Tree</h1>

      <div className="my-6 space-y-2">
        {(state.childrenById[state.rootId] ?? []).map((childId) => {
          const child = state.nodesById[childId];
          if (!child) return null;
          return (
            <div key={child.id} className="rounded-md border px-4 py-2">
              {child.name || "Untitled node"}
            </div>
          );
        })}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button>Add node</Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleAddNode} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                Create new node
              </DialogTitle>
              <DialogDescription>
                Nodes will insert at the end of the nested tree, name is optional.
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

