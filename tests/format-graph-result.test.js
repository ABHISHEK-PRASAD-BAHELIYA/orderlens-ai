import test from "node:test";
import assert from "node:assert/strict";
import { formatGraphResult } from "../server.js";

test("formats graph headers and records as named rows", () => {
  const result = [
    [["orderId"], ["status"]],
    [["ORD-1042", "STUCK"], ["ORD-2088", "PAYMENT_FAILED"]],
  ];

  assert.deepEqual(formatGraphResult(result), {
    columns: ["orderId", "status"],
    rows: [
      { orderId: "ORD-1042", status: "STUCK" },
      { orderId: "ORD-2088", status: "PAYMENT_FAILED" },
    ],
  });
});

test("returns an empty result for an empty graph response", () => {
  assert.deepEqual(formatGraphResult([]), { columns: [], rows: [] });
});

test("fills missing record values with null", () => {
  assert.deepEqual(formatGraphResult([[["orderId"], ["incident"]], [["ORD-1042"]]]), {
    columns: ["orderId", "incident"],
    rows: [{ orderId: "ORD-1042", incident: null }],
  });
});
