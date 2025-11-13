# Nested Tree

Bootstrap project for experimenting with hierarchical tree editing primitives.

## Getting Started

```bash
npm install
npm run dev
```

The dev server boots on `http://localhost:5173` by default (see `vite.config.ts`).

## Example tree

```javascript
{
  id: "root",
  name: "Root",
  children: [
    {
      id: "child-1",
      name: "Child 1",
      children: [
        {
          id: "child-1-1",
          name: "Child 1-1",
        }
      ]
    }
  ]
}
```

## Design Considerations

In order to choose the correct implementation of our nested tree, it is important to consider how users will interact with this drag-and-drop schema editor, including what future needs they may have. My assumptions are listed below:

- Insert: frequent
- Update: frequent
- Move: frequent
- Delete: occasional
- Query: frequent root node queries (e.g. I want to edit the blog post schema) infrequent subtree queries (e.g. I want to edit every schema that has an image field)
- DB persistence: required
- Structure: sparse tree, no circular references. Future needs for sharable fragments would create a DAG
- Multiplayer/CRDTs: future requirement
- Edge cases: infrequent operations such as key compaction should not disrupt the user experience

Given these requirements, I've listed a map of trade-offs for several common datastructures used to implement trees. All examples reference this tree:

```
    A
   / \
  B   C
 /
D
```

- Adjacency list
  - Definition: each node maps to its children
  - Example: `A: [B, C]; B: [D]; C: []`
  - Pros: simple writes, moves, and storage
  - Cons: expensive recursive subtree queries
- Materialized path
  - Definition: a flat table stores each node's path from the root
  - Example: `A, A/B, A/B/D, A/C`,
  - Pros: fast subtree queries and ancestor checks
  - Cons: complex writes, moderate storage. Moves are inefficient and require updating all descendants
- Nested sets
  - Definition: the entire tree structure is represented using numerical intervals
  - Example: `A: {lft: 1, rgt: 8}; B: {lft: 2, rgt: 5}; D: {lft: 3, rgt: 4}; C: {lft: 6, rgt: 7}`
  - Pros: optimally efficient subtree queries, simple integer range checks, no recursion, compact storage, incredible for static taxonomies
  - Cons: costly inserts and moves, updates lft/rgt references for many nodes, difficult to order
- Closure table
  - Definition: stores all ancestor-descendant relationships, unlike an adjacency list which only stores parent/child relationships, but it requires two tables
  - Example: nodes: `A; B; C; D` node paths: `{ancestor: A, descendant: A, depth: 0}; {ancestor: A, descendant: B, depth: 1}; {ancestor: A, descendant: C, depth: 1}; {ancestor: A, descendant: D, depth: 2}; {ancestor: B, descendant: B, depth: 0}; {ancestor: B, descendant: D, depth: 1}; {ancestor: D, descendant: D, depth: 0}`
  - Pros: fast reads, no recursion, moderately complex writes, supports DAGs as well as trees
  - Cons: complex implementation, large storage requirements O(n^2) in the worst case

I have chosen to implement an adjacency list. In a mature production instance, one may find that users want to share schema fragments (e.g. reusable schemas like {image, headline, copy}), reference properties from other trees (e.g. company address), or perform complex subtree queries in which case the complexity of a closure table would be justified.

Also, the order of children must be preserved. Fractional keys are the most scalable way to handle this. Again, let's explore the trade-offs of common fractional key implementations:

- Integers with gaps: 
  - Definition: ordering uses gapped integers, such as 10, 20, 30
  - Pros: simplicity
  - Cons: more frequent compaction
- Decimal strings: 
  - Definition: ordering uses decimal strings, such as 0.1, 0.2, and 0.3
  - Pros: simplicity, in languages that implement BigDecimal as a wrapper around BigInteger, there is no difference in complexity between this and integers
  - Cons: it is cognitively taxing to reason in floats, and potentially introduces float precision errors
- Lexicographic ranks: 
  - Definition: ranks are represented as strings, such as "a", "b", "c", where insertions lengthen the string such as inserting "aa" between "a" and "b"
  - Pros: very infrequent compaction, and compaction is limited to subtrees, handles massive scale
  - Cons: complex implementation, recommended to use existing implementations such as LexoRank

For this toy example, integer gapped fractional keys are the pragmatic choice. Lexicographic fractional keys would prove more practical in production, but using an existing implementation, as recommended, would defeat the purpose of this toy example.


## Implementation Notes

- /src/core/model.ts
  - Contains useful, stateless primitives for maniuplating our adjacency list
  - With one exception, primitives take advantage of recursion. This creates a larger memory footprint, but a more elegant implementation. Because this is a toy example, I chose algorithmic purity over pragmatism. The exception is `assertCycleFree` which must use iteration to avoid getting stuck in a recursive subroutine
  - In production, there should be more guards against malformed data containing cycles, multiple parents, etc
- /src/core/ops.ts
  - Contains the core adjacency list API (insert, update, delete, move) all of which compose model helpers to create state mutations
- /src/App.tsx
  - Because this is a toy example, I haven't implemented react-hook-forms or zod like I would in production for validation, error messages, and other UX elements

## Complexity Table

| Operation        | Time Complexity | Notes                                                                 |
| ---------------- | --------------- | --------------------------------------------------------------------- |
| `insertNode`     | O(k)            | Validates parent, normalizes sibling order keys when gaps close.      |
| `updateNode`     | O(1)            | Direct node update after validation.                                  |
| `moveNode`       | O(k)            | Removes from original parent, recomputes order key in destination.    |
| `reorderSibling` | O(k)            | Repositions within sibling array and renormalizes order keys.         |
| `deleteNode`     | O(n)`†`         | Removes node and descendants; `n` is subtree size.                     |

`†` Subtree size dominates; higher-level structures can mitigate with cached indexes.

## Testing

There are unit tests covering all critical functionality. You can run them using:

```bash
npm test
```

## Roadmap

This toy example serves as a scalable substrate for future improvements. If inspired, or motivated to create a production instance of this, I will work on the following:

- Keyboard controls (tab focus, arrow keys to move nodes, common shortcuts for Delete, Enter, Ctrl+Z, Ctrl+R)
- Drag and drop using DnD kit
- Extend Node to handle props beyond just "name"
  - For example, key, type, default value
  - Would include integraing react-hook-form and zod for validation
- Advanced UI to create custom schemas (input, textarea, date pickers, select, group, images, etc.)
  - Nesting would be limited to only the group field
- Pretty print to observe the tree as a JSON object (like the example at the top of this README)
- Import/export schemas
- Persistence layer with remote or local storage
- Integration with Yjs for multiplayer CRDTs
- Integration with OpenAI structured outputs to generate schemas or content via text commands
