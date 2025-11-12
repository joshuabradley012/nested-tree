import { describe, expect, it } from "vitest";

import {
  deserializeTreeState,
  type SerializedTree,
} from "@adapters/serialize-json";
import type { TreeState } from "@core";

describe("deserializeTreeState", () => {
  it("returns a TreeState for a valid payload", () => {
    const state: TreeState = {
      rootId: "root",
      nodesById: {
        root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        parent: { id: "parent", name: "Parent", parentId: "root", orderKey: "0" },
        childA: { id: "childA", name: "Child A", parentId: "parent", orderKey: "0" },
        childB: { id: "childB", name: "Child B", parentId: "parent", orderKey: "10" },
      },
      childrenById: {
        root: ["parent"],
        parent: ["childA", "childB"],
      },
    };

    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify(state),
    };

    const result = deserializeTreeState(payload);
    expect(result).toEqual(state);
  });

  it("throws when nodesById is missing required node fields", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
          child: { id: "child", name: "Child", parentId: "root" }, // missing orderKey
        },
        childrenById: {
          root: ["child"],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /node "child" is missing required property "orderKey"/,
    );
  });

  it("throws when children arrays contain duplicate ids", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
          child: { id: "child", name: "Child", parentId: "root", orderKey: "0" },
        },
        childrenById: {
          root: ["child", "child"],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /parent "root" lists duplicate child id "child"/,
    );
  });

  it("throws when sibling order keys are not strictly increasing", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
          childA: { id: "childA", name: "Child A", parentId: "root", orderKey: "0" },
          childB: { id: "childB", name: "Child B", parentId: "root", orderKey: "0" },
        },
        childrenById: {
          root: ["childA", "childB"],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /InvalidOrderSequence for parent "root"/,
    );
  });

  it("throws when a nodesById key does not match the nested node id", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
          "node-key": { id: "different-id", name: "Mismatch", parentId: "root", orderKey: "0" },
        },
        childrenById: {
          root: ["node-key"],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /nodesById key "node-key" does not match nested node id "different-id"/,
    );
  });

  it("throws when childrenById references a parent that does not exist", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        },
        childrenById: {
          root: ["child"],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /child id "child" under parent "root" has no matching node/,
    );
  });

  it("throws when a child is listed under the wrong parent", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
          parentA: { id: "parentA", name: "Parent A", parentId: "root", orderKey: "0" },
          parentB: { id: "parentB", name: "Parent B", parentId: "root", orderKey: "10" },
          child: { id: "child", name: "Child", parentId: "parentB", orderKey: "0" },
        },
        childrenById: {
          root: ["parentA", "parentB"],
          parentA: ["child"],
          parentB: [],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /node "child" is not listed under its parent "parentB" in childrenById/,
    );
  });

  it("throws when the root node is missing from nodesById", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {},
        childrenById: {},
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /rootId "root" is not present in nodesById/,
    );
  });

  it("throws when the root node has a non-null parentId", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: "parent", orderKey: "0" },
        },
        childrenById: {
          root: [],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /root node "root" must have parentId null/,
    );
  });

  it("throws when children arrays contain non-string values", () => {
    const payload: SerializedTree = {
      version: 1,
      tree: JSON.stringify({
        rootId: "root",
        nodesById: {
          root: { id: "root", name: "Root", parentId: null, orderKey: "0" },
        },
        childrenById: {
          root: [42],
        },
      }),
    };

    expect(() => deserializeTreeState(payload)).toThrowError(
      /children array for parent "root" contains a value that is not a non-empty string id/,
    );
  });
});

