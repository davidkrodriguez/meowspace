import { describe, expect, it } from "vitest";
import { APP_NAME } from "./app";

describe("APP_NAME", () => {
  it("exports the expected app name", () => {
    expect(APP_NAME).toBe("meowspace");
  });
});
