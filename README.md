# Nested Tree

Bootstrap project for experimenting with hierarchical tree editing primitives.

## Getting Started

```bash
npm install
npm run dev
```

The dev server boots on `http://localhost:5173` by default (see `vite.config.ts`).

## Example tree

```json
// Schema definition
{
  id: "root",
  name: "Root",
  type: "text",
  children: [
    {
      id: "child-1",
      name: "Child 1",
      type: "numeric",
      children: [
        {
          id: "child-1-1",
          name: "Child 1-1",
          type: "text",
        }
      ]
    }
  ]
}
```

## Design Considerations

In order to choose the correct implementation of our nested tree, it is important to consider how users will interact with this drag-and-drop schema editor, including what future needs they may have. My assumptions are listed below:

- Insert: users will frequently insert new nodes into the tree
- Update: users will frequently update the node's properties
- Move: users will frequently move leaf nodes and subtrees
- Delete: users will sometimes delete nodes from the tree
- Query: users will most often search for the root node (e.g. I want to edit the blog post schema) and will rarely search for a specific subtree (e.g. I want to edit every schema that has an image field)
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

An additional requirement is that the order of children must be preserved. Fractional keys are the most scalable way to handle this. Again, let's explore the trade-offs of common fractional key implementations:

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

Given all of this, and that we are building a toy example, I have chosen to implement an adjacency list using integer gapped fractional keys. In a mature production instance, one may find that users want to share schema fragments (e.g. reusable schemas like {image, headline, copy}), reference properties from other trees (e.g. company address), or perform complex subtree queries in which case the complexity of a closure table would be justified. Additionally, lexicographic fractional keys would prove more practical in production, but using an existing implementation, as recommended, would defeat the purpose of this toy example.

## Implementation Details