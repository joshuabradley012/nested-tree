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
import {
  CirclePlus,
  Trash,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export function TreeNode({
  nodeId,
  nodesById,
  childrenById,
  onInsert,
  onDelete,
  onUpdate,
  onMove,
  onReorder,
}: {
  nodeId: string;
  nodesById: Record<string, Node>;
  childrenById: Record<string, string[]>;
  onInsert: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (nodeId: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onMove: (nodeId: string, parentId: string) => void;
  onReorder: (nodeId: string, newIndex: number) => void;
}) {
  if (!nodeId) return null;
  const node = nodesById[nodeId];
  if (!node) return null;
  const childrenIds = childrenById[nodeId] ?? [];
  return (
    <>
      <div className="rounded-md border p-1 flex justify-between items-center">
        <p className="pl-2">{node.name || "Untitled node"}</p>
        <div className="grid grid-cols-3 size-9 ml-auto mr-2">
          <Button className="row-start-1 col-start-2 col-span-1 size-3 !p-0" variant="ghost">
            <ArrowUp className="size-3 fill-current" />
          </Button>
          <Button className="row-start-2 col-start-1 col-span-1 size-3 !p-0" variant="ghost">
            <ArrowLeft className="size-3 fill-current" />
          </Button>
          <Button className="row-start-2 col-start-3 col-span-1 size-3 !p-0" variant="ghost">
            <ArrowRight className="size-3 fill-current" />
          </Button>
          <Button className="row-start-3 col-start-2 col-span-1 size-3 !p-0" variant="ghost">
            <ArrowDown className="size-3 fill-current" />
          </Button>
        </div>
        <div className="-space-x-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <CirclePlus />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form id={node.id} onSubmit={onInsert} className="flex flex-col gap-4">
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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form id={node.id} onSubmit={onUpdate} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>
                    Update node
                  </DialogTitle>
                  <DialogDescription>
                    This will change the name of the node.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="node-name">Name</Label>
                  <Input id="node-name" name="name" defaultValue={node.name} />
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
          <Button size="icon" variant="ghost" onClick={() => onDelete(nodeId)}>
            <Trash />
          </Button>
        </div>
      </div>
      {childrenIds.map((id) => (
        <div key={id} className="ml-4 space-y-2">
          <TreeNode
            nodeId={id}
            nodesById={nodesById}
            childrenById={childrenById}
            onInsert={onInsert}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onMove={onMove}
            onReorder={onReorder}
          />
        </div>
      ))}
    </>
  );
}