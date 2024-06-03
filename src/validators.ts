import { isIterable } from "./guards";

type Validator<T> = (value: unknown) => T;

type ValidationSpec<Entries extends Record<string, unknown>> = {
  [Name in keyof Entries]: Validator<Entries[Name]>;
};

export function record<T extends Record<string, unknown>>(
  spec: ValidationSpec<T>,
): Validator<T> {
  return function validate(maybeValues: unknown): T {
    const source = (typeof maybeValues === "object"
      ? { ...maybeValues }
      : {}) as Partial<T>;

    const output: Record<string, unknown> = {};
    for (const name of Object.keys(spec)) {
      const validate = spec[name];
      output[name] = validate(source[name]);
    }

    return output as T;
  };
}

export function either<T>(valid: { 0: T } & readonly T[]): Validator<T> {
  const validEntries = new Set<T>(valid);
  const initial = valid[0];

  return function validate(value: unknown) {
    if (validEntries.has(value as T)) {
      return value as T;
    }

    return initial;
  };
}

export function string<T extends string | undefined>(initial: T) {
  return function validate(value: unknown) {
    if (typeof value === "string") {
      return value as string;
    }

    return initial;
  };
}

export function number<T extends number | undefined>(initial: T) {
  return function validate(value: unknown) {
    if (typeof value === "number") {
      return value as number;
    }

    return initial;
  };
}

export function maybe<T>(
  validate: (value: unknown) => T,
): Validator<T | undefined> {
  return function proxyMaybe(value: unknown) {
    if (value == null) {
      return undefined;
    }
    return validate(value);
  };
}

export function listOf<T>(cast: (value: unknown) => T) {
  return function toList(value: unknown) {
    if (value instanceof Set) {
      return Array.from(value).map(cast);
    }
    if (Array.isArray(value)) {
      return value.map(cast);
    }
    return [];
  };
}

export function setOf<T>(cast: (value: unknown) => T | undefined) {
  return function toSet(value: unknown) {
    const values = new Set<T>();
    if (isIterable(value)) {
      for (const v of value) {
        const casted = cast(v);
        if (casted !== undefined) {
          values.add(casted);
        }
      }
    }
    return values;
  };
}

export function always<T>(value: T) {
  return function toValue(_: unknown) {
    return value;
  };
}
