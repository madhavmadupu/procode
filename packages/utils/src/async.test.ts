import { describe, it, expect, vi } from "vitest";
import { debounce, throttle } from "./async";

describe("debounce", () => {
  it("should delay function execution", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should reset timer on subsequent calls", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(fn).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to the debounced function", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced("arg1", "arg2");

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });
});

describe("throttle", () => {
  it("should execute immediately on first call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should ignore calls within throttle period", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should allow calls after throttle period", async () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    await new Promise(resolve => setTimeout(resolve, 150));
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
