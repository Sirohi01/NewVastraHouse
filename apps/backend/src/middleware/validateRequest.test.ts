import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

test("zod strict schemas reject unknown fields for request validation", () => {
  const schema = z
    .object({
      name: z.string(),
    })
    .strict();

  assert.throws(() => schema.parse({ name: "Brand", isSuperAdmin: true }), /Unrecognized key/);
});
