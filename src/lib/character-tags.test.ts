import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDisplayTags } from "./character-tags.js";

describe("getDisplayTags", () => {
  it("keeps localized tag text and removes invalid values", () => {
    assert.deepEqual(getDisplayTags(["علم", " آموزشی ", "", 42]), ["علم", "آموزشی"]);
  });

  it("deduplicates tags, caps them at four, and tolerates historical values", () => {
    assert.deepEqual(getDisplayTags(["a", "a", "b", "c", "d", "e"]), ["a", "b", "c", "d"]);
    assert.deepEqual(getDisplayTags(undefined), []);
    assert.deepEqual(getDisplayTags("mentor"), []);
  });
});
