import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../src/lib/demo-card.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { cardBrand, cardError, formatCard } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
test("Visa and Mastercard recognition, checksum, expiry and CVV", () => {
  const now = new Date(2026, 8, 25);
  assert.equal(cardBrand("4111 1111 1111 1111"), "Visa");
  assert.equal(cardBrand("5555 5555 5555 4444"), "Mastercard");
  assert.equal(cardBrand("2221"), "Mastercard");
  assert.equal(cardBrand("2721"), null);
  assert.equal(formatCard("4111111111111111"), "4111 1111 1111 1111");
  assert.equal(cardError("4111 1111 1111 1111", "09/26", "123", now), "");
  assert.equal(cardError("5555 5555 5555 4444", "12/30", "123", now), "");
  assert.match(cardError("4111111111111112", "12/30", "123", now), /checksum/);
  assert.match(cardError("4111", "12/30", "123", now), /number/);
  assert.match(cardError("4111111111111111", "08/26", "123", now), /expiry/);
  assert.match(cardError("4111111111111111", "13/30", "123", now), /expiry/);
  assert.match(cardError("4111111111111111", "12/30", "12", now), /CVV/);
});
