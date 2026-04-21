import { describe, it, expect } from "vitest";
import { parseJibun } from "../src/lib/jimok.js";

describe("parseJibun", () => {
  it("parses plain jibun without suffix", () => {
    const r = parseJibun("229-1");
    expect(r.is_mountain).toBe(false);
    expect(r.number_part).toBe("229-1");
    expect(r.jimok_code).toBeNull();
    expect(r.jimok_full_name).toBeNull();
  });

  it("parses jibun with jimok suffix", () => {
    const r = parseJibun("229-1대");
    expect(r.number_part).toBe("229-1");
    expect(r.jimok_code).toBe("대");
    expect(r.jimok_full_name).toBe("대");
  });

  it("maps 장 → 공장용지", () => {
    const r = parseJibun("680장");
    expect(r.jimok_code).toBe("장");
    expect(r.jimok_full_name).toBe("공장용지");
  });

  it("detects 산 prefix (산번지)", () => {
    const r = parseJibun("산 45-2임");
    expect(r.is_mountain).toBe(true);
    expect(r.jimok_code).toBe("임");
    expect(r.jimok_full_name).toBe("임야");
  });

  it("returns null jimok for unknown single-char suffix", () => {
    const r = parseJibun("100-1ⓩ");
    expect(r.jimok_code).toBeNull();
  });

  it("handles null / undefined / empty input", () => {
    expect(parseJibun(null).number_part).toBeNull();
    expect(parseJibun(undefined).number_part).toBeNull();
    expect(parseJibun("").number_part).toBeNull();
  });

  it("strips whitespace", () => {
    const r = parseJibun("  42-7 답  ");
    expect(r.number_part).toBe("42-7");
    expect(r.jimok_code).toBe("답");
  });

  it("covers all 28 jimok codes", () => {
    const codes = [
      ["전", "전"],
      ["답", "답"],
      ["과", "과수원"],
      ["목", "목장용지"],
      ["임", "임야"],
      ["광", "광천지"],
      ["염", "염전"],
      ["대", "대"],
      ["장", "공장용지"],
      ["학", "학교용지"],
      ["차", "주차장"],
      ["주", "주유소용지"],
      ["창", "창고용지"],
      ["도", "도로"],
      ["철", "철도용지"],
      ["제", "제방"],
      ["천", "하천"],
      ["구", "구거"],
      ["유", "유지"],
      ["양", "양어장"],
      ["수", "수도용지"],
      ["공", "공원"],
      ["체", "체육용지"],
      ["원", "유원지"],
      ["종", "종교용지"],
      ["사", "사적지"],
      ["묘", "묘지"],
      ["잡", "잡종지"],
    ];
    for (const [code, name] of codes) {
      const r = parseJibun(`1-1${code}`);
      expect(r.jimok_code, `code=${code}`).toBe(code);
      expect(r.jimok_full_name, `code=${code}`).toBe(name);
    }
  });
});
