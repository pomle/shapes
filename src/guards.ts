export function isIterable(value: any): value is Iterable<unknown> {
  return value != null && typeof value === "object" && Symbol.iterator in value;
}
