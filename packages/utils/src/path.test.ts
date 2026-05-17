import { describe, it, expect } from "vitest";
import { normalizePath, isSubPath } from "./path";

describe("normalizePath", () => {
  it("should normalize forward slashes", () => {
    expect(normalizePath("/foo//bar")).toBe("/foo/bar");
  });

  it("should convert backslashes to forward slashes", () => {
    expect(normalizePath("C:\\foo\\bar")).toBe("C:/foo/bar");
  });

  it("should resolve relative segments", () => {
    expect(normalizePath("/foo/../bar")).toBe("/bar");
    expect(normalizePath("/foo/./bar")).toBe("/foo/bar");
  });

  it("should handle empty paths", () => {
    expect(normalizePath("")).toBe(".");
  });
});

describe("isSubPath", () => {
  it("should return true for direct subpath", () => {
    expect(isSubPath("/foo", "/foo/bar")).toBe(true);
  });

  it("should return true for nested subpath", () => {
    expect(isSubPath("/foo", "/foo/bar/baz")).toBe(true);
  });

  it("should return false for non-subpath", () => {
    expect(isSubPath("/foo", "/bar")).toBe(false);
  });

  it("should return false for same path", () => {
    expect(isSubPath("/foo", "/foo")).toBe(false);
  });

  it("should return false for parent path", () => {
    expect(isSubPath("/foo/bar", "/foo")).toBe(false);
  });
});
