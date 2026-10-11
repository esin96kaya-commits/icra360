import { describe, expect, it } from "vitest";
import {
  decryptUtf8,
  encryptUtf8,
  generateValidNationalId,
  isValidNationalId,
  maskIban,
  maskNationalId,
  normalizeNationalId,
} from "./index.js";

describe("national id", () => {
  it("accepts algorithmically valid numbers and rejects invalid ones", () => {
    const valid = generateValidNationalId(42);
    expect(valid).toHaveLength(11);
    expect(isValidNationalId(valid)).toBe(true);
    expect(isValidNationalId("12345678901")).toBe(false);
    expect(isValidNationalId("00000000000")).toBe(false);
  });

  it("masks TCKN keeping first three and last two digits", () => {
    const valid = generateValidNationalId(7);
    expect(maskNationalId(valid)).toBe(`${valid.slice(0, 3)}******${valid.slice(9)}`);
    expect(maskNationalId("12")).toBe("***********");
  });

  it("normalizes whitespace", () => {
    expect(normalizeNationalId("123 456 789 01")).toBe("12345678901");
  });
});

describe("iban mask", () => {
  it("keeps country code and last four characters", () => {
    expect(maskIban("TR330006100519786457841326")).toBe("TR33************1326");
  });
});

describe("field encryption", () => {
  it("round-trips utf8 payloads", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const field = encryptUtf8("10000000146");
    expect(decryptUtf8(field)).toBe("10000000146");
    expect(field.nonce).toHaveLength(12);
  });
});
