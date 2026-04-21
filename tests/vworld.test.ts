import { describe, it, expect } from "vitest";
import { isPnu } from "../src/lib/vworld.js";

describe("isPnu", () => {
  it("accepts 19-digit string", () => {
    expect(isPnu("1144012400102290001")).toBe(true);
  });

  it("trims whitespace", () => {
    expect(isPnu("  1144012400102290001  ")).toBe(true);
  });

  it("rejects shorter strings", () => {
    expect(isPnu("123456789012345678")).toBe(false);
  });

  it("rejects longer strings", () => {
    expect(isPnu("11440124001022900012")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isPnu("114401240010229000A")).toBe(false);
    expect(isPnu("경기도 평택시 포승읍 내기리 680")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isPnu("")).toBe(false);
  });
});
