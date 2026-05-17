import { describe, it, expect } from "vitest";
import { Ok, Err } from "./result";

describe("Result", () => {
  it("should create an Ok result", () => {
    const result = Ok(42);

    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
  });

  it("should create an Err result", () => {
    const error = new Error("Something went wrong");
    const result = Err(error);

    expect(result.ok).toBe(false);
    expect(result.error).toBe(error);
  });

  it("should handle string errors", () => {
    const result = Err("string error");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("string error");
  });

  it("should handle complex values", () => {
    const value = { id: 1, name: "test", tags: ["a", "b"] };
    const result = Ok(value);

    expect(result.ok).toBe(true);
    expect(result.value).toEqual(value);
  });
});
