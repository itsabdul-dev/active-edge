import { test } from "node:test";
import assert from "node:assert/strict";
import { tsImport } from "tsx/esm/api";
const { deliverySchema, emptyDelivery, readDeliveryDraft } = await tsImport(
  "../src/lib/delivery.ts",
  import.meta.url,
);
const { parseAddressSuggestions } = await tsImport(
  "../src/lib/address-suggestions.ts",
  import.meta.url,
);
test("delivery requires a valid address and restores only known draft fields", () => {
  const valid = {
    ...emptyDelivery,
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "Customer",
    address: "1 Demo Street",
    city: "Cape Town",
    postcode: "8000",
    phone: "+27 82 000 0000",
    unit: "Apartment 4",
    deliveryInstructions: "Leave at reception",
  };
  assert.equal(deliverySchema.safeParse(valid).success, true);
  for (const change of [
    { postcode: "800" },
    { email: "wrong" },
    { phone: "hello" },
    { address: " " },
    { deliveryInstructions: "x".repeat(501) },
  ])
    assert.equal(deliverySchema.safeParse({ ...valid, ...change }).success, false);
  assert.deepEqual(readDeliveryDraft("{bad"), emptyDelivery);
  assert.deepEqual(
    readDeliveryDraft(JSON.stringify({ ...valid, cardNumber: "do-not-keep" })),
    valid,
  );
  assert.equal(readDeliveryDraft('{"city":42}').city, "");
});
test("address suggestions reject malformed and non-SA results and tolerate missing postcode", () => {
  assert.deepEqual(parseAddressSuggestions(null), []);
  const suggestions = parseAddressSuggestions({
    results: [
      {
        country_code: "za",
        street: "Demo Street",
        housenumber: "1",
        city: "Cape Town",
        formatted: "1 Demo Street, Cape Town",
      },
      { country_code: "us", street: "Other Street" },
    ],
  });
  assert.deepEqual(suggestions, [
    {
      label: "1 Demo Street, Cape Town",
      address: "1 Demo Street",
      city: "Cape Town",
      suburb: "",
      postcode: "",
    },
  ]);
});
