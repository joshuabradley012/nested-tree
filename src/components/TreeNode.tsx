import { type FormEvent } from "react";
import type { Node } from "@core";
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
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { Input } from "@ui/input";

export function TreeNode({
  nodeId,
  nodesById,
  childrenById,
  onAddSubnode,
}: {
  nodeId: string;
  nodesById: Record<string, Node>;
  childrenById: Record<string, string[]>;
  onAddSubnode: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!nodeId) return null;
  const node = nodesById[nodeId];
  if (!node) return null;
  const childrenIds = childrenById[nodeId] ?? [];
  return (
    <>
      <div className="rounded-md border p-1 flex justify-between items-center">
        <p className="pl-2">{node.name || "Untitled node"}</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Add subnode</Button>
          </DialogTrigger>
          <DialogContent>
            <form id={node.id} onSubmit={onAddSubnode} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  Create new node
                </DialogTitle>
                <DialogDescription>
                  This will insert a subnode to the tree.
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
      </div>
      {childrenIds.map((id) => (
        <div key={id} className="ml-4 space-y-2">
          <TreeNode
            nodeId={id}
            nodesById={nodesById}
            childrenById={childrenById}
            onAddSubnode={onAddSubnode}
          />
        </div>
      ))}
    </>
  );
}