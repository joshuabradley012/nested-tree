## Plan Review
- Representations/trade-offs are sound; clarify that adjacency-list subtree queries are linear in subtree size and fractional keys eventually need compaction.
- Data model should explicitly maintain `nodesById` alongside `childrenById`, and fractional indexing strategy (lexicographic strings or rationals) must be defined up front.
- Undo/redo plan benefits from picking a diff/patch format (immer patches or custom) and deciding snapshot granularity.
- Testing plan should add schema validation cases and clarify property-test tooling (e.g., fast-check).
- README outline needs explicit setup/test commands and to reference files by absolute path.

## Updated Plan
- **Project setup**: Initialize repo at `/home/josh/Code/nested-tree`; configure TypeScript, eslint, vitest, React (Vite or Next w/ async params rule in mind for future UI work); document scripts.
- **Core types & state**: Define `Node`, `TreeState`, order key type, and invariant error enums in `/home/josh/Code/nested-tree/src/core/types.ts`; model helpers in `/home/josh/Code/nested-tree/src/core/model.ts` managing `nodesById`, `childrenById`, and root constraints.
- **Ordering strategy**: Implement fractional/lexicographic keys (e.g., base-62 strings) with periodic compaction spec in `/home/josh/Code/nested-tree/src/core/model.ts`; document key-generation complexity.
- **Pure operations**: Build `insertNode`, `moveNode`, `deleteNode`, `updateNode`, `reorderSibling` as pure functions in `/home/josh/Code/nested-tree/src/core/ops.ts`, each returning new state and validation errors; add helper to compute subtree deletions efficiently.
- **Invariants**: Implement cycle detection, orphan checks, schema rules in `/home/josh/Code/nested-tree/src/core/invariants.ts`; integrate guard layer so ops fail fast with typed errors.
- **Public API**: Re-export cohesive surface in `/home/josh/Code/nested-tree/src/core/index.ts`; include tree initialization utilities.
- **Undo/redo**: Create persistent history stack using Immer patches or structural sharing in `/home/josh/Code/nested-tree/src/store/history.ts`; define action types and replay helpers.
- **Serialization**: Implement JSON round-trip in `/home/josh/Code/nested-tree/src/adapters/serialize-json.ts`; scaffold MDX export in `/home/josh/Code/nested-tree/src/adapters/serialize-mdx.ts`; stub Yjs adapter with interface and TODOs in `/home/josh/Code/nested-tree/src/adapters/yjs.ts`.
- **UI demo**: Build minimal React tree inspector under `/home/josh/Code/nested-tree/src/ui/` (`App.tsx`, `Tree.tsx`, `NodeRow.tsx`) using drag-and-drop (e.g., dnd-kit), live invariants display, and undo/redo controls.
- **Testing**: Author unit specs in `/home/josh/Code/nested-tree/src/tests/ops.spec.ts` and `/home/josh/Code/nested-tree/src/tests/invariants.spec.ts`; add property-based tests with fast-check in `/home/josh/Code/nested-tree/src/tests/property.spec.ts`; include performance sanity benchmark (10k ops) and schema-validation cases.
- **Documentation**: Draft README at `/home/josh/Code/nested-tree/README.md` covering overview, architecture choices, complexity table, API snippets, testing commands, and roadmap (multiplayer, AST zipper, codegen).
- **Stretch goals**: Outline Yjs integration approach, AST zipper utilities, and schema-driven generators without implementation promises; note potential Next.js adapter respecting async `params`.

Let me know when you want to start executing the plan.