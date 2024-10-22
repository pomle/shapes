import {
  record,
  number,
  either,
  string,
  listOf,
  setOf,
  maybe,
} from "../validators";

describe("Validation", () => {
  describe("#record", () => {
    it("returns a validation function", () => {
      const validate = record({
        foo: () => 1,
      });

      expect(validate).toBeInstanceOf(Function);
    });

    it("works well with a defined type structure", () => {
      type Union = "a" | "b" | "c";

      type Struct = {
        optionalEither?: Union;
        requiredEitherAll: Union;
        requiredEitherSome: Union;
        optionalString?: string;
        requiredString: string;
        optionalNumber?: number;
        requiredNumber: number;
      };

      const validate = record<Struct>({
        optionalEither: either([undefined]),
        requiredEitherAll: either(["a", "b", "c"]),
        requiredEitherSome: either(["c"]),
        optionalString: string(undefined),
        requiredString: string("ABCD"),
        optionalNumber: number(undefined),
        requiredNumber: number(12345),
      });

      expect(validate({})).toEqual({
        optionalEither: undefined,
        optionalNumber: undefined,
        optionalString: undefined,
        requiredEitherAll: "a",
        requiredEitherSome: "c",
        requiredNumber: 12345,
        requiredString: "ABCD",
      });
    });

    it("supports nesting", () => {
      type A = {
        a: number;
        b: string;
      };

      type B = {
        c: number;
        d: string;
      };

      const validateA = record<A>({
        a: number(1),
        b: string("A"),
      });

      const validateB = record<B>({
        c: number(2),
        d: string("B"),
      });

      const validate = record({
        a: validateA,
        b: validateB,
      });

      expect(
        validate({
          a: { a: 1000 },
          b: { d: "Q" },
        }),
      ).toEqual({
        a: {
          a: 1000,
          b: "A",
        },
        b: {
          c: 2,
          d: "Q",
        },
      });
    });

    it("is capable of type inference", () => {
      record({
        a: number(1),
        b: string("A"),
        c: either([1, "a"]),
      });
    });

    it("gracefully handles bad input", () => {
      const validate = record({
        a: number(1),
        b: string("A"),
      });

      expect(validate(undefined)).toEqual({
        a: 1,
        b: "A",
      });

      expect(validate(null)).toEqual({
        a: 1,
        b: "A",
      });

      expect(validate([])).toEqual({
        a: 1,
        b: "A",
      });

      expect(validate("")).toEqual({
        a: 1,
        b: "A",
      });

      expect(validate(2124)).toEqual({
        a: 1,
        b: "A",
      });

      expect(validate(NaN)).toEqual({
        a: 1,
        b: "A",
      });
    });

    it("ignores values not in spec", () => {
      const validate = record({
        foo: () => 1,
      });

      expect(validate({ bar: 2 })).toEqual({ foo: 1 });
    });
  });

  describe("#either", () => {
    it("allows a valid value", () => {
      const validate = record({
        foo: either([3, 2]),
      });

      expect(validate({ foo: 2 })).toEqual({ foo: 2 });
    });

    it("uses default for invalid value", () => {
      const validate = record({
        foo: either([3, 2]),
      });

      expect(validate({ foo: 1 })).toEqual({ foo: 3 });
    });

    it("uses default when there is no value", () => {
      const validate = record({
        foo: either([3, 2]),
      });

      expect(validate({})).toEqual({ foo: 3 });
    });

    it("allows undefined as default", () => {
      const validate = record({
        foo: either([undefined, 3, 2]),
      });

      expect(validate({ foo: 10 })).toEqual({ foo: undefined });
    });
  });

  describe("#string", () => {
    it("allows a string", () => {
      const validate = record({
        foo: string(undefined),
      });

      expect(validate({ foo: "a string" })).toEqual({ foo: "a string" });
    });

    it("returns default if not a string", () => {
      const validate = record({
        foo: string("default text"),
      });

      expect(validate({})).toEqual({ foo: "default text" });
      expect(validate({ foo: 2 })).toEqual({ foo: "default text" });
      expect(validate({ foo: true })).toEqual({ foo: "default text" });
    });
  });

  describe("#number", () => {
    it("allows a number", () => {
      const validate = record({
        foo: number(undefined),
      });

      expect(validate({ foo: 124124.222 })).toEqual({ foo: 124124.222 });
    });

    it("returns default if not a number", () => {
      const validate = record({
        foo: number(13382),
      });

      expect(validate({})).toEqual({ foo: 13382 });
      expect(validate({ foo: "133384" })).toEqual({ foo: 13382 });
      expect(validate({ foo: true })).toEqual({ foo: 13382 });
    });
  });

  describe("#listOf", () => {
    it("allows a string", () => {
      const validate = listOf(string(""));

      expect(validate([1, 3, "b", {}])).toEqual(["", "", "b", ""]);
    });

    it("allows a number", () => {
      const validate = listOf(number(0));

      expect(validate([1, 2, 3, "b", {}])).toEqual([1, 2, 3, 0, 0]);
    });

    it("handles undefined default", () => {
      const validate = listOf(number(undefined));

      expect(validate([1, 2, 3, "b", {}])).toEqual([
        1,
        2,
        3,
        undefined,
        undefined,
      ]);
    });

    it("handles Set", () => {
      const validate = listOf(number(undefined));

      expect(validate(new Set([1, 2, 3]))).toEqual([1, 2, 3]);
    });

    it("always returns lists", () => {
      const validate = listOf(number(undefined));

      expect(validate("")).toEqual([]);
      expect(validate({})).toEqual([]);
      expect(validate(9)).toEqual([]);
    });
  });

  describe("#setOf", () => {
    it("works with either using undefined", () => {
      const validate = setOf(either([undefined, "a", "b", "c"] as const));

      expect(validate([1, 3, "b", {}])).toEqual(new Set(["b"]));
    });

    it("works with string", () => {
      const validate = setOf(string("default"));

      expect(validate([1, 3, "b", {}])).toEqual(new Set(["b", "default"]));
    });

    it("drops if undefined as default", () => {
      const validate = setOf(number(undefined));

      expect(validate([1, 2, 3, "b", {}])).toEqual(new Set([1, 2, 3]));
    });

    it("keeps default if not undefined", () => {
      const validate = setOf(number(NaN));

      expect(validate([1, 2, 3, "b", {}])).toEqual(new Set([1, 2, 3, NaN]));
    });

    it("always returns sets", () => {
      const validate = setOf(number(0));

      expect(validate("")).toEqual(new Set());
      expect(validate({})).toEqual(new Set());
      expect(validate(9)).toEqual(new Set());
    });
  });

  describe("#maybe", () => {
    it("returns undefined if input null", () => {
      expect(maybe(string("foo"))(null)).toBe(undefined);
      expect(maybe(number(2))(null)).toBe(undefined);
      expect(maybe(listOf(string("foo")))(null)).toBe(undefined);
      expect(maybe(setOf(string("foo")))(null)).toBe(undefined);
    });

    it("returns undefined if input undefined", () => {
      expect(maybe(string("foo"))(undefined)).toBe(undefined);
      expect(maybe(number(2))(undefined)).toBe(undefined);
      expect(maybe(listOf(string("foo")))(undefined)).toBe(undefined);
      expect(maybe(setOf(string("foo")))(undefined)).toBe(undefined);
    });

    it("returns wrapped value undefined if input something", () => {
      expect(maybe(string("foo"))("bar")).toBe("bar");
      expect(maybe(string("foo"))(2)).toBe("foo");
      expect(maybe(number(2))(3)).toBe(3);
      expect(maybe(listOf(string("foo")))(["a", "b"])).toEqual(["a", "b"]);
      expect(maybe(setOf(string("foo")))(["a", "b"])).toEqual(
        new Set(["a", "b"]),
      );
    });
  });
});
