import assert from "node:assert/strict";
import { winningOption } from "./poll_service.ts";

assert.equal(winningOption({ "ship it": 3, "fix it": 5 }), "fix it");
assert.equal(winningOption({ "a": 2, "b": 2 }), "a");
assert.equal(winningOption({}), null);
console.log("poll decision tests passed");
