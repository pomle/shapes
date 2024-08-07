# Shapes

Library for building validation functions to protect against runtime type errors. Applicable for when you unserialize data which has lost its TypeScript contract, for example user settings stored in LocalStorage or documents from NoSQL storage.

```ts
type Prefs = {
  language: 'english' | 'spanish';
  itemsPerPage: number;
};

function getData() {
  try {
    const serializedData = window.localStorage.getItem('user-prefs');

    // Always wrap JSON.parse in try/catch
    return JSON.parse(serializedData);
  } catch (error) {
    return undefined;
  }
}

const unsafe = getData() as Prefs;
// Accessing `unsafe.language` may crash application despite behaving like it is typed.

const validate = record<Prefs>({
  language: either(['english', 'spanish']),
  itemsPerPage: number(10),
});

// Will ensure that `safe` is compatible with `Prefs` type.
const safe = validate(unsafe);
// Accessing `unsafe.language` will be guaranteed to be "english" or "spanish".
```

This lib is not recommended for user input validation where the user may need feedback on poorly formed data.

## Usage

A basic example of a typed insurance pattern.

```ts
import { record, number, string } from '@pomle/shapes';

type Union = 'a' | 'b' | 'c';

type Shape = {
  optionalEither?: Union;
  requiredEitherAll: Union;
  requiredEitherSome: Union;
  optionalString?: string;
  requiredString: string;
  optionalNumber?: number;
  requiredNumber: number;
};

const validate = record<Shape>({
  optionalEither: either([undefined]),
  requiredEitherAll: either(['a', 'b', 'c']),
  requiredEitherSome: either(['c']),
  optionalString: string(undefined),
  requiredString: string('ABCD'),
  optionalNumber: number(undefined),
  requiredNumber: number(12345),
});
```

Nested example.

```ts
import { record, number, string } from '@pomle/shapes';

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
  b: string('A'),
});

const validateB = record<B>({
  c: number(2),
  d: string('B'),
});

const validate = record({
  a: validateA,
  b: validateB,
});
```

Types will be inferred if unspecifed. Some types, like unions, may not behave like you expect unless explicitly defined.

```ts
import { record, number, string } from '@pomle/shapes';

const validate = record({
  a: number(1),
  b: string('A'),
});

const data = validate({});
```

By validating an empty object you create the default values.

```ts
import { record, number, string } from '@pomle/shapes';

type TimeFormat = 'HH:mm' | 'hh:mm A';

const validate = record({
  searchHistoryLength: number(100),
  timeFormat: either<TimeFormat>(['HH:mm', 'hh:mm A']),
});

const DEFAULT_VALUES = validate({});
```

In most cases you will always pass your data thru the validator function and implicitly get defaults.

```ts
import { record, number, string } from "@pomle/shapes";

type TimeFormat = "HH:mm" | "hh:mm A";

const validate = record({
  searchHistoryLength: number(100),
  timeFormat: either<TimeFormat>(["HH:mm", "hh:mm A"]),
});

function readPrefs() {
    try {
        const serializedData = window.localStorage.getItem("prefs"):
        return JSON.parse(serializedData);
    } catch (error) {
        console.error("Pref parsing failed", error);
        return null;
    }
}

export function getDevicePreferences() {
    const prefs = readPrefs();
    return validate(prefs);
}
```

### Value types

- Number

  The number validator will only let numbers pass thru.
  No type casting will be attempted.
  Allows default to be `undefined`.

  ```ts
  const validate = record({
    size: number(1),
  });

  validate({ size: 'foo' }); // Returns {size: 1}
  validate({ size: '5' }); // Returns {size: 1}
  validate({ size: 20 }); // Returns {size: 20}
  ```

- String

  The string validator will only let strings pass thru.
  No type casting will be attempted.
  Allows default to be `undefined`.

  ```ts
  const validate = record({
    defaultId: string(undefined),
  });

  validate({ defaultId: 'v8aewbng39' }); // Returns {defaultId: "v8aewbng39"}
  validate({ defaultId: '5' }); // Returns {defaultId: "5"}
  validate({ defaultId: 1234 }); // Returns {defaultId: undefined}
  ```

- Either (one of)

  The either validator will only let values that exist in a set thru.
  No type casting will be attempted.
  Default value will be the value on index 0 of the array of allowed values supplied.
  Allows default to be `undefined`.

  ```ts
  const validate = record({
    language: either(['english', 'spanish']),
  });

  validate({ language: 'spanish' }); // Returns {language: "spanish"}
  validate({ language: 'italian' }); // Returns {language: "english"}
  validate({ language: false }); // Returns {language: "english"}
  ```

- List (Array)

  Takes a validator and enforces the value to be an array of validator type.

  ```ts
  const validate = record({
    scores: listOf(number),
  });

  validate({ scores: ['1', 2] }); // Returns {scores: [2]}
  validate({ scores: 'italian' }); // Returns {scores: []}
  validate({ scores: false }); // Returns {scores: []}
  ```

- setOf (Set)

  Takes a validator and coerces the value into a set of the validator type. If the validator produces undefined it will not include undefined in the set.

  ```ts
  const validate = record({
    tags: setOf(either([undefined, "nice", "fast"])),
  });

  validate({ tags: ['nice', 'fast', 'colorful', 'colorful'] }); // Returns {tags: new Set(["nice", "fast"])}
  ```

### Custom validators

The only contract for a validator function is that it takes an unknown type, and returns a known type. It should fulfill the [TypeScript Guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) pattern.

```ts
type ValidationEntry<T> = (value: unknown) => T;
```

Basic example.

```ts
function min16Len(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length > 15) {
      return value;
    }
  }
  return undefined;
}
```

Validators that require a state can be created using a higher-order function. This is useful when a default should be provided or its implementation characteristics should be configurable.

```ts
function minLen(min: number, fallback: string) {
  return function validate(value: unknown): string {
    if (typeof value === 'string') {
      if (value.length > min) {
        return value;
      }
    }
    return fallback;
  };
}

const validator = record({
  defaultId: minLen(16, 'abcdefghijklmnopqrstuvwxyz'),
});
```

### Elaborate example

```ts
import {
  record,
  either,
  number,
  string,
  maybe,
  listOf,
} from "@pomle/shapes";

const coords = record({
  longitude: number(NaN),
  latitude: number(NaN),
});

const location = record({
  coords: maybe(coords),
});

const name = record({
  first: string(""),
  last: string(""),
});

const street = record({
  name: string(""),
  houseNo: string(""),
  aptNo: string(""),
});

const address = record({
  name,
  street,
  postcode: string(""),
  city: string(""),
});

const customer = record({
  type: either(["private", "business"] as const),
  name,
  addresses: listOf(address),
  location,
})

const validate = {
  name,
  street,
  address,
  location,
  customer
};

export { validate };
```
