import { describe, expect, it } from "vitest";
import { HIDDEN_FLAG, wasStartedHidden } from "@shared/launch-args";

describe("launch args", () => {
  it("detects the start with Windows", () => {
    expect(wasStartedHidden(["otto.exe", HIDDEN_FLAG])).toBe(true);
    expect(wasStartedHidden(["otto.exe"])).toBe(false);
  });
});
