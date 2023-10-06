export function isIterable(value: any): value is Iterable<unknown> {
  return typeof value === "object" && Symbol.iterator in value;
}
