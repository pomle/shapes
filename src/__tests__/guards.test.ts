import { isIterable } from "../guards";

describe("Guards", () => {
  describe("#record", () => {
    it("returns true on array", () => {
      expect(isIterable([])).toBe(true);
    });

    it("returns true on set", () => {
      expect(isIterable(new Set())).toBe(true);
    });

    it("returns false on null", () => {
      expect(isIterable(null)).toBe(false);
    });

    it("returns false on undefined", () => {
      expect(isIterable(undefined)).toBe(false);
    });

    it("returns false on object", () => {
      expect(isIterable({})).toBe(false);
    });

    it("returns false on string", () => {
      expect(isIterable("")).toBe(false);
    });

    it("returns false on number", () => {
      expect(isIterable(124)).toBe(false);
    });

    it("returns false on boolean", () => {
      expect(isIterable(true)).toBe(false);
    });
  });
});
