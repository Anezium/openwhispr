const test = require("node:test");
const assert = require("node:assert/strict");

const { appendKeyterms, buildKeyterms } = require("../../src/helpers/elevenLabs");

test("buildKeyterms keeps valid ElevenLabs keyterms and de-duplicates them", () => {
  assert.deepEqual(
    buildKeyterms([
      " Rokid ",
      "rokid",
      "Rokid   Glasses",
      "YodaOS",
      "one two three four five six",
      "<invalid>",
      "x".repeat(50),
      "",
      null,
    ]),
    ["Rokid", "Rokid Glasses", "YodaOS"]
  );
});

test("buildKeyterms caps dictionary terms at the billing-safe limit", () => {
  const words = Array.from({ length: 150 }, (_, index) => `Term ${index}`);
  const keyterms = buildKeyterms(words);

  assert.equal(keyterms.length, 100);
  assert.equal(keyterms[0], "Term 0");
  assert.equal(keyterms[99], "Term 99");
});

test("appendKeyterms sends repeated multipart keyterms fields", () => {
  const formData = new FormData();

  appendKeyterms(formData, ["Rokid", "Rokid Glasses"]);

  assert.deepEqual(formData.getAll("keyterms"), ["Rokid", "Rokid Glasses"]);
});
